/**
 * 服务器日志管理
 * **/

var logdb = require('../utils/logdb');
var logger  = null;

exports.init = function(log,where){
    logger = log;
    logger.info('%s LOG MANAGER READY.',where);
}
////////////////////////插入记录////////////////////////////////////
exports.insert_ingot_log = function(user_id,from,to,event_type,value,then_value){
    logdb.insert_ingot_log(user_id,from,to,event_type,value,then_value);
}

exports.insert_gold_log = function(user_id,from,to,event_type,value,then_value){
    logdb.insert_gold_log(user_id,from,to,event_type,value,then_value)
}

exports.insert_login_log = function(user_id,platform,channel,reg_time){
    logdb.login_log(user_id,platform,channel,reg_time);
}

exports.insert_new_come = function(user_id,platform,channel,reg_time){
    logdb.reg_log(user_id,platform,channel,reg_time);
}

exports.insert_route_log = function(ret){
    logdb.insert_route_log(ret);
}

////////////////////插入开房次数////////////////////////////////////
exports.insert_create_room_log = function(user_id,game_type,type_index,rule_index,room_id){
    logdb.insert_create_room_log(user_id,game_type,type_index,rule_index,room_id);
}

/////////////////////////////获取记录////////////////////////////////
exports.get_route_log = function(user_id,callback){
    logdb.get_route_log(user_id,function(ret){
        callback(ret);
    })
}