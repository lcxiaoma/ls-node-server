var secret = require('../utils/secret');
var http = require('../utils/http');
var logger = console;
var config = {
    HALL_IP:'192.168.0.152',
    HALL_PORT:'12581'
}

var private_key = null;
var my_key = null;

//和大厅交互生成密钥
function gen_secret(callback){
	var challenge = null;//用于握手验证
	var key_hall = null;
	var blob = secret.dh64_gen_key();
	var public_key = blob.getPublicKey('base64');
	var rd_str = secret.random_b64() + Date.now();
	my_key = secret.md5_16(rd_str);
	http.get(config.HALL_IP,config.HALL_PORT,'/who',{key1:my_key,key2:public_key},function(ret,data){
		if(ret == true){
			if(data.errcode !=0){
				logger.error("WHO:",data.errcode);
				callback(false);
				return;
			}else{
				challenge = data.challenge;
				key_hall = data.key;
				var hall_secret = secret.dh64_secret(blob,key_hall);
				if(hall_secret == null){
					callback(false);
					return;
				}
				var hmac = secret.hmac64(challenge,hall_secret);
				// console.log(hall_secret);
				// console.log(hmac);
				http.get(config.HALL_IP,config.HALL_PORT,'/challenge',{key1:my_key,key2:hmac},function(ret,data){
					if(ret == true){
						if(data.errcode !=0){
							logger.error("CHALLENGE:",data.errcode);
							callback(false);
							return;
						}else{
							//握手成功后服务器下发随机的密钥
							// var encypt=  data.data;
							// var plant = secret.aes_decrypt(encypt,hall_secret);
							// console.log("hall_secret====>",hall_secret);
							// console.log("en ------=========>",data.data);
							// console.log("show me ==========>",plant);
							private_key = hall_secret;
							callback(true);
						}
					}
				})
			}
		}
	});
}

gen_secret(function(result){
    var data = {
        user_id:1,
        ingot:2
    }
    http.crypto_get(config.HALL_IP,config.HALL_PORT,'/test',data,private_key,my_key,function(ret,data){
        if(ret){
            console.log(data);
        }
    });

});