var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require('../utils/http');
var room_service = require("./room_service");
var mail_service = require('./mail_service');

var logger = require('./log.js').log_hall;
const error = require('../config/error').error;
const game_config = require('../config/game_config');

var route_service = require('./route_service');
var web_wechat = require('./web_wechat');

var log_manager = require('../common/log_manager');
var log_point = require('../config/log_point').log_point;

var iptables = require('../config/iptables');

//安全相关模块
var secret = require('../utils/secret');

var sign = require('../utils/sign');

var app = express();
var config = null;

//客户端握手协议
var client_challenge = {};
//黑名单
var black_list = {};

function show_request(commond, args) {
	logger.debug('Http[%s][%s]', commond, args);
}

function check_account(req, res) {
	var account = req.query.account;
	var sign = req.query.sign;
	if (!account || !sign) {
		http.send(res, 1, "unknown error");
		return false;
	}
	/*
	var serverSign = crypto.md5(account + req.ip + config.ACCOUNT_PRI_KEY);
	if(serverSign != sign){
		http.send(res,2,"login failed.");
		return false;
	}
	*/
	return true;
}

//设置跨域访问
app.all('*', function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By", ' 3.2.1');
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});

function get_client_ip(req) {
	var ipAddress;
	var headers = req.headers;
	var forwardedIpsStr = headers['x-real-ip'] || headers['x-forwarded-for'];
	forwardedIpsStr ? ipAddress = forwardedIpsStr : ipAddress = null;
	if (!ipAddress) {
		ipAddress = req.connection.remoteAddress;
	}
	return ipAddress;
}

app.get('/who', function (req, res) {
	var remote_ip = get_client_ip(req);
	console.log("show me request remote ip ===>", remote_ip);
	var challenge_info = client_challenge[remote_ip];
	if (challenge_info) {
		//存在握手信息
	}
	var client_public_key = req.key;
	var blob = secret.dh64_gen_key();
	var public_key = blob.getPublicKey('base64');
	var challenge = secret.random_b64();
	var client_secret = secret.dh64_secret(blob, client_public_key)
	var hmac = secret.hmac64(challenge, client_secret);
	var out_time = Date.now() + 5 * 60 * 1000;
	challenge_info = {
		secret: client_secret,
		hmac: hmac,
		out_time: out_time
	}
	http.send(res, error.SUCCESS, 'ok.', { change_info })

});

app.get('/challenge', function (req, res) {
	var remote_ip = get_client_ip(req);


});
/**
 * 获取玩家的详细
 * TODO 需要添加的信息
 * 加入游戏时间
 * 一把赢的最大积分
 * 好友
 * 游戏胜率
 * 已经玩的游戏数量/总得胜利的局数
 * 比赛夺冠数量
 * 成就
 * 礼物
 * 累计在线时长
 * 注册地区(IP)
 * 用户设备
 */
app.get('/login', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("login: error sign===>", req.query);
		return;
	}
	var ip = req.ip;
	if (ip.indexOf("::ffff:") != -1) {
		ip = ip.substr(7);
	}

	var account = req.query.account;
	
	db.get_user_info_byac(account,function(ret){
		if(!ret){
			//为了防止撞库进入，但是是游客登录的渠道
			//上线后这里需要屏蔽
			logger.warn("Try to get user info by account get None!!!");
			http.send(res,error.SUCCESS,'ok.');
			return;
		}

		if(ret.lock !=0){
			http.send(res, error.LOGIN_FAILED_ACCOUNT_LOCK, 'failed.');
			return;
		}

		var daily_value = {}
		if(ret.daily_value){
			daily_value = ret.daily_value.toString('utf8')
		}
		var statistic = {}
		if(ret.statistic){
			statistic = ret.statistic.toString('utf8');
		}
		var data ={
			account:account,
			userid:ret.user_id,
			name:ret.name,
			sex:ret.sex,
			ip:ip,
			headimg:ret.headimg,
			lv:ret.lv,
			exp:ret.exp,
			coins:ret.coins,
			gems:ret.gems,
			platform:ret.platform,
			reg_time:ret.reg_time,
			online_time:ret.online_time,
			route_time:ret.route_time,
			check_in_time:ret.check_in_time,
			share_time:ret.share_time,
			agent_status:ret.agent,
			lucky_value:ret.lucky,
			invitation_code:ret.invitation_code,
			daily_value:daily_value,
			statistic:statistic,
		}
		db.get_room_id_of_user(data.userid, function (roomId) {
			//如果用户处于房间中，则需要对其房间进行检查。 如果房间还在，则通知用户进入
			if (roomId != null) {
				//检查房间是否存在于数据库中
				db.is_room_exist(roomId, function (retval) {
					if (retval) {
						data.roomid = roomId;
					}
					else {
						//如果房间不在了，表示信息不同步，清除掉用户记录
						db.set_room_id_of_user(data.userid, null);
					}
					http.send(res, 0, "ok", data);
				});
			}
			else {
				http.send(res, 0, "ok", data);
			}
		});
	});
	/*
	db.get_user_data(account, function (data) {
		if (data == null) {
			http.send(res, 0, "ok");
			return;
		}
		if (data.lock != 0) {
			http.send(res, error.LOGIN_FAILED_ACCOUNT_LOCK, 'failed.');
			return;
		}
		var ret = {
			account: data.account,
			userid: data.userid,
			name: data.name,
			lv: data.lv,
			exp: data.exp,
			coins: data.coins,
			gems: data.gems,
			ip: ip,
			sex: data.sex,
			reg_time: 0,				//注册时间
			reg_area: '',			//注册区域
			device: '',				//设备
			max_score: 0,			//一把最大分数
			win_rate: {},			//游戏胜率
			totoal_win_count: 0,		//总共赢的局数
			totoal_play: 0,			//总共参与游戏的局数
			champion_count: 0,		//比赛夺冠次数
			achievement: {},			//成就
			gifts: {},				//礼物
			online_time: 0,			//累计在线时长
		};

		db.get_room_id_of_user(data.userid, function (roomId) {
			//如果用户处于房间中，则需要对其房间进行检查。 如果房间还在，则通知用户进入
			if (roomId != null) {
				//检查房间是否存在于数据库中
				db.is_room_exist(roomId, function (retval) {
					if (retval) {
						ret.roomid = roomId;
					}
					else {
						//如果房间不在了，表示信息不同步，清除掉用户记录
						db.set_room_id_of_user(data.userid, null);
					}
					http.send(res, 0, "ok", ret);
				});
			}
			else {
				http.send(res, 0, "ok", ret);
			}
		});
	});
	*/
});

