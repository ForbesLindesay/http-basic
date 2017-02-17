'use strict';

var PassThrough = require('stream').PassThrough;
var concat = require('concat-stream');
var cacheUtils = require( "./cache-utils" );

module.exports = MemoryCache;
function MemoryCache() {
  this._cache = {};
}

MemoryCache.prototype.getResponse = function (url, requestHeaders, callback) {
  var cache = this._cache;
  var urlCache = cache[url] || {};
  var found = false;
  for(var vary in urlCache){
    var requestValues = cacheUtils.varyingValues(vary, requestHeaders);
    if( requestValues in urlCache[vary] ) {
      var varyingUrlCache = urlCache[vary][requestValues];
      var body = new PassThrough();
      body.end(varyingUrlCache.body);
      callback(null, {
        statusCode: varyingUrlCache.statusCode,
        headers: varyingUrlCache.headers,
        body: body,
        requestHeaders: varyingUrlCache.requestHeaders,
        requestTimestamp: varyingUrlCache.requestTimestamp
      });
      found = true;
      break;
    }
  }
  if(!found) { callback(null, null); }
};
MemoryCache.prototype.setResponse = function (url, response) {
  var cache = this._cache;
  var urlCache = cache[url] = cache[url] || {};
  var varyingHeaders = cacheUtils.varyingHeaders(response.requestHeaders, response.headers);
  var varyingUrlCache = urlCache[varyingHeaders[0]] = urlCache[varyingHeaders[0]] || {};
  response.body.pipe(concat(function (body) {
    varyingUrlCache[varyingHeaders[1]] = {
      statusCode: response.statusCode,
      headers: response.headers,
      body: body,
      requestHeaders: response.requestHeaders,
      requestTimestamp: response.requestTimestamp,
      varyingHeaders: varyingHeaders
    };
  }));
};
MemoryCache.prototype.invalidateResponse = function (url, callback) {
  var cache = this._cache;
  delete cache[url];
  callback(null, null);
};
