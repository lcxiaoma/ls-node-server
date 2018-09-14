/**
 * 暴露给后台的代理API
 * **/
var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require("../utils/http");

var configs = null;
var logger = require('./log.js').accountlog;
const error = require('../config/error').error;
//日志相关
var log_manager = require('../common/log_manager');
var log_point = require('../config/log_point').log_point;

var app = express();

function send(res, ret) {
	var str = JSON.stringify(ret);
	res.send(str)
}

//安全相关模块
var secret = require('../utils/secret');
var challenge = require('../common/challenge');


//转换JSON保护
function try_parse_json(json_str) {
	try {
		var json = JSON.parse(json_str);
		return json;
	} catch (err) {
		return null;
	}
}
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

exports.start = function (config) {
	configs = config;
	challenge.init(logger, "AGENT");
	app.listen(config.DEALDER_API_PORT, config.DEALDER_API_IP);
	logger.info("AGENT API RUNING ON: " + config.DEALDER_API_IP + ":" + config.DEALDER_API_PORT);
};

//设置跨域访问
app.all('*', function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By", ' 3.2.1')
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});

// app.get('/who', function (req, res) {
// 	challenge.who(http, req, res);
// 	// console.log("who?")
// });

// app.get('/challenge', function (req, res) {
// 	challenge.challenge(http, req, res);
// 	// console.log("challenge!.")
// });

// var client_info = {}

// app.get('/test', function (req, res) {
// 	var data = req.query.data;
// 	var remote_ip = get_client_ip(req);
// 	var challenge_info = challenge.challenge_info(remote_ip, req.query.key);
// 	if (!challenge_info) {
// 		return;
// 	}

// 	var plant_text = secret.aes_decrypt(data, challenge_info.secret);

// 	if (plant_text == null) {
// 		return;
// 	}

// 	var reqdata = try_parse_json(plant_text);

// 	if (reqdata == null) {
// 		return;
// 	}
// 	var user_info = {
// 		user_id: reqdata.user_id,
// 		ingot: reqdata.ingot,
// 		success: true,
// 	}
// 	http.crypto_send(res, error.SUCCESS, 'ok.', user_info, challenge_info.secret);

// });

