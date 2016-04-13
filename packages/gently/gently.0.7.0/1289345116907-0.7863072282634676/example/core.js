require('../test/common');
var require = global.GENTLY_REQUIRE || require;

function Dog() {
  
}

Dog.prototype.seeCat = function() {
  this.bark('whuf, whuf');
  this.run();
}

Dog.prototype.bark = function(bark) {
  require('sys').puts(bark);
}


  , assert = require('assert')
  , dog = new Dog();

gently.expect(dog, 'bark', function(bark) {
  assert.equal(bark, 'whuf, whuf');
});
gently.expect(dog, 'run');

dog.seeCat();