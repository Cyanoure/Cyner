var fs = require('fs');
var colors = require("colors");

var logsFolder = "logs";

var logLevel = "verbose"; // verbose, default, reduced
var event = null;

exports.module = class extends CynerModule{
	Name = "Logger";
	Version = "3.2";
	Priority = "high";
	Depends = ["EventManager"];

	logsFolder = "logs";

	setLogsFolder(path){
		logsFolder = path;
		this.logsFolder = path;
	}

	OnStart(){
		event = ModuleManager.GetModule("EventManager");
		global.o_console = Object.assign({},console);
		this.overWriteConsole();
		this.log("Logger működésre kész.");
		if (typeof(callback) == "function") {
			callback()
		}
	}

	overWriteConsole(){
		this.log("Logger: Eredeti console objektum felülírása...");
		console.log = this.log;
		console.info = this.info;
		console.error = this.error;
		console.debug = this.debug;
		console.warn = this.warn;
		//console = Object.assign(Object.assign({},this.o_console),this);
	}

	log(text){
		text = formatInput(text);
	    var colored = "[".gray+getTime().gray+" INFO] ".gray+text;
	    var noncolored = "["+getTime()+" INFO] "+text;
	    o_console.log(colored);
	    writeLog(noncolored,colored,"log");
		event.callEvent("logger.log",colored);
		event.callEvent("logger.log_any",{type:"log",message:colored});
	}
	info = this.log;
	warn(text){
		text = formatInput(text);
	    var colored = "[".yellow+getTime().yellow+" WARN] ".yellow+text;
	    var noncolored = "["+getTime()+" WARN] "+text;
	    o_console.warn(colored);
	    writeLog(noncolored,colored,"warn");
		event.callEvent("logger.warn",colored);
		event.callEvent("logger.log_any",{type:"warn",message:colored});
	}

	error(text){
		if (logLevel.trim().toLowerCase() == "reduced") return;
		text = formatInput(text);
	    var colored = "[".red+getTime().red+" ERROR] ".red+text;
	    var noncolored = "["+getTime()+" ERROR] "+text;
	    o_console.error(colored);
	    writeLog(noncolored,colored,"error");
		event.callEvent("logger.error",colored);
		event.callEvent("logger.log_any",{type:"error",message:colored});
	}

	debug(text){
		if (logLevel.trim().toLowerCase() != "verbose") return;
		text = formatInput(text);
	    var colored = "[".green+getTime().green+" DEBUG] ".green+text;
	    var noncolored = "["+getTime()+" DEBUG] "+text;
	    o_console.debug(colored);
	    writeLog(noncolored,colored,"debug");
		event.callEvent("logger.debug",colored);
		event.callEvent("logger.log_any",{type:"debug",message:colored});
	}
}

function trim(s, c) {
  if (c === "]") c = "\\]";
  if (c === "\\") c = "\\\\";
  return s.replace(new RegExp(
    "^[" + c + "]+|[" + c + "]+$", "g"
  ), "");
}

function mkDir(dir){
	if (fs.existsSync(dir)) {
		return false;
	}else{
		fs.mkdirSync(dir);
		return true;
	}
}

function getTime(){
    var time = new Date();
    var hours = ("0" + time.getHours()).slice(-2);
    var minutes = ("0" + time.getMinutes()).slice(-2);
    var seconds = ("0" + time.getSeconds()).slice(-2);
    return hours+":"+minutes+":"+seconds;
}

function writeLog(text,colored,type){
	text = text.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
	var logdir = logsFolder;
	logdir = logdir.substr(0,(logdir.length-1))+(logdir.substr(-1).replace("/","").replace("\\",""));
    var time = new Date();
    var hours = ("0" + time.getHours()).slice(-2);
    var minutes = ("0" + time.getMinutes()).slice(-2);
    var seconds = ("0" + time.getSeconds()).slice(-2);
    var month = ("0"+(time.getMonth()+1)).slice(-2);
    var dayOfMonth = ("0"+time.getDate()).slice(-2);
    var year = time.getFullYear();

    var logFileName = year+"-"+month+"-"+dayOfMonth+".log";
    mkDir(logdir);
    fs.appendFileSync(`${logdir}/${logFileName}`,`${text}\n`);
    fs.appendFileSync(`${logdir}/latest.log`,`${text}\n`);
}

function formatInput(text){
	if (text instanceof Error) {
		text = text.stack;
	}else if (typeof(text) != "string") {
		try{
			text = JSON.stringify(text,null,2);
		}catch(e){
			text = String(text);
		}
	}

	return text;
}
