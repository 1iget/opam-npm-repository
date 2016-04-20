var Q = require("q");
var FS = require("q-fs");
Q.when(FS.read(__filename), console.log);
