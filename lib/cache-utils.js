'use strict';

var cacheControlUtils = require('./cache-control-utils');

function extractHeaderNames(vary){
  return vary.split(',').map(function (header) { return header.trim().toLowerCase(); });
}
function extractHeaderValues(keys, headers){
  var values = Array(keys.length);
  for(var header in headers){
    var i = keys.indexOf(header.toLowerCase());
    if(~i){ values[i] = headers[header]; }
  }
  return values;
}
exports.varyingValues = function (vary, headers) {
  var keys = extractHeaderNames(vary);
  return extractHeaderValues(keys, headers).join(',');
};
exports.varyingHeaders = function (requestHeaders, responseHeaders) {
  if (responseHeaders && responseHeaders['vary']) {
    var keys = extractHeaderNames(responseHeaders['vary']).sort();
    var values = extractHeaderValues(keys, requestHeaders);
    return [keys.join(','),values.join(',')];
  } else {
    return ['',''];
  }
};
exports.isMatch = function (requestHeaders, cachedResponse) {
  if (cachedResponse.headers['vary'] && cachedResponse.requestHeaders) {
    var keys = extractHeaderNames(cachedResponse.headers['vary']);
    var requestValues = extractHeaderValues(keys, requestHeaders);
    var responseValues = extractHeaderValues(keys, cachedResponse.requestHeaders);
    return requestValues.join(',') === responseValues.join(',');
  } else {
    return true;
  }
};
exports.isExpired = function (cachedResponse) {
  var policy = cacheControlUtils.cachePolicy(cachedResponse);
  if (policy) {
    var time = (Date.now() - cachedResponse.requestTimestamp) / 1000;
    if (policy.maxage > time) {
      return false;
    }
  }
  if (cachedResponse.statusCode === 301 || cachedResponse.statusCode === 308) return false;
  return true;
};
exports.canCache = function (res) {
  if (res.headers['etag']) return true;
  if (res.headers['last-modified']) return true;
  if (cacheControlUtils.isCacheable(res)) return true;
  if (res.statusCode === 301 || res.statusCode === 308) return true;
  return false;
};
