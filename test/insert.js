var DB = require('../lib/db');
var db = new DB({
    "connectionLimit": 100,
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "passord": "",
    "database": "tracker"
});

setInterval(function() {
    var count = 100;
    while (count--) {

        db.query('INSERT INTO  `tracker`.`test` (user_agent) values (?);', [1]);
    }
}, 10)
