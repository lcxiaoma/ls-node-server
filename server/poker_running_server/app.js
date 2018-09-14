var http_service = require("./http_service");
var socket_service = require("./socket_service");
var configs = require(process.argv[2]);
var server_index = Number(process.argv[3]);
if (!server_index) server_index = 0;
var config = configs.game_server_poker()[server_index];
var logger = require('./log.js').log_poker_running;
var log_logger = require('./log.js').log_log;
var log_http = require('./log').log_http;
var db = require('../utils/db');
var logdb = require('../utils/logdb');
var log_manager = require('../common/log_manager');
var http = require('../utils/http');

db.init(configs.mysql(), logger, 'POKER RUNNING');
logdb.init(configs.mysqllog(),log_logger)
log_manager.init(log_logger,'POKER RUNNING');
http.init(log_http,'POKER RUNNING');
http_service.start(config);
socket_service.start(config);