app.get('/create_user', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("create_user: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	var name = req.query.name;
	// var coins = 1000;
	// var gems = 21;
	var now = Math.ceil(Date.now() / 1000);
	name = crypto.toBase64(name);
	var data = {
		account: account,
		name: name,
		sex: 1,
		headimgurl: 'http://www.jf258.com/uploads/2014-09-09/034330972.jpg',
		platform: 'default',
		channal: 'default',
		now: now
	}
	db.try_create_or_update_user(data, function (err, rows, fields) {
		if (err) {
			logger.error(err.stack);
			http.send(res, error.LOGIN_FAILED_UNDEFINED, "failed");
			return;
		}
		if (rows[0][0].result == 1) {
			http.send(res, error.SUCCESS, "ok");
			return;
		}
		http.send(res, error.LOGIN_FAILED_CHECK_ACCOUNT, "failed");
		return;
	});
	// logger.debug("create user [account = %s,name = %s,coins = %d,gems = %d]",account,name,coins,gems);

	// db.is_user_exist(account,function(ret){
	// 	if(!ret){
	// 		db.create_user(account,name,coins,gems,0,null,function(ret){
	// 			if (ret == null) {
	// 				http.send(res,2,"system error.");
	// 			}
	// 			else{
	// 				http.send(res,0,"ok");					
	// 			}
	// 		});
	// 	}
	// 	else{
	// 		http.send(res,1,"account have already exist.");
	// 	}
	// });
});
//获取服务器列表
app.get('/get_server_info', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("get_server_info: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	db.is_user_exist(account, function (ret) {
		if (!ret) {
			//玩家不存在立即退出
			http.send(res, error.USER_NOT_FOUND, "system error.");
			return;
		} else {
			var server_map = room_service.get_server_map();
			http.send(res, error.SUCCESS, { server_map: server_map });
			return;
		}
	});
});

//此处的conf少了东西 缺少服务器类型
app.get('/create_private_room', function (req, res) {
	show_request("hall creat private room", JSON.stringify(req.query))
	//验证参数合法性
	if(!sign.check_sign(req.query)){
		logger.warn("create_private_room: error sign===>", req.query);
		return;
	}

	var query_data = req.query;
	var account = query_data.account;

	query_data.account = null;
	query_data.sign = null;
	var conf = query_data.conf;
	//for test --------------
	//basic classic
	// var data_test ={
	// 	type_index:2,
	// 	rule_index:2442,
	// 	server_code:20001
	// }
	//basic 4 player
	// var data_test ={
	// 	type_index:16,
	// 	rule_index:8482,
	// 	server_code:20001
	// }
	// conf = JSON.stringify(data_test)
	//test end ---------------

	db.get_user_data(account, function (data) {
		if (data == null) {
			http.send(res, 1, "system error");
			return;
		}
		var userId = data.userid;
		var name = data.name;
		var ingot = data.gems;
		var gold = data.coins;

		var user_info = {
			userId: userId,
			name: name,
			ingot: ingot,
			gold: gold,
		}
		//验证玩家状态
		db.get_room_id_of_user(userId, function (roomId) {
			if (roomId != null) {
				http.send(res, error.ROOM_CREATE_ROOM_HAS_RUNNING, "user is playing in room now.");
				return;
			}
			//创建房间
			room_service.createRoom(user_info, conf, function (err, roomId) {
				if (err == 0 && roomId != null) {
					room_service.enterRoom(user_info, roomId, function (errcode, enterInfo) {
						if (enterInfo) {
							var ret = {
								roomid: roomId,
								ip: enterInfo.ip,
								port: enterInfo.port,
								token: enterInfo.token,
								time: Date.now()
							};
							ret.sign = crypto.md5(ret.roomid + ret.token + ret.time + config.ROOM_PRI_KEY);
							http.send(res, error.SUCCESS, "ok", ret);
						}
						else {
							http.send(res, errcode, "room doesn't exist.");
						}
					});
				}
				else {
					http.send(res, err, "create failed.");
				}
			});
		});
	});
});

