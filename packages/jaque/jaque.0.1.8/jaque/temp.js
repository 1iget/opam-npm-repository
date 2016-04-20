    var JAQUE = require("jaque");
    var Q = require("q"); // from npm
    var HTTP = require("q-http"); // from npm
    var SYS = require("sys"); // from node

    var app = JAQUE.Branch({
        "": JAQUE.Method({
            "GET": function (request) {
                return {
                    "status": 200,
                    "headers": {"content-type": "text/plain"},
                    "body": ["Hello, World!\r\n"]
                };
            }
        })
    }, JAQUE.notFound);

    app = JAQUE.Decorators([
        JAQUE.Log,
        JAQUE.Error,
        JAQUE.ContentLength
    ], app);

    var server = HTTP.Server(app);
    var listening = server.listen(8080);
    Q.when(listening, function () {
        SYS.puts("Listening on 8080.");
    }, Q.error);

