var crypto = require('../utils/crypto');
var db = require('../utils/db');
var logger = require('./log.js').log_points10;
const error = require('../config/error').error;
const global = require('./global_setting').global;
const msgtemplete = require('./msgdefine').msg_templete;

var tokenMgr = require('./tokenmgr');
var roomMgr = require('./roommgr');
var userMgr = require('./usermgr');

function show_request(commond, args) {
	logger.debug('Socket[%s][%s]', commond, args);
}

function gm_command(socket, command) {
	console.warn("GM Command-===============>", command);
	if (command[0] == "user_action") {
		socket.gameMgr.user_action(socket.userId, JSON.stringify({ action_type: Number(command[1]), action_target: Number(command[2]) }));
	}
	if (command[0] == "betting") {
		socket.gameMgr.betting(socket.userId, JSON.stringify({ betting_type: Number(command[1]), coin: Number(command[2]) }));
	}
}

var io = null;
exports.start = function (config, mgr) {
	io = require('socket.io')(config.CLIENT_PORT);
	io.sockets.on('connection', function (socket) {
		/**
		 * 登陆
		 */
		socket.on('login', function (data) {
			show_request('login', data);
			data = JSON.parse(data);
			if (socket.userId != null) {
				//已经登陆过的就忽略
				return;
			}
			var token = data.token;
			var roomId = data.roomid;
			var time = data.time;
			var sign = data.sign;


			//检查参数合法性
			if (token == null || roomId == null || sign == null || time == null) {
				logger.warn("login_result, errcode = %d msg= %s", 1, "invalid parameters");
				socket.emit('login_result', { errcode: 1, errmsg: "invalid parameters" });
				return;
			}

			//检查参数是否被篡改
			var md5 = crypto.md5(roomId + token + time + config.ROOM_PRI_KEY);
			if (md5 != sign) {
				logger.warn("login_result, errcode = %d msg= %s", 2, "login failed. invalid sign!");
				socket.emit('login_result', { errcode: 2, errmsg: "login failed. invalid sign!" });
				return;
			}

			//检查token是否有效
			if (tokenMgr.isTokenValid(token) == false) {
				logger.warn("login_result, errcode = %d msg= %s", 3, "token out of time.");
				socket.emit('login_result', { errcode: 3, errmsg: "token out of time." });
				return;
			}

			//检查房间合法性
			var userId = tokenMgr.getUserID(token);
			var roomId = roomMgr.getUserRoom(userId);

			userMgr.bind(userId, socket);
			socket.userId = userId;

			//返回房间信息
			var roomInfo = roomMgr.getRoom(roomId);
			var seatIndex = roomMgr.getUserSeat(userId);
			//console.log("seat_index ==============>",seatIndex)
			//新增观众席
			var seat_info = roomInfo.seats[seatIndex];
			if (!seat_info) {
				for (var i = 0; i < roomInfo.watch_seats.length; ++i) {
					var tmp = roomInfo.watch_seats[i];
					if (tmp && tmp.user_id == userId) {
						seat_info = roomInfo.watch_seats[i];
						break;
					}
				}
			}
			//roomInfo.seats[seatIndex].ip = socket.handshake.address;
			seat_info.ip = socket.handshake.address;

			var userData = null;
			var seats = [];
			var is_watch = false;
			for (var i = 0; i < roomInfo.seats.length; ++i) {
				var rs = roomInfo.seats[i];
				if (rs && rs.user_id > 0) {
					var online = userMgr.isOnline(rs.user_id);
					seats.push({
						userid: rs.user_id,
						ip: rs.ip,
						score: rs.score,
						name: rs.name,
						online: online,
						ready: rs.ready,
						seatindex: i,
						holds: rs.holds,
						folds: rs.folds,
						watch: rs.watch,
					});

					if (userId == rs.user_id) {
						userData = seats[i];
					}
				}
			}
			for (var i = 0; i < roomInfo.watch_seats.length; ++i) {
				var rs = roomInfo.watch_seats[i];
				if (rs && rs.user_id > 0) {
					var online = userMgr.isOnline(rs.user_id);
					seats.push({
						userid: rs.user_id,
						ip: rs.ip,
						score: rs.score,
						name: rs.name,
						online: online,
						ready: rs.ready,
						seatindex: rs.seat_index,
						holds: [],
						folds: [],
						watch: rs.watch,
						join: rs.join,
					});
					if (userId == rs.user_id) {
						is_watch = true;
						userData = seats[rs.seat_index];
					}
				}
			}
			//通知前端
			var ret = {
				errcode: 0,
				errmsg: "ok",
				data: {
					roomid: roomInfo.id,
					conf: roomInfo.conf,
					num_of_games: roomInfo.num_of_games,
					seats: seats
				}
			};

			logger.debug("login result ==>", JSON.stringify(ret));

			socket.emit('login_result', ret);

			//通知其它客户端
			if (is_watch) {
				//userMgr.broacastInRoom('new_watcher_comes_push',userData,userId);
				socket.emit('new_watcher_comes_push', userData);
			} else {
				userMgr.broacastInRoom('new_user_comes_push', userData, userId);
			}

			socket.gameMgr = roomInfo.gameMgr;

			//玩家上线，强制设置为TRUE
			//只有游戏开始的时候才需要强制设置为true
			var game = roomInfo.gameMgr.get_game_by_user(userId);
			//console.log("show me reconnected info ====>",game.current_banker_count,seatIndex,game.button)
			if (game) {
				//logger.debug("login check  game state ==%d",game.state)
				if (game.state != global.GAME_STATE_FREE) {
					socket.gameMgr.set_ready(userId, true);
				}
				else if (game.state == global.GAME_STATE_FREE) {
					//断线重连判断是否可以下庄
					//TODO 服务器异常断线下不能处理
					//console.log("show me reconnected info ====>",game.current_banker_count,seatIndex,game.button)
					if (game.current_banker_count >= 3 && game.current_banker_score >= game.base_score * 3 && seatIndex == game.button) {
						userMgr.sendMsg(userId, 'off_banker_state', { off_index: game.button });
					}
				}
			}

			socket.emit('login_finished');

			if (roomInfo.dr != null) {
				var dr = roomInfo.dr;
				var ramaingTime = (dr.endTime - Date.now()) / 1000;
				var data = {
					time: ramaingTime,
					states: dr.states
				}
				userMgr.sendMsg(userId, 'dissolve_notice_push', data);
			}
		});

		/**
		 * 准备
		 */
		socket.on('ready', function (data) {
			show_request('ready', data);
			var userId = socket.userId;
			if (userId == null) {
				return;
			}
			socket.gameMgr.set_ready(userId, true);
			//userMgr.broacastInRoom('user_ready_push',{userid:userId,ready:true},userId,true);
		});

		/**
		 * 准备加入游戏
		 */
		socket.on('join', function (data) {
			show_request('join', data);
			var userId = socket.userId;
			if (userId == null) {
				return;
			}
			socket.gameMgr.set_join(userId, true);
		});
		/**
		 * 叫庄
		 */
		socket.on('call_banker', function (data) {
			show_request('call_banker', data);
			var user_id = socket.userId;
			if (user_id == null) return;
			socket.gameMgr.call_banker(user_id, data);
		});

		/**
		 * 21点主动开始游戏
		 */
		socket.on('start_play', function (data) {
			show_request('start_play', data);

			var user_id = socket.userId;
			if (user_id == null) return;

			socket.gameMgr.start_play(user_id);
			//userMgr.broacastInRoom('start_play_push',{userid:user_id});
		});

		/**
		 * 21点开始提示
		 */
		socket.on('start_play_choice', function (data) {
			show_request('start_play_choice', data);

			var user_id = socket.userId;
			if (user_id == null) return;
			socket.gameMgr.start_play_choice(user_id, data);
		});

		/**
		 * 下注
		 */
		socket.on('betting', function (data) {
			show_request('betting', data);
			var user_id = socket.userId;
			if (user_id == null) return;
			socket.gameMgr.betting(user_id, data);
		});

		/**
		 * 玩家动作
		 */
		socket.on('user_action', function (data) {
			show_request('user_action', data);
			var user_id = socket.userId;
			if (user_id == null) return;
			socket.gameMgr.user_action(user_id, data)
		});

		/**
		 * 聊天
		 */
		socket.on('chat', function (data) {
			if (socket.userId == null) {
				return;
			}
			var chatContent = data;
			// //for test
			// if (chatContent.indexOf("/") != -1) {
			// 	chatContent = chatContent.replace('/', '');
			// 	var ar = chatContent.split(' ');
			// 	gm_command(socket, ar);
			// 	return;
			// }
			// //test end
			userMgr.broacastInRoom('chat_push', { sender: socket.userId, content: chatContent }, socket.userId, true);
		});

		/**
		 * 快速聊天
		 */
		socket.on('quick_chat', function (data) {
			if (socket.userId == null) {
				return;
			}
			var chatId = data;
			userMgr.broacastInRoom('quick_chat_push', { sender: socket.userId, content: chatId }, socket.userId, true);
		});

		/**
		 * 语音聊天
		 */
		socket.on('voice_msg', function (data) {
			if (socket.userId == null) {
				return;
			}
			console.log(data.length);
			userMgr.broacastInRoom('voice_msg_push', { sender: socket.userId, content: data }, socket.userId, true);
		});

		/**
		 * 表情
		 */
		socket.on('emoji', function (data) {
			if (socket.userId == null) {
				return;
			}
			var phizId = data;
			userMgr.broacastInRoom('emoji_push', { sender: socket.userId, content: phizId }, socket.userId, true);
		});

		//语音使用SDK不出现在这里

		/**
		 * 退出房间仅限于非房主 游戏未开始
		 */
		socket.on('exit', function (data) {
			show_request('exit', data);
			var userId = socket.userId;
			if (userId == null) {
				return;
			}

			var roomId = roomMgr.getUserRoom(userId);
			if (roomId == null) {
				return;
			}

			var room = roomMgr.getRoom(roomId);
			if (room == null) return;
			if (room.num_of_games != 0) {
				return;
			}

			// //如果游戏已经开始，则不可以
			// if(socket.gameMgr.has_began(roomId)){
			// 	return;
			// }

			//如果是房主，则只能走解散房间
			if (roomMgr.isCreator(roomId, userId)) {
				return;
			}

			//通知其它玩家，有人退出了房间
			userMgr.broacastInRoom('exit_notify_push', userId, userId, false);

			roomMgr.exitRoom(userId);
			userMgr.del(userId);

			socket.emit('exit_result');
			socket.disconnect();
		});

		/**
		 * 解散房间 仅限于房主 游戏未开始
		 */
		socket.on('dispress', function (data) {
			show_request('dispress', data);
			var userId = socket.userId;
			if (userId == null) {
				return;
			}

			var roomId = roomMgr.getUserRoom(userId);
			if (roomId == null) {
				return;
			}

			var room = roomMgr.getRoom(roomId);
			if (room == null) return;
			if (room.num_of_games != 0) {
				return;
			}
			// //如果游戏已经开始，则不可以
			// if(socket.gameMgr.has_began(roomId)){
			// 	return;
			// }
			//如果不是房主，则不能解散房间
			if (roomMgr.isCreator(roomId, userId) == false) {
				return;
			}

			userMgr.broacastInRoom('dispress_push', {}, userId, true);
			userMgr.kickAllInRoom(roomId);
			roomMgr.destroy(roomId, global.ROOM_ACHIVE_DIS);
			socket.disconnect();
		});

		/**
		 * 申请解散房间
		 */
		socket.on('dissolve_request', function (data) {
			show_request('dissolve_request', data);
			var userId = socket.userId;
			if (userId == null) {
				return;
			}

			var roomId = roomMgr.getUserRoom(userId);
			if (roomId == null) {
				return;
			}
			var room = roomMgr.getRoom(roomId);
			if (room == null) return;
			if (room.num_of_games == 0) {
				return;
			}
			// //如果游戏未开始，则不可以
			// if(socket.gameMgr.has_began(roomId) == false){
			// 	return;
			// }

			var ret = socket.gameMgr.apply_dissmiss(roomId, userId);
			if (ret != null) {
				var dissmiss = ret.dissmiss;
				var ramaingTime = (dissmiss.endTime - Date.now()) / 1000;
				var data = {
					mask: dissmiss.chose_index,
					time: ramaingTime,
					states: dissmiss.states
				}
				userMgr.broacastInRoom('dissolve_notice_push', data, userId, true);
			}
		});

		/**
		 * 同意解散
		 */
		socket.on('dissolve_agree', function (data) {
			var userId = socket.userId;

			if (userId == null) {
				return;
			}

			var roomId = roomMgr.getUserRoom(userId);
			if (roomId == null) {
				return;
			}

			var ret = socket.gameMgr.dissolve_operation(roomId, userId, true);
			if (ret != null) {
				var dissmiss = ret.dissmiss;
				var ramaingTime = (dissmiss.endTime - Date.now()) / 1000;
				var data = {
					mask: dissmiss.chose_index,
					time: ramaingTime,
					states: dissmiss.states
				}
				userMgr.broacastInRoom('dissolve_notice_push', data, userId, true);

				var all_agree = true;
				for (var i = 0; i < dissmiss.states.length; ++i) {
					if (dissmiss.states[i] == false) {
						all_agree = false;
						break;
					}
				}

				if (all_agree) {
					socket.gameMgr.force_over_room(roomId);
				}
			}
		});

		/**
		 * 拒绝解散
		 */
		socket.on('dissolve_reject', function (data) {
			var userId = socket.userId;

			if (userId == null) {
				return;
			}

			var roomId = roomMgr.getUserRoom(userId);
			if (roomId == null) {
				return;
			}

			var ret = socket.gameMgr.dissolve_operation(roomId, userId, false);
			if (ret != null) {
				userMgr.broacastInRoom('dissolve_cancel_push', {}, userId, true);
			}
		});

		/**
		 * 断开链接
		 */
		socket.on('disconnect', function (data) {
			var userId = socket.userId;
			if (!userId) {
				return;
			}

			var now_socket = userMgr.get(userId)
			if (now_socket) {
				if (socket.id != now_socket.id) {
					socket.disconnect();
					return;
				}
			}

			var data = {
				userid: userId,
				online: false
			};

			//清除玩家的在线信息
			userMgr.del(userId);

			//通知房间内其它玩家
			userMgr.broacastInRoom('user_state_push', data, userId);

			//清除准备状态
			socket.gameMgr.set_ready(userId, false);

			socket.userId = null;
			socket.disconnect();
		});

		/**
		 * 客户端心跳应答
		 */
		socket.on('game_ping', function (data) {
			var userId = socket.userId;
			if (!userId) {
				return;
			}
			//console.log('game_ping');
			socket.emit('game_pong');
		});

		//转让房主
		//只有房主能操作
		//只能在游戏空闲的时候可以踢出
		//transfer的也是userid
		socket.on('transfer',function(data){
			show_request('transfer',data);
			if(socket.userId == null){ 
				return;
			}
			var user_id = socket.userId;
			var roomId = roomMgr.getUserRoom(user_id);
			if(!roomId){
				return;
			}
			if(!roomMgr.isCreator(roomId,user_id)){
				return;
			}
			var room = roomMgr.getRoom(roomId);
			if(!room){
				return;
			}
			if(room.num_of_games !=0){
				return;
			}
			data = JSON.parse(data);
			var target = data.target;
			if(!target){
				return;
			}
			if(target == user_id){
				return;
			}
			var target_roomId = roomMgr.getUserRoom(target)
			if(target_roomId != roomId){
				return;
			}
			var src_location = roomMgr.getUserLocation(user_id);
			var tgt_location = roomMgr.getUserLocation(target);
			var src_seat_index = roomMgr.getUserSeat(user_id);
			var tgt_seat_index = roomMgr.getUserSeat(target);
			var src_seat = room.seats[src_seat_index];
			var tgt_seat = room.seats[tgt_seat_index];
			//开始更换.
			//1.将座位信息互换.
			room.seats[src_seat_index] = tgt_seat;
			room.seats[tgt_seat_index] = src_seat;
			//2.将座位信息中位置索引互换.
			src_seat.seat_index = tgt_seat_index;
			tgt_seat.seat_index = src_seat_index;
			//3.将location中位置索引互换.
			src_location.seatIndex = tgt_seat_index;
			tgt_location.seatIndex = src_seat_index;
			//4.将房间的创建者改为目标玩家.
			room.conf.creator = target;
			//5.更新房间信息.
			roomMgr.transfer_update(roomId);
			//6.推送给客服端.
			var msg = JSON.parse(msgtemplete.SC_Transfer);
			var length = room.seats.length;
			for(var i=0; i<length; ++i){
				var seat = room.seats[i];
				if(!seat){
					continue;
				}
				msg.new_seat.push(seat.user_id);
			}
			userMgr.send_to_room("transfer", msg, room.id);
		});

		//踢出房间
		//只有房主能操作
		//只能在游戏空闲的时候可以踢出
		//踢出的人的userid
		socket.on('kick',function(data){
			show_request('kick',data);
			if(socket.userId == null){
				return;
			}
			var user_id = socket.userId;
			var roomId = roomMgr.getUserRoom(user_id);
			if(!roomId){
				return;
			}
			if(!roomMgr.isCreator(roomId,user_id)){
				return;
			}
			var room = roomMgr.getRoom(roomId);
			if(!room){
				return;
			}
			if(room.num_of_games !=0){
				return;
			}
			data = JSON.parse(data);
			var target = data.target;
			if(!target){
				return;
			}
			if(target == user_id){
				return;
			}
			var target_roomId = roomMgr.getUserRoom(target)
			if(target_roomId != roomId){
				return;
			}
			var tgt_location = roomMgr.getUserLocation(target);
			var tgt_seat_index = roomMgr.getUserSeat(target);
			var tgt_seat = room.seats[tgt_seat_index];
			if(!tgt_seat){
				return;
			}
			//1.踢掉目标玩家
			var msg = JSON.parse(msgtemplete.SC_Kick);
			msg.kicked = target;
			userMgr.sendMsg(target, 'kick', msg);
			userMgr.kickUserInRoom(roomId,target);
			//2.将座位信息顺移.
			var length = room.seats.length;
			var temp_seats = [];
			for(var i=0; i<length; ++i){
				if(i!=tgt_seat_index){
					var temp_seat = room.seats[i];
					if(temp_seat && temp_seat.user_id>0){
						temp_seats.push(temp_seat);
					}
				}
			}
			room.seats = temp_seats;
			//3.将新的座位信息的座位索引和Location中的座位索引进行更新.
			length = room.seats.length;
			for(var i=0; i<length; ++i){
				var temp_seat = room.seats[i];
				if(temp_seat && temp_seat.user_id>0){
					temp_seat.seat_index = i;
					var location = roomMgr.getUserLocation(temp_seat.user_id);
					location.seatIndex = i;
				}
			}
			//4.删除目标玩家Location中数据
			roomMgr.kick_user(target);
			//5.更新房间信息.
			roomMgr.update_room_seat_info(roomId);
			//6.推送给客服端.
			msg = JSON.parse(msgtemplete.SC_Kick);
			msg.kicked = target;
			var length = room.seats.length;
			for(var i=0; i<length; ++i){
				var seat = room.seats[i];
				if(!seat){
					continue;
				}
				msg.new_seat.push(seat.user_id);
			}
			userMgr.send_to_room("kick", msg, room.id);
		});
	});

	logger.info("POKER 10.5 SOCKET RUNNING ON: " + config.CLIENT_PORT);
};
