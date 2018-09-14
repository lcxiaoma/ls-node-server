/**
 * 通用认证模块
 * **/
const error = require('../config/error').error;
//安全相关模块
var secret = require('../utils/secret');
//客户端握手协议
var client_challenge ={};
//黑名单
var black_list ={};
//ip黑名单
var ip_black_list ={};

var logger = null;

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

function attemp_black_list(remote_ip,client_key,msg){
	var key = remote_ip + client_key;
	if(black_list[key]){
		if(black_list[key][msg]){
			black_list[key][msg] +=1;
		}else{
			black_list[key][msg]=1;
		}
	}else{
		black_list[key] ={};
		black_list[key][msg] =1;
	}
	if(ip_black_list[remote_ip]){
		ip_black_list[remote_ip] +=1;
	}else{
		ip_black_list[remote_ip] =1;
	}
	logger.debug("IP black list ====>",ip_black_list);
	logger.debug("MSG black list ===>",black_list);
}

function check_black_list(remote_ip,client_key,msg){
	if(ip_black_list[remote_ip]){
		if(ip_black_list[remote_ip] >20){
			return true;
		}
	}
	var key = remote_ip + client_key;
	if(black_list[key]){
		if(black_list[key][msg]){
			if(black_list[key][msg] >10){
				return true;
			}
		}
	}
	return false;
}

function get_challenge_info(remote_ip,client_key){
	var key = remote_ip+client_key;
	return client_challenge[key];
}
function remote_challenge(remote_ip,client_key){
	var key = remote_ip +client_key;
	delete client_challenge[key];
}

function add_challenge(remote_ip,client_key,challenge_info){
	var key = remote_ip+client_key;
	client_challenge[key] = challenge_info;
}
//尝试黑名单
exports.attemp_black_list = function(remote_ip,client_key,msg){
	attemp_black_list(remote_ip,client_key,msg);
}

//检测黑名单
exports.check_black_list = function(remote_ip,client_key,msg){
	return check_black_list(remote_ip,client_key,msg);
}
//握手信息
exports.challenge_info = function(remote_ip,client_key){
	return get_challenge_info(remote_ip,client_key);
}
//删除捂手信息
exports.remote_challenge = function(remote_ip,client_key){
	remote_challenge(remote_ip,client_key);
}
//密钥交换
exports.who = function(http,req,res){
	var remote_ip= get_client_ip(req);
	var client_key = req.query.key1;
	// //短时间多次尝试，拒绝服务
	// if(check_black_list(remote_ip,client_key,'who')){
	// 	logger.warn("RemoteIp:%s attemp msg:%s !.",remote_ip,'who')
	// 	return;
	// }
	// attemp_black_list(remote_ip,client_key,'who');

	var client_public_key = req.query.key2;
	var blob = secret.dh64_gen_key();
	var public_key =blob.getPublicKey('base64');

	var challenge = secret.random_b64();
	var client_secret = secret.dh64_secret(blob,client_public_key);
	if(client_secret == null){
		logger.error("/who dh64_secret failed.");
		return;
	}
	var hmac = secret.hmac64(challenge,client_secret);
	console.error("client_public key=========>",client_public_key)
	console.error("client secret --->",client_secret);
	console.error("hmac ========>",hmac)
	console.error("public key=========>",public_key);
	console.error("challenge====>",challenge)
	var out_time = Date.now()+5*60*1000;
	var challenge_info ={
		blob:blob,
		challenge:challenge,
		client_public_key:client_public_key,
		secret:client_secret,
		hmac:hmac,
		out_time:out_time
	}
	add_challenge(remote_ip,client_key,challenge_info);
	http.send(res,error.SUCCESS,'ok.',{key:public_key,challenge:challenge})
}

//认证
exports.challenge = function(http,req,res){
	var remote_ip = get_client_ip(req);
	var client_key = req.query.key1;

	// if(check_black_list(remote_ip,client_key,'challenge')){
	// 	logger.warn("RemoteIp:%s attemp msg:%s !.",remote_ip,'challenge')
	// 	return;
	// }
	// attemp_black_list(remote_ip,client_key,'challenge');

	var challenge_info = get_challenge_info(remote_ip,client_key);
	if(!challenge_info){
		http.send(res,error.FAILED,'failed.');
		return;
	}
	var client_hamc = req.query.key2;
	if(challenge_info.hmac != client_hamc){
		http.send(res,error.FAILED,'failed.');
		return;
	}
	http.send(res,error.SUCCESS,'ok.');
}

//心跳函数
function update(){
	// var mem = process.memoryUsage();
	// var format = function(bytes) {  
    //       return (bytes/1024/1024).toFixed(2)+'MB';  
    // }; 
	// logger.warn('Process: heapTotal '+format(mem.heapTotal) + ' heapUsed ' + format(mem.heapUsed) + ' rss ' + format(mem.rss));

	//清除黑名单的尝试数量
	ip_black_list ={};
	black_list ={};

	// //清除长期过期而未清除的challenge
	// var now  = Date.now();
	// var die =[];
	// for(var a in client_challenge){
	// 	var info = client_challenge[a];
	// 	if(info.out_time <now){
	// 		die.push(a);
	// 	}
	// }

	// for(var a in die){
	// 	delete client_challenge[die[a]];
	// }
}

//初始化函数
exports.init = function(log,where){
	logger = log;
	logger.info("%s CHALLENGE READY FOR CLIENT.",where);
	setInterval(update,5000);
}