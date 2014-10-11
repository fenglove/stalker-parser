'use strict';
//解析userAgent
var map = require('map-stream');
var Detector = require('stalker-detector');
module.exports = map(function(line, callback) {
    if (line.http_user_agent) {
        var userAgent = Detector.parse(line.http_user_agent);
        line.userAgent = userAgent;
    }
    callback(null, line);
});
