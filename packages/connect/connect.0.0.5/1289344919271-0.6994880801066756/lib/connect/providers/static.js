/*!
 * Ext JS Connect
 * Copyright(c) 2010 Ext JS, Inc.
 * MIT Licensed
 */

var fs = require('fs'),
    Url = require('url'),
    Buffer = require('buffer').Buffer,
    Path = require('path'),
    utils = require('./../utils');

var lifetime = 1000 * 60 * 60; // 1 hour browser cache lifetime

module.exports = {

    setup: function (env) {
        this.root = env.staticRoot || this.root || process.cwd();
    },

    handle: function (req, res, next) {
        var url = Url.parse(req.url);

        var pathname = url.pathname.replace(/\.\.+/g, '.'),
            filename = Path.join(this.root, pathname);

        if (filename[filename.length - 1] === "/") {
            filename += "index.html";
        }

        // Buffer any events that fire while waiting on the stat.
        var events = [];
        function onData() {
            events.push(["data"].concat(Array.prototype.slice.call(arguments)));
        }
        function onEnd() {
            events.push(["end"].concat(Array.prototype.slice.call(arguments)));
        }
        req.addListener("data", onData);
        req.addListener("end", onEnd);

        fs.stat(filename, function (err, stat) {

            // Stop buffering events
            req.removeListener("data", onData);
            req.removeListener("end", onEnd);

            // Fall through for missing files, thow error for other problems
            if (err) {
                if (err.errno === process.ENOENT) {
                    next();
                    // Refire the buffered events
                    events.forEach(function (args) {
                        req.emit.apply(req, args);
                    });
                    return;
                }
                next(err);
                return;
            }

            // Serve the file directly using buffers
            function onRead(err, data) {
                if (err) {
                    next(err);
                    return;
                }

                // For older versions of node convert the string to a buffer.
                if (typeof data === 'string') {
                  var b = new Buffer(data.length);
                  b.write(data, "binary");
                  data = b;
                }

                res.writeHead(200, {
                  "Content-Type": utils.mime.type(filename),
                  "Content-Length": data.length,
                  "Last-Modified": stat.mtime.toUTCString(),
                   // Cache in browser for 1 year
                  "Cache-Control": "public max-age=" + 31536000
                });
                res.end(data);
            }

            // Node before 0.1.95 doesn't do buffers for fs.readFile
            if (process.version < "0.1.95") {
              // sys.debug("Warning: Old node version has slower static file loading");
              fs.readFile(filename, "binary", onRead);
            } else {
              fs.readFile(filename, onRead);
            }
        });
    }
};
