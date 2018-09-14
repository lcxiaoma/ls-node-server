var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require('../utils/http');
var logger = require('./log.js').log_hall;
const error = require('../config/error').error;
var secret = require('../utils/secret');
const global = require('./global_setting').global;
var logger_manager = require('../common/log_manager');
var log_point = require('../config/log_point').log_point;
var mail_service = require('./mail_service');
var app = express();

var hallIp = null;
var config = null;
var rooms = {};
var serverMap = {};
var roomIdOfUsers = {};

var room_key = null;
var hall_key = null;

//设置跨域访问
app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By",' 3.2.1');
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});

/**
 * we need know sever is running
 * if not running  remove from servermap
 * **/
app.get('/register_gs',function(req,res){
	//注册game_server
	var sign = req.query.sign;
	var now = Math.ceil(Date.now()/1000);
	var type = Number(req.query.servertype);
	var ip = req.ip;
	var clientip = req.query.clientip;
	var clientport = req.query.clientport;
	var httpPort = req.query.httpPort;
	var privatekey = null;
	var load = req.query.load;
	var id = clientip + ":" + clientport;
	var serverid = Number(req.query.id);
	var maxclient = req.query.maxclient;

	var check_data ="_"+type+clientip+clientport+httpPort+load+serverid+maxclient;

	if(!check(check_data,sign)){
		logger.error("/register_gs check failed.");
		return;
	}

	if(serverMap[type]&&serverMap[type][serverid]){
		var info = serverMap[type][serverid];
		if(info.clientport != clientport
			|| info.httpPort != httpPort
			|| info.ip != ip
		){
			logger.debug("duplicate gsid:" + id + ",addr:" + ip + "(" + httpPort + ")");
			http.send(res,1,"duplicate gsid:" + id);
			return;
		}
		info.load = load;
		info.ticktime = now;
		http.send(res,0,"ok",{ip:ip});
		return;
	}
	//如果有必须 初始化服务器列表
	if(!serverMap[type]){
		serverMap[type] ={};
	}
	serverMap[type][serverid] ={
		server_type:type,
		server_id:serverid,
		ip:ip,
		id:id,
		clientip:clientip,
		clientport:clientport,
		httpPort:httpPort,
		privatekey:privatekey,
		maxclient:maxclient,
		ticktime:now,
		load:load
	}
	http.send(res,0,"ok",{ip:ip});
	logger.info("GAME SERVER REGEST:\n\tserver type :%s\n\tserver id   :%s\n\tserver addr :%s\n\thttp port   :%s\n\tsocket port :%s\n\tmax client  :%s",type,serverid,clientip,httpPort,clientport,maxclient);

	var reqdata = {
		serverid:serverid,
	};
	check_data = "_"+serverid;
	reqdata.sign = gen_check(check_data,hall_key);
	//获取服务器信息
	http.get(ip,httpPort,"/get_server_info",reqdata,function(ret,data){
	//http.crypto_get(ip,httpPort,"/get_server_info",reqdata,privatekey,null,function(ret,data){
		if(ret){
			if(data.errcode ==0){
				for(var i = 0; i < data.userroominfo.length; i += 2){
					var userId = data.userroominfo[i];
					var roomId = data.userroominfo[i+1];
				}
			}
		}
		else{
			logger.error('GAME SERVER REGISTER FAILED.:',data.errmsg,data.errcode);
		}
	});
});

//负载均衡选择服务器
//根据game_type负载均衡
function chooseServer(game_type,game_id,old_id){
	// console.log(" chosse server ========>",game_type,game_id,old_id)
	var serverinfo = null;
	var type_server_map = serverMap[game_type];
	if(type_server_map){
		if(game_id){
			//指定gameid
			info = type_server_map[game_id];
			serverinfo = info;
		}else{
			//随机gameid
			//console.log(type_server_map)
			for(var i in type_server_map){
				var info = type_server_map[i];
				if(Number(info.maxclient) > Number(info.load)){
					if(!old_id){
						if(info.server_id != old_id){
							serverinfo = info;
							break;
						}
					}else{
						serverinfo = info;
						break;
					}
				}
			}
		}
	}
	return serverinfo;
}

