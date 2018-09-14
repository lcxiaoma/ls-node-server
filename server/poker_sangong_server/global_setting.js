/**
 * global settings
 * **/

var global ={}

//申请解散延迟时间
global.DISMISS_TIME = 60000*2;
global.START_PLAY_TIME = 30000;

//大类型
global.SANGONG_GAME_TYPE_CLASSIC =1; //经典玩法

//局数人数
global.MASK_PC10 = 1;//10局
global.MASK_PC20 = 2;//20局
global.ONE_CIRCLE_BANKER =1;//一圈庄
global.TWO_CIRCLE_BANKER =2;//两圈庄
//人数
global.MAX_PLAYER_5 =3;//最多5人
global.MAX_PLAYER_8 =4;//最多8人
global.UNLIMITED    =5;//不限制人数
//玩法
global.GRAB_BANKER = 6;//抢庄
global.TURN_BANKER = 7;//轮庄
global.SANGONG_BANKER = 8;//三公做庄
global.MAX_BANKER  = 9;//牌大做庄
global.OVERLORD_BANKER =10;//霸王庄

//可选游戏玩法
global.NEW_ENTER =11;  //开始后允许新进玩家
global.OPEN_EFFECTS =12; //开牌特效
global.OPNE_CARD_NUM_TWO =13; //先开2张牌
//global.OPNE_CARD_NUM_FOUR =14; //先开4张牌

//游戏类型
global.MASK_INGOT_GAME =19; //房卡游戏
global.MASK_GOLD_GAME =20;  //金币游戏

//game state

global.GAME_STATE_FREE =1;//游戏空闲状态
global.GAME_STATE_PLAYING =2;//游戏进行状态
global.GAME_STATE_CALL_BANKER =3;//叫庄状态
global.GAME_STATE_BETTING =4;//下注状态
global.GAME_STATE_END =5;//游戏结束状态
global.GAME_STATE_OVER =6;//游戏完整结束状态
global.GAME_STATE_BANKER_BASE =7;//斗公牛庄家选择基础分阶段


//player state
global.PLAYER_STATE_FREE =1;//玩家空闲状态
global.PLAYER_STATE_READY =2;//玩家准备状态
global.PLAYER_STATE_PLAY =3;//游戏中
global.PLAYER_STATE_OFFLINE =4;//玩家离线状态

//房间压缩原因
global.ROOM_ACHIVE_DIS =1; //解散
global.ROOM_ACHIVE_OVER =2; //正常结束


//ox牌类型
global.SANGONG_NONE = 1; //散点
global.SANGONG_HUN_SAN = 2;//混三公
global.SANGONG_XIAO_SAN = 3;//小三公
global.SANGONG_DA_SAN = 4;//大三公

//倍率
global.SANGONG_NONE_VALUE = 1; //散点 1倍 （8为2倍 9为3倍）
global.SANGONG_HUN_SAN_VALUE = 4;
global.SANGONG_XIAO_SAN_VALUE = 5;
global.SANGONG_DA_SAN_VALUE = 6;

//三公最大的可压筹码
global.SANGONG_SCORE_MAX = 10;
//基础分
global.SANGONG_BASE_SCORE =1;


//check has rule
global.has_rule = function(rule,mask){
   return (rule & (1<<mask))==0?false:true;
}

//type check
global.type_check = function(type){
    var has =0;
    if(global.has_rule(type,global.SANGONG_GAME_TYPE_CLASSIC)){
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
    if(global.has_rule(rule,global.MAX_PLAYER_5)){
        player_count +=1;
    }
    if(global.has_rule(rule,global.MAX_PLAYER_8)){
        player_count +=1;
    }
    if(global.has_rule(rule,global.UNLIMITED)){
        player_count +=1;
    }
    if(player_count !=1){
        console.log('player counts check failed.');
        return false;
    }

    //玩法
    var banker_check =0;
    if(global.has_rule(rule,global.GRAB_BANKER)){
        banker_check +=1;
    }
    if(global.has_rule(rule,global.TURN_BANKER)){
        banker_check +=1;
    }
    //斗公牛只保留抢庄和轮庄
    if(global.has_rule(rule,global.SANGONG_BANKER)){
        banker_check +=1;
    }
    if(global.has_rule(rule,global.MAX_BANKER)){
        banker_check +=1;
    }
    if(global.has_rule(rule,global.OVERLORD_BANKER)){
        banker_check +=1;
    }

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
    // global.OPNE_CARD_NUM_THREE =13; //先开3张牌
    // global.OPNE_CARD_NUM_FOUR =14; //先开4张牌
    var choice_count=0
    if(global.has_rule(rule,global.OPNE_CARD_NUM_THREE)){
        choice_count +=1;
    }
    if(global.has_rule(rule,global.OPNE_CARD_NUM_FOUR)){
        choice_count +=1;
    }
    if(choice_count >1){
        console.log('choice check failed.')
        return false;
    }
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