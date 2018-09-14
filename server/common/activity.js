/**
 * 活动信息
 */

//活动类型
exports.activty_type ={
    ENTER_TYPE_FREE:1, //免费入场
    DOUBLE_PLAY_TIME:2,//创建房间可以获得的局数加倍

}
//活动配置
var activity_config={
    1:{
        20001:{
            begin_time:'2017-06-28 00:00:00',
            end_time:'2017-06-29 00:00:00',
        },
        20010:{
            begin_time:'2017-07-06 00:00:00',
            end_time:'2017-07-06 23:00:00', 
        }
    },//列表中的服务器将获得免费入场
    2:{
        20002:{
            begin_time:'2017-06-28 00:00:00',
            end_time:'2017-06-29 00:00:00',
        }
    }//列表中的服务器将获取双倍局数
}

function convert(){
    for(var t in activity_config){
        var tmp = activity_config[t];
        for(var tt in tmp){
            var obj = tmp[tt];
            obj.begin_time = new Date(obj.begin_time).getTime();
            obj.end_time = new Date(obj.end_time).getTime();
        }
    }
}

convert();

//获取活动信息
exports.check_activity = function(activity_type,server_type){

    var info = activity_config[activity_type][server_type]
    if(!info){
        return false;
    }
    var now = Date.now();
    if(info.begin_time >now){
        return false;
    }
    if(info.end_time < now){
        return false;
    }
    return true;
}