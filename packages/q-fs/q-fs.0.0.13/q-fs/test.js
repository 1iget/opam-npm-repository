var Q = require("q");
var FS = require("q-fs");
Q.when(FS.listTree(__dirname), console.log);
