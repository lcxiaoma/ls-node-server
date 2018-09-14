/**
 * 经典玩法
 * **/

var roomManager = require("./roommgr");
var userManager = require("./usermgr");
var pokerUtils = require("./poker_utils");
var db = require("../utils/db");
var crypt = require("../utils/crypto");
var games = {};


var game_seats_of_user = {};

//日志
var logger = require('./log.js').log_shisanshui;

//
const global = require('./global_setting').global;

//错误消息
const error = require('../config/error').error;

//msg templete
const msg_templete = require('./msgdefine').msg_templete;

var logger_manager = require('../common/log_manager');

var log_point = require('../config/log_point').log_point;

//正在申请解散的房间
var apply_dissmiss_room = [];
var apply_dissmiss_timer = {};

//提前开始游戏房间
var start_play_room = [];
var start_play_timer = {};

function get_crypt_list(length) {
    var arr = [];
    for (var i = 0; i < length; ++i) {
        arr.push(-1);
    }
    return arr;
}

function get_crypt_folds(folds) {
    var arr = [];
    for (var i = 0; i < folds.length; ++i) {
        var tmp = [];
        for (var j = 0; j < folds[i].length; ++j) {
            tmp.push(-1);
        }
        arr.push(tmp);
    }
    return arr;
}

//shuffle card
function shuffle(game) {
    //AAAA 2222 ..... 10,10,10,10,J,J,J,J,Q,Q,Q,Q,K,K,K,K
    //52张牌
    //need poker_numbers
    var poker = game.poker;
    var poker_nums = game.conf.poker_nums;//固定等于52

    for (var i = 0; i < poker_nums; ++i) {
        poker[i] = i;
    }
    // //shift
    // for(var i=0;i<poker_nums;++i){
    //     var last_index = poker_nums -1-i;
    //     var index = Math.floor(Math.random()*last_index);
    //     var t= poker[index];
    //     poker[index] = poker[last_index];
    //     poker[last_index] = t;
    // }

}

//dipatch card
//没人发5张牌
function dispatch_card(game) {
    //need card_numbers
    //reset 0
    game.current_index = 0;
    //var seat_index = game.button;
    var seat_index = 0;

    var card_num = game.conf.card_nums;

    var player_num = game.seats_num;

    var cards_count = game.conf.poker_nums;

    //这里的玩家数量得用真实的玩家数量
    for (var i = 0; i < game.game_seats.length; ++i) {
        var seat_data = game.game_seats[i];
        if (seat_data && seat_data.user_id > 0) {
            for (var j = 0; j < card_num; ++j) {
                var r = Math.floor(Math.random() * cards_count);
                seat_data.holds[j] = game.poker[r];
                if (r != (cards_count - 1)) {
                    var tmp = game.poker[cards_count - 1];
                    game.poker[cards_count - 1] = game.poker[r];
                    game.poker[r] = tmp;
                }
                cards_count -= 1;
            }
        }
    }
    // //for test
    // game.game_seats[0].holds =[49,25,21,27,35,47,15,31,32,20,4,16,28];
    // game.game_seats[1].holds =[3,19,51,23,39,12,8,48,14,22,26,38,6];
}

//set ready
//重新连接进来后的操作处理
exports.set_ready = function (user_id, status) {

    //all ready game begin
    var roomid = roomManager.getUserRoom(user_id);
    if (roomid == null) {
        logger.warn("set ready roomid is None.")
        return;
    }
    var room_info = roomManager.getRoom(roomid);
    if (room_info == null) {
        logger.warn("set ready room info is None.")
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
        //new game
        //logger.debug("roominfo.seats.length %d seats_num %d",room_info.seats.length,room_info.seats_num);
        if (room_info.seats.length == room_info.seats_num || room_info.less_begin) {
            //此处要添加在游戏中新进来的玩家
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
                var seat_info = room_info.watch_seat[new_join_seats[i]];
                seat_info.watch = false;
                if (user_id != seat_info.user_id) {
                    seat_info.ready = false;
                }
                //在开始游戏的身上寻找新的位置
                //if(seat_info.ready && userManager.isOnline(seat_info.user_id)){
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
                //添加一个用户加入游戏的消息进入牌局
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
                //}

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
        //logger.debug("has game check can begin  less_begin =%s",game.less_begin);
        //console.log(game.room_info.seats)
        //如果游戏是结束状态
        if (game.state == global.GAME_STATE_FREE) {

            //此处要添加在游戏中新进来的玩家
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
                //在开始游戏的身上寻找新的位置
                //if(seat_info.ready && userManager.isOnline(seat_info.user_id)){
                //console.log(room_info.watch_seats)
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
                //添加一个用户加入游戏的消息进入牌局
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
                //}

            }
            roomManager.update_room_seat_info(roomid);

            //检测是否可以开始游戏
            var ready_player_count = 0;
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

        data.seats = [];

        //断线重连，确定玩家能看到的牌 和能看到的出的牌
        for (var i = 0; i < room_info.seats_num; ++i) {
            var seat_data = game.game_seats[i];
            if (seat_data && seat_data.user_id > 0) {
                //self codes
                var holds_folds = get_holds_folds_data(game, seat_data);
                if (seat_data.user_id == user_id) {
                    var tmp = {
                        user_id: seat_data.user_id,
                        seat_index: seat_data.seat_index,
                        holds: holds_folds.my_msg.holds,
                        folds: holds_folds.my_msg.folds,
                        folds_type: holds_folds.my_msg.folds_type,
                    }
                    data.seats.push(tmp);
                } else {
                    var tmp = {
                        user_id: seat_data.user_id,
                        seat_index: seat_data.seat_index,
                        holds: holds_folds.other_msg.holds,
                        folds: holds_folds.other_msg.folds,
                        folds_type: holds_folds.other_msg.folds_type,
                    }
                    data.seats.push(tmp);
                }
            }
        }

        for (var i = 0; i < room_info.seats_num; ++i) {
            var watch_seat = room_info.watch_seats[i];
            if (watch_seat) {
                if (watch_seat.user_id > 0) {
                    var tmp = {
                        user_id: watch_seat.user_id,
                        seat_index: watch_seat.seat_index,
                        holds: [],
                        folds: [],
                        folds_type: {},
                        join: watch_seat.join,
                    }
                    data.seats.push(tmp);
                }
            }
        }
        //notice to client
        userManager.sendMsg(user_id, 'game_sync_push', JSON.stringify(data));

        //如果有解散信息发出解散信息
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
            conf: roominfo.conf, //房间配置
            room_info: roominfo, //房间信息
            game_index: roominfo.num_of_games,//当前游戏局数
            button: roominfo.change_info.current_banker_index,//庄家标记
            seats_num: roominfo.seats_num,
            current_index: 0, //当前牌的索引(发牌用)
            poker: new Array(roominfo.conf.poker_nums),
            game_seats: new Array(roominfo.seats_num),
            turn: 0,
            state: global.GAME_STATE_FREE,
            less_begin: roominfo.change_info.less_begin,//缺人开始标记
            current_banker_count: 0,
            open_card_mask: 0,
        }

        for (var i = 0; i < roominfo.seats_num; ++i) {
            //更具具体的玩家来初始化game_seats的长度
            var seat_data = seats[i];
            if (!seat_data) continue
            var data = {
                seat_index: i,
                user_id: seat_data.user_id,
                holds: [],
                folds: [],
                action: [],
                group: {},
                bet_coin: 0,
                statistic: seat_data.statistic,
                chose: false,
            }
            game.game_seats[i] = data;
            game_seats_of_user[data.user_id] = data;
        }
        games[room_id] = game;
    }
}

