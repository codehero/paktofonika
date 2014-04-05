var fs = require("fs");
var util = require("util");
var path = require("path");
var express = require("express");
var child_process = require("child_process");

var LISTEN_PORT = process.argv[2];
var CONFIG_FILE = process.argv[3];

var cfg = JSON.parse(fs.readFileSync(CONFIG_FILE));
if(!"listenHost" in cfg)
	cfg.listenHost = "localhost";

var theServer = null;

var shutdown = false;

var gCredentials = null;

/* **********************************************************************
 * Web app METHODS.
 * ***********************************************************************/

var app = express();

app.use(express.basicAuth(function(user, pass){
	if(gCredentials)
		return (user == gCredentials.user && pass == gCredentials.pass);

	gCredentials = {
		"user" : user,
		"pass" : pass
	};

	return true;
}));

app.use(express.methodOverride());
app.use(express.bodyParser());
app.use("/ui", express.static(path.join(__dirname, "www")));

app.get("/jsonp/banner/:fcall", function(req, res){
	var fcall = req.params.fcall;
	res.send(fcall +"("+ JSON.stringify(cfg.bannerMsg) +");");
});

app.post("/api/shutdown", function(req, res){
	res.send("Closing...");
	shutdown = true;
	setTimeout(function(){
		theServer.close();
	}, 1);
});

/* Handle user device registrations. */
app.post("/api/logout", function(req, res){
	if(!gCredentials){
		res.send("No login established.", 200);
	}
	else{
		gCredentials = null;
		res.send("Logged out.", 200);
	}
});

theServer = app.listen(LISTEN_PORT, cfg.listenHost);
