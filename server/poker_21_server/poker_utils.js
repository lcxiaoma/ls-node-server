var global = require('./global_setting').global;

exports.get_poker_value = function (poker_value) {
	return Math.floor(poker_value / 4);
}

//获取poker花色
//0 方块 1梅花 2红桃 3黑桃
exports.get_poker_color = function (poker) {
	return poker % 4;
}


//获取计算21点的牌面值
/*
00,01,02,03  A    0		5
04,05,06,07  2    1		6
08,09,10,11  3    2		
12,13,14,15  4    3		8
16,17,18,19  5    4		9
20,21,22,23  6    5		10
24,25,26,27  7    6		J
28,29,30,31  8    7		Q
32,33,34,35  9    8		K
36,37,38,39  10   9		A
40,41,42,43  J   10		2
44,45,46,47  Q   11		7
48,49,50,51  K   12		kk
*/
function get_point21_value(value) {
	if (value > 9) return 10
	return value + 1;
}

//牌是从A ---K
function get_poker_value(poker_value) {
	return Math.floor(poker_value / 4);
}
// /**

//检测手牌类型
//{type,value,max_color}
exports.check_card_type = function (card_list) {
	var card_type = {
		type: 0,
		max_value: 0,
		max_color: 0,
		card_value: []
	}
	//倒序
	card_list.sort(function (a, b) { return b - a; });
	//优先检测特殊的类型
	var len = card_list.length;

	var card_value = []; // 点数列表
	var total_value = 0; // 点数

	var poker_A_count = 0;
	for (var i = 0; i < len; ++i) {
		var value = get_poker_value(card_list[i]);
		if (value == global.SPACIAL_A_VALUE) {
			poker_A_count += 1;
		} else {
			var num = get_point21_value(value);
			card_value.push(num);
		}
	}

	for (var i = 0; i < card_value.length; ++i) {
		card_type.max_value += card_value[i];
	}
	if (poker_A_count != 0) {
		var tmp = card_type.max_value;
		var offset = global.A_MAX - global.A_MIN;
		tmp += global.A_MIN * poker_A_count;
		if (tmp >= global.MAX_POINTS) {
			card_type.max_value = tmp;
			for (var i = 0; i < poker_A_count; ++i) {
				card_value.push(1);
			}
			card_type.card_value = card_value;
		} else {
			var a_max_count = 0;
			while (true) {
				tmp += offset;
				a_max_count += 1;
				if (tmp > global.MAX_POINTS) {
					a_max_count -= 1;
					tmp -= offset;
					break;
				}
				if (a_max_count == poker_A_count) {
					break;
				}
			}
			card_type.max_value = tmp;
			if (a_max_count != 0) {
				for (var i = 0; i < poker_A_count; ++i) {
					if (i < a_max_count) {
						card_value.push(11);
					} else {
						card_value.push(1);
					}
				}
				card_type.card_value = card_value;
			} else {
				for (var i = 0; i < poker_A_count; ++i) {
					card_value.push(1);
				}
				card_type.card_value = card_value;
			}
		}
	}

	if (card_type.max_value > global.MAX_POINTS) {
		card_type.type = global.BUST;
	}
	if (card_type.max_value <= global.MAX_POINTS) {
		if (len == 5) {
			card_type.type = global.FIVE_DRAGON
		} else {
			if (card_type.max_value == global.MAX_POINTS) {
				if (len == 2) {
					card_type.type = global.BLACK_JACK
				} else {
					card_type.type = global.EQUAL_21;
				}
			} else {
				card_type.type = global.LESS_21;
			}
		}
	}
	return card_type;
}

//比较大小
//true  card_type1大
//false card_type1小
//null  一样大
exports.compare = function (card_type1, card_type2) {
	if (card_type1.type != card_type2.type) {
		return card_type1.type > card_type2.type;
	}
	//爆牌算庄家大
	if (card_type1.type == global.BUST) {
		return true;
	}
	//card_type 相等
	if (card_type1.max_value != card_type2.max_value) {
		return card_type1.max_value > card_type2.max_value;
	}

	return null;
}

//获取倍率
exports.get_times = function (card_type) {
	if (card_type.type == global.BUST) {
		return global.BUST_VALUE;
	}
	if (card_type.type == global.LESS_21) {
		return global.LESS_21_VALUE;
	}
	if (card_type.type == global.EQUAL_21) {
		return global.EQUAL_21_VALUE;
	}
	if (card_type.type == global.FIVE_DRAGON) {
		return global.FIVE_DRAGON_VALUE;
	}
	if (card_type.type == global.BLACK_JACK) {
		return global.BLACK_JACK_VALUE;
	}
}
