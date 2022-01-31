var fs = null;
try{
    fs = require("fs");
}catch(err){
    console.error("Please install module 'fs': 'npm install fs'");
    process.exit();
}
global.commandArgs = process.argv.slice(2);
global.getArg = function(argName = ""){
    if(commandArgs.indexOf(argName) > -1){
        return true;
    }
    var talalat = commandArgs.find(a => {return a.startsWith(argName+":")});
    return talalat != undefined ? talalat.slice((argName+":").length) : null;
}

if (getArg("merge")) {
    console.log("Merging Cyner to your project...");

    console.log("Merging dependencies...");
    var package_content = fs.existsSync("./package.json") ? JSON.parse(fs.readFileSync("./package.json")) : {};
    var cyner_package_content = JSON.parse(fs.readFileSync("./package-cyner.json"));
    package_content.main = cyner_package_content.main;
    if(package_content.dependencies == undefined || package_content.dependencies == null) package_content.dependencies = {};
    Object.assign(package_content.dependencies,cyner_package_content.dependencies);
    fs.writeFileSync("./package.json",JSON.stringify(package_content,null,2));

    console.log("Merging finished. Install dependencies with 'npm install' command then start your server with 'npm start' command.");
    process.exit();
}

const colors = require("colors");

console.clear();
console.log("--------------------------------------------------".cyan);
console.log("                    Powered by                    ".yellow);
console.log("                    Cyner Core                    ".red);
console.log("                       v1.0                       ".blue);
console.log("--------------------------------------------------".cyan);

function arraymove(arr, fromIndex, toIndex) {
    var element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
}



global.CynerModule = class{
    Name = "UnknownModule";
    Version = "UnknownVersion";
    Depends = [];
    Started = false;
    Priority = "normal"; // normal, high, low
    Error = false;
    constructor(){

    }
    OnStart(){
        console.log("'"+this.Name+"' is started.");
    }
    OnStop(){
        console.log("'"+this.Name+"' is stopped.");
    }
    AllDependenciesStarted(){
        var _this = this;
        var allStarted = true;
        var i = 0;
        while (allStarted && i < this.Depends.length) {
            var module = ModuleManager.GetModule(_this.Depends[i]);
            if (!(module != undefined && module.Started)) {
                allStarted = false;
            }
            i++;
        }
        return allStarted;
    }
}

global.CynerModuleManager = class{
    Modules = [];
    GetModule(moduleName = "",version = null){
        return this.Modules.find(a => {return a.Name == moduleName && (version == null || a.Version == version)});
    }
    LoadModule(fileName = "modules/module.js"){
        var _this = this;
        if (!fileName.startsWith("/") && !fileName.startsWith("\\" && !fileName.startsWith("./") && !fileName.startsWith(".\\") && !fileName.slice(1).startsWith(":\\") && !fileName.slice(1).startsWith(":/"))) {
            fileName = "./"+fileName;
        }
        if(fs.existsSync(fileName)){
            console.log("Loading module: '"+fileName+"'");
            //var index = this.Modules.push(new require(fileName)())-1;
            try{
                var mf = require(fileName);
                if(mf.module != undefined){
                    var module = new mf.module();
                    console.log("Module '"+module.Name+"' version '"+module.Version+"' loaded.");
                    _this.Modules.push(module);
                }else{
                    console.error("'"+fileName+"' is not a valid module.");
                }
            }catch(err){
                console.error("An error occurred while loading '"+fileName+"':");
                console.error(err);
            }
        }else{
            console.error("An error occurred while loading "+fileName+": File not exists.");
        }
    }
    LoadModules(folderName = "modules"){
        folderName = (folderName.endsWith("/") || folderName.endsWith("\\")) ? folderName : folderName+"/";
        if (!fs.existsSync(folderName)){
            fs.mkdirSync(folderName);
        }
        var files = fs.readdirSync(folderName);
        var jsFiles = [];
        var _this = this;
        files.forEach((item, i) => {
            if (item.endsWith(".js")) {
                jsFiles.push(item);
                _this.LoadModule(folderName+item);
            }
        });
        console.log(_this.Modules.length+" modules are loaded.");
    }

    StartModule(module){
        var success = false;
        console.log("Starting module: "+module.Name);
        try{
            module.OnStart();
            module.Started = true;
            success = true;
        }catch(err){
            module.Error = true;
            console.error("An error occurred while starting module '"+module.Name+"':");
            console.error(err);
        }
        return success;
    }

    StopModule(module){
        var success = false;
        console.log("Stopping module: "+module.Name);
        try{
            if (module.Started) {
                module.OnStop();
                module.Started = false;
            }
            success = true;
        }catch(err){
            module.Error = true;
            console.error("An error occurred while stopping module '"+module.Name+"':");
            console.error(err);
        }
        return success;
    }

    StartModules(autoSorting = true){
        console.log("Starting loaded modules...");
        var _this = this;
        if (autoSorting) {
            [].concat(this.Modules).forEach((item, i) => {
                if (item.Priority.toLowerCase() == "low") {
                    arraymove(_this.Modules,_this.Modules.indexOf(item),_this.Modules.length-1);
                }else if (item.Priority.toLowerCase() == "high") {
                    arraymove(_this.Modules,_this.Modules.indexOf(item),0);
                }
            });
            /*_this.Modules.sort((a,b) => {
                if (a.Depends.indexOf(b.Name) > -1) return 1;
                if (b.Depends.indexOf(a.Name) > -1) return -1;
                return 0;
            });*/
        }
        var loadedModulesCounter = 0;
        do{
            loadedModulesCounter = 0;
            _this.Modules.forEach((module, i) => {
                if (!module.Error && !module.Started) {
                    if (module.AllDependenciesStarted()) {
                        if (_this.StartModule(module)) {
                            loadedModulesCounter++;
                        }
                    }
                }
                //_this.StartModule(module);
            });
        }while(loadedModulesCounter > 0);
        console.log("Modules started.");
    }
    StopModules(){
        var _this = this;
        console.log("Stopping running modules...");
        _this.Modules.reverse().forEach((module, i) => {
            _this.StopModule(module);
        });
        console.log("Running modules stopped.");
    }
}

global.ModuleManager = new CynerModuleManager();
ModuleManager.LoadModules();
ModuleManager.StartModules();