exports.createRoom = function(user_info,init_config,fnCallback){
	var create_config = JSON.parse(init_config);

	// //test for majiang
	// if(create_config.type == 'xzdd' || create_config.type == 'xlch'){
	// 	create_config.server_code = 10001;
	// }
	// //test end
	// console.log("create config ------------->",create_config)
	if(!create_config.server_code){
		fnCallback(error.SERVER_CODE_NONE,null);
		return;
	}

	var serverinfo = chooseServer(create_config.server_code,null);
	if(serverinfo == null){
		fnCallback(error.SERVER_NOT_FOUND,null);
		return;
	}
	
	var reqdata ={
		userid:user_info.userId,
		ingot:user_info.ingot,
		gold:user_info.gold,
		conf:init_config,
	}
	var seed_str = "_"+user_info.userId+user_info.ingot+user_info.gold+create_config.server_code+create_config.type_index+create_config.rule_index;
	console.log("check str--------------->",seed_str)
	reqdata.sign = gen_check(seed_str,hall_key);
	http.get(serverinfo.ip,serverinfo.httpPort,"/create_room",reqdata,function(ret,data){
	//http.crypto_get(serverinfo.ip,serverinfo.httpPort,"/create_room",reqdata,serverinfo.privatekey,null,function(ret,data){
		//console.log(data);
		if(ret){
			if(data.errcode == error.SUCCESS){
				fnCallback(error.SUCCESS,data.roomid);
			}
			else{
				fnCallback(data.errcode,null);		
			}
			return;
		}
		fnCallback(error.ROOM_FAILED_UNDEFINED,null);
	});	
};

/**
 * control all aync server
 * need do chose the backup server to player data move
 * **/
exports.enterRoom = function(user_info,roomId,fnCallback){
	var reqdata = {
		userid:user_info.userId,
		name:user_info.name,
		ingot:user_info.ingot,
		gold:user_info.gold,
		roomid:roomId
	};
	var checkRoomIsRuning = function(serverinfo,roomId,callback){
		var check_str = "_"+roomId;
		var sign = gen_check(check_str,hall_key);
		http.get(serverinfo.ip,serverinfo.httpPort,"/is_room_runing",{roomid:roomId,sign:sign},function(ret,data){
		//http.crypto_get(serverinfo.ip,serverinfo.httpPort,"/is_room_runing",{roomid:roomId},serverinfo.privatekey,null,function(ret,data){
			if(ret){
				if(data.errcode == error.SUCCESS && data.runing == true){
					callback(true);
				}
				else{
					callback(false);
				}
			}
			else{
				callback(false);
			}
		});
	}
	var enterRoomReq = function(serverinfo){
		var check_str = "_"+reqdata.userid+reqdata.name+reqdata.ingot+reqdata.gold+reqdata.roomid;
		reqdata.sign = gen_check(check_str,hall_key);
		http.get(serverinfo.ip,serverinfo.httpPort,"/enter_room",reqdata,function(ret,data){
		//http.crypto_get(serverinfo.ip,serverinfo.httpPort,"/enter_room",reqdata,serverinfo.privatekey,null,function(ret,data){
			if(ret){
				if(data.errcode == error.SUCCESS){
					db.set_room_id_of_user(user_info.userId,roomId,function(ret){
						fnCallback(0,{
							ip:serverinfo.clientip,
							port:serverinfo.clientport,
							token:data.token
						});
					});
				}
				else{
					fnCallback(data.errcode,null);
				}
			}
			else{
				fnCallback(-1,null);
			}
		});
	};

	var chooseServerAndEnter = function(serverinfo,new_server){
		serverinfo = chooseServer(serverinfo.server_type,serverinfo.server_id);
		if(serverinfo != null){
			enterRoomReq(serverinfo);
			if(new_server){
				updateNewSameTypeServer(serverinfo,roomId);
			}
		}
		else{
			fnCallback(error.SERVER_ADDR_NOT_FOUND,null);					
		}
	}

	//如果服务器死掉/或者服务器错误将为玩家选择新的同类系服务器
	var findNewSameTypeServer = function(server_type,old_id){
		var severinfo = null;
		serverinfo = chooseServer(server_type,null,old_id);
		return serverinfo;
	}
	//更新到数据库
	var updateNewSameTypeServer =function(serverinfo,room_id){

		//修改数据库配置
		var data ={
			room_id:room_id,
			ip:serverinfo.ip,
			port:serverinfo.port,
			server_id:serverinfo.server_id
		}
		db.change_room_info(data,function(error,rows,fileds){
			if(error){
				//fnCallback(error.SERVER_RE_FIND_DB_ERROR,null);
				logger.error("change room info db error",error.stack);
				return;
			}
			if(rows[0][0].result !=1){
				logger.warn("change room info db result = %d",rows[0][0].result);
				//fnCallback(error.SERVER_RE_FIND_DB_ERROR,null);
				return;
			}
			return serverinfo;
		});
	}

	//多服务器修改
	db.get_room_addr(roomId,function(ret,ip,port,server_type,server_id){
		if(ret){
			//查找server信息
			var type_map = serverMap[server_type];
			if(!type_map){
				//服务器组不存在
				fnCallback(error.SERVER_TYPE_NOT_FOUND,null);
				return;
			}
			var serverinfo = type_map[server_id];
			if(!serverinfo){
				//服务器不存在当前存货服务器中
				//fnCallback(error.SERVER_NOT_FOUND,null);
				//查找是否存在同类型的服务器进行转移
				serverinfo =findNewSameTypeServer(server_type,null);
				if(!serverinfo){
					fnCallback(error.SERVER_NOT_FOUND,null);
					return;
				}
				chooseServerAndEnter(serverinfo,true);
				return;
			}
			if(serverinfo != null){
				checkRoomIsRuning(serverinfo,roomId,function(isRuning){
					//console.log("check room is running.......",isRuning);
					if(isRuning){
						enterRoomReq(serverinfo);
					}
					else{
						serverinfo =findNewSameTypeServer(server_type,serverinfo.server_id);
						//console.log(" fine new server====>",serverinfo)
						if(!serverinfo){
							fnCallback(error.SERVER_NOT_FOUND,null);
							return;
						}
						chooseServerAndEnter(serverinfo,true);
					}
				});
			}
		}
		else{
			//查找服务器地址失败
			fnCallback(error.SERVER_ADDR_NOT_FOUND,null);
		}
	});
};

