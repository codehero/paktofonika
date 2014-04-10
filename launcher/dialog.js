//Open up a command prompt and navigate to the folder containing this code.
//Execute the following: wscript //e:jscript dialog.js
//Click the 'Start' button will pop a notepad window; click the stop button will close it.
var paktofonika = paktofonika = paktofonika || {};

paktofonika.console = new function () {

    //IE Object Model: http://msdn.microsoft.com/en-us/library/aa752084(v=vs.85).aspx
    var ie = new ActiveXObject("InternetExplorer.Application");
    var wshShell = new ActiveXObject("WScript.Shell");
    var procId = "";

    var CONFIG_FILE = "dialog.json";

    //show the dialog and wait for a button click
    this.showDialog = function () {

        var fileSystem = new ActiveXObject("Scripting.FileSystemObject");    
        var file = fileSystem.GetFile("dialog.html");

        //setup the browser object
        ie.AddressBar = false;
        ie.Resizable = false;
        ie.Height = 310;
        ie.Width = 400;
        ie.MenuBar = false;
        ie.ToolBar = false;
        ie.StatusBar = false;
        ie.navigate(file);
        ie.Visible = true;
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
            handleAction('exit');
            WScript.Quit();
        }

    };

    var stopProcesses = function () {
        if (procId != 0) {
            var wmiService = GetObject("winmgmts:\\\\.\\root\\cimv2");
            var processes = wmiService.ExecQuery("Select * FROM Win32_Process Where ProcessId=" + procId);
            if (processes.Count == 1)
                processes.ItemIndex(0).Terminate();
            procId = 0;
        }
    };

    var handleAction = function (action) {
        
        switch (action) {
            case 'exit':

                try { 
                    stopProcesses();    
                    ie.Quit(); 
                } catch (ex) {/*do nothing; chances are the window is already gone.*/ }
                WScript.Quit();
                break;

            case 'stop':
                stopProcesses();
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

            case 'get-config':
                ie.Document.all.actionParameter.value = loadConfig();
                ie.navigate("javascript:paktofonika.gui.showStatus();");
                break;

            case 'save-config':
                saveConfig(ie.Document.all.actionParameter.value);
                ie.navigate("javascript:paktofonika.gui.showStatus();");
                
        }

        if (action != 'exit')
            waitForInput();
    };

    var loadConfig = function () {
        try {
            var config = [];
            var fileSystem = new ActiveXObject("Scripting.FileSystemObject");
            if (fileSystem.FileExists(CONFIG_FILE)) {
                var file = fileSystem.OpenTextFile(CONFIG_FILE, 1);
                config = JSON.parse(file.ReadAll());
            } else {
                config.push(new instance("Instance 1", 7000));
            }

            return JSON.stringify(config);

        } catch (ex) {
            handleError(ex);
        }
    };

    var saveConfig = function (json) {
        try {
            var fileSystem = new ActiveXObject("Scripting.FileSystemObject");
            var file = fileSystem.OpenTextFile(CONFIG_FILE, 2, true);
            file.Write(json)
            file.Close()
            ie.Document.all.actionParameter.value = "";
        } catch (ex) {
            handleError(ex);
        }
    }

    var handleError = function (ex) {
        if (ex != null)
            wshShell.Popup("[Error #" + ex.number + "]:" + ex.message, 0, "An Error Occured", 48);
    }

    function instance(name, port) {
        this.name = name;
        this.port = port;
        this.processId = null;
    }
}

/********************/
/**  JSON SUPPORT   */
/********************/
var JSON = JSON = JSON || {};
// implement JSON.stringify serialization
JSON.stringify = JSON.stringify || function (obj) {

    var t = typeof (obj);
    if (t != "object" || obj === null) {

        // simple data type
        if (t == "string") obj = '"' + obj + '"';
        return String(obj);

    }
    else {

        // recurse array or object
        var n, v, json = [], arr = (obj && obj.constructor == Array);

        for (n in obj) {
            v = obj[n]; t = typeof (v);

            if (t == "string") v = '"' + v + '"';
            else if (t == "object" && v !== null) v = JSON.stringify(v);

            json.push((arr ? "" : '"' + n + '":') + String(v));
        }

        return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
    }

};

// implement JSON.parse de-serialization
JSON.parse = JSON.parse || function (str) {
    if (str === "") str = '""';
    eval("var p=" + str + ";");
    return p;
};

//main code block
paktofonika.console.showDialog();