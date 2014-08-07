'use strict';

var parseUrl = require('url').parse;
var zlib = require('zlib');
var protocols  = {http: require('http'), https: require('https')};
var PassThrough = require('stream').PassThrough;
var Response = require('http-response-object');
var cacheUtils = require('./lib/cache-utils.js');
var builtinCaches = {
  memory: new (require('./lib/memory-cache.js'))(),
  file: new (require('./lib/file-cache.js'))(__dirname + '/cache')
};

module.exports = request;
function request(method, url, options, callback) {
  if (typeof method !== 'string') {
    throw new TypeError('The method must be a string.');
  }
  if (typeof url !== 'string') {
    throw new TypeError('The URL/path must be a string.');
  }
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  if (options === null || options === undefined) {
    options = {};
  }
  if (typeof options !== 'object') {
    throw new TypeError('options must be an object (or null)');
  }

  method = method.toUpperCase();
  var urlString = url;
  url = parseUrl(urlString);

  var headers = {};
  Object.keys(options.headers || {}).forEach(function (header) {
    headers[header.toLowerCase()] = options.headers[header];
  });
  var agent = 'agent' in options ? options.agent : false;

  var cache = options.cache;
  if (typeof cache === 'string' && cache in builtinCaches) {
    cache = builtinCaches[cache];
  }
  if (cache && !(typeof cache === 'object' && typeof cache.getResponse === 'function' && typeof cache.setResponse === 'function')) {
    throw new TypeError(cache + ' is not a valid cache, caches must have `getResponse` and `setResponse` methods.');
  }

  var duplex = !(method === 'GET' || method === 'DELETE' || method === 'HEAD');

  if (options.gzip) {
    headers['accept-encoding'] = headers['accept-encoding'] ? headers['accept-encoding'] + ',gzip,deflate' : 'gzip,deflate';
    return request(method, urlString, {
      headers: headers,
      agent: agent,
      followRedirects: options.followRedirects,
      cache: cache
    }, function (err, res) {
      if (err) return callback(err);
      switch (res.headers['content-encoding']) {
        case 'gzip':
          delete res.headers['content-encoding'];
          res.body = res.body.pipe(zlib.createGunzip());
          break;
        case 'deflate':
          delete res.headers['content-encoding'];
          res.body = res.body.pipe(zlib.createInflate());
          break;
      }
      return callback(err, res);
    });
  }
  if (options.followRedirects) {
    return request(method, urlString, {
      headers: headers,
      agent: agent,
      cache: cache
    }, function (err, res) {
      if (err) return callback(err);
      if (options.followRedirects && isRedirect(res.statusCode)) {
        // prevent leakage of file handles
        res.body.resume();
        return request(duplex ? 'GET' : method, res.headers.location, options, callback);
      } else {
        return callback(null, res);
      }
    });
  }
  if (cache && method === 'GET') {
    var timestamp = Date.now();
    return cache.getResponse(urlString, function (err, cachedResponse) {
      if (err) {
        console.warn('Error reading from cache: ' + err.message);
      }
      if (cachedResponse && cacheUtils.isMatch(headers, cachedResponse)) {
        if (!cacheUtils.isExpired(cachedResponse)) {
          var res = new Response(cachedResponse.statusCode, cachedResponse.headers, cachedResponse.body);
          res.fromCache = true;
          res.fromNotModified = false;
          return callback(null, res);
        } else if (cachedResponse.headers['etag']) {
          headers['if-none-match'] = cachedResponse.headers['etag'];
        }
      }
      request('GET', urlString, {
        headers: headers,
        agent: agent
      }, function (err, res) {
        if (err) return callback(err);
        if (res.statusCode === 304 && cachedResponse) { // Not Modified
          // prevent leakage of file handles
          res.body.resume();
          res = new Response(cachedResponse.statusCode, cachedResponse.headers, cachedResponse.body);
          res.fromCache = true;
          res.fromNotModified = true;
          return callback(null, res);
        } else if (cacheUtils.canCache(res)) {
          // prevent leakage of file handles
          cachedResponse && cachedResponse.body.resume();
          var cachedResponseBody = new PassThrough();
          var resultResponseBody = new PassThrough();
          res.body.on('data', function (data) { cachedResponseBody.write(data); resultResponseBody.write(data); });
          res.body.on('end', function () { cachedResponseBody.end(); resultResponseBody.end(); });
          var responseToCache = new Response(res.statusCode, res.headers, cachedResponseBody);
          var resultResponse = new Response(res.statusCode, res.headers, resultResponseBody);
          responseToCache.requestHeaders = headers;
          responseToCache.requestTimestamp = timestamp;
          cache.setResponse(urlString, responseToCache);
          return callback(null, resultResponse);
        } else {
          // prevent leakage of file handles
          cachedResponse && cachedResponse.body.resume();
          return callback(null, res);
        }
      });
    });
  }

  var responded = false;

  var req = protocols[url.protocol.replace(/\:$/, '')].request({
    host: url.host,
    port: url.port,
    path: url.path,
    method: method,
    headers: headers,
    agent: agent
  }, function (res) {
    if (responded) return res.resume();
    responded = true;
    callback(null, new Response(res.statusCode, res.headers, res));
  }).on('error', function (err) {
    if (responded) return;
    responded = true;
    callback(err);
  });

  if (duplex) {
    return req;
  } else {
    req.end();
  }
}

function isRedirect(statusCode) {
  return statusCode === 301 || statusCode === 302 || statusCode === 307 || statusCode === 308;
}