app.get('/enter_private_room', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("enter_private_room: error sign===>", req.query);
		return;
	}
	var data = req.query;
	var roomId = data.roomid;

	if (!roomId) {
		http.send(res, -1, "parameters don't match api requirements.");
		return;
	}
	var account = data.account;

	db.get_user_data(account, function (data) {
		if (data == null) {
			http.send(res, -1, "system error");
			return;
		}
		var userId = data.userid;
		var name = data.name;
		var ingot = data.gems;
		var gold = data.coins;

		var user_info = {
			userId: userId,
			name: name,
			ingot: ingot,
			gold: gold,
		}

		//验证玩家状态
		//todo
		//进入房间
		//此处应当添加当前所选服务器挂掉了自动将数据迁移到其它同类服务器中
		//以此来实现负载均衡，动态调整玩家
		room_service.enterRoom(user_info, roomId, function (errcode, enterInfo) {
			if (enterInfo) {
				var ret = {
					roomid: roomId,
					ip: enterInfo.ip,
					port: enterInfo.port,
					token: enterInfo.token,
					time: Date.now()
				};
				ret.sign = crypto.md5(roomId + ret.token + ret.time + config.ROOM_PRI_KEY);
				http.send(res, 0, "ok", ret);
				return;
			}
			else {
				http.send(res, errcode, "enter room failed.");
				return;
			}
		});
	});
});
//获取整体记录
app.get('/get_history_list', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("get_history_list: error sign===>", req.query);
		return;
	}
	var data = req.query;
	var account = data.account;
	var page = data.page;
	var server_type = data.server_type;

	if(!account || !page || !server_type){
		return;
	}

	//server_type = 20001;

	//检测server_type
	if (game_config.games[server_type] == null) {
		http.send(res, -1, "server_type error.")
		return;
	}

	db.get_user_data(account, function (ret) {
		if (ret == null) {
			http.send(res, -1, "system error");
			return;
		}
		var data = {
			user_id: ret.userid,
			page: page,
			server_type: server_type
		}
		// console.log(ret,data)
		db.get_user_history2(data, function (err, rows, fields) {
			// console.log(rows[0])
			// console.log(rows[1])
			if (err) {
				logger.error(err.stack);
				http.send(res, error.FAILED, "failed");
				return;
			}
			if (rows[0][0].result == 1) {
				var history = {
					rows: 10,
					page: page,
					all_counts: rows[0][0].all_counts,
					detail: []
				}
				for (var a in rows[1]) {
					var his = rows[1][a];
					var user_data = [];
					var seat_info = JSON.parse(his.seat_info);
					var score_info = [];
					if (his.score_info && his.score_info != '') {
						score_info = JSON.parse(his.score_info);
					}
					for (var b in seat_info) {
						var score = score_info[b];
						if (!score) {
							score = 0;
						}
						var user = {
							user_id: seat_info[b].user_id,
							user_icon: '',
							user_name: seat_info[b].name,
							user_score: score,
						}
						user_data.push(user);
					}

					var data = {
						uuid: his.uuid,
						id: his.id,
						base_info: his.base_info,
						create_time: his.create_time,
						user_data: user_data,
						zip_reason: his.zip_reason,
						zip_time: his.zip_time,
					}
					history.detail.push(data);
				}

				//console.log(history)
				http.send(res, 0, "ok", { history: history });
				return;
			} else {
				var history = {
					rows: 10,
					page: page,
					all_counts: rows[0][0].all_counts,
					detail: []
				}
				http.send(res, 0, "ok", { history: history });
				return;
			}
		});
	});
});
//获取详细记录
app.get('/get_games_of_room', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("get_games_of_room: error sign===>", req.query);
		return;
	}
	var data = req.query;
	var uuid = data.uuid;
	if (!uuid) {
		http.send(res, -1, "parameters don't match api requirements.");
		return;
	}
	// db.get_games_of_room(uuid,function(data){
	// 	//logger.info(data);
	// 	http.send(res,0,"ok",{data:data});
	// });
	db.get_games_of_room2(uuid, function (err, rows, fields) {
		if (err) {
			logger.error(err.stack);
			http.send(res, error.FAILED, "failed");
			return;
		}
		var rows_len = rows[0].length;
		var data = []
		for (var i = 0; i < rows_len; ++i) {
			var tmp = {
				room_uuid: rows[0][i].room_uuid,
				game_index: rows[0][i].game_index,
				create_time: rows[0][i].create_time,
				result: rows[0][i].result
			}
			data.push(tmp);
		}

		http.send(res, error.SUCCESS, 'ok', { data: data });
	});
});
//获取游戏记录内容
app.get('/get_detail_of_game', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("get_detail_of_game: error sign===>", req.query);
		return;
	}
	var data = req.query;
	var uuid = data.uuid;
	var index = data.index;
	if (!uuid || !index) {
		http.send(res, -1, "parameters don't match api requirements.");
		return;
	}
	// db.get_detail_of_game(uuid,index,function(data){
	// 	http.send(res,0,"ok",{data:data});
	// });
	var data = {
		room_uuid: uuid,
		index: index
	}
	db.get_detail_of_game2(data, function (err, rows, fields) {
		if (err) {
			logger.error(err.stack);
			http.send(res, error.FAILED, "failed");
		}

		var rows_len = rows[0].length;
		var data = []
		for (var i = 0; i < rows_len; ++i) {
			var tmp = {
				holds: rows[0][i].holds,
				folds: rows[0][i].folds,
				actions: rows[0][i].actions,
				change_info: rows[0][i].change_info
			}
			data.push(tmp);
		}
		http.send(res, error.SUCCESS, 'ok', { data: data });
	});
});

/**
 * 获取玩家货币
 */
app.get('/get_user_status', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("get_user_status: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	if (!account) {
		http.send(res, error.FAILED, "failed.");
		return;
	}
	db.get_gems(account, function (data) {
		if (data != null) {
			http.send(res, 0, "ok", { gems: data.gems, coins: data.coins });
		}
		else {
			http.send(res, 1, "get gems failed.");
		}
	});
});

app.get('/get_message', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("get_message: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	var page = req.query.page;

	if (!account || !page) {
		http.send(res, error.FAILED, "failed.");
		return;
	}
	var data = {
		account: account,
		page: page,
	}
	db.get_message(data, function (err, rows, fields) {
		if (err) {
			logger.error(err.stack);
			http.send(res, error.FAILED, "failed.");
			return;
		}
		if (rows[0][0].result == 1) {
			//成功
			var messages = {
				rows: 10,
				page: page,
				all_counts: rows[0][0].all_counts,
				detail: [],
			}
			for (var a in rows[1]) {
				var msg = rows[1][a];
				var p_msg = {
					id: msg.id,
					type: msg.type_id,
					seq: msg.sort,
					loop_times: msg.loop_times,
					msgtext: msg.msgtext,
					end_time: msg.end_at,
				}
				messages.detail.push(p_msg);
			}
			http.send(res, error.SUCCESS, 'ok.', messages);
			return;
		} else {
			var messages = {
				rows: 10,
				page: page,
				all_counts: rows[0][0].all_counts,
				detail: [],
			}
			http.send(res, error.SUCCESS, 'ok.', messages);
			return;
		}
	});
});

