'use strict';

/*
  
  This "legacy" memory cache module implements the cache-by-URL interface which does not account for Varying headers
  
*/
var PassThrough = require('stream').PassThrough;
var concat = require('concat-stream');

module.exports = MemoryCache;
function MemoryCache() {
  this._cache = {};
}

MemoryCache.prototype.getResponse = function (url, callback) {
  var cache = this._cache;
  if (cache[url]) {
    var body = new PassThrough();
    body.end(cache[url].body);
    callback(null, {
      statusCode: cache[url].statusCode,
      headers: cache[url].headers,
      body: body,
      requestHeaders: cache[url].requestHeaders,
      requestTimestamp: cache[url].requestTimestamp
    });
  } else {
    callback(null, null);
  }
};
MemoryCache.prototype.setResponse = function (url, response) {
  var cache = this._cache;
  response.body.pipe(concat(function (body) {
    cache[url] = {
      statusCode: response.statusCode,
      headers: response.headers,
      body: body,
      requestHeaders: response.requestHeaders,
      requestTimestamp: response.requestTimestamp
    };
  }));
};
MemoryCache.prototype.invalidateResponse = function (url, callback) {
  var cache = this._cache;
  delete cache[url];
  callback(null, null);
};
