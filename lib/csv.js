//配置文件
var defaultConfig = require('../config.json');

//引入外部依赖
var map = require('map-stream');
var Path = require('path');
var Commander = require('commander');
var fs = require('fs');
//引入lib
var walker = require('./walker');
var detector = require('./detector');
var Query = require('./query');



function CSVer(filename, opt) {
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
    var queryMap = config.query_map[type] || {};
    var orderMap = config.fields_order_map[type] || [];

    var outputFileName = opt.output || 'output.csv';


    walker(filename).pipe(detector)
        .pipe(Query)
        .pipe(map(CSVer.do(queryMap, orderMap, opt)))
        .pipe(fs.createWriteStream(outputFileName));
}

CSVer.do = function(queryMap, orderMap, options) {
    options = options || {};
    return function(data, callback) {
        var time = getPhpTimestamp(data.time_local);
        var userAgent = data.userAgent;
        var fields = {
            'user_agent': getValue(data.http_user_agent),
            'access_time': getValue(time),
            'ip': getValue(data.remote_addr),
            'device_name': getValue(userAgent.device.name),
            'device_version': getValue(userAgent.device.version),
            'device_fullversion': getValue(userAgent.device.fullVersion),
            'os_name': getValue(userAgent.os.name),
            'os_version': getValue(userAgent.os.version),
            'os_fullversion': getValue(userAgent.os.fullVersion),
            'browser_name': getValue(userAgent.browser.name),
            'browser_version': getValue(userAgent.browser.version),
            'browser_fullversion': getValue(userAgent.browser.fullVersion)
        };

        //将url的query信息和config的hashmap对应
        var query = data.url.query;
        for (var i in queryMap) {
            if (queryMap.hasOwnProperty(i)) {
                fields[queryMap[i].filed] = getValue(query[i]);
            }
        }

        var result = orderMap.map(function(key) {
            return fields[key] ? fields[key] : getValue();
        }).join(',') + '\n';
        if (('view' in options)) {
            process.stdout.write('.');
        }
        callback(null, result);
    };
};
module.exports = CSVer;

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

function getValue(v) {
    if ((typeof v === 'number' && isNaN(v)) || typeof v === 'undefined' || v === '') {
        return '""';
    }
    v = String(v).replace(/"/g, '\"');
    return '"' + v + '"';
}