app.get('/is_server_online', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("is_server_online: error sign===>", req.query);
		return;
	}
	// var ip = req.query.ip;
	// var port = req.query.port;
	var server_type = req.query.server_type;

	//console.log("check server online===>",server_type)
	room_service.isServerOnline(server_type, function (isonline) {
		var ret = {
			isonline: isonline
		};
		http.send(res, 0, "ok", ret);
	});
});


//检测签名
function check_sign(data, mask) {
	while (true) {
		if (mask.indexOf(' ') != -1) {
			mask = mask.replace(' ', '+')
		} else {
			break;
		}
	}

	var mask_arr = mask.split('?');
	var client_sign = mask_arr[0];
	var token = mask_arr[1];
	var my_sign = crypto.checkhmac(data, token);

	console.log("client sign ====>",client_sign);
	console.log("my_sign ========>",my_sign);

	if (my_sign === client_sign) {
		return true;
	}
	return false;
}

//请求转发
//创建订单
app.get('/pay_order', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("pay_order: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	var good_sn = req.query.good_sn;
	var good_count = req.query.good_count;
	var pay_platform = req.query.pay_platform;

	//校验合法性
	//不合法直接丢弃
	if (!account || !good_sn || !good_count || !pay_platform) {
		http.send(res, error.FAILED, 'failed.')
		return;
	}

	var data = {
		account: account,
		good_sn: good_sn,
		good_count: good_count,
		pay_platform: pay_platform,
	}
	var str = JSON.stringify(data);

	//console.log("crypt str====================",str)
	// if (!check_sign(JSON.stringify(data), mask)) {
	// 	logger.warn('account [%s] pay order check mask failed.', account);
	// 	http.send(res, error.FAILED, 'failed');
	// 	return;
	// }

	http.get(config.PAY_IP, config.PAY_PORT, '/pay_order', data, function (ret, data) {
		if (ret == true) {
			// console.log("pay order ==>",data);
			if (data.errcode == 0) {
				http.send(res, error.SUCCESS,'ok.', data);
				return;
			}
			http.send(res, data.errcode, 'ok.',data.errmsg);
			return;
		}
		http.send(res, error.FAILED, "failed");
	});

});

//请求转发
//支付成功
app.get('/pay_success', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("pay_success: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	var pay_id = req.query.pay_id;
	var order_id = req.query.order_id;
	var good_sn = req.query.good_sn;
	var pay_platform = req.query.pay_platform;
	var is_sandbox = req.query.is_sandbox;
	var check = req.query.check;
	//FOR test
	//is_sandbox = true;
	
	//合法性校验，不合法直接全部丢弃
	if (!account || !pay_id || !order_id || !good_sn || !pay_platform || !check || !is_sandbox) {
		http.send(res, error.FAILED, 'failed.');
		return;
	}

	var data = {
		account: account,
		pay_id: pay_id,
		order_id: order_id,
		good_sn: good_sn,
		pay_platform: pay_platform,
		is_sandbox: is_sandbox,
		check: check
	}


	// //console.log(JSON.stringify(data));
	// //检测签名
	// if (!check_sign(JSON.stringify(data), mask)) {
	// 	logger.warn('account [%s] pay succss check mask failed.', account);
	// 	http.send(res, error.FAILED, 'failed');
	// 	return;
	// }

	http.get(config.PAY_IP, config.PAY_PORT, '/pay_success', data, function (ret, data1) {
		if (ret == true) {
			console.log(data1);
			if (data1.errcode == error.SUCCESS) {
				http.send(res, error.SUCCESS,'ok.',data1);
				return;
			}
			http.send(res, data1.errcode, 'call failed.');
			return;
		}
		http.send(res, error.FAILED, "failed");
	});
});

//反馈
app.get('/user_advice', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("user_advice: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	var advice_type = req.query.advice_type;
	var advice_game = req.query.advice_game;
	var advice_platform = req.query.advice_platform;
	var msg = req.query.msg;

	if (!account || !advice_type || !advice_platform || !msg) {
		http.send(res, error.ADVICE_ERROR_ARGS_ERROR, 'failed');
		return;
	}
	//控制短时间不能插入多条建议，防止刷包
	//投诉类型检测
	var ad_ty_info = game_config.advice_type_map[advice_type];
	if (!ad_ty_info) {
		http.send(res, error.ADVICE_ERROR_TYPE_UNKON, 'failed');
		return;
	}
	//投诉游戏检测
	var ad_game_info = game_config.games[advice_game];
	if (!ad_game_info) {
		http.send(res, error.ADVICE_ERROR_GAME_UNKON, 'failed');
		return;
	}

	//TODO敏感词汇过滤

	var data = {
		account: account,
		advice_type: advice_type,
		advice_game: advice_game,
		advice_platform: advice_platform,
		msg: msg
	}

	db.try_create_new_advice(data, function (err, rows, fields) {
		if (err) {
			logger.error(err.stack);
			http.send(res, error.ADVICE_ERROR_UNDEFINED, 'failed');
			return;
		}
		var result = rows[0][0].result;
		var error_code = error.SUCCESS;
		if (result == 1) {
			//成功
			http.send(res, error_code, 'success')
			return;
		}
		else if (result == -1) {
			error_code = error.USER_NOT_FOUND;
		}
		else if (result == 2) {
			error_code = error.ADVICE_ERROR_TIME_LIMITED;
		} else {
			error_code = error.ADVICE_ERROR_UNDEFINED;
		}
		http.send(res, error_code, 'failed');
		return;
	});

});

