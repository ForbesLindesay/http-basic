'use strict';

var assert = require('assert');
var request = require('../');
var http = require('http');
var rimraf = require('rimraf');
var path = require('path');
var async = require('async');

rimraf.sync(path.resolve(__dirname, '..', 'cache'));

var CACHED__VARY_BY_AUTH = 'http://localhost:3293/index.js';
var HEADERS__AUTH_JON = { 'Authorization': 'Basic am9uOlBAc3N3MHJk' }; // jon:P@ssw0rd
var HEADERS__AUTH_SAM = { 'Authorization': 'Basic c2FtOlBAc3N3MHJk' }; // sam:P@ssw0rd

var PORT = 3295;

var cacheControlServer = http.createServer(function(req, res){
  
  res.statusCode = 200;
  res.setHeader('cache-control', 'public,max-age=3600');
  res.setHeader('vary', 'Authorization');
  res.end(req.headers['authorization']);

});


function fetchVaryByAuth(cacheType, headers, assertions, next){
  
  request('GET', CACHED__VARY_BY_AUTH, {cache: cacheType,headers: headers}, function (err, res) {
    if (err) throw err;

    var buffer = '';
    res.body.on('data', function (chunk) { buffer += chunk; });
    res.body.on('end', function() {
      assertions(res, buffer);
      next();
    });
  });
  
}

function delayed(continuation, ms) {
  return function() { 
    var args = arguments;
    setTimeout(function(){ continuation.apply(this, args); }, ms);
  };
}

function executeForCacheType(cacheType, traceId, callback) {
  
  async.series([function(next) {
    
    fetchVaryByAuth(cacheType, HEADERS__AUTH_JON, function(res){
      console.log('response ' + traceId + '.1 (populate ' + cacheType + ' cache for user Jon)');
      assert(res.statusCode === 200);
      assert(res.fromCache === undefined, 'Expected to fetch from the server');
    }, delayed(next, 25));
    
  },function(next) {
    
    fetchVaryByAuth(cacheType, HEADERS__AUTH_SAM, function(res){
      console.log('response ' + traceId + '.2 (populate ' + cacheType + ' cache for user Sam)');
      assert(res.statusCode === 200);
      assert(res.fromCache === undefined, 'Expected to fetch from the server');
    }, delayed(next, 25));
    
  },function(next) {
      
    fetchVaryByAuth(cacheType, HEADERS__AUTH_JON, function(res, data){
      console.log('response ' + traceId + '.3 (retrieve from ' + cacheType + ' cache for user Jon)');
      assert(res.statusCode === 200);
      assert(res.fromCache === true, 'Expected to fetch from the cache');
      assert(data.toString() === HEADERS__AUTH_JON.Authorization, 'Data should match the user');
    }, next);
    
  },function(next) {
    
    fetchVaryByAuth(cacheType, HEADERS__AUTH_SAM, function(res, data){
      console.log('response ' + traceId + '.4 (retrieve from ' + cacheType + ' cache for user Sam)');
      assert(res.statusCode === 200);
      assert(res.fromCache === true, 'Expected to fetch from the server');
      assert(data.toString() === HEADERS__AUTH_SAM.Authorization, 'Data should match the user');
    }, next);
    
  }], callback);
  
}
  
cacheControlServer.listen(3293, function onListen() {
  
  async.parallel([
    
    function(next) { executeForCacheType('memory', 'Y', next); },
    function(next) { executeForCacheType('file', 'Z', next); }
    
  ], function(e) {

    if (e) { throw e; }
    cacheControlServer.unref();
    
  });
  
});
  
  