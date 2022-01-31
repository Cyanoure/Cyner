exports.module = class extends CynerModule{
    Name = "EventManager";
    Version = "2.0";

    Listeners = [];
    on(event,callback){
        this.Listeners.push({
            event:event,
            callback:callback
        });
    }

    callEvent(event,data = null){
        var out = [];
        this.Listeners.forEach(function(item,i){
            if (item.event == event) {
                out.push(item.callback(data));
            }
        });
        return out;
    }

    OnStart(){
        this.callEvent("EventManagerStarted");
    }
    OnStop(){
        this.callEvent("EventManagerStopped");
    }
}
