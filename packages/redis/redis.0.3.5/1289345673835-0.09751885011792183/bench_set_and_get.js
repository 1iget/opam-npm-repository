/**
 * Module dependencies.
 */

var redis = require('./index');

var client = redis.createClient(),
    times  = 1600000,
    curr   = {},
    start;

function next(){
  var fn = queue.shift();
  if (fn.length) {
    var pending = 1;
    fn("key", function(label){
      var dur = new Date - start;
      report(label, dur);
      --pending || next();
    });
  } else {
    fn();
  }
}

var queue = [
  // FLUSHALL
  function(){
    client.flushall(next);
  },

  function(buf, next){
    var n = times;
    start = new Date;
    while (n--) client.set('key_' + n, 'val_' + n);
    client.set("key", buf, function(err, res) {
        next('SET');
    });
  },
  
  function(buf, next){
    var n = times;
    start = new Date;
    while (n--) client.get("key_" + n);
    client.get("key", function (err, res) {
        next('GET');
    });
  },

  function(){
    client.end();
  }
];

client.on('connect', function(){
  console.log('NUM: %d:', times);
  next();
});

function report(label, c) {
  console.log('    %s: ', label, (times/c)*1000);
}

setInterval(function () {
    console.log("Command queue depth: " + client.command_queue.length);
}, 1000);
