/**
 * 游戏管理器, 对游戏逻辑进行管理
 */

// 房间管理器
var roomManager = require("./roommgr");
// 用户管理器
var userManager = require("./usermgr");
// 逻辑算法和处理
var pokerUtils = require("./poker_utils");
// 数据库模块
var db = require("../utils/db");
// 加密解密莫开车
var crypt = require("../utils/crypto");
// 游戏列表
var games = {};
// 用户座位
var game_seats_of_user = {};
// 日志
var logger = require('./log.js').log_poker_21;
// 全局设置
const global = require('./global_setting').global;
// 错误消息
const error = require('../config/error').error;
// 消息模板
const msg_templete = require('./msgdefine').msg_templete;
// 日志管理器
var logger_manager = require('../common/log_manager');
// 日志点
var log_point = require('../config/log_point').log_point;
// 正在申请解散的房间
var apply_dissmiss_room = [];
var apply_dissmiss_timer = {};
// 提前开始游戏房间
var start_play_room = [];
var start_play_timer = {};

/**
 * 开始游戏
 * @param {*} room_id
 */
function begin(room_id) {
	// 游戏开始日志
	logger.debug('game begin room_id = %d', room_id);
	// 获取房间信息
	var roominfo = roomManager.getRoom(room_id);
	if (roominfo == null) {
		return;
	}
	// 获取游戏信息
	var game = games[room_id]
	// 1. 全新的房间
	if (game == null) {
		// var seats = roominfo.seats;
		// 游戏数据结构
		game = {
			conf: roominfo.conf,                                // 房间配置
			room_info: roominfo,                                // 房间信息
			game_index: roominfo.num_of_games,                  // 当前游戏局数
			button: roominfo.change_info.current_banker_index,  // 庄家座位
			seats_num: roominfo.seats_num,                      // 房间座位数
			current_index: 0,                                   // 当前牌的索引(发牌用)
			poker: new Array(roominfo.conf.poker_nums),
			game_seats: new Array(roominfo.seats_num),
			turn: 0,
			state: global.GAME_STATE_FREE,
			less_begin: roominfo.change_info.less_begin,
			next_banker: roominfo.change_info.next_banker,                  // 玩家座位号
		}
		roominfo.num_of_games++;                                          // 游戏局数计数器
		game.game_index++;                                                // 游戏局数计数器

		// 初始化座位信息

		for (var i = 0; i < roominfo.seats_num; ++i) {
			// 更具具体的玩家来初始化game_seats的长度
			var seat_data = roominfo.seats[i];
			if (!seat_data) {
				continue;
			}
			var data = {
				seat_index: i,                 // 座位号
				user_id: seat_data.user_id,    // 用户ID
				holds: [],                     // 每个玩家持有的牌
				folds: [],                     //
				action: [],                    // 动作列表
				bet_coin: 0,                   // 下注金额
				call_banker: -1,               // 叫庄
				statistic: seat_data.statistic,// 统计信息
				card_type: [],                  //当前牌型(两副牌)
				status_mask: 0,                  //用户牌局状态掩码
			}
			game.game_seats[i] = data;
			game_seats_of_user[data.user_id] = data;
		}
		games[room_id] = game;
	}
	// 有玩家存在的房间
	else {
		game.poker = new Array(roominfo.conf.poker_nums);    // 52张牌
		game.state = global.GAME_STATE_FREE;                 // 游戏状态
		game.current_index = 0;                              // 当前牌的索引(用于发牌)
		game.next_banker = roominfo.change_info.next_banker; // 下一庄家
		roominfo.num_of_games++;                             // 游戏局数计数器
		game.game_index++;                                   // 游戏局数计数器
		// 座位信息
		for (var i = 0; i < roominfo.seats_num; ++i) {
			var game_seat_info = game.game_seats[i]; // 游戏座位
			var room_seat_info = roominfo.seats[i];  // 房间座位

			if (room_seat_info && room_seat_info.user_id > 0) {
				if (game_seat_info) {
					game_seat_info.seat_index = i;
					game_seat_info.user_id = roominfo.seats[i].user_id;
					game_seat_info.holds = [];
					game_seat_info.folds = [];
					game_seat_info.action = [];
					game_seat_info.bet_coin = 0;
					game_seat_info.call_banker = -1;
					game_seat_info.statistic = roominfo.seats[i].statistic;
					game_seat_info.card_type = [];
					game_seat_info.status_mask = 0;
				} else {
					// 当游戏中玩家信息不存在的时候要新建一个玩家状态
					game_seat_info = {
						seat_index: room_seat_info.seat_index,
						user_id: room_seat_info.user_id,
						holds: [],
						folds: [],
						action: [],
						bet_coin: [],
						call_banker: -1,
						statistic: room_seat_info.statistic,
						card_type: [],                // 当前牌型
						status_mask: 0,
					}
					game.game_seats[i] = game_seat_info;
				}
				game_seats_of_user[game_seat_info.user_id] = game_seat_info;
			}
		}
		games[room_id] = game;
	}
	// 洗牌
	shuffle(game);

	//下一个状态
	var next_state = global.GAME_STATE_CALL_BANKER;
	//霸王庄
	if (global.has_rule(game.conf.rule_index, global.OVERLORD_BANKER)) {
		game.button = 0;
		next_state = global.GAME_STATE_BETTING;
	}
	//轮庄
	if (global.has_rule(game.conf.rule_index, global.TURN_BANKER)) {
		if (game.game_index == 1) {
			game.button = 0;
		} else {
			// console.error(game.room_info.change_info)
			game.button = game.room_info.change_info.next_banker;
		}
		next_state = global.GAME_STATE_BETTING;
	}
	//为了后面移动 位置用
	game.turn = game.button
	game.state = next_state;
	// 当前庄家
	game.current_banker_count += 1;
	game.room_info.change_info.current_banker_count += 1;

	userManager.send_to_room('game_num_push', roominfo.num_of_games, roominfo.id);
	userManager.send_to_room('game_begin_push', game.button, game.room_info.id);

	notice_game_state(roominfo.id, game.state);
	// 开始增加更新房间信息
	update_room_info(game);
	// TODO结束的更新房间信息
	init_game_base_info(game);
}

/**
 * 叫庄(发牌后，如果是抢庄进入这个阶段)
 */
exports.call_banker = function (user_id, data) {

	// 通过用户ID获取游戏信息
	var game = get_game_by_user(user_id);
	if (game == null) {
		return;
	}
	// 检查当前游戏状态, 如果非叫庄状态直接返回
	if (game.state != global.GAME_STATE_CALL_BANKER) {
		return;
	}
	data = JSON.parse(data);
	// 强制检测参数
	if (data.call != 0 && data.call != 1) {
		return;
	}
	// 通过用户ID获取座位数据
	var seat_index = get_seat_index(user_id);
	var seat_data = game.game_seats[seat_index];
	// 座位没人
	if (!seat_data) {
		return;
	}
	// 玩家已叫庄或不叫庄
	if (seat_data.call_banker != -1) {
		logger.warn('has called banker.')
		return;
	}
	// 存储用户的叫庄状态到游戏
	seat_data.call_banker = data.call;
	game.game_seats[seat_index] = seat_data;
	// 把叫庄状态通知给房间的所有人
	var msg = JSON.parse(msg_templete.SC_CallBanker);
	msg.call = data.call;
	msg.seat_index = seat_index;
	userManager.send_to_room('call_banker', msg, game.room_info.id);
	var all_call = true;    // 叫庄结束后开始押注
	var call_list = [];     // 叫庄玩家列表
	var no_call_list = [];  // 不叫庄玩家列表
	// 填充叫庄玩家列表和不叫庄玩家列表
	for (var i = 0; i < game.game_seats.length; ++i) {
		var seat_data = game.game_seats[i];
		if (seat_data && seat_data.user_id > 0) {
			// 如果有人没叫庄, 设置 all_call 标记为false
			if (seat_data.call_banker == -1) {
				all_call = false;
				break;
			} else if (seat_data.call_banker == 1) {
				call_list.push(i);
			} else if (seat_data.call_banker == 0) {
				no_call_list.push(i);
			}
		}
	}
	// 所有人已叫, 定庄
	if (all_call) {
		if (call_list.length == 0) {
			game.button = no_call_list[Math.floor(Math.random() * no_call_list.length)];
		} else {
			game.button = call_list[Math.floor(Math.random() * call_list.length)];
		}
		game.turn = game.button
		//切换到要牌状态
		game.state = global.GAME_STATE_BETTING;
		// 游戏状态变化
		userManager.send_to_room('game_begin_push', game.button, game.room_info.id);
		notice_game_state(game.room_info.id, game.state);
	}
	update_game_info(game);
}
/**
 * 下注
 */
