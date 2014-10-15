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
    },
    getPhpTimestamp: function(time) {
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
    },
    getIphoneVersion: function(screen, dpr) {
        if (!screen || !dpr) {
            return '';
        }
        screen = screen.toLowerCase();
        var version = '';
        switch (screen) {
            case '320x480':
                if (dpr == 1) {
                    version = '3GS';
                    break;
                }
                version = '4';
                break;
            case '320x568':
                version = '5';
                break;
            case '375x667':
                version = '6';
                break;
            case '414x736':
                version = '6plus';
        }
        return version;
    }
};

module.exports = $;
