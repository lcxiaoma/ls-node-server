/**
 * web 微信相关的东西
 */
var crypto = require('crypto');
var db = require('../utils/db');
var http = require('../utils/http');
var secret = require('../utils/secret');
var logger = require('./log').log_hall;


//app配置
var web_appinfo ={
    wechat_default:{
		appid:"wx9a626fafe7e866cd",
		secret:"6918d5f52da9d79a0b899e5b4ced6332",
	},
}

var wechat_tickets ={};

var can_service = false;
var last_tick_time =0;
var tick_distance = 5000;


//数据库加载，ticket ,如果过期，重新请求
function load_ticket(callback){
    db.load_ticket(function(result,rows){
        if(result){
            var now = Math.floor(Date.now()/1000);
            for(var i=0;i<rows.length;++i){
                var obj = rows[i];
                if(obj.global_int_value > now + 10 *60){
                    wechat_tickets[obj.global_key] = {
                        token:obj.global_str_value2,
                        ticket:obj.global_str_value,
                        end_time:obj.global_int_value
                    }
                }
            }
            for(var key in web_appinfo){
                var info = wechat_tickets[key];
                if(!info){
                    get_ticket_by_appkey(key,function(ret){
                        if(!ret){
                            logger.error("can not load tick1[%s]",key);
                            callback(false);
                            return;
                        }
                    });
                }
            }
            callback(true);
            return;
        }else{
            //全部重新去请求
            for(var key in web_appinfo){
                get_ticket_by_appkey(key,function(ret){
                    if(!ret){
                        logger.error("can not load tick2[%s]",key);
                        callback(false);
                        return;
                    }
                });
            }
            callback(true);
            return;
        }
    });
}

//用APPKEY 获取 票据信息
function get_ticket_by_appkey(appkey,callback){
    //获取token
    get_token(appkey,function(ret,data){
        //获取票据
        // console.log("GET token data ===>",data)
        if(ret && ((data.errcode && data.errcode ==0) || !data.errcode)){
            var token = data.access_token;
            get_ticket(token,function(ret1,data1){
                // console.log("Get ticket data ===>",data)
                if(ret1 && ((data1.errcode && data1.errcode ==0) || !data1.errcode)){
                    var ticket =data1.ticket;
                    var end_time = Number(data1.expires_in) + Math.floor(Date.now()/1000);
                    wechat_tickets[appkey] ={
                        token:token,
                        ticket:ticket,
                        end_time:end_time,
                    }
                    db.replace_global_setting(appkey,end_time,ticket,token,function(result){})
                    if(callback){
                        callback(true);
                        return;
                    }
                }else{
                    logger.error("Get Ticket Failed.",data1)
                    can_service = false;
                    if(callback){
                        callback(false);
                        return;
                    }
                }
            });
        }else{
            logger.error("Get Token Failed.",data)
            can_service = false;
            if(callback){
                callback(false);
                return;
            }
        }
    });
}

//请求ticket
//https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx9a626fafe7e866cd&secret=6918d5f52da9d79a0b899e5b4ced6332
function get_token(channel,callback){
    var data = {
		appid:web_appinfo[channel].appid,
        secret:web_appinfo[channel].secret,
		grant_type:"client_credential",
	};

	http.get2("https://api.weixin.qq.com/cgi-bin/token",data,callback,true);
}
//获得票据
//https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=xxxxxxxxxxxxxxxxxxxx&type=jsapi
function get_ticket(token,callback){
    var data ={
        access_token:token,
        type:"jsapi",
    }
    
    http.get2("https://api.weixin.qq.com/cgi-bin/ticket/getticket",data,callback,true);
}
//随机生成字符串 account + times

function get_sha1(utf8_str){
    var sha1 = crypto.createHash('sha1');
    sha1.update(utf8_str);
    return sha1.digest('hex');
}

function raw(args) {
  var keys = Object.keys(args);
  keys = keys.sort()
  var newArgs = {};
  keys.forEach(function (key) {
    newArgs[key.toLowerCase()] = args[key];
  });

  var string = '';
  for (var k in newArgs) {
    string += '&' + k + '=' + newArgs[k];
  }
  string = string.substr(1);
  return string;
};

function create_nonce_str(account) {
    var a = crypto.randomBytes(16).toString('hex');
    var b = secret.md5_16(account);
    var c =new Buffer(b+a,'hex');
    return c.toString('base64')
}

//签名工具
function signature(account,arg_url,tick_info,callback){
    var timestamp  = String(Math.floor(Date.now()/1000));
    var noncestr = create_nonce_str(account);
    var jsapi_ticket = tick_info.ticket;

    var data ={
        jsapi_ticket:jsapi_ticket,
        noncestr:noncestr,
        timestamp:timestamp,
        url:arg_url,
    }
    // string1.concat("jsapi_ticket=",jsapi_ticket,"&noncestr=",noncestr,"&timestamp=",timestamp,"&url=",url);
    var string1 = raw(data);
    // console.log("SHOW ME SHA1 BASE STR::",string1)
    var signature_hex= get_sha1(string1);

    var data ={
        seed:noncestr,
        tsp:timestamp,
        signature:signature_hex
    }

    // console.log("signature =====>",data)
    callback(true,data);
}


//检测是否有过期的票据，有就重新加载
function check_and_reget(now){
    for(var a in web_appinfo){
        var tinfo = wechat_tickets[a];
        if(!tinfo){
            get_ticket_by_appkey(a);
        }else{
            if(tinfo.end_time <= now){
                get_ticket_by_appkey(a);
            }
        }
    }
}


//心跳，检测过期的ticket,重新请求
function tick(){
    var now = Date.now();
    if(!last_tick_time){
        last_tick_time = now; 
    }

    if(can_service){
        if(last_tick_time +tick_distance <now){
            //检测是否有票据过期
            check_and_reget(now/1000);
            last_tick_time = now;
        }
    }

    // console.log(wechat_tickets)
    
}

//客户端请求前面
exports.get_wehcat_signature = function(account,url,channel,callback){
    if(!can_service){
        callback(false,null);
        return;
    }

    var tick_info =wechat_tickets[channel];
    if(!tick_info){
        if(Object.keys(web_appinfo).indexOf(channel) == -1){
            callback(false,null);
            return;
        }else{
            get_ticket_by_appkey(channel,function(ret){
                if(ret){
                    tick_info = wechat_tickets[channel];
                    signature(account,url,tick_info,callback);
                    return;
                }else{
                    callback(false);
                    return;
                }
            });
        }
    }else{
        //拥有票据
        signature(account,url,tick_info,callback);
        return;
    }

}

//初始化
exports.init = function(){
    load_ticket(function(result){
        // if(result){
        //     can_service = true;
        // }else{
        //     can_service = false;
        // }
        can_service = true;
    });
}

// setInterval(tick,2000)