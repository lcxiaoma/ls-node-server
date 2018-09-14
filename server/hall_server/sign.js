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
	return sign == make_sign;
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
	var newArgs = {};
	keys.forEach(function (key) {
		//如果数据中包含sign,则不能加入
		if (key.toUpperCase() != "SIGN") {
			var value = args[key];
			var prototype = Object.prototype.toString.call(value);
			if (prototype == "[object Object]") {
				newArgs[key.toUpperCase()] = "{" + make_sign_string(value) + "}";
			}
			else if (prototype == "[object Array]") {
				var temp_string = "[";
				var length = value.length;
				for (var i = 0; i < length; ++i) {
					var temp_prototype = Object.prototype.toString.call(value[i]);
					if (temp_prototype == "[object Object]") {
						temp_string += "{" + make_sign_string(value[i]) + "}";
					} else {
						temp_string += value[i];
					}
					if (i != length - 1) {
						temp_string += ",";
					}
				}
				temp_string += "]";
				newArgs[key.toUpperCase()] = temp_string;
			} else {
				newArgs[key.toUpperCase()] = value;
			}
		}
	});

	var sign_string = '';
	var index = 0;
	for (var k in newArgs) {
		if (index == 0) {
			sign_string += k + '=' + newArgs[k];
		} else {
			sign_string += '&' + k + '=' + newArgs[k];
		}
		index++;
	}
	return sign_string;
}