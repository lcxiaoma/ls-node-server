var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require('../utils/http');

var logger = require('./log.js').log_hall;
const error = require('../config/error').error;

var app = express();

var hallIp = null;
var config = null;
var rooms = {};
var serverMap = {};
var roomIdOfUsers = {};

//安全相关模块
var challenge = require('../common/challenge');
var secret = require('../utils/secret');

//转换JSON保护
function try_parse_json(json_str){
	try {
		var json = JSON.parse(json_str);
		return json;
	} catch (err) {
		return null;
	}
}

function get_client_ip(req){
	var ipAddress;
	var headers = req.headers;
	var forwardedIpsStr = headers['x-real-ip'] || headers['x-forwarded-for'];
	forwardedIpsStr ? ipAddress = forwardedIpsStr : ipAddress = null;
	if (!ipAddress) {
	ipAddress = req.connection.remoteAddress;
	}
	return ipAddress;
}

//设置跨域访问
app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By",' 3.2.1');
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});

app.get('/who',function(req,res){
	challenge.who(http,req,res);
	// console.log("who?")
});

app.get('/challenge',function(req,res){
	challenge.challenge(http,req,res);
	// console.log("challenge!.")
});

/**
 * we need know sever is running
 * if not running  remove from servermap
 * **/
app.get('/register_gs',function(req,res){

	var remote_ip = get_client_ip(req);
	var client_key = req.query.key;
	// console.log("show me get client_key===>",client_key)
	if(client_key == null){
		return;
	}
	var challenge_info =challenge.challenge_info(remote_ip,client_key);
	if(!challenge_info){
		logger.warn("Not Vertified client Try to register.")
		return;
	}

	var data = req.query.data;
	var plant_text = secret.aes_decrypt(data,challenge_info.secret);
	if(plant_text == null) return;
	
	var reqdata = try_parse_json(plant_text);
	if(reqdata == null){
		logger.error("/register_gs parse json error.");
		return;
	}
	//注册game_server
	var now = Math.ceil(Date.now()/1000);
	var type = Number(reqdata.servertype);
	var ip = req.ip;
	var clientip = reqdata.clientip;
	var clientport = reqdata.clientport;
	var httpPort = reqdata.httpPort;
	var privatekey = null;
	var load = reqdata.load;
	var id = clientip + ":" + clientport;
	var serverid = Number(reqdata.id);
	var maxclient = reqdata.maxclient;

	if(serverMap[type]&&serverMap[type][serverid]){
		var info = serverMap[type][serverid];
		if(info.clientport != clientport
			|| info.httpPort != httpPort
			|| info.ip != ip
		){
			logger.debug("duplicate gsid:" + id + ",addr:" + ip + "(" + httpPort + ")");
			http.crypto_send(res,1,"duplicate gsid:" + id,null,info.secret);
			return;
		}
		info.load = load;
		info.ticktime = now;
		//http.send(res,0,"ok",{ip:ip});
		http.crypto_send(res,0,"ok",{ip:ip},info.privatekey);
		return;
	}
	// console.log("new server comming.")
	//如果是新注册的客户端 需要去检测握手信息
	// console.log(" show me check log===>",challenge.check_black_list(remote_ip,client_key,'register_gs'))
	if(challenge.check_black_list(remote_ip,client_key,'register_gs')){
		return;
	}
	challenge.attemp_black_list(remote_ip,client_key,'register_gs');

	privatekey = challenge_info.secret;
	//challenge.remote_challenge(remote_ip,client_key);
	// console.log("prepare for new server.")
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
	http.crypto_send(res,0,"ok",{ip:ip},privatekey);
	logger.info("game server registered.\n\tserver type :%s\n\tserver id   :%s\n\tserver addr :%s\n\thttp port   :%s\n\tsocket port :%s\n\tmax client  :%s",type,serverid,clientip,httpPort,clientport,maxclient);

	var reqdata = {
		serverid:serverid,
	};
	//获取服务器信息
	//http.get(ip,httpPort,"/get_server_info",reqdata,function(ret,data){
	http.crypto_get(ip,httpPort,"/get_server_info",reqdata,privatekey,null,function(ret,data){
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
	//console.log(" chosse server ========>",game_type,game_id,old_id)
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
				if(info.maxclient >info.load){
					if(old_id != null){
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
	//http.get(serverinfo.ip,serverinfo.httpPort,"/create_room",reqdata,function(ret,data){
	http.crypto_get(serverinfo.ip,serverinfo.httpPort,"/create_room",reqdata,serverinfo.privatekey,null,function(ret,data){
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
		var sign = crypto.md5(roomId + config.ROOM_PRI_KEY);
		//http.get(serverinfo.ip,serverinfo.httpPort,"/is_room_runing",{roomid:roomId,sign:sign},function(ret,data){
		http.crypto_get(serverinfo.ip,serverinfo.httpPort,"/is_room_runing",{roomid:roomId},serverinfo.privatekey,null,function(ret,data){
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
		//http.get(serverinfo.ip,serverinfo.httpPort,"/enter_room",reqdata,function(ret,data){
		http.crypto_get(serverinfo.ip,serverinfo.httpPort,"/enter_room",reqdata,serverinfo.privatekey,null,function(ret,data){
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
exports.start = function($config){
	config = $config;
	var log_http = require('./log.js').log_http;
	http.init(log_http,"ROOM SERVICE");
	challenge.init(logger,"ROOM SERVICE");
	app.listen(config.ROOM_PORT,config.FOR_ROOM_IP);
	setInterval(update,1000);
	logger.info("ROOM SERVICE RUNNING ON:" + config.FOR_ROOM_IP + ":" + config.ROOM_PORT);
};