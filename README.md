# http-basic

Simple wrapper arround http.request/https.request

[![Build Status](https://img.shields.io/travis/ForbesLindesay/http-basic/master.svg)](https://travis-ci.org/ForbesLindesay/http-basic)
[![Dependency Status](https://img.shields.io/gemnasium/ForbesLindesay/http-basic.svg)](https://gemnasium.com/ForbesLindesay/http-basic)
[![NPM version](https://img.shields.io/npm/v/http-basic.svg)](https://www.npmjs.org/package/http-basic)

## Installation

    npm install http-basic

## Usage

```js
var request = require('http-basic');

var options = {followRedirects: true, gzip: true, cache: 'memory'};

var req = request('GET', 'http://example.com', options, function (err, res) {
  if (err) throw err;
  console.dir(res.statusCode);
  res.body.resume();
});
req.end();
```

**method:**

The http method (e.g. `GET`, `POST`, `PUT`, `DELETE` etc.)

**url:**

The url as a string (e.g. `http://example.com`).  It must be fully qualified and either http or https.

**options:**

 - `headers` - (default `{}`) http headers
 - `agent` - (default: `false`) controlls keep-alive (see http://nodejs.org/api/http.html#http_http_request_options_callback)
 - `followRedirects` - (default: `false`) - if true, redirects are followed (note that this only affects the result in the callback)
 - `gzip` (default: `false`) - automatically accept gzip and deflate encodings.  This is kept completely transparent to the user.
 - `cache` - (default: `null`) - `'memory'` or `'file'` to use the default built in caches or you can pass your own cache implementation.

**callback:**

The callback is called with `err` as the first argument and `res` as the second argument. `res` is an [http-response-object](https://github.com/ForbesLindesay/http-response-object).  It has the following properties:

 - `statusCode` - a number representing the HTTP Status Code
 - `headers` - an object representing the HTTP headers
 - `body` - a readable stream respresenting the request body.

**returns:**

If the method is `GET`, `DELETE` or `HEAD`, it returns `undefined`.

Otherwise, it returns a writable stream for the body of the request.

## Implementing a Cache

A `Cache` is an object with two methods:

 - `getResponse(url, callback)` - retrieve a cached response object
 - `setResponse(url, response)` - cache a response object

A cached response object is an object with the following properties:

 - `statusCode` - Number
 - `headers` - Object (key value pairs of strings)
 - `body` - Stream (a stream of binary data)
 - `requestHeaders` - Object (key value pairs of strings)
 - `requestTimestamp` - Number

`getResponse` should call the callback with an optional error and either `null` or a cached response object, depending on whether the url can be found in the cache.  Only `GET`s are cached.

`setResponse` should just swallow any errors it has (or resport them using `console.warn`).

## License

  MIT
