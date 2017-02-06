'use strict';

var MemoryCache = require('../lib/memory-cache');
module.exports = InvalidationFailCache;
function InvalidationFailCache(){
    MemoryCache.call(this);
    InvalidationFailCache.constructor = InvalidationFailCache;
}
InvalidationFailCache.prototype = new MemoryCache();
InvalidationFailCache.prototype.invalidateResponse = function (url, callback) {
    callback( new Error( 'Invalidation failed' ) );
};
