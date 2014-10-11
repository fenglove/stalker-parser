//配置文件
var defaultConfig = require('../config.json');

//引入外部依赖
var map = require('map-stream');
var Path = require('path');
var Commander = require('commander');
var Queue = require('queue');
var fs = require('fs');
//引入lib
var walker = require('../lib/walker');
var detector = require('../lib/stalker-detector');
var Query = require('../lib/query');
var DB = require('../lib/db');



function parser(filename, opt) {
    if (!filename) {
        //log文件路径
        filename = Path.join(__dirname, '../../logs/stalker.log');
        console.log('log file is empty!');
    }
    var type = opt.type || 'feature';
    //使用config文件
    var config = opt.config;
    if (config && typeof config === 'string' && fs.existsSync(config)) {
        config = require(config);
    } else {
        //查找执行路径下是否存在config.json
        var execPath = process.cwd();
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
    var queryMap = config.query_map[type] || {};
    walker(filename).pipe(detector).pipe(Query).pipe(map(parser.do(db, queryMap)));
}

parser.do = function(db, queryMap) {
    //并发一次的队列
    var queue = new Queue({
        concurrency: 1
    });
    queryMap = queryMap || {};

    return function(data) {
        queue.push(function(cb) {
            var time = getPhpTimestamp(data.time_local);
            var userAgent = data.userAgent;
            var fields = [
                'user_agent',
                'time',
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
                    fileds.push(queryMap[i]);
                    values.push(query[i]);
                }
            }
            var sql = 'insert into test (' + fields.join(',') + ') values (' + (new Array(fields.length + 1)).join('?').split('').join(',') + ')';
            //进行数据库操作
            db.query(sql, values).then(function() {
                console.log(time + ' → success');
                cb();
            }, function(err) {
                console.log(err);
                cb();
            });
        });
        queue.start();
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