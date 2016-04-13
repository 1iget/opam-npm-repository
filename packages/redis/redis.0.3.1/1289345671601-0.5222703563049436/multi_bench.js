/*global require console setTimeout process */

var redis = require("./index"),
    client_count = 1000,
    clients = new Array(client_count), i;

var start_time = new Date();
var connected = 0;
    
for (i = 0; i < client_count ; i += 1) {
    clients[i] = redis.createClient();
    clients[i].on("connect", function () {
        connected += 1;
        if (connected === client_count) {
            console.log("Connected " + client_count + " in " + (Date.now() - start_time) + " ms");
        }
    })
}
