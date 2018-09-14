var client_service = require("./client_service");
var room_service = require("./room_service");
var pay_service = require("./pay_service");
var http = require('../utils/http');
var log_manager = require('../common/log_manager');
var logger = require('./log.js').log_hall;
var log_logger = require('./log.js').log_log;
var log_http = require('./log.js').log_http;
var configs = require(process.argv[2]);
var config = configs.hall_server();
var db = require('../utils/db');
var logdb = require('../utils/logdb');

db.init(configs.mysql(),logger,"HALL");
logdb.init(configs.mysqllog(),logger,'HALL');
log_manager.init(log_logger, "HALL");
http.init(log_http, "HALL");

client_service.start(config);
room_service.start(config);
pay_service.start(config);