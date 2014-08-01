'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var Response = require('http-response-object');

module.exports = FileCache;
function FileCache(location) {
  this._location = location;
}

FileCache.prototype.getResponse = function (url, callback) {
  var key = path.resolve(this._location, getCacheKey(url));

  fs.readFile(key + '.json', 'utf8', function (err, res) {
    if (err && err.code === 'ENOENT') return callback(null, null);
    else if (err) return callback(err);
    try {
      res = JSON.parse(res);
    } catch (ex) {
      return callback(ex);
    }
    var body = fs.createReadStream(key + '.body');
    res.body = body;
    callback(null, res);
  });
};
FileCache.prototype.setResponse = function (url, response) {
  var key = path.resolve(this._location, getCacheKey(url));
  var errored = false;

  fs.mkdir(this._location, function (err) {
    if (err && err.code !== 'EEXIST') {
      console.warn('Error creating cache: ' + err.message);
      return;
    }
    rm(key + '.body', key + '.json', function () {
      response.body.pipe(fs.createWriteStream(key + '.body')).on('error', function (err) {
        errored = true;
        console.warn('Error writing to cache: ' + err.message);
      }).on('close', function () {
        if (!errored) {
          fs.writeFile(key + '.json', JSON.stringify({
            statusCode: response.statusCode,
            headers: response.headers,
            requestHeaders: response.requestHeaders,
            requestTimestamp: response.requestTimestamp
          }, null, '  '), function (err) {
            if (err) {
              console.warn('Error writing to cache: ' + err.message);
            }
          });
        }
      });
    });
  });
};

function getCacheKey(url) {
  var hash = crypto.createHash('sha512')
  hash.update(url)
  return hash.digest('hex')
}

function rm(a, b, cb) {
  var remaining = 2;
  fs.unlink(a, function (err) {
    if (!err || err.code === 'ENOENT') {
      if (0 === --remaining) cb();
    }
  });
  fs.unlink(b, function (err) {
    if (!err || err.code === 'ENOENT') {
      if (0 === --remaining) cb();
    }
  });
}
