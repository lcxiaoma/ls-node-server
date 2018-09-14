var mysql = require("mysql");
var crypto = require('./crypto');

var pool = null;
var logger = null;

function nop(a, b, c, d, e, f, g) {

}

//普通查询调用接口
function query(sql, args, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            callback(err, null, null);
        } else {
            conn.query(sql, args, function (qerr, vals, fields) {
                //释放连接  
                conn.release();
                //事件驱动回调  
                callback(qerr, vals, fields);
            });
        }
    });
};


function query2(sql, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            callback(err, null, null);
        } else {
            conn.query(sql, function (qerr, vals, fields) {
                //释放连接  
                conn.release();
                //事件驱动回调  
                callback(qerr, vals, fields);
            });
        }
    });
};
//存储过程调用接口
function call_proc(proc, args, callback) {
    var sql = 'call ' + proc + '(';
    for (var a in args) {
        if (a == args.length - 1) {
            sql += '?';
        } else {
            sql += '?,';
        }
    }
    sql += ');';

    pool.getConnection(function (err, conn) {
        if (err) {
            callback(err, null, null);
        } else {
            conn.query(sql, args, function (qerr, vals, fields) {
                conn.release();
                callback(qerr, vals, fields);
            });
        }
    });
}

exports.init = function (config, log, where) {
    //check USER PASSWORD
    var uname = crypto.deCrypt('aes-256-cbc', config.USER);
    var upass = crypto.deCrypt('aes-256-cbc', config.PSWD);
    pool = mysql.createPool({
        host: config.HOST,
        user: uname,//config.USER,
        password: upass,//config.PSWD,
        // user: config.USER,
        // password: config.PSWD,
        database: config.DB,
        port: config.PORT,
    });
    logger = log;
    logger.info("%s DB READY.", where);
};

exports.is_account_exist = function (account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(false);
        return;
    }

    var sql = 'SELECT * FROM accounts WHERE account = "{0}"';
    sql = sql.format(account);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            if (rows.length > 0) {
                callback(true);
            }
            else {
                callback(false);
            }
        }
    });
};

exports.create_account = function (account, password, callback) {
    callback = callback == null ? nop : callback;
    if (account == null || password == null) {
        callback(false);
        return;
    }

    var psw = crypto.md5(password);
    var sql = 'INSERT INTO accounts(account,password) VALUES("{0}","{1}")';
    sql = sql.format(account, password);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            if (err.code == 'ER_DUP_ENTRY') {
                callback(false);
                return;
            }
            callback(false);
            throw err;
        }
        else {
            callback(true);
        }
    });
};

exports.get_account_info = function (account, password, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT * FROM accounts WHERE account = "{0}"';
    sql = sql.format(account);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }

        if (password != null) {
            var psw = crypto.md5(password);
            if (rows[0].password == psw) {
                callback(null);
                return;
            }
        }

        callback(rows[0]);
    });
};

exports.is_user_exist = function (account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(false);
        return;
    }

    var sql = 'SELECT userid FROM users WHERE account = "{0}" and `lock` = 0';
    sql = sql.format(account);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            throw err;
        }

        if (rows.length == 0) {
            callback(false);
            return;
        }

        callback(true);
    });
}


exports.get_user_data = function (account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT userid,account,name,lv,exp,coins,gems,roomid,`lock`,agent FROM users WHERE account = "{0}" and `lock` =0';
    sql = sql.format(account);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

exports.get_user_data_by_userid = function (userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT userid,account,name,lv,exp,coins,gems,roomid FROM users WHERE userid = {0}';
    sql = sql.format(userid);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

/**增加玩家房卡 */
exports.add_user_gems = function (userid, gems, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(false);
        return;
    }

    var sql = 'UPDATE users SET gems = {0} WHERE userid = {1}';
    sql = sql.format(gems, userid)
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            logger.error(err.stack);
            callback(false);
            return;
        }
        else {
            callback(rows.affectedRows > 0);
            return;
        }
    });
};

exports.get_gems = function (account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT gems,coins,userid FROM users WHERE account = "{0}"';
    sql = sql.format(account);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }

        callback(rows[0]);
    });
};

/**
 * 获取用户金币信息和日常信息
 */
exports.get_gems_daily_values = function (account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT gems,coins,userid,daily_value,daily_clear_time FROM users,user_extro_info WHERE userid = user_id and account = "{0}"';
    sql = sql.format(account);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }

        callback(rows[0]);
    });
};

