/**
 * 游戏全局设置
 */
var global = {
	// 申请解散延迟时间

	DISMISS_TIME: 60000 * 2,
	START_PLAY_TIME: 30000,

	// 局数人数

	MASK_PC10: 1,                 // 10局
	MASK_PC20: 2,                 // 20局
	ONE_CIRCLE_BANKER: 1,         // 一圈庄
	TWO_CIRCLE_BANKER: 2,         // 两圈庄
	MAX_PLAYER_5: 3,
	MAX_PLAYER_8: 4,              // 最多8人
	UNLIMITED: 5,

	// 大类型

	POINT105_CLASSIC: 1,       // 经典玩法


	GRAB_BANKER: 6,         // 抢庄
	TURN_BANKER: 7,         // 轮庄
	OVERLORD_BANKER: 10,    // 霸王庄

	// 可选游戏玩法

	NEW_ENTER: 11,            // 开始后允许新进玩家
	OPEN_EFFECTS: 12,         // 开牌特效

	// 游戏类型

	MASK_INGOT_GAME: 19, // 房卡游戏
	MASK_GOLD_GAME: 20,  // 金币游戏

	// 游戏状态

	GAME_STATE_FREE: 1,         // 游戏空闲状态
	GAME_STATE_PLAYING: 2,      // 游戏进行状态
	GAME_STATE_CALL_BANKER: 3,  // 叫庄状态
	GAME_STATE_BETTING: 4,      // 下注状态
	GAME_STATE_ACTION: 5,       // 玩家顺序操作阶段
	GAME_STATE_END: 6,          // 游戏结束状态
	GAME_STATE_OVER: 7,         // 游戏完整结束状态

	//切换顺序  GAME_STATE_FREE --->GAME_STATE_CALL_BANKER ---->GAME_STATE_BETTING------>GAME_STATE_ACTION --->GAME_STATE_FREE

	//blackjack  服务器直接给

	// 操作常量

	OP_HIT: 1,        // 拿牌
	OP_STAND: 2,      // 停牌
	OP_DOUBLE: 3,     // 加倍
	OP_SPLIT: 4,      // 分牌 ------10点半无此操作
	OP_SURRENDER: 5,  // 投降	------10点半无此操作
	OP_BUY: 6,         // 购买保险	-------10点半无此操作

	//玩家牌局状态掩码
	USER_STATE_BETTING_FINISH: 1,  //玩家下注结束
	USER_STATE_STAND1: 2,          //玩家停第一副牌
	USER_STATE_STAND2: 3,          //玩家停第二副牌
	USER_STATE_DOUBLE: 4,          //玩家加倍
	USER_STATE_SPLIT: 5,           //玩家分牌
	USER_STATE_SURRENDER: 6,       //玩家投降           seat_data.status_mask += 0x01 << global.USER_STATE_SURRENDER
	USER_STATE_BUY: 7,             //玩家购买保险
	USER_STATE_BUTTON_IS_OPENED: 8,//庄家是否开拍
	USER_STATE_FIVE_DRAGON: 8,     //五花

	// 玩家装

	PLAYER_STATE_FREE: 1,    // 玩家空闲状态
	PLAYER_STATE_READY: 2,   // 玩家准备状态
	PLAYER_STATE_PLAY: 3,    // 游戏中
	PLAYER_STATE_OFFLINE: 4, // 玩家离线状态

	// 房间压缩原因
	ROOM_ACHIVE_DIS: 1,  // 解散
	ROOM_ACHIVE_OVER: 2, // 正常结束

	///////////////////10点常量////////////////
	POINT10_MAX_VALUE:10.5 ,//10点半最大的值

	POINT10_TYPE_BOOM: 1,  //爆牌
	POINT10_TYPE_LESS: 2,  //少于10点半
	POINT10_TYPE_EQ: 3,    //等于10点半
	POINT10_TYPE_5S: 4,    //五小   五张牌未爆牌
	POINT10_TYPE_P5S: 5,   //人五小 五张牌未爆牌 且全部都是JQK
	POINT10_TYPE_K5P: 6,   //天王   五张牌未爆牌 且是10点半
	POINT10_TYPE_6S: 7,    //六小   6张牌未爆牌
	POINT10_TYPE_7S: 8,    //七小
	POINT10_TYPE_8S: 9,    //八小
	POINT10_TYPE_9S: 10,   //九小
	POINT10_TYPE_K9P: 11,  //大天王  九张未爆牌 且点数思10点半

	//低分是庄家的1/60 且不超过闲家1/2

	POINT10_TYPE_BOOM_VALUE: 1,  //爆牌
	POINT10_TYPE_LESS_VALUE: 1,  //少于10点半
	POINT10_TYPE_EQ_VALUE: 2,    //等于10点半
	POINT10_TYPE_5S_VALUE: 3,    //五小   五张牌未爆牌
	POINT10_TYPE_P5S_VALUE: 4,   //人五小 五张牌未爆牌 且全部都是JQK
	POINT10_TYPE_K5P_VALUE: 5,   //天王   五张牌未爆牌 且是10点半
	POINT10_TYPE_6S_VALUE: 6,    //六小   6张牌未爆牌
	POINT10_TYPE_7S_VALUE: 7,    //七小
	POINT10_TYPE_8S_VALUE: 8,    //八小
	POINT10_TYPE_9S_VALUE: 9,   //九小
	POINT10_TYPE_K9P_VALUE: 10,  //大天王  九张未爆牌 且点数思10点半

}