//反馈查询
app.get('/show_advice', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("show_advice: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	var page = req.query.page;

	if (!account || !page) {
		http.send(res, error.ADVICE_ERROR_ARGS_ERROR, 'failed');
		return;
	}

	var data = {
		account: account,
		page: page
	}

	db.try_find_advice(data, function (err, rows, fields) {
		if (err) {
			logger.error(err.stack);
			http.send(res, error.ADVICE_ERROR_UNDEFINED, 'failed');
			return;
		}
		var result = rows[0][0].result;
		var error_code = error.SUCCESS;
		if (result == 1) {
			//成功
			//TODO此处还要添加相关的详细信息
			var info = {
				rows: 10,
				page: page,
				all_counts: rows[0][0].all_counts,
				detail: []
			}

			for (var a in rows[1]) {
				var l = rows[1][a];
				var tmp = {
					id: l.id,
					advice_type: l.advice_type,
					advice_game: l.advice_game,
					msg: l.msg,
					create_time: l.create_time,
					status: l.status,
					msg_back: l.msg_back,
					update_time: l.update_time
				};
				info.detail.push(tmp);
			}
			http.send(res, error_code, { info: info })
			return;
		}
		else if (result == -1) {
			error_code = error.USER_NOT_FOUND;
		} else if (result == 2) {
			//没有更多的记录
			error_code = error.ADVICE_ERROR_NOT_MORE
		} else {
			error_code = error.ADVICE_ERROR_UNDEFINED
		}
		http.send(res, error_code, 'failed');
		return;
	});
});

//标记反馈已经解决
app.get('/solve_advice', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("solve_advice: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	var ad_id = req.query.ad_id;

	//参数检测
	if (!account || !ad_id) {
		return;
	}

	var data = {
		account: account,
		ad_id: ad_id
	}

	db.try_solve_advice(data, function (err, rows, fields) {
		if (err) {
			logger.error(err.stack);
			http.send(res, error.ADVICE_ERROR_UNDEFINED, 'failed');
			return;
		}
		var result = rows[0][0].result;
		var error_code = error.SUCCESS;
		if (result == 1) {
			//成功
			http.send(res, error_code, 'success')
			return;
		}
		else if (result == -1) {
			error_code = error.USER_NOT_FOUND;
		}
		else if (result == 2) {
			//未找到相关的投诉建议
			error_code = error.ADVICE_ERROR_NOT_FOUND;
		} else {
			//未定义错误
			error_code = error.ADVICE_ERROR_UNDEFINED
		}
		http.send(res, error_code, 'failed')
		return;
	});
});

//用户邮件
app.get('/user_mail', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("user_mail: error sign===>", req.query);
		return;
	}
	var user_account = req.query.account;
	var page = req.query.page;

	if (!user_account|| !page) {
		http.send(res, error.FAILED, "failed");
		return;
	}

	mail_service.get_user_mail(user_account, page, function (result, data) {
		if (result != error.SUCCESS) {
			http.send(res, result, 'failed');
			return;
		}
		http.send(res, result, { mail: data });
	});

});

//用户操作邮件
app.get('/user_operate_mail', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("user_operate_mail: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	var operate_code = req.query.operate_code;
	var mail_id = req.query.mail_id;

	if (!account|| !operate_code || !mail_id) {
		http.send(res, error.FAILED, 'failed1');
		return;
	}

	mail_service.user_operate_mail(account, operate_code, mail_id, function (result, data) {
		if (result != error.SUCCESS) {
			http.send(res, result, 'failed2');
			return;
		}
		http.send(res, result, 'success',data);
	});
});

//转盘状态
app.get('/route_state', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("route_state: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	if(!account){
		return;
	}

	route_service.route_state(account, function (ret, route_info) {
		if (ret) {
			http.send(res, error.SUCCESS, 'ok.', { can_route: true, route_info: route_info });
			return;
		}
		http.send(res, error.SUCCESS, 'ok.', { can_route: false, route_info: route_info });
		return;
	})
});

//转转盘
app.get('/do_route', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("do_route: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	if(!account){
		return;
	}
	route_service.route(account, function (ret) {
		if (ret) {
			var data = {
				hit_index: ret.hit_index,
				ingot_value: ret.ingot_value,
				gold_value: ret.gold_value,
				send: ret.send,
				mask: ret.mask,
			}
			http.send(res, error.SUCCESS, 'ok.', data);
			return;
		}
		http.send(res, error.FAILED, 'failed.');
		return;
	});
});

//花钱转
//TODO现在消耗的金币是写死的
app.get('/pay_route',function(req,res){
	if(!sign.check_sign(req.query)){
		logger.warn("pay_route: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	if(!account){
		return;
	}

	route_service.pay_route(account, function (ret) {
		if (ret) {
			var data = {
				hit_index: ret.hit_index,
				ingot_value: ret.ingot_value,
				gold_value: ret.gold_value,
				send: ret.send,
				mask: ret.mask,
			}
			http.send(res, error.SUCCESS, 'ok.', data);
			return;
		}
		http.send(res, error.FAILED, 'failed.');
		return;
	});
});

//转盘记录
app.get('/route_log', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("route_log: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	route_service.route_log(account, function (ret) {
		if (ret) {
			http.send(res, error.SUCCESS, 'ok', ret);
			return
		}
		http.send(res, error.SUCCESS, 'none.', {});
		return;
	});

});
//钻石换房卡
app.get('/gold_to_ingot', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("gold_to_ingot: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	var gold = req.query.gold;

	if (!account || !gold) {
		http.send(res, error.FAILED, 'failed.');
		return;
	}
	var data = {
		account: account,
		gold: gold,
		rate: 4,
	}
	db.try_gold_to_ingot(data, function (err, rows, fields) {
		if (err) {
			logger.error("TRY GOLD 2 INGOT:", err.stack);
			http.send(res, error.FAILED, 'failed');
			return;
		}
		if (rows[0][0].result == 1) {
			var row = rows[0][0];
			var user_id = row.user_id;
			log_manager.insert_gold_log(user_id, user_id, user_id, log_point.GOLD_COST_EXCHANGE, row.new_add_ingot * row.rate, row.new_gold);
			log_manager.insert_ingot_log(user_id, user_id, user_id, log_point.INGOT_ADD_EXCHANGE, row.new_add_ingot, row.new_ingot);
			var ret = {
				new_add_ingot: row.new_add_ingot,
				cost_gold: row.new_add_ingot * row.rate,
				old_gold: row.old_gold,
				old_ingot: row.old_ingot,
				new_ingot: row.new_ingot,
				new_gold: row.new_gold,
				rate: row.rate,
			}
			http.send(res, error.SUCCESS, 'ok.', ret);
			return;
		}
		http.send(res, error.FAILED, 'failed');
		return;
	});
});