/**
 * 更新日常信息
 */
exports.update_daily_clear = function(user_id,daily_clear,daily_clear_time,callback){
    var sql ='';
    daily_clear = JSON.stringify(daily_clear);
    if(daily_clear_time){
        sql = "update user_extro_info set daily_value = '{0}',daily_clear_time ={1} where user_id = {2}"
        sql = sql.format(daily_clear,daily_clear_time,user_id);
    }else{
        sql = "update user_extro_info set daily_value = '{0}' where user_id = {1}"
        sql = sql.format(daily_clear,user_id);
    }
    query2(sql,function(err,rows,fields){
        if (err) {
            logger.error("UPDATE DAILY CLEAR ERROR:",err.stack);
            callback(false);
            return;
        }
        callback(true);
        return;
    });
}

exports.get_user_history = function (userId, callback) {
    callback = callback == null ? nop : callback;
    if (userId == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT history FROM users WHERE userid = {0}';
    sql = sql.format(userId);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        var history = rows[0].history;
        if (history == null || history == "") {
            callback(null);
        }
        else {
            console.log(history.length);
            history = JSON.parse(history);
            callback(history);
        }
    });
};

exports.get_user_history2 = function (data, callback) {
    param = [];
    param.push(data.user_id);
    param.push(data.page);
    param.push(data.server_type);
    call_proc('get_user_history', param, callback);
}

exports.update_user_history = function (userId, history, callback) {
    callback = callback == null ? nop : callback;
    if (userId == null || history == null) {
        callback(false);
        return;
    }

    history = JSON.stringify(history);
    var sql = 'UPDATE users SET roomid = null, history = "{0}" WHERE userid = {1}';
    sql = sql.format(history, userId);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }

        if (rows.length == 0) {
            callback(false);
            return;
        }

        callback(true);
    });
};

//获取房间游戏结果
exports.get_games_of_room = function (room_uuid, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT game_index,create_time,result FROM games_archive WHERE room_uuid = "{0}"';
    sql = sql.format(room_uuid);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }

        callback(rows);
    });
};
//获取游戏房间结果
exports.get_games_of_room2 = function (room_uuid, callback) {
    param = [];
    param.push(room_uuid);
    call_proc('get_game_of_room', param, callback);
}

exports.get_detail_of_game = function (room_uuid, index, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null || index == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT base_info,action_records FROM games_archive WHERE room_uuid = "{0}" AND game_index = {1}';
    sql = sql.format(room_uuid, index);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        callback(rows[0]);
    });
}
//获取游戏详情
exports.get_detail_of_game2 = function (data, callback) {
    param = [];
    param.push(data.room_uuid);
    param.push(data.index);
    call_proc('get_detail_of_game', param, callback);
}

exports.create_user = function (account, name, coins, gems, sex, headimg, callback) {
    callback = callback == null ? nop : callback;
    if (account == null || name == null || coins == null || gems == null) {
        callback(false);
        return;
    }
    if (headimg) {
        headimg = '"' + headimg + '"';
    }
    else {
        headimg = 'null';
    }
    name = crypto.toBase64(name);
    var sql = 'INSERT INTO users(account,name,coins,gems,sex,headimg) VALUES("{0}","{1}",{2},{3},{4},{5})';
    sql = sql.format(account, name, coins, gems, sex, headimg);
    logger.debug(sql);
    //console.log(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            throw err;
        }
        callback(true);
    });
};

exports.update_user_info = function (userid, name, headimg, sex, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }

    if (headimg) {
        headimg = '"' + headimg + '"';
    }
    else {
        headimg = 'null';
    }
    name = crypto.toBase64(name);
    var sql = 'UPDATE users SET name="{0}",headimg={1},sex={2} WHERE account="{3}"';
    sql = sql.format(name, headimg, sex, userid);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            throw err;
        }
        callback(rows);
    });
};

exports.get_user_base_info = function (userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT name,sex,headimg FROM users WHERE userid={0}';
    sql = sql.format(userid);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            throw err;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

exports.is_room_exist = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT * FROM rooms WHERE id = "{0}"';
    sql = sql.format(roomId)
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            callback(rows.length > 0);
        }
    });
};

/**
 * 扣除钻石房卡
 * **/
/*
exports.cost_gems = function(userid,cost,callback){
    callback = callback == null? nop:callback;
    var sql = 'UPDATE users SET gems = gems -' + cost + ' WHERE userid = ' + userid;
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(rows.length > 0);
        }
    });
};
*/

