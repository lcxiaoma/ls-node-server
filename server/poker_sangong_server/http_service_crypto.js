var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require('../utils/http');
var logger = require('./log.js').log_sangong;
var global = require('./global_setting').global;
const error = require('../config/error').error;
var secret = require('../utils/secret');

var tokenMgr = require('./tokenmgr');
var roomMgr = require('./roommgr');
var userMgr = require('./usermgr');

var app = express();
var config = null;

var serverIp = "";
var private_key = null;
var my_key = null;

var global_setting = require('../config/global_setting').global_setting;

function show_request(commond,args){
	if(global_setting.LOG_LEVEL <global_setting.LOG_INFO){
		logger.debug('Http[%s][%s]',commond,args);
	}
}

//转换JSON保护
function try_parse_json(json_str){
	try {
		var json = JSON.parse(json_str);
		return json;
	} catch (err) {
		return null;
	}
}

//测试
app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By",' 3.2.1');
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});

app.get('/get_server_info',function(req,res){
	show_request('get_server_info',JSON.stringify(req.query));
	var data = secret.aes_decrypt(req.query.data,private_key);
	if(data == null) return;

	var reqdata = try_parse_json(data);
	if(reqdata == null){
		logger.error("/get_server_info try to parse json failed.");
		return;
	}

	var serverId = reqdata.serverid;
	if(serverId  != config.SERVER_ID){
		http.crypto_send(res,error.SYSTEM_ARGS_ERROR,"invalid parameters",null,private_key);
		return;
	}

	var locations = roomMgr.getUserLocations();
	var arr = [];
	for(var userId in locations){
		var roomId = locations[userId].roomId;
		arr.push(userId);
		arr.push(roomId);
	}
	//http.send(res,error.SUCCESS,"ok",{userroominfo:arr});
	http.crypto_send(res,error.SUCCESS,"ok",{userroominfo:arr},private_key);
});

app.get('/create_room',function(req,res){
	//parameters {userid:0,gems:'',conf:{},sign:''}
	//conf:{type_index:0,rule_index:0}
	show_request('create_room',JSON.stringify(req.query));
	var data = secret.aes_decrypt(req.query.data,private_key);
	if(data == null) return;
	var reqdata = try_parse_json(data);
	if(reqdata == null){
		logger.error("/create_room try to parse json failed.");
		return;
	}

	var userId = parseInt(reqdata.userid);
	var ingot = reqdata.ingot;
	var gold = reqdata.gold;
	var conf = reqdata.conf;

	//参数合法性检测
	if(userId == null || ingot == null || gold == null|| conf == null){
		http.crypto_send(res,error.ROOM_CREATE_ARGS_ERROR,"invalid parameters",null,private_key);
		return;
	}
	//客户端传入的是字符串
	conf = JSON.parse(conf);
	//for test
	// if(!global.has_rule(conf.rule_index,global.MASK_INGOT_GAME) && !(global.has_rule(conf.rule_index,global.MASK_GOLD_GAME))){
	// 	conf.rule_index += 0x01 <<global.MASK_INGOT_GAME;
	// }
	//test end

	//如果是斗公牛默认添加一个庄为轮庄
	if(global.has_rule(conf.type_index,global.OX_GAME_TYPE_OX) || global.has_rule(conf.type_index,global.OX_GAME_TYPE_OX_NONE_COLOR)){
		if(!global.has_rule(conf.rule_index,global.TURN_BANKER)){
			conf.rule_index += 0x01 <<global.TURN_BANKER;
		}
	}

	if(!(global.type_check(conf.type_index)&& global.rule_check(conf.rule_index,config.type_index))){
		logger.warn("invalid rule or type index ");
		//http.send(res,error.ROOM_CREATE_RULE_CHECK_ERROR);
		http.crypto_send(res,error.ROOM_CREATE_RULE_CHECK_ERROR,'failed.',null,private_key);
		return;
	}

	//规则检测完后检测钻石是否满足条件
	//房卡游戏
	if(global.has_rule(conf.rule_index,global.MASK_INGOT_GAME)){
		if(ingot < global.get_ingot_value(conf.rule_index)){
			logger.warn("not ingot to create Room");
			//http.send(res,error.ROOM_CREATE_INGOT_NOT);
			http.crypt_send(res,error.ROOM_CREATE_INGOT_NOT,'failed.',null,private_key);
			return;
		}
	}

	//金币游戏
	if(global.has_rule(conf.rule_index,global.MASK_GOLD_GAME)){
		if(gold < global.get_ingot_value(conf.rule_index)){
			logger.warn("not ingot to create Room");
			//http.send(res,error.ROOM_CREATE_GOLD_NOT);
			http.crypto_send(res,error.ROOM_CREATE_GOLD_NOT,'failed.',null,private_key);
			return;
		}
	}

	roomMgr.createRoom(userId,conf,ingot,serverIp,config.CLIENT_PORT,config.SERVER_TYPE,config.SERVER_ID,function(errcode,roomId){
		if(errcode != 0 || roomId == null){
			//http.send(res,errcode,"create failed.");
			http.crypto_send(res,errcode,"create failed.",null,private_key);
			return;	
		}
		else{
			//http.send(res,error.SUCCESS,"ok",{roomid:roomId});
			http.crypto_send(res,error.SUCCESS,"ok",{roomid:roomId},private_key);		
		}
	});
});