exports.betting = function (user_id, data) {
	logger.debug('betting', user_id, data);
	var game = get_game_by_user(user_id);
	logger.debug('betting game state: ', game.state);

	if (game == null) {
		return;
	}
	// 庄家不能下注
	var seat_index = get_seat_index(user_id);
	if (seat_index == game.button) {
		logger.warn('banker can not betting.')
		return;
	}
	// 座位无人
	var seat_data = game.game_seats[seat_index];
	if (seat_data == null) {
		return false;
	}
	data = JSON.parse(data)
	var msg = JSON.parse(msg_templete.SC_Betting);
	// 只能在下注状态的时候下注
	if (game.state != global.GAME_STATE_BETTING) {
		msg.error_code = error.USER_STATE_NOT_BETING;
		userManager.sendMsg(user_id, 'betting', msg);
		return;
	}
	var bet_type = Number(data.betting_type);
	if (bet_type !== 0 && bet_type !== 1) {
		return;
	}

	var coin = Number(data.coin);
	if(!coin && coin !== 0){
		return;
	}

	if (global.has_rule(seat_data.status_mask, global.USER_STATE_BETTING_FINISH)) {
		return;
	}
	//下注结束
	if (bet_type == 1) {
		if (seat_data.bet_coin < global.POINT21_MIN_SCORE) {
			msg.error_code = error.POINT_OP_CONI_LESS;
			userManager.sendMsg(user_id, 'betting', msg);
			return;
		}
		seat_data.status_mask += 0x01 << global.USER_STATE_BETTING_FINISH;
	} else {
		// 筹码验证
		data.coin = Number(data.coin);
		if (!data.coin || data.coin < 0) {
			msg.error_code = error.USER_COIN_NOT_INVALID;
			userManager.sendMsg(user_id, 'betting', msg);
			return;
		}
		// 最高下注1000
		if (Number(seat_data.bet_coin) + Number(data.coin) > 1000) {
			msg.error_code = error.USER_COIN_NOT_INVALID;
			userManager.sendMsg(user_id, "betting", msg);
			return;
		}
		seat_data.bet_coin = Number(seat_data.bet_coin) + Number(data.coin);
	}

	msg.error_code = error.SUCCESS;
	msg.seat_index = seat_index;
	msg.betting_type = bet_type;
	msg.coin = data.coin;
	msg.total_coin = seat_data.bet_coin;

	userManager.send_to_room('betting', msg, game.room_info.id);
	// 全部下注完毕，翻牌结算
	var all_bet = true;
	for (var i = 0; i < game.game_seats.length; ++i) {
		var seat_data = game.game_seats[i];
		if (seat_data && seat_data.user_id > 0 && i != game.button) {
			if (!global.has_rule(seat_data.status_mask, global.USER_STATE_BETTING_FINISH)) {
				all_bet = false;
				break;
			}
		}
	}
	// 所有人下注完毕, 开始发牌
	if (all_bet) {
		// 显示结果，结算，更改游戏状态
		dispatch_card(game)
		for (var i = 0; i < game.game_seats.length; ++i) {
			// 判断无人的座位
			var seat_data = game.game_seats[i];
			if (seat_data && seat_data.user_id > 0) {
				// console.log("show me fater dispatch-====>", seat_data.holds);
				var card_type1 = pokerUtils.check_card_type(seat_data.holds[0].slice());
				var card_type2 = pokerUtils.check_card_type(seat_data.holds[1].slice());
				seat_data.card_type.push({ type: card_type1.type, value: card_type1.max_value });
				seat_data.card_type.push({ type: card_type2.type, value: card_type2.max_value });
				notice_user_holds_change(seat_data.user_id, seat_data.holds, []);
				if (seat_data.seat_index == game.button) {
					broadcast_user_state(game.room_info.id, seat_data, true, false);
				} else {
					broadcast_user_state(game.room_info.id, seat_data, false, false);
				}
			}
		}
		game.state = global.GAME_STATE_ACTION;
		move_to_next_action(game);
		notice_game_state(game.room_info.id, game.state);
	}
	//只要成功，无论任何情况都要数据落地
	update_game_info(game);
}
/**
 * 下一个操作的玩家，只有在GAME_STATE_ACTION才会有这个动作
 * @param {*} game
 */
function move_to_next_action(game) {
	var player_num = get_game_realplayernum(game)
	var next_turn = (game.turn + 1) % player_num;
	var next_seat = game.game_seats[next_turn];
	var begin_turn = next_turn;
	if (next_seat.seat_index == game.button && next_seat.card_type[0].type == global.BLACK_JACK) {
		game_end(game.room_info.id, false);
		return;
	}
	if (next_seat.seat_index != game.button && next_seat.card_type[0].type == global.BLACK_JACK) {
		game.turn = next_turn;
		move_to_next_action(game)
		return;
	}

	game.turn = next_turn
	if (game.turn == game.button) {
		next_seat.status_mask += 0x01 << global.USER_STATE_BUTTON_IS_OPENED
	}
	update_game_info(game);
	
	userManager.send_to_room('turn_push', { turn: game.turn }, game.room_info.id)
}

/**
 * 发牌
 * @param {*} game
 */
function dispatch_card(game) {
	game.current_index = 0;
	var seat_index = 0;
	var card_num = game.conf.card_nums;
	var player_num = game.seats_num;
	// 这里的玩家数量得用真实的玩家数量
	for (var i = 0; i < game.game_seats.length; ++i) {
		var seat_data = game.game_seats[i];
		if (seat_data && seat_data.user_id > 0) {
			var tmp_holds = [];
			for (var j = 0; j < card_num; ++j) {
				var r = Math.floor(Math.random() * (game.conf.poker_nums-game.current_index));
				tmp_holds[j] = game.poker[r];
				if (r != (game.conf.poker_nums-game.current_index - 1)) {
					var tmp = game.poker[game.conf.poker_nums-game.current_index - 1];
					game.poker[game.conf.poker_nums-game.current_index - 1] = game.poker[r];
					game.poker[r] = tmp;
				}
				// game.conf.poker_nums -= 1;
				game.current_index +=1
			}
			seat_data.holds.push(tmp_holds);
			seat_data.holds.push([]);
		}
	}
	// game.game_seats[1].holds = [[0, 1], []];
}

/**
 * 随机抽一张牌
 * @param {*} game
 * @param {*} seat_index
 */
function dispatch_1_card(game, target, seat_index) {
	var r = Math.floor(Math.random() * (game.conf.poker_nums-game.current_index));
	var poker = game.poker[r];
	if (r != (game.conf.poker_nums -game.current_index- 1)) {
		var tmp = game.poker[game.conf.poker_nums-game.current_index - 1];
		game.poker[game.conf.poker_nums-game.current_index - 1] = game.poker[r];
		game.poker[r] = tmp;
	}
	// game.conf.poker_nums -= 1;
	game.current_index +=1;
	// 压入手牌
	game.game_seats[seat_index].holds[target - 1].push(poker);
	return poker;
}

/**
 * 检测用户还可以行动
 * @param {*} seat_data
 */
function check_can_action(seat_data) {
	var mask = seat_data.status_mask;
	if (global.has_rule(mask, global.USER_STATE_SPLIT)) {
		if (global.has_rule(mask, global.USER_STATE_STAND1) && global.has_rule(mask, global.USER_STATE_STAND2)) {
			return false;
		}
		var right = 0;
		var ct1 = seat_data.card_type[0];
		var ct2 = seat_data.card_type[1];
		// console.warn("check can action ct1 ---->", ct1)
		// console.warn("check can action ct2 ---->", ct2)
		if (ct1.type == global.BUST || ct1.type == global.EQUAL_21 || ct1.type == global.BLACK_JACK || ct1.type == global.FIVE_DRAGON || global.has_rule(mask, global.USER_STATE_STAND1)) {
			right += 1;
		}
		if (ct2.type == global.BUST || ct2.type == global.EQUAL_21 || ct2.type == global.BLACK_JACK || ct2.type == global.FIVE_DRAGON || global.has_rule(mask, global.USER_STATE_STAND2)) {
			right += 1;
		}
		// console.warn("show me right ====>", right)
		if (right == 2) {
			return false;
		}
		return true;
	} else {
		if (global.has_rule(mask, global.USER_STATE_STAND1)) {
			return false;
		}
		var ct1 = seat_data.card_type[0];
		if (ct1.type == global.BUST || ct1.type == global.EQUAL_21 || ct1.type == global.BLACK_JACK || ct1.type == global.FIVE_DRAGON) {
			return false;
		}
		return true;
	}
}

