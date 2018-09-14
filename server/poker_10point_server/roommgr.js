var db = require('../utils/db');
var logger = require('./log.js').log_points10;
const global = require('./global_setting').global;
const error = require('../config/error').error;
var crypto = require('../utils/crypto');

var rooms = {};
var creatingRooms = {};

var userLocation = {};
var totalRooms = 0;

var DI_FEN = [1, 2, 5];
var MAX_FAN = [3, 4, 5];
var JU_SHU = [4, 8];
var JU_SHU_COST = [2, 3];

function generateRoomId() {
	var roomId = "";
	for (var i = 0; i < 6; ++i) {
		roomId += Math.floor(Math.random() * 10);
	}
	return roomId;
}

//get seats num by config
function get_seats_num(conf) {
	var seats_num = 5;
	if (global.has_rule(conf.rule_index, global.MAX_PLAYER_8)) {
		seats_num = 8;
	}
	if (global.has_rule(conf.rule_index, global.MAX_PLAYER_5)) {
		seats_num = 5;
	}
	if (global.has_rule(conf.rule_index, global.UNLIMITED)) {
		console.log('chose unlimited seats.')
	}
	return seats_num;
}

//get max_game counts by conf
function get_max_games(conf,double) {
	var max_games = 0;
	if (global.has_rule(conf.rule_index, global.MASK_PC10)) {
		max_games = 10;
	}
	if (global.has_rule(conf.rule_index, global.MASK_PC20)) {
		max_games = 20;
	}
	if(double){
		max_games *=2;
	}
	return max_games;
}

//get poker max number
function get_poker_nums(conf) {
	//54张牌，包含大小王
	var nums = 54;
	return nums;
}

//get hand card num
function get_card_nums(conf) {
	var nums = 1;//10点半固定先给一张牌
	return nums;
}

////end_record
//max_score
//boom_times
//win_times
//lose_times
//total_score
////part_end_record
//name
//has_num
//boom_num
//score

/**
 * 从数据库创建房间
 *
 * @param {*} dbdata
 */
function constructRoomFromDb(dbdata) {

	var config_data = JSON.parse(dbdata.room_base_info);
	var tmp_change_info = {};
	if (dbdata.room_change_info && "" != dbdata.room_change_info) {
		tmp_change_info = JSON.parse(dbdata.room_change_info);
	} else {
		tmp_change_info = {
			less_begin: false,
			current_banker_index: 0,
			current_banker_score: 0,
			current_banker_count: 0,
			base_score: 0,
			// banker_circle: [0, 0],
			next_banker: -1,

		}
	}
	var roomInfo = {
		uuid: dbdata.uuid,
		id: dbdata.id,
		num_of_games: dbdata.num_of_turns,
		create_time: dbdata.create_time,
		next_button: dbdata.next_button,
		//less_begin:dbdata.next_button,
		agent_user_id:dbdata.agent_user_id,
		conf: config_data,
		//read config
		seats_num: get_seats_num(config_data),
		seats: new Array(get_seats_num(config_data)),
		watch_seats: new Array(get_seats_num(config_data)),//观察位置
		change_info: tmp_change_info,
	};
	//设置是否允许提前开始游戏
	//roomInfo.conf.less_begin = dbdata.next_button;
	//for test xzdd
	if (global.has_rule(roomInfo.conf.type_index, global.POINT105_CLASSIC)) {
		roomInfo.gameMgr = require("./gamemgr_poker_points10");
	}
	else {
		logger.warn("load not suport game room type");
		return;
	}
	var roomId = roomInfo.id;

	var seat_info = dbdata.seat_info;
	var watch_seat_info = dbdata.watch_seat;
	var score_info = dbdata.score_info;

	//转换保护
	if (seat_info != '') {
		seat_info = JSON.parse(seat_info);
	} else {
		seat_info = [];
	}
	if (score_info != '') {
		score_info = JSON.parse(score_info);
	} else {
		score_info = [];
	}
	if (watch_seat_info != '') {
		watch_seat_info = JSON.parse(watch_seat_info);
	} else {
		watch_seat_info = [];
	}

	for (var i = 0; i < seat_info.length; ++i) {
		var score = 0;
		if (score_info[i]) {
			score = score_info[i];
		}
		var seat = {
			user_id: seat_info[i].user_id,
			score: score,
			name: crypto.fromBase64(seat_info[i].name),
			ready: seat_info[i].ready,
			seat_index: seat_info[i].seat_index,
			statistic: seat_info[i].statistic,
			watch: seat_info[i].watch,
			game_counts: seat_info[i].game_counts,
			pay: seat_info[i].pay,
		}
		userLocation[seat_info[i].user_id] = {
			roomId: roomId,
			seatIndex: seat_info[i].seat_index
		}
		roomInfo.seats[i] = seat;
	}

	for (var i = 0; i < watch_seat_info.length; ++i) {
		var score = 0;
		var seat = {
			user_id: watch_seat_info[i].user_id,
			score: 0,
			name: crypto.fromBase64(watch_seat_info[i].name),
			ready: watch_seat_info[i].ready,
			seat_index: watch_seat_info[i].seat_index,
			statistic: watch_seat_info[i].statistic,
			watch: watch_seat_info[i].watch,
			game_counts: watch_seat_info[i].game_counts,
			pay: watch_seat_info[i].pay,
			join: watch_seat_info[i].join,
		}
		userLocation[watch_seat_info[i].user_id] = {
			roomId: roomId,
			seatIndex: watch_seat_info[i].seat_index,
		}
		roomInfo.watch_seats[i] = seat;
	}

	rooms[roomId] = roomInfo;
	totalRooms++;

	//get room info check if has game is running
	//检测是否有房间信息
	if (dbdata.gamebaseinfo != null) {
		roomInfo.gameMgr.init_game_from_db(dbdata, roomInfo)
	}

	return roomInfo;
}

