var walker = require('../lib/walker');
var detector = require('../lib/detector');
var query = require('../lib/query');
var map = require('map-stream');
var Path = require('path');
var logPath = Path.join(__dirname, '../../logs/tracker.log');
var DB = require('../lib/db');
var Queue = require('queue');
//数据库
var dbConfig = {
    connectionLimit: 10,
    host: 'localhost',
    port: 3306,
    user: 'root',
    passord: '',
    database: 'tracker'
};

//设置数据库，对象池链接时间10秒
var db = new DB(dbConfig, 10e3);
//并发一次的队列
var queue = new Queue({
    concurrency: 1
});
walker(logPath).pipe(detector).pipe(query).pipe(map(function(data) {
    queue.push(function(cb) {
        var time = data.time_local.replace(/\d+\/\w+\/\d{4}:/, function(a) {
            a = a.split(':').join(' ')
            return a;
        });
        time = new Date(time);
        time = +time;
        if (isNaN(time)) {
            time = 0;
        }
        time = time / 1000;
        var userAgent = data.userAgent;
        db.query('insert into test (user_agent, time, ip, device_name, device_version, os_name, os_version, browser_name, browser_version) values (?,?,?,?,?,?,?,?,?)', [data.http_user_agent, time, data.remote_addr, userAgent.device.name, userAgent.device.version, userAgent.os.name, userAgent.os.version, userAgent.browser.name, userAgent.browser.version]).then(function() {
            console.log(time + ' → success');
            cb();
        }, function(err) {
            console.log(err);
            cb();
        });
    });
    queue.start();
}));
