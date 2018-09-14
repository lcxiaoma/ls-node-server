var db = require('../utils/db');
var logger = require('./log.js').log_poker_running;
const global = require('./global_setting').global;
const error = require('../config/error').error;
var crypto = require('../utils/crypto');

var rooms = {};
var creatingRooms = {};

var userLocation = {};
var totalRooms = 0;

var DI_FEN = [1,2,5];
var MAX_FAN = [3,4,5];
var JU_SHU = [4,8];
var JU_SHU_COST = [2,3];

function generateRoomId(){
	var roomId = "";
	for(var i = 0; i < 6; ++i){
		roomId += Math.floor(Math.random()*10);
	}
	return roomId;
}

//get seats num by config
function get_seats_num(conf){
	var seats_num =0;
	if(global.has_rule(conf.rule_index,global.MASK_PLE3)){
		seats_num = 3;
	}
	if(global.has_rule(conf.rule_index,global.MASK_PLE2)){
		seats_num = 2;
	}
	if(global.has_rule(conf.rule_index,global.MASK_PLE4))
	{
		seats_num = 4;
	}
	return seats_num;
}

//get max_game counts by conf
function get_max_games(conf,double_times){
	var max_games =0;
	if(global.has_rule(conf.rule_index,global.MASK_PC10)){
		max_games = 10;
	}
	if(global.has_rule(conf.rule_index,global.MASK_PC20)){
		max_games =20;
	}
	//活动次数加倍
	if(double_times){
		max_games *=2;
	}
	return max_games;
}

//get poker max number
function get_poker_nums(conf){
	//斗地主只有一副牌和2副牌选项
	var nums =0;
	if(global.has_rule(conf.type_index,global.GAME_TYPE_CLASSIC)){
		nums =48;
	}
	if(global.has_rule(conf.rule_index,global.MASK_CN_P1)){
		nums =52;
	}
	if(global.has_rule(conf.type_index,global.GAME_TYPE_15)){
		nums =45;
	}
	if(global.has_rule(conf.type_index,global.GAME_TYPE_CHANGE)){
		nums =48;
	}
	if(global.has_rule(conf.type_index,global.GAME_TYPE_FOUR_PLAY)){
		if(global.has_rule(conf.rule_index,global.MASK_CN_P1)){
			nums =52;
		}
		if(global.has_rule(conf.rule_index,global.MASK_CN_P2)){
			nums = 52;  //108  //两副牌功能关闭，强制改为一副牌  at 2017-07-10
		}
	}
	return nums;
}

