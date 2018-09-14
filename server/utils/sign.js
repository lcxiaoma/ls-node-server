/**
 * 用于通讯签名
 */
var secret = require('./secret')

//生成Sign
exports.make_sign = function (data) {
    var sign_string = make_sign_string(data);
	var sign = encrypt_sign_string(sign_string);
	data.sign = sign;
}

//验证Sign
exports.check_sign = function (data) {
	var sign = data.sign;
	var sign_string = make_sign_string(data);
    var make_sign = encrypt_sign_string(sign_string);
    return sign == make_sign
}

//加密
function encrypt_sign_string(sign_string){
	var length = sign_string.length;
	var code_string = "";
    for(var i=0;i<length;++i){
        code_string += String.fromCharCode(sign_string.charCodeAt(i) ^ (i%256));
    }
	return secret.md5_16(code_string);
}

//生成签名字符串
function make_sign_string(args) {
    var keys = Object.keys(args);
    keys = keys.sort();
    var length = keys.length;
    var sign_string = '';
     for(var i=0;i<length;i++){ 
        var key = keys[i];
        //如果数据中包含sign,则不能加入
        if (key.toUpperCase() != "SIGN") {
            var value = args[key];
            var type = key.toUpperCase();
            if(typeof value == 'object'){
                sign_string += '&' + type + '?' + JSON.stringify(value);
            }else{
                sign_string += '&' + type + '?' + value;
            }
        }
    }
    return sign_string.substr(1);
}