exports.cost_ingot = function (user_id, lose_ingot, callback) {
    call_proc('lose_ingot', [user_id, lose_ingot], callback);
}


exports.cost_gold = function (user_id, gold_value, callback) {
    call_proc('lose_gold', [user_id, gold_value], callback);
}
exports.set_room_id_of_user = function (userId, roomId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE users SET roomid = {0} WHERE userid = {1}';
    if (roomId != null) {
        roomId = '"' + roomId + '"';
        sql = sql.format(roomId, userId);
    } else {
        sql = 'UPDATE users SET roomid = null WHERE userid = {0}';
        sql = sql.format(userId);
    }
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            logger.error(err.stack);
            callback(false);
            return;
        }
        else {
            callback(rows.length > 0);
            return;
        }
    });
};

exports.get_room_id_of_user = function (userId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT roomid FROM users WHERE userid = {0}';
    sql = sql.format(userId);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        else {
            if (rows.length > 0) {
                callback(rows[0].roomid);
            }
            else {
                callback(null);
            }
        }
    });
};


//数据库创建房间
exports.create_room = function (roomId, conf, ip, port, create_time, server_type, server_id, callback) {
    callback = callback == null ? nop : callback;
    var sql = "INSERT INTO rooms(uuid,id,base_info,ip,port,create_time,server_type,server_id) \
                VALUES('{0}','{1}','{2}','{3}',{4},{5},{6},{7})";
    var uuid = Date.now() + roomId;
    var baseInfo = JSON.stringify(conf);
    sql = sql.format(uuid, roomId, baseInfo, ip, port, create_time, server_type, server_id);
    logger.debug(sql);
    query2(sql, function (err, row, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        else {
            callback(uuid);
        }
    });
};

exports.get_room_uuid = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT uuid FROM rooms WHERE id = "{0}"';
    sql = sql.format(roomId);
    logger.debug(sql);
    query2(sql, [roomId], function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        else {
            callback(rows[0].uuid);
        }
    });
};

//更新座位信息old
exports.update_seat_info = function (roomId, seatIndex, userId, icon, name, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE rooms SET user_id{0} = {1},user_icon{0} = "{2}",user_name{0} = "{3}" WHERE id = "{4}"';
    name = crypto.toBase64(name);
    sql = sql.format(seatIndex, userId, icon, name, roomId);
    logger.debug(sql);
    query2(sql, function (err, row, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            callback(true);
        }
    });
}


//更新房间基础信息
exports.update_room_base_info = function (room_uuid, base_info, callback) {
    callback = callback == null ? nop : callback;
    var sql = "UPDATE rooms SET base_info='{0}' WHERE uuid='{1}'";
    sql = sql.format(JSON.stringify(base_info), room_uuid);
    logger.debug(sql);
    query2(sql, function (err, row, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            callback(true);
        }
    });
}



//更新座位信息New
exports.update_seat_info2 = function (data, callback) {
    param = [];
    param.push(data.uuid);
    param.push(JSON.stringify(data.seat_info));
    param.push(JSON.stringify(data.watch_seat_info));
    call_proc('update_seat_info', param, callback);
}

exports.update_num_of_turns = function (roomId, numOfTurns, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE rooms SET num_of_turns = {0} WHERE id = "{1}"'
    sql = sql.format(numOfTurns, roomId);
    logger.debug(sql);
    query2(sql, function (err, row, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            callback(true);
        }
    });
};


exports.update_next_button = function (roomId, nextButton, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE rooms SET next_button = {0} WHERE id = "{1}"'
    sql = sql.format(nextButton, roomId);
    logger.debug(sql);
    query2(sql, function (err, row, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            callback(true);
        }
    });
};

exports.get_room_addr = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    if (roomId == null) {
        callback(false, null, null);
        return;
    }

    var sql = 'SELECT ip,port,server_type,server_id FROM rooms WHERE id = "{0}"';
    sql = sql.format(roomId);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(false, null, null);
            throw err;
        }
        if (rows.length > 0) {
            callback(true, rows[0].ip, rows[0].port, rows[0].server_type, rows[0].server_id);
        }
        else {
            callback(false, null, null);
        }
    });
};