exports.isServerOnline = function(server_type,callback){

	var server_type_map = serverMap[server_type];
	if(!server_type_map){
		callback(false);
		return;
	}
	var live = false;
	for(var a in server_type_map){
		live = true;
	}

	if(live){
		callback(true);
	}else{
		callback(false);
	}
};

//获取服务器列表
exports.get_server_map = function(){

	var servermap =[];

	for(var a in serverMap){
		var type_map = serverMap[a];
		var live = false;
		for(var b in type_map){
			live = true;
			break;
		}
		if(live){
			servermap.push(a);
		}
	}
	return servermap;
}

var lastTickTime =0;
//心跳检测服务器是否存活
function update(){
	var now = Date.now();
	if(lastTickTime +config.HTTP_TICK_TIME <now){
		lastTickTime = now;
		var die_server ={};
		for(var a in serverMap){
			var type_map = serverMap[a];
			for(b in type_map){
				var server_info = type_map[b];
				if(server_info.ticktime*1000 + 2*config.HTTP_TICK_TIME<now){
					//server die
					die_server[a] =b;
				}
			}
		}
		//清除掉已经死掉的服务器
		for(var server_type in die_server){
			var serverinfo = serverMap[server_type][die_server[server_type]];
			logger.warn("GAME SERVER OFFLINE:\n\tserver type :%s\n\tserver id   :%s\n\tserver addr :%s\n\thttp port   :%s\n\tsocket port :%s\n\tmax client  :%s",
			serverinfo.server_type,serverinfo.server_id,serverinfo.ip,serverinfo.httpPort,serverinfo.clientport,serverinfo.maxclient);
			delete serverMap[server_type][die_server[server_type]];
		}
	}
}
//读取房间私钥
function read_key(){
	var path = require('path');
	var fs = require('fs');
	var filename = './config/key/key_room.pem'
 	room_key = fs.readFileSync(filename).toString('base64');
	filename ='./config/key/key_hall.pem';
	hall_key = fs.readFileSync(filename).toString('base64');
}
//生成验证码
function gen_check(data,key){
	return secret.md5_16((new Buffer(data).toString('base64')) + key)
}

//检测验证码
function check(data,check){
	return check == gen_check(data,room_key);
}
exports.start = function($config){
	config = $config;
	read_key();
	app.listen(config.ROOM_PORT,config.FOR_ROOM_IP);
	setInterval(update,1000);
	logger.info("ROOM SERVICE RUNNING ON:" + config.FOR_ROOM_IP + ":" + config.ROOM_PORT);
};

