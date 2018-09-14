var roomMgr = require('./roommgr');
var logger = require('./log').log_poker_21;

var userList = {};
var userOnline = 0;
exports.bind = function (userId, socket) {
	userList[userId] = socket;
	userOnline++;
};

/**
 * 删除玩家, 计数递减
 */
exports.del = function (userId, socket) {
	delete userList[userId];
	userOnline--;
};

/**
 * 获取一个用户
 */
exports.get = function (userId) {
	return userList[userId];
};

/**
 * 判断一个用户是否在线
 */
exports.isOnline = function (userId) {
	var data = userList[userId];
	if (data != null) {
		return true;
	}
	return false;
};

/**
 * 获取在线数
 */
exports.getOnlineCount = function () {
	return userOnline;
}

/**
 * 给一个用户发送消息
 */
exports.sendMsg = function (userId, event, msgdata) {
	// logger.debug('user[%d],event = %s,data = %s', userId, event, JSON.stringify(msgdata));
	logger.debug(`user[${userId}], event = ${event}, data = `, msgdata)
	var userInfo = userList[userId];
	if (userInfo == null) {
		return;
	}
	var socket = userInfo;
	if (socket == null) {
		return;
	}

	socket.emit(event, msgdata);
};

/**
 * 清理解散房间的资源
 */
exports.kickAllInRoom = function (roomId) {
	if (roomId == null) {
		return;
	}
	var roomInfo = roomMgr.getRoom(roomId);
	if (roomInfo == null) {
		return;
	}

	for (var i = 0; i < roomInfo.seats_num; ++i) {
		var rs = roomInfo.seats[i];
		if (rs) {
			if (rs.user_id > 0) {
				var socket = userList[rs.user_id];
				if (socket) {
					exports.del(rs.user_id);
					socket.disconnect();
				}
			}
		}

		var w_rs = roomInfo.watch_seats[i];
		if (w_rs) {
			if (w_rs.user_id > 0) {
				var socket = userList[w_rs.user_id];
				if (socket) {
					exports.del(w_rs.user_id);
					socket.disconnect();
				}
			}
		}
	}
};

/**
 * 房间内广播消息
 */
exports.broacastInRoom = function (event, data, sender, includingSender) {
	logger.debug("broadcast[%s] data[%s],sender[%d]", event, JSON.stringify(data), sender);
	var roomId = roomMgr.getUserRoom(sender);
	if (roomId == null) {
		return;
	}
	var roomInfo = roomMgr.getRoom(roomId);
	if (roomInfo == null) {
		return;
	}

	for (var i = 0; i < roomInfo.seats_num; ++i) {
		var rs = roomInfo.seats[i];
		if (rs) {
			if (rs.user_id > 0) {
				if (rs.user_id == sender && !includingSender) continue;
				var socket = userList[rs.user_id];
				if (socket != null) {
					socket.emit(event, data);
				}
			}
		}

		var w_rs = roomInfo.watch_seats[i];
		if (w_rs) {
			if (w_rs.user_id > 0) {
				if (w_rs.user_id == sender && !includingSender) continue;
				var socket = userList[w_rs.user_id];
				if (socket) {
					socket.emit(event, data);
				}
			}
		}
	}
};

/**
 * 给指定房间ID发送广播消息
 */
exports.send_to_room = function (event, data, room_id) {
	logger.debug("send to room[%s] data[%s],room_id[%d]", event, JSON.stringify(data), room_id);
	var roomInfo = roomMgr.getRoom(room_id);
	if (roomInfo == null) {
		return;
	}
	for (var i = 0; i < roomInfo.seats_num; ++i) {
		var rs = roomInfo.seats[i];
		if (rs) {
			if (rs.user_id > 0) {
				var socket = userList[rs.user_id];
				if (socket != null) {
					socket.emit(event, data);
				}
			}
		}
		var w_rs = roomInfo.watch_seats[i];
		if (w_rs) {
			if (w_rs.user_id > 0) {
				var socket = userList[w_rs.user_id];
				if (socket != null) {
					socket.emit(event, data);
				}
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
