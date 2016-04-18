var HTML5 = require('html5')
var fs = require('fs')

var s = fs.createReadStream('tc.html')
var p = new HTML5.Parser(s)