//房卡换钻石
app.get('/ingot_to_gold', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("ingot_to_gold: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	var ingot = req.query.ingot;

	if (!account || !ingot) {
		http.send(res, error.FAILED, 'failed.');
		return;
	}
	var data = {
		account: account,
		ingot: ingot,
		rate: 4,
	}
	db.try_ingot_to_gold(data, function (err, rows, fields) {
		if (err) {
			logger.error("TRY INGOT 2 GOLD:", err.stack);
			http.send(res, error.FAILED, 'failed');
			return;
		}
		if (rows[0][0].result == 1) {
			var row = rows[0][0];
			var user_id = row.user_id;
			log_manager.insert_gold_log(user_id, user_id, user_id, log_point.GOLD_ADD_EXCHANGE, row.new_add_gold, row.new_gold);
			log_manager.insert_ingot_log(user_id, user_id, user_id, log_point.INGOT_COST_EXCHANGE, row.new_add_gold / row.rate, row.new_ingot);
			var ret = {
				new_add_gold: row.new_add_gold,
				cost_ingot: row.new_add_gold / row.rate,
				old_gold: row.old_gold,
				old_ingot: row.old_ingot,
				new_ingot: row.new_ingot,
				new_gold: row.new_gold,
				rate: row.rate,
			}
			http.send(res, error.SUCCESS, 'ok.', ret);
			return;
		}
		http.send(res, error.FAILED, 'failed');
		return;
	});
});

//赠送房卡
app.get('/give_ingot', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("give_ingot: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	var target = req.query.target;
	var ingot = req.query.ingot;

	if (!account || !target || !ingot) {
		http.send(res, error.FAILED, 'failed.');
		return;
	}
	target = Number(target);
	ingot = Number(ingot);

	if (!target || !ingot || ingot <= 0) {
		http.send(res, error.FAILED, 'failed.');
		return;
	}
	var data = {
		account: account,
		target: target,
		ingot: ingot,
	}
	db.try_to_give_ingot(data, function (err, rows, fields) {
		if (err) {
			logger.error("GIVE INGOT:", err.stack);
			http.send(res, error.FAILED, 'failed.');
			return;
		}
		var row = rows[0][0];
		if (row.result == 1) {
			log_manager.insert_ingot_log(row.target, row.user_id, row.target, log_point.INGOT_ADD_GIVE, row.ingot, row.new_target_ingot);
			log_manager.insert_ingot_log(row.user_id, row.user_id, row.target, log_point.INGOT_COST_GIVE, row.ingot, row.new_ingot);
			var ret = {
				old_ingot: row.old_ingot,
				new_ingot: row.new_ingot,
				ingot: row.ingot,
			}
			http.send(res, error.SUCCESS, 'ok.', ret);
			return;
		}else{
			http.send(res, row.result, 'failed.');
			return;
		}
	});
});


