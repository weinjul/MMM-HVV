//Based on a script by Georg Peters

const NodeHelper = require("node_helper");
const forge = require('node-forge');
const unirest = require("unirest");
const Log = require("logger");

module.exports = NodeHelper.create({
    start: function(){
        this.started = false;
    },

    processTrains: function(payload){
        this.trains = [];
        /*var time = payload.time.time.split(":");
        var datetime = new Date(parseDate(payload.time.date));
        datetime.setHours(time[0]);
        datetime.setMinutes(time[1]);*/
        for(var i = 0, count = payload.departures.length; i < count; i++){
            var train = payload.departures[i];
            if(train.timeOffset < 0){
                continue;
            }
            var delay;
            if(train.delay != 0 && train.delay != undefined){
                delay = train.delay;
            }
            else{delay = null};
            this.trains.push({
                "departureTimestamp": train.timeOffset,
                "delay": delay,
                "name": train.line.name,
                "to": train.line.direction,
                "id": train.line.id, 
            })
        };
        this.loaded = true;
        this.sendSocketNotification("TRAINS", this.trains);

    },

    getSignature: function(data){
        return new Promise((resolve)=>{
            var hmac = forge.hmac.create();
            hmac.start('sha1', this.config.apikey);
            hmac.update(forge.util.encodeUtf8(JSON.stringify(data)));
            var hash = hmac.digest().toHex();
            var sig = new Buffer.from(hash, 'hex').toString('base64');
            resolve(sig)
        })
    },
    
    updateTable: function() {
        var url = this.config.apiBase + 'departureList';
        var self = this;

        var data = {
            "time":{},
            "maxList": this.config.maximumEntries,
            "maxTimeOffset": this.config.maxTimeOffset,
            "useRealtime": this.config.useRealtime,
            "version": this.config.version,
        };

        if(Array.isArray(this.config.stations)){

            var stations = [];
            for(i in this.config.stations){
                stations.push({"id": this.config.stations[i], "type":"STATION"});
            }
            data.stations = stations;
        }
        else{data.station = {"id": this.config.stations, "type":"STATION"}}

        self.getSignature(data).then((sig) => {
            unirest.post(url)
            .headers({
                'Content-Type': 'application/json;charset=UTF-8',
                'Accept-Encoding': 'deflate',
                'Accept':'application/json',
                'geofox-auth-signature': sig,
                'geofox-auth-type': 'HmacSHA1',
                'geofox-auth-user': this.config.apiuser
            })
            .send(JSON.stringify(data))
            .then(function(r){
                self.processTrains(r.body)
            }
            )
        })
    },

    socketNotificationReceived: function(notification, payload){
        const self = this;
        if(notification === 'START_HVV' && this.started == false){
            this.config = payload;
            this.started = true;
            setInterval(() => {
                self.updateTable();
            }, this.config.updateInterval);
            self.updateTable();
        }
    }
})