'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var mkdirp = require('mkdirp');
var cacheUtils = require('./cache-utils');
var async = require('async');
var rimraf = require('rimraf');

var NULL_KEY = '_';

module.exports = FileCache;
function FileCache(location) {
  this._location = location;
}

/*
  Given a location for cached responses for a given URL
  For each group of Vary found:
    - if the NULL Vary header is present, just use that location
    - else try to find a group which contains response cached for the matching varying header values
*/
function matchRequestAgainstVaryingHeaders(urlCacheLocation, requestHeaders, callback)  {
  
  var res;
  var key;
  async.waterfall( [
    function(next) { fs.readdir(urlCacheLocation, next); },
    function(varyingHeadersList, next) {
      if(~varyingHeadersList.indexOf(NULL_KEY)) {
        // response does not vary by headers
        key = path.resolve([urlCacheLocation, NULL_KEY, NULL_KEY].join('/'));
        fs.readFile(key + '.json', function (err, data) {
          res = data;
          next(err, !!data);
        });
      } else {
        // need to check the varying headers
        async.detect(varyingHeadersList, function(varyingHeaders, handleDetection) {
          var vary = decodeURIComponent(varyingHeaders);
          var varyingValues = cacheUtils.varyingValues(vary, requestHeaders);
          var filename = hash(varyingValues);
          var location = path.resolve([urlCacheLocation, varyingHeaders, filename].join('/'));
          fs.readFile(location + '.json', function (err, data) {
            if( err ) { handleDetection(null, false); }
            else { 
              key = key || location;
              if( key !== location ) { 
                handleDetection(null, false);
              } else {
                res = res || data;
                handleDetection(null, true);
              }
            }
          });
        }, next );
      
      }
    }
  ], function(err){
    callback(err, key, res);
  });
  
}
FileCache.prototype.getResponse = function (url, requestHeaders, callback) {
  
  var urlHash = hash(url);
  var urlCacheLocation = path.resolve(this._location + '/' + urlHash);
  matchRequestAgainstVaryingHeaders(urlCacheLocation, requestHeaders, function(err, key, res) {
    if(err || !res) { callback(null, null); }
    else {
      try {
        res = JSON.parse(res);
      } catch (ex) {
        return callback(ex);
      }
      var body = fs.createReadStream(key + '.body');
      res.body = body;
      callback(null, res);
    }
  });
};

FileCache.prototype.setResponse = function (url, response) {

  var varyingHeaders = cacheUtils.varyingHeaders(response.requestHeaders, response.headers);
  var key = getCacheKey(url, varyingHeaders[0] || NULL_KEY, varyingHeaders[1] || NULL_KEY);
  var location = path.resolve([ this._location, key[0], key[1] ].join('/'));
  var filename = path.resolve( location + '/' + key[2] );
  var errored = false;
  mkdirp( location, function (err) {
    if (err) {
      console.warn('Error creating cache: ' + err.message);
      return;
    }
    response.body.pipe(fs.createWriteStream(filename + '.body')).on('error', function (err) {
      errored = true;
      console.warn('Error writing to cache: ' + err.message);
    }).on('close', function () {
      if (!errored) {
        fs.writeFile(filename + '.json', JSON.stringify({
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
};

FileCache.prototype.invalidateResponse = function (url, callback) {
  var key = path.resolve(this._location, hash(url));
  rimraf(key, callback);
};

function getCacheKey(url, varyingHeaders, varyingValues) {
  return [hash(url), encodeURIComponent(varyingHeaders), varyingValues === NULL_KEY ? NULL_KEY : hash(varyingValues)];
}

function hash(url) { 
  var hash = crypto.createHash('sha512')
  hash.update(url)
  return hash.digest('hex')
}
