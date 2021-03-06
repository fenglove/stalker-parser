//配置文件
var defaultConfig = require('../config.json');

//引入外部依赖
var Path = require('path');
var fs = require('fs');
var URL = require('url');
var map = require('map-stream');
var Commander = require('commander');
var ipfinder = require('stalker-ipfind');
//引入lib
var walker = require('./walker');
var detector = require('./detector');
var Query = require('./query');
var $ = require('./helper');



function CSVer(filename, opt) {
    if (!filename) {
        //log文件路径
        filename = Path.join(__dirname, '../../logs/stalker.log');
        console.log('log file is empty!');
    }
    var type = opt.type || 'feature';
    // console.log(opt);
    ipfinder.loadData(opt.ipdata || './ip.dat');

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
        var time = $.getPhpTimestamp(data.time_local);
        var userAgent = data.userAgent || {
            device: {}
        };
        var ip = data.remote_addr;
        var ipArr = ip.split(',');
        if (ipArr.length > 1) {
            data.remote_addr = ip = ipArr[1];
        }
        var fields = {
            // 'user_agent': getValue(data.http_user_agent),
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
        // 处理android很多device_fullVersion为空的情况
        if ((!userAgent.device.version || userAgent.device.version == -1) &&
            (userAgent.device.fullVersion && userAgent.device.fullVersion != -1)
        ) {
            fields.device_version = getValue(userAgent.device.fullVersion);
        }
        if (userAgent.device.version == -1 && userAgent.device.name !== 'iphone') {
            fields.user_agent = getValue(data.http_user_agent);
        } else {
            fields.user_agent = '""'; //保持数据库体积
        }
        if (userAgent.device.name === 'na') {
            fields.device_name = '""';
        }
        if (userAgent.browser.name === 'na') {
            fields.browser_name = '""';
        }
        if (userAgent.os.name === 'na') {
            fields.os_name = '""';
        }
        ipArr = ip.split('.');
        if (ipArr[0] == 10 || (ipArr[0] == 192 && ipArr[1] == 168) || options.type !== 'hijack') {
            var ipData = ['', '', '', ''];
        } else {
            ip = String(ip);
            var ipData = ipfinder.findSync(ip.trim());
        }


        fields.isp = getValue(ipData[0]);
        fields.province = getValue(ipData[1]);
        fields.city = getValue(ipData[2]);
        fields.county = getValue(ipData[3]);

        //将url的query信息和config的hashmap对应
        var query = data.url.query;
        //特殊处理iphone
        if (userAgent.device.name.toLowerCase() === 'iphone') {
            fields.device_version = getValue($.getIphoneVersion(query.ds, query.dpr));
        }
        for (var i in queryMap) {
            if (queryMap.hasOwnProperty(i)) {
                fields[queryMap[i].field] = getValue(query[i]);
                // console.log(queryMap[i].field);
            }
        }
        if (options.type === 'hijack' && typeof query === 'object') {
            try {
                var content = decodeURIComponent(query.files);
            } catch (e) {
                content = query.files;
            }
            fields.content = getValue(content);
            content = content.split(',');
            var unique = {};
            var hostArr = content.map(function(v) {
                v = v.trim();
                if (!v) {
                    return '';
                }
                try {
                    var a = URL.parse(v);
                } catch (e) {
                    return '';
                }

                var host = a.hostname;
                if (unique[host]) {
                    return '';
                } else {
                    unique[host] = 1;
                    return host;
                }
            }).filter(function(v) {
                return v;
            });


            fields.host1 = getValue(hostArr[0]);
            fields.host2 = getValue(hostArr[1]);
        }
        var result = orderMap.map(function(key) {
            return fields[key] ? fields[key] : getValue();
        }).join(',') + '\n';
        // console.log(result);
        if (('view' in options)) {
            process.stdout.write('.');
        }
        callback(null, result);
    };
};
module.exports = CSVer;



function getValue(v) {
    if ((typeof v === 'number' && isNaN(v)) || typeof v === 'undefined' || v === '') {
        return '""';
    }
    v = String(v).trim().replace(/"/g, '\"');
    return '"' + v + '"';
}
