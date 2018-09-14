var http = require('http');
var https = require('https');
var qs = require('querystring');
var secret = require('./secret');
var logger = null;

exports.init = function(log,where){
	logger = log;
	logger.info("%s HTTP SERVICE READY.",where);
}

String.prototype.format = function(args) {
	var result = this;
	if (arguments.length > 0) {
		if (arguments.length == 1 && typeof (args) == "object") {
			for (var key in args) {
				if(args[key]!=undefined){
					var reg = new RegExp("({" + key + "})", "g");
					result = result.replace(reg, args[key]);
				}
			}
		}
		else {
			for (var i = 0; i < arguments.length; i++) {
				if (arguments[i] != undefined) {
					//var reg = new RegExp("({[" + i + "]})", "g");//这个在索引大于9时会有问题，谢谢何以笙箫的指出
					var reg = new RegExp("({)" + i + "(})", "g");
					result = result.replace(reg, arguments[i]);
				}
			}
		}
	}
	return result;
};

exports.post = function (host,port,path,data,callback) {
	
	var content = qs.stringify(data);  
	var options = {  
		hostname: host,  
		port: port,  
		path: path + '?' + content,  
		method:'GET'
	};  
	  
	var req = http.request(options, function (res) {  
		// console.log('STATUS: ' + res.statusCode);  
		// console.log('HEADERS: ' + JSON.stringify(res.headers));  
		res.setEncoding('utf8');  
		res.on('data', function (chunk) {  
			//console.log('BODY: ' + chunk);
			callback(chunk);
		});  
	});
	  
	req.on('error', function (e) {  
		logger.error('problem with request: ' + e.message);  
	});  
	  
	req.end(); 
};

exports.get2 = function (url,data,callback,safe) {
	var content = qs.stringify(data);
	var url = url + '?' + content;
	var proto = http;
	if(safe){
		proto = https;
	}
	var req = proto.get(url, function (res) {  
		//console.log('STATUS: ' + res.statusCode);  
		//console.log('HEADERS: ' + JSON.stringify(res.headers));  
		res.setEncoding('utf8');  
		res.on('data', function (chunk) {  
			//console.log('BODY: ' + chunk);
			var json = JSON.parse(chunk);
			callback(true,json);
		});  
	});
	  
	req.on('error', function (e) {  
		logger.error('problem with request: ' + e.message);
		callback(false,e);
	});  
	  
	req.end(); 
};

exports.get = function (host,port,path,data,callback,safe) {
	var content = qs.stringify(data);
	var options = {  
		hostname: host,  
		path: path + '?' + content,  
		method:'GET'
	};
	if(port){
		options.port = port;
	}
	var proto = http;
	if(safe){
		proto = https;
	}
	var req = proto.request(options, function (res) {  
		//console.log('STATUS: ' + res.statusCode);  
		//console.log('HEADERS: ' + JSON.stringify(res.headers));  
		res.setEncoding('utf8');  
		res.on('data', function (chunk) {  
			//console.log('BODY: ' + chunk);
			try{
				var json = JSON.parse(chunk);
				callback(true,json);
			}catch(err){
				logger.error("HTTP PARSE JSON ERROR:",err.stack);
				callback(false,null)
			}
		});  
	});
	  
	req.on('error', function (e) {  
		logger.error('problem with request: ' + e.message);
		callback(false,e);
	});  
	  
	req.end(); 
};

exports.send = function(res,errcode,errmsg,data){
	if(data == null){
		data = {};
	}
	data.errcode = errcode;
	data.errmsg = errmsg;
	var jsonstr = JSON.stringify(data);
	res.send(jsonstr);
};


//http加密方式
exports.crypto_get= function (host,port,path,data,key,client_key,callback,safe){
	if(typeof key !='string'){
		logger.error("HTTP: crypto_get,but no key !.")
		return;
	}
	var reqstr = JSON.stringify(data);
	var encypto_text = secret.aes_encrypt(reqstr,key);
	var new_data = null;
	if(client_key){
		new_data ={
			data:encypto_text,
			key:client_key
		}
	}else{
		new_data ={
			data:encypto_text
		}
	}

	var content = qs.stringify(new_data);  
	var options = {  
		hostname: host,  
		path: path + '?' + content,  
		method:'GET'
	};
	if(port){
		options.port = port;
	}
	var proto = http;
	if(safe){
		proto = https;
	}
	var req = proto.request(options, function (res) {  
		//console.log('STATUS: ' + res.statusCode);  
		//console.log('HEADERS: ' + JSON.stringify(res.headers));  
		res.setEncoding('utf8');  
		res.on('data', function (chunk) {
			try{
			var plat_text  = secret.aes_decrypt(chunk,key);
			var json = JSON.parse(plat_text);
			callback(true,json);
			}catch(err){
				logger.error("CRYPTO_GET:HOST[%s] PORT[%d] PATH[%s] DECRYPTO ERROR.",host,port,path,err.stack);
			}
		});  
	});
	  
	req.on('error', function (e) {  
		//console.log('problem with request: ' + e.message);
		logger.error('problem with request: ' + e.message);
		callback(false,e);
	});  
	  
	req.end(); 
};
//加密方式
exports.crypto_send = function(res,errcode,errmsg,data,key){
	if(typeof key != 'string'){
		logger.error("CRYPTO SEND: No Key !.")
		return;
	}
	if(data == null){
		data = {};
	}
	data.errcode = errcode;
	data.errmsg = errmsg;
	var jsonstr = JSON.stringify(data);
	var encypto_text = secret.aes_encrypt(jsonstr,key);
	res.send(encypto_text);
};