//get hand card num
function get_card_nums(conf){
	var nums =0;
	//一副牌
	if(global.has_rule(conf.type_index,global.GAME_TYPE_CLASSIC)){
		nums =16;
	}
	if(global.has_rule(conf.type_index,global.GAME_TYPE_15)){
		nums =15;
	}
	if(global.has_rule(conf.type_index,global.GAME_TYPE_CHANGE)){
		nums =16;
		if(global.has_rule(conf.rule_index,global.MASK_CN_15)){
			nums = 15;
		}
		if(global.has_rule(conf.rule_index,global.MASK_PLE4) &&global.has_rule(conf.rule_index,global.MASK_CN_P1)){
			nums = 13;
		}
	}
	if(global.has_rule(conf.type_index,global.GAME_TYPE_FOUR_PLAY)){
		if(global.has_rule(conf.rule_index,global.MASK_CN_P1)){
			nums =13;
		}
		if(global.has_rule(conf.rule_index,global.MASK_CN_P2)){
			nums = 13;	//27  //两副牌功能关闭，强制改为一副牌  at 2017-07-10
		}
	}
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
function constructRoomFromDb(dbdata){

	var config_data = JSON.parse(dbdata.room_base_info);
	var roomInfo = {
		uuid:dbdata.uuid,
		id:dbdata.id,
		num_of_games:dbdata.num_of_turns,
		create_time:dbdata.create_time,
		next_button:dbdata.next_button,
		agent_user_id:dbdata.agent_user_id,
		conf:config_data,
		//read config
		seats_num:get_seats_num(config_data),
		seats:new Array(get_seats_num(config_data)),
	};
	//for test xzdd
	if(global.has_rule(roomInfo.conf.type_index,global.GAME_TYPE_CLASSIC)){
		roomInfo.gameMgr = require("./gamemgr_poker_run_classic");
	}
	else if (global.has_rule(roomInfo.conf.type_index,global.GAME_TYPE_15)){
		roomInfo.gameMgr = require("./gamemgr_poker_run_15");
	}
	else if (global.has_rule(roomInfo.conf.type_index,global.GAME_TYPE_CHANGE)){
		roomInfo.gameMgr = require("./gamemgr_poker_run_change");
	}
	else if (global.has_rule(roomInfo.conf.type_index,global.GAME_TYPE_FOUR_PLAY)){
		roomInfo.gameMgr = require("./gamemgr_poker_run_4player");
	}
	else{
		logger.warn("load not suport game room type");
		return;
	}
	var roomId = roomInfo.id;

	//名字需要转换成base64
	var seat_info =dbdata.seat_info
	var score_info = dbdata.score_info;
	if(seat_info !=''){
		seat_info = JSON.parse(seat_info);
	}else{
		seat_info =[];
	}
	if(score_info != ''){
		score_info = JSON.parse(score_info);
	}else{
		score_info =[];
	}
	for(var i =0;i<seat_info.length;++i){
		var score =0;
		if(score_info[i]){
			score = score_info[i];
		}
		var seat ={
			user_id:seat_info[i].user_id,
			score:score,
			name:crypto.fromBase64(seat_info[i].name),
			ready:seat_info[i].ready,
			seat_index:seat_info[i].seat_index,
			statistic:seat_info[i].statistic,
		}
		userLocation[seat_info[i].user_id] ={
			roomId:roomId,
			seatIndex:seat_info[i].seat_index
		}
		roomInfo.seats[i] = seat;
	}
	rooms[roomId] = roomInfo;
	totalRooms++;

	//get room info check if has game is running
	//检测是否有房间信息
	if(dbdata.gamebaseinfo != null){
		roomInfo.gameMgr.init_game_from_db(dbdata,roomInfo)
	}
	
	return roomInfo;
}

exports.createRoom = function(creator,roomConf,gems,ip,port,server_type,server_id,double_times,free,callback){
	
	//ROOM conf has check before,conf ={type_index :value,rule_index :value}

	var fnCreate = function(){
		var roomId = generateRoomId();
		if(rooms[roomId] != null || creatingRooms[roomId] != null){
			fnCreate();
		}
		else{
			creatingRooms[roomId] = true;
			db.is_room_exist(roomId, function(ret) {

				if(ret){
					delete creatingRooms[roomId];
					fnCreate();
				}
				else{
					var createTime = Math.ceil(Date.now()/1000);
					var roomInfo = {
						uuid:"",
						id:roomId,
						num_of_games:0,
						create_time:createTime,
						next_button:0,
						seats:[],
						conf:{
							server_type:server_type,//服务器类型
							type_index:roomConf.type_index,
							rule_index:roomConf.rule_index,
							creator:creator,
							doubles:double_times,	//是否有活动加倍
							free:free,				//是否是免费游戏
							max_games:get_max_games(roomConf,double_times),
							poker_nums:get_poker_nums(roomConf),
							card_nums:get_card_nums(roomConf),
						},
						seats_num:get_seats_num(roomConf)
					};
					logger.debug("create room room config = %s",JSON.stringify(roomInfo));
					//for test
					if(global.has_rule(roomInfo.conf.type_index,global.GAME_TYPE_CLASSIC)){
						roomInfo.gameMgr = require("./gamemgr_poker_run_classic");
					}
					else if (global.has_rule(roomInfo.conf.type_index,global.GAME_TYPE_15)){
						roomInfo.gameMgr = require("./gamemgr_poker_run_15");
					}
					else if (global.has_rule(roomInfo.conf.type_index,global.GAME_TYPE_CHANGE)){
						roomInfo.gameMgr = require("./gamemgr_poker_run_change");
					}
					else if (global.has_rule(roomInfo.conf.type_index,global.GAME_TYPE_FOUR_PLAY)){
						roomInfo.gameMgr = require("./gamemgr_poker_run_4player");
					}
					else{
						logger.warn('not suport room type = %s ',roomConf.type_index);
						callback(error.ROOM_CREATE_ROOM_TYPE_ERROR,null);
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
					// 	});
					// }
					

					//写入数据库
					var conf = roomInfo.conf;
					db.create_room(roomInfo.id,roomInfo.conf,ip,port,createTime,server_type,server_id,function(uuid){
						delete creatingRooms[roomId];
						if(uuid != null){
							roomInfo.uuid = uuid;
							rooms[roomId] = roomInfo;
							totalRooms++;
							callback(error.SUCCESS,roomId);
						}
						else{
							callback(error.ROOM_FAILED_UNDEFINED,null);
						}
					});
				}
			});
		}
	}

	fnCreate();
};

exports.destroy = function(roomId,reason){

	var roomInfo = rooms[roomId];
	if(roomInfo == null){
		return;
	}
	
	var user_info =[];
	for(var i = 0; i < roomInfo.seats_num; ++i){
		var seat_data = roomInfo.seats[i];
		if(!seat_data) continue;
		var userId = seat_data.user_id;
		if(userId > 0){
			db.set_room_id_of_user(userId,null);
			user_info.push(userId);			
			delete userLocation[userId];			
		}
	}
	

	var now = Math.ceil(Date.now()/1000);
	var data = {
		room_uuid:roomInfo.uuid,
		create_time:roomInfo.create_time,
		zip_reason:reason,
		zip_time:now,
		user_info:user_info
	}
	db.delete_room(data,function(err,rows,fields){
		if(err){
			logger.error(err.stack);
			return;
		}
		if(rows[0][0].result != 1){
			logger.warn("achive room result ==>",rows[0][0].result)
			return;
		}
	});

	delete rooms[roomId];
	totalRooms--;
}

exports.getTotalRooms = function(){
	return totalRooms;
}

exports.getRoom = function(roomId){
	return rooms[roomId];
};

exports.isCreator = function(roomId,userId){
	var roomInfo = rooms[roomId];
	if(roomInfo == null){
		return false;
	}
	return roomInfo.conf.creator == userId;
};

exports.enterRoom = function(roomId,user_info,callback){

	var userId = user_info.userId;
	var userName = user_info.name;
	var ingot = user_info.ingot;
	var gold = user_info.gold;

	var fnTakeSeat = function(room){
		//console.log("show me full room info ----------->",room)
		if(exports.getUserRoom(userId) == roomId){
			//已存在
			return error.SUCCESS;
		}
		//对消耗进行判断，如果消耗不够，则不让加入
		if(!room.conf.free){
			if(global.has_rule(room.conf.rule_index,global.MASK_GOLD_GAME)){
				var need_gold_value = global.get_ingot_value(room.conf.rule_index);
				if(gold < need_gold_value){
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

		//console.log(room.seats)
		//var seat_info_length = room.seats.length;
		var real_seat_num =0;
		//这里需要判断有效座位
		for(var i=0;i<room.seats_num;++i){
			var seat_data = room.seats[i];
			if(seat_data && seat_data.user_id >0){
				real_seat_num +=1;
			}
		}
		if(real_seat_num >= room.seats_num){
			return error.ROOM_ENTER_ROOM_FULL
		}else{
			//初始化新位置数据
			var data ={
				user_id:userId,
				name:userName,
				score:0,
				ready:false,
				seat_index:0,
				statistic:{
					max_score:0,
					boom_counts:0,
					win_counts:0,
					lose_counts:0,
					redheart_ten:0,
					total_score:0,
				}
			}
			var find_zero =null;
			for(var i=0;i<room.seats_num;++i){
				var seat_data = room.seats[i];
				if(!seat_data || seat_data.user_id <=0){
					find_zero =i;
					break;
				}
			}

			if(find_zero == null){
				var seat_index = room.seats.length;
				data.seat_index = seat_index;
				room.seats.push(data);
				userLocation[userId] ={
					roomId:roomId,
					seatIndex:seat_index	
				}
			}else{
				data.seat_index = find_zero;
				room.seats[find_zero] = data;
				userLocation[userId] ={
					roomId:roomId,
					seatIndex:find_zero,	
				}
			}
			

			//位置变化后更新数据库
			var seat_info =[];
			seat_info_length = room.seats.length;
			for(var j=0;j<seat_info_length;++j){
				if(!room.seats[j] || room.seats[j].user_id <=0){
					continue;
				}
				var d ={
					user_id:room.seats[j].user_id,
					name:crypto.toBase64(room.seats[j].name),
					imgurl:'',
					ready:room.seats[j].ready,
					seat_index:room.seats[j].seat_index,
					statistic:room.seats[j].statistic,
				}
				seat_info.push(d);
			}
			var data ={
				uuid:room.uuid,
				seat_info:seat_info,
				watch_seat_info:[],
			}
			db.update_seat_info2(data,function(err,rows,fields){
				if(err){
					logger.error(err.stack);
				}
			});
			return error.SUCCESS;
		}
	}
	var room = rooms[roomId];
	if(room){
		var ret = fnTakeSeat(room);
		callback(ret);
	}
	else{
		//从数据库加载信息
		self = this;
		db.load_game_from_db(roomId,function(err,rows,fileds){
			if(err){
				callback(error.ROOM_ENTER_NOT_FOUND);
				logger.debug("load game from db error :",err.stack);
				return;
			}
			if (rows[0].length <1){
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

exports.update_room_seat_info = function(room_id){
	var room = rooms[room_id];
	if(room){
		//位置变化后更新数据库
		var seat_info =[];
		var watch_seat_info =[];

		for(var j=0;j<room.seats_num;++j){
			if(room.seats[j] && room.seats[j].user_id >0){
				var d ={
					user_id:room.seats[j].user_id,
					name:crypto.toBase64(room.seats[j].name),
					imgurl:'',
					ready:room.seats[j].ready,
					seat_index:room.seats[j].seat_index,
					statistic:room.seats[j].statistic,
				}
				seat_info.push(d);
			}
			// if(room.watch_seats[j] && room.watch_seats[j].user_id>0){
			// 	var d ={
			// 		user_id:room.watch_seats[j].user_id,
			// 		name:crypto.toBase64(room.watch_seats[j].name),
			// 		imgurl:'',
			// 		ready:room.watch_seats[j].ready,
			// 		seat_index:room.watch_seats[j].seat_index,
			// 		statistic:room.watch_seats[j].statistic,
			// 		watch:room.watch_seats[j].watch,
			// 		game_counts:room.watch_seats[j].game_counts,
			// 		pay:room.watch_seats[j].pay,
			// 		join:room.watch_seats[j].join,
			// 	}
			// 	watch_seat_info.push(d);
			// }
			
		}
		var data ={
			uuid:room.uuid,
			seat_info:seat_info,
			watch_seat_info:watch_seat_info,
		}
		db.update_seat_info2(data,function(err,rows,fields){
			if(err){
				logger.error(err.stack);
			}
		});
	}
}


exports.setReady = function(userId,value){
	var roomId = exports.getUserRoom(userId);
	if(roomId == null){
		return;
	}

	var room = exports.getRoom(roomId);
	if(room == null){
		return;
	}

	var seatIndex = exports.getUserSeat(userId);
	if(seatIndex == null){
		return;
	}

	var s = room.seats[seatIndex];
	s.ready = value;
}

exports.isReady = function(userId){
	var roomId = exports.getUserRoom(userId);
	if(roomId == null){
		return;
	}

	var room = exports.getRoom(roomId);
	if(room == null){
		return;
	}

	var seatIndex = exports.getUserSeat(userId);
	if(seatIndex == null){
		return;
	}

	var s = room.seats[seatIndex];
	return s.ready;	
}


exports.getUserRoom = function(userId){
	var location = userLocation[userId];
	if(location != null){
		return location.roomId;
	}
	return null;
};

exports.getUserSeat = function(userId){
	var location = userLocation[userId];
	//console.log(userLocation[userId]);
	if(location != null){
		return location.seatIndex;
	}
	return null;
};

exports.getUserLocations = function(){
	return userLocation;
};

exports.getUserLocation = function(user_id){
	return userLocation[user_id];
};

exports.exitRoom = function(userId){
	var location = userLocation[userId];
	if(location == null)
		return;

	var roomId = location.roomId;
	var seatIndex = location.seatIndex;
	var room = rooms[roomId];
	delete userLocation[userId];
	if(room == null || seatIndex == null) {
		return;
	}

	var seat = room.seats[seatIndex];

	//logger.debug('exst room show me all room info',room);

	seat.user_id = 0;
	seat.name = "";

	var numOfPlayers = 0;
	for(var i = 0; i < room.seats.length; ++i){
		var seat_data =room.seats[i];
		if(seat_data &&seat_data.user_id > 0){
			numOfPlayers++;
		}
	}
	
	db.set_room_id_of_user(userId,null);
	
	if(numOfPlayers == 0){
		exports.destroy(roomId,gloabl.ROOM_ACHIVE_DIS);
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