var FS = require("q-fs");
console.log("/:", FS.relativeFromDirectory("/", ".."));
console.log(":", FS.relativeFromDirectory("..", ".."));
