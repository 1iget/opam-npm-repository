require('../common');
var str = require('gently/str');

function test(test) {
  test();
}

test(function camelize() {
  assert.equal(str.camelize('foo'), 'Foo');
  assert.equal(str.camelize('foo_bar'), 'FooBar');
  assert.equal(str.camelize('foo_bar_la'), 'FooBarLa');
  assert.equal(str.camelize('s3_store'), 'S3Store');
  assert.equal(str.camelize('go_5ive'), 'Go5ive');
});

test(function underscore() {
  assert.equal(str.underscore('Foo'), 'foo');
  assert.equal(str.underscore('FooBar'), 'foo_bar');
  assert.equal(str.underscore('FooBarLa'), 'foo_bar_la');
  assert.equal(str.underscore('S3Store'), 's3_store');
  assert.equal(str.underscore('Go5ive'), 'go_5ive');
});