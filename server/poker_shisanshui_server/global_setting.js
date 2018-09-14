/**
 * global settings
 * **/

var global ={}

//申请解散延迟时间
global.DISMISS_TIME = 60000*2;
global.START_PLAY_TIME = 30000;

//大类型
global.SHISSHUI_GAME_TYPE_CLASSIC =1; //经典玩法

//局数人数
global.MASK_PC10 = 1;//10局
global.MASK_PC20 = 2;//20局
//人数
global.PLAYER_3 =3;//3人玩法
global.PLAYER_4 =4;//4人玩

//玩法
global.OPEN_CARD =6; //明牌
global.ALL_OUT =7;   //非明牌

// global.GRAB_BANKER = 6;//抢庄
// global.TURN_BANKER = 7;//轮庄
// global.SHISANSHUI_BANKER = 8;//十三水做庄
// global.MAX_BANKER  = 9;//牌大做庄
// global.OVERLORD_BANKER =10;//霸王庄

//可选游戏玩法
global.NEW_ENTER =11;  //开始后允许新进玩家
global.OPEN_EFFECTS =12; //开牌特效

//游戏类型
global.MASK_INGOT_GAME =19; //房卡游戏
global.MASK_GOLD_GAME =20;  //金币游戏

//game state

global.GAME_STATE_FREE =1;//游戏空闲状态
global.GAME_STATE_PLAYING =2;//游戏进行状态
global.GAME_STATE_CALL_BANKER =3;//叫庄状态
global.GAME_STATE_BANKER_CHOSE =4;//庄家选择牌
global.GAME_STATE_CHOSE =5;//玩家选择状态
global.GAME_STATE_END =6;//游戏结束状态
global.GAME_STATE_OVER =7;//游戏完整结束状态


//player state
global.PLAYER_STATE_FREE =1;//玩家空闲状态
global.PLAYER_STATE_READY =2;//玩家准备状态
global.PLAYER_STATE_PLAY =3;//游戏中
global.PLAYER_STATE_OFFLINE =4;//玩家离线状态

//房间压缩原因
global.ROOM_ACHIVE_DIS =1; //解散
global.ROOM_ACHIVE_OVER =2; //正常结束


//十三水牌类型
global.OUT_TYPE_NONE =1;        //无类型
global.OUT_TYPE_THREE_SAME =2; //三同花         三墩都是同花
global.OUT_TYPE_THREE_SEQ =3;  //三顺子         三墩都是顺子
global.OUT_TYPE_6DOUBLE =4;    //6对半          6对
global.OUT_TYPE_5DOUBLE_THREE =5;   //五对三条  五对+1个三条
global.OUT_TYPE_4THREE =6;          //4套三条   4个三条
global.OUT_TYPE_2HULU_THREE =7;     //双怪冲3   两对葫芦，一个三条
global.OUT_TYPE_ALL_SAME = 8;       //凑一色    全是1个花色
global.OUT_TYPE_ALL_SMALL =9;       //全小      全是2-8
global.OUT_TYPE_ALL_BIG =10;         //全大      全是8-A
global.OUT_TYPE_3BOOM =11;          //三分天下  三个炸弹余一张
global.OUT_TYPE_3SAME_SEQ =12;      //三同花顺  三墩都是同花顺
global.OUT_TYPE_12KING =13;         //12皇族   全是J Q K A
global.OUT_TYPE_A_K= 14;            //一条龙    A,K齐全 不同花
global.OUT_TYPE_KINGKING =15;       //至尊青龙  A,K 齐全 同花

//特殊类型  统计用
global.SHISSHUI_TYPE_SEPCIAL =0;

global.SHISSHUI_TYPE_NONE = 1; //乌龙
global.SHISSHUI_TYPE_DOUBLE =2; //一对
global.SHISSHUI_TYPE_2DOUBLE =3; //两对
global.SHISSHUI_TYPE_THREE =4;  //三条
global.SHISSHUI_TYPE_SEQ =5;    //顺子
global.SHISSHUI_TYPE_SAME=6;    //同花
global.SHISSHUI_TYPE_HULU =7;   //葫芦
global.SHISSHUI_TYPE_BOOM =8;   //炸弹
global.SHISSHUI_TYPE_SAME_SEQ =9; //同花顺


//十三水倍率
global.OUT_TYPE_NONE_VALUE =0;      //无类型

global.OUT_TYPE_THREE_SAME_VALUE =3; //三同花         三墩都是同花
global.OUT_TYPE_THREE_SEQ_VALUE =3;  //三顺子         三墩都是顺子
global.OUT_TYPE_6DOUBLE_VALUE =3;    //6对半          6对

global.OUT_TYPE_5DOUBLE_THREE_VALUE =4;   //五对三条  五对+1个三条
global.OUT_TYPE_4THREE_VALUE =5;          //4套三条   4个三条
global.OUT_TYPE_2HULU_THREE_VALUE =6;     //双怪冲3   两对葫芦，一个三条
global.OUT_TYPE_ALL_SAME_VALUE = 10;       //凑一色    全是1个花色
global.OUT_TYPE_ALL_SMALL_VALUE =12;       //全小      全是2-8
global.OUT_TYPE_ALL_BIG_VALUE =15;         //全大      全是8-A