/**
 * 创建房间
 *
 * @param {*} creator
 * @param {*} roomConf 客户端房间配置信息
 * @param {*} gems
 * @param {*} ip
 * @param {*} port
 * @param {*} server_type
 * @param {*} server_id
 * @param {*} callback
 */
exports.createRoom = function (creator, roomConf, gems, ip, port, server_type, server_id,double,free,callback) {

	//ROOM conf has check before,conf = {type_index :value, rule_index :value}

	var fnCreate = function () {
		var roomId = generateRoomId();
		if (rooms[roomId] != null || creatingRooms[roomId] != null) {
			fnCreate();
		}
		else {
			creatingRooms[roomId] = true;
			db.is_room_exist(roomId, function (ret) {

				if (ret) {
					delete creatingRooms[roomId];
					fnCreate();
				}
				else {
					var createTime = Math.ceil(Date.now() / 1000);
					var roomInfo = {
						uuid: "",
						id: roomId,
						num_of_games: 0,
						create_time: createTime,
						next_button: 0,
						seats: [],
						watch_seats: [],//观众席
						conf: {
							server_type: server_type,//服务器类型
							type_index: roomConf.type_index,
							rule_index: roomConf.rule_index,
							creator: creator,
							double:double,
							free:free,
							max_games: get_max_games(roomConf,double),
							poker_nums: get_poker_nums(roomConf),
							card_nums: get_card_nums(roomConf),
						},
						seats_num: get_seats_num(roomConf),
						//新增加房间可变信息
						change_info: {
							less_begin: false,
							current_banker_index: 0,
							current_banker_score: 0,
							current_banker_count: 0,
							base_score: 0,
							// banker_circle: [0, 0],
							next_banker: -1,
						}
					};
					logger.debug("create room room config = %s", JSON.stringify(roomInfo));
					//for test
					if (global.has_rule(roomInfo.conf.type_index, global.POINT105_CLASSIC)) {
						roomInfo.gameMgr = require("./gamemgr_poker_points10");
					}
					else {
						logger.warn('not suport room type = %s ', roomConf.type_index);
						callback(error.ROOM_CREATE_ROOM_TYPE_ERROR, null);
						return;
					}

					// var seats_num = get_seats_num(roomInfo.conf)
					// for(var i = 0; i < seats_num; ++i){
					// 	roomInfo.seats.push({
					// 		user_id:0,
					// 		score:0,
					// 		name:"",
					// 		ready:false,
					// 		seatIndex:i,
					// 		has_num:0,
					// 		boom_num:0,
					// 	});
					// }


					//写入数据库
					var conf = roomInfo.conf;
					db.create_room(roomInfo.id, roomInfo.conf, ip, port, createTime, server_type, server_id, function (uuid) {
						delete creatingRooms[roomId];
						if (uuid != null) {
							roomInfo.uuid = uuid;
							rooms[roomId] = roomInfo;
							totalRooms++;
							callback(error.SUCCESS, roomId);
						}
						else {
							callback(error.ROOM_FAILED_UNDEFINED, null);
						}
					});
				}
			});
		}
	}

	fnCreate();
};