//获取玩家详细信息
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
				gold: data.coins,
				ingot: data.gems,
				current_room_id: data.roomid,
				reg_time: data.reg_time,
				lock: data.lock,
				agent: data.agent,
			}
			http.send(res, error.SUCCESS, "ok", ret);
		}
		else {
			http.send(res, error.FAILED, "null", {});
		}
	});
});
//添加用户房卡
app.get('/add_user_ingot', function (req, res) {
	var sender_id = req.query.sender_id;
	var user_id = req.query.user_id;
	var ingot = req.query.ingot;
	var sign = req.query.sign;

	//check args
	if (!Number(sender_id) || !Number(user_id) || !Number(ingot) || sign == null) {
		http.send(res, error.FAILED, 'failed.')
		return;
	}
	ingot = Number(ingot);
	if (ingot <= 0) {
		http.send(res, error.FAILED, 'failed.')
		return;
	}
	//check sign
	var data = {
		sender_id: sender_id,
		user_id: user_id,
		ingot: ingot,
	}
	db.web_add_user_ingot(data, function (err, rows, fields) {
		if (err) {
			logger.error("[add_user_ingot]", err.stack);
			http.send(res, error.WEB_ADD_INGOT_ERROR_DB_ERROR, 'failed.');
			return;
		}
		if (rows[0][0].result != 1) {
			logger.warn("[add_user_ingot] result =>", rows[0][0].result);
			http.send(res.error.WEB_ADD_INGOT_ERROR_USER_NOT_FOUND, 'failed.')
			return;
		}

		//console.log(rows)

		var old_ingot = rows[0][0].old_ingot;
		var now_ingot = rows[0][0].now_ingot;

		var dbuser_info = rows[1][0];

		var data = {
			user_info: {
				user_id: dbuser_info.userid,
				name: crypto.fromBase64(dbuser_info.name),
				headimg: dbuser_info.headimg,
				gold: dbuser_info.coins,
				ingot: dbuser_info.gems,
				current_room_id: dbuser_info.roomid,
				reg_time: dbuser_info.reg_time,
			},
			old_value: old_ingot,
			now_value: now_ingot,
		}
		//成功代码
		http.send(res, error.SUCCESS, 'success.', data);
		log_manager.insert_ingot_log(user_id, sender_id, user_id, log_point.INGOT_ADD_WEB, ingot, now_ingot);
		return;
	});
});
//添加用户钻石
app.get('/add_user_gold', function (req, res) {
	var sender_id = req.query.sender_id;
	var user_id = req.query.user_id;
	var gold = req.query.gold;
	var sign = req.query.sign;

	//check args
	if (!Number(sender_id) || !Number(user_id) || !Number(gold)) {
		http.send(res, error.FAILED, 'failed.')
		return;
	}
	gold = Number(gold);
	if (gold <= 0) {
		http.send(res, error.FAILED, 'failed.')
		return;
	}
	//check sign
	var data = {
		sender_id: sender_id,
		user_id: user_id,
		gold: gold,
	}
	db.web_add_user_gold(data, function (err, rows, fields) {
		if (err) {
			logger.error("[add_user_gold]", err.stack);
			http.send(res, error.WEB_ADD_GOLD_ERROR_DB_ERROR, 'failed.');
			return;
		}
		if (rows[0][0].result != 1) {
			logger.warn("[add_user_gold] result =>", rows[0][0].result);
			http.send(res.error.WEB_ADD_GOLD_ERROR_USER_NOT_FOUND, 'failed.')
			return;
		}
		var old_gold = rows[0][0].old_gold;
		var now_gold = rows[0][0].now_gold;

		var dbuser_info = rows[1][0];

		var data = {
			user_info: {
				user_id: dbuser_info.userid,
				name: crypto.fromBase64(dbuser_info.name),
				headimg: dbuser_info.headimg,
				gold: dbuser_info.coins,
				ingot: dbuser_info.gems,
				current_room_id: dbuser_info.roomid,
				reg_time: dbuser_info.reg_time,
			},
			old_value: old_gold,
			now_value: now_gold,
		}
		//成功代码
		http.send(res, error.SUCCESS, 'success.', data);
		log_manager.insert_gold_log(user_id, sender_id, user_id, log_point.GOLD_ADD_WEB, gold, now_gold);
		return;
	});
});
//添加用户邮件
app.get('/add_user_mail', function (req, res) {
	var sender_id = req.query.sender_id;
	var sender_name = req.query.sender_name;
	var user_id = req.query.user_id;
	var mail_type = req.query.mail_type;
	var mail_tittle = req.query.mail_tittle;
	var mail_content = req.query.mail_content;
	var mail_key = req.query.mail_key;
	var mail_attach = req.query.mail_attach;
	var life_time = req.query.life_time;
	var sign = req.query.sign;

	if (sender_id == null || sender_name == null || user_id == null || mail_type == null || mail_tittle == null
		|| mail_content == null || mail_key == null || mail_content == null || life_time == null || sign == null) {
		http.send(res, error.FAILED, 'failed.');
		return;
	}

	//签名检测
	mail_attach = JSON.parse(mail_attach);
	var data = {
		account: '',
		user_id: user_id,
		sender_id: sender_id,
		sender_name: sender_name,
		mail_type: mail_type,
		mail_tittle: mail_tittle,
		mail_content: mail_content,
		mail_key: mail_key,
		mail_attach: mail_attach,
		end_time: life_time,
	}

	db.web_add_user_mail(data, function (err, rows, fields) {

	});
});
//添加系统消息
//TODO  指定系统消息的类型  之类的规范
app.get('/add_system_message', function (req, res) {

	var in_type = req.query.type;
	var in_seq = req.query.seq;
	var in_loop_times = req.query.loop_times;
	var in_open_time = req.query.open_time;
	var in_end_time = req.query.end_time;
	var in_text = req.query.text;
	var in_create_id = req.query.create_id;

	// param.push(data.type);
    // param.push(data.seq);
    // param.push(data.loop_times);
    // param.push(data.open_time);
    // param.push(data.end_time);
    // param.push(data.msgtext);
    // param.push(data.create_id);

	var data ={
		type:in_type,
		seq:in_seq,
		loop_times:in_loop_times,
		open_time:in_open_time,
		end_time:in_end_time,
		msgtext:in_text,
		create_id:in_create_id
	}

	//open_time  end_time  =0 表示长期开启
	//seq  顺序 越低优先级越高
	//type    0 系统消息  1 广播消息
	//



	db.web_add_message(data, function (err, rows, fields) {
		if(err){
			logger.error('WEB ADD MESSAGE ERROR:',err.stack);
			http.send(res,error.FAILED,'failed1.');
			return;
		}
		if(rows[0][0].result == 1){
			http.send(res,error.SUCCESS,'OK.');
			return;
		}
		http.send(res,err.FAILED,'failed2.')
		return;
	});
});

