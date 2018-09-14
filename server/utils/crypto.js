var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

exports.md5 = function (content) {
	var md5 = crypto.createHash('md5');
	md5.update(new Buffer(content));
	return md5.digest('hex');	
}

exports.toBase64 = function(content){
	return new Buffer(content).toString('base64');
}

exports.fromBase64 = function(content){
	return new Buffer(content, 'base64').toString();
}

exports.enCrypt = function(algorithm,content){
	var filename =path.normalize(__filename+'/../private.key');
	var key = fs.readFileSync(filename).toString('ascii');
	var crypt = crypto.createCipher(algorithm,key);
	var crypted =crypt.update(content,'utf8','hex');
	crypted += crypt.final('hex');
	return crypted;
}

exports.deCrypt = function(algorithm,content){
	var filename =path.normalize(__filename+'/../private.key');
	var key = fs.readFileSync(filename).toString('ascii');
	var decrypt = crypto.createDecipher(algorithm,key);
	var decrypted = decrypt.update(content,'hex','utf8');
	decrypted += decrypt.final('utf8');
	return decrypted;
}

exports.hmac = function(content){
	var token = crypto.randomBytes(16).toString('hex');
	var token_str =new Buffer(token,'hex').toString('base64');
	var signtrue = crypto.createHmac('sha1',token);
	signtrue.update(new Buffer(content));
	var crypt = signtrue.digest().toString('base64');
	crypt += '?';
	crypt += token_str;
	return crypt;
}

exports.checkhmac = function(content,token){
	var token_hex = new Buffer(token,'base64').toString('hex');
	var signtrue = crypto.createHmac('sha1',token_hex);
	signtrue.update(new Buffer(content));
	var crypt = signtrue.digest().toString('base64');
	return crypt;
}