// check has rule
global.has_rule = function (rule, mask) {
	return (rule & (1 << mask)) == 0 ? false : true;
}

// type check
global.type_check = function (type) {
	var has = 0;
	if (global.has_rule(type, global.POINT105_CLASSIC)) {
		has += 1;
	}
	if (has != 1) {
		console.log('type index check failed.')
		return false;
	}
	return true;
}
// rule check
global.rule_check = function (rule) {
	// play counts check
	var counts_check = 0;
	if (global.has_rule(rule, global.MASK_PC10)) {
		counts_check += 1;
	}
	if (global.has_rule(rule, global.MASK_PC20)) {
		counts_check += 1;
	}
	if (counts_check > 1) {
		console.log('play counts1 check failed.')
		return false;
	}

	// player count check
	// global.MAX_PLAYER_5 =3;// 最多5人
	// global.MAX_PLAYER_8 =4;// 最多8人
	// global.UNLIMITED    =5;// 不限制人数
	var player_count = 0;
	if (global.has_rule(rule, global.MAX_PLAYER_5)) {
		player_count += 1;
	}
	if (global.has_rule(rule, global.MAX_PLAYER_8)) {
		player_count += 1;
	}
	if (player_count != 1) {
		console.log('player counts check failed.');
		return false;
	}

	// 玩法
	// global.GRAB_BANKER = 6;// 抢庄
	// global.TURN_BANKER = 7;// 轮庄
	// global.OXOX_BANKER = 8;// 牛牛做庄
	// global.MAX_BANKER  = 9;// 牌大做庄
	// global.OVERLORD_BANKER =10;// 霸王庄
	var banker_check = 0;
	if (global.has_rule(rule, global.GRAB_BANKER)) {
		banker_check += 1;
	}
	if (global.has_rule(rule, global.TURN_BANKER)) {
		banker_check += 1;
	}
	if (global.has_rule(rule, global.OVERLORD_BANKER)) {
		banker_check += 1;
	}

	if (banker_check != 1) {
		console.log('banker check failed');
		return false;
	}

	// check cost type
	var cost_type = 0;
	if (global.has_rule(rule, global.MASK_INGOT_GAME)) {
		cost_type += 1;
	}
	if (global.has_rule(rule, global.MASK_GOLD_GAME)) {
		cost_type += 1;
	}
	if (cost_type != 1) {
		console.log("cost type check failed.")
		return false;
	}

	// 可选玩法检测
	// global.NEW_ENTER =11;  // 开始后允许新进玩家
	// global.OPEN_EFFECTS =12; // 开牌特效
	// global.OPNE_CARD_NUM_THREE =13; // 先开3张牌
	// global.OPNE_CARD_NUM_FOUR =14; // 先开4张牌
	var choice_count = 0
	if (global.has_rule(rule, global.OPNE_CARD_NUM_THREE)) {
		choice_count += 1;
	}
	if (global.has_rule(rule, global.OPNE_CARD_NUM_FOUR)) {
		choice_count += 1;
	}
	if (choice_count > 1) {
		console.log('choice check failed.')
		return false;
	}
	return true;
}

// 获取应当扣除的钻石
global.get_ingot_value = function (rule) {
	if (global.has_rule(rule, global.MASK_INGOT_GAME)) {
		if (global.has_rule(rule, global.MASK_PC10)) {
			return 1;
		}
		if (global.has_rule(rule, global.MASK_PC20)) {
			return 2;
		}
	}

	if (global.has_rule(rule, global.MASK_GOLD_GAME)) {
		if (global.has_rule(rule, global.MASK_PC10)) {
			return 1;
		}
		if (global.has_rule(rule, global.MASK_PC20)) {
			return 2;
		}
	}
}

exports.global = global;