//要牌
function hit(game, seat_data, player_which_hand, msg, send_func) {

	// 不该自己出牌
	if (game.turn != seat_data.seat_index) {
		return;
	}
	if (game.state != global.GAME_STATE_ACTION) {
		// msg.error_code = error.FAILED;
		// send_func(seat_data.user_id, game.room_info.id, msg);
		return;
	}
	// 有两副牌的时候, 针对哪一副牌腰牌
	if (player_which_hand != 1 && player_which_hand != 2) {
		return;
	}
	//检测能要牌的条件
	if (player_which_hand == 1) {
		if (global.has_rule(seat_data.status_mask, global.USER_STATE_STAND1)) {
			return;
		}
	}
	if (player_which_hand == 2) {
		if (!global.has_rule(seat_data.status_mask, global.USER_STATE_SPLIT)) {
			return;
		}
		if (global.has_rule(seat_data.status_mask, global.USER_STATE_STAND2)) {
			return;
		}
	}
	//如果已经是21点了 或者特殊牌型的时候，不让继续要牌了
	var old_card_type = seat_data.card_type[player_which_hand - 1];
	if (!old_card_type) {
		return;
	}
	if (old_card_type.type == global.BUST || old_card_type.type == global.EQUAL_21 || old_card_type.type == global.BLACK_JACK || old_card_type.type == global.FIVE_DRAGON) {
		return;
	}
	//爆牌不能继续要，21点不能继续要，5张牌不能继续要
	if (!check_can_action(seat_data)) {
		//这些情况都是不能继续要牌的
		msg.error_code = error.POINT_OP_HIT_NOT;
		send_func(seat_data.user_id, game.room_info.id, msg);
		return;
	}

	//发牌后重新计算牌型，如果达到不能要牌的条件自动移动到下一家
	var poker = dispatch_1_card(game, player_which_hand, seat_data.seat_index);
	msg.error_code = error.SUCCESS;
	msg.card_data = poker;
	send_func(seat_data.user_id, game.room_info.id, msg);
	notice_user_holds_change(seat_data.user_id, seat_data.holds, []);
	var tmp_card_type = pokerUtils.check_card_type(seat_data.holds[player_which_hand - 1]);

	// logger.debug('tmp_card_type', tmp_card_type, 'seat_data holds: ', seat_data.holds)
	seat_data.card_type[player_which_hand - 1] = { type: tmp_card_type.type, value: tmp_card_type.max_value };

	update_game_info(game);

	var is_banker = (seat_data.seat_index == game.button)
	if (is_banker) {
		var is_game_end = false;
		//如果是庄家，出现某些情况 游戏直接结束
		if (!check_can_action(seat_data)) {
			is_game_end = true;
		}
		if (!is_game_end) {
			broadcast_user_state(game.room_info.id, seat_data, is_banker, false);
			if (!check_can_action(seat_data)) {
				//条件达成 直接移动到下一个操作玩家
				move_to_next_action(game);
			}
		} else {
			broadcast_user_state(game.room_info.id, seat_data, is_banker, true);
			game_end(game.room_info.id, false);
		}
	} else {
		//不是庄家的时候检测是否能动作，不能动作往下移动
		var can_action = check_can_action(seat_data);
		broadcast_user_state(game.room_info.id, seat_data, is_banker, false);
		// console.error("user hit can action ======>",can_action)
		if (!can_action) {
			move_to_next_action(game);
		}
	}

}
//停牌
function stand(game, seat_data, player_which_hand, msg, send_func) {
	if (game.turn != seat_data.seat_index) {
		return;
	}
	logger.debug('stand seat_index: ', seat_data.seat_index, 'player_which_hand', player_which_hand)

	if (game.state != global.GAME_STATE_ACTION) {
		// msg.error_code = error.FAILED;
		// send_func(seat_data.user_id, game.room_info.id, msg);
		return;
	}
	if (player_which_hand != 1 && player_which_hand != 2) {
		return;
	}
	if (player_which_hand == 2) {
		if (!global.has_rule(seat_data.status_mask, global.USER_STATE_SPLIT)) {
			return;
		}
	}
	if (player_which_hand == 1 && global.has_rule(seat_data.status_mask, global.USER_STATE_STAND1)) {
		// msg.error_code = error.FAILED;
		// send_func(seat_data.user_id, game.room_info.id, msg);
		return;
	}
	if (player_which_hand == 2 && global.has_rule(seat_data.status_mask, global.USER_STATE_STAND2)) {
		// msg.error_code = error.FAILED;
		// send_func(seat_data.user_id, game.room_info.id, msg);
		return;
	}
	//庄家必须要大于17点才能停牌
	if (seat_data.seat_index == game.button) {
		//判断能不能停牌
		var card_type = seat_data.card_type;
		// 已经分牌
		if (global.has_rule(seat_data.status_mask, global.USER_STATE_SPLIT)) {
			// 第一手牌
			if (player_which_hand == 1 && card_type[0].value < global.BANKER_LESS_POINTS) {
				msg.error_code = error.POINT_OP_STAND_BANKER_LESS;
				send_func(seat_data.user_id, game.room_info.id, msg);
				return;
			}
			// 第二手牌
			if (player_which_hand == 2 && card_type[1].value < global.BANKER_LESS_POINTS) {
				// logger.debug('card_type[1].value < global.BANKER_LESS_POINTS')
				msg.error_code = error.POINT_OP_STAND_BANKER_LESS;
				send_func(seat_data.user_id, game.room_info.id, msg);
				return;
			}
		}
		//没分牌
		else {
			if (card_type[0].value < global.BANKER_LESS_POINTS) {
				// logger.debug('card_type[0].value < global.BANKER_LESS_POINTS')
				msg.error_code = error.POINT_OP_STAND_BANKER_LESS;
				send_func(seat_data.user_id, game.room_info.id, msg);
				return;
			}
		}
		if (player_which_hand == 1) {
			seat_data.status_mask += 0x01 << global.USER_STATE_STAND1;
		}
		if (player_which_hand == 2) {
			seat_data.status_mask += 0x01 << global.USER_STATE_STAND2;
		}
		//庄家同样需要检测动作
		update_game_info(game);
		msg.error_code = error.SUCCESS;
		send_func(seat_data.user_id, game.room_info.id, msg);
		broadcast_user_state(game.room_info.id, seat_data, true, true);
		//如果庄家分牌了，那么此处不应当结束
		var can_action = check_can_action(seat_data);
		// console.error("Banker stand check can action ,",can_action);
		if (!can_action) {
			game_end(game.room_info.id, false);
		}
		return;
	} else {
		//直接让其停牌
		if (player_which_hand == 1) {
			seat_data.status_mask += 0x01 << global.USER_STATE_STAND1;
		}
		if (player_which_hand == 2) {
			seat_data.status_mask += 0x01 << global.USER_STATE_STAND2;
		}
		update_game_info(game);
		msg.error_code = error.SUCCESS;
		send_func(seat_data.user_id, game.room_info.id, msg);
		broadcast_user_state(game.room_info.id, seat_data, false, false);
		var can_action = check_can_action(seat_data);
		// console.error("User stand check can action ,",can_action)
		if (!can_action) {
			move_to_next_action(game);
		}

	}
}

//加倍
//加倍后直接发玩家一张牌，然后轮去下一家
//分牌后是不能加倍的
//庄家不能加倍
function double(game, seat_data, player_which_hand, msg, send_func) {
	if (game.turn != seat_data.seat_index) {
		return;
	}
	if (game.state != global.GAME_STATE_ACTION) {
		// msg.error_code = error.FAILED;
		// send_func(seat_data.user_id, game.room_info.id, msg);
		return;
	}
	//庄家可不可以加倍
	if (seat_data.seat_index == game.button) {
		return;
	}
	if (seat_data.status_mask > 2) {
		return;
	}
	if (seat_data.holds[0].length != 2) {
		return;
	}
	if (seat_data.holds[1].length != 0) {
		return;
	}

	//已经是特殊类型了不允许加倍
	if (seat_data.card_type[0].type == global.EQUAL_21 || seat_data.card_type[0].type == global.BLACK_JACK) {
		return;
	}
	var card = dispatch_1_card(game, 1, seat_data.seat_index);
	var new_card_type = pokerUtils.check_card_type(seat_data.holds[0]);
	seat_data.card_type[0] = { type: new_card_type.type, value: new_card_type.max_value };
	var old_bet_coin = seat_data.bet_coin;
	seat_data.bet_coin += old_bet_coin;

	update_game_info(game);

	msg.error_code = error.SUCCESS;
	send_func(seat_data.user_id, game.room_info.id, msg);

	//加倍后下注加倍通知
	var bet_add_msg = JSON.parse(msg_templete.SC_Betting);
	bet_add_msg.error_code = error.SUCCESS;
	bet_add_msg.bet_type = 0;
	bet_add_msg.seat_index = seat_data.seat_index;
	bet_add_msg.coin = old_bet_coin;
	bet_add_msg.total_coin = seat_data.bet_coin;
	userManager.send_to_room("betting", bet_add_msg, game.room_info.id);

	notice_user_holds_change(seat_data.user_id, seat_data.holds, []);
	broadcast_user_state(game.room_info.id, seat_data, false, false);

	//不管有木有动作直接移动到下一家
	move_to_next_action(game);
}

//分牌
function spliting(game, seat_data, player_which_hand, msg, send_func) {
	if (game.turn != seat_data.seat_index) {
		return;
	}
	if (game.state != global.GAME_STATE_ACTION) {
		// msg.error_code = error.FAILED;
		// send_func(seat_data.user_id, game.room_info.id, msg);
		return;
	}
	//庄家可不可以分牌(现在是允许庄家分牌)
	if (seat_data.seat_index == game.button) {
		return;
	}
	if (global.has_rule(seat_data.status_mask, global.USER_STATE_SPLIT)) {
		return;
	}
	var card1 = pokerUtils.get_poker_value(seat_data.holds[0][0])
	var card2 = pokerUtils.get_poker_value(seat_data.holds[0][1])
	if (seat_data.holds[0].length === 2 && card1 == card2) {
		var splited_holds = []
		splited_holds.push([seat_data.holds[0][0]])
		splited_holds.push([seat_data.holds[0][1]])
		seat_data.holds = splited_holds
		//分牌后，对没一副牌都发一张牌
		dispatch_1_card(game, 1, seat_data.seat_index);
		dispatch_1_card(game, 2, seat_data.seat_index);
		//重新计算牌的分值
		var card_type_1 = pokerUtils.check_card_type(seat_data.holds[0]);
		var card_type_2 = pokerUtils.check_card_type(seat_data.holds[1]);
		seat_data.card_type[0] = { type: card_type_1.type, value: card_type_1.max_value };
		seat_data.card_type[1] = { type: card_type_2.type, value: card_type_2.max_value };

		//下注加倍
		var old_bet_coin = seat_data.bet_coin;
		seat_data.bet_coin += old_bet_coin;

		seat_data.status_mask += 0x01 << global.USER_STATE_SPLIT;

		update_game_info(game);

		//分牌消息
		msg.error_code = error.SUCCESS;
		send_func(seat_data.user_id, game.room_info.id, msg);

		//加倍后下注加倍通知
		var bet_add_msg = JSON.parse(msg_templete.SC_Betting);
		bet_add_msg.error_code = error.SUCCESS;
		bet_add_msg.bet_type = 0;
		bet_add_msg.seat_index = seat_data.seat_index;
		bet_add_msg.coin = old_bet_coin;
		bet_add_msg.total_coin = seat_data.bet_coin;
		userManager.send_to_room("betting", bet_add_msg, game.room_info.id);

		broadcast_user_state(game.room_info.id, seat_data, false)
		notice_user_holds_change(seat_data.user_id, seat_data.holds, [])

		//检测玩家是否可以再行动，如果可以再行动则继续，否则移动到下一家
		if (!check_can_action(seat_data)) {
			move_to_next_action(game);
		} else {
			//DO NOTHING
		}
	}
}

