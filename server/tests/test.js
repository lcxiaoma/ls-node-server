var t = new Uint8Array([1,2,3,4,5]);
console.log(t);
console.log(t.buffer);

var son = require('./oop_son');


// son.show_name1();
// son.show_name();


// function remove_from_list(list,item){
//     for(var i=0;i<item.length;++i){
//         list.splice(list.indexOf(item[i]),1);
//     }
// }
// function add_to_list(list,items){
//     for(var i=0;i<items.length;++i){
//         list.push[items[i]];
//     }
//     return list;
// }

// list =[1,2,3,3,3,6,7,8,9,10];

// console.log(list);

// r =[1,3,7,9]

// list =[]

// list = add_to_list(list,r);
// console.log(list);


// var va = [10,10,11,11,12,12];


// function check_sequ(value_list){
//     value_list.sort();
//     var len = value_list.length;
//     for(var i=0;i<len-1;++i){
//         if(value_list[i]==12 || value_list[i]==13 ||value_list[i+1] ==12 ||value_list[i+1] ==13){
//             return false;
//         }
//         if(value_list[i] != value_list[i+1]-1){
//             return false;
//         }
//     }
//     return true;
// }

// function check_more_double(value_list){
//     value_list.sort();
//     var len = value_list.length;
//     var tmp =[];
//     for(var i=0;i<len;){
//         if(value_list[i] != value_list[i+1]){
//             return false;
//         }
//         tmp.push(value_list[i]);
//         i+=2;
//     }
//     console.log(tmp);
//     return check_sequ(tmp);
// }

// console.log(check_more_double(va));

// var aaa =[1,1,1,2,3]
// function check_three_value(value_list){
//     var find = false;
//     var value =0;
//     for(var a in value_list){
//         var count =0;
//         for(var b in value_list){
//             if(value_list[a] ==value_list[b]){
//                 count ++;
//             }
//             if(count ==3){
//                 find = true;
//                 value =value_list[a];
//                 break;
//             }
//         }
//         if(find) break;
//     }
//     return value;
// }


// console.log(aaa.indexOf(444));

// console.log(check_three_value(aaa));

// aaaaa =[12,11,10,8,9]

// aaaaa.sort(function(a,b){return a >b;});


// console.log(aaaaa)
//test cluster


// var cluster = require('cluster');
// var num_cpus = require('os').cpus().length;


// console.log('num of cups =====>',num_cpus)
// if (cluster.isMaster) {
//   //Fork a worker to run the main program
//   for (var i = 0; i < num_cpus; i++) var worker = cluster.fork();
// } else {
//   //Run main program
//   //require('./app.js');
//   console.log('worker is running');
// }

// cluster.on('death', function(worker) {
//   //If the worker died, fork a new worker
//   console.log('worker ' + worker.pid + ' died. restart...');
//   cluster.fork();
// });


// function check_more_three_value(value_list){
//     var three_value =[]
//     for(var a=0;a<value_list.length;++a){
//         var count =0;
//         for(var b=a+1;b<value_list.length;++b){
//             if(value_list[a] == value_list[b]){
//                 count ++;
//             }
//             if(count ==2){
//                 if(three_value.indexOf(value_list[a]) ==-1){
//                     three_value.push(value_list[a]);
//                 }
//             }
//         }
//     }
//     three_value.sort(function(a,b){return a >b;});
//     return three_value;
// }

// value  =[7,8,9,1,10,10,10,11,11,11]

// console.log(check_more_three_value(value))


// var sql = "select uuid ,id, rooms.base_info as room_base_info,rooms.create_time,num_of_turns, next_button,"/
// "user_id0,user_icon0,user_name0,user_score0,"/
// "user_id1,user_icon1,user_name1,user_score1,"/
// "user_id2,user_icon2,user_name2,user_score2,"/
// "user_id3,user_icon3,user_name3,user_score3,"/
// "games_poker.base_info as gamebaseinfo,"/
// "actions,result,statistic,change_info,"/
// "holds,folds "/
// "from rooms,games_poker where id = 918252 and rooms.uuid = games_poker.room_uuid and  rooms.num_of_turns = games_poker.game_index;"

// console.log(sql);

// var aaa={1:11,2:22}

// for(var b in aaa){

//     console.log(b)
//     console.log(aaa[b])
// }

// var crypto = require('../utils/crypto');
// var data= {
//     account:"guest_zy",
//     good_sn:"10001",
//     good_count:1,
//     pay_platform:"IOS"
// };

// //签名
// var crypt_mac =crypto.hmac(JSON.stringify(data));

// console.log(crypt_mac)
// crypt_mac = "HNV25I0EYr3qpRU0pxYCjBOHrt0=?r5mmkbzihXnNiCObckufow==";
// var  str_arr = crypt_mac.split('?');
// console.log(str_arr)

// //解密
// var sign = str_arr[0];
// var token = str_arr[1];

// var check_sign = crypto.checkhmac(JSON.stringify(data),token);

// console.log('check_sign--->',check_sign)
// console.log('mask_sing --->',sign)

var secret = require('../utils/secret');
var http = require('../utils/http');
var logger = console;
var config = {
    HALL_IP:'192.168.0.152',
    HALL_PORT:'12581'
}
// var dh1 = secret.dh64_gen_key();
// var dh2 = secret.dh64_gen_key();

// var s = secret.dh64_secret(dh1,'11');

// console.log(s);

//secret.aes_decrypt('aaaaaaaaaaa',s)

// var rd_str = secret.random_b64();
// var time_str = Date.now();

// console.log(secret.md5_16(rd_str+time_str));

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