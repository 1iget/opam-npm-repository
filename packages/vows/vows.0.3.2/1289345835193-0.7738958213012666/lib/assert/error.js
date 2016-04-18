var stylize = require('vows/console').stylize;
var inspect = require('vows/console').inspect;

require('assert').AssertionError.prototype.toString = function () {
    var that = this,
        source = this.stack.match(/([a-zA-Z0-9_-]+\.js)(:\d+):\d+/);

    function parse(str) {
        return str.replace(/{actual}/g,   inspect(that.actual)).
                   replace(/{expected}/g, inspect(that.expected)).
                   replace(/{operator}/g, stylize(that.operator, 'bold'));
    }

    if (this.message) {
        return stylize(parse(this.message), 'yellow') +
               stylize(' // ' + source[1] + source[2], 'grey');
    } else {
        return stylize([
            this.expected,
            this.operator,
            this.actual
        ].join(' '), 'yellow');
    }
};

