'use strict';

var assert = require('assert');
var request = require('../');
var http = require('http');
var serveStatic = require('serve-static');
var rimraf = require('rimraf');
var path = require('path');
var url = require('url');
var qs = require('querystring');

rimraf.sync(path.resolve(__dirname, '..', 'cache'));


var CACHED_BY_CACHE_CONTROL = 'http://localhost:3293/index.js';

var overrideableHeaders = ['cache-control'];
function overrideHeaders(res, path, stat) {

  var query = qs.parse(url.parse(this.req.url).query);
  overrideableHeaders.forEach(function(header){
    if(header in query) {
      res.setHeader(header,query[header]);
    }
  });
  
}

var cacheControlServer = http.createServer(serveStatic(__dirname, {
  etag: false,
  lastModified: false,
  cacheControl: true,
  maxAge: 5000,
  fallthrough: false,
  setHeaders: overrideHeaders
}));

cacheControlServer.listen(3293, function onListen() {
  request('GET', CACHED_BY_CACHE_CONTROL, {cache: 'legacy'}, function (err, res) {
    if (err) throw err;

    console.log('response L:E (populate memory cache)');
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    assert(res.fromNotModified === undefined);
    res.body.on('data', function () {});
    res.body.on('end', function () {
      setTimeout(function () {
        request('GET', CACHED_BY_CACHE_CONTROL, {cache: 'legacy'}, function (err, res) {
          if (err) throw err;

          console.log('response L:F (from memory cache)');
          assert(res.statusCode === 200);
          assert(res.fromCache === true);
          assert(res.fromNotModified === false);
          res.body.resume();
        });
      }, 25);
    });
  });

});

cacheControlServer.unref();

