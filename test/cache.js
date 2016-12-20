'use strict';

var assert = require('assert');
var request = require('../');
var http = require('http');
var serveStatic = require('serve-static');
var rimraf = require('rimraf');
var path = require('path');

rimraf.sync(path.resolve(__dirname, '..', 'cache'));


var CACHED_BY_CACHE_CONTROL = 'http://localhost:3293/index.js';

var cacheControlServer = http.createServer(serveStatic(__dirname, {
  etag: false,
  lastModified: false,
  cacheControl: true,
  maxAge: 5000,
  fallthrough: false
}));

cacheControlServer.listen(3293, function onListen() {
  request('GET', CACHED_BY_CACHE_CONTROL, {cache: 'memory'}, function (err, res) {
    if (err) throw err;

    console.log('response E (populate memory cache)');
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    assert(res.fromNotModified === undefined);
    res.body.on('data', function () {});
    res.body.on('end', function () {
      setTimeout(function () {
        request('GET', CACHED_BY_CACHE_CONTROL, {cache: 'memory'}, function (err, res) {
          if (err) throw err;

          console.log('response F (from memory cache)');
          assert(res.statusCode === 200);
          assert(res.fromCache === true);
          assert(res.fromNotModified === false);
          res.body.resume();
        });
      }, 25);
    });
  });

  request('GET', CACHED_BY_CACHE_CONTROL, {cache: 'file'}, function (err, res) {
    if (err) throw err;

    console.log('response G (populate file cache)');
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    assert(res.fromNotModified === undefined);
    res.body.on('data', function () {});
    res.body.on('end', function () {
      setTimeout(function () {
        request('GET', CACHED_BY_CACHE_CONTROL, {cache: 'file'}, function (err, res) {
          if (err) throw err;

          console.log('response H (from file cache)');
          assert(res.statusCode === 200);
          assert(res.fromCache === true);
          assert(res.fromNotModified === false);
          res.body.resume();
        });
      }, 1000);
    });
  });
});

cacheControlServer.unref();


var CACHED_BY_ETAGS = 'http://localhost:4294/index.js';

var etagsServer = http.createServer(serveStatic(__dirname, {
  etag: true,
  lastModified: false,
  cacheControl: false,
  fallthrough: false
}));

etagsServer.listen(4294, function onListen() {
  request('GET', CACHED_BY_ETAGS, {cache: 'memory'}, function (err, res) {
    if (err) throw err;

    console.log('response I (populate memory cache)');
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    assert(res.fromNotModified === undefined);
    res.body.on('data', function () {});
    res.body.on('end', function () {
      setTimeout(function () {
        request('GET', CACHED_BY_ETAGS, {cache: 'memory'}, function (err, res) {
          if (err) throw err;

          console.log('response J (from memory cache)');
          assert(res.statusCode === 200);
          assert(res.fromCache === true);
          assert(res.fromNotModified === true);
          res.body.resume();
        });
      }, 25);
    });
  });

  request('GET', CACHED_BY_ETAGS, {cache: 'file'}, function (err, res) {
    if (err) throw err;

    console.log('response K (populate file cache)');
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    assert(res.fromNotModified === undefined);
    res.body.on('data', function () {});
    res.body.on('end', function () {
      setTimeout(function () {
        request('GET', CACHED_BY_ETAGS, {cache: 'file'}, function (err, res) {
          if (err) throw err;

          console.log('response L (from file cache)');
          assert(res.statusCode === 200);
          assert(res.fromCache === true);
          assert(res.fromNotModified === true);
          res.body.resume();
        });
      }, 1000);
    });
  });
});

etagsServer.unref();


var CACHED_BY_LAST_MODIFIED = 'http://localhost:5295/index.js';

var lastModifiedServer = http.createServer(serveStatic(__dirname, {
  etag: false,
  lastModified: true,
  cacheControl: false,
  fallthrough: false
}));

lastModifiedServer.listen(5295, function onListen() {
  request('GET', CACHED_BY_LAST_MODIFIED, {cache: 'memory'}, function (err, res) {
    if (err) throw err;

    console.log('response M (populate memory cache)');
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    assert(res.fromNotModified === undefined);
    res.body.on('data', function () {});
    res.body.on('end', function () {
    	setTimeout(function () {
        request('GET', CACHED_BY_LAST_MODIFIED, {cache: 'memory'}, function (err, res) {
          if (err) throw err;

          console.log('response N (from memory cache)');
          assert(res.statusCode === 200);
          assert(res.fromCache === true);
          assert(res.fromNotModified === true);
          res.body.resume();
        });
      }, 25);
    });
  });

  request('GET', CACHED_BY_LAST_MODIFIED, {cache: 'file'}, function (err, res) {
    if (err) throw err;

    console.log('response O (populate file cache)');
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    assert(res.fromNotModified === undefined);
    res.body.on('data', function () {});
    res.body.on('end', function () {
      setTimeout(function () {
        request('GET', CACHED_BY_LAST_MODIFIED, {cache: 'file'}, function (err, res) {
          if (err) throw err;

          console.log('response P (from file cache)');
          assert(res.statusCode === 200);
          assert(res.fromCache === true);
          assert(res.fromNotModified === true);
          res.body.resume();
        });
      }, 1000);
    });
  });
});

lastModifiedServer.unref();
