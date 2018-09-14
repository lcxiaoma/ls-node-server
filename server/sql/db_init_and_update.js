var mysql = require('mysql');
var path = require('path');
var configs = require(process.argv[2]);
var crypto = require('../utils/crypto.js');
var logger = require('../utils/log.js').log_init;


function init(config){
    logger.debug("HOST:",config.HOST);
    logger.debug("PORT:",config.PORT);
    logger.debug("DB  :",config.DB);
    logger.debug("USER:",config.USER);
    logger.debug("PSWD:",config.PSWD);

    create_databse(config);

    return true;
}

function create_databse(config){
    var sql = 'CREATE DATABASE IF NOT EXISTS '+config.DB;

    var uname =crypto.deCrypt('aes-256-cbc',config.USER);
    var upass =crypto.deCrypt('aes-256-cbc',config.PSWD);

    var connection = mysql.createConnection({
        host: config.HOST,
        // user: config.USER,
        // password: config.PSWD,
        user:uname,
        password:upass,
        database: '',
        port: config.PORT,
        multipleStatements:true,
    });
    connection.connect();

    connection.query(sql,function(err,rows,fields){
        if(err){
            logger.error('create database filed');
        }else{
            logger.debug('create database success');
            init_database(config);
        }
    });
    connection.end();
}

function init_database(config){

    var uname =crypto.deCrypt('aes-256-cbc',config.USER);
    var upass =crypto.deCrypt('aes-256-cbc',config.PSWD);

    var connection = mysql.createConnection({
    host: config.HOST,
    // user: config.USER,
    // password: config.PSWD,
    user:uname,
    password:upass,
    database: config.DB,
    port: config.PORT,
    multipleStatements:true,
    });

    connection.connect();
    //get sql file
    var rf = require("fs");
    var filename = path.normalize(__filename+'/../'+config.init_file);
    var data = rf.readFileSync(filename,"utf8");
    // /[\'\"\\\/\b\f\n\r\t]/g
    data= data.replace(/[\n\t\r]/g, ' ');
    var result = data.split('//');

    //onsole.log(result);

    //run init and update
    var length = result.length;
    var i =0;
    logger.debug("All SQL: ",length);
    for (;i<length;++i){
        try {
            connection.query(result[i],function(err,rows,fields){
                if(err){
                    logger.warn(err.message);
                    //console.log(err.stack);
                }else{
                    logger.debug("SQL: ",i," success"); 
                }
            })      
        } catch (error) {
            logger.trace(error.stack)
        }
    }

    connection.end();

    // logger.info("Script run end!");

    // var crypt = require('../utils/crypto.js');

    // var str = "root";
    // var enstr =crypt.enCrypt('aes-256-cbc',str)

    // logger.trace("encrypt str %s",enstr);

    // var destr = crypt.deCrypt('aes-256-cbc',enstr);
    // logger.log("decrypt str %s",destr);


    // var protect = require('../utils/protected.js');

    // var func = function(args){
    //     var b =a+1;
    // };

    // protect.RunFuncSafe(func,[1,0]);
}

//init game DB
var config_init = configs.mysql();
config_init.init_file = "db_init.sql";
init(config_init);

//init log DB
var config_init_log = configs.mysqllog();
config_init_log.init_file = "db_log_init.sql";
init(config_init_log);