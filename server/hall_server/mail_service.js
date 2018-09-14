/**
 * 邮件补偿服务
 * **/

var db = require('../utils/db');
var logger = require('./log.js').log_hall;
const error = require('../config/error').error;
var mail_entity = require('../config/entity/mail_entity');
var log_manager = require('../common/log_manager');
var log_point = require('../config/log_point').log_point;

//玩家邮件缓存
//格式 {user_account:{mails:{page:mail},over_time:0}}
var user_mail_cache ={}

//获取用户邮件
exports.get_user_mail = function(user_account,page,callback){
    var data = {
        user_account:user_account,
        page:page
    }
    //如果有缓存先从缓存读取
    //console.log(user_mail_cache)
    if(user_mail_cache[user_account]){
        if(user_mail_cache[user_account][[page]])
        var over_time =user_mail_cache[user_account][page][0];
        var now = Math.floor(Date.now()/1000);
        if(now <over_time){
            var mail_info = user_mail_cache[user_account][page][1];
            if(mail_info){
                callback(error.SUCCESS,mail_info);
                //console.log("not db")
                return;
            }
        }
    }
    //console.log(data)
    db.get_user_mail(data,function(err,rows,fields){
        if(err){
            logger.error(err.stack);
            callback(error.MAIL_ERROR_UNDEFINED,null);
            return;
        }
        var result = rows[0][0].result
        if( result== 1){
            //成功获取
            var ret_data = {};
            ret_data.all_counts = rows[0][0].all_counts;
            ret_data.begin_index =rows[0][0].begin_index;
            ret_data.page =rows[0][0].page;
            ret_data.mails =[];
            //console.log(rows)
            var mail_data = rows[1];
            var len = mail_data.length;

            for(var i=0;i<len;++i){
               ret_data.mails.push(mail_data[i])
            }
            //1分钟过期
            var over_time = Math.floor(Date.now()/1000) +1*60;
            if(!user_mail_cache[user_account]){
                user_mail_cache[user_account] ={};
            }
            user_mail_cache[user_account][page] =[over_time,ret_data];
            

            callback(error.SUCCESS,ret_data);
            return;
        }else if(result ==-1){
            //玩家不纯在
            callback(error.USER_NOT_FOUND,null);
            return;
        }else if(result == -2){
            //没有更多的记录
            callback(error.MAIL_ERROR_NOT_MORE,null);
            return;
        }
        callback(error.MAIL_ERROR_DATA_FAILED,null);
        return;
    });
}

//用户操作邮件
exports.user_operate_mail = function(user_account,operate_code,mail_id,callback){
    var data = {
        account:user_account,
        user_id:0,
        mail_id:mail_id,
        operate_code:operate_code,
    }
    
    if(operate_code == 0){
        //删除邮件
        data.archive_reason=mail_entity.get_archive_reson('delete');
        //console.log("detel====>",data)
        db.del_user_mail(data,function(err,rows,fields){
            if(err){
                logger.error(err.stack);
                callback(error.MAIL_ERROR_UNDEFINED);
                return;
            }
            //console.log(rows)
            if(rows[0][0].result == 1){
                callback(error.SUCCESS);
                user_mail_cache[user_account] = null;
                return;
            }
            callback(error.MAIL_ERROR_OPERATE_UNKONW);
            return;
        });
    }else if(operate_code ==2){
        //读取邮件
        data.status = 1;
        //console.log("update ======>",data)
        db.update_mail_status(data,function(err,rows,fields){
            if(err){
                logger.error(err.stack);
                callback(error.MAIL_ERROR_UNDEFINED);
                return;
            }
            //console.log(rows)
            if(rows[0][0].result == 1){
                callback(error.SUCCESS);
                user_mail_cache[user_account] = null;
                return;
            }
            callback(error.MAIL_ERROR_OPERATE_UNKONW);
            return;
        });
    }else if(operate_code == 1){
        //领取邮件奖励
        db.check_mail_award(data,function(err,rows,fields){
            if(err){
                logger.error("CHECK MAIL AWARD ERROR:",err.stack);
                callback(error.MAIL_ERROR_RECIVE_FAILD);
                return;
            }
            // console.log(rows);
            if(rows[1][0].result ==1){
                var mail_data = rows[0][0];
                var mail_atach = mail_data.mail_attach;
                if(!mail_atach || mail_atach == ''){
                    callback(error.FAILED);
                    return;
                }
                var award_obj = JSON.parse(mail_atach);

                var ingot = award_obj["ingot"];
                var gold = award_obj["gold"];

                if(!ingot && !gold){
                    callback(error.FAILED);
                    return;
                }

                //领取成功后删除邮件
                data.archive_reason=mail_entity.get_archive_reson('receive');
                //console.log("detel====>",data)
                db.del_user_mail(data,function(err,rows,fields){
                    if(err){
                        logger.error("get mail attach log error:",err.stack);
                        callback(error.MAIL_ERROR_UNDEFINED);
                        return;
                    }
                    //console.log(rows)
                    if(rows[0][0].result == 1){
                        // callback(error.SUCCESS);
                        user_mail_cache[user_account] = null;
                        if(ingot){
                            db.add_ingot(mail_data.user_id,ingot,function(ret){
                                if(ret){
                                    var now_ingot = ret[0].gems
                                    if(now_ingot){
                                        log_manager.insert_ingot_log(mail_data.user_id,0,mail_data.user_id,log_point.INGOT_ADD_MAIL,ingot,now_ingot);
                                    }
                                }
                            });
                        }

                        if(gold){
                            db.add_gold(mail_data.user_id,gold,function(ret){
                                if(ret){
                                    var now_gold = ret[0].coins
                                    var now_gold = ret[0].coins
                                    if(now_gold){
                                        log_manager.insert_gold_log(mail_data.user_id,0,mail_data.user_id,log_point.GOLD_ADD_MAIL,gold,now_gold);
                                    }
                                }
                            });
                        }
                        callback(error.SUCCESS,award_obj);
                        return;
                    }else{
                        callback(error.MAIL_ERROR_OPERATE_UNKONW);
                        return;
                    }
                });
            }else{     
                callback(error.MAIL_ERROR_OPERATE_UNKONW);
                return;
            }
        });
    }
}

//插入系统邮件
exports.insert_sys_mail = function(account,user_id,mail_tittle,mail_content,mail_key,mail_atach){
    var data ={
        account:account,
        user_id:user_id,
        sender_id:0,
        sender_name:'system',
        mail_type:mail_entity.get_mail_type('system'),
        mail_tittle:mail_tittle.toString('utf8'),
        mail_content:mail_content.toString('utf8'),
        mail_key:mail_key,
        mail_attach:mail_atach,
        end_time:30*1*24*3600,//系统邮件30天过期时间
    }
    db.add_user_mail(data,function(err,rows,fields){
        if(err){
            logger.error("insert sys mail error:",err.stack);
            logger.error("insert data ===>",data)
            return;
        }
    });
}