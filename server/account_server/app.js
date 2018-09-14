var db = require('../utils/db');
var logdb = require('../utils/logdb');
var http = require('../utils/http');
var logger = require('./log.js').accountlog;
var log_logger = require('./log.js').log_log;
var log_http =require('./log.js').log_http;
var log_manager = require('../common/log_manager');
var configs = require(process.argv[2]);
var config = configs.account_server();
var as = require('./account_server');
var dapi = require('./dealer_api');


db.init(configs.mysql(),logger,'ACCOUNT');
logdb.init(configs.mysqllog(),log_logger,'ACCOUNT');
http.init(log_http,"ACCOUNT");
log_manager.init(log_logger,'ACCOUNT');
as.start(config);
dapi.start(config);