var sys = require('sys');

var v;

[1, 2, 3].forEach(function (e) {
    v = e;

    process.nextTick(function () {
        sys.puts("v:"+v);
        sys.puts("e:"+e);
    });
});