//代开房间
exports.create_agent_room = function(user_info,init_config,fnCallback){
	var create_config = JSON.parse(init_config);
	if(!create_config.server_code){
		fnCallback(error.SERVER_CODE_NONE,null);
		return;
	}
	var serverinfo = chooseServer(create_config.server_code,null);
	if(serverinfo == null){
		fnCallback(error.SERVER_NOT_FOUND,null);
		return;
	}
	//判断是否是房卡游戏
	// if(!global.has_rule()){
	// 	fnCallback(error.AGENT_ROOM_ONLY_INGOT,null);
	// 	return;
	// }
	var reqdata ={
		userid:user_info.userId,
		ingot:user_info.ingot,
		gold:user_info.gold,
		conf:init_config,
	}
	var seed_str = "_"+user_info.userId+user_info.ingot+user_info.gold+create_config.server_code+create_config.type_index+create_config.rule_index;
	reqdata.sign = gen_check(seed_str,hall_key);
	http.get(serverinfo.ip,serverinfo.httpPort,"/create_room",reqdata,function(ret,data){
		if(ret){
			if(data.errcode == error.SUCCESS){
				//扣除房卡.
				var ingot_value = global.get_ingot_value(create_config.rule_index);
				user_lose_ingot(user_info.userId, ingot_value);
				var room_id = data.roomid;
				//更新代开用户和过期时间信息.
				db.update_agent_room(room_id,user_info.userId,function(ret){
					if(ret){
						fnCallback(error.SUCCESS,data.roomid);
					} else {
						fnCallback(error.SUCCESS,data.roomid);
					}
				});
			}
			else{
				fnCallback(data.errcode,null);		
			}
			return;
		}
		fnCallback(error.ROOM_FAILED_UNDEFINED,null);
	});	
};


/**
 * 玩家扣除房卡
 * @param {*} user_id
 * @param {*} ingot_value
 */
function user_lose_ingot(user_id, ingot_value) {
	logger.debug("user[%d] lose ingot[ingot_value].....", user_id, ingot_value);
	db.cost_ingot(user_id, ingot_value, function (error, rows, fileds) {
		if (error) {
			logger.error(error.stack);
			return;
		}
		if (rows[0][0].result != 1) {
			logger.warn('user lose ingot db result = %d', rows[0][0].result);
		} else {
			logger_manager.insert_ingot_log(user_id, user_id, 0, log_point.INGOT_COST_OPEN, ingot_value, rows[0][0].now_ingot);
		}
	});
}

//获得代开房间列表
exports.get_agent_room = function(user_id,fnCallback){
	db.get_agent_room(user_id, function (rows) {
		if (rows) {
			var length = rows.length;
			var rooms = [];
			var now_time = Math.floor(Date.now()/1000);
			for(var i=0; i<length; ++i){
				var room_data = rows[i];
				//判断代开房间是否过期
				console.log("get_agent_room-===>", room_data.agent_expires_time, now_time, room_data.num_of_turns);
				if(room_data.agent_expires_time<now_time && room_data.num_of_turns == 0){
					exports.delete_agent_room(user_id,room_data.id,function(ret){
						if(!ret){
							logger.warn("delete_agent_room FAILED=====>", room_data.id);
						}
					});
				} else {
					rooms.push(rows[i]);
				}
			}
			fnCallback(rooms);
		} else {
			fnCallback(null);
		}
	});
}


//删除代开房间
exports.delete_agent_room = function(user_id,room_id,fnCallback){
	//获得房间信息.
	db.get_agent_room_by_id(room_id, function(room_data){
		console.log("room_data=======================>",room_data);
		if(!room_data){
			fnCallback(false);
			return;
		}
		//判断该房间是否是代开房间.
		console.log("room_data.agent_user_id=======================>",room_data.agent_user_id);
		if(room_data.agent_user_id == 0){
			fnCallback(false);
			return;
		}
		//判断房间是否是该用户代开的.
		if(room_data.agent_user_id != user_id){
			fnCallback(false);
			return;
		}
		//判断游戏是否已经开始.
		if(room_data.num_of_turns != 0){
			fnCallback(false);
			return;
		}
		//删除代理房间
		var params = {
			room_uuid:room_data.uuid,
			create_time:room_data.create_time,
			zip_reason:3,//代开房间删除
			zip_time:Math.floor(Date.now()/1000),
			user_info:[],
		}
		console.log("params===================>", params);
		db.delete_room(params, function (err, rows, fields) {
			if (err) {
				logger.error(err.stack);
				fnCallback(false);
				return;
			}
			if (rows[0][0].result != 1) {
				logger.warn("achive room result ==>", rows[0][0].result)
				fnCallback(false);
				return;
			}
			//删除成功的话，返回玩家房卡.
			var base_info = room_data.base_info;
			base_info = JSON.parse(base_info);
			console.log("base_info.rule_index================>",base_info.rule_index);
			var ingot_value = global.get_ingot_value(base_info.rule_index);
			{
				var mail_tittle = '删除代开房间';
				var mail_content ='成功删除代开房间【';
				mail_content = mail_content.concat(room_id,'】，并退还【',ingot_value,'】张房卡！');
				var mail_key = 'deleteagentroom_';
				mail_key = mail_key.concat(user_id,"_",Math.floor(Date.now()/1000));
				var mail_attch = {
					gold:ingot_value
				}
				mail_service.insert_sys_mail('',user_id,mail_tittle,mail_content,mail_key,mail_attch)
			}
			fnCallback(true);
		});
	});
	
}