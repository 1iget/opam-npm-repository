
var SYS = require("sys");
var Q = require("q");

function foo() {
    var deferred = Q.defer();
    Q.when(deferred.promise, null, function () {
        SYS.puts("squashed");
    });
    return deferred;
}

var deferred = foo();
deferred.reject()