//投降
function surrender(game, seat_data, player_which_hand, msg, send_func) {
	if (game.turn != seat_data.seat_index) {
		return;
	}
	if (game.state != global.GAME_STATE_ACTION) {
		msg.error_code = error.FAILED;
		send_func(seat_data.user_id, game.room_info.id, msg);
		return;
	}
	//庄家不允许投降
	if (seat_data.seat_index == game.button) {
		return;
	}
	if (global.has_rule(seat_data.status_mask, global.USER_STATE_SURRENDER)) {
		return;
	}

	//投降必须是在没爆牌的情况下
	//按理是应该在停牌处理投降
	if (global.has_rule(seat_data.status_mask, global.USER_STATE_STAND1) || global.has_rule(seat_data.status_mask, global.USER_STATE_STAND2) || global.has_rule(seat_data.status_mask, global.USER_STATE_DOUBLE)) {
		return;
	}

	var card_type1 = seat_data.card_type[0]
	var card_type2 = seat_data.card_type[1]

	if (card_type1.type == global.BUST || card_type2.type == global.BUST) {
		return;
	}

	seat_data.status_mask += 0x01 << global.USER_STATE_SURRENDER;
	update_game_info(game);

	msg.error_code = error.SUCCESS;
	send_func(seat_data.user_id, game.room_info.id, msg);

	broadcast_user_state(game.room_info.id, seat_data, false);
	//投降后直接移动到下一家
	move_to_next_action(game);
}

//购买保险
function buy(game, seat_data, player_which_hand, msg, send_func) {
	if (game.turn != seat_data.seat_index) {
		return;
	}
	if (game.state != global.GAME_STATE_ACTION) {
		// msg.error_code = error.FAILED;
		// send_func(seat_data.user_id, game.room_info.id, msg);
		// return;
	}
	if (global.has_rule(seat_data.status_mask, global.USER_STATE_BUY)) {
		return;
	}

	//庄家不能卖保险
	if (seat_data.seat_index == game.button) {
		return;
	}

	//买保险 庄家第一个张牌必须是A
	var banker_seat = game.game_seats[game.button];

	var f = pokerUtils.get_poker_value(banker_seat.holds[0][0])
	// console.log("show me a value==============>",f)
	if (f != global.SPACIAL_A_VALUE) {
		return;
	}
	// console.log("status mask =================>",seat_data.status_mask)
	//必须在自己其它操作前买保险
	if (seat_data.status_mask > 2) {
		return;
	}

	if (seat_data.holds[0].length == 2 && seat_data.holds[1].length == 0) {
		seat_data.status_mask += 0x01 << global.USER_STATE_BUY;

		update_game_info(game);
		msg.error_code = error.SUCCESS;
		send_func(seat_data.user_id, game.room_info.id, msg);

		broadcast_user_state(game.room_info.id, seat_data, false);
	}
	return;

}
//玩家操作
exports.user_action = function (user_id, data) {
	var game = get_game_by_user(user_id);
	if (!game) return;
	var seat_index = get_seat_index(user_id);
	if (seat_index == null) return;
	var seat_data = game.game_seats[seat_index];
	if (seat_data == null) return;
	var data = JSON.parse(data);

	op_type = Number(data.action_type);//动作代码
	op_target = Number(data.action_target); //动作目标

	if (!op_type && !op_target) {
		return;
	}

	var msg = JSON.parse(msg_templete.SC_UserAction);
	msg.action_type = op_type;
	msg.seat_index = seat_index;
	msg.action_target = op_target;

	var send_msg = function (user_id, room_id, msg) {
		if (msg.error_code != error.SUCCESS) {
			userManager.sendMsg(user_id, 'user_action', msg);
		} else {
			userManager.send_to_room('user_action', msg, room_id);
		}
	}

	switch (op_type) {
		case global.OP_HIT:
			hit(game, seat_data, op_target, msg, send_msg);
			break;
		case global.OP_STAND:
			stand(game, seat_data, op_target, msg, send_msg);
			break;
		case global.OP_DOUBLE:
			double(game, seat_data, op_target, msg, send_msg);
			break;
		case global.OP_SPLIT:
			spliting(game, seat_data, op_target, msg, send_msg);
			break;
		case global.OP_SURRENDER:
			surrender(game, seat_data, op_target, msg, send_msg);
			break;
		case global.OP_BUY:
			buy(game, seat_data, op_target, msg, send_msg);
			break;
		default:
			msg.error_code = error.POINT_OP_INVALIED;
			send_msg(user_id, game.room_info.id, msg);
			break;
	}

}

//广播玩家的状态
function broadcast_user_state(room_id, seat_data, banker, open) {
	var msg = JSON.parse(msg_templete.SC_Point21State);
	msg.seat_index = seat_data.seat_index;
	if (banker && !open) {
		msg.type = [0, 0];
		msg.value = [0, 0];
	} else {
		msg.type = [seat_data.card_type[0].type, seat_data.card_type[1].type];
		msg.value = [seat_data.card_type[0].value, seat_data.card_type[1].value];
	}
	msg.status_mask = seat_data.status_mask;
	userManager.send_to_room('point21_state', msg, room_id);
}

//
function get_crypt_list(length) {
	var arr = [];
	for (var i = 0; i < length; ++i) {
		arr.push(-1);
	}
	return arr;
}
/**
 * 洗牌
 * @param {*} game
 */
function shuffle(game) {
	var poker = game.poker;
	var poker_nums = game.conf.poker_nums;// 固定等于52

	for (var i = 0; i < poker_nums; ++i) {
		poker[i] = i;
	}
}



// set ready
// 重新连接进来后的操作处理
exports.set_ready = function (user_id, status) {
	// all ready game begin
	var roomid = roomManager.getUserRoom(user_id);
	if (roomid == null) {
		return;
	}
	var room_info = roomManager.getRoom(roomid);
	if (room_info == null) {
		return;
	}
	var rd_who = roomManager.setReady(user_id, status);
	if (rd_who == 1) {
		var ready_msg = {
			userid: user_id,
			ready: status,
		}
		userManager.send_to_room('user_ready_push', ready_msg, roomid);
	}
	var game = games[roomid];
	if (game == null) {
		// new game
		// logger.debug("roominfo.seats.length %d seats_num %d",room_info.seats.length,room_info.seats_num);
		if (room_info.seats.length == room_info.seats_num || room_info.less_begin) {
			// TODO此处要添加在游戏中新进来的玩家
			var new_join_seats = [];
			for (var i = 0; i < room_info.seats_num; ++i) {
				var watch_seat = room_info.watch_seats[i];
				if (watch_seat) {
					if (watch_seat.user_id > 0 && watch_seat.join) {
						new_join_seats.push(i);
					}
				}
			}
			var new_begin_index = 0;
			for (var i = 0; i < new_join_seats.length; ++i) {
				var seat_info = room_info.watch_seats[new_join_seats[i]];
				seat_info.watch = false;
				if (user_id != seat_info.user_id) {
					seat_info.ready = false;
				}
				// 在开始游戏的身上寻找新的位置
				// if(seat_info.ready && userManager.isOnline(seat_info.user_id)){
				new_begin_index += 1;
				seat_info.seat_index = new_begin_index;
				var localtions = roomManager.getUserLocations();
				if (localtions[seat_info.user_id]) {
					if (localtions[seat_info.user_id].seatIndex != new_begin_index) {
						localtions[seat_info.user_id].seatIndex = new_begin_index;
					}
				}
				delete seat_info.join;
				room_info.seats[new_begin_index] = seat_info;
				room_info.watch_seats[new_join_seats[i]] = null;
				// 添加一个用户加入游戏的消息进入牌局
				var userData = {
					userid: seat_info.user_id,
					ip: seat_info.ip,
					score: seat_info.score,
					name: seat_info.name,
					online: userManager.isOnline(seat_info.user_id),
					ready: seat_info.ready,
					seatindex: seat_info.seat_index,
					holds: [],
					folds: [],
					watch: seat_info.watch,
				}
				userManager.broacastInRoom('new_user_comes_push', userData, seat_info.user_id, true);
				// }

			}
			roomManager.update_room_seat_info(roomid);
			var ready_player_count = 0;
			for (var i = 0; i < room_info.seats_num; ++i) {
				var s = room_info.seats[i];
				if (!s || s.user_id <= 0) continue;
				if (s.ready == false || userManager.isOnline(s.user_id) == false) {
					return;
				} else {
					ready_player_count += 1;
				}
			}
			if (ready_player_count < 2) return;
			begin(roomid);
		}
	} else {
		// logger.debug("has game check can begin  less_begin =%s",game.less_begin);
		// console.log(game.room_info.seats)
		// 如果游戏是结束状态
		if (game.state == global.GAME_STATE_FREE) {

			// TODO此处要添加在游戏中新进来的玩家
			var new_join_seats = [];
			for (var i = 0; i < room_info.seats_num; ++i) {
				var watch_seat = room_info.watch_seats[i];
				if (watch_seat) {
					if (watch_seat.user_id > 0 && watch_seat.join) {
						new_join_seats.push(i);
					}
				}
			}

			var new_begin_index = 0;
			for (var i = 0; i < room_info.seats_num; ++i) {
				var seat = game.game_seats[i];
				if (seat && seat.user_id > 0) {
					new_begin_index = i;
				}
			}

			for (var i = 0; i < new_join_seats.length; ++i) {
				var seat_info = room_info.watch_seats[new_join_seats[i]];
				seat_info.watch = false;
				if (user_id != seat_info.user_id) {
					seat_info.ready = false;
				}
				// 在开始游戏的身上寻找新的位置
				new_begin_index += 1;
				seat_info.seat_index = new_begin_index;
				var localtions = roomManager.getUserLocations();
				if (localtions[seat_info.user_id]) {
					if (localtions[seat_info.user_id].seatIndex != new_begin_index) {
						localtions[seat_info.user_id].seatIndex = new_begin_index;
					}
				}
				delete seat_info.join;
				room_info.seats[new_begin_index] = seat_info;
				room_info.watch_seats[new_join_seats[i]] = null;
				// 添加一个用户加入游戏的消息进入牌局
				var userData = {
					userid: seat_info.user_id,
					ip: seat_info.ip,
					score: seat_info.score,
					name: seat_info.name,
					online: userManager.isOnline(seat_info.user_id),
					ready: seat_info.ready,
					seatindex: seat_info.seat_index,
					holds: [],
					folds: [],
					watch: seat_info.watch,
				}
				userManager.broacastInRoom('new_user_comes_push', userData, seat_info.user_id, true);

			}
			roomManager.update_room_seat_info(roomid);
			var ready_player_count = 0;
			// 检测是否可以开始游戏
			if (room_info.seats.length == room_info.seats_num || game.less_begin) {
				for (var i = 0; i < room_info.seats_num; ++i) {
					var s = room_info.seats[i];
					if (!s || s.user_id <= 0) continue;
					if (s.ready == false || userManager.isOnline(s.user_id) == false) {
						return;
					} else {
						ready_player_count += 1;
					}
				}
				if (ready_player_count < 2) return;
				begin(roomid);
				return;
			}
		}
		var num_of_poker = game.poker.length - game.current_index;
		var remaining_games = room_info.conf.max_game - room_info.num_of_games;

		var data = {
			state: game.state,
			num_of_pokers: num_of_poker,
			button: game.button,
			turn: game.turn,
		};

		// 活人
		data.seats = [];

		for (var i = 0; i < room_info.seats_num; ++i) {
			var seat_data = game.game_seats[i];
			if (!seat_data) continue;
			//庄家特殊处理，手牌，手牌类型。
			var display_holds = []
			if (seat_data.holds.length == 0) {
				display_holds.push([]);
				display_holds.push([]);
			} else {
				display_holds.push(seat_data.holds[0].slice());
				display_holds.push(seat_data.holds[1].slice());
			}
			var display_card_type = [];
			if (seat_data.card_type.length == 0) {
				display_card_type.push({});
				display_card_type.push({});
			} else {
				display_card_type.push(seat_data.card_type[0]);
				display_card_type.push(seat_data.card_type[1]);
			}
			var type = [];
			var value = [];
			if (get_seat_index(user_id) != game.button) {
				if (seat_data.seat_index == game.button) {
					if (display_holds[1].length == 0) {
						if(display_holds[0].length !=0){
							display_holds[0][1] = -1;
						}
						type = [0, 0];
						value = [0, 0];
					} else {
						type = [display_card_type[0].type, display_card_type[1].type];
						value = [display_card_type[0].value, display_card_type[1].value];
					}
				} else {
					type = [display_card_type[0].type, display_card_type[1].type];
					value = [display_card_type[0].value, display_card_type[1].value];
				}
			} else {
				type = [display_card_type[0].type, display_card_type[1].type];
				value = [display_card_type[0].value, display_card_type[1].value];
			}
			var tmp = {
				user_id: seat_data.user_id,
				seat_index: seat_data.seat_index,
				holds: display_holds,
				folds: seat_data.folds,
				bet_coin: seat_data.bet_coin,
				type: type,
				value: value,
				status_mask: seat_data.status_mask,
			}
			data.seats.push(tmp);
		}

		for (var i = 0; i < room_info.seats_num; ++i) {
			var watch_seat = room_info.watch_seats[i];
			if (watch_seat) {
				if (watch_seat.user_id > 0) {
					var tmp = {
						user_id: watch_seat.user_id,
						seat_index: watch_seat.seat_index,
						holds: [[], []],
						folds: [[], []],
						bet_coin: 0,
						type: [0, 0],
						value: [0, 0],
						status_mask: 0,
						join: watch_seat.join,
					}
					data.seats.push(tmp);
				}
			}
		}
		userManager.sendMsg(user_id, 'game_sync_push', JSON.stringify(data));

		// 如果有解散信息发出解散信息
		if (game.room_info.dissmiss) {
			var ramaingTime = (game.room_info.dissmiss.endTime - Date.now()) / 1000;
			var dis_info = {
				mask: game.room_info.dissmiss.chose_index,
				time: ramaingTime,
				states: game.room_info.dissmiss.states
			}
			userManager.sendMsg(user_id, 'dissolve_notice_push', dis_info);
		}
	}
}