exports.destroy = function (roomId, reason) {
	var roomInfo = rooms[roomId];
	if (roomInfo == null) {
		return;
	}

	var user_info = [];
	for (var i = 0; i < roomInfo.seats_num; ++i) {
		var seat_data = roomInfo.seats[i];
		if (seat_data) {
			if (seat_data.user_id > 0) {
				var userId = seat_data.user_id;
				db.set_room_id_of_user(userId, null);
				user_info.push(userId);
				delete userLocation[userId];
			}
		}

		var watch_seat = roomInfo.watch_seats[i];
		if (watch_seat) {
			if (watch_seat.user_id > 0) {
				var userId = watch_seat.user_id;
				db.set_room_id_of_user(userId, null);
				delete userLocation[userId];
			}
		}
	}

	var now = Math.ceil(Date.now() / 1000);
	var data = {
		room_uuid: roomInfo.uuid,
		create_time: roomInfo.create_time,
		zip_reason: reason,
		zip_time: now,
		user_info: user_info
	}
	db.delete_room(data, function (err, rows, fields) {
		if (err) {
			logger.error(err.stack);
			return;
		}
		if (rows[0][0].result != 1) {
			logger.warn("achive room result ==>", rows[0][0].result)
			return;
		}
	});

	delete rooms[roomId];
	totalRooms--;
}

exports.getTotalRooms = function () {
	return totalRooms;
}

exports.getRoom = function (roomId) {
	return rooms[roomId];
};

exports.isCreator = function (roomId, userId) {
	var roomInfo = rooms[roomId];
	if (roomInfo == null) {
		return false;
	}
	return roomInfo.conf.creator == userId;
};

