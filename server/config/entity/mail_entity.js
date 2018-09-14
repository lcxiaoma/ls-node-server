/**
 * 邮件实体
 * **/
//邮件类型
var mail_type ={
    default:0,//未知邮件类型
    system:1, //系统邮件
}

//邮件标题
var mail_tittle ={
    default:'这是一封来自远方的邮件',
}

//邮件内容
var mail_content ={
    default:'这封邮件包含了一条由远方传来的消息。',
}

//压缩原因
var archive_reson ={
    default:0,
    receive:1,
    overtime:2,
    delete:3
}

var operate_code ={
    delete:0, //删除邮件
    receive:1, //领取邮件物品
    read:2,//读取邮件
}
//邮件状态
var mail_status ={
    unread:0,
    read:1,
    receive:2,
    delete:3,
}
//邮件的

var mail =JSON.stringify(
    {
        mail_id:0,
        user_id:0,
        sender_id:0,
        sender_name:'',
        mail_type:0,
        mail_tittle:'',
        mail_content:'',
        mail_key:'',
        mail_attach:[],
        send_time:0,
        end_time:0,
        status:0,
    }
);

exports.get_mail_obj =function(data){
    var mail_obj = JSON.parse(mail);
    mail_obj.mail_id = data.mail_id
}


exports.get_mail_type = function(key){
    if(mail_type[key]){
        return mail_type[key];
    }
    return mail_type.default;
}

exports.get_mail_tittle = function(key){
    if(mail_tittle[key]){
        return mail_tittle[key];
    }
    return mail_tittle.default;
}

exports.get_mail_content = function(key){
    if(mail_content[key]){
        return mail_content[key];
    }
    return mail_content.default;
}

exports.get_archive_reson = function(key){
    if(archive_reson[key]){
        return archive_reson[key];
    }
    return archive_reson.default;
}