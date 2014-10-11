var $ = {
    getVersion: function(str) {
        str = String(str);
        var a;
        var back = 0;
        if (!str.length) {
            return back;
        }
        if (a = /([\d+.]+)_(?:diordna|enohpi)_/.exec(str)) {
            a = a[1].split('.');
            back = a.reverse().join('.');
        } else if (a = /baiduboxapp\/([\d+.]+)/.exec(str)) {
            back = a[1];
        }
        return back;
    }
};

module.exports = $;
