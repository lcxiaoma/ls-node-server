var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require("../utils/http");

var configs = require(process.argv[2]);
var logger = require('./log.js').accountlog;
const error = require('../config/error').error;

var log_manager = require('../common/log_manager');

var sign = require('../utils/sign');

var app = express();
var hallAddr = "";

function send(res,ret){
	var str = JSON.stringify(ret);
	res.send(str)
}

var config = null;

exports.start = function(cfg){
	config = cfg;
	hallAddr = config.HALL_IP  + ":" + config.HALL_CLIENT_PORT;
	app.listen(config.CLIENT_PORT);
	logger.info("ACCOUNT SERVER RUNNING ON: " + config.CLIENT_PORT);
}

//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});
/*
app.get('/register',function(req,res){
	var account = req.query.account;
	var password = req.query.password;

	var fnFailed = function(){
		send(res,{errcode:1,errmsg:"account has been used."});
	};

	var fnSucceed = function(){
		send(res,{errcode:0,errmsg:"ok"});	
	};

	db.is_user_exist(account,function(exist){
		if(exist){
			db.create_account(account,password,function(ret){
				if (ret) {
					fnSucceed();
				}
				else{
					fnFailed();
				}
			});
		}
		else{
			fnFailed();
			logger.warn("account has been used.");			
		}
	});
});
*/

app.get('/get_version',function(req,res){
	if(!sign.check_sign(req.query)){
		return;
	}
	var ret = {
		version:config.VERSION,
	}
	send(res,ret);
});

app.get('/get_serverinfo',function(req,res){
	if(!sign.check_sign(req.query)){
		logger.warn("get_serverinfo: error sign===>", req.query);
		return;
	}
	var ret = {
		version:config.VERSION,
		hall:hallAddr,
		appweb:config.APP_WEB,
	}
	send(res,ret);
});

app.get('/guest',function(req,res){
	if(!sign.check_sign(req.query)){
		logger.warn("guest: error sign===>", req.query);
		return;
	}
	var account = "guest_" + req.query.account;
	var ret = {
		errcode:0,
		errmsg:"ok",
		account:account,
		halladdr:hallAddr
	}
	send(res,ret);
});
/*
app.get('/auth',function(req,res){
	var account = req.query.account;
	var password = req.query.password;

	db.get_account_info(account,password,function(info){
		if(info == null){
			send(res,{errcode:1,errmsg:"invalid account"});
			return;
		}

        var account = "vivi_" + req.query.account;
        var sign = get_md5(account + req.ip + config.ACCOUNT_PRI_KEY);
        var ret = {
            errcode:0,
            errmsg:"ok",
            account:account,
            sign:sign
        }
        send(res,ret);
	});
});
*/

var appInfo = {
	Android:{
		appid:"wxa53af98a44593eeb",
		secret:"d9f2fbab86a938bacb170b8bb090a3a5",
	},
	iOS:{
		appid:"wxa53af98a44593eeb",
		secret:"d9f2fbab86a938bacb170b8bb090a3a5",		
	},
	wechat_default:{
		appid:"wx9a626fafe7e866cd",
		secret:"6918d5f52da9d79a0b899e5b4ced6332",
	}

};

/**
 * 获取token
 * @param {*} code 
 * @param {*} os 
 * @param {*} callback 
 */
function get_access_token(code,os,callback){
	var info = appInfo[os];
	if(info == null){
		callback(false,null);
	}
	var data = {
		appid:info.appid,
		secret:info.secret,
		code:code,
		grant_type:"authorization_code"
	};

	http.get2("https://api.weixin.qq.com/sns/oauth2/access_token",data,callback,true);
}

/**
 * 获取用户信息
 * @param {*} access_token 
 * @param {*} openid 
 * @param {*} callback 
 */
function get_state_info(access_token,openid,callback){
	var data = {
		access_token:access_token,
		openid:openid
	};

	http.get2("https://api.weixin.qq.com/sns/userinfo",data,callback,true);
}