//分享
app.get('/daily_share', function (req, res) {
	if(!sign.check_sign(req.query)){
		logger.warn("daily_share: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	if (!account) {
		http.send(res, error.FAILED, 'failed.');
		return;
	}
	var data = {
		account: account
	}
	db.daily_share(data, function (err, rows, fields) {
		if (err) {
			logger.error("DAILY SHARE:", err.stack);
			http.send(res, error.FAILED, 'failed.');
			return;
		}
		var row = rows[0][0];
		if (row.result == 1) {
			http.send(res, error.SUCCESS, 'ok.');
			return;
		}
		http.send(res, error.FAILED, 'failed.');
		return;
	});
});

//判断2个时间戳是不是同一天
function is_same_day(t1, t2) {
    var date1 = new Date(t1 * 1000);
    var date2 = new Date(t2 * 1000);

    if (date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate()) {
        return true;
    }
    return false;
}

/**
 * 获取玩家的额外信息
 * 包括统计信息，日常信息
 */
app.get('/get_user_extro_info',function(req,res){
	if(!sign.check_sign(req.query)){
		logger.warn("get_user_extro_info: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	if (!account) {
		http.send(res, error.FAILED, 'failed.');
		return;
	}

	db.get_user_extro_info(account, function (ret,back_data) {
		if(ret){
			var dc = back_data.daily_value.toString('utf8');
			var st = back_data.statistic.toString('utf8');
			var daily_clear_time = back_data.daily_clear_time;
			var now = Math.floor(Date.now()/1000);

			if(is_same_day(daily_clear_time,now)){
				if(dc != ''){
					dc  = JSON.parse(dc);
				}else{
					dc = {};
				}
			}else{
				dc ={};
			}
			if(st != ''){
				st = JSON.parse(st);
			}else{
				st ={};
			}
			var extro_info ={
				daily_clear:dc,
				statistic:st,
			}
			http.send(res,error.SUCCESS,'ok',extro_info);
			return;
		}else{
			http.send(res,error.FAILED,'None.');
			return;
		}
	});	
});

//邀请码状态
app.get('/invitation_state',function(req,res){
	if(!sign.check_sign(req.query)){
		logger.warn("invitation_state: error sign===>", req.query);
		return;
	}
	var account = req.query.account;

	if(!account) {
		return;
	}

	db.invitation_status(account,function(err,rows,fields){
		if(err){
			logger.error("INVITATION STATUS ERROR:",err.stack);
			http.send(res,error.FAILED,'failed1.');
			return;
		}
		// console.log(rows)
		var result = rows[0][0].reuslt;
		if(result == 1){
			http.send(res,error.SUCCESS,"ok.",{invitation:rows[0][0].inv_code});
			return;
		}
		http.send(res,error.FAILED,'failed2.');
		return;
	});
});

//设置邀请码
app.get('/invitation_code',function(req,res){
	if(!sign.check_sign(req.query)){
		logger.warn("invitation_code: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	var invitation_code = req.query.invitation;

	if(!account || !invitation_code){
		http.send(res,error.FAILED,'failed.');
		return;
	}
	var kind_type = 1; //玩家邀请码

	if(!Number(invitation_code)){
		kind_type =2; //平台邀请码
		//暂无平台邀请码
		return;
	}

	db.add_invitation_code(account,invitation_code,kind_type,function(err,rows,fields){
		if(err){
			logger.error("ADD INVITATION_CODE ERROR:",err.stack);
			http.send(res,error.FAILED,'failed1.');
			return;
		}
		var result = rows[0][0].reuslt;
		// console.log(rows)
		if(result == 1){
			var award = rows[0][0].award;
			var user_id = rows[0][0].ex_user_id;
			var my_name = rows[0][0].my_name;
			var invita_user_id = rows[0][0].ex_inv_user_id;
			var other_name = rows[0][0].other_name;
			var platfrom_key = rows[0][0].ex_platform_key;
			var platform_award =rows[0][0].ex_platform_award;
			if(award){
				//如果需要发放奖励，就发放奖励
				if(kind_type ==1){
					// db.add_gold(user_id,20,function(rows){
					// 	// console.log(rows)
					// 	var now_gold = rows[0].coins;
					// 	log_manager.insert_gold_log(user_id,0,user_id,log_point.GOLD_ADD_INVITATION,20,now_gold);
					// });
					{
						var mail_tittle = '成功绑定推荐人';
						var name  = new Buffer(other_name,'base64').toString('utf8');
						var mail_content ='恭喜你成功绑定推荐人['
						mail_content = mail_content.concat(name,']。');
						var mail_key = 'invitation_';
						mail_key = mail_key.concat(user_id,'_',Math.floor(Date.now()/1000))
						var mail_attch = {
							gold:3
						}
						mail_service.insert_sys_mail('',user_id,mail_tittle,mail_content,mail_key,mail_attch)
					}
					{
						var mail_tittle = '成功邀请玩家奖励';
						var name = new Buffer(my_name,'base64').toString('utf8');
						var mail_content = "恭喜你成功邀请一名玩家[";
						mail_content = mail_content.concat(name,"]加入游戏。");
						var mail_key ='invitation_';
						mail_key = mail_key.concat(invita_user_id ,"_" , Math.floor(Date.now()/1000));
						var mail_attch = {
							gold:5
						}
						mail_service.insert_sys_mail('',invita_user_id,mail_tittle,mail_content,mail_key,mail_attch)
					}
				}else{
					platform_award = JSON.parse(platform_award);
					var ingot =platform_award['ingot'];
					var gold = platform_award['gold'];
					if( ingot && ingot >0){
						db.add_ingot(user_id,ingot,function(rows){
							var now_ingot = rows[0].gems;
							log_manager.insert_ingot_log(user_id,0,user_id,log_point.INGOT_ADD_INVITATION,ingot,now_ingot);
						});
					}
					if(gold && gold >0){
						db.add_gold(user_id,gold,function(rows){
							var now_gold = rows[0].coins;
							log_manager.insert_gold_log(user_id,0,user_id,log_point.GOLD_ADD_INVITATION,gold,now_gold);
						});
					}
				}
				http.send(res,error.SUCCESS,"ok.",{kind_type:kind_type,platform:platfrom_key,platform_award:platform_award});
			}else{
				http.send(res,error.SUCCESS,"ok.",{kind_type:kind_type,platform:platfrom_key,platform_award:{}});				
			}
			return;
		}
		http.send(res,result,'failed2.');
		return;
	});

});

//获取公众号签名
//return {randomstr,timestamp,signature}
app.get("/web_wechat_signature",function(req,res){
	if(!sign.check_sign(req.query)){
		logger.warn("web_wechat_signature: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	var url = req.query.url; //base64
	url = new Buffer(url,'base64').toString('utf8');
	var channel = req.query.channel;

	if(!account || !url || !sign || !channel){
		http.send(res,error.FAILED,"failed.");
		return;
	}

	//TODO检查签名

	//确保合法用户
	db.check_account(account,function(result){
		if(result){
			web_wechat.get_wehcat_signature(account,url,channel,function(result,ret){
				if(result){
					var data ={
						noncestr:ret.seed,
						timestamp:ret.tsp,
						channel:channel,
						signature:ret.signature
					}
					http.send(res,error.SUCCESS,'ok.',data);
					return;
				}else{
					http.send(res,error.FAILED,'Get ticket Failed.');
					return;
				}
			});
		}else{
			http.send(res,error.FAILED,'invalied.')
			return;
		}
	});
});

//获取其它玩家的信息
app.get("/other_user_info",function(req,res){
	if(!sign.check_sign(req.query)){
		logger.warn("other_user_info: error sign===>", req.query);
		return;
	}
	var account = req.query.account;
	var target = req.query.target;

	if(!account || !target || !sign){
		return;
	}

	//check account invalied.
	db.is_user_exist(account,function(ret){
		if(ret){
			//check target invalied.
			db.get_user_info_byid(target,function(ret){
				if(ret){
					var daily_value = {}
					if(ret.daily_value){
						daily_value = ret.daily_value.toString('utf8')
					}
					var statistic = {}
					if(ret.statistic){
						statistic = ret.statistic.toString('utf8');
					}
					var data ={
						user_id:ret.user_id,
						name:ret.name,
						sex:ret.sex,
						headimg:ret.headimg,
						lv:ret.lv,
						exp:ret.exp,
						coins:ret.coins,
						gems:ret.gems,
						platform:ret.platform,
						reg_time:ret.reg_time,
						online_time:ret.online_time,
						route_time:ret.route_time,
						check_in_time:ret.check_in_time,
						share_time:ret.share_time,
						daily_value:daily_value,
						statistic:statistic,
					}

					http.send(res,error.SUCCESS,'ok',data);
					return;
				}else{
					http.send(res,error.FAILED,'failed1.');
					return;
				}
			});
		}else{
			http.send(res,error.FAILED,'failed2.');
			return;
		}
	})

});

//代开房间
app.get('/create_agent_room', function (req, res) {
	//验证参数合法性
	// if(!sign.check_sign(req.query)){
	// 	logger.warn("create_agent_room: error sign===>", req.query);
	// 	return;
	// }
	var account = req.query.account;
	var conf = req.query.conf;
	if(!account || !conf){
		return;
	}
	//for test --------------
	var data_test ={
		type_index:2,
		rule_index:532514,
		server_code:20010
	}
	conf = JSON.stringify(data_test);
	//test end ---------------

	//获取用户信息.
	db.get_user_data(account, function (data) {
		if (data == null) {
			http.send(res, 1, "system error");
			return;
		}
		var userId = data.userid;
		var name = data.name;
		var ingot = data.gems;
		var gold = data.coins;

		var user_info = {
			userId: userId,
			name: name,
			ingot: ingot,
			gold: gold,
		}
		room_service.create_agent_room(user_info, conf, function (err, roomId) {
			if (err == 0 && roomId != null) {
				var ret = {
					roomid:roomId
				};
				http.send(res, error.SUCCESS, "ok", ret);
			}
			else {
				http.send(res, err, "create failed");
			}
		});
	});
});



//查询代开房间
app.get('/get_agent_room', function (req, res) {
	//验证参数合法性
	// if(!sign.check_sign(req.query)){
	// 	logger.warn("create_agent_room: error sign===>", req.query);
	// 	return;
	// }
	var account = req.query.account;
	if(!account){
		return;
	}
	//获取用户信息.
	db.get_user_data(account, function (data) {
		if (data == null) {
			http.send(res, 1, "failed");
			return;
		}
		var userId = data.userid;
		room_service.get_agent_room(userId, function (rooms) {
			if (rooms) {
				var data = {
					rooms:rooms,
				}
				http.send(res, error.SUCCESS, "ok", data);
			}
			else {
				http.send(res, 1, "failed");
			}
		});
	});
});


//删除代开房间
app.get('/delete_agent_room', function (req, res) {
	//验证参数合法性
	// if(!sign.check_sign(req.query)){
	// 	logger.warn("delete_agent_room: error sign===>", req.query);
	// 	return;
	// }
	var account = req.query.account;
	var roomid = req.query.roomid;
	if(!account || !roomid){
		return;
	}
	//获取用户信息.
	db.get_user_data(account, function (data) {
		if (data == null) {
			http.send(res, 1, "failed");
			return;
		}
		var userId = data.userid;
		room_service.delete_agent_room(userId,roomid,function(ret) {
			if (ret) {
				var result = {
					roomid:roomid
				}
				http.send(res, error.SUCCESS, "ok", result);
			}
			else {
				http.send(res, 1, "failed");
			}
		});
	});
});





////////////////////////内部消息转发////////////////////////////
//内部消息转发
app.get('/reload', function (req, res) {
	var clientip = get_client_ip(req);
	if (clientip.indexOf("::ffff:") != -1) {
		clientip = clientip.substr(7);
	}

	var passport = Object.values(iptables.white_table);

	if (passport.indexOf(clientip) == -1) {
		return;
	}


	route_service.reload_config(function (ret) {
		if (ret) {
			http.send(res, error.SUCCESS, 'ok');
		} else {
			http.send(res, error.FAILED, 'failed.');
		}
	});
});

//获取玩家详细信息
//后台接口
//验证客户端
app.get('/get_user_info', function (req, res) {
	var user_id = req.query.user_id;
	var sign = req.query.sign;

	if (!Number(user_id)) {
		http.send(res, error.FAILED, 'Invailed user id.');
		return;
	}

	db.web_get_user_data_by_userid(user_id, function (data) {
		if (data) {
			//userid,name,headimg,coins,gems,roomid,reg_time
			var ret = {
				user_id: user_id,
				name: data.name,
				headimg: data.headimg,
				current_room_id: data.roomid,
				reg_time: data.reg_time,
			}
			http.send(res, error.SUCCESS, "ok", ret);
		}
		else {
			http.send(res, error.FAILED, "null", {});
		}
	});
});
// //测试代码
// app.get('/pay_debug',function(req,res){
// 	var user_id = req.query.user_id;

// 	db.add_user_gems(user_id,10,function(result){
// 		if(result){
// 			http.send(res,error.SUCCESS,'success.');
// 			return;
// 		}
// 		http.send(res,error.FAILED,'failed.')
// 	});

// });

exports.start = function ($config) {
	config = $config;
	route_service.init();
	web_wechat.init();
	app.listen(config.CLEINT_PORT);
	logger.info("CLIENT SERVICE RUNING ON:" + config.CLEINT_PORT);
};