function init_game_base(room_id) {
	logger.debug('game begin  room_id = %d', room_id);
	var roominfo = roomManager.getRoom(room_id);
	if (roominfo == null) {
		return;
	}
	var game = games[room_id]
	if (game == null) {
		var seats = roominfo.seats;

		game = {
			conf: roominfo.conf, // 房间配置
			room_info: roominfo, // 房间信息
			game_index: roominfo.num_of_games,// 当前游戏局数
			button: roominfo.next_button,// 庄家标记
			seats_num: roominfo.seats_num,
			current_index: 0, // 当前牌的索引(发牌用)
			poker: new Array(roominfo.conf.poker_nums),
			game_seats: new Array(roominfo.seats_num),
			turn: 0,
			state: global.GAME_STATE_FREE,
			// 此4个可变参数移动到房间上去保存
			less_begin: roominfo.change_info.less_begin,
			next_banker: roominfo.change_info.next_banker,
		}

		for (var i = 0; i < roominfo.seats_num; ++i) {
			// 更具具体的玩家来初始化game_seats的长度
			var seat_data = seats[i];
			if (!seat_data) continue
			var data = {
				seat_index: i,
				user_id: seat_data.user_id,
				holds: [],
				folds: [],
				action: [],
				bet_coin: 0,
				call_banker: -1,
				statistic: seat_data.statistic,
				card_type: [],
				status_mask: 0,

			}
			game.game_seats[i] = data;
			game_seats_of_user[data.user_id] = data;
		}
		games[room_id] = game;
	}
}

/**
 * 游戏结束
 *
 * 1. 比牌
 * 2. 计算输赢
 * 3. 获得赔率
 */
function game_end(room_id, force, over) {
	if (force != true) { force = false; };
	if (over != false) { over = true; };
	// check is game over
	var is_game_over = false;

	var game = games[room_id];
	if (game == null) {
		// 如果游戏为空,将利用room_info 上的数据进行结算
		var room = roomManager.getRoom(room_id);
		if (room == null) return;
		// add game end result
		var msg = JSON.parse(msg_templete.SC_game_end);
		// 新增解散标记
		msg.force = force;
		for (var i = 0; i < room.seats_num; ++i) {
			var seat = room.seats[i];
			if (seat && seat.user_id > 0) {
				var data = {
					user_id: seat.user_id,
					holds: [],
					card_type: {},
					bet_coin: 0,
					end_score: 0,
					total_score: seat.statistic.total_score
				}
				msg.end_seats_data.push(data);
			}

		}
		userManager.send_to_room('game_over', msg, room_id)
		game_over(room_id, force);
		return;
	}
	// add game end result
	var msg = JSON.parse(msg_templete.SC_game_end);
	// 新增解散标记
	msg.force = force;

	var score = {};// 最终分数
	var card_type_list = {};// 牌型列表


	if (!force) {
		//非强制结算才需要去计算分
		var banker_seat = game.game_seats[game.button];
		var banker_card_type = pokerUtils.check_card_type(banker_seat.holds[0]);
		card_type_list[game.button] = [banker_card_type];
		for (var i = 0; i < game.game_seats.length; ++i) {
			if (i != game.button) {
				var user_seat = game.game_seats[i];
				if (user_seat && user_seat.user_id > 0) {
					//确认玩家真实存在就比较大小计算分值
					var user_card_type = [];
					user_card_type.push(pokerUtils.check_card_type(user_seat.holds[0]));
					if (global.has_rule(user_seat.status_mask, global.USER_STATE_SPLIT)) {
						//如果第一副牌是黑JACK，将重置成21点
						if (user_card_type[0].type == global.BLACK_JACK) {
							user_card_type[0].type = global.EQUAL_21;
						}
						var ttpp = pokerUtils.check_card_type(user_seat.holds[1])
						if (ttpp.type == global.BLACK_JACK) {
							ttpp.type = global.EQUAL_21;
						}
						user_card_type.push(ttpp);
					}
					card_type_list[i] = user_card_type;

					//获取到了牌型，比较大小，确定输赢和倍率
					var cdl = user_card_type.length;
					for (var x = 0; x < cdl; ++x) {
						var r = pokerUtils.compare(banker_card_type, user_card_type[x]);

						if (r == true) {
							//庄家赢
							var tt = pokerUtils.get_times(banker_card_type);
							if (!score[game.button]) {
								score[game.button] = 0;
							}
							if (!score[i]) {
								score[i] = 0;
							}
							var half = 1;
							if (global.has_rule(user_seat.status, global.USER_STATE_BUY)) {
								half = 2;
							}

							score[game.button] += user_seat.bet_coin / cdl * tt / half;
							score[i] -= user_seat.bet_coin / cdl * tt / half;

						}

						if (r == false) {
							//玩家赢
							var tt = pokerUtils.get_times(user_card_type[x]);

							if (!score[game.button]) {
								score[game.button] = 0;
							}
							if (!score[i]) {
								score[i] = 0;
							}

							score[i] += user_seat.bet_coin / cdl * tt;
							score[game.button] -= user_seat.bet_coin / cdl * tt;

						}

						if (r == null) {
							//平手
							if (!score[game.button]) {
								score[game.button] = 0;
							}
							if (!score[i]) {
								score[i] = 0;
							}
							//平手无输赢
						}
					}
				}
			}
		}
	}
	// END FORCE
	// console.error("show me card_type =====>",card_type_list);
	// console.error("show me score =========>",score)

	var len = game.game_seats.length;
	for (var i = 0; i < len; ++i) {
		var seat_data = game.game_seats[i];
		if (seat_data && seat_data.user_id > 0) {
			var seat_statistic = game.game_seats[i].statistic;
			var coin = score[i];
			if (!coin) {
				coin = 0;
			}
			var card_type_tmp = card_type_list[i];
			var card_type = []

			if (card_type_tmp) {
				for (var x = 0; x < card_type_tmp.length; ++x) {
					var tmp = {}
					tmp.type = card_type_tmp[x].type;
					tmp.max_value = card_type_tmp[x].max_value;

					if (!seat_statistic.point21_type_count[tmp.type]) {
						seat_statistic.point21_type_count[tmp.type] = 0;
					}
					seat_statistic.point21_type_count[tmp.type] += 1;

					card_type.push(tmp);
				}
			}

			seat_statistic.total_score += coin;

			game.room_info.seats[i].score = seat_statistic.total_score;

			game.room_info.seats[i].statistic = seat_statistic
			
			var data = {
				user_id: game.game_seats[i].user_id,
				holds: game.game_seats[i].holds,
				card_type: card_type,
				bet_coin: seat_data.bet_coin,
				end_score: coin,
				total_score: seat_statistic.total_score,
				status_mask: game.game_seats[i].status_mask,
			}
			msg.end_seats_data.push(data);
		}
	}

	// 游戏状态改变
	game.state = global.GAME_STATE_FREE
	notice_game_state(game.room_info.id, game.state);

	// 游戏结果
	userManager.send_to_room('game_over', msg, game.room_info.id)

	// 清除玩家状态

	// 清理上一局玩家状态
	for (var i = 0; i < game.seats_num; ++i) {
		var seat_data = game.game_seats[i];
		if (!seat_data) continue;
		seat_data.holds = [];
		seat_data.folds = [];
		seat_data.action = [];
		seat_data.bet_coin = 0;
		seat_data.call_banker = -1;
		seat_data.status_mask = 0;

		exports.set_ready(seat_data.user_id, false);
	}
	// poker数组
	// 是否写入历史记录
	if (game.game_index == game.room_info.conf.max_games || (force && over)) {
		is_game_over = true
	}

	// 如果是第一局扣除房主金币
	if (!force) {
		if(!game.conf.free && (!game.room_info.agent_user_id || game.room_info.agent_user_id==0)){
			// 房卡游戏
			if (global.has_rule(game.conf.rule_index, global.MASK_INGOT_GAME)) {
				if (game.game_index == 1) {
					var ingot_value = global.get_ingot_value(game.conf.rule_index);
					user_lose_ingot(game.conf.creator, ingot_value);
				}
			}
			// 金币游戏
			if (global.has_rule(game.conf.rule_index, global.MASK_GOLD_GAME)) {
				// 检测每位玩家是否是第一局，如果是第一局就扣除所有玩家一份金币
				// 因为此处并不允许缺人开始，所以仅仅是第一局的时候就可以扣除每个玩家的金币
				for (var i = 0; i < game.room_info.seats_num; ++i) {
					var r_s = game.room_info.seats[i];
					if (r_s && r_s.user_id > 0) {
						r_s.game_counts += 1;
					}
				}
				var gold_value = global.get_ingot_value(game.conf.rule_index);
				for (var i = 0; i < game.room_info.seats_num; ++i) {
					var seat_d = game.room_info.seats[i];
					if (seat_d && seat_d.user_id > 0 && seat_d.game_counts >= 1 && seat_d.pay == false) {
						user_lose_gold(seat_d.user_id, gold_value)
						seat_d.pay = true;
					}
				}
			}
		}
		roomManager.update_room_seat_info(room_id);
	}

	//如果是轮庄 这里要存储庄家信息
	if(global.has_rule(game.conf.rule_index,global.TURN_BANKER)){
		// console.log("are we in???????????????????????")
		game.room_info.change_info.next_banker = (game.button +1)%get_game_realplayernum(game);
	}
	// console.error(game.room_info.change_info)
	// 将数据存放到数据库
	update_room_info(game, true, score, force);

	if (is_game_over) {
		game_over(room_id, force);
		return;
	}
}

