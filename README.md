# http-basic

Very low level wrapper arround http.request/https.request

[![Build Status](https://travis-ci.org/ForbesLindesay/http-basic.png?branch=master)](https://travis-ci.org/ForbesLindesay/http-basic)
[![Dependency Status](https://gemnasium.com/ForbesLindesay/http-basic.png)](https://gemnasium.com/ForbesLindesay/http-basic)
[![NPM version](https://badge.fury.io/js/http-basic.png)](http://badge.fury.io/js/http-basic)

## Installation

    npm install http-basic

## Usage

```js
var request = require('http-basic');

var req = request('GET', 'http://example.com', options);
req.on('response', function (res) {
  console.dir(res.statusCode);
});
req.on('error', function (err) {
  throw err;
});
req.end();
```

**method:**

The http method (e.g. `GET`, `POST`, `PUT`, `DELETE` etc.)

**url:**

The url as a string (e.g. `http://example.com`).  It must be fully qualified and either http or https.

**options:**

 - headers - http headers (defaults to `{}`)
 - auth - a string of the form `user:password` or an object of the form `{user: username, pass: password}`
 - agent (default: `false`)

**returns:**

[http.ClientRequest](http://nodejs.org/api/http.html#http_class_http_clientrequest)

## License

  MIT