exports.get_room_data = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    if (roomId == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT * FROM rooms WHERE id = "{0}"';
    sql = sql.format(roomId);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length > 0) {
            rows[0].user_name0 = crypto.fromBase64(rows[0].user_name0);
            rows[0].user_name1 = crypto.fromBase64(rows[0].user_name1);
            rows[0].user_name2 = crypto.fromBase64(rows[0].user_name2);
            rows[0].user_name3 = crypto.fromBase64(rows[0].user_name3);
            callback(rows[0]);
        }
        else {
            callback(null);
        }
    });
};
//删除房间，压缩到指定的表
exports.delete_room = function (data, callback) {
    callback = callback == null ? nop : callback;
    param = []
    param.push(data.room_uuid);
    param.push(data.create_time);
    param.push(data.zip_reason);
    param.push(data.zip_time);
    param.push(JSON.stringify(data.user_info));
    call_proc('achive_room', param, callback);
    // callback = callback == null? nop:callback;
    // if(roomId == null){
    //     callback(false);
    // }
    // var sql = "DELETE FROM rooms WHERE id = '{0}'";
    // sql = sql.format(roomId);
    // console.log(sql);
    // query(sql,function(err,rows,fields){
    //     if(err){
    //         callback(false);
    //         throw err;
    //     }
    //     else{
    //         callback(true);
    //     }
    // });
}

exports.create_game = function (room_uuid, index, base_info, callback) {
    callback = callback == null ? nop : callback;
    var sql = "INSERT INTO games(room_uuid,game_index,base_info,create_time) VALUES('{0}',{1},'{2}',unix_timestamp(now()))";
    sql = sql.format(room_uuid, index, base_info);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        else {
            callback(rows.insertId);
        }
    });
};

exports.delete_games = function (room_uuid, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null) {
        callback(false);
    }
    var sql = "DELETE FROM games WHERE room_uuid = '{0}'";
    sql = sql.format(room_uuid);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            callback(true);
        }
    });
}

exports.archive_games = function (room_uuid, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null) {
        callback(false);
    }
    var sql = "INSERT INTO games_archive(SELECT * FROM games WHERE room_uuid = '{0}')";
    sql = sql.format(room_uuid);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            exports.delete_games(room_uuid, function (ret) {
                callback(ret);
            });
        }
    });
}

exports.update_game_action_records = function (room_uuid, index, actions, callback) {
    callback = callback == null ? nop : callback;
    var sql = "UPDATE games SET action_records = '{0}' WHERE room_uuid = '{1}' AND game_index = {2}";
    sql = sql.format(actions, room_uuid, index)
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            callback(true);
        }
    });
};

exports.update_game_result = function (room_uuid, index, result, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null || result) {
        callback(false);
    }

    result = JSON.stringify(result);
    var sql = "UPDATE games SET result = '{0}' WHERE room_uuid = {1} AND game_index = {2}";
    sql = sql.format(result, room_uuid, index);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            callback(true);
        }
    });
};

// exports.get_message = function(type,version,callback){
//     callback = callback == null? nop:callback;

//     var sql = 'SELECT * FROM message WHERE type = ? AND version <> ?';

//     if(!version){
//         version = 'null';
//     }

//     var args =[type,version];

//     query(sql, args,function(err, rows, fields) {
//         if(err){
//             callback(false);
//             throw err;
//         }
//         else{
//             if(rows.length > 0){
//                 callback(rows[0]);    
//             }
//             else{
//                 callback(null);
//             }
//         }
//     });
// };

//proc store game
exports.init_game_base_info = function (data, callback) {
    var param = [];
    param.push(data.uuid);
    param.push(data.game_index);
    param.push(data.create_time);
    param.push(JSON.stringify(data.base_info));
    param.push(JSON.stringify(data.holds));
    param.push(JSON.stringify(data.folds));
    param.push(JSON.stringify(data.actions));
    param.push(JSON.stringify(data.result));
    param.push(JSON.stringify(data.statistic));
    param.push(JSON.stringify(data.change_info));
    call_proc('poker_dump_game_base', param, callback);
};

exports.update_game_info = function (data, callback) {
    var param = [];
    param.push(data.room_uuid);
    param.push(data.game_index);
    param.push(JSON.stringify(data.holds));
    param.push(JSON.stringify(data.folds));
    param.push(JSON.stringify(data.actions));
    param.push(JSON.stringify(data.change_info));
    call_proc('poker_update_game_info', param, callback);
};

exports.load_game_from_db = function (data, callback) {
    var param = [];
    param.push(data);
    call_proc('poker_load_game', param, callback);
};

