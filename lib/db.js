'use strict';
/**
 * 一个promise封装的db
 * @type {[type]}
 */
var Promise = require('Q'),
    mysql = require('mysql'),
    instances = {};

function DB(config, timeout) {
    this.pool = null;
    this.pool = mysql.createPool(config);
    this.timeout = timeout;
    this.timer = null;
}


/**
 * Run DB query
 * @param  {String} query
 * @param  {Object} [params]
 * @return {Promise}
 */
DB.prototype.query = function(query, params) {
    var defer = Promise.defer();
    var self = this;
    params = params || {};
    if (this.timer) {
        clearTimeout(this.timer);
    }
    this.pool.getConnection(function(err, con) {
        if (err) {
            return defer.reject(err);
        }

        con.query(query, params, function(err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve([].splice.call(arguments, 1));
            }
            con.release();
        });

    });
    if (this.timeout) {
        //过期自动关闭对象池
        this.timer = setTimeout(function() {
            self.pool.end();
            defer.reject(new Error('pool connect is timeout'));
        }, this.timeout);
    }
    return defer.promise;
};

module.exports = DB;
