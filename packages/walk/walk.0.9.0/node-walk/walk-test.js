(function () {
  var walk = require('./lib/walk');

  Array.prototype.removeAt = function (i) {
    return this.splice(i, 1)[0];
  }

  walk('/Users/coolaj86').whenever(function (err, path, nodes, o) {
    if (err) {
      console.log('ERROR: ');
      console.log(err);
      return;
    }
    o.dirs.forEach(function (item, i, arr) {
      if (item.name.match(/trash/i)) {
        console.log('found a trash');
        arr.removeAt(i);
      }
    });
    console.log(o);
  });

  setTimeout(function () {
    process.nextTick(process.exit);
  }, 200);
}());
