var Q = require("q");

var setProgress = Q.Method("progress");
var deferWithProgress = function (onProgress) {
    var d = Q.defer();
    var p = Q.Promise({"progress": onProgress});
    return {
        "resolve": d.resolve,
        "reject": d.reject,
        "promise": p
    };
}

var x = deferWithProgress(function (progress) {
    console.log("progress:", progress);
});

function timer(start, step, stop, interval, each, done) {
    each(start);
    if (start >= stop) {
        done()
    } else {
        setTimeout(function () {
            timer(start + step, step, stop, interval, each, done);
        }, interval);
    }
}

timer(0, 1, 3, 1000, function (progress) {
    setProgress(x.promise, progress / 3);
}, function () {
    x.resolve(console);
});

Q.when(x.promise, function () {
    console.log('resolved');
});

