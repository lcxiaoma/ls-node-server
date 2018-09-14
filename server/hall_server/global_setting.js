var global = {
	//游戏局数
    MASK_PC10: 1,                 // 10局
	MASK_PC20: 2,                 // 20局

    // 游戏类型
	MASK_INGOT_GAME: 19, // 房卡游戏
	MASK_GOLD_GAME: 20,  // 金币游戏
};

global.has_rule = function (rule, mask) {
	return (rule & (1 << mask)) == 0 ? false : true;
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
}

exports.global = global;