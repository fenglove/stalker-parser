'use strict';
//使用URL类解析request部分内容
var map = require('map-stream');
var Url = require('url');

module.exports = map(function(line, callback) {
    if (line.request) {
        var arr = ['method', 'url', 'protocol'];
        var url = {
            query: null
        };
        var data = line.request.split(/\s+/);
        data.forEach(function(v, i) {
            if (v && arr[i]) {
                url[arr[i]] = v;
            }
        });

        if (data[1]) {
            var a = Url.parse(data[1], true);
            url.query = a.query;
            url.pathname = a.pathname;
            url.path = a.path;
            url.search = a.search;
        }
        line.url = url;
    }
    callback(null, line);
});
