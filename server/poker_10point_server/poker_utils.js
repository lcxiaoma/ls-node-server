var global = require('./global_setting').global;

exports.get_poker_value = function (poker_value) {
	return Math.floor(poker_value / 4);
}

//获取poker花色
//0 方块 1梅花 2红桃 3黑桃
exports.get_poker_color = function (poker) {
	return poker % 4;
}


//获取计算10点半的牌面值
/*
00,01,02,03  A    0
04,05,06,07  2    1
08,09,10,11  3    2
12,13,14,15  4    3
16,17,18,19  5    4
20,21,22,23  6    5
24,25,26,27  7    6
28,29,30,31  8    7
32,33,34,35  9    8
36,37,38,39  10   9
40,41,42,43  J   10
44,45,46,47  Q   11
48,49,50,51  K   12
*/
function get_point105_value(value) {
	if (value > 9) return 0.5
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
	var tmp_c =card_list.slice();
	tmp_c.sort(function (a, b) { return b - a; });
	//优先检测特殊的类型
	var len = tmp_c.length;
	var total_value =0;
	for(var i=0;i<len;++i){
		var v = exports.get_poker_value(tmp_c[i]);
		var r_v = get_point105_value(v);
		total_value +=r_v;
		card_type.card_value.push(r_v);
	}

	if(total_value >global.POINT10_MAX_VALUE){
		card_type.type = global.POINT10_TYPE_BOOM;
		card_type.max_value = total_value;
	}else{
		card_type.max_value = total_value;
		switch (len) {
			case 9:
				card_type.value = total_value;
				if(total_value == global.POINT10_MAX_VALUE){
					card_type.type = global.POINT10_TYPE_K9P;
				}else{
					card_type.type = global.POINT10_TYPE_9S;
				}
				break;
			case 8:
				card_type.type = global.POINT10_TYPE_8S;
				break;
			case 7:
				card_type.type = global.POINT10_TYPE_7S;
				break;
			case 6:
				card_type.type = global.POINT10_TYPE_6S;
				break;
			case 5:
				if(total_value == global.POINT10_MAX_VALUE){
					card_type.type = global.POINT10_TYPE_K9P
				}else{
					if(total_value > 5*0.5){
						card_type.type = global.POINT10_TYPE_5S
					}else{
						card_type.type = global.POINT10_TYPE_P5S
					}
				}
				break;
			case 4:
			case 3:
			case 2:
			case 1:
				if(total_value == global.POINT10_MAX_VALUE){
					card_type.type = global.POINT10_TYPE_EQ;
				}else if(total_value < global.POINT10_MAX_VALUE){
					card_type.type = global.POINT10_TYPE_LESS;
				}
				break;
		}
	}

	return card_type;
}

//比较大小
//true  card_type1大
//false card_type1小
//所有规则黑吃黑  全部相等的情况下只算庄家赢
exports.compare = function (card_type1, card_type2) {
	if (card_type1.type != card_type2.type) {
		return card_type1.type > card_type2.type;
	}
	//爆牌算庄家大
	if (card_type1 == global.POINT10_TYPE_BOOM) {
		return true;
	}
	//card_type 相等
	if (card_type1.max_value != card_type2.max_value) {
		return card_type1.max_value > card_type2.max_value;
	}

	//max_value相等比牌数量
	if (card_type1.card_value.length != card_type2.card_value.length) {
		return card_type1.card_value.length > card_type2.card_value.length;
	}

	return true;
}

//获取倍率
exports.get_times = function (card_type) {
	if (card_type.type == global.POINT10_TYPE_BOOM) {
		return global.POINT10_TYPE_BOOM_VALUE;
	}
	if (card_type.type == global.POINT10_TYPE_LESS) {
		return global.POINT10_TYPE_LESS_VALUE;
	}
	if (card_type.type == global.POINT10_TYPE_EQ) {
		return global.POINT10_TYPE_EQ_VALUE;
	}
	if (card_type.type == global.POINT10_TYPE_5S) {
		return global.POINT10_TYPE_5S_VALUE;
	}
	if (card_type.type == global.POINT10_TYPE_P5S) {
		return global.POINT10_TYPE_P5S_VALUE;
	}
	if (card_type.type == global.POINT10_TYPE_K5P) {
		return global.POINT10_TYPE_K5P_VALUE;
	}
	if (card_type.type == global.POINT10_TYPE_6S) {
		return global.POINT10_TYPE_6S_VALUE;
	}
	if (card_type.type == global.POINT10_TYPE_7S) {
		return global.POINT10_TYPE_7S_VALUE;
	}
	if (card_type.type == global.POINT10_TYPE_8S) {
		return global.POINT10_TYPE_8S_VALUE;
	}
	if (card_type.type == global.POINT10_TYPE_9S) {
		return global.POINT10_TYPE_9S_VALUE;
	}
	if (card_type.type == global.POINT10_TYPE_K9P) {
		return global.POINT10_TYPE_K9P_VALUE;
	}
}
