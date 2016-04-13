var path = require('path')
  , sys = require('sys');

require.paths.unshift(path.dirname(__dirname)+'/lib');

// Host: 141.28.230.28 Port: 3306 User: root Password: test123
global.TEST_CONFIG = {
  host: '141.28.230.10',
  port: 3306,
  user: 'root',
  password: 'h7sta9eC',
  database: 'node_mysql_test',
};

//global.TEST_CONFIG = {
  //host: 'localhost',
  //port: 3306,
  //user: 'root',
  //password: 'root',
  //database: 'node_mysql_test',
//};

global.TEST_TABLE = 'posts';

global.Gently = require('gently');
global.assert = require('assert');
global.p = function(val) {
  sys.error(sys.inspect(val));
};

global.GENTLY = new Gently();
global.HIJACKED = GENTLY.hijacked;
