var mysql = require('mysql');

function DB(config, timeout) {
    this.pool = null;
    this.pool = mysql.createPool(config);
    this.timeout = timeout;
    this.timer = null;
}

DB.prototype.query = function(query, params, callback) {
    var self = this;
    params = params || [];
    if (this.timer) {
        clearTimeout(this.timer);
    }
    this.pool.getConnection(function(err, con) {
        con.query(query, params, function(err) {
            con.release();
            callback(err, [].splice.call(arguments, 1));
        });
    });

    if (this.timeout) {
        //过期自动关闭对象池
        this.timer = setTimeout(function() {
            self.pool.end();
        }, this.timeout);
    }

};

module.exports = DB;
