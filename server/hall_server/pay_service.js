var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require('../utils/http');

var logger = require('./log.js').log_hall;
const error = require('../config/error').error;
var pay_config = require('../config/pay_config');

var log_manager = require('../common/log_manager');
var log_point = require('../config/log_point').log_point;
var mail_service = require('./mail_service');

var app = express();
var config = null;

function show_request(commond,args){
	logger.debug('Http[%s][%s]',commond,args);
}

function check_account(req,res){
	var account = req.query.account;
	var sign = req.query.sign;
	if(account == null || sign == null){
		http.send(res,1,"unknown error");
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
app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By",' 3.2.1');
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});

//请求支付
app.get('/pay_order',function(req,res){
	var account = req.query.account;
	var good_sn = req.query.good_sn;
	var good_count = req.query.good_count;
	var pay_platform = req.query.pay_platform;
	//TODO添加验证信息
	var pay_info =pay_config.pay[good_sn]
	if( pay_info == null){
		http.send(res,error.PAY_ITEM_ERROR,'invailed.');
		return;
	}
	var suffix ='';
	var rd= Math.floor(Math.random()*99999)+'';
	for(var i=0;i<5-rd.length;++i){
		suffix += '0';
	}
	suffix +=rd;
	data ={
		account:account,
		good_sn:good_sn,
		suffix:suffix,
		order_money:pay_info.money,
		award_gold:pay_info.gold,
		extro_gold:pay_info.extro_gold,
		award_ingot:pay_info.ingot,
		extro_ingot:pay_info.extro_ingot,
		good_count:good_count,
		pay_platform:pay_platform
	}
	db.create_pay_order(data,function(err,rows,fields){
		if(err){
			logger.error(err.stack);
			http.send(res,error.FAILED,'failed.')
			return;
		}
		var result =rows[0][0].result;
		if( result==1){
			http.send(res,error.SUCCESS,'ok.',{pay_id:rows[0][0].pay_id});
			return;
		}
		var error_code = error.FAILED;
		if(result == -1){
			error_code = error.PAY_CHECK_USER_NOT;
		}
		if(result == 2){
			error_code = error.PAY_CHECK_WAIT;
		}
		
		http.send(res,error_code,'failed');
	});

});


