'use strict';
//将日志，换成按行显示对象
var fs = require('fs');
var split = require('split');
var map = require('map-stream');


function Parser(format, options) {
    var default_format = '$remote_addr - $remote_user [$time_local] ' + '"$request" $status $body_bytes_sent ' + '"$http_referer" "$http_user_agent"';
    if (typeof format === 'object' && typeof options === 'undefined') {
        options = format;
        format = default_format;
    }
    this.format = format || default_format;
    this.delimsRegExp = new RegExp(/[^\$\w+]+/g);
    this.delimeters = this.format.match(this.delimsRegExp);
    this.attrs = stripStringArray(this.format.match(/\$\w+/g), '$');

    this.fieldsToObjects = options && typeof options.fieldsToObjects === 'boolean' ? options.fieldsToObjects : false;


    this.parser = generateParseLine(this, this.delimeters, this.attrs);

}
// strips an array of strings of an unwanted pattern or value
function stripStringArray(arr, unwanted) {
    if (Array.isArray(arr)) {
        for (var i = 0; i < arr.length; i++) {
            if (typeof arr[i] === 'string') {
                arr[i] = arr[i].replace(unwanted, '');
            }
        }
        return arr;
    } else {
        return null;
    }
}

function generateParseLine(ctx, delim, attrs) {
    var ln = delim.length,
        args = 'line, callback',
        funcode = 'var that = this, a = 0, b = -1, result={}, errb = false;\n',
        i;
    for (i = 0; i < ln; i++) {
        funcode += 'b=line.indexOf(\'' + delim[i] + '\',a);\n';
        funcode += 'if(b > 0) {\nresult["' + attrs[i] + '"] = ';
        funcode += ctx.fieldsToObjects ? 'that.convertValue("' + attrs[i] + '", line.substring(a, b));' : 'line.substring(a, b);';
        funcode += '\na = b + ' + delim[i].length + ';\n} else {\nerrb = true;\n}\n';
    }
    funcode += ctx.originalText ? 'result.__originalText = line;\n' : '';
    funcode += '\nif(!errb) {\nif(typeof callback === "function") {\n\tcallback(null, result);\n}\n}';
    funcode += '\nelse {\nvar err = new Error("invalid Line: " + line);';
    funcode += '\nif(typeof callback === "function") {\n\tcallback(err, result);\n} \n}';
    //for the sake of Maintenance, uncomment this log statement and run a demo to see how this function would look like based on your nginx_access log format
    // console.log(funcode);
    return Function.apply(ctx, [args, funcode]);
}

//converts each value to an appriopriate object based on the attribute
Parser.prototype.convertValue = function(attr, value) {
    // I am not sure if that's gonna work for all values, most of them are good as strings,
    // but I can probably parse the time for now and the integers
    // that won't work if you can customize your Nginx attributes, you will get back the same value passed it.
    if ('-' === value) {
        return null;
    }
    if (attr === 'time_local') {
        return this.parseDate(value);
    }
    if (attr === 'body_bytes_sent' || attr === 'status') {
        return parseInt(value, 10);
    }
    return value;
}

//parses data from the default nginx date format
Parser.prototype.parseDate = function(value) {
    var f = value.match(/(-*[^(\W+)]+)/g);
    if (f.length === 7) {
        value = new Date(f[0] + ' ' + f[1] + ' ' + f[2] + ' ' + f[3] + ':' + f[4] + ':' + f[5] + ' GMT' + f[6]);
    }
    return value;
}



module.exports = function(filename, options) {
    options = typeof options === 'object' ? options : {};
    var encoding = options.encoding || 'utf-8';
    var p = new Parser(options.format);

    return fs.createReadStream(filename, {
        encoding: encoding
    }).pipe(split()).pipe(map(function(data, callback) {
        //判断长度，防止长度太短，进入下一步逻辑导致错误
        data.length > 10 ? callback(null, data) : null;
    })).pipe(map(p.parser));

};