exports.change_room_info = function (data, callback) {
    var param = []
    param.push(data.room_id);
    param.push(data.ip);
    param.push(data.port);
    param.push(data.server_id)
    call_proc('change_room_info', param, callback);
}
//更新房间信息
exports.update_room_info = function (data, callback) {
    var param = []
    param.push(data.room_uuid);
    param.push(data.game_index);
    //兼容以前的游戏
    if (data.less_begin == null) {
        data.less_begin = 0;
    }
    param.push(data.less_begin);
    param.push(JSON.stringify(data.score_list));
    if (!data.change_info) {
        data.change_info = '';
    }
    param.push(JSON.stringify(data.change_info));
    // for(var i =0;i<4;++i){
    //     if(data.score_list[i] != undefined){
    //         param.push(data.score_list[i])
    //     }else{
    //         param.push(0);
    //     }
    // }
    call_proc('update_room_info', param, callback);
}

//增加结果，压缩房间信息
exports.add_result_achive_game = function (data, callback) {
    var param = []
    param.push(Number(data.force));
    param.push(data.room_uuid);
    param.push(data.game_index);
    param.push(data.create_time);
    param.push(JSON.stringify(data.result));
    call_proc('add_result_achive_game', param, callback);
}

//尝试注册或者更新账户
exports.try_create_or_update_user = function (data, callback) {
    var param = []
    param.push(data.account);
    param.push(data.name);
    param.push(data.sex);
    param.push(data.headimgurl);
    param.push(data.platform);
    param.push(data.channal);
    param.push(data.now)
    call_proc('create_or_update_user', param, callback);
}

//创建新的订单
exports.create_pay_order = function (data, callback) {
    var param = [];
    param.push(data.account);
    param.push(data.good_sn);
    param.push(data.suffix);
    param.push(data.good_count);
    param.push(data.order_money);
    param.push(data.award_gold);
    param.push(data.extro_gold);
    param.push(data.award_ingot);
    param.push(data.extro_ingot)
    param.push(data.pay_platform);
    call_proc('create_pay_order', param, callback);
}

//支付成功
exports.pay_success = function (data, callback) {
    // account:account,
    // good_sn:good_sn,
    // pay_platform:pay_platform,
    // order_id:order_id,
    // pay_id:pay_id,
    // pay_count:r_quantity,
    // app_pay_time:r_pay_time,
    var param = [];
    param.push(data.account);
    param.push(data.good_sn);
    param.push(data.pay_platform);
    param.push(data.order_id);
    param.push(data.pay_id);
    param.push(data.pay_count);
    param.push(data.app_pay_time);
    call_proc('pay_success', param, callback);
}

//投诉建议
exports.try_create_new_advice = function (data, callback) {
    // account:account,
    // advice_type:advice_type,
    // advice_game:advice_game,
    // advice_platform:advice_platform,
    // msg:msg
    var param = [];
    param.push(data.account);
    param.push(data.advice_type);
    param.push(data.advice_game);
    param.push(data.advice_platform);
    param.push(data.msg);
    call_proc('create_new_advice', param, callback);
}

//查询投诉建议
exports.try_find_advice = function (data, callback) {
    // account:account,
    // page:page
    var param = [];
    param.push(data.account);
    param.push(data.page);
    call_proc('find_advice', param, callback);
}

//标记投诉建议已解决
exports.try_solve_advice = function (data, callback) {
    // account:account,
    // ad_id:ad_id
    var param = [];
    param.push(data.account);
    param.push(data.ad_id);
    call_proc('solve_advice', param, callback);
}

//更新房间可变信息
exports.update_room_change_info = function (data, callback) {
    var param = [];
    param.push(data.room_uuid);
    param.push(JSON.stringify(data.change_info));
    call_proc('update_room_change_info', param, callback);
}

//获取用户邮件
exports.get_user_mail = function (data, callback) {
    var param = [];
    param.push(data.user_account);
    param.push(data.page);
    call_proc('get_user_mail', param, callback);
}

//添加用户邮件
exports.add_user_mail = function (data, callback) {
    var param = [];
    param.push(data.account);
    param.push(data.user_id);
    param.push(data.sender_id);
    param.push(data.sender_name);
    param.push(data.mail_type);
    param.push(data.mail_tittle);
    param.push(data.mail_content);
    param.push(data.mail_key);
    param.push(JSON.stringify(data.mail_attach));
    param.push(data.end_time);
    call_proc('add_user_mail', param, callback);
}

