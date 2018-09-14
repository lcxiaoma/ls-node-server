/**
 * global settings
 * **/

var global ={}

/**
 * 跑得快游戏类型
 * ***/
//申请解散延迟时间
global.DISMISS_TIME = 60000*2;

//经典类型
global.GAME_TYPE_CLASSIC =1; // A 222 Kingking
//15张牌类型
global.GAME_TYPE_15 =2; //45cards  AAA 222 K Kingking
//癞子类型
global.GAME_TYPE_CHANGE = 3;
//4个玩家类型
global.GAME_TYPE_FOUR_PLAY = 4;

/**
 * 三打哈游戏类型
 * ***/
global.SANDAHA_GAME_TYPE_CLASSIC = 1;



/**
 * 具体规则
 * **/
//局数人数
global.MASK_PC10 = 1;
global.MASK_PC20 = 2;

//玩家人数
global.MASK_PLE3 = 3;
global.MASK_PLE2 = 4;
global.MASK_PLE4 = 5;

//是否显示已打的牌
global.MASK_SHOW = 6;

//是否黑桃3为首出
global.MASK_FIRST = 7;

//是否有大必管
global.MASK_PLAY = 8;

//是否扎鸟(红桃10)
global.MASK_BIRD = 9;

//牌的数量
global.MASK_CN_15 = 10;
global.MASK_CN_16 = 11;
global.MASK_CN_P1 = 12;
global.MASK_CN_P2 = 13;


global.BLACK_THREE_HEART =3;
global.KING_VALUE = 13;

//out card
global.SINGLE =1;//单
global.DOUBLE =2;//对
global.MORE_DOUBLE =3;//连对

//游戏模式选择
global.MASK_INGOT_GAME =19; //房卡游戏
global.MASK_GOLD_GAME =20; //金币游戏

//game state
global.GAME_STATE_FREE =1;//游戏空闲状态
global.GAME_STATE_CALL_BANKER =2;//叫庄阶段
global.GAME_STATE_DECIDE_COLOR=3;//定主花色阶段
global.GAME_STATE_BURY_CARD=4;//埋牌阶段
global.GAME_STATE_PLAYING =5;//游戏进行状态
global.GAME_STATE_END =6;//游戏结束状态
global.GAME_STATE_OVER =7;//游戏完整结束状态


//player state
global.PLAYER_STATE_FREE =1;//玩家空闲状态
global.PLAYER_STATE_READY =2;//玩家准备状态
global.PLAYER_STATE_PLAY =3;//游戏中
global.PLAYER_STATE_OFFLINE =4;//玩家离线状态


//三打哈赢家
global.BANKER_WIN =1;
global.OTHER_WIN =2;

//三打哈基础分
global.SANDAHA_BASE_SCORE =3;

//房间压缩原因
global.ROOM_ACHIVE_DIS =1; //解散
global.ROOM_ACHIVE_OVER =2; //正常结束

//输赢状态
global.DA_GUANG = 1;//大光
global.XIAO_GUANG = 2;//小光
global.NORMAL = 3;//正常
global.DA_DAO = 4;//大倒
global.XIAO_DAO = 5;//小倒
global.PASS_BOTTON = 6;//垮庄


//check has rule
global.has_rule = function(rule,mask){
   return (rule & (1<<mask))==0?false:true;
}

//type check
global.type_check = function(type){
    var has =0;
    if(global.has_rule(type,global.GAME_TYPE_CLASSIC)){
        has +=1;
    }
    if(global.has_rule(type,global.GAME_TYPE_15)){
        has +=1;
    }
    if(global.has_rule(type,global.GAME_TYPE_CHANGE)){
        has+=1;
    }
    if(global.has_rule(type,global.GAME_TYPE_FOUR_PLAY)){
        has+=1;
    }
    return has==1 ? true:false;
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
    if(counts_check!=1){
        return false;
    }
    //player check
    var player_check =0;
    if(global.has_rule(rule,global.MASK_PLE2)){
        player_check +=1;
    }
    if(global.has_rule(rule,global.MASK_PLE3)){
        player_check +=1;
    }
    if(global.has_rule(rule,global.MASK_PLE4)){
        player_check +=1;
    }
    if(player_check !=1){
        console.log("player check failed");
        return false;
    }
    //function do not need check
    //first do not need check
    //card num check
    var card_num_check =0;
    if(global.has_rule(rule,global.MASK_CN_15)){
        card_num_check +=1;
    }
    if(global.has_rule(rule,global.MASK_CN_16)){
        card_num_check +=1;
    }
    if(global.has_rule(rule,global.MASK_CN_P1)){
        card_num_check +=1;
    }
    if(global.has_rule(rule,global.MASK_CN_P2)){
        card_num_check+=1;
    }
    if(card_num_check !=1){
        console.log("card check failed");
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

    return true;
}

global.sandaha_type_check = function(type){
    var has =0;
    if(global.has_rule(type,global.SANDAHA_GAME_TYPE_CLASSIC)){
        has +=1;
    }
    return has ==1? true:false;
}

global.sandaha_rule_check = function(rule){
    //局数
    var play_count =0;
    if(global.has_rule(rule,global.MASK_PC10)){
        play_count +=1;
    }
    if(global.has_rule(rule,global.MASK_PC20)){
        play_count +=1;
    }
    if(play_count != 1){
        console.log("play count check failed!.")
        return false;
    }

    //牌数量
    var card_num=0;
    if(global.has_rule(rule,global.MASK_CN_P1)){
        card_num +=1;
    }
    if(global.has_rule(rule,global.MASK_CN_P2)){
        card_num +=1;
    }
    if(card_num!=1){
        console.log("card num check failed!.")
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