//支付成功回调
app.get('/pay_success',function(req,res){
	var account = req.query.account;
	var pay_id = req.query.pay_id;
	var order_id = req.query.order_id;
	var good_sn =req.query.good_sn;
	var check = req.query.check;
	var pay_platform = req.query.pay_platform;
	var is_sandbox = req.query.is_sandbox

	// logger.debug("pay info=>",account,pay_id,order_id,good_sn,check.length,pay_platform,is_sandbox)
	
	var host ='buy.itunes.apple.com';
	if(is_sandbox){
		host ='sandbox.itunes.apple.com';
	}

	var https = require('https');
	var verify = JSON.stringify({'receipt-data':check});	
	var app_store_options = {
		hostname:host,
		port:443,
		path:'/verifyReceipt',
		method:'POST',
		headers:{
			'Content-Type':'Keep-Alive',
			'Content-Length':verify.length
		},
	};
	var check_pay_order_invailed = function(data){
		if(data.status !=0){
			http.send(res,data.status,'check order failed');
			return;
			// 21000App Store无法读取你提供的JSON数据
			// 21002 收据数据不符合格式
			// 21003 收据无法被验证
			// 21004 你提供的共享密钥和账户的共享密钥不一致
			// 21005 收据服务器当前不可用
			// 21006 收据是有效的，但订阅服务已经过期。当收到这个信息时，解码后的收据信息也包含在返回内容中
			// 21007 收据信息是测试用（sandbox），但却被发送到产品环境中验证
			// 21008 收据信息是产品环境中使用，但却被发送到测试环境中验证
		}
		var receipt = data.receipt;

		//下列所有验证都需要添加玩家信息日志，用于记录玩家是否在刷包

		//订单ID
		var r_order_id = receipt.transaction_id;
		//数量
		var r_quantity = receipt.quantity;
		//商品ID
		var r_good_sn = receipt.product_id;
		//应用ID
		var r_appid = receipt.bid;
		//支付项ID(苹果商店生成ID)
		var r_itemid = receipt.item_id;
		//支付时间戳(美国时间)
		var r_pay_time = receipt.purchase_date_ms;

		var check_action = error.SUCCESS;
		//订单信息不匹配
		if(r_good_sn != good_sn){
			//商品编号对不上
			check_action = error.PAY_APP_CHECK_ITEM_NONE;
			http.send(res,check_action,'failed');
			return;
		}

		var pay_info= pay_config.pay[r_good_sn];
		//支付信息不存在
		if(pay_info == null){
			check_action = error.PAY_ITEM_ERROR;
			http.send(res,check_action,'failed');
			return;
		}
		//支付ITEM id和苹果不匹配
		if(r_itemid  != pay_info.item_id){
			check_action = error.PAY_APP_ITEM_ID_FAILED;
			http.send(res,check_action,'failed');
			return;
		}
		//appid不匹配
		if(r_appid != pay_config.appinfo.bid){
			check_action = error.PAY_APP_APP_ID_NOT_MATCH;
			http.send(res,check_action,'failed');
			return;
		}
		//订单ID不匹配
		if(r_order_id != order_id){
			check_action = error.PAY_APP_ORDER_NOT_MATCH
			http.send(res,check_action,'failed');
			return;
		}

		var data ={
			account:account,
			good_sn:good_sn,
			pay_platform:pay_platform,
			order_id:order_id,
			pay_id:pay_id,
			pay_count:r_quantity,
			app_pay_time:r_pay_time,
		}

		// console.log(data);

		db.pay_success(data,function(err,rows,fields){
			if(err){
				logger.error(err.stack);
				http.send(res,error.PAY_FAILED_UNDEFINED,'pay failed try again.');
				return;
			}
			var result = rows[0][0].result;
			//console.log(rows);
			if(result == 1){
				//console.log(rows)
				var total_ingot = rows[0][0].total_ingot;
				var added_ingot = rows[0][0].added_ingot;
				var total_gold = rows[0][0].total_gold;
				var added_gold = rows[0][0].added_gold;
				var user_id = rows[0][0].user_id;
				var invitation_code = rows[0][0].invitation_code;

				var add_mail_user = Number(invitation_code);

				if(!add_mail_user){

				}else{
					db.get_user_data_by_userid(add_mail_user,function(ret){
						if(ret){
							var name = ret.name;
							var pay_back_value = Math.floor(added_gold*0.2);
							if(pay_back_value >0){
								var mail_tittle ='推荐有奖'
								var mail_content ='恭喜你获取推荐玩家[';
								mail_content = mail_content.concat(name,']充值返利 [',pay_back_value,']钻石');
								var mail_key ='pay_back_';
								mail_key = mail_key.concat(Math.floor(Date.now()/1000),'_',add_mail_user,'_',Math.floor(Math.random()*1000))
								var mail_attack ={
									gold:pay_back_value
								}
								mail_service.insert_sys_mail('',add_mail_user,mail_tittle,mail_content,mail_key,mail_attack);
							}
						}
					});
				}


				if(Number(added_ingot)){
					log_manager.insert_ingot_log(user_id,0,user_id,log_point.INGOT_ADD_PAY,added_ingot,total_ingot);
				}
				if(Number(added_gold)){
					log_manager.insert_ingot_log(user_id,0,user_id,log_point.GOLD_ADD_PAY,added_gold,total_gold);
				}

				http.send(res,error.SUCCESS,'ok.',{added_gold:added_gold,total_gold:total_gold,added_ingot:added_ingot,total_ingot:total_ingot});
				return;
			}
			var error_code =error.PAY_APP_CHECK_FAILED_UNDEFINED
			if(result == -1){
				error_code = error.PAY_CHECK_USER_NOT;
			}
			if(result == -2){
				error_code = error.PAY_APP_CHECK_NONE;
			}
			http.send(res,error_code,'pay added failed.')
		});

	}
	//FOR TEST
	// var data ={
	// 	status:0,
	// 	receipt:{
	// 		transaction_id:11000000001,
	// 		quantity:1,
	// 		product_id:10001,
	// 		item_id:1230427243,
	// 		bid:'com.totorotec.yueyueqipai',
	// 		purchase_date_ms:12323232323
	// 	}
	// }
	// check_pay_order_invailed(data);
	//TEST END
	
	var appreq = https.request(app_store_options,function(data){
		// console.log('STATUS: ' + data.statusCode);  
		// console.log('HEADERS: ' + JSON.stringify(data.headers)); 
		// var timer = setTimeout(function(res){
		// 	appreq.abort();
		// 	http.send(res,error.TIME_OUT,'time-out',{});
		// },10000);
		if(data.statusCode != 200){
			//apple 请求验证失败
			http.send(res,data.statusCode,'failed.');
			return;
		}
		data.setEncoding('utf8');
		data.on('data', function (chunk) {  
			//console.log('BODY: ' + chunk);
			// clearTimeout(timer);
			check_pay_order_invailed(JSON.parse(chunk));
		});
	
	});
	appreq.write(verify);
	appreq.on('error',function(err){
		logger.error("req apple pay vertify error:",err.stack);
		http.send(res,error.PAY_REQ_FAILED,'req ver faild.')
	})
	appreq.end();
});

exports.start = function($config){
	config = $config;
	app.listen(config.PAY_PORT,config.PAY_IP);
	logger.info("PAY SERVICE RUNNING ON: %s:%d",config.PAY_IP,config.PAY_PORT);
};