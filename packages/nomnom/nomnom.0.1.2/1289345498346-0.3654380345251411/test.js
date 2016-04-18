var sys = require("sys");

var Controller = function() {
  this.a = 78;
}

Controller.prototype.Menu = function() {
}

Controller.prototype.Menu.prototype = {
  controller : this,
  
  isIt : function() {
    sys.puts(this.controller.a);
  }
}

var c2 = new Controller();

var menu = new c2.Menu();
menu.isIt();