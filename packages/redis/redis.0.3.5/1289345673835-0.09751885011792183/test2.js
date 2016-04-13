var redis = require("./client"),
    client = redis.createClient(),
    sys = require('sys');

client.info(function (err, res) {
    console.log(res.toString());
});
