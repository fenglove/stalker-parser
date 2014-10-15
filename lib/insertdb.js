//配置文件
var defaultConfig = require('../config.json');

//引入外部依赖
var map = require('map-stream');
var Path = require('path');
var Commander = require('commander');
var Queue = require('queue');
var fs = require('fs');
//引入lib
var walker = require('./walker');
var detector = require('./detector');
var Query = require('./query');
var DB = require('./db');



function parser(filename, opt) {
    if (!filename) {
        //log文件路径
        filename = Path.join(__dirname, '../../logs/stalker.log');
        console.log('log file is empty!');
    }
    var type = opt.type || 'feature';
    //使用config文件
    var execPath = process.cwd();
    var config = opt.config;
    if (config && typeof config === 'string' && fs.existsSync(config)) {
        config = require(Path.resolve(execPath, config));
    } else {
        //查找执行路径下是否存在config.json

        var configPath = Path.join(execPath, 'config.json');
        if (fs.existsSync(configPath)) {
            config = require(configPath);
        } else {
            //使用默认
            config = defaultConfig;
        }

    }
    //数据库
    //设置数据库，对象池链接时间10秒
    var db = new DB(config.database, config.database_timeout);
    var table = config.database.table;
    var queryMap = config.query_map[type] || {};
    walker(filename).pipe(detector).pipe(Query).pipe(map(parser.do(db, table, queryMap, opt.concurrency)));
}

parser.do = function(db, table, queryMap, concurrency) {
    //并发一次的队列
    queryMap = queryMap || {};

    return function(data, callback) {
        var time = getPhpTimestamp(data.time_local);
        var userAgent = data.userAgent;
        var fields = [
            'user_agent',
            'access_time',
            'ip',
            'device_name',
            'device_version',
            'device_fullversion',
            'os_name',
            'os_version',
            'os_fullversion',
            'browser_name',
            'browser_version',
            'browser_fullversion'
        ];
        var values = [
            data.http_user_agent,
            time,
            data.remote_addr,
            userAgent.device.name,
            userAgent.device.version,
            userAgent.device.fullVersion,
            userAgent.os.name,
            userAgent.os.version,
            userAgent.os.fullVersion,
            userAgent.browser.name,
            userAgent.browser.version,
            userAgent.browser.fullVersion
        ];
        //将url的query信息和config的hashmap对应
        var query = data.url.query;
        for (var i in queryMap) {
            if (queryMap[i] && queryMap.hasOwnProperty(i) && query[i]) {
                fields.push(queryMap[i].filed);
                values.push(query[i]);
            }
        }
        values = values.map(function(v) {
            if (typeof v === 'number' && isNaN(v)) {
                return '';
            }
            return v;
        });
        var sql = 'insert into `' + table + '` (' + fields.join(',') + ') values (' + (new Array(fields.length + 1)).join('?').split('').join(',') + ')';
        //进行数据库操作
        db.query(sql, values, function(err) {
            if (err) {
                if (err.code === 'ER_NO_SUCH_TABLE') {
                    console.log(sql);
                } else {
                    console.log(err, sql, values);
                }
            } else {
                console.log(time + ' → success');
            }
            err = null;
        });

        callback(null, data);
    };
};
module.exports = parser;

function getPhpTimestamp(time) {
    //处理成php毫秒级时间戳
    time = time.replace(/\d+\/\w+\/\d{4}:/, function(a) {
        a = a.split(':').join(' ')
        return a;
    });
    time = new Date(time);
    time = +time;
    if (isNaN(time)) {
        time = 0;
    }
    time = time / 1000;
    return time;
}
