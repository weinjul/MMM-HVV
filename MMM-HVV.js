//Based on a script by Georg Peters

Module.register('MMM-HVV', {
    defaults:{
        apikey: "",
        apiuser: "",
        updateInterval: 1 * 60 * 1000,
        apiBase: "https://gti.geofox.de/gti/public/",
        station: "Master:84952",
        maximumEntries: 10,
        maxTimeOffset: 15,
        useRealtime: true,
        version: 51,

    },

    getStyle: function() {
        return "font-awsome.css"
    },
    
    start: function() {
        Log.info("Starting module: " + this.name);
        this.sendSocketNotification('START_HVV', this.config);
        this.trains = [];
        this.loaded = false;
    },

    getDom: function() {
        var wrapper = document.createElement("div");
        
        if(this.config.apikey === ""){
            wrapper.innerHTML = "Please set a valid API key.";
            wrapper.className = "dimmed light small";
            return wrapper;
        }
        if(this.config.apiuser === ""){
            wrapper.innerHTML = "Please set a valid API User."
            wrapper.className = "dimmed light small";
            return wrapper;
        }
        if(!this.loaded){
            wrapper.innerHTML = "Loading connections ...";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        wrapper.innerHTML = this.trains;
        return wrapper;
    },

    socketNotificationReceived: function(notification, payload){
        if(notification === "TRAINS"){
            Log.info("Trains arrived");
            this.trains = payload;
            this.loaded = true;
            this.updateDom();
        }
    }
});