/**
 * 到达游戏局数, 游戏结束, 发送统计信息
 * @param {*} room_id
 * @param {*} force
 * @param {*} off_banker
 */
function game_over(room_id, force, off_banker) {
	if (force != true) { force = false; };
	if (off_banker != true) { off_banker = false; }
	var game = games[room_id];
	if (game == null) {
		// 房间结算，游戏中不结算
		var room = roomManager.getRoom(room_id);
		if (room == null) return;
		var msg = JSON.parse(msg_templete.SC_game_over);

		for (var i = 0; i < room.seats_num; ++i) {
			var seat_data = room.seats[i];
			if (seat_data && seat_data.user_id > 0) {
				var seat_statistic = room.seats[i].statistic;
				// 结算数据, 针对每个玩家
				var data = {
					banker_count: seat_statistic.banker_count,
					point21_type_count: seat_statistic.point21_type_count,
					total_score: seat_statistic.total_score,
				}
				msg.over_seats_data.push(data);
			}
		}
		userManager.send_to_room('game_result', msg, room_id);
		// chean 玩家身上的数据
		// 清除掉游戏
		userManager.kickAllInRoom(room_id);
		var reason = (force) ? global.ROOM_ACHIVE_DIS : global.ROOM_ACHIVE_OVER;
		roomManager.destroy(room_id, reason);
		return;
	}
	var msg = JSON.parse(msg_templete.SC_game_over);
	msg.off_banker = off_banker;
	for (var i = 0; i < game.seats_num; ++i) {
		var seat_data = game.game_seats[i];
		if (!seat_data || seat_data.user_id <= 0) continue;
		var seat_statistic = game.game_seats[i].statistic;
		var data = {
			banker_count: seat_statistic.banker_count,
			point21_type_count: seat_statistic.point21_type_count,
			total_score: seat_statistic.total_score,
		}
		msg.over_seats_data.push(data);
	}
	userManager.send_to_room('game_result', msg, room_id);
	// chean 玩家身上的数据
	// 清除掉游戏
	userManager.kickAllInRoom(room_id);
	var reason = (force) ? global.ROOM_ACHIVE_DIS : global.ROOM_ACHIVE_OVER;
	roomManager.destroy(room_id, reason);
	games[room_id] == null;
}
/** 游戏结束 */

/**
 *初始化数据到数据库
 */
function init_game_base_info(game) {
	data = {}
	data.uuid = game.room_info.uuid;
	data.game_index = game.room_info.num_of_games;
	data.create_time = game.room_info.create_time;
	// 基础信息
	data.base_info = {
		conf: game.conf,
		seats_num: game.seats_num,
		poker: game.poker
	};
	data.holds = [];
	data.folds = [];
	data.actions = [];
	data.result = [];
	// 统计信息
	data.statistic = [];
	// 变化信息
	data.change_info = {
		state: game.state,
		button: game.button,
		turn: game.turn,
		less_begin: game.less_begin,// 缺人开始
		current_index: game.current_index, //当前发牌的位置
		call_banker_list: [],// 叫庄数据列表
		bet_coin_list: [],// 押注列表
		status_mask_list: [],//用户状态掩码列表
	}
	for (var i = 0; i < game.game_seats.length; ++i) {
		var seats_data = game.game_seats[i];
		if (!seats_data) continue;
		data.holds.push(seats_data.holds);
		data.folds.push(seats_data.folds);
		data.actions.push(seats_data.action);
		data.result.push(0);
		data.statistic.push(seats_data.statistic);
		data.change_info.call_banker_list.push(seats_data.call_banker);
		data.change_info.bet_coin_list.push(seats_data.bet_coin);
		data.change_info.status_mask_list.push(seats_data.status_mask);
	}
	logger.debug("Init game base Info to DB===>", JSON.stringify(data));
	db.init_game_base_info(data, function (err, rows, fileds) {
		if (err) {
			logger.error(err.stack);
			return;
		}
		if (rows[0][0].result != 1) {
			logger.warn('init game to db result = %d', rows[0][0].result);
		}
	});
}

/**
 * 获取需要(实时)更新的数据
 *
 */
function get_game_update_info(game) {
	var data = {};
	data.room_uuid = game.room_info.uuid;
	data.game_index = game.room_info.num_of_games;
	data.holds = [];
	data.folds = [];
	data.actions = [];
	data.change_info = {
		state: game.state,
		button: game.button,
		turn: game.turn,
		less_begin: game.less_begin,
		current_index:game.current_index,
		call_banker_list: [],                      // 叫庄数据列表
		bet_coin_list: [],                         // 押注列表
		status_mask_list: [],                       // 玩家状态掩码列表
		// added 解散信息 此处需要添加一些游戏中生成的临时状态
		dissmiss: game.room_info.dissmiss,
	}
	// data.result =[];
	for (var i = 0; i < game.game_seats.length; ++i) {
		var seats_data = game.game_seats[i];
		if (!seats_data) continue;
		data.holds.push(seats_data.holds);
		data.folds.push(seats_data.folds);
		data.actions.push(seats_data.action);
		data.change_info.call_banker_list.push(seats_data.call_banker);
		data.change_info.bet_coin_list.push(seats_data.bet_coin);
		data.change_info.status_mask_list.push(seats_data.status_mask);
		// TODO 可变信息缺少一个解散信息
	}
	return data;
}
/**
 * 实时更新游戏每个步骤
 *
 * @param {*} game
 */
function update_game_info(game) {
	var data = get_game_update_info(game);
	logger.debug("Update game info to DB===>", JSON.stringify(data));
	var self = this;
	db.update_game_info(data, function (err, rows, fileds) {
		if (err) {
			logger.error(err.stack);
			return;
		}
		if (rows[0][0].result != 1) {
			logger.warn('update game info get result = %d', rows[0][0].result);
		}
	});
}

/**
 * 从数据库中加载游戏
 *
 * @param {*} game
 */
function load_game_from_db(game) {
	var ret = null;
	db.load_game_from_db(game.room_info.room_uuid, function (err, rows, fields) {
		if (err) {
			logger.error(err.stack);
			return;
		}
	});
}

/**
 * 更新房间信息
 * @param {*} game
 * @param {*} is_game_end
 * @param {*} score
 * @param {*} force
 */
