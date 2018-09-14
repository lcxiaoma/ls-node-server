/**
 * 日志点
 * **/

var log_point ={}


///房卡日志点
//消耗 100
log_point.INGOT_COST_OPEN =100;       //开房间消耗
log_point.INGOT_COST_EXCHANGE = 101;  //转换消耗
log_point.INGOT_COST_GIVE = 102;      //赠送消耗
//产出 200
log_point.INGOT_ADD_WEB =200;         //后台产出
log_point.INGOT_ADD_PAY =201;         //内付费产出
log_point.INGOT_ADD_EXCHANGE =202;    //转换产出
log_point.INGOT_ADD_GIVE =203;        //赠送产出
log_point.INGOT_ADD_ROUTE =204;       //转盘产出
log_point.INGOT_ADD_INVITATION =205;  //邀请产出
log_point.INGOT_ADD_MAIL = 206;       //邮件产出点

//钻石日志点
//消耗 300
log_point.GOLD_COST_OPEN =300;       //开房间消耗
log_point.GOLD_COST_EXCHANGE = 301;  //转换消耗
log_point.GOLD_COST_GIVE = 302;      //赠送消耗
//产出 400
log_point.GOLD_ADD_WEB =400;         //后台产出
log_point.GOLD_ADD_PAY =401;         //内付费产出
log_point.GOLD_ADD_EXCHANGE =402;    //转换产出
log_point.GOLD_ADD_GIVE =403;        //赠送产出
log_point.GOLD_ADD_ROUTE =404;       //转盘产出
log_point.GOLD_ADD_INVITATION = 405; //邀请产出
log_point.GOLD_ADD_MAIL = 406;       //邮件产出点


exports.log_point = log_point;