var bicrypto = require('crypto');
var crypto = require("../utils/crypto");
var tokens = {};
var users = {};

var tokens_gen_key = bicrypto.randomBytes(256);

exports.createToken = function(userId,lifeTime){
	var token = users[userId];
	if(token != null){
		var now = Date.now();
		if(token.time + lifeTime >now){
			return token;
		}else{
			delete tokens.token;
		}
	}

	var time = Date.now();
	token = String(crypto.md5(userId + tokens_gen_key + time));
	tokens[token] = {
		userId: userId,
		time: time,
		lifeTime: lifeTime
	};
	users[userId] = token;
	return token;
};

exports.getToken = function(userId){
	return users[userId];
};

exports.getUserID = function(token){
	return tokens[token].userId;
};

exports.isTokenValid = function(token){
	var cluster = require('cluster');
	var info = tokens[token];
	if(info == null){
		return false;
	}
	if(info.time + info.lifetime < Date.now()){
		return false;
	}
	return true;
};

exports.delToken = function(token){
	var info = tokens[token];
	if(info != null){
		//tokens[token] = null;
		delete tokens[token];
		users[info.userId] = null;
	}
};