function update_room_info(game, is_game_end, score, force) {
	if (is_game_end != true) {
		is_game_end = false;
	}
	if (score == null) { score = []; };
	if (force != true) { force = false; };
	// 游戏轮数
	var data = {
		room_uuid: game.room_info.uuid,
		game_index: game.game_index,
		less_begin: game.room_info.less_begin,
		score_list: [],
		change_info: game.room_info.change_info
	};
	for (var i = 0; i < game.seats_num; ++i) {
		var seat_data = game.game_seats[i]
		if (!seat_data) continue;
		var seat_statistic = seat_data.statistic;
		data.score_list.push(seat_statistic.total_score);
		// 添加断线重连积分
		game.room_info.seats[i].score = seat_statistic.total_score;
	}
	// console.log("call update room info ====>",data)
	db.update_room_info(data, function (err, rows, fields) {
		if (err) {
			logger.error(err.stack);
			return;
		}
		if (is_game_end) {
			// 强制解散
			var par = {
				room_uuid: game.room_info.uuid,
				game_index: game.game_index,
				force: Number(force),
				result: score
			};
			store_game(par);
		}
	});
}

/**
 * 游戏结束后将结果存放入固定的表
 * @param {*} args
 */
function store_game(args) {
	// 需要结果
	// 如果是强制解散则清理掉这条记录
	// 将整个游戏移动到archive中
	db.add_result_achive_game(args, function (err, rows, fields) {
		if (err) {
			logger.error(err.stack);
		}
		if (rows[0][0].result != 1) {
			logger.warn("add result achive game get result = %d", rows[0][0].result);
		}
	});
}

/**
 * 从数据库实例化游戏
 *
 */
exports.init_game_from_db = function (db_data, room_info) {
	var room_id = db_data.id;
	if (room_id == null) return;
	var game = games[db_data.id];
	if (game == null) {
		// 游戏不存在初始化
		var base_info = JSON.parse(db_data.gamebaseinfo);
		var action_list = JSON.parse(db_data.actions);
		var result_list = JSON.parse(db_data.result);
		var statistic = JSON.parse(db_data.statistic);
		var change_info = JSON.parse(db_data.change_info);
		var holds = JSON.parse(db_data.holds);
		var folds = JSON.parse(db_data.folds);
		var game_index = db.num_of_turns;
		var seats = room_info.seats;
		game = {
			conf: base_info.conf,
			room_info: room_info,
			game_index: room_info.num_of_games,
			button: change_info.button,
			turn: change_info.turn,
			seats_num: base_info.seats_num,
			current_index: change_info.current_index,
			poker: base_info.poker,
			game_seats: new Array(room_info.seats_num),
			state: change_info.state,
			less_begin: change_info.less_begin,
		}
		// 初始化其它信息
		for (var i = 0; i < room_info.seats_num; ++i) {
			var seat = seats[i];
			if (!seat) continue;
			var data = game.game_seats[i] = {};
			data.seat_index = i;
			data.user_id = seats[i].user_id;
			data.holds = holds[i];
			data.folds = folds[i];
			data.action = action_list[i];
			data.statistic = statistic[i];
			data.call_banker = change_info.call_banker_list[i]
			data.bet_coin = change_info.bet_coin_list[i];
			data.status_mask = change_info.status_mask_list[i];
			data.card_type = [];
			if (holds[i].length == 1) {
				var ct_t1 = pokerUtils.check_card_type(holds[i][0].slice());
				data.card_type[0] = { type: ct_t1.type, value: ct_t1.max_value };
				var ct_t2 = pokerUtils.check_card_type([]);
				daya.card_type[1] = { type: ct_t2.type, value: ct_t2.max_value };
			}
			if (holds[i].length == 2) {
				var ct_t1 = pokerUtils.check_card_type(holds[i][0].slice());
				data.card_type[0] = { type: ct_t1.type, value: ct_t1.max_value };
				var ct_t2 = pokerUtils.check_card_type(holds[i][1].slice());
				data.card_type[1] = { type: ct_t2.type, value: ct_t2.max_value };
			}
			game_seats_of_user[data.user_id] = data;
		}
		// 增加解散信息
		if (change_info.dissmiss) {
			room_info.dissmiss = change_info.dissmiss;
			apply_dissmiss_room[room_id];
		}
		games[room_id] = game;
		// console.log("load game from db---->", game)
		// console.log("load game from db---->",games)
		// 初始化可变信息
	} else {
		// TODO确定是否要更新
	}
}

/**
 * 通过用户ID获取游戏数据
 * @param {*} user_id
 */
function get_game_by_user(user_id) {
	var room_id = roomManager.getUserRoom(user_id);
	if (room_id == null) {
		return null;
	}
	var game = games[room_id];
	return game;
}

/**
 * 通过用户ID获取座位号
 * @param {*} user_id
 */
function get_seat_index(user_id) {
	return roomManager.getUserSeat(user_id);
}


/**
 * 玩家扣除钻石
 * @param {*} user_id
 * @param {*} ingot_value
 */
function user_lose_ingot(user_id, ingot_value) {
	logger.debug("user[%d] lose ingot[ingot_value].....", user_id, ingot_value);
	db.cost_ingot(user_id, ingot_value, function (error, rows, fileds) {
		if (error) {
			logger.error(error.stack);
			return;
		}
		if (rows[0][0].result != 1) {
			logger.warn('user lose ingot db result = %d', rows[0][0].result);
		} else {
			logger_manager.insert_ingot_log(user_id, user_id, 0, log_point.INGOT_COST_OPEN, ingot_value, rows[0][0].now_ingot);
		}
	});
}

/**
 * 玩家扣除金币
 * @param {*} user_id
 * @param {*} gold_value
 */
function user_lose_gold(user_id, gold_value) {
	logger.debug("user[%d] lose gold[gold_value].....", user_id, gold_value);
	db.cost_gold(user_id, gold_value, function (error, rows, fileds) {
		if (error) {
			logger.error(error.stack);
			return;
		}
		if (rows[0][0].result != 1) {
			logger.warn('user lose gold db result = %d', rows[0][0].result);
		} else {
			logger_manager.insert_gold_log(user_id, user_id, 0, log_point.GOLD_COST_OPEN, gold_value, rows[0][0].now_gold);
		}
	});
}

/**
 * 广播手牌变化
 * @param {*} user_id
 * @param {*} holds
 * @param {*} folds
 * @param {*} show_all
 */
function notice_user_holds_change(user_id, holds, folds, show_all) {
	if (show_all != true) { show_all = false; };
	var game = get_game_by_user(user_id);
	var seat_index = get_seat_index(user_id);
	var seat_data = game.game_seats[seat_index]

	// 判断是否需要显示牌,需要根据规则来判断是否要显示牌
	var close_card = 0;
	var crypt_msg = {
		user_id: user_id,
		holds: [],
		folds: folds,
	};
	var player_holds = [];
	player_holds.push(holds[0].slice());
	player_holds.push(holds[1].slice())
	if (seat_index == game.button) {
		if (!show_all) {
			// if (player_holds[1].length == 0 && game.turn !== game.button) {
			//   player_holds[0][1] = -1;
			// }
			if (!global.has_rule(seat_data.status_mask, global.USER_STATE_BUTTON_IS_OPENED)) {
				player_holds[0][1] = -1;
			}
		}
	}

	for (var i = 0; i < game.game_seats.length; ++i) {
		var send_seat = game.game_seats[i];
		if (send_seat && send_seat.user_id > 0) {
			if (send_seat.seat_index == game.button) {
				//庄家全部明牌
				crypt_msg.holds = holds;
				userManager.sendMsg(send_seat.user_id, 'game_holds_push', crypt_msg);
			} else {
				if (show_all) {
					crypt_msg.holds = holds;
				} else {
					crypt_msg.holds = player_holds;
				}
				userManager.sendMsg(send_seat.user_id, 'game_holds_push', crypt_msg);
			}
		}
	}

	var watch_seats = game.room_info.watch_seats;
	for (var i = 0; i < watch_seats.length; ++i) {
		var watch_seat = watch_seats[i];
		if (watch_seat) {
			if (watch_seat.user_id > 0) {
				crypt_msg.holds = player_holds;
				if (show_all) {
					crypt_msg.holds = holds;
				}
				userManager.sendMsg(watch_seat.user_id, 'game_holds_push', crypt_msg);
			}
		}
	}
	//userManager.send_to_room('game_holds_push', crypt_msg, game.room_info.id);
}

/**
 * 游戏状态广播
 * @param {*} room_id
 * @param {*} game_state
 */
function notice_game_state(room_id, game_state) {
	var msg = JSON.parse(msg_templete.SC_game_state);
	msg.state = game_state;
	userManager.send_to_room("game_state_push", msg, room_id);
}

/**
 * 确定游戏没有开始
 */
exports.has_began = function (room_id) {
	var game = games[room_id];
	if (game == null) return false;
	if (game.state != global.GAME_STATE_FREE || game.game_index != 0) {
		return true;
	}
	return false;
}

/**
 * 确定玩家是直接进入游戏还是进入观众席
 */
exports.can_join = function (room_id) {
	var game = games[room_id];
	if (game == null) return true;
	if (game.state == global.GAME_STATE_FREE) return true;
	return false;
}

/**
 * 申请解散游戏
 */
exports.apply_dissmiss = function (room_id, user_id) {
	var room_info = roomManager.getRoom(room_id);
	if (room_info == null) {
		return null;
	}
	if (room_info.dissmiss != null) {
		return null;
	}
	var seatIndex = roomManager.getUserSeat(user_id);
	if (seatIndex == null) {
		return null;
	}
	// 观察玩家不能参与游戏动作
	if (room_info.watch_seats[seatIndex]) {
		if (room_info.watch_seats[seatIndex].user_id == user_id) {
			return;
		}
	}
	room_info.dissmiss = {
		chose_index: 0,
		endTime: Date.now() + global.DISMISS_TIME,
		states: []
	};
	for (var i = 0; i < room_info.seats_num; ++i) {
		if (room_info.seats[i] && room_info.seats[i].user_id > 0) {
			room_info.dissmiss.states.push(false);
		}
	}
	room_info.dissmiss.states[seatIndex] = true;
	room_info.dissmiss.chose_index += 0x01 << (seatIndex + 1);
	// 设置超时强制解散
	var timer = setTimeout(function () {
		exports.force_over_room(room_id);
	}, global.DISMISS_TIME);

	apply_dissmiss_room.push(room_id);
	apply_dissmiss_timer[room_id] = timer;
	return room_info;
}
/**
 * 操作
 */
