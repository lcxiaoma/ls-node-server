var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require('../utils/http');
var logger = require('./log.js').log_shisanshui;
var global = require('./global_setting').global;
const error = require('../config/error').error;
var secret = require('../utils/secret');
var log_manager = require('../common/log_manager');
var tokenMgr = require('./tokenmgr');
var roomMgr = require('./roommgr');
var userMgr = require('./usermgr');
var activity = require('../common/activity');

var app = express();
var config = null;

var serverIp = "";
var room_key = null;
var hall_key = null;

var global_setting = require('../config/global_setting').global_setting;

function show_request(commond,args){
	if(global_setting.LOG_LEVEL <global_setting.LOG_INFO){
		logger.debug('Http[%s][%s]',commond,args);
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
	var serverid = req.query.serverid;
	var sign = req.query.sign;
	var check_str ="_"+serverid;
	if(!check(check_str,sign)){
		logger.warn("/get_server_info check failed.")
		return;
	}

	if(serverid  != config.SERVER_ID){
		http.send(res,error.SYSTEM_ARGS_ERROR,"invalid parameters",null,private_key);
		return;
	}

	var locations = roomMgr.getUserLocations();
	var arr = [];
	for(var userId in locations){
		var roomId = locations[userId].roomId;
		arr.push(userId);
		arr.push(roomId);
	}
	http.send(res,error.SUCCESS,"ok",{userroominfo:arr});
});

app.get('/create_room',function(req,res){
	//parameters {userid:0,gems:'',conf:{},sign:''}
	//conf:{type_index:0,rule_index:0}
	show_request('create_room',JSON.stringify(req.query));
	var userId = parseInt(req.query.userid);
	var ingot = req.query.ingot;
	var gold = req.query.gold;
	var conf = req.query.conf;
	var sign = req.query.sign;

	//参数合法性检测
	if(userId == null || ingot == null || gold == null|| conf == null||sign == null){
		http.send(res,error.ROOM_CREATE_ARGS_ERROR,"invalid parameters");
		return;
	}
	//客户端传入的是字符串
	conf = JSON.parse(conf);

	var check_str = "_"+userId+ingot+gold+conf.server_code+conf.type_index+conf.rule_index;
	if(!check(check_str,sign)){
		logger.warn('/create_room check failed.');
		return;
	}

	if(!(global.type_check(conf.type_index)&& global.rule_check(conf.rule_index,config.type_index))){
		logger.warn("invalid rule or type index ");
		http.send(res,error.ROOM_CREATE_RULE_CHECK_ERROR);
		return;
	}

	//规则检测完后检测钻石是否满足条件
	//检测是否有对应的活动，这里主要是针对免费创建和局数加倍
	var free = activity.check_activity(activity.activty_type.ENTER_TYPE_FREE,config.SERVER_TYPE);
	var double = activity.check_activity(activity.activty_type.DOUBLE_PLAY_TIME,config.SERVER_TYPE);
	if(!free){
		//房卡游戏
		if(global.has_rule(conf.rule_index,global.MASK_INGOT_GAME)){
			if(ingot < global.get_ingot_value(conf.rule_index)){
				logger.warn("not ingot to create Room");
				http.send(res,error.ROOM_CREATE_INGOT_NOT);
				return;
			}
		}

		//金币游戏
		if(global.has_rule(conf.rule_index,global.MASK_GOLD_GAME)){
			if(gold < global.get_ingot_value(conf.rule_index)){
				logger.warn("not ingot to create Room");
				http.send(res,error.ROOM_CREATE_GOLD_NOT);
				return;
			}
		}
	}

	roomMgr.createRoom(userId,conf,ingot,serverIp,config.CLIENT_PORT,config.SERVER_TYPE,config.SERVER_ID,double,free,function(errcode,roomId){
		if(errcode != 0 || roomId == null){
			http.send(res,errcode,"create failed.");
			return;	
		}
		else{
			//添加创建房间日志
			log_manager.insert_create_room_log(userId,config.SERVER_TYPE,conf.type_index,conf.rule_index,roomId);
			http.send(res,error.SUCCESS,"ok",{roomid:roomId});	
		}
	});
});

app.get('/enter_room',function(req,res){
	show_request('enter_room',JSON.stringify(req.query));
	var userId = parseInt(req.query.userid);
	var name = req.query.name;
	var ingot = req.query.ingot;
	var gold = req.query.gold;
	var roomId = req.query.roomid;
	var sign = req.query.sign;

	if(userId == null || roomId == null || ingot == null || gold == null || sign == null){
		http.send(res,error.ROOM_ENTER_ARGS_ERROR,"invalid parameters");		
		return;
	}

	var check_str ="_"+userId+name+ingot+gold+roomId;
	if(!check(check_str,sign)){
		logger.warn('/enter_room check failed.');
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
			http.send(res,ret,'enter room failed');
			return;		
		}

		var token = tokenMgr.createToken(userId,500000);
		http.send(res,error.SUCCESS,"ok",{token:token});
	});
});

app.get('/is_room_runing',function(req,res){

	var roomId = req.query.roomid;
	var sign = req.query.sign;

	if(roomId == null|| sign == null){
		http.send(res,error.SYSTEM_ARGS_ERROR,"invalid parameters");
		return;
	}

	var check_str ="_"+roomId;
	if(!check(check_str,sign)){
		logger.warn("/is_room_runing check failed.");
		return;
	}
	http.send(res,error.SUCCESS,"ok",{runing:true});
});

var gameServerInfo = null;
var lastTickTime = 0;

//向大厅服定时心跳
function update(){
	if(lastTickTime + config.HTTP_TICK_TIME < Date.now()){
		lastTickTime = Date.now();
		gameServerInfo.load = roomMgr.getTotalRooms();
		var seed_str = "_"+gameServerInfo.servertype+gameServerInfo.clientip+gameServerInfo.clientport+gameServerInfo.httpPort+gameServerInfo.load+gameServerInfo.id+gameServerInfo.maxclient;
		gameServerInfo.sign = gen_check(seed_str,room_key);
		http.get(config.HALL_IP,config.HALL_PORT,"/register_gs",gameServerInfo,function(ret,data){
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
		//console.log('Process: heapTotal '+format(mem.heapTotal) + ' heapUsed ' + format(mem.heapUsed) + ' rss ' + format(mem.rss));
	}
}
//读取房间私钥
function read_key(){
	var path = require('path');
	var fs = require('fs');
	var filename = './config/key/key_room.pem';
 	room_key = fs.readFileSync(filename).toString('base64');
	filename = './config/key/key_hall.pem';
	hall_key = fs.readFileSync(filename).toString('base64');
}
//生成验证码
function gen_check(data,key){
	return secret.md5_16((new Buffer(data).toString('base64')) + key)
}

//检测验证码
function check(data,check){
	return check == gen_check(data,hall_key);
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
	read_key();
	app.listen(config.HTTP_PORT,config.FOR_HALL_IP);
	setInterval(update,1000);
	logger.info("POKER SHISANSHUI HTTP SERVICE RUNNING ON:" + config.FOR_HALL_IP + ":" + config.HTTP_PORT);
};