//game begin
//牛牛游戏开始后内容改变
function begin(room_id) {
    logger.debug('game begin  room_id = %d', room_id);
    var roominfo = roomManager.getRoom(room_id);
    if (roominfo == null) {
        return;
    }
    var game = games[room_id]
    if (game == null) {
        var seats = roominfo.seats;

        game = {
            conf: roominfo.conf, //房间配置
            room_info: roominfo, //房间信息
            game_index: roominfo.num_of_games,//当前游戏局数
            button: roominfo.change_info.current_banker_index,//庄家标记
            seats_num: roominfo.seats_num,
            current_index: 0, //当前牌的索引(发牌用)
            poker: new Array(roominfo.conf.poker_nums),
            game_seats: new Array(roominfo.seats_num),
            turn: 0,
            state: global.GAME_STATE_FREE,
            less_begin: roominfo.change_info.less_begin,//是否可以提前开始
            current_banker_count: 0,//当前庄的轮数
            open_card_mask: 0, //开牌的掩码
        }
        // // //for test
        // roominfo.num_of_games +=5;
        // game.game_index +=5;
        // // //test end

        roominfo.num_of_games++;
        game.game_index++;

        for (var i = 0; i < roominfo.seats_num; ++i) {
            //更具具体的玩家来初始化game_seats的长度
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
                group: {}, //玩家组合
                chose: false,
            }
            game.game_seats[i] = data;
            game_seats_of_user[data.user_id] = data;
        }
        games[room_id] = game;
    } else {

        var seats = roominfo.seats;

        //重置掉一些初始化的东西
        game.poker = new Array(roominfo.conf.poker_nums);
        //game.game_seats = new Array(roominfo.seats_num);
        game.state = global.GAME_STATE_FREE;
        game.current_index = 0; //当前牌的索引(用于发牌)
        game.call_banker_index = 0;//叫庄掩码
        game.bet_coin_index = 0; //下注掩码
        game.open_card_mask = 0; //开牌掩码

        // // //for test
        // roominfo.num_of_games +=5;
        // game.game_index +=5;
        // // //test end

        roominfo.num_of_games++;
        game.game_index++;

        //console.log("game begin roominfo seats _info ---->",seats);
        for (var i = 0; i < roominfo.seats_num; ++i) {
            var game_seat_info = game.game_seats[i];
            var room_seat_info = seats[i];

            if (room_seat_info && room_seat_info.user_id > 0) {
                if (game_seat_info) {
                    game_seat_info.seat_index = i;
                    game_seat_info.user_id = seats[i].user_id;
                    game_seat_info.holds = [];
                    game_seat_info.folds = [];
                    game_seat_info.action = [];
                    game_seat_info.bet_coin = 0;
                    game_seat_info.call_banker = -1;
                    game_seat_info.statistic = seats[i].statistic;
                    game_seat_info.group = {};
                    game_seat_info.chose = false;
                } else {
                    //当游戏中玩家信息不存在的时候要新建一个玩家状态
                    game_seat_info = {
                        seat_index: room_seat_info.seat_index,
                        user_id: room_seat_info.user_id,
                        holds: [],
                        folds: [],
                        action: [],
                        bet_coin: [],
                        call_banker: -1,
                        statistic: room_seat_info.statistic,
                        group: {},
                        chose: false,
                    }
                    game.game_seats[i] = game_seat_info;
                }
                game_seats_of_user[game_seat_info.user_id] = game_seat_info;
            }

        }
        //console.log("game seats --------->",game.game_seats)
        games[room_id] = game;
    }

    //洗牌
    shuffle(game);

    //发牌
    dispatch_card(game);
    //游戏状态广播
    //20170711  所有抢庄都不要了
    if(global.has_rule(game.conf.rule_index,global.OPEN_CARD)){
        //明牌
        game.state = global.GAME_STATE_CALL_BANKER
        game.button = -1;
    }else{
        //暗牌
        game.state = global.GAME_STATE_CHOSE;
        game.button = -1;
        game.open_card_mask += 0x01 << global.OPEN_CARD_HOLDS_USER
        game.open_card_mask += 0x01 << global.OPEN_CARD_HOLDS_BANKER_ONLY
    }
    // //
    // if (global.has_rule(game.conf.rule_index, global.GRAB_BANKER)) {
    //     //抢庄---每次抢庄
    //     game.state = global.GAME_STATE_CALL_BANKER;
    //     game.button = -1;
    // }
    // else if (global.has_rule(game.conf.rule_index, global.TURN_BANKER)) {
    //     //轮庄-- 自动轮庄
    //     if (game.game_index == 1) {
    //         game.button = 0;
    //     } else {
    //         var player_num = get_game_realplayernum(game);
    //         game.button = (game.button + 1) % player_num;
    //     }
    //     game.state = global.GAME_STATE_BANKER_CHOSE;
    // } else {
    //     if (game.game_index == 1) {
    //         game.state = global.GAME_STATE_CALL_BANKER
    //     } else {
    //         game.state = global.GAME_STATE_BANKER_CHOSE;
    //     }
    // }

    game.current_banker_count += 1;


    for (var i = 0; i < game.game_seats.length; ++i) {
        var seat = game.game_seats[i];
        if (seat && seat.user_id > 0) {
            notice_self_holds_change(game, seat, true);
        }
    }

    //客户端需要每个人都知道
    userManager.send_to_room('game_num_push', roominfo.num_of_games, roominfo.id);
    userManager.send_to_room('game_begin_push', game.button, game.room_info.id)

    if (game.state == global.GAME_STATE_BANKER_CHOSE) {

    }

    notice_game_state(roominfo.id, game.state);

    //开始增加更新房间信息
    update_room_info(game);


    //更新房间信息
    init_game_base_info(game);
}