//删除用户邮件
exports.del_user_mail = function (data, callback) {
    var param = [];
    param.push(data.account);
    param.push(data.user_id);
    param.push(data.mail_id);
    param.push(data.archive_reason);
    call_proc('del_user_mail', param, callback);
}

//读取邮件
exports.update_mail_status = function (data, callback) {
    var param = [];
    param.push(data.account);
    param.push(data.user_id);
    param.push(data.mail_id);
    param.push(data.status);
    call_proc('update_mail_status', param, callback);
}

//检测邮件领取奖励状态
exports.check_mail_award = function(data,callback){
    var param =[]
    param.push(data.account);
    param.push(data.user_id);
    param.push(data.mail_id);
    call_proc('check_mail_award',param,callback)
}
//修改消息
exports.modified_message = function (data, callback) {

}
//获取消息
exports.get_message = function (data, callback) {
    var param = [];
    param.push(data.account);
    param.push(data.page);
    call_proc('get_message', param, callback)
}

//加载玩家信息
exports.load_user_info = function(user_id,callback){
    var sql ="select lv,exp,lucky,online_time,daily_value,statistic,daily_clear_time from users,user_extro_info where users.userid = user_extro_info.user_id and users.userid = {0};";
    sql = sql.format(user_id);
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("LOAD USER INFO ERROR:",err.stack);
            callback(false,null);
            return;
        }
        callback(true,rows[0]);
    });
}

//加载玩家额外信息
exports.get_user_extro_info = function(account,callback){
    var sql ="select daily_value,statistic,daily_clear_time from users,user_extro_info where users.userid = user_extro_info.user_id and users.account = '{0}';";
    sql = sql.format(account);
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("LOAD USER INFO ERROR:",err.stack);
            callback(false,null);
            return;
        }
        callback(true,rows[0]);
    });
}

//更新玩家信息
exports.update_user_extro_info = function(user_id,user_info,callback){
    var param =[];
    param.push(user_id);
    param.push(user_info.lv);
    param.push(user_info.exp);
    param.push(user_info.lucky);
    param.push(user_info.online_time);
    param.push(JSON.stringify(user_info.daily_value));
    param.push(JSON.stringify(user_info.statistic));
    param.push(user_info.daily_clear_time);
    call_proc('update_user_info',param,callback);
}

//设置邀请码
exports.add_invitation_code = function(account,invitation_code,kind_type,callback){
    var param =[];
    param.push(account);
    param.push(invitation_code);
    param.push(kind_type);
    call_proc('add_inviation',param,callback);
}

//获取自己的邀请码状态
exports.invitation_status = function(account,callback){
    var param =[];
    param.push(account);
    call_proc('inviation_status',param,callback);
}

////后台相关存储过程
//后台获取玩家信息
exports.web_get_user_data_by_userid = function (userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT userid,name,headimg,coins,gems,roomid,reg_time,`lock`,agent FROM users WHERE userid = {0}';
    sql = sql.format(userid);
    logger.debug(sql);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};
//后台添加用户房卡
exports.web_add_user_ingot = function (data, callback) {
    // sender_id:sender_id,
    // user_id:user_id,
    // ingot:ingot,
    var param = [];
    param.push(data.sender_id);
    param.push(data.user_id);
    param.push(data.ingot);
    call_proc('web_add_user_ingot', param, callback);
}
//添加用户邮件
exports.web_add_user_mail = function (data, callback) {
    var param = [];
    param.push(data.account);
    param.push(data.user_id);
    param.push(data.sender_id);
    param.push(data.sender_name);
    param.push(data.mail_type);
    param.push(data.mail_tittle);
    param.push(data.mail_content);
    param.push(data.mail_key);
    param.push(JSON.stringify(data.mail_attach));
    param.push(data.end_time);
    call_proc('add_user_mail', param, callback);
}
//添加用户金币
exports.web_add_user_gold = function (data, callback) {
    // sender_id:sender_id,
    // user_id:user_id,
    // gold:gold,
    var param = [];
    param.push(data.sender_id);
    param.push(data.user_id);
    param.push(data.gold);
    call_proc('web_add_user_gold', param, callback);
}
////转盘相关信息
exports.route_state = function (data, callback) {
    var param = [];
    param.push(data.account);
    call_proc('route_state', param, callback);
}

exports.do_route = function (user_id, callback) {
    var param = [];
    param.push(user_id)
    call_proc('do_route', param, callback);
}

