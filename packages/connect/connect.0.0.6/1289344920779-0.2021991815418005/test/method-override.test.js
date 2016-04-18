
/**
 * Module dependencies.
 */

var connect = require('connect'),
    helpers = require('./helpers'),
    assert = require('assert'),
    http = require('http');

module.exports = {
    'test valid http method': function(){
        var server = helpers.run([
            { filter: 'body-decoder' },
            { filter: 'method-override' },
            { module: {
                handle: function(req, res){
                    assert.equal('PUT', req.method, 'Test method-override')
                    res.writeHead(200);
                    res.end();
                }
            }}
        ]);
        var req = server.request('POST', '/', { 'Content-Type': 'application/x-www-form-urlencoded' });
        req.write('_method=put');
        req.end();
    },
    
    'test invalid http method': function(){
        var server = helpers.run([
            { filter: 'body-decoder' },
            { filter: 'method-override' },
            { module: {
                handle: function(req, res){
                    assert.equal('POST', req.method, 'Test method-override invalid method')
                    res.writeHead(200);
                    res.end();
                }
            }}
        ]);
        var req = server.request('POST', '/', { 'Content-Type': 'application/x-www-form-urlencoded' });
        req.write('_method=foobar');
        req.end();
    }
}