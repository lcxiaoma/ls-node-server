/**
 * global settings
 * **/

var global ={}

//申请解散延迟时间
global.DISMISS_TIME = 60000*2;
global.START_PLAY_TIME = 30000;

//大类型
global.TAXAS_GAME_TYPE_CLASSIC =1; //经典玩法

//局数人数
global.MASK_PC10 = 1;//10局
global.MASK_PC20 = 2;//20局

//人数
global.MAX_PLAYER_5 =3;//最多5人
global.MAX_PLAYER_8 =4;//最多8人
global.UNLIMITED    =5;//不限制人数
//玩法,下注限制
// global.LIMIT_SCORE =6;//有限注
// global.UNLIMIT_SCORE =7;//无限注
// global.POT_LIMIT_SCORE =8;//地池限额

//可选游戏玩法
global.NEW_ENTER =11;  //开始后允许新进玩家
global.OPEN_EFFECTS =12; //开牌特效

//底分
global.BASE_SCORE_1 =13; //1000分
global.BASE_SCORE_2 =14; //2000分
global.BASE_SCORE_3 =15; //3000分

//game state

global.GAME_STATE_FREE =1;//游戏空闲状态
global.GAME_STATE_PLAYING =2;//游戏进行状态
global.GAME_STATE_CALL_BANKER =3;//叫庄状态
global.GAME_STATE_BETTING =4;//下注状态
global.GAME_STATE_END =5;//游戏结束状态
global.GAME_STATE_OVER =6;//游戏完整结束状态


//player state
global.PLAYER_STATE_FREE =1;//玩家空闲状态
global.PLAYER_STATE_READY =2;//玩家准备状态
global.PLAYER_STATE_PLAY =3;//游戏中
global.PLAYER_STATE_OFFLINE =4;//玩家离线状态

//房间压缩原因
global.ROOM_ACHIVE_DIS =1; //解散
global.ROOM_ACHIVE_OVER =2; //正常结束


//德州扑克牌型
global.TAXAS_TYPE_NONE =1;//高牌
global.TAXAS_TYPE_DOUBLE =2;//对子
global.TAXAS_TYPE_2DOUBLE =3;//两对
global.TAXAS_TYPE_THREE =4;//三个
global.TAXAS_TYPE_SEQ = 5;//顺子
global.TAXAS_TYPE_SAME_COLOR = 6;//同花
global.TAXAS_TYPE_THREED =7;//葫芦
global.TAXAS_TYPE_FOUR = 8;//4个
global.TAXAS_TYPE_SAME_COLOR_SEQ =9;//同花顺
global.TAXAS_TYPE_KING_SAME_COLOR_SEQ =10;//皇家同花顺


//德州扑克A的值
global.TAXAS_POKER_A_VALUE =13;


global.TAXAS_BASE_SCORE =10;
global.TAXAS_MAX_SCORE =20;

//check has rule
global.has_rule = function(rule,mask){
   return (rule & (1<<mask))==0?false:true;
}

//type check
global.type_check = function(type){
    var has =0;
    if(global.has_rule(type,global.TAXAS_GAME_TYPE_CLASSIC)){
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
    if(player_count !=1){
        console.log('player counts check failed.');
        return false;
    }

    // //玩法
    // var bet_check =0;
    // if(global.has_rule(rule,global.LIMIT_SCORE)){
    //     bet_check +=1;
    // }
    // if(global.has_rule(rule,global.UNLIMIT_SCORE)){
    //     bet_check +=1;
    // }
    // if(global.has_rule(rule,global.POT_LIMIT_SCORE))
    // if(bet_check !=1){
    //     console.log('bet score check failed');
    //     return false;
    // }

    //基础分选择
    var base_score_check =0;
    if(global.has_rule(rule,global.BASE_SCORE_1)){
        base_score_check +=1;
    }
    if(global.has_rule(rule,global.BASE_SCORE_2)){
        base_score_check +=1;
    }
    if(global.has_rule(rule,global.BASE_SCORE_3)){
        base_score_check +=1;
    }
    if(base_score_check !=1){
        console.log('base score check failed.');
        return false;
    }
    //可选玩法检测
    return true;
}

//获取应当扣除的钻石
global.get_ingot_value =function(rule){
    if(global.has_rule(rule,global.MASK_PC10)){
        return 1;
    }
    if(global.has_rule(rule,global.MASK_PC20)){
        return 2;
    }
}

exports.global = global;