exports.load_route_config = function (callback) {
    var sql = 'select id,route_index,route_ood,max_hit,ingot_value,gold_value,today_hit,today_time,route_name from route_config;';
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        callback(rows);
    });
}

exports.update_hit_value = function (data, callback) {
    var param = [];
    call_proc('update_hit_value', param, callback);
}


exports.get_userid_by_account = function (account, callback) {
    var sql = "select userid from users where account = '{0}'";
    sql = sql.format(account);
    query2(sql, function (err, rows, fields) {
        if (err) {
            logger.error("GET USERID BY ACCOUNT ERROR:", err.stack);
            callback(false);
            return;
        }
        callback(rows);
        return;
    })
}

exports.update_route_hit_info = function(hit_index,hit_times){
    var sql = 'update route_config set today_hit = {0}  where route_index = {1}';
    sql = sql.format(hit_times,hit_index);
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("UPDATE ROUTE HIT TIME ERROR:",err.stack);
        }
    });
}

exports.close_today_route_data = function(now,callback){
    var param =[];
    param.push(now);
    call_proc('close_route_data',param,callback);
}


exports.add_ingot = function(user_id,add_value,callback){
    var sql = "update users set gems = gems + {0} where userid = {1}";
    sql = sql.format(add_value,user_id);
    // console.log(sql)
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("ADD INGOT ERROR:",err.stack);
            callback(false);
            return;
        }else{
            sql = 'select gems from users where userid = {0}';
            sql = sql.format(user_id);
            query2(sql,function(err,rows,fields){
                if(err){
                    logger.error("ADD INGOT FIND INGOT ERROR:",err.stack);
                    callback(false);
                    return;
                }
                callback(rows);
                return;
            });
        }
    });
}

exports.add_gold = function(user_id,add_value,callback){
    var sql = "update users set coins = coins + {0} where userid = {1}";
    sql = sql.format(add_value,user_id);
    // console.log(sql);
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("ADD GOLD ERROR:",err.stack);
            callback(false);
            return;
        }else{
            sql = 'select coins from users where userid = {0}';
            sql = sql.format(user_id);
            query2(sql,function(err,rows,fields){
                if(err){
                    logger.error("ADD GOLD FIND INGOT ERROR:",err.stack);
                    callback(false);
                    return;
                }
                callback(rows);
                return;
            });  
        }
    }); 
}

exports.add_route_time = function(user_id,callback){
    var sql = 'update user_extro_info set route_time = unix_timestamp(now()) where user_id  = {0}';
    sql = sql.format(user_id);
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("ADD ROUTE TIME ERROR.",err.stack);
            callback(false);
            return;
        }
        callback(true);
    });
}

exports.get_user_lucky = function(user_id,callback){
    var sql = "select lucky,name from users where userid = {0}";
    sql = sql.format(user_id);
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("GET USER LUCKY ERROR:",err.stack);
            callback(false);
            return;
        }
        if(rows.length ==0){
            callback(false);
            return;
        }
        callback(rows[0]);
        return;
    })
}

//增加用户幸运值
exports.add_user_lucky = function(user_id,value){
    var sql = "update users set lucky = lucky + {0} where userid = {1}";
    sql = sql.format(value,user_id);
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("ADD USER LUCKY ERROR:",err.stack);
            return;
        }
    })
}

//减少用户幸运值
exports.cost_user_lucky = function(user_id,value){
    var sql = "update users set lucky = lucky - {0} where userid = {0}";
    sql = sql.format(value,user_id);
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("COST USER LUCKY ERROR:",err.stack);
            return;
        }
    });
}

//获取全局变量
exports.get_global_value = function(global_key,value_type,callback){
    var sql ='';
    if(value_type == 1){
        sql ="select global_int_value from global_settings where global_key = '{0}'";
    }else{
        sql = "select global_str_value from global_settings where global_key = '{0}'";
    }
    sql = sql.format(global_key);
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("GET GOBAL VALUE ERROR:",err.stack);
            callback(false);
        }else{
            callback(rows)
        }
    });
}
//替换全局变量
exports.replace_global_value = function(global_key,value_type,value,callback){
    var sql ='';
    if(value_type == 1){
        sql ="replace into global_settings values('{0}',{1},null,null)";
    }else{
        sql ="replace into global_settings values('{0}',null,'{1}',null)";
    }

    sql = sql.format(global_key,value)
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("REPLACE GLOBAL VALUE ERROR:",err.stack);
            callback(false);
        }else{
            callback(true);
        }
    });

}