//加入房间新添加观众，所以最好要判断游戏是否开始了，如果开始了，进入的玩家只能进入观众席
exports.enterRoom = function (roomId, user_info, callback) {
	var userId = user_info.userId;
	var userName = user_info.name;
	var ingot = user_info.ingot;
	var gold = user_info.gold;

	var fnTakeSeat = function (room) {
		if (exports.getUserRoom(userId) == roomId) {
			//已存在
			return error.SUCCESS;
		}
		if(!room.conf.free){
			//对消耗进行判断，如果消耗不够，则不让加入
			if (global.has_rule(room.conf.rule_index, global.MASK_GOLD_GAME)) {
				var need_gold_value = global.get_ingot_value(room.conf.rule_index);
				if (gold < need_gold_value) {
					return error.ROOM_ENTER_GOLD_NOT;
				}
			}
		}

		//如果没有允许游戏开始后允许进玩家，则，这里将不允许玩家加入
		if(!global.has_rule(room.conf.rule_index,global.NEW_ENTER)){
			if(room.num_of_games !=0){
				return error.ROOM_ENTER_NOT_NEW;
			}
		}

		var real_seat_num = 0;
		//这里需要判断有效座位
		for (var i = 0; i < room.seats_num; ++i) {
			var seat_data = room.seats[i];
			//新增可以用于动态加入的观众席
			var watch_seat_data = room.watch_seats[i];
			if (seat_data && seat_data.user_id > 0) {
				real_seat_num += 1;
			}
			if (watch_seat_data && watch_seat_data.user_id > 0) {
				real_seat_num += 1;
			}
		}
		if (real_seat_num >= room.seats_num) {
			return error.ROOM_ENTER_ROOM_FULL
		} else {
			//如果游戏开始了，那么对应的玩家只能进入观众席
			var new_seat_data = {
				user_id: userId,
				name: userName,
				score: 0,
				ready: false,
				seat_index: 0,
				statistic: {
					banker_count: 0,
					point105_type_count: {},
					total_score: 0
				},
				watch: false,
				game_counts: 0,//游戏的局数
				pay: false, //是否支付费用

			}

			if (!room.gameMgr.can_join(room.id)) {
				//进入观众席
				var find_zero = null;
				for (var i = 0; i < room.seats_num; ++i) {
					var watch_seat_data = room.watch_seats[i];
					if (!watch_seat_data || watch_seat_data.user_id < 0) {
						find_zero = i;
						break;
					}
				}

				if (find_zero == null) {
					var seat_index = room.watch_seats.length;
					new_seat_data.seat_index = seat_index;
					new_seat_data.game_counts = -1;
					new_seat_data.watch = true;
					new_seat_data.join = false;
					room.watch_seats.push(new_seat_data);
					userLocation[userId] = {
						roomId: roomId,
						seatIndex: seat_index,
					}
				} else {
					new_seat_data.seat_index = find_zero;
					new_seat_data.game_counts = -1;
					new_seat_data.watch = true;
					new_seat_data.join = false;
					room.watch_seats[find_zero] = new_seat_data;
					userLocation[userId] = {
						roomId: roomId,
						seatIndex: find_zero,
					}
				}

			} else {
				//正常进入游戏座位
				var find_zero = null;
				for (var i = 0; i < room.seats_num; ++i) {
					var seat_data = room.seats[i];
					if (!seat_data || seat_data.user_id <= 0) {
						find_zero = i;
						break;
					}
				}
				if (find_zero == null) {
					var seat_index = room.seats.length;
					new_seat_data.seat_index = seat_index;
					room.seats.push(new_seat_data);
					userLocation[userId] = {
						roomId: roomId,
						seatIndex: seat_index
					}
				} else {
					new_seat_data.seat_index = find_zero;
					room.seats[find_zero] = new_seat_data;
					userLocation[userId] = {
						roomId: roomId,
						seatIndex: find_zero,
					}
				}
			}

			//位置变化后更新数据库
			var seat_info = [];
			var watch_seat_info = [];

			for (var j = 0; j < room.seats_num; ++j) {
				if (room.seats[j] && room.seats[j].user_id > 0) {
					var d = {
						user_id: room.seats[j].user_id,
						name: crypto.toBase64(room.seats[j].name),
						imgurl: '',
						ready: room.seats[j].ready,
						seat_index: room.seats[j].seat_index,
						statistic: room.seats[j].statistic,
						watch: room.seats[j].watch,
						game_counts: room.seats[j].game_counts,
						pay: room.seats[j].pay,
					}
					seat_info.push(d);
				}
				if (room.watch_seats[j] && room.watch_seats[j].user_id > 0) {
					var d = {
						user_id: room.watch_seats[j].user_id,
						name: crypto.toBase64(room.watch_seats[j].name),
						imgurl: '',
						ready: room.watch_seats[j].ready,
						seat_index: room.watch_seats[j].seat_index,
						statistic: room.watch_seats[j].statistic,
						watch: room.watch_seats[j].watch,
						game_counts: room.watch_seats[j].game_counts,
						pay: room.watch_seats[j].pay,
						join: room.watch_seats[j].join,
					}
					watch_seat_info.push(d);
				}

			}
			var data = {
				uuid: room.uuid,
				seat_info: seat_info,
				watch_seat_info: watch_seat_info,
			}
			db.update_seat_info2(data, function (err, rows, fields) {
				if (err) {
					logger.error(err.stack);
				}
			});
			return error.SUCCESS;
		}
	}
	var room = rooms[roomId];
	if (room) {
		var ret = fnTakeSeat(room);
		callback(ret);
	}
	else {
		//从数据库加载信息
		self = this;
		db.load_game_from_db(roomId, function (err, rows, fileds) {
			//console.log("load game from db rows--->",rows)
			if (err) {
				callback(error.ROOM_ENTER_NOT_FOUND);
				logger.debug("load game from db error :", err.stack);
				return;
			}
			if (rows[0].length < 1) {
				logger.debug(rows[0])
				callback(error.ROOM_ENTER_NOT_FOUND);
				return;
			}
			room = constructRoomFromDb(rows[0][0]);
			var ret = fnTakeSeat(room);
			callback(ret);
		});
		// db.get_room_data(roomId,function(dbdata){
		// 	if(dbdata == null){
		// 		//找不到房间
		// 		callback(error.ROOM_ENTER_NOT_FOUND);
		// 	}
		// 	else{
		// 		//construct room.
		// 		room = constructRoomFromDb(dbdata);
		// 		//
		// 		var ret = fnTakeSeat(room);
		// 		callback(ret);
		// 	}
		// });
	}
};

