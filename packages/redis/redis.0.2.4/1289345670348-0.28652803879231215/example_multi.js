var redis  = require("./index"),
    client = redis.createClient(), set_size = 20;

client.sadd("bigset", "a member");
client.sadd("bigset", "another member");

while (set_size > 0) {
    client.sadd("bigset", "member " + set_size);
    set_size -= 1;
}

client.multi([
    ["scard", ["bigset"], function (err, res) {
        console.log("An individual callback, value: " + res.toString());
    }],
    ["smembers", ["bigset"]],
    ["smembers", ["bigset"]],
    ["smembers", ["bigset"]],
    ["smembers", ["bigset"]],
    ["keys", ["*"]],
    ["dbsize", []]
], function (replies) {
    console.log("MULTI got " + replies.length + " replies");
    replies.forEach(function (reply, index) {
        console.log("Reply " + index + ": " + reply.toString());
    });
    client.quit();
});
