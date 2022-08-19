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
        Log.log(payload);
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
            "station": {
                "id": this.config.station,
                "type": "STATION"
            },
            "time":{},
            "maxList": this.config.maximumEntries,
            "maxTimeOffset": this.config.maxTimeOffset,
            "useRealtime": this.config.useRealtime,
            "version": this.config.version,
        };
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
        Log.info("Notification Received")
        const self = this;
        if(notification === 'START_HVV' && this.started == false){
            this.config = payload;
            this.started = true;
            setInterval(() => {
                self.updateTable();
            }, this.config.updateInterval);
        }
    }
})