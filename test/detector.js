var ua = ['Mozilla/5.0 (iPhone; CPU iPhone OS 6_1 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Mobile/10B142 baiduboxapp/0_0.0.4.5_enohpi_069_046/1.6_1C2%254enohPi/1099a/5118989F3E09E5BF7D0E2FF144D44E1B712869C28OGLCRSENEA/1',
    'Mozilla/5.0 (Linux; U; Android 4.1.1; zh-cn; SCH-N719 Build/JRO03C) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30 T5/2.0 baiduboxapp/5.1 (Baidu; P1 4.1.1)',
    'Mozilla/5.0 (Linux; Android 4.3; Nexus 10 Build/JSS15Q) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.72 Safari/537.36'
];
var detector = require('detector');
ua.forEach(function(v) {
    console.log(detector.parse(v));
});