exports.dissolve_operation = function (room_id, user_id, agree) {
	var room_info = roomManager.getRoom(room_id);
	if (room_info == null) return null;
	if (room_info.dissmiss == null) return null;
	var seat_index = roomManager.getUserSeat(user_id);
	if (seat_index == null) return null;

	// 观察玩家不需要加入投票中
	if (room_info.watch_seats[seat_index]) {
		if (room_info.watch_seats[seat_index].user_id == user_id) {
			return;
		}
	}
	// 如果已经做了选择就不让再选择了
	if ((room_info.dissmiss.chose_index & (0x01 << (seat_index + 1))) != 0) {
		return null;
	}
	// 同意
	if (agree == true) {
		room_info.dissmiss.states[seat_index] = true;
		room_info.dissmiss.chose_index += 0x01 << (seat_index + 1);
	} else {
		// 拒绝
		room_info.dissmiss = null;
		var index = apply_dissmiss_room.indexOf(room_id);
		if (index != -1) {
			apply_dissmiss_room.splice(index, 1);
		}
		// 取消超时强制解散
		var timer = apply_dissmiss_timer[room_id];
		if (timer != null) {
			clearTimeout(timer);
			apply_dissmiss_timer[room_id] = null;
		}
	}
	return room_info;
}

/**
 * 强制解散房间
 */
exports.force_over_room = function (room_id) {
	var room_info = roomManager.getRoom(room_id);
	if (room_info == null) {
		return null;
	}
	game_end(room_id, true, true);
}

/**
 * 导出的方法
 */
exports.get_game_by_user = function (user_id) {
	return get_game_by_user(user_id);
}


/**
 * 牛牛主动开始游戏(玩家未满时)
 */
exports.start_play = function (user_id) {
	var game = get_game_by_user(user_id);
	if (game == null) {
		// 如果提前开始，必须得初始化游戏内容
		var room_id = roomManager.getUserRoom(user_id);
		if (room_id == null) return;
		init_game_base(room_id);
		game = games[room_id];
	} else {
		if (game.game_index > 1) {
			logger.warn('game exsits can not start play.')
			return;
		}
	}
	// 只有房主能决定是否在人数未满的时候开始游戏
	console.log(game.conf.creator)
	if (game.conf.creator != user_id) {
		logger.warn('user[%d] not creator [%d]', user_id, game.conf.creator);
		return;
	}
	var seat_index = get_seat_index(user_id);
	if (seat_index == null) {
		logger.warn('user seat index none.')
		return;
	}
	var room_info = game.room_info;
	var player_num = get_game_realplayernum(game);
	if (player_num < 2) {
		logger.warn("start play player less than 2.");
		return;
	}
	// 修改状态为下注状态
	game.state = global.GAME_STATE_FREE;
	var msg = JSON.parse(msg_templete.SC_StartPlay);
	msg.start_user_id = user_id;
	msg.error_code = error.SUCCESS;
	msg.state = game.state;
	userManager.send_to_room('start_play', msg, game.room_info.id);

	room_info.start_choice = {
		choice_index: (0x01 << (seat_index + 1)),
		agree_list: {}
	}
	var msg2 = JSON.parse(msg_templete.SC_StartPlay_Choice);
	msg2.choice_index = (0x01 << (seat_index + 1));
	msg2.user_id = user_id;
	msg2.user_index = seat_index;
	msg2.agree_list[seat_index] = 1;
	room_info.start_choice.agree_list[seat_index] = 1;

	userManager.send_to_room('start_play_choice', msg2, game.room_info.id);

	var timer = setTimeout(function () {
		start_play_failed(game.room_info.id);
	}, global.START_PLAY_TIME);
	start_play_room.push(game.room_info.id);
	start_play_timer[game.room_info.id] = timer;
}

/**
 * 提前开始失败
 * @param {*} room_id
 */
function start_play_failed(room_id) {
	var room_info = roomManager.getRoom(room_id);
	if (room_info == null) return;
	// TODO此处需要注意是否要更新到数据库
	var msg = JSON.parse(msg_templete.SC_StartPlay_End)
	msg.success = 0;
	msg.seat_index = 0;
	userManager.send_to_room('start_play_end', msg, room_info.id);

	// 移除掉定时器
	room_info.start_choice = null;
	var index = start_play_room.indexOf(room_id);
	if (index != -1) {
		start_play_room.splice(index, 1);
	}
	var timer = start_play_timer[room_id];
	if (timer != null) {
		clearTimeout(timer);
		start_play_timer[room_id] = null;
	}
}

/**
 * 开始游戏通知
 */
exports.start_play_choice = function (user_id, data) {
	data = JSON.parse(data);
	var game = get_game_by_user(user_id);
	if (game == null) {
		logger.warn('game is None');
		return;
	}
	// 如果全部都同意提前开始，则游戏提前开始
	if (game.state != global.GAME_STATE_FREE) {
		logger.warn('game state not free.')
		return;
	}

	if (data.agree != 0 && data.agree != 1) {
		logger.warn('client args error.', data.agree);
		return;
	}

	var room_info = game.room_info;
	var seat_index = get_seat_index(user_id);
	// 已经选择了，不能让其再次选择
	if (room_info.start_choice == null) {
		logger.warn('start choice is None.')
		return;
	} else {
		if (room_info.start_choice.choice_index & (0x01 << (seat_index + 1))) {
			logger.warn('has made choice.')
			return;
		}
	}
	if (data.agree == 0) {
		// 有人拒绝，结束
		room_info.start_choice.choice_index += 0x01 << (seat_index + 1);
		room_info.start_choice.agree_list[seat_index] = data.agree;

		var msg = JSON.parse(msg_templete.SC_StartPlay_Choice);
		msg.choice_index = room_info.start_choice.choice_index;
		msg.user_id = user_id;
		msg.user_index = seat_index;
		msg.agree_list = room_info.start_choice.agree_list;

		userManager.send_to_room('start_play_choice', msg, room_info.id);

		var msg = JSON.parse(msg_templete.SC_StartPlay_End)
		msg.success = 0;
		msg.seat_index = seat_index;
		userManager.send_to_room('start_play_end', msg, room_info.id);

		// 移除掉定时器
		room_info.start_choice = null;
		var index = start_play_room.indexOf(game.room_info.id);
		if (index != -1) {
			start_play_room.splice(index, 1);
		}
		var timer = start_play_timer[game.room_info.id];
		if (timer != null) {
			clearTimeout(timer);
			start_play_timer[game.room_info.id] = null;
		}
		return;
	}

	room_info.start_choice.choice_index += 0x01 << (seat_index + 1);
	room_info.start_choice.agree_list[seat_index] = data.agree;

	var msg = JSON.parse(msg_templete.SC_StartPlay_Choice);
	msg.choice_index = room_info.start_choice.choice_index;
	msg.user_id = user_id;
	msg.user_index = seat_index;
	msg.agree_list = room_info.start_choice.agree_list;

	userManager.send_to_room('start_play_choice', msg, room_info.id);

	console.log("check can start game")
	var all_choice = true;
	var seats_length = room_info.seats.length
	for (var i = 0; i < seats_length; ++i) {
		var s = room_info.seats[i];
		if (!s) continue;
		if (s.user_id > 0) {
			if (!room_info.start_choice.agree_list[i] && room_info.start_choice.agree_list[i] != 0) {
				console.log(room_info.start_choice)
				all_choice = false;
			}
		}
	}

	if (all_choice) {
		// 开始游戏
		var msg = JSON.parse(msg_templete.SC_StartPlay_End)
		msg.success = 1;
		userManager.send_to_room('start_play_end', msg, room_info.id);
		game.less_begin = true;// 允许少人开始
		game.room_info.less_begin = true;// 允许少人玩
		game.room_info.change_info.less_begin = true;

		// 移除掉定时器
		room_info.start_choice = null;
		var index = start_play_room.indexOf(game.room_info.id);
		if (index != -1) {
			start_play_room.splice(index, 1);
		}
		var timer = start_play_timer[game.room_info.id];
		if (timer != null) {
			clearTimeout(timer);
			start_play_timer[game.room_info.id] = null;
		}
		begin(room_info.id);
	}
}


/**
 * 获取真实的玩家数量
 * @param {*} game
 */
function get_game_realplayernum(game) {
	var real_num = 0;
	var seats_info = game.game_seats;
	for (var i = 0; i < seats_info.length; ++i) {
		var seat = seats_info[i];
		if (seat && seat.user_id > 0) {
			real_num++;
		}
	}
	return real_num;
}
/**
 * 更新房间可变信息
 * @param {*} game
 */
function update_room_change_info(game) {
	/*
	  change_info:{
	  less_begin:false,
	  current_banker_index:0,
	  current_banker_score:0,
	  current_banker_count:0,
	  base_score:0,
	  banker_circle:[0,0],
	}
	*/
	var data = {
		room_uuid: game.room_info.uuid,
		change_info: game.room_info.change_info
	}
	db.update_room_change_info(data, function (err, rows, fields) {
		if (err) {
			logger.error(err.stack);
			return;
		}
	});
}

/**
 * 设置准备加入游戏
 */
exports.set_join = function (user_id, join) {
	var game = get_game_by_user(user_id);
	if (game == null) return;
	//这里的所有操作都将是对房间内面watch_seats操作
	var room_info = game.room_info;
	if (room_info == null) return;

	var seat_index = get_seat_index(user_id);

	var watch_seats = room_info.watch_seats;
	if (!watch_seats) return;
	var my_watch_seat = watch_seats[seat_index];
	if (!my_watch_seat) return;
	if (my_watch_seat.join) return;

	my_watch_seat.join = true;
	roomManager.update_room_seat_info(game.room_info.id);

	var msg = JSON.parse(msg_templete.SC_Join);
	msg.watch_index = seat_index;
	msg.join = true;
	userManager.send_to_room('join', msg, game.room_info.id);
}