//封停玩家
app.get('/lock_user', function (req, res) {
	var user_id = req.query.user_id;
	var lock_status = req.query.lock_status;

	user_id = Number(user_id);
	lock_status = Number(lock_status);

	if (!user_id) {
		http.send(res, error.FAILED, 'user id error', { user_id: user_id });
		return;
	}
	if (lock_status !== 0 && lock_status !== 1) {
		http.send(res, error.FAILED, 'lock status error', { lock_status: lock_status });
		return;
	}

	var data = {
		user_id: user_id,
		lock_status: lock_status
	}
	db.lock_user(data, function (err, rows, fields) {
		if (err) {
			logger.error("/lock_user db error:", err.stack);
			http.send(res, error.FAILED, 'db error');
			return;
		}
		if (rows[0][0].result != 1) {
			http.send(res, error.FAILED, 'db error', { error: rows[0][0].result });
			return;
		}
		http.send(res, error.SUCCESS, 'ok.', { lock_status: lock_status });
	});
});

//设置代理状态
app.get('/agent_status', function (req, res) {
	var user_id = req.query.user_id;
	var agent_status = req.query.agent_status;

	user_id = Number(user_id);
	agent_status = Number(agent_status);
	if (!user_id) {
		http.send(res, error.FAILED, 'user id error', { user_id: user_id });
		return;
	}
	if (agent_status !== 0 && agent_status !== 1) {
		http.send(res, error.FAILED, 'agent_status error', { agent_status: agent_status });
		return;
	}

	var data = {
		user_id: user_id,
		agent_status: agent_status
	}
	db.agent_status(data, function (err, rows, fields) {
		if (err) {
			logger.error("/agent_status db error:", err.stack);
			http.send(res, error.FAILED, 'db error');
			return;
		}
		if (rows[0][0].result != 1) {
			http.send(res, error.FAILED, 'db error', { error: rows[0][0].result });
			return;
		}
		http.send(res, error.SUCCESS, 'ok.', { agent_status: agent_status });
	});
});


//只有超级管理员/或者开发者才能调用这个接口
app.get('/reload_route_config', function (req, res) {
	http.get(configs.HALL_IP, configs.HALL_CLIENT_PORT, '/reload', {}, function (ret, data) {
		if (ret) {
			if (data.errcode === error.SUCCESS) {
				http.send(res, error.SUCCESS, 'ok.');
			} else {
				http.send(res, error.FAILED, 'failed.01')
			}
		} else {
			http.send(res, error.FAILED, 'failed.02');
		}
	});

});
