'use strict';

var parseUrl = require('url').parse;
var protocols  = {http: require('http'), https: require('https')};

module.exports = request;
function request(method, url, options) {
  if (typeof method !== 'string') {
    throw new TypeError('The method must be a string.');
  }
  if (typeof url !== 'string') {
    throw new TypeError('The URL/path must be a string.');
  }
  if (options === null || options === undefined) {
    options = {};
  }
  if (typeof options !== 'object') {
    throw new TypeError('options must be an object (or null)');
  }

  url = parseUrl(url);

  var headers = options.headers || {};
  var agent = 'agent' in options ? options.agent : false;

  return protocols[url.protocol.replace(/\:$/, '')].request({
    host: url.host,
    port: url.port,
    path: url.path,
    method: method.toUpperCase(),
    headers: headers,
    agent: agent
  });
}
