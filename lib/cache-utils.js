'use strict';

exports.isMatch = function (requestHeaders, cachedResponse) {
  if (cachedResponse.headers['vary'] && cachedResponse.requestHeaders) {
    return cachedResponse.headers['vary'].split(',').map(function (header) { return header.trim().toLowerCase(); }).every(function (header) {
      return requestHeaders[header] === cachedResponse.requestHeaders[header];
    });
  } else {
    return true;
  }
};
exports.isExpired = function (cachedResponse) {
  var match
  if (cachedResponse.headers['cache-control'] && (match = /^public\, *max\-age\=(\d+)$/.exec(cachedResponse.headers['cache-control']))) {
    var time = (Date.now() - cachedResponse.requestTimestamp) / 1000;
    if ((+match[1]) > time) {
      return false;
    }
  }
  return true;
};
exports.canCache = function (res) {
  if (res.headers['etag']) return true;
  if (res.headers['cache-control']) return true;

  return false;
};
