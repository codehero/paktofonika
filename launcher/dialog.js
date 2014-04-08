//Open up a command prompt and navigate to the folder containing this code.
//Execute the following: wscript //e:jscript dialog.js
//Click the 'Start' button will pop a notepad window; click the stop button will close it.
var paktofonika = new function () {
    
    var ie = new ActiveXObject("InternetExplorer.Application");
    var procId = "";

    //show the dialog and wait for a button click
    this.showDialog = function () {

        var wshShell = new ActiveXObject("WScript.Shell");
        var fileSystem = new ActiveXObject("Scripting.FileSystemObject");    
        var doc = fileSystem.GetFile("dialog.html");

        //setup the browser object
        ie.Height = 310;
        ie.Width = 400;
        ie.MenuBar = 0;
        ie.ToolBar = 0;
        ie.StatusBar = 0;
        ie.navigate(doc);
        ie.Visible = 1;
        waitForInput();
    };
    
    var waitForInput = function () {  

        try
        {
            //loop until we get an action from the browser
            while (ie.Document.all.action.value == "")
                WScript.Sleep(250);

            var action = ie.Document.all.action.value;
            ie.Document.all.action.value = "";
            handleAction(action);

        } catch (ex) {
            //window has probably been closed
            handleAction('stop');
            handleAction('exit');
        }

    };

    var handleAction = function (action) {
        
        switch (action) {
            case 'exit':

                try { ie.Quit(); } catch (ex) {/*do nothing; chances are the window is already gone.*/ }
                WScript.Quit();
                break;

            case 'stop':
                if (procId != 0) {
                    var wmiService = GetObject("winmgmts:\\\\.\\root\\cimv2");
                    var processes = wmiService.ExecQuery("Select * FROM Win32_Process Where ProcessId=" + procId);
                    if (processes.Count == 1)
                        processes.ItemIndex(0).Terminate();
                    procId = 0;
                }
                break;

            case 'start':

                //start the process
                var wmiService = GetObject("winmgmts:\\\\.\\root\\cimv2:Win32_Process");
                var method = wmiService.Methods_.Item("Create");
                var inParams = method.InParameters.SpawnInstance_();
                inParams.CommandLine = "notepad.exe";
                inParams.CurrentDirectory = null;
                inParams.ProcessStartupInformation = null;
                var outParams = wmiService.ExecMethod_(method.Name, inParams);
                if (outParams.ReturnValue == 0)
                    procId = outParams.ProcessId;

                //todo:
                //add a monitor to make sure the user does not stop the process by killing it;
                //restart it if this is the case
                break
        }

        if (action != 'exit')
            waitForInput();
    };
}

paktofonika.showDialog();