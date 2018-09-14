var mysql = require('mysql');
var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database:'game_db_100001',
    port: 3306
});
conn.connect();
// conn.query('SELECT * FROM account', function(err, rows, fields) {
//     if (err) throw err;
//     console.log('The solution is: ', rows[0].account);
// });


var user_id =10000;
var lose_ingot =1;
var sql = 'call lose_ingot(?,?)';

conn.query(sql,[user_id,lose_ingot],function(err,rows,fields){
    // console.log(err);
    console.log(rows);
    // console.log(fields);
    console.log(rows[0]);
    console.log(rows[0][0].result)
});
conn.end();