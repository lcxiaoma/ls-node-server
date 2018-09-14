var roomMgr = require('./roommgr');
var logger = require('./log').log_poker_running;
var db = require('../utils/db');
var level_config = require('../common/level');
var statistic = require('../common/statistics').statistic;
var statistic_key = require('../config/statistic_key').statistic_key;

var userList = {};
var userOnline = 0;
var user_obj_map ={};

exports.bind = function(userId,socket){
    userList[userId] = socket;
    userOnline++;
};

exports.del = function(userId,socket){
    delete userList[userId];
    delete user_obj_map[userId];
    userOnline--;
};

exports.get = function(userId){
    return userList[userId];
};

exports.isOnline = function(userId){
    var data = userList[userId];
    if(data != null){
        return true;
    }
    return false;
};

exports.getOnlineCount = function(){
    return userOnline;
}

exports.sendMsg = function(userId,event,msgdata){
    logger.debug('user[%d],event = %s,data = %s',userId,event,JSON.stringify(msgdata));
    var userInfo = userList[userId];
    if(userInfo == null){
        return;
    }
    var socket = userInfo;
    if(socket == null){
        return;
    }

    socket.emit(event,msgdata);
};

exports.kickAllInRoom = function(roomId){
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }

    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        if(!rs) continue;
        //如果不需要发给发送方，则跳过
        if(rs.user_id > 0){
            var socket = userList[rs.user_id];
            if(socket != null){
                exports.del(rs.user_id);
                socket.disconnect();
            }
        }
    }
};


exports.kickUserInRoom = function(roomId, userId){
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }

    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        if(!rs) continue;
        //如果不需要发给发送方，则跳过
        if(rs.user_id == userId){
            var socket = userList[rs.user_id];
            if(socket != null){
                exports.del(rs.user_id);
                socket.disconnect();
            }
        }
    }
};


exports.broacastInRoom = function(event,data,sender,includingSender){
    logger.debug("broadcast[%s] data[%s],sender[%d]",event,JSON.stringify(data),sender);
    var roomId = roomMgr.getUserRoom(sender);
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }

    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        if(!rs) continue;
        //如果不需要发给发送方，则跳过
        if(rs.user_id == sender && includingSender != true){
            continue;
        }
        var socket = userList[rs.user_id];
        if(socket != null){
            socket.emit(event,data);
        }
    }
};


exports.send_to_room = function(event,data,room_id){
    logger.debug("send to room[%s] data[%s],room_id[%d]",event,JSON.stringify(data),room_id);
    var roomInfo = roomMgr.getRoom(room_id);
    if(roomInfo == null){
        return;
    }
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        if(!rs) continue;
        // //如果不需要发给发送方，则跳过
        // if(rs.userId == sender && includingSender != true){
        //     continue;
        // }
        var socket = userList[rs.user_id];
        if(socket != null){
            socket.emit(event,data);
        }
    }
};


//判断2个时间戳是不是同一天
function is_same_day(t1, t2) {
    var date1 = new Date(t1 * 1000);
    var date2 = new Date(t2 * 1000);

    if (date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate()) {
        return true;
    }
    return false;
}

//加载玩家信息
exports.load_user_info = function(user_id,callback){
    db.load_user_info(user_id,function(result,ret){
        if(!result){
            callback(false);
            return;
        }
        var d ={};
        var s ={};
        var now = Math.floor(Date.now()/1000);
        var daily_clear_time = ret.daily_clear_time;

        if(is_same_day(now,daily_clear_time)){
            if(ret.daily_value.toString('utf8') != ''){
                d = JSON.parse(ret.daily_value.toString('utf8'));
            }
        }else{
            daily_clear_time = now;
        }

        if(ret.statistic.toString('utf8') != ''){
            d = JSON.parse(ret.statistic.toString('utf8'));
        }

        var user_info ={
            lv:Number(ret.lv),
            exp:Number(ret.exp),
            lucky:Number(ret.lucky),
            online_time:Number(ret.online_time),
            daily_value:d,
            statistic:s,
            daily_clear_time:daily_clear_time,
            begin_time:now,
        }
        // console.log(user_info)
        user_obj_map[user_id] = user_info;
    });
}

//更新玩家信息
exports.update_user_info = function(user_id){
    var user_info = user_obj_map[user_id];
    if(user_info){
        var now = Math.floor(Date.now()/1000);
        var online_time = user_info.online_time + now - user_info.begin_time
        user_info.online_time = online_time;
        user_info.begin_time = now;
        db.update_user_extro_info(user_id,user_info,function(err,rows,fields){
            if(err){
                logger.error("UPDATE USER EXTRO USER INFO ERROR:",err.stack);
                return;
            }
        })
    }
}

//更新玩家的额外信息
exports.add_user_extro_info = function(user_id,server_type,win,banker,score){
    var user_info = user_obj_map[user_id];
    if(user_info){
        var info =level_config.get_exp_lucky(server_type,banker,win)
        var added_info =level_config.add_exp(user_info.lv,user_info.exp,info.exp);
        user_info.lv = added_info.level;
        user_info.exp = added_info.exp;
        user_info.lucky += info.lucky;

        //增加计数
        //加入游戏次数
        statistic.add_statitsic(user_info.statistic,statistic_key.RUNNING_JOIN_COUNT,1)
        statistic.add_statitsic(user_info.statistic,statistic_key.JOIN_COUNTS,1);
        if(win){
            //赢游戏次数
            statistic.add_statitsic(user_info.statistic,statistic_key.RUNNING_WIN_COUNT,1);
            statistic.add_statitsic(user_info.statistic,statistic_key.WIN_COUNTS,1);
            //赢的最大分
            statistic.max_statistic(user_info.statistic,statistic_key.RUNNING_WIN_MAX_SCORE,score);
            statistic.max_statistic(user_info.statistic,statistic_key.MAX_WIN_SCORE,score);
        }else{
            if(score >0){
                //输的最大分
                statistic.max_statistic(user_info.statistic,statistic_key.RUNNING_LOSE_MAX_SCORE,score);
                statistic.max_statistic(user_info.statistic,statistic_key.MAX_LOSE_SCORE,score);
            }
        }

        // console.log("show me after added:", user_id,user_info);

        exports.update_user_info(user_id);
    }
}