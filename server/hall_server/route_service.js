/**
 * 转盘服务
 * 转盘算法更新
 * 设置偏移量，屏蔽每天只来抽奖的人(每天只来抽奖的人无法获取实物奖励)
 * **/
var db = require('../utils/db');
var logger = require('./log').log_hall;
var log_manager = require('../common/log_manager');
var secret = require('../utils/secret');
var log_point = require('../config/log_point').log_point;
var global_key = require('../config/global_key').global_key;
var daily_key = require('../config/daily_key').daily_key;
var daily_value = require('../common/daily_value').daily_value;


var service_ready = false;      //服务器是否准备好
var route_config = {};          //转盘配置
var route_statistic_time = 0;     //转盘锁定时间(跨天重新统计)

var simple_route_config = [];   //简要的转盘信息

var route_array = new Array();

//压缩的落地数据，预防无法成功dump到log库的处理
var dump_data = null;

//初始化转盘配置
function init_route_config(ret) {
    //读取转盘信息
    var is_same_day = true;

    for (var a in ret) {
        var rtob = ret[a];
        route_config[rtob.route_index] = {
            id: rtob.id,
            route_index: Number(rtob.route_index),
            route_ood: Number(rtob.route_ood),
            max_hit: Number(rtob.max_hit),
            ingot_value: Number(rtob.ingot_value),
            gold_value: Number(rtob.gold_value),
            today_hit: Number(rtob.today_hit),
            route_name: rtob.route_name,
        }
        if (Number(rtob.route_ood) > 0) {
            if (Number(rtob.max_hit) == 999) {
                route_array = route_array.concat((new Array(Number(rtob.route_ood)).fill(Number(rtob.route_index))));
            } else {
                if (Number(rtob.today_hit) < Number(rtob.max_hit)) {
                    var offset = Number(rtob.max_hit) - Number(rtob.today_hit);
                    route_array = route_array.concat((new Array(offset).fill(Number(rtob.route_index))));
                }
            }
        }
    }

    console.log(route_array.length, "init route array length")

    service_ready = true;
}
//进行转盘
function route(lucky) {
    var rd_len = route_array.length;
    var rd = Math.floor(Math.random() * rd_len);

    var hit = route_array[rd];

    var hit_info = route_config[hit];

    // console.log("Hit index , hit_info",hit,hit_info) 
    // console.log(hit_info.route_name)
    ///判断lucky值，当lucky值小于10的时候，不会抽到任何实物奖励
    if(lucky <10){
        if(hit_info.gold_value ==0 && hit_info.ingot_value == 0 && hit_info.hit_index !=1){
            hit = 1;
            hit_info = route_config[hit];
        }
    }

    hit_info.today_hit += 1;

    if (hit_info.max_hit != 999) {
        //不是无限次的时候，需要去从数组中移除掉这个元素
        route_array.splice(rd, 1);
    }
    //更新对应一条记录的今日命中次数
    try_update_db_route_status(hit_info.route_index, hit_info.today_hit);

    return hit;
}

/**
 * 生成简要的转盘配置
 */
function gen_simple_route_info() {
    if (service_ready) {
        simple_route_config = Object.keys(route_config);
    }
}
//每日结算到数据库log中
function dump_daily_clear_to_db(now, callback) {
    //获取需要dump的信息
    // var data = {
    //     begin_time:route_statistic_time,
    //     end_time:now,
    // }
    // log_manager.dump_route_total_log(data,function(ret){
    //     if(ret){
    //         callback(true);
    //     }else{
    //         callback(false);
    //     }
    // });
    db.close_today_route_data(now,function(err,rows,fields){
        if(err){
            logger.error("CLOSE ROUTE DATA ERROR:",err.stack);
            callback(false);
            return;
        }
        if(rows[0][0].result == 1){
            callback(true);
            return;
        }
        callback(false);
        return;
    });
}

//尝试更新数据库中的转盘状态
function try_update_db_route_status(hit_index, hit_times) {
    db.update_route_hit_info(hit_index, hit_times);
}

