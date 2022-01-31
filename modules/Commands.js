var colors = require("colors");
var eventMan = null;
exports.module = class extends CynerModule{
    Name = "Commands";
    Version = "1.0";
    Priority = "high";
    Depends = ["EventManager"];

    Commands = [];

    rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });

    GetCommand(cmd){
        cmd = cmd.trim().toLowerCase();
        return this.Commands.find(a => {
            return a.Command == cmd || a.Aliases.indexOf(cmd) > -1;
        });
    }

    OnStart(){
        var _this = this;
        eventMan = ModuleManager.GetModule("EventManager");

        this.Command = class{
            Command = "mycommand";
            Aliases = [];
            Description = "No description.";
            Run(){}
            constructor(){
                _this.Commands.push(this);
            }
        }

        this.rl.on("line",function(input){
            input = input.trim();
            if (input != "") {
                console.log(`Execute command '${input}'`);
                _this.Execute(input);
            }
        });

        eventMan.on("Command",function(cmd){
            var mainCMD = cmd.split(" ")[0].toLowerCase();
            var command = _this.GetCommand(mainCMD);
            if (command == undefined) {
                console.log("Unknown command!");
            }else{
                command.Run(mainCMD,cmd.split(" ").slice(1));
            }
        });

        class HelpCommand extends this.Command{
            Command = "help";
            Aliases = ["h","?"];
            Description = "List of commands.";
            Run(cmd,args){
                if (args.length > 0) {
                    var command = _this.GetCommand(args[0]);
                    if (command == undefined) {
                        console.log(`Unknown command '${args[0]}'`);
                    }else{
                        console.log(`-- [ Command '${command.Command}' ] --`.yellow);
                        console.log("-- Aliases:".yellow);
                        command.Aliases.forEach((item, i) => {
                            console.log(`   - `.yellow+`${item}`.cyan);
                        });
                        console.log(`-- Description: `.yellow+`${command.Description}`.cyan);

                    }
                }else{
                    console.log("-- [ List of all registered commands ] --".yellow);
                    _this.Commands.forEach((item, i) => {
                        console.log(`-- `.yellow+`${item.Command}`.green+` : `.yellow+`${item.Description}`.cyan);
                    });
                }
            }
        }
        new HelpCommand();

        class StopCommand extends this.Command{
            Command = "exit";
            Aliases = ["stop","close","quit"];
            Description = "Shuts down the server.";
            Run(){
                console.log("Goodbye!".red);
                ModuleManager.StopModules();
                process.exit();
            }
        }
        new StopCommand();

        class ModulesCommand extends this.Command{
            Command = "modules";
            Aliases = ["modulelist"];
            Description = "List of loaded modules.";
            Run(){
                console.log("Loaded modules:".cyan);
                var moduleList = [];
                ModuleManager.Modules.forEach((item, i) => {
                    var text = item.Name;
                    if (item.Started) {
                        text = text.green;
                    }else{
                        text = text.red;
                    }
                    moduleList.push(text);
                });
                console.log(moduleList.join(", ".gray));
            }
        }
        new ModulesCommand();

        eventMan.callEvent("CommandsStarted");
    }

    Execute(cmd){
        eventMan.callEvent("Command",cmd);
    }
}
