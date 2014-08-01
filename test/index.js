'use strict';

var assert = require('assert');
var request = require('../');

request('GET', 'http://example.com').on('response', function (res) {
  console.log('response A');
  assert(res.statusCode === 200);
  res.resume();
}).end();

request('GET', 'https://www.promisejs.org').on('response', function (res) {
  console.log('response B');
  assert(res.statusCode === 200);
  res.resume();
}).end();