//转盘状态
exports.route_state = function (account, callback) {
    if (!service_ready) {
        return;
    }
    var data = {
        account: account
    }
    gen_simple_route_info();

    // route();

    db.route_state(data, function (err, rows, fields) {
        if (err) {
            logger.error("ROUTE state:", err.stack);
            callback(false, simple_route_config);
            return;
        }
        var result = rows[0][0].result;
        if (result == 1) {
            //成功
            var day_offset = rows[0][0].day_offset;
            var share_offset = rows[0][0].share_offset;
            if (day_offset > 0 && share_offset ==0) {
                callback(true, simple_route_config);
                return;
            }
            callback(false, simple_route_config);
            return;
        } else {
            callback(false, simple_route_config);
            return;
        }
    });
}

//转盘
exports.route = function (account, callback) {
    if (!service_ready) {
        return;
    }
    var data = {
        account: account
    }
    db.route_state(data, function (err, rows, fields) {
        if (err) {
            logger.error("ROUTE :", err.stack);
            callback(false);
            return;
        }
        var result = rows[0][0].result;
        if (result == 1) {
            //成功
            var day_offset = rows[0][0].day_offset;
            var share_offset = rows[0][0].share_offset;
            var user_id = rows[0][0].user_id;
            var lucky = rows[0][0].lucky;
            console.log("userid[%d] ====>lucky[%d]",user_id,lucky);
            if (day_offset <= 0 || share_offset !=0) {
                callback(false);
                return;
            }
            // console.log(rows);
            // console.log(user_id);
            // do_route(user_id,function(ret){
            //     callback(ret);
            //     return;
            // });
            var my_hit = route(lucky);
            var hit_info = route_config[my_hit];
            var mask = '';
            var send = true;



            //添加route时间
            db.add_route_time(user_id,function(ret){
                if(ret){
                    if (!hit_info.ingot_value && !hit_info.gold_value && my_hit != 1) {
                        var rdd = account + Date.now() + my_hit;
                        mask = secret.md5_16(rdd).toUpperCase();
                        send = false;
                        //一次性消耗掉所有幸运值
                        db.cost_user_lucky(user_id,lucky);
                        //插入中奖公告
                        var message_data ={
                            type:1,
                            seq:1,
                            loop_times:10,
                            open_time:Math.floor(Date.now()/1000),
                            end_time:Math.floor(Date.now()/1000) + 1*3600*24,
                            msgtext:'恭喜玩家 '+uname+' 在转盘抽奖中抽中 ' +hit_info.route_name +'!!!!',
                            create_id:0,
                        }
                        db.web_add_message(message_data,function(err,rows,fields){
                            if(err){
                                logger.error("route add message error:",err.stack);
                            }
                        })
                    } else {
                        if (hit_info.ingot_value > 0) {
                            db.add_ingot(user_id, hit_info.ingot_value, function (ret) {
                                var ac = ret[0];
                                if (ac.gems) {
                                    log_manager.insert_ingot_log(user_id, 0, user_id, log_point.INGOT_ADD_ROUTE, hit_info.ingot_value, ac.gems)
                                }
                            });
                        }
                        if (hit_info.gold_value > 0) {
                            db.add_gold(user_id, hit_info.gold_value, function (ret) {
                                var ac = ret[0];
                                if (ac.coins) {
                                    log_manager.insert_gold_log(user_id, 0, user_id, log_point.GOLD_ADD_ROUTE, hit_info.gold_value, ac.coins)
                                }
                            });
                        }
                    }

                    //插入日志
                    //route_user_id,route_time,hit_index,hit_value,route_value,gift_mask,award_state
                    //ret.user_id,ret.action_time,ret.hit_index,ret.random_ood,0,ret.mask,award_state
                    var now = Math.floor(Date.now() / 1000);
                    var log_obj = {
                        user_id: user_id,
                        action_time: now,
                        hit_index: my_hit,
                        random_ood: 0,
                        mask: mask,
                        send: send,
                    }
                    log_manager.insert_route_log(log_obj)

                    var ret = {
                        hit_index: my_hit,
                        ingot_value: hit_info.ingot_value,
                        gold_value: hit_info.gold_value,
                        send: send,
                        mask: mask,
                    }

                    callback(ret);
                    return;
                }else{
                    callback(false);
                    return;
                }
            });

        } else {
            callback(false);
            return;
        }
    });
}


