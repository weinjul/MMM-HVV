//Based on a script by Georg Peters

Module.register('MMM-HVV', {
    defaults:{
        apikey: "",
        apiuser: "",
        updateInterval: 1 * 60 * 1000,
        apiBase: "https://gti.geofox.de/gti/public/",
        stations: "Master:9910950",
        maximumEntries: 20,
        maxTimeOffset: 100,
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
        var table = document.createElement("table");
        table.calssName = "small"

        for(var i in this.trains){
            var train = this.trains[i];

            var row = document.createElement("tr");
            table.appendChild(row);

            var logoCell = document.createElement("td");
            const image = document.createElement("img");
            image.src = 'https://cloud.geofox.de/icon/line?height=14&lineKey=' + train.id;
            Log.info(image.src);
            logoCell.appendChild(image);
            row.appendChild(logoCell);

            var trainToCell = document.createElement("td");
            trainToCell.innerHTML = train.to;
            trainToCell.className = "trainto";
            row.appendChild(trainToCell);

            var depCell = document.createElement("td");
            depCell.calssName = "departureTime";
            if(train.departureTimestamp == 0){
                depCell.innerHTML = "now";
            }
            else{depCell.innerHTML = train.departureTimestamp + " Minuten"}
            row.appendChild(depCell);

        }
        
        return table
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