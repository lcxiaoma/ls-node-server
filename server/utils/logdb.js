var mysql=require("mysql");  
var crypto = require('./crypto');

var pool = null;
var logger = null;

function nop(a,b,c,d,e,f,g){

}

//普通查询调用接口
function query(sql,args,callback){  
    pool.getConnection(function(err,conn){  
        if(err){  
            callback(err,null,null);  
        }else{  
            conn.query(sql,args,function(qerr,vals,fields){  
                //释放连接  
                conn.release();  
                //事件驱动回调  
                callback(qerr,vals,fields);  
            });  
        }  
    });  
};


function query2(sql,callback){  
    pool.getConnection(function(err,conn){  
        if(err){  
            callback(err,null,null);  
        }else{  
            conn.query(sql,function(qerr,vals,fields){  
                //释放连接  
                conn.release();  
                //事件驱动回调  
                callback(qerr,vals,fields);  
            });  
        }  
    });  
};
//存储过程调用接口
function call_proc(proc,args,callback){
    var sql = 'call '+proc+'(';
    for(var a in args){
        if(a == args.length-1){
            sql += '?';
        }else{
            sql += '?,';
        }
    }
    sql += ');';

    pool.getConnection(function(err,conn){
        if(err){
            callback(err,null,null);
        }else{
            conn.query(sql,args,function(qerr,vals,fields){
                conn.release();
                callback(qerr,vals,fields);
            });
        }
    });
}

exports.init = function(config,log){
    //check USER PASSWORD
    var uname =crypto.deCrypt('aes-256-cbc',config.USER);
    var upass =crypto.deCrypt('aes-256-cbc',config.PSWD);
    pool = mysql.createPool({  
        host: config.HOST,
        user: uname,//config.USER,
        password: upass,//config.PSWD,
        // user: config.USER,
        // password: config.PSWD,
        database: config.DB,
        port: config.PORT,
    });
    logger =log;
};

/////////////////////////////////插入日志////////////////////////////
exports.insert_ingot_log = function(user_id,from,to,event_type,value,then_value){
    logger.debug("insert ingot log")
    var sql = 'insert into ingot_log(user_id,event_type,`from`,`to`,change_value,now_value,last_insert_time) values({0},{1},{2},{3},{4},{5},unix_timestamp(now()))';
    sql = sql.format(user_id,event_type,from,to,value,then_value);
    // console.log(sql)
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("INSERT INGOT LOG:",err.stack);
        }
    });
}

exports.insert_gold_log = function(user_id,from,to,event_type,value,then_value){
    logger.debug("insert gold log")
    var sql = 'insert into gold_log(user_id,event_type,`from`,`to`,change_value,now_value,last_insert_time) values({0},{1},{2},{3},{4},{5},unix_timestamp(now()))';
    sql = sql.format(user_id,event_type,from,to,value,then_value);
    // console.log(sql)
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("INSERT GOLD LOG:",err.stack);
        }
    });
}

exports.insert_route_log = function(ret){
    //console.log(ret)
    var sql = 'insert into route_log (route_user_id,route_time,hit_index,hit_value,route_value,gift_mask,award_state) values({0},{1},{2},{3},{4},"{5}",{6})';
    var award_state =0;
    if(ret.send){
        award_state = 1;
    }
    sql = sql.format(ret.user_id,ret.action_time,ret.hit_index,ret.random_ood,0,ret.mask,award_state);
    // console.log(sql);
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("INSERT GOLD LOG:",err.stack);
        }
    });
}

exports.login_log = function(user_id,platform,channel,reg_time){
    var sql = 'insert into login_log(user_id,platform,channel,reg_time,login_time,last_insert_time) values({0},"{1}","{2}",{3},unix_timestamp(now()),unix_timestamp(now()))';
    sql = sql.format(user_id,platform,channel,reg_time);
    // console.log(sql);
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("INSERT LOGIN LOG:",err.stack);
        }
    });
}

exports.reg_log = function(user_id,platform,channel,reg_time){
    var sql = 'insert into reg_log(user_id,platform,channel,reg_time,login_time,last_insert_time) values({0},"{1}","{2}",{3},unix_timestamp(now()),unix_timestamp(now()))';
    sql = sql.format(user_id,platform,channel,reg_time);
    // console.log(sql);
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("INSERT REG LOG:",err.stack);
        }
    });
}

//创建房间日志
exports.insert_create_room_log = function(user_id,game_type,type_index,rule_index,room_id){
    var sql = 'insert into create_room_log(user_id,game_type,type_index,rule_index,create_time,roomid,last_insert_time) values({0},{1},{2},{3},unix_timestamp(now()),{4},unix_timestamp(now()))';
    sql = sql.format(user_id,game_type,type_index,rule_index,room_id);
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("INSERT CREATE ROOM LOG:",err.stack);
        }
    });
}


/////////////////////提取日志///////////////////////////////////////
//获取转盘记录
exports.get_route_log = function(user_id,callback){
    var sql = 'select route_time,hit_index,gift_mask,award_state from route_log where route_user_id ={0} ORDER BY award_state asc,route_time desc LIMIT 10;'
    sql = sql.format(user_id);
    query2(sql,function(err,rows,fields){
        if(err){
            logger.error("GET ROUTE LOG ERROR:",err.stack);
            callback(false);
            return;
        }
        callback(rows);
    })
}