function new_score_obj() {
    var score_obj = {
        out: {
            type: 0,
            score: 0
        },
        stage: [],
        extro_score: 0,
    };
    score_obj.stage.push({ type: 0, score: 0 })
    score_obj.stage.push({ type: 0, score: 0 })
    score_obj.stage.push({ type: 0, score: 0 })
    return score_obj;
}

function get_compare_obj(banker_card_type, folds) {
    var data = {
        out_type: banker_card_type.out_type,
        stage: [],
    }

    for (var i = 0; i < folds.length; ++i) {
        var tmp = {
            type: banker_card_type.stage[i],
            card_data: folds[i],
        }
        data.stage.push(tmp);
    }
    return data;
}
//game end
/**
 * 1，比较牌
 * 2，计算输赢
 * 3，获得倍率
 * **/
function game_end(room_id, force, over) {
    //logger.debug("call game end --------------->",room_id,force);
    if (force != true) { force = false };
    if (over != false) { over = true };
    //check is game over
    var is_game_over = false;

    var game = games[room_id];
    if (game == null) {
        //如果游戏为空,将利用room_info 上的数据进行结算

        var room = roomManager.getRoom(room_id);
        if (room == null) return;

        //add game end result
        var msg = JSON.parse(msg_templete.SC_game_end);
        //新增解散标记
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
    //如果游戏结束 广播游戏牌信息
    //将所有掩码都加上
    if (!global.has_rule(game.open_card_mask, global.OPEN_CARD_HOLDS_BANKER_ONLY)) {
        game.open_card_mask += 0x01 << global.OPEN_CARD_HOLDS_BANKER_ONLY;
    }
    if (!global.has_rule(game.open_card_mask, global.OPEN_CARD_HOLDS_USER)) {
        game.open_card_mask += 0x01 << global.OPEN_CARD_HOLDS_USER;
    }
    if (!global.has_rule(game.open_card_mask, global.OPEN_CARD_FOLDS_BANKER)) {
        game.open_card_mask += 0x01 << global.OPEN_CARD_FOLDS_BANKER;
    }
    if (!global.has_rule(game.open_card_mask, global.OPEN_CARD_FOLDS_ALL)) {
        game.open_card_mask += 0x01 << global.OPEN_CARD_FOLDS_ALL;
    }
    for (var i = 0; i < game.game_seats.length; ++i) {
        var seat = game.game_seats[i];
        if (seat && seat.user_id > 0) {
            notice_self_holds_change(game,seat,true,true);
        }
    }

    //add game end result
    var msg = JSON.parse(msg_templete.SC_game_end);
    //新增解散标记
    msg.force = force;

    var score = {};//最终分数
    var card_type_list = {};//牌型列表

    //分数计算
    // score ={out:{type:0,score:0},[stage:{type,score}],extro_score:0}
    //不是强制结算才会计分
    if (!force) {

        //明牌的比较分数
        if(global.has_rule(game.conf.rule_index,global.OPEN_CARD)){
            var banker_index = game.button;//庄家
            var banker_seat_data = game.game_seats[banker_index];
            var banker_card_type = banker_seat_data.group;
            var banker_folds = banker_seat_data.folds;
            var banker_score_obj = new_score_obj();
            var data_banker = get_compare_obj(banker_card_type, banker_folds);//用于比较大小的对象

            card_type_list[banker_index] = banker_card_type;
            score[banker_index] = banker_score_obj;
            banker_score_obj.out.type = data_banker.out_type;

            //初始化stage type
            for (var i = 0; i < data_banker.stage.length; ++i) {
                banker_score_obj.stage[i].type = data_banker.stage[i].type;
            }

            var len = game.game_seats.length;
            for (var i = 0; i < len; ++i) {
                if (i != banker_index) {
                    var user_seat_data = game.game_seats[i];
                    if (user_seat_data && user_seat_data.user_id > 0) {
                        var user_card_type = user_seat_data.group;
                        var user_folds = user_seat_data.folds;
                        var user_score_obj = new_score_obj();
                        var data_user = get_compare_obj(user_card_type, user_folds);
                        score[i] = user_score_obj;
                        card_type_list[i] = user_card_type;
                        user_score_obj.out.type = data_user.out_type;

                        var need_stage_compare = true;
                        //先比大的牌型
                        if (banker_card_type.out_type == user_card_type.out_type && banker_card_type.out_type == global.OUT_TYPE_NONE) {
                            //外类型相同
                        } else {
                            var out_r = pokerUtils.compare_out_type(data_banker, data_user);

                            if (out_r == true) {
                                //banker win
                                console.log("out type banker win.")
                                var times = pokerUtils.get_out_times(banker_score_obj.out.type);
                                banker_score_obj.out.score += times;
                                user_score_obj.out.score -= times;

                                need_stage_compare = false;
                            }
                            if (out_r == false) {
                                //user win
                                console.log("out type user win.")
                                var times = pokerUtils.get_out_times(user_score_obj.out.type)
                                banker_score_obj.out.score -= times;
                                user_score_obj.out.score += times;

                                need_stage_compare = false;
                            }
                            if (out_r == null) {
                                //一样大
                                console.log("out type same.")
                            }
                        }
                        // console.log("banker ===>", JSON.stringify(data_banker, null, 2));
                        // console.log("user   ===>", JSON.stringify(data_user, null, 2))
                        if (need_stage_compare) {
                            //比较具体的没墩
                            for (var x = 0; x < data_user.stage.length; ++x) {
                                var stage_r = pokerUtils.compare_stage(data_banker.stage[x], data_user.stage[x]);
                                user_score_obj.stage[x].type = data_user.stage[x].type;

                                if (stage_r == true) {
                                    console.warn("stage compare banker win.")
                                    var times = pokerUtils.get_stage_time(data_banker.stage[x].type, x);
                                    banker_score_obj.stage[x].score += times;
                                    user_score_obj.stage[x].score -= times;
                                }
                                if (stage_r == false) {
                                    console.warn("stage compare user win.")
                                    var times = pokerUtils.get_stage_time(data_user.stage[x].type, x);
                                    banker_score_obj.stage[x].score -= times;
                                    user_score_obj.stage[x].score += times;
                                }
                                if (stage_r == null) {
                                    console.warn("stage compare equal.")
                                }
                            }
                        }else{
                            //不需要比较墩的时候，仍然要保留玩家的墩
                            for (var x = 0; x < data_user.stage.length; ++x) {
                                user_score_obj.stage[x].type = data_user.stage[x].type;
                            }
                        }
                    }
                } else {
                    //庄家统计信息
                }
            }
        }else{
            //非明牌结算
            //需要相互比  A B C    A->B A-C B-C
            var len = game.game_seats.length;

            for(var i=0;i<len-1;++i){
                
                var base_seat_data = game.game_seats[i];
                if(!base_seat_data || base_seat_data.user_id <=0){
                    continue;
                }
                var base_card_type = base_seat_data.group;
                var base_folds = base_seat_data.folds;
                var data_base = get_compare_obj(base_card_type,base_folds);

                var base_score_obj = score[i];
                if(! base_score_obj){
                    base_score_obj = new_score_obj();
                    //初始化stage_type
                    for(var x =0;x<data_base.stage.length;++x){
                        base_score_obj.stage[x].type = data_base.stage[x].type;
                    }
                    score[i] = base_score_obj;
                } 

                for(var j=i+1;j<len;++j){
                    var compare_seat_data = game.game_seats[j]
                    if(!compare_seat_data || compare_seat_data.user_id <=0){
                        continue;
                    }
                    var compare_card_type = compare_seat_data.group;
                    var compare_folds = compare_seat_data.folds;
                    var compare_score_obj = score[j];
                    if(!compare_score_obj){
                        compare_score_obj= new_score_obj();
                        score[j] = compare_score_obj;
                    }
                    var data_compare = get_compare_obj(compare_card_type,compare_folds)

                    var need_stage_compare = true;
                    if(base_card_type.out_type == compare_card_type.out_type && base_card_type.out_type == global.OUT_TYPE_NONE){

                    }else{
                        var out_r = pokerUtils.compare_out_type(data_base,data_compare);
                        if(out_r == true){
                            //base win
                            logger.debug("out type base win.")
                            var times = pokerUtils.get_out_times(base_score_obj.out.type);
                            base_score_obj.out.score += times;
                            compare_score_obj.out.score -= times;
                            need_stage_compare = false;
                        }
                        if(out_r == false){
                            //compare win
                            logger.debug("out type compare win.")
                            var times = pokerUtils.get_out_times(compare_score_obj.out.type)
                            base_score_obj.out.score -= times;
                            compare_score_obj.out.score += times;

                            need_stage_compare = false;
                        }
                        if(out_r == null){
                            logger.debug("out type same.")
                        }
                    }//compare out type end
                    if (need_stage_compare) {
                        //比较具体的没墩
                        for (var x = 0; x < data_compare.stage.length; ++x) {
                            var stage_r = pokerUtils.compare_stage(data_base.stage[x], data_compare.stage[x]);
                            compare_score_obj.stage[x].type = data_compare.stage[x].type;

                            if (stage_r == true) {
                                console.warn("stage compare base win.")
                                var times = pokerUtils.get_stage_time(data_base.stage[x].type, x);
                                base_score_obj.stage[x].score += times;
                                compare_score_obj.stage[x].score -= times;
                            }
                            if (stage_r == false) {
                                console.warn("stage compare compare win.")
                                var times = pokerUtils.get_stage_time(data_compare.stage[x].type, x);
                                base_score_obj.stage[x].score -= times;
                                compare_score_obj.stage[x].score += times;
                            }
                            if (stage_r == null) {
                                logger.debug("stage compare equal.")
                            }
                        }
                    }else{
                        //不需要比较墩的时候，仍然要保留玩家的墩
                        for (var x = 0; x < data_compare.stage.length; ++x) {
                            compare_score_obj.stage[x].type = data_user.stage[x].type;
                        }
                    }//compare stage end
                }
            }
        }
    }
    //打印出具体的分数对象
    // console.log(JSON.stringify(score, null, 2));
    //end_seats_data
    //user_id
    //holds
    //card_type
    //end_score
    //total_score

    // console.error(score)
    var coin_list ={}
    var len = game.game_seats.length;
    for (var i = 0; i < len; ++i) {
        var seat_data = game.game_seats[i];
        if (seat_data && seat_data.user_id > 0) {
            var seat_statistic = game.game_seats[i].statistic;
            var my_score_obj =score[i];
            var coin =0;
            if(my_score_obj){
                coin += my_score_obj.out.score;
                for(var x=0;x<my_score_obj.stage.length;++x){
                    coin += my_score_obj.stage[x].score;
                }
            }else{
                score[i] ={};
            }

            seat_statistic.total_score += coin;

            var card_type_tmp = card_type_list[i];
            // var card_type = {
            //     type: 0,
            //     max_value: 0,
            // }
            // if (card_type_tmp) {
            //     card_type.type = card_type_tmp.type;
            //     card_type.max_value = card_type_tmp.max_value;
            // }
            if(card_type_tmp){

                // console.log(card_type_tmp,"group info temp")
                //统计特殊类型 和内部所有类型
                if(card_type_tmp.out_type != global.OUT_TYPE_NONE){
                    if(!seat_statistic.sss_type_count[global.SHISSHUI_TYPE_SEPCIAL]){
                        seat_statistic.sss_type_count[global.SHISSHUI_TYPE_SEPCIAL] =1
                    }else{
                        seat_statistic.sss_type_count[global.SHISSHUI_TYPE_SEPCIAL] +=1;
                    }
                }else{
                    for(var y=0;y<card_type_tmp.stage.length;++y){
                        var stage_type = card_type_tmp.stage[y];
                        if(!seat_statistic.sss_type_count[stage_type]){
                            seat_statistic.sss_type_count[stage_type] =1;
                        }else{
                            seat_statistic.sss_type_count[stage_type] +=1;
                        }
                    }
                }
            }
            game.room_info.seats[i].score = seat_statistic.total_score;
            game.room_info.seats[i].statistic = seat_statistic;

            var data = {
                user_id: game.game_seats[i].user_id,
                holds: game.game_seats[i].holds,
                folds: game.game_seats[i].folds,
                bet_coin: seat_data.bet_coin,
                end_score: coin,
                total_score: seat_statistic.total_score,
                score_info: score[i],
            }

            coin_list[i] = coin;

            msg.end_seats_data.push(data);
        }
    }

    //游戏状态改变
    game.state = global.GAME_STATE_FREE
    notice_game_state(game.room_info.id, game.state);

    //游戏结果
    userManager.send_to_room('game_over', msg, game.room_info.id)

    //清除玩家状态

    //需要清除当前还剩余的牌和其它一些临时信息
    for (var i = 0; i < game.seats_num; ++i) {
        var seat_data = game.game_seats[i];
        if (!seat_data) continue;
        seat_data.holds = [];
        seat_data.folds = [];
        seat_data.action = [];
        seat_data.bet_coin = 0;
        seat_data.call_banker = -1;
        exports.set_ready(seat_data.user_id, false);
    }
    //poker数组
    //是否写入历史记录
    if (game.game_index == game.room_info.conf.max_games || (force && over)) {
        is_game_over = true
    }

    //如果是第一局扣除房主金币
    if (!force) {
        if(!game.conf.free && (!game.room_info.agent_user_id || game.room_info.agent_user_id==0)){
            //房卡游戏
            if (global.has_rule(game.conf.rule_index, global.MASK_INGOT_GAME)) {
                if (game.game_index == 1) {
                    var ingot_value = global.get_ingot_value(game.conf.rule_index);
                    user_lose_ingot(game.conf.creator, ingot_value);
                }
            }
            //金币游戏
            if (global.has_rule(game.conf.rule_index, global.MASK_GOLD_GAME)) {
                //检测每位玩家是否是第一局，如果是第一局就扣除所有玩家一份金币
                //因为此处并不允许缺人开始，所以仅仅是第一局的时候就可以扣除每个玩家的金币
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
        roomManager.update_room_seat_info(game.room_info.id);
    }
    //prepare clean game cache
    //将数据存放到数据库
    update_room_info(game, true, coin_list, force);

    if (is_game_over) {
        game_over(room_id, force);
        return;
    }
}

//game over
//发送统计信息
function game_over(room_id, force) {
    if (force != true) { force = false; };
    var game = games[room_id];
    if (game == null) {
        //房间结算，游戏中不结算
        var room = roomManager.getRoom(room_id);
        if (room == null) return;
        var msg = JSON.parse(msg_templete.SC_game_over);

        for (var i = 0; i < room.seats_num; ++i) {
            var seat_data = room.seats[i];
            if (seat_data && seat_data.user_id > 0) {
                var seat_statistic = room.seats[i].statistic;
                var data = {
                    banker_count: seat_statistic.banker_count,
                    sss_type_count: seat_statistic.sss_type_count,
                    total_score: seat_statistic.total_score,
                }
                msg.over_seats_data.push(data);
            }
        }
        userManager.send_to_room('game_result', msg, room_id);

        //chean 玩家身上的数据
        //清除掉游戏
        userManager.kickAllInRoom(room_id);
        var reason = (force) ? global.ROOM_ACHIVE_DIS : global.ROOM_ACHIVE_OVER;
        roomManager.destroy(room_id, reason);
        return;
    }


    var msg = JSON.parse(msg_templete.SC_game_over);

    // banker_count:0,
    // ox_type_count:{},
    // total_score:0
    for (var i = 0; i < game.seats_num; ++i) {
        var seat_data = game.game_seats[i];
        if (!seat_data || seat_data.user_id <= 0) continue;
        var seat_statistic = game.game_seats[i].statistic;
        var data = {
            banker_count: seat_statistic.banker_count,
            sss_type_count: seat_statistic.sss_type_count,
            total_score: seat_statistic.total_score,
        }
        msg.over_seats_data.push(data);
    }

    userManager.send_to_room('game_result', msg, room_id);

    //chean 玩家身上的数据
    //清除掉游戏
    userManager.kickAllInRoom(room_id);
    var reason = (force) ? global.ROOM_ACHIVE_DIS : global.ROOM_ACHIVE_OVER;
    roomManager.destroy(room_id, reason);
    games[room_id] == null;
}

//用于存放临时数据(固定不会变得数据)
function init_game_base_info(game) {
    data = {}

    data.uuid = game.room_info.uuid;
    data.game_index = game.room_info.num_of_games;
    data.create_time = game.room_info.create_time;
    //基础信息
    data.base_info = {
        conf: game.conf,
        seats_num: game.seats_num,
        current_index: game.current_index,
        poker: game.poker
    };
    data.holds = [];
    data.folds = [];
    data.actions = [];
    data.result = [];
    //统计信息
    data.statistic = [];
    //变化信息
    data.change_info = {
        state: game.state,
        button: game.button,
        less_begin: game.less_begin,//缺人开始
        current_banker_count: game.current_banker_count,
        open_card_mask: game.open_card_mask,//开牌掩码
        call_banker_list: [],//叫庄数据列表
        bet_coin_list: [],//押注列表
        chose_list: [],//选择状态列表
        group_list: [],//组合列表
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
        data.change_info.chose_list.push(seats_data.chose);
        data.change_info.group_list.push(seats_data.group);
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
 * **/
function get_game_update_info(game) {
    //change_info:随时更改的信息
    //turn,boom_value_index,state,now_max_index,now_card_type,now_card_data,black_three,boom_num_list,boom_value_list
    var data = {};
    data.room_uuid = game.room_info.uuid;
    data.game_index = game.room_info.num_of_games;
    data.holds = [];
    data.folds = [];
    data.actions = [];
    data.change_info = {
        state: game.state,
        button: game.button,
        less_begin: game.less_begin,
        current_banker_count: game.current_banker_count,
        open_card_mask: game.open_card_mask,
        call_banker_list: [],//叫庄数据列表
        bet_coin_list: [],//押注列表
        chose_list: [],
        group_list: [],
        //added 解散信息 此处需要添加一些游戏中生成的临时状态
        dissmiss: game.room_info.dissmiss,
    }
    //data.result =[];
    for (var i in game.game_seats) {
        var seats_data = game.game_seats[i];
        if (!seats_data) continue;
        data.holds.push(seats_data.holds);
        data.folds.push(seats_data.folds);
        data.actions.push(seats_data.action);
        data.change_info.call_banker_list.push(seats_data.call_banker);
        data.change_info.bet_coin_list.push(seats_data.bet_coin);
        data.change_info.chose_list.push(seats_data.chose);
        data.change_info.group_list.push(seats_data.group);
    }
    //TODO 可变信息缺少一个解散信息

    return data;
}

//实时更新游戏每个步骤
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

//从数据库中加载游戏
function load_game_from_db(game) {

    var ret = null;
    db.load_game_from_db(game.room_info.room_uuid, function (err, rows, fields) {
        if (err) {
            logger.error(err.stack);
            return;
        }
    });
}

//更新房间信息
function update_room_info(game, is_game_end, score, force) {
    //游戏轮数
    if (is_game_end != true) { is_game_end = false; };
    if (!score) { score = [] };
    if (force != true) { force = false; };
    var data = {
        room_uuid: game.room_info.uuid,
        game_index: game.game_index,
        less_begin: game.room_info.less_begin,
        score_list: [],
        change_info: game.room_info.change_info,
    };
    // max_score:0,
    // boom_counts:0,
    // win_counts:0,
    // lose_counts:0,
    // total_score:0,
    for (var i = 0; i < game.seats_num; ++i) {
        var seat_data = game.game_seats[i]
        if (!seat_data) continue;
        var seat_statistic = seat_data.statistic;
        data.score_list.push(seat_statistic.total_score);
        //添加断线重连积分
        game.room_info.seats[i].score = seat_statistic.total_score;
    }
    //console.log("call update room info ====>",data)
    db.update_room_info(data, function (err, rows, fields) {
        if (err) {
            logger.error(err.stack);
            return;
        }
        if (is_game_end) {
            //强制解散
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

//游戏结束后将结果存放入固定的表
function store_game(args) {
    //需要结果
    //如果是强制解散则清理掉这条记录
    //将整个游戏移动到archive中

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
 * **/
exports.init_game_from_db = function (db_data, room_info) {
    var room_id = db_data.id;
    if (room_id == null) return;
    var game = games[db_data.id];
    if (game == null) {
        //游戏不存在初始化
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
            seats_num: base_info.seats_num,
            current_index: base_info.current_index,
            poker: base_info.poker,
            game_seats: new Array(room_info.seats_num),
            state: change_info.state,
            less_begin: change_info.less_begin,
            current_banker_count: change_info.current_banker_count,
            open_card_mask: change_info.open_card_mask,
        }
        //初始化其它信息
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
            data.chose = change_info.chose_list[i];
            data.group = change_info.group_list[i];
            game_seats_of_user[data.user_id] = data;
        }
        //增加解散信息
        if (change_info.dissmiss) {
            room_info.dissmiss = change_info.dissmiss;
            apply_dissmiss_room[room_id];
        }
        games[room_id] = game;
        // console.log("load game from db---->",game)
        // console.log("load game from db---->",games)        
        //初始化可变信息
    } else {
        //TODO确定是否要更新
    }


}

//get player game
function get_game_by_user(user_id) {
    var room_id = roomManager.getUserRoom(user_id);
    if (room_id == null) {
        return null;
    }
    var game = games[room_id];
    return game;
}

//get seat index
function get_seat_index(user_id) {
    return roomManager.getUserSeat(user_id);
}


//玩家扣除钻石
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
            logger_manager.insert_ingot_log(user_id, user_id, 0, log_point.INGOT_COST_OPEN, ingot_value, rows[0][0].now_ingot)
        }
    });
}

//玩家扣除金币
function user_lose_gold(user_id, gold_value) {
    logger.debug("user[%d] lose gold[gold_value].....", user_id, gold_value);
    db.cost_gold(user_id, gold_value, function (error, rows, fileds) {
        if (error) {
            logger.error(error.stack);
            return;
        }
        if (rows[0][0].result != 1) {
            logger.warn('user lose gold db result = %d', rows[0][0].result);
            return;
        } else {
            logger_manager.insert_gold_log(user_id, user_id, 0, log_point.GOLD_COST_OPEN, gold_value, rows[0][0].now_gold);
        }
    });
}

/**
 * 广播手牌变化
 * @param {*} game      游戏信息
 * @param {*} seat_data 位置信息
 * @param {*} broad     是否广播
 */
function notice_self_holds_change(game, seat_data, broad, over) {
    if(!over) {over = false;}
    var data = get_holds_folds_data(game, seat_data,over);

    if (broad) {
        userManager.sendMsg(seat_data.user_id, 'game_holds_push', data.my_msg);
        userManager.broacastInRoom('game_holds_push', data.other_msg, seat_data.user_id, false);
    } else {
        userManager.sendMsg(seat_data.user_id, 'game_holds_push', data.my_msg);
    }
}

/**
 * 获取通知玩家手牌变化的消息组合
 * @param {*} game 
 * @param {*} seat_data 
 */
function get_holds_folds_data(game,seat_data,over) {
    var my_msg = {
        user_id: seat_data.user_id,   //玩家ID
        holds: seat_data.holds,       //玩家手牌
        folds: seat_data.folds,       //玩家出牌
        folds_type: seat_data.group,  //玩家出牌类型
        over: over,                   //是否游戏结束
    };
    var other_msg = {
        user_id: seat_data.user_id,   //玩家ID
        holds: seat_data.holds,       //玩家手牌
        folds: seat_data.folds,       //玩家出牌
        folds_type: seat_data.group,  //玩家出牌类型
        over: over,
    }
    if (seat_data.seat_index == game.button) {
        //如果是庄家
        var crypt_holds = get_crypt_list(seat_data.holds.length);
        other_msg.holds = crypt_holds;
        if (!global.has_rule(game.open_card_mask, global.OPEN_CARD_HOLDS_BANKER_ONLY)) {
            my_msg.holds = crypt_holds;
        }

        if (!global.has_rule(game.open_card_mask, global.OPEN_CARD_FOLDS_BANKER)) {
            var crypt_folds = get_crypt_folds(seat_data.folds);
            other_msg.folds = crypt_folds;
            other_msg.folds_type = {};
        }
    } else {
        //闲家
        var crypt_holds = get_crypt_list(seat_data.holds.length);
        other_msg.holds = crypt_holds;
        if (!global.has_rule(game.open_card_mask, global.OPEN_CARD_HOLDS_USER)) {
            my_msg.holds = crypt_holds;
        }

        if (!global.has_rule(game.open_card_mask, global.OPEN_CARD_FOLDS_ALL)) {
            var crypt_folds = get_crypt_folds(seat_data.folds);
            other_msg.folds = crypt_folds;
            other_msg.folds_type = {};
        }
        if(!over){
            my_msg.folds= other_msg.folds;
        }
    }
    var data = {
        my_msg: my_msg,
        other_msg: other_msg,
    }
    return data;
}

//游戏状态广播
function notice_game_state(room_id, game_state) {
    var msg = JSON.parse(msg_templete.SC_game_state);
    msg.state = game_state;
    userManager.send_to_room("game_state_push", msg, room_id);
}

//确定游戏没有开始
exports.has_began = function (room_id) {
    var game = games[room_id];
    if (game == null) return false;
    if (game.state != global.GAME_STATE_FREE || game.game_index != 0) {
        return true;
    }
    return false;
}

//确定玩家是直接进入游戏还是进入观众席
exports.can_join = function (room_id) {
    var game = games[room_id];
    if (game == null) return true;
    if (game.state == global.GAME_STATE_FREE) return true;
    return false;
}

//申请解散游戏
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

    //观察玩家不能参与游戏动作
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
    // console.log("roominfo seat num ======>",room_info.seats_num);
    // console.log(room_info.dissmiss);

    room_info.dissmiss.states[seatIndex] = true;
    room_info.dissmiss.chose_index += 0x01 << (seatIndex + 1);
    //设置超时强制解散
    var timer = setTimeout(function () {
        exports.force_over_room(room_id);
    }, global.DISMISS_TIME);

    apply_dissmiss_room.push(room_id);
    apply_dissmiss_timer[room_id] = timer;

    return room_info;
}
//操作
exports.dissolve_operation = function (room_id, user_id, agree) {
    var room_info = roomManager.getRoom(room_id);
    if (room_info == null) return null;
    if (room_info.dissmiss == null) return null;
    var seat_index = roomManager.getUserSeat(user_id);
    if (seat_index == null) return null;

    //观察玩家不需要加入投票中
    if (room_info.watch_seats[seat_index]) {
        if (room_info.watch_seats[seat_index].user_id == user_id) {
            return;
        }
    }

    //如果已经做了选择就不让再选择了
    if ((room_info.dissmiss.chose_index & (0x01 << (seat_index + 1))) != 0) {
        return null;
    }

    //同意
    if (agree == true) {
        room_info.dissmiss.states[seat_index] = true;
        room_info.dissmiss.chose_index += 0x01 << (seat_index + 1);
    } else {
        //拒绝
        room_info.dissmiss = null;
        var index = apply_dissmiss_room.indexOf(room_id);
        if (index != -1) {
            apply_dissmiss_room.splice(index, 1);
        }
        //取消超时强制解散
        var timer = apply_dissmiss_timer[room_id];
        if (timer != null) {
            clearTimeout(timer);
            apply_dissmiss_timer[room_id] = null;
        }

    }
    return room_info;
}

//强制解散房间
exports.force_over_room = function (room_id) {
    var room_info = roomManager.getRoom(room_id);
    if (room_info == null) {
        return null;
    }
    game_end(room_id, true, true);

}

//导出的方法
exports.get_game_by_user = function (user_id) {
    return get_game_by_user(user_id);
}


//牛牛主动开始游戏(玩家未满时)
exports.start_play = function (user_id) {

    var game = get_game_by_user(user_id);

    if (game == null) {
        //如果提前开始，必须得初始化游戏内容
        var room_id = roomManager.getUserRoom(user_id);
        if (room_id == null) return;
        init_game_base(room_id);
        game = games[room_id];
    } else {
        if (game.num_of_games > 1) {
            logger.warn('game exsits can not start play.')
            return;
        }

    }

    //只有房主能决定是否在人数未满的时候开始游戏
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
        logger.warn('start play player less than 2.');
        return;
    }
    /*
    //所有玩家都准备了，房主可以主动开始游戏
    var seats_length = game.game_seats.length;

    var room_info = game.room_info;
    var seats_length = room_info.seats.length
    var player_count =0;
    for(var i=0;i<seats_length;++i){
        var s= room_info.seats[i];
        if(!s) continue;
        if(s.user_id != user_id && s.user_id >0){
            if(s.ready == false || userManager.isOnline(s.user_id)== false){
                //有人没准备好，游戏不能开始
                var msg = JSON.parse(msg_templete.SC_StratPlay);
                msg.error_code =error.USER_NOT_READY;
                msg.state = game.state;
                userManager.sendMsg(user_id,'start_play',msg)
                return;
            }else{
                player_count +=1;
            }
        }
    }

    //就只有一个玩家的时候不能开始，至少需要2个玩家
    if(player_count ==0) {
        logger.warn('one player ready can not start');
        return;
    }*/

    //修改状态为下注状态
    game.state = global.GAME_STATE_FREE;
    var msg = JSON.parse(msg_templete.SC_StartPlay);
    msg.start_user_id = user_id;
    msg.error_code = error.SUCCESS;
    msg.state = game.state;
    userManager.send_to_room('start_play', msg, game.room_info.id);

    // choice_index:0,
    // user_id:0,
    // user_index:0,
    // agree:0,
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

    //begin(room_info.id);
    var timer = setTimeout(function () {
        start_play_failed(game.room_info.id);
    }, global.START_PLAY_TIME);
    start_play_room.push(game.room_info.id);
    start_play_timer[game.room_info.id] = timer;
}

//提前开始失败
function start_play_failed(room_id) {
    var room_info = roomManager.getRoom(room_id);
    if (room_info == null) return;
    //TODO此处需要注意是否要更新到数据库
    var msg = JSON.parse(msg_templete.SC_StartPlay_End)
    msg.success = 0;
    msg.seat_index = 0;
    userManager.send_to_room('start_play_end', msg, room_info.id);

    //移除掉定时器
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

//开始游戏通知
exports.start_play_choice = function (user_id, data) {
    data = JSON.parse(data);
    var game = get_game_by_user(user_id);
    if (game == null) {
        logger.warn('game is None');
        return;
    }
    //如果全部都同意提前开始，则游戏提前开始
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
    //已经选择了，不能让其再次选择
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
        //有人拒绝，结束
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


        //移除掉定时器
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
        //开始游戏
        var msg = JSON.parse(msg_templete.SC_StartPlay_End)
        msg.success = 1;
        userManager.send_to_room('start_play_end', msg, room_info.id);
        game.less_begin = true;//允许少人开始
        game.room_info.change_info.less_begin = true;//允许少人玩

        //移除掉定时器
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
//叫庄(发牌后，如果是抢庄进入这个阶段)
exports.call_banker = function (user_id, data) {

    var game = get_game_by_user(user_id);
    if (game == null) return;

    if (game.state != global.GAME_STATE_CALL_BANKER) {
        return;
    }
    data = JSON.parse(data);
    //强制检测参数
    if (data.call != 0 && data.call != 1) {
        return;
    }

    var seat_index = get_seat_index(user_id);

    var seat_data = game.game_seats[seat_index];

    if (!seat_data) {
        return;
    }


    if (seat_data.call_banker != -1) {
        logger.warn('has called banker.')
        return;
    }

    seat_data.call_banker = data.call;
    game.game_seats[seat_index] = seat_data;

    var msg = JSON.parse(msg_templete.SC_CallBanker);
    msg.call = data.call;
    msg.seat_index = seat_index;

    userManager.send_to_room('call_banker', msg, game.room_info.id);
    //叫庄结束后开始押注
    var all_call = true;
    var call_list = [];
    var no_call_list = [];
    //console.log(game.game_seats)
    for (var i = 0; i < game.game_seats.length; ++i) {
        var seat_data = game.game_seats[i];
        if (seat_data && seat_data.user_id > 0) {
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

    if (all_call) {
        game.state = global.GAME_STATE_BANKER_CHOSE;
        //如果都不叫庄的处理
        if (call_list.length == 0) {
            if (no_call_list.length == 0) {
                logger.warn('call no call is length of 0.');
                notice_game_state(game.room_info.id, game.state);
                game_end(game.room_info.id, true, false)
                return;
            } else {
                game.button = no_call_list[Math.floor(Math.random() * no_call_list.length)];
            }
        } else {
            game.button = call_list[Math.floor(Math.random() * call_list.length)];
        }
        userManager.send_to_room('game_begin_push', game.button, game.room_info.id)
        //TODO通知庄家牌变更
        game.open_card_mask += 0x01 << global.OPEN_CARD_HOLDS_BANKER_ONLY;
        update_game_info(game);
        notice_self_holds_change(game, game.game_seats[game.button], false);
        notice_game_state(game.room_info.id, game.state);
    }
}

//获取真实的玩家数量
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

//设置准备加入游戏
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


//更新房间可变信息
function update_room_change_info(game) {
    /**
     * change_info:{
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
 * 客户端牌型选择
 */
exports.chose = function (user_id, data) {

    var game = get_game_by_user(user_id);
    if (game == null) return;
    var seat_index = get_seat_index(user_id);
    if (seat_index == null) return;
    var seat_data = game.game_seats[seat_index];
    if (!seat_data || seat_data.user_id != user_id) {
        return;
    }

    if(global.has_rule(game.conf.rule_index,global.OPEN_CARD)){
        //明牌才需要下面的判断
        if (game.state < global.GAME_STATE_BANKER_CHOSE) {
            return;
        }

        if (game.state == global.GAME_STATE_BANKER_CHOSE) {
            if (seat_index != game.button) {
                return;
            }
            if (seat_data.chose) {
                return;
            }
        }

        if (game.state == global.GAME_STATE_CHOSE) {
            if (seat_index == game.button) {
                return;
            }
            if (seat_data.chose) {
                return;
            }
        }
    }else{
        if(game.state != global.GAME_STATE_CHOSE){
            return;
        }
        if(seat_data.chose){
            return;
        }
    }


    var msg = JSON.parse(msg_templete.SC_Chose);
    msg.seat_index = seat_index;
    //检测数据格式
    if (!pokerUtils.check_data_format(data)) {
        logger.warn("user chose but data invalid.");
        msg.error_code = error.SHISANSHUI_CHOSE_DATA_FAILED;
        userManager.sendMsg(user_id, 'chose', msg);
        return;
    }
    //检测参与选择的牌是否合法
    data = JSON.parse(data);
    if (!pokerUtils.check_card_invalied(data.stage, seat_data.holds)) {
        logger.warn("user chose card invalied.");
        msg.error_code = error.SHISANSHUI_CHOSE_CARD_INVALID;
        userManager.sendMsg(user_id, 'chose', msg);
        return;
    }
    //大类型只需要检测手牌，而不需要检测具体的每一道
    if (!pokerUtils.check_out_type(data.out_type, seat_data.holds)) {
        logger.warn("user out type failed.");
        msg.error_code = error.SHISANSHUI_CHOSE_OUT_TYPE_FAILED;
        userManager.sendMsg(user_id, 'chose', msg);
        return;
    }
    //当没有外部大类型的时候，需要去检测每一道的类型和值 以及倒水
    if(data.out_type == global.OUT_TYPE_NONE){
        if (!pokerUtils.check_stage_type(data.stage,true)) {
            logger.warn("user stage check failed.");
            msg.error_code = error.SHISANSHUI_CHOSE_STAGE_FAILED;
            userManager.sendMsg(user_id, 'chose', msg);
            return;
        }
    }

    //如果需要记录，在此记录
    //fold group 增加  holds 减少
    seat_data.chose = true;
    msg.out_type = data.out_type;

    seat_data.holds = [];
    seat_data.group = {
        out_type: data.out_type,
        stage: [],
    }
    for (var i = 0; i < data.stage.length; ++i) {
        seat_data.folds.push(data.stage[i].card_data);
        seat_data.group.stage.push(data.stage[i].type)
    }
    //类型放到group上
    //把出的牌放到folds上去
    if(global.has_rule(game.conf.rule_index,global.OPEN_CARD)){
        //明牌方式处理
        if (seat_data.seat_index == game.button) {
            //庄家选择了后
            game.state = global.GAME_STATE_CHOSE;
            //TODO 其它玩家状态变更 都是通知自己变更
            game.open_card_mask += 0x01 << global.OPEN_CARD_FOLDS_BANKER;
            game.open_card_mask += 0x01 << global.OPEN_CARD_HOLDS_USER;
            // notice_self_holds_change(game,seat_data,true);

            //还要广播其它人的手牌
            for (var i = 0; i < game.game_seats.length; ++i) {
                var seat = game.game_seats[i];
                if (seat && seat.user_id > 0) {
                    notice_self_holds_change(game, seat, true);
                }
            }
            notice_game_state(game.room_info.id, game.state);
        }else{
            notice_self_holds_change(game,seat_data,true);
        }

        //通知其它客户端
        msg.error_code = error.SUCCESS;
        userManager.send_to_room('chose', msg, game.room_info.id);
        //更新游戏数据
        update_game_info(game);

        //如果所有的人都选择了，进入结算
        var all_chose = true;
        for (var i = 0; i < game.game_seats.length; ++i) {
            var st = game.game_seats[i];
            if (st && st.user_id > 0) {
                if (st.chose === false) {
                    all_chose = false;
                }
            }
        }
        if (all_chose) {
            //打开所有的牌
            game.open_card_mask += 0x01 << global.OPEN_CARD_FOLDS_ALL;
            update_game_info(game);
            game_end(game.room_info.id, false);
        }
        update_game_info(game);
    }else{

        notice_self_holds_change(game,seat_data,true);

        //通知其它客户端
        msg.error_code = error.SUCCESS;
        userManager.send_to_room('chose', msg, game.room_info.id);
        //更新游戏数据
        update_game_info(game);

        //如果所有的人都选择了，进入结算
        var all_chose = true;
        for (var i = 0; i < game.game_seats.length; ++i) {
            var st = game.game_seats[i];
            if (st && st.user_id > 0) {
                if (st.chose === false) {
                    all_chose = false;
                }
            }
        }
        if (all_chose) {
            //打开所有的牌
            game.open_card_mask += 0x01 << global.OPEN_CARD_FOLDS_BANKER;
            game.open_card_mask += 0x01 << global.OPEN_CARD_FOLDS_ALL;
            update_game_info(game);
            game_end(game.room_info.id, false);
        }
        update_game_info(game);
    }
}