app.get('/enter_room',function(req,res){
	show_request('enter_room',JSON.stringify(req.query));
	var data = secret.aes_decrypt(req.query.data,private_key);
	if(data == null) return;
	var reqdata = try_parse_json(data);
	if(reqdata == null){
		logger.error("/enter_room try to parse json failed.");
		return;
	}

	var userId = parseInt(reqdata.userid);
	var name = reqdata.name;
	var ingot = reqdata.ingot;
	var gold = reqdata.gold;
	var roomId = reqdata.roomid;
	if(userId == null || roomId == null || ingot == null || gold == null){
		//http.send(res,error.ROOM_ENTER_ARGS_ERROR,"invalid parameters");
		http.crypto_send(res,error.ROOM_ENTER_ARGS_ERROR,"invalid parameters",null,private_key);		
		return;
	}
	var user_info = {
		userId:userId,
		name:name,
		ingot:ingot,
		gold:gold
	}
	//安排玩家坐下
	roomMgr.enterRoom(roomId,user_info,function(ret){
		if(ret != 0){
			//http.send(res,ret,'enter room failed');
			http.crypto_send(res,ret,'enter room failed',null,private_key);
			return;		
		}
		var token = tokenMgr.createToken(userId,500000);
		//http.send(res,error.SUCCESS,"ok",{token:token});
		http.crypto_send(res,error.SUCCESS,"ok",{token:token},private_key);
	});
});

// app.get('/ping',function(req,res){
// 	var sign = req.query.sign;
// 	var md5 = crypto.md5(config.ROOM_PRI_KEY);
// 	if(md5 != sign){
// 		return;
// 	}
// 	http.send(res,0,"pong");
// });

app.get('/is_room_runing',function(req,res){
	var data = secret.aes_decrypt(req.query.data,private_key);
	if(data == null) return;
	var reqdata = try_parse_json(data);
	if(reqdata == null){
		logger.error("/is_room_runing try to parse json failed.");
		return;
	}

	var roomId = reqdata.roomid;
	if(roomId == null){
		//http.send(res,error.SYSTEM_ARGS_ERROR,"invalid parameters");
		http.crypto_send(res,error.SYSTEM_ARGS_ERROR,"invalid parameters",private_key);
		return;
	}
	
	//var roomInfo = roomMgr.getRoom(roomId);
	//http.send(res,error.SUCCESS,"ok",{runing:true});
	http.crypto_send(res,error.SUCCESS,"ok",{runing:true},private_key);
});

var gameServerInfo = null;
var lastTickTime = 0;

//向大厅服定时心跳
function update(){
	if(lastTickTime + config.HTTP_TICK_TIME < Date.now() && private_key != null){
		lastTickTime = Date.now();
		gameServerInfo.load = roomMgr.getTotalRooms();
		//http.get(config.HALL_IP,config.HALL_PORT,"/register_gs",{data:encrypt_text},function(ret,data){
		http.crypto_get(config.HALL_IP,config.HALL_PORT,"/register_gs",gameServerInfo,private_key,my_key,function(ret,data){
			if(ret == true){
				if(data.errcode != 0){
					logger.error(data.errmsg);
				}
				
				if(data.ip != null){
					serverIp = data.ip;
				}
			}
			else{
				//
				lastTickTime = 0;
			}
		});

		var mem = process.memoryUsage();
		var format = function(bytes) {  
              return (bytes/1024/1024).toFixed(2)+'MB';  
        }; 
		//logger.warn('Process: heapTotal '+format(mem.heapTotal) + ' heapUsed ' + format(mem.heapUsed) + ' rss ' + format(mem.rss));
	}
}

//和大厅交互生成密钥
function gen_secret(callback){
	var challenge = null;//用于握手验证
	var key_hall = null;
	var blob = secret.dh64_gen_key();
	var public_key = blob.getPublicKey('base64');
	var rd_str = secret.random_b64() + Date.now();
	my_key = secret.md5_16(rd_str);
	http.get(config.HALL_IP,config.HALL_PORT,'/who',{key1:my_key,key2:public_key},function(ret,data){
		if(ret == true){
			if(data.errcode !=0){
				logger.error("WHO:",data.errcode);
				callback(false);
				return;
			}else{
				challenge = data.challenge;
				key_hall = data.key;
				var hall_secret = secret.dh64_secret(blob,key_hall);
				if(hall_secret == null){
					callback(false);
					return;
				}
				var hmac = secret.hmac64(challenge,hall_secret);
				// console.log(hall_secret);
				// console.log(hmac);
				http.get(config.HALL_IP,config.HALL_PORT,'/challenge',{key1:my_key,key2:hmac},function(ret,data){
					if(ret == true){
						if(data.errcode !=0){
							logger.error("CHALLENGE:",data.errcode);
							callback(false);
							return;
						}else{
							//握手成功后服务器下发随机的密钥
							// var encypt=  data.data;
							// var plant = secret.aes_decrypt(encypt,hall_secret);
							// console.log("hall_secret====>",hall_secret);
							// console.log("en ------=========>",data.data);
							// console.log("show me ==========>",plant);
							private_key = hall_secret;
							callback(true);
						}
					}
				})
			}
		}
	});
}


exports.start = function($config){
	config = $config;

	//设置serverinfo
	gameServerInfo = {
		servertype:config.SERVER_TYPE,
		id:config.SERVER_ID,
		clientip:config.CLIENT_IP,
		clientport:config.CLIENT_PORT,
		httpPort:config.HTTP_PORT,
		maxclient:config.MAX_CLIENT,
		load:roomMgr.getTotalRooms(),
	};

	setInterval(update,1000);
	var logger_http = require('./log.js').log_http;
	http.init(logger_http,"POKER OX");
	gen_secret(function(ret){
		if(ret){
			app.listen(config.HTTP_PORT,config.FOR_HALL_IP);
			logger.info("POKER OX HTTP SERVICE RUNNING ON: " + config.FOR_HALL_IP + ":" + config.HTTP_PORT);
		}else{
			logger.error("POKER OX HTTP SERVICE CHALLENGE HALL FAILED, SERVICE NOT OPEN.");
		}
	});
};