global.OUT_TYPE_3BOOM_VALUE =16;          //三分天下  三个炸弹余一张
global.OUT_TYPE_3SAME_SEQ_VALUE =18;      //三同花顺  三墩都是同花顺
global.OUT_TYPE_12KING_VALUE =24;         //12皇族   全是J Q K A
global.OUT_TYPE_A_K_VALUE= 26;            //一条龙    A,K齐全 不同花
global.OUT_TYPE_KINGKING_VALUE =52;       //至尊青龙  A,K 齐全 同花

global.SHISSHUI_TYPE_NONE_VALUE = 1; //乌龙
global.SHISSHUI_TYPE_DOUBLE_VALUE =1; //一对
global.SHISSHUI_TYPE_2DOUBLE_VALUE =1; //两对
global.SHISSHUI_TYPE_THREE_VALUE =1;  //三条
global.SHISSHUI_TYPE_SEQ_VALUE =1;    //顺子
global.SHISSHUI_TYPE_SAME_VALUE=1;    //同花
global.SHISSHUI_TYPE_HULU_VALUE =1;   //葫芦
global.SHISSHUI_TYPE_BOOM_VALUE =4;   //炸弹 底墩
global.SHISSHUI_TYPE_SAME_SEQ_VALUE =5; //同花顺

//5同   5张相同的牌  底墩10水   中墩20水


global.OPEN_CARD_HOLDS_BANKER_ONLY =1;//仅仅开庄家的牌
global.OPEN_CARD_HOLDS_USER =2;//玩家开牌
global.OPEN_CARD_FOLDS_BANKER =3;//庄家的folds打开
global.OPEN_CARD_FOLDS_ALL =4;//所有人的牌都展开

//check has rule
global.has_rule = function(rule,mask){
   return (rule & (1<<mask))==0?false:true;
}

//type check
global.type_check = function(type){
    var has =0;
    if(global.has_rule(type,global.SHISSHUI_GAME_TYPE_CLASSIC)){
        has +=1;
    }
    if(has !=1){
        console.log('type index check failed.')
        return false;
    }
    return true;
}
//rule check
global.rule_check = function(rule){
    //play counts check
    var counts_check=0;
    if(global.has_rule(rule,global.MASK_PC10)){
        counts_check +=1;
    }
    if(global.has_rule(rule,global.MASK_PC20)){
        counts_check +=1;
    }
    if(counts_check>1){
        console.log('play counts1 check failed.')
        return false;
    }

    //player count check
    // global.MAX_PLAYER_5 =3;//最多5人
    // global.MAX_PLAYER_8 =4;//最多8人
    // global.UNLIMITED    =5;//不限制人数
    var player_count =0;
    if(global.has_rule(rule,global.PLAYER_4)){
        player_count +=1;
    }
    if(global.has_rule(rule,global.PLAYER_3)){
        player_count +=1;
    }
    if(player_count !=1){
        console.log('player counts check failed.');
        return false;
    }


    // //玩法
    // global.OPEN_CARD =6; //明牌
    // global.ALL_OUT =7;   //非明牌
    //玩法
    // global.GRAB_BANKER = 6;//抢庄
    // global.TURN_BANKER = 7;//轮庄
    // global.OXOX_BANKER = 8;//牛牛做庄
    // global.MAX_BANKER  = 9;//牌大做庄
    // global.OVERLORD_BANKER =10;//霸王庄
    var banker_check =0;
    if(global.has_rule(rule,global.OPEN_CARD)){
        banker_check +=1;
    }
    if(global.has_rule(rule,global.ALL_OUT)){
        banker_check +=1;
    }
    // //斗公牛只保留抢庄和轮庄
    // if(global.has_rule(rule,global.SHISANSHUI_BANKER)){
    //     banker_check +=1;
    // }
    // if(global.has_rule(rule,global.MAX_BANKER)){
    //     banker_check +=1;
    // }
    // if(global.has_rule(rule,global.OVERLORD_BANKER)){
    //     banker_check +=1;
    // }

    if(banker_check !=1){
        console.log('banker check failed');
        return false;
    }

    //check cost type
    var cost_type =0;
    if(global.has_rule(rule,global.MASK_INGOT_GAME)){
        cost_type +=1;
    }
    if(global.has_rule(rule,global.MASK_GOLD_GAME)){
        cost_type +=1;
    }
    if(cost_type !=1){
        console.log("cost type check failed.")
        return false;
    }

    //可选玩法检测
    // global.NEW_ENTER =11;  //开始后允许新进玩家
    // global.OPEN_EFFECTS =12; //开牌特效
    return true;
}

//获取应当扣除的钻石
global.get_ingot_value =function(rule){
    if(global.has_rule(rule,global.MASK_INGOT_GAME)){
        if(global.has_rule(rule,global.MASK_PC10)){
            return 1;
        }
        if(global.has_rule(rule,global.MASK_PC20)){
            return 2;
        }
    }
    
    if(global.has_rule(rule,global.MASK_GOLD_GAME)){
        if(global.has_rule(rule,global.MASK_PC10)){
            return 1;
        }
        if(global.has_rule(rule,global.MASK_PC20)){
            return 2;
        }
    }
}

exports.global = global;