//替换全局变量
exports.replace_global_setting= function(global_key,int_value,str_value,str_value2,callback){
    var sql ="replace into global_settings values('{0}',{1},'{2}','{3}')";
    sql = sql.format(global_key,int_value,str_value,str_value2)
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("REPLACE GLOBAL SETTING ERROR:",err.stack);
            callback(false);
        }else{
            callback(true);
        }
    });

}

exports.check_account = function(account,callback){
    var sql = "select userid from users where account = '{0}'";
    sql = sql.format(account);
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("CHECK ACCOUNT ERROR:",err.stack);
            callback(false);
            return;
        }
        if(rows[0].userid){
            callback(true);
            return;
        }else{
            callback(false);
            return;
        }
    });
}
//加载数据库存放的票据
exports.load_ticket = function(callback){
    var sql ='select global_key,global_int_value,global_str_value,global_str_value2 from global_settings where global_key like "wechat_%";'
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("LOAD TICKET ERROR:",err.stack);
            callback(false,null);
            return;
        }else{
            callback(true,rows);
            return;
        }
    })
}

/**
 * 根据userid获取玩家信息
 */
exports.get_user_info_byid = function(user_id,callback){
    var sql = "select * from users,user_extro_info where users.userid = user_extro_info.user_id  and userid = {0} and `lock` = 0";
    sql = sql.format(user_id);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
}

/**
 * 根据account获取玩家信息
 */
exports.get_user_info_byac = function(account,callback){
    var sql = "select * from users,user_extro_info where users.userid = user_extro_info.user_id  and users.account = '{0}'";
    sql = sql.format(account);
    query2(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
}

//更新代开房间的代开用户和过期时间
exports.update_agent_room = function(room_id,agent_user_id,callback){
    var sql = "update rooms set agent_user_id={0}, agent_expires_time=create_time+120 where id={1}";
    sql = sql.format(agent_user_id,room_id);
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("UPDATE AGENT ROOM ERROR.",err.stack);
            callback(false);
            return;
        }
        callback(true);
    });
}


//获得代开房间列表
exports.get_agent_room = function(agent_user_id,callback){
    var sql = "select id,base_info,num_of_turns,agent_expires_time from rooms where agent_user_id={0}";
    sql = sql.format(agent_user_id);
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("GET AGENT ROOM ERROR.",err.stack);
            callback(false);
            return;
        }
        callback(rows);
    });
}


//获得代开房间信息
exports.get_agent_room_by_id = function(room_id,callback){
    var sql = "select uuid,base_info,create_time,num_of_turns,agent_user_id from rooms where id='{0}'";
    sql = sql.format(room_id);
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("GET AGENT ROOM ERROR.",err.stack);
            callback(false);
            return;
        }
         if (rows.length == 0) {
            callback(false);
            return;
        }
        callback(rows[0]);
    });
}


//后台接口
//添加消息
exports.web_add_message = function (data, callback) {
    var param = [];
    param.push(data.type);
    param.push(data.seq);
    param.push(data.loop_times);
    param.push(data.open_time);
    param.push(data.end_time);
    param.push(data.msgtext);
    param.push(data.create_id);
    call_proc('add_message', param, callback);
}

exports.try_gold_to_ingot = function (data, callback) {
    var param = [];
    param.push(data.account);
    param.push(data.gold);
    param.push(data.rate);
    call_proc('try_gold_to_ingot', param, callback);
}

exports.try_ingot_to_gold = function (data, callback) {
    var param = [];
    param.push(data.account);
    param.push(data.ingot);
    param.push(data.rate);
    call_proc('try_ingot_to_gold', param, callback);
}

exports.try_to_give_ingot = function (data, callback) {
    var param = [];
    param.push(data.account);
    param.push(data.target);
    param.push(data.ingot);
    call_proc('try_to_give_ingot', param, callback);
}

exports.daily_share = function (data, callback) {
    var param = [];
    param.push(data.account);
    call_proc('daily_share', param, callback);
}

exports.lock_user = function (data, callback) {
    var param = [];
    param.push(data.user_id);
    param.push(data.lock_status);
    call_proc('web_lock_user', param, callback);
}

exports.agent_status = function (data, callback) {
    var param = [];
    param.push(data.user_id);
    param.push(data.agent_status);
    call_proc('web_agent_status', param, callback);
}
exports.query = query;