exports.update_room_seat_info = function (room_id) {
	var room = rooms[room_id];
	if (room) {
		//位置变化后更新数据库
		var seat_info = [];
		var watch_seat_info = [];

		for (var j = 0; j < room.seats_num; ++j) {
			if (room.seats[j] && room.seats[j].user_id > 0) {
				var d = {
					user_id: room.seats[j].user_id,
					name: crypto.toBase64(room.seats[j].name),
					imgurl: '',
					ready: room.seats[j].ready,
					seat_index: room.seats[j].seat_index,
					statistic: room.seats[j].statistic,
					watch: room.seats[j].watch,
					game_counts: room.seats[j].game_counts,
					pay: room.seats[j].pay,
				}
				seat_info.push(d);
			}
			if (room.watch_seats[j] && room.watch_seats[j].user_id > 0) {
				var d = {
					user_id: room.watch_seats[j].user_id,
					name: crypto.toBase64(room.watch_seats[j].name),
					imgurl: '',
					ready: room.watch_seats[j].ready,
					seat_index: room.watch_seats[j].seat_index,
					statistic: room.watch_seats[j].statistic,
					watch: room.watch_seats[j].watch,
					game_counts: room.watch_seats[j].game_counts,
					pay: room.watch_seats[j].pay,
					join: room.watch_seats[j].join,
				}
				watch_seat_info.push(d);
			}

		}
		var data = {
			uuid: room.uuid,
			seat_info: seat_info,
			watch_seat_info: watch_seat_info,
		}
		db.update_seat_info2(data, function (err, rows, fields) {
			if (err) {
				logger.error(err.stack);
			}
		});
	}
}


exports.setReady = function (userId, value) {
	var roomId = exports.getUserRoom(userId);
	if (roomId == null) {
		return 0;
	}

	var room = exports.getRoom(roomId);
	if (room == null) {
		return 0;
	}

	var seatIndex = exports.getUserSeat(userId);
	if (seatIndex == null) {
		return 0;
	}

	var s = room.seats[seatIndex];
	if (s && s.user_id == userId) {
		s.ready = value;
		return 1;
	} else {
		var ss = null;
		for (var i = 0; i < room.watch_seats.length; ++i) {
			if (room.watch_seats[i] && room.watch_seats[i].user_id == userId) {
				ss = room.watch_seats[i];
				break;
			}
		}
		if (ss && ss.user_id == userId) {
			ss.ready = value;
			return 2;
		}
	}
	return 0;

}

exports.isReady = function (userId) {
	var roomId = exports.getUserRoom(userId);
	if (roomId == null) {
		return;
	}

	var room = exports.getRoom(roomId);
	if (room == null) {
		return;
	}

	var seatIndex = exports.getUserSeat(userId);
	if (seatIndex == null) {
		return;
	}

	var s = room.seats[seatIndex];
	if (s) {
		return s.ready;
	} else {
		for (var i = 0; i < room.watch_seats.length; ++i) {
			if (room.watch_seats[i] && room.watch_seats[i].user_id == userId) {
				s = room.watch_seats[i];
				return s.ready;
			}
		}
	}

}


exports.getUserRoom = function (userId) {
	var location = userLocation[userId];
	if (location != null) {
		return location.roomId;
	}
	return null;
};

exports.getUserSeat = function (userId) {
	var location = userLocation[userId];
	if (location != null) {
		return location.seatIndex;
	}
	return null;
};

exports.getUserLocations = function () {
	return userLocation;
};

exports.exitRoom = function (userId) {
	var location = userLocation[userId];
	if (location == null)
		return;

	var roomId = location.roomId;
	var seatIndex = location.seatIndex;
	var room = rooms[roomId];
	delete userLocation[userId];
	if (room == null || seatIndex == null) {
		return;
	}

	var seat = room.seats[seatIndex];

	//logger.debug('exst room show me all room info',room);

	seat.user_id = 0;
	seat.name = "";

	var numOfPlayers = 0;
	for (var i = 0; i < room.seats.length; ++i) {
		var seat_data = room.seats[i];
		if (seat_data && seat_data.user_id > 0) {
			numOfPlayers++;
		}
	}

	db.set_room_id_of_user(userId, null);

	if (numOfPlayers == 0) {
		exports.destroy(roomId);
	}else{
		exports.update_room_seat_info(roomId)
	}
};


exports.transfer_update = function(room_id){
	var room = rooms[room_id];
	if(room){
		db.update_room_base_info(room.uuid,room.conf,function(err){
			if(err){
				exports.update_room_seat_info(room_id);
			}
		});
	}
}


exports.kick_user = function(user_id){
	db.set_room_id_of_user(user_id,null);		
	delete userLocation[user_id];
}


exports.getUserLocation = function(user_id){
	return userLocation[user_id];
};
