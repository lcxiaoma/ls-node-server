var log4js = require('log4js');
var log4js_config = require('../config/log4js.json')
log4js.configure(log4js_config);


var consoleLog = log4js.getLogger('console');
var accountLog = log4js.getLogger('account');
var log_hall = log4js.getLogger('hall');
var log_sc_majiang = log4js.getLogger('sichuan_majiang');
var log_poker_running = log4js.getLogger('poker_running');
var log_poker_landlord = log4js.getLogger('poker_landlord');
var log_poker_ox = log4js.getLogger('poker_ox');
var log_poker_goldflower = log4js.getLogger('poker_goldflower');
var log_poker_taxas = log4js.getLogger('poker_taxas');
var log_poker_21 = log4js.getLogger('poker_21');
var log_pay = log4js.getLogger('pay');
var log_log = log4js.getLogger('log');
var log_http = log4js.getLogger('http');
var log_init = log4js.getLogger('init');
var log_shisanshui = log4js.getLogger('shisanshui');

exports.logger = consoleLog;
exports.accountlog =accountLog;
exports.log_hall =log_hall;
exports.log_sc_majiang =log_sc_majiang;
exports.log_poker_running =log_poker_running;
exports.log_poker_landlord = log_poker_landlord;
exports.log_poker_ox = log_poker_ox;
exports.log_poker_goldflower = log_poker_goldflower;
exports.log_poker_taxas = log_poker_taxas;
exports.log_poker_21=log_poker_21;
exports.log_pay = log_pay;
exports.log_log = log_log;
exports.log_http = log_http;
exports.log_init = log_init;
exports.log_shisanshui = log_shisanshui;