//付费转盘
exports.pay_route = function(account,callback){
    if (!service_ready) {
        return;
    }
    //TODO写死的消耗为5钻石
    var cost = 5

    db.get_gems_daily_values(account, function (data) {
		if (data != null) {
			// http.send(res, 0, "ok", { gems: data.gems, coins: data.coins });
            var my_coin = data.coins;
            var user_id = data.userid;
            var daily_value_data = {}
            if(data.daily_value && data.daily_value !=''){
                daily_value_data = data.daily_value.toString('utf8');
            }
            var daily_clear_time = data.daily_clear_time;
            var now = Math.floor(Date.now()/1000);
            var daily_clear ={};

            if(is_same_day(now,daily_clear_time)){
                if(daily_value_data != ''){
                    daily_clear = JSON.parse(daily_value_data);
                }
            }

            // console.log("daily_clear-------------------------->",daily_clear)
            var today_times = daily_value.get_daily_value(daily_clear,daily_key.PAY_ROUTE_TIMES,0);

            if(today_times >= 5){
                callback(false);
                return;
            }

            if(my_coin < cost){
                callback(false);
                return;
            }
            //获取玩家幸运值
            var lucky =0;
            var uname = "";
            db.get_user_lucky(user_id,function(ret){
                if(ret !== false){
                    lucky = ret.lucky;
                    uname = new Buffer(ret.name,'base64').toString('utf8');
                }

                // console.log("userid[%d] ====>lucky[%d]",user_id,lucky);
                //成功后扣除玩家钻石
                db.cost_gold(user_id,cost,function(err,rows,fields){
                    if(rows[0][0].result ==1){
                        ////转盘逻辑
                        //判断是否可以转
                        var my_hit = route(lucky);
                        var hit_info = route_config[my_hit];
                        var mask = '';
                        var send = true;


                        if (!hit_info.ingot_value && !hit_info.gold_value && my_hit != 1) {
                            var rdd = account + Date.now() + my_hit;
                            mask = secret.md5_16(rdd).toUpperCase();
                            send = false;
                            //抽中实物奖励，一次性消耗所有lucky值
                            db.cost_user_lucky(user_id,lucky);
                            //添加中奖公告
                            //open_time  end_time  =0 表示长期开启
                            //seq  顺序 越低优先级越高
                            //type    0 系统消息  1 广播消息
                            var message_data ={
                                type:1,
                                seq:1,
                                loop_times:10,
                                open_time:Math.floor(Date.now()/1000),
                                end_time:Math.floor(Date.now()/1000) + 1*3600*24,
                                msgtext:'恭喜玩家 '+uname+' 在转盘抽奖中抽中 ' +hit_info.route_name +'!!!!',
                                create_id:0,
                            }
                            db.web_add_message(message_data,function(err,rows,fields){
                                if(err){
                                    logger.error("pay route add message error:",err.stack);
                                }
                            })
                        } else {
                            //花钱抽，如果没中实物奖励，则增加1点lucky值
                            db.add_user_lucky(user_id,1);
                            if (hit_info.ingot_value > 0) {
                                db.add_ingot(user_id, hit_info.ingot_value, function (ret) {
                                    var ac = ret[0];
                                    if (ac.gems) {
                                        log_manager.insert_ingot_log(user_id, 0, user_id, log_point.INGOT_ADD_ROUTE, hit_info.ingot_value, ac.gems)
                                    }
                                });
                            }
                            if (hit_info.gold_value > 0) {
                                db.add_gold(user_id, hit_info.gold_value, function (ret) {
                                    var ac = ret[0];
                                    if (ac.coins) {
                                        log_manager.insert_gold_log(user_id, 0, user_id, log_point.GOLD_ADD_ROUTE, hit_info.gold_value, ac.coins)
                                    }
                                });
                            }
                        }
                        //插入日志
                        //route_user_id,route_time,hit_index,hit_value,route_value,gift_mask,award_state
                        //ret.user_id,ret.action_time,ret.hit_index,ret.random_ood,0,ret.mask,award_state
                        var now = Math.floor(Date.now() / 1000);
                        var log_obj = {
                            user_id: user_id,
                            action_time: now,
                            hit_index: my_hit,
                            random_ood: 0,
                            mask: mask,
                            send: send,
                        }
                        log_manager.insert_route_log(log_obj)

                        var ret = {
                            hit_index: my_hit,
                            ingot_value: hit_info.ingot_value,
                            gold_value: hit_info.gold_value,
                            send: send,
                            mask: mask,
                            today_times:today_times+1,
                        }
                        //更新日常计数
                        daily_clear =daily_value.add_daily_value(daily_clear,daily_key.PAY_ROUTE_TIMES,1);
                        // console.log("daily_clear-------------------------->",daily_clear)
                        db.update_daily_clear(user_id,daily_clear,now,function(ret){})
                        callback(ret);
                        return;
                    }else{
                        callback(false);
                        return;
                    }
                });
            });

        }else{
            callback(false);
            return;
        }
	});
}