function create_user(account,name,sex,headimgurl,platform,channal,now,callback){
	//初始的数据放到存储过程中去
	try {
		name = crypto.toBase64(name);
	} catch (err) {
		logger.error(err.stack)
		callback(error.FAILED)
		return;
	}
	if(name.length > 256){
		name = name.substring(0,255);
	}
	var data ={
		account:account,
		name:name,
		sex:sex,
		headimgurl:headimgurl,
		platform:platform,
		channal:channal,
		now:now
	}

	db.try_create_or_update_user(data,function(err,rows,field){
		if(err){
			logger.error(err.stack);
			callback(error.LOGIN_FAILED_UNDEFINED);
			return;
		}
		if(rows[0][0].result== 1){
			var log_type = rows[0][0].log_type;
			var user_id = rows[0][0].my_user_id;
			var reg_time = rows[0][0].my_reg_time;
			if(log_type == 1){
				log_manager.insert_new_come(user_id,data.platform,data.channal,reg_time);
			}
			log_manager.insert_login_log(user_id,data.platform,data.channal,reg_time);
			callback(error.SUCCESS);
		}
		else if(rows[0][0].result == -5){
			callback(error.LOGIN_FAILED_ACCOUNT_LOCK);
		}else{
			callback(error.LOGIN_FAILED_CHECK_ACCOUNT);
		}
	});

	// var coins = 1000;
	// var gems = 21;

	// db.is_user_exist(account,function(ret){
	// 	if(!ret){
	// 		db.create_user(account,name,coins,gems,sex,headimgurl,function(ret){
	// 			callback();
	// 		});
	// 	}
	// 	else{
	// 		db.update_user_info(account,name,headimgurl,sex,function(ret){
	// 			callback();
	// 		});
	// 	}
	// });
};
/**
 * APP 登录
 */
app.get('/wechat_auth',function(req,res){
	if(!sign.check_sign(req.query)){
		logger.warn("wechat_auth: error sign===>", req.query);
		return;
	}
	var code = req.query.code;
	var os = req.query.os;
	if(!code || code == "" || !os || os == ""){
		logger.warn("wechat_auth: error ::code ="+code+", os =",os)
		return;
	}
	//logger.info(" os ===%s,code === %s",os,code);

	get_access_token(code,os,function(suc,data){
		//成功的时候并没有errcode
		if(suc){
			var access_token = data.access_token;
			var openid = data.openid;
			get_state_info(access_token,openid,function(suc2,data2){
				//成功的时候 并没有errcode
				if(suc2){
					var unionid = data2.unionid;
					var nickname = data2.nickname;
					var sex = data2.sex;
					var headimgurl = data2.headimgurl;
					var account = "wx_" + unionid;
					//需要添加平台,渠道,注册时间，登录时间
					var platform =os;
					var channal = 'default';
					var now = Math.ceil(Date.now()/1000);
					create_user(account,nickname,sex,headimgurl,platform,channal,now,function(error_code){
						//console.log("create user error_code",error_code)
						var sign = crypto.md5(account + req.ip + config.ACCOUNT_PRI_KEY);
						var error_msg = (error_code == error.SUCCESS)?'ok':'failed';

					    var ret = {
					        errcode:error_code,
					        errmsg:error_msg,
					        account:account,
					        halladdr:hallAddr,
					        sign:sign
					    };

						// console.log(ret);
					    send(res,ret);
					});						
				}
			});
		}
		else{
			send(res,{errcode:-1,errmsg:"unkown err."});
		}
	});
});

app.get('/base_info',function(req,res){
	if(!sign.check_sign(req.query)){
		logger.warn("base_info: error sign===>", req.query);
		return;
	}
	var userid = req.query.userid;
	if(!userid){
		return;
	}
	db.get_user_base_info(userid,function(data){
		var ret = {
	        errcode:0,
	        errmsg:"ok",
			name:data.name,
			sex:data.sex,
	        headimgurl:data.headimg
	    };
	    send(res,ret);
	});
});