//转盘记录
exports.route_log = function (account, callback) {
    //获取用户ID
    db.get_userid_by_account(account, function (rows) {
        if (rows) {
            var user_id = rows[0].userid;
            if (user_id) {
                log_manager.get_route_log(user_id, function (ret) {
                    if (ret) {
                        var rs = [];
                        for (var i = 0; i < ret.length; ++i) {
                            var tmp = {
                                route_time: ret[i].route_time,
                                hit_index: ret[i].hit_index,
                                mask: ret[i].gift_mask,
                                send: (ret[i].award_state == 1) ? true : false,
                            }
                            rs.push(tmp);
                        }
                        callback(rs);
                        return;
                    }
                    callback(false);
                })
            }
        } else {
            callback(false);
            return;
        }
    });
}

//后台接口，重新加载配置
exports.reload_config = function (callback) {
    service_ready = false;
    route_config = {};
    route_array = new Array();
    load_config();
    callback(true);
}

exports.init = function () {
    // log_manager.init(log, 'ROUTE SERVICE');
    //先加载全局时间
    db.get_global_value(global_key.ROUTE_DAILY_CLEAR_TIME, global_key.GLOBAL_VALUE_INT, function (ret) {
        if (ret && ret.length == 0) {
            var now = Math.floor(Date.now() / 1000);
            db.replace_global_value(global_key.ROUTE_DAILY_CLEAR_TIME, global_key.GLOBAL_VALUE_INT, now, function (ret) {
                if (ret) {
                    route_statistic_time = now;
                    load_config();
                } else {
                    logger.error("INIT ROUTE SERVICE ERROR, REPLACE GLOBAL VALUE FAILED.")
                }
                return;
            });
        } else if (ret == false) {
            logger.error('INIT ROUTE SERVICE ERROR, LOAD GLOBAL VLAUE FAILED.')
        } else if (ret.length) {
            route_statistic_time = ret[0].global_int_value;
            load_config();
        } else {
            logger.error('INIT ROUTE SERVICE ERROR, UN CATCH ERROR.')
        }
    });
}

function load_config() {
    logger.debug("Route service try to load config.")
    //成功加载当前配置
    db.load_route_config(function (ret) {
        if (!ret) {
            logger.error("LOAD ROUTE CONFIG FAILED. ROUTE SERVICE NOT RUNNING.")
            return;
        }
        init_route_config(ret);
    });
}

//判断2个时间戳是不是同一天
function is_same_day(t1, t2) {
    var date1 = new Date(t1 * 1000);
    var date2 = new Date(t2 * 1000);

    if (date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate()) {
        return true;
    }
    return false;
}

//心跳
function tick() {
    var now = Math.floor(Date.now() / 1000);
    //检测是否跨天，跨天后将今天的汇总日志库中
    if (!is_same_day(route_statistic_time, now)) {
        //重置所有缓存
        service_ready = false;

        db.replace_global_value(global_key.ROUTE_DAILY_CLEAR_TIME, global_key.GLOBAL_VALUE_INT, now, function (ret) {
            if (ret) {
                dump_daily_clear_to_db(now, function (result) {
                    if (result) {
                        route_config = {};
                        route_array = new Array();
                        route_statistic_time = now;

                        load_config();
                    } else {
                        logger.error("DUMP DAILY CLEAR TO DB ERROR.", dump_data)
                    }
                });
            } else {
                logger.error("DAILY CLEAR RELOAD ERROR.")
            }
        });
    }
}


setInterval(tick, 2000);