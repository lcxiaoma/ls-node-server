/**
 * 斗地主经典玩法
 * **/

var roomManager = require("./roommgr");
var userManager = require("./usermgr");
var pokerUtils = require("./poker_utils");
var db = require("../utils/db");
var crypt = require("../utils/crypto");
var games = {};


var game_seats_of_user ={};

//日志
var logger = require('./log.js').log_poker_landlord;

//
const global = require('./global_setting').global;

//错误消息
const error = require('../config/error').error;

//msg templete
const msg_templete = require('./msgdefine').msg_templete;

var logger_manager = require('../common/log_manager');

var log_point = require('../config/log_point').log_point;

//正在申请解散的房间
var apply_dissmiss_room =[];
var apply_dissmiss_timer = {};


function remove_from_list(list,items){
    for(var i=0;i<items.length;++i){
        var pos = list.indexOf(items[i]);
        if(pos>=0){
            list.splice(pos,1);
        }
    }
}

function add_to_list(list,items){
    for(var i=0;i<items.length;++i){
        list.push(items[i]);
    }
}

function get_crypt_list(length){
    var arr =[];
    for(var i=0;i<length;++i){
        arr.push(0);
    }
    return arr;
}

//shuffle card
function shuffle(game){
    //0123 4567 891011  40 41 42 43  44 45 46 47  48 49 50 51  52  53
    //0000 1111 2222    10 10 10 10  11 11 11 11  12 12 12 12  13  13
    //3333 4444 5555    K  K   K  K  A  A  A  A   2  2  2   2  king King
    //need poker_numbers
    var poker = game.poker;
    var poker_nums = game.conf.poker_nums;
    var kick = {};
    var has_king = true;
    if(poker_nums ==45 ){
        //AAA 222 K King king
        kick[11] =3;
        kick[12] =3;
        kick[10] =1;
        has_king = false;

        var index =0;
        var p = 52;
        if(has_king){
            p=54;
        }
        for(var i=0;i<p;++i){
            var card = pokerUtils.get_poker_value(i);
            if(kick[card]){
                kick[card] --;
                continue;
            }
            poker[index] = i;
            index ++;
        }
    }
    if(poker_nums ==48 ){
        //A 222 King king
        kick[11] =1;
        kick[12] =3;
        has_king= false;

        var index =0;
        var p = 52;
        if(has_king){
            p=54;
        }
        for(var i=0;i<p;++i){
            var card = pokerUtils.get_poker_value(i);
            if(kick[card]){
                kick[card] --;
                continue;
            }
            poker[index] = i;
            index ++;
        }
    }
    if(poker_nums ==52){
        //king king
        has_king = false;

        var index =0;
        var p = 52;
        if(has_king){
            p=54;
        }
        for(var i=0;i<p;++i){
            var card = pokerUtils.get_poker_value(i);
            if(kick[card]){
                kick[card] --;
                continue;
            }
            poker[index] = i;
            index ++;
        }
    }

    if(poker_nums == 54){
        var index =0;
        var p =54;
        for(var i=0;i<p;++i){
            poker[index] = i;
            index++;
        }
    }

    if(poker_nums ==108){
        //all *2
        var index =0;
        var p=54;
        for(var j=0;j<2;++j){
            for(var i=0;i<54;++i){
                poker[index] =i;
                index ++;
            }
        }
    }

    //shift
    for(var i=0;i<poker_nums;++i){
        var last_index = poker_nums -1-i;
        var index = Math.floor(Math.random()*last_index);
        var t= poker[index];
        poker[index] = poker[last_index];
        poker[last_index] = t;
    }

}

//dipatch card
function dispatch_card(game){
    logger.debug("base dispatch card");
    //need card_numbers
    //reset 0
    game.current_index =0;
    var seat_index = 0;//game.button;

    var card_num = game.conf.card_nums;

    var player_num = game.seats_num;

    var max_card = card_num *player_num;

    //logger.debug("dispatch info  card_num = %d,player_num = %d",card_num,player_num);

    for(var i=0;i<max_card;++i){
        //console.log("show me seat_index......................",seat_index)
        var poker = game.game_seats[seat_index].holds;
        if(poker == null){
            poker =[];
            game.game_seats[seat_index].holds = poker;
        }
        send_card(game,seat_index);
        seat_index ++;
        seat_index %=player_num;
    }
    //兼容赢家做庄
    game.turn = game.button; 
}
//send card to player index
function send_card (game,seat_index){
    if(game.current_index == game.poker.length){
        return -1;
    }
    var data = game.game_seats[seat_index];
    var poker = data.holds;
    var card = game.poker[game.current_index];
    // //黑桃三做庄
    // if(card == global.BLACK_THREE_HEART && game.game_index ==1){
    //     //game.turn = seat_index;
    //     game.button = seat_index;
    //     game.black_three = 1;
    // }
    //如果有黑桃3做庄，则设置黑桃3为庄
    if(global.has_rule(game.conf.rule_index,global.MASK_FIRST)&&card == global.BLACK_THREE_HEART && game.game_index ==1){
        game.button = seat_index;
    }
    poker.push(card);

    game.current_index ++;
    return card;
}

//set ready
exports.set_ready = function(user_id,status){

    logger.debug("base poker manager call set ready user[%d],status[%d]",user_id,status);
    //all ready game begin
    var roomid = roomManager.getUserRoom(user_id);
    if(roomid == null){
        return;
    }
    var room_info = roomManager.getRoom(roomid);
    if(room_info == null){
        return;
    }

    roomManager.setReady(user_id,status);

    var game = games[roomid];
    if(game ==null){
        //new game
        logger.debug("roominfo.seats.length %d seats_num %d",room_info.seats.length,room_info.seats_num);
        if(room_info.seats.length == room_info.seats_num){
            for(var i=0;i<room_info.seats_num;++i){
                var s= room_info.seats[i];
                if(s && s.user_id >0){
                    if(s.ready == false || userManager.isOnline(s.user_id)== false){
                        return;
                    }
                }
            }
            begin(roomid);
        }
    }else{
        //has record

        //如果游戏是结束状态
        if(game.state == global.GAME_STATE_FREE){
            //检测是否可以开始游戏
            if(room_info.seats.length == room_info.seats_num){
                for(var i=0;i<room_info.seats_num;++i){
                    var s= room_info.seats[i];
                    if(s && s.user_id >0){
                        if(s.ready == false || userManager.isOnline(s.user_id)== false){
                            return;
                        }
                    }
                }
                begin(roomid);
                return;
            }
        }
        var num_of_poker = game.poker.length - game.current_index;
        var remaining_games = room_info.conf.max_game - room_info.num_of_games;

        var base_score =0;
        if(game.button !=-1){
            base_score = game.game_seats[game.button].call_banker;
        }

        var data = {
            state:game.state,
            num_of_pokers:num_of_poker,
            button:game.button,
            turn:game.turn,
            //chu_pai:game.chu_pai,
            base_score:base_score,
            now_card_type:game.now_card_type,
            now_card_data:game.now_card_data,
            rate:game.rate,
            landlord_card:game.landlord_card,
        };

        data.seats =[];
        var current_max_call_value =0;
        for(var i=0;i<room_info.seats_num;++i){
            var seat_data = game.game_seats[i];
            //self codes
            if(seat_data.user_id == user_id){
                var tmp ={
                    user_id:seat_data.user_id,
                    seat_index:seat_data.seat_index,
                    holds:seat_data.holds,
                    folds:seat_data.folds,
                }
                data.seats.push(tmp);
            }else{
                var crypt_holds = get_crypt_list(seat_data.holds.length);
                //if has crypt folds need do;
                var crypt_folds = seat_data.folds;
                var tmp ={
                    user_id:seat_data.user_id,
                    seat_index:seat_data.seat_index,
                    holds:crypt_holds,
                    folds:crypt_folds,
                }
                data.seats.push(tmp);
            }
            if(seat_data.call_banker >current_max_call_value){
                current_max_call_value = seat_data.call_banker;
            }
        }
        //show game_seats_of_user
        //logger.debug("show game seats of user =====>",game_seats_of_user[user_id]);
        //notice to client
        userManager.sendMsg(user_id,'game_sync_push',JSON.stringify(data));
        

        if(game.state == global.GAME_STATE_CALL_LANDLORD){
            //如果还是都地主状态，将发送抢地主相关信息
            call_banker_broad(game,current_max_call_value);
            return;
        }

        //send operation send current operation
        var msg = JSON.parse(msg_templete.SC_turn);
        msg.turn = game.turn;
        msg.black_three = game.black_three;
        msg.max_index = game.button;
        msg.now_card_type = game.now_card_type;
        msg.now_card_data = game.now_card_data;
        userManager.sendMsg(user_id,'turn_push',msg);

        //如果有解散信息发出解散信息
        if(game.room_info.dissmiss){
            var ramaingTime = (game.room_info.dissmiss.endTime - Date.now()) / 1000;
            var dis_info = {
                    mask:game.room_info.dissmiss.chose_index,
					time:ramaingTime,
					states:game.room_info.dissmiss.states
            }
            userManager.sendMsg(user_id,'dissolve_notice_push',dis_info);
        }
    }
}

//user out cards
exports.out_card = function(user_id,card_data){
    logger.debug('game base manager call out card.',card_data.cards_data);
    //pass specail
    var game = get_game_by_user(user_id);
    var user_index = get_seat_index(user_id);

    //logger.debug('game and  user_index ',game,user_index);
    if(game == null||user_index== null) return;
    if(game.state != global.GAME_STATE_PLAYING) return;

    logger.debug('begin check out card action..........');
    var error_num =error.SUCCESS;

    //黑桃3必出判断
    /*
    if(game.black_three==1){
        var find = false;
        for(var i in card_data.cards_data){
            if(card_data.cards_data[i] == global.BLACK_THREE_HEART){
                find = true;
                break;
            }
        }
        if(!find){
            return;
        }
    }
    */

    /*
    if(card_data.card_type == global.PASS){
        //check must
        if(global.has_rule(game.conf.rule_index,global.MASK_PLAY)){
            //检测必出
            logger.debug("===================>",game.now_card_type,game.now_card_data);
            var tmp = pokerUtils.check_must(game.game_seats[user_index].holds,game.now_card_type,game.now_card_data)
            logger.debug("=====================>",tmp);
            if(!tmp){
                error_num = error.GAME_ERROR_MUST_OUT;
            }
        }
    }

    logger.debug('check must rule code = %d',error_num);

    */
    if(error_num == error.SUCCESS){
        //check can out
        error_num =check_can_out(user_id,card_data);

        //for test
        //error_num = error.SUCCESS;

        if( error_num == error.SUCCESS){
            //add put card action
            game.game_seats[user_index].action.push(card_data.card_type);

            remove_card(user_id,card_data);
        }
    }

    logger.debug('check can out code = %d',error_num);

    var msg_tmp = JSON.parse(msg_templete.SC_out_card);
    msg_tmp.error_code = error_num;
    msg_tmp.out_user = user_id;
    msg_tmp.out_card_type = card_data.card_type;
    msg_tmp.out_cards_data = card_data.cards_data
    //新增倍率
    msg_tmp.rate = game.rate;

    if(error_num == error.SUCCESS){
        //check it can get boom value
        if(card_data.card_type == global.BOOM){
            game.game_seats[user_index].boom_num += 1;
            game.boom_value_index = user_index;
            //动态倍率变更
            game.rate = game.rate<<1;
        }
        //新增倍率变更
        msg_tmp.rate = game.rate;
        userManager.broacastInRoom('out_card_push',msg_tmp,user_id,true);
        
        //add action record

        //notice next turn
        move_to_next(get_game_by_user(user_id),user_id,card_data);

        check_end_game(user_id);

    }else{
        userManager.sendMsg(user_id,'out_card_push',msg_tmp,card_data.card_type);
    }

}
//move to next turn
function move_to_next (game,user_id,card_data){

    var old_turn = game.turn;

    game.turn = (game.turn+1)%game.seats_num;

    logger.debug("Show me info ====turn[%d],now_max_index[%d]",game.turn,game.now_max_index);

    if(game.turn == game.now_max_index && card_data.card_type == global.PASS){
        //如果当前的最大类型是炸弹则增加有效炸弹数量
        if(game.now_card_type == global.BOOM){
            if(game.boom_value_index == game.now_max_index){
                game.game_seats[game.boom_value_index].boom_value +=1;
                game.boom_value_index = -1;
            }else{
                logger.warn("BOOM type not compute----------------------------->")
            }
        }
        //clear cache
        game.now_card_type =0;
        game.now_card_data =[];
    }

    //如果不是过就把当前最大的值增加
    if(card_data.card_type != global.PASS){
        game.now_card_type = card_data.card_type;
        game.now_card_data = card_data.cards_data;
        game.now_max_index = old_turn;
    }

    //dump data to db----this can use to resue game
    update_game_info(game);

    var msg = JSON.parse(msg_templete.SC_turn);
    msg.turn = game.turn;
    msg.black_three = game.black_three;
    msg.max_index = game.now_max_index;
    msg.now_card_type = game.now_card_type;
    msg.now_card_data = game.now_card_data;
    userManager.broacastInRoom('turn_push',msg,user_id,true);
}
//check can out card
function check_can_out (user_id,card_data,is_last){
    //check game
    if(is_last != true){is_last = false;};
    var game = get_game_by_user(user_id);
    if(game == null) return error.GAME_ERROR_UNDEFINED;
    //check turn
    var user_index = get_seat_index(user_id);
    if(user_index == null) return error.GAME_ERROR_PLAYER_NOT_FOUND;
    if(game.turn != user_index) return error.GAME_ERROR_NOT_TURN;

    //check card
    var seat_data = game.game_seats[user_index];
    if(seat_data == null) return error.GAME_ERROR_PLAYER_NOT_FOUND;
    
    if(!pokerUtils.check_card(seat_data.holds,card_data.cards_data)){
        logger.warn("check card failed .........",card_data.card_type,card_data.cards_data,seat_data.holds);
        return error.GAME_ERROR_CARD_INVALID;
    }

    //check card type
    if(game.now_card_type !=0 && game.now_card_type != card_data.card_type && card_data.card_type != global.BOOM && card_data.card_type != global.PASS){
        logger.warn("check card type failed .........base[%d], now[%d]",game.now_card_type,card_data.card_type);
        return error.GAME_ERROR_CARD_INVALID;
    }
    //检测是否是最后一手，因为最后一手是允许一些特殊牌型的
    var is_last = false;
    if(seat_data.holds.length == card_data.cards_data.length){
        is_last = true;
    }
    var is_double_king = false;
    if(game.conf.poker_nums ==54){
        is_double_king = true;
    }
    if(!pokerUtils.check_card_type(game.now_card_type,game.now_card_data,card_data.card_type,card_data.cards_data,is_last,is_double_king)){
        logger.warn("check type filed -------------------------->>>>>")
        return error.GAME_ERROR_CARD_TYPE_INVALID;
    }


    return error.SUCCESS;
}
//remove card
function remove_card (user_id,card_data){
    //pass card not need below

    var seat_data = game_seats_of_user[user_id];

    if(card_data.card_type == global.PASS){

        //需要保存出牌的内容
        seat_data.folds.push(card_data.cards_data);

        return error.SUCCESS;
    }
    //set server cache
    var game = get_game_by_user(user_id);
    var user_index = get_seat_index(user_id);
    // game.now_card_type = card_data.card_type;
    // game.now_card_data = card_data.cards_data;
    //清除黑桃3必出
    if(game.black_three==1) game.black_three =0;
    //holds remove
    remove_from_list(seat_data.holds,card_data.cards_data);
    //folds add
    //add_to_list(seat_data.folds,card_data.cards_data);
    seat_data.folds.push(card_data.cards_data);
    notice_user_holds_change(user_id,seat_data.holds,seat_data.folds);

    return error.SUCCESS;
}

//check end game
function check_end_game (user_id){
    var is_game_end = false;
    
    var seat_data = game_seats_of_user[user_id];

    if(seat_data == null){
        return false;
    }

    if(seat_data.holds.length ==0){
        is_game_end = true;
    }

    //
    if(is_game_end){
        var room_id = roomManager.getUserRoom(user_id);
        var game = get_game_by_user(user_id);
        if(game != null){
            game.room_info.change_info.over_index = seat_data.seat_index;
            for(var i=0;i<game.game_seats.length;++i){
                var seat_data = game.game_seats[i]
                notice_user_holds_change(seat_data.user_id,seat_data.holds,seat_data.folds,true);
            }
        }
        game_end(room_id,false);
    }
    return is_game_end;
}

//game begin
function begin (room_id){
    logger.debug('base manager game begin  room_id = %d',room_id);
    var roominfo = roomManager.getRoom(room_id);
    if(roominfo == null){
        return;
    }
    var game = games[room_id]
    if(game == null){
        var seats = roominfo.seats;

        game = {
            conf:roominfo.conf, //房间配置
            room_info:roominfo, //房间信息
            game_index:roominfo.num_of_games,//当前游戏局数
            button:roominfo.next_button,//庄家标记
            seats_num:roominfo.seats_num,
            current_index:0, //当前牌的索引(发牌用)
            poker: new Array(roominfo.conf.poker_nums),
            game_seats: new Array(roominfo.seats_num),
            num_of_que:0,
            turn:0,
            boom_value_index:-1, //有效炸弹的索引
            state:global.GAME_STATE_FREE,
            chupai_cnt:0,
            now_max_index:0, //当前最大的索引
            now_card_type:0, //当前的出牌类型
            now_card_data:[],//当前的出牌内容
            black_three:0,
            rate:1,//倍率
            landlord_card:[],//地主牌
            begin_call:-1,//开始叫地主的索引
        }
        // //for test
        // roominfo.num_of_games +=5;
        // game.game_index +=5;
        //test end

        roominfo.num_of_games ++;
        game.game_index ++;

        for(var i=0;i<roominfo.seats_num;++i){
            var data = game.game_seats[i] ={};
            data.seat_index = i;
            data.user_id = seats[i].user_id;
            data.holds = [];
            data.folds = [];
            data.action = [];
            data.boom_num =0;  //打出炸弹的个数
            data.boom_value =0; //打出炸弹有效个数
            data.call_banker = -1; //是否叫地主
            data.statistic =seats[i].statistic;
            game_seats_of_user[data.user_id] = data;
        }

        games[room_id] = game;
    }else{

        var seats = roominfo.seats;

        //重置掉一些初始化的东西
        game.poker = new Array(roominfo.conf.poker_nums);
        //game.game_seats = new Array(roominfo.seats_num);
        game.turn = 0;
        game.boom_value_index=-1; //有效炸弹的索引
        game.state = global.GAME_STATE_FREE;
        game.rate =1;
        game.action_list = [];
        game.current_index = 0; //当前牌的索引(用于发牌)
        game.now_max_index =0; //当前最大的索引
        game.now_card_type = 0; //当前的出牌类型
        game.now_card_data =[];//当前的出牌内容
        game.landlord_card= [];//地主牌
        game.begin_call = -1;//开始叫地主的索引
        //for test
        // roominfo.num_of_games +=5;
        // game.game_index +=5;
        //test end

        roominfo.num_of_games ++;
        game.game_index ++;

        //logger.debug('show me rebegin game ==========>',game);

        for(var i=0;i<roominfo.seats_num;++i){
            var data = game.game_seats[i];

            data.seat_index = i;
            data.user_id = seats[i].user_id;
            data.holds = [];
            data.folds = [];
            data.action = [];
            data.boom_num =0;
            data.boom_value =0;
            data.call_banker = -1; //是否叫地主
            data.statistic = seats[i].statistic;
            game_seats_of_user[data.user_id] = data;
        }
        games[room_id] = game;
    }

    // logger.warn("show me I need Info  now_type [%d], now_max_index[%d], turn[%d] ,banker[%d] ",game.now_card_type,game.now_max_index,game.turn,game.button);

    //洗牌
    shuffle(game);

    //发牌
    dispatch_card(game);

    //for test
    // var now_index =0;
    // for(var i =0;i<seats.length;++i){
    //     game.game_seats[i].holds =[];
    //     for(var j=0;j<16;++j){
    //         game.game_seats[i].holds.push(game.poker[now_index]);
    //         now_index ++;
    //     }
    // }
    // game.turn = 0;
    // game.button =0;
    //test end

    //随机开始抢地主的位置
    game.button = -1;//地主位置未确定
    // game.turn =  Math.floor(Math.random()*3) //随机开始的地主
    //20170717 修改  叫地主的轮次换为 第一局庄家叫分  后面的为谁先完牌谁叫分
    game.turn = game.room_info.change_info.over_index;

    game.begin_call = game.turn;

    //notife
    var num_of_poker = game.poker.length - game.current_index;

    //游戏状态广播
    //game.state = global.GAME_STATE_PLAYING;

    //斗地主的叫地主阶段
    game.state = global.GAME_STATE_CALL_LANDLORD;

    for(var i=0;i<seats.length;++i){
        //client need know
        var s= game.game_seats[i];
        //show hand card
        //userManager.sendMsg(s.user_id,'game_holds_push',msg);
        notice_user_holds_change(s.user_id,s.holds,s.folds);
        //show all cards leave
        userManager.sendMsg(s.user_id,'poker_count_push',num_of_poker);
        //show how manney play counts
        userManager.sendMsg(s.user_id,'game_num_push',roominfo.num_of_games);

        //TAG：先进入抢地主阶段，不会确定谁是地主，也不会发送状态
        //show game begin
        //userManager.sendMsg(s.user_id,'game_begin_push',game.button);

        //userManager.sendMsg(s.user_id,'game_state_push',game.state);
    }

    notice_game_state(roominfo.id,game.state);

    // var msg = JSON.parse(msg_templete.SC_turn);
    // msg.turn = game.turn;
    // msg.black_three = game.black_three;
    // msg.max_index = game.now_max_index;//当前最大的玩家索引
    // msg.now_card_type = game.now_card_type;//当前最大的牌类型
    // msg.now_card_data = game.now_card_data;//当前最大的牌内容
    // userManager.send_to_room('turn_push',msg,game.room_info.id);

    //斗地主此处不再推送出牌消息而是推送叫地主消息
    // var msg = JSON.parse(msg_templete.SC_CallBankTurnPush);
    // msg.turn = game.turn;
    // msg.max_index = game.now_max_index;
    // msg.rate = game.rate;
    // userManager.send_to_room('call_turn_push',msg,game.room_info.id);
    call_banker_broad(game,0);


    //if has other begin action do at here
    //like chose the king card

    //before must check if has not over game
    //dump game base info into database;

    //开始增加更新房间信息
    update_room_info(game);

    //TODO结束的更新房间信息
    init_game_base_info(game);
}

//game end
function game_end (room_id,force,over){
    //logger.debug("call game end --------------->",room_id,force);
    if(force!= true){force = false;};
    if(over!= false){over = true;};
    //check is game over
    var is_game_over =false;

    var game = games[room_id];
    if(game == null){
        //游戏信息不存在，走房间解散流程
        var room = roomManager.getRoom(room_id);
        if(room == null) return;

        //add game end result
        var msg = JSON.parse(msg_templete.SC_game_end);
        //新增解散标记
        msg.force = force;
        for(var i=0;i<room.seats_num;++i){
            var seat = room.seats[i];
            if(seat && seat.user_id >0){
                var data ={
                    user_id:seat.user_id,
                    card_num:0,
                    boom_num:0,
                    base_score:0,
                    rate:0,
                    banker:0,
                    end_score:0,
                    total_score:seat.statistic.total_score,
                }
                msg.end_seats_data.push(data);
            }
            
        }
        userManager.send_to_room('game_over',msg,room_id)
        game_over(room_id,force);
        return;
    }
    //add game end result
    var msg = JSON.parse(msg_templete.SC_game_end);
    //新增解散标记
    msg.force = force;
    //holds value
    //name
    //has cards
    //boom num
    //score
    //检测最后一次出牌是否为炸弹
    //logger.debug("show me last boom ==========>",game.now_card_type,game.now_max_index)
    if(game.now_card_type == global.BOOM){
        game.game_seats[game.now_max_index].boom_value +=1;
    }
    var holds_num = []
    var boom_num = []
    var boom_value =[]
    var score =[]
    for (var i=0;i<game.seats_num;++i){
        var seat_data = game.game_seats[i];
        holds_num.push(seat_data.holds.length);
        score.push(0);
        boom_num.push(seat_data.boom_num);
        boom_value.push(seat_data.boom_value);
    }

    var max_card_num =game.room_info.conf.card_nums;
    var first =holds_num.indexOf(0);
    var winner = global.BANKER_WIN;
    if(first != game.button){
        winner = global.OTHER_WIN;
    }
    
    //不需要再设置庄家
    //设置下一局的庄家
    //game.button = winner;
    var spring = 0;
    //强制结束，不计算分数
    if(!force ){

        //斗地主基础分
        var base_score = game.game_seats[game.button].call_banker;

        if(winner == global.BANKER_WIN){
            //地主赢
            //判断是否是春天
            var count =0;
            for(var a in holds_num){
                if(a != game.button){
                    if(holds_num[a] == max_card_num){
                        count++;
                    }
                }
            }
            if(count ==2){
                game.rate = game.rate<<1;
                spring =1;
            }

            /** 倍率实时变更此处不再添加炸弹倍率
            var boom_count =0;
            for(var b in boom_num){
                boom_count += boom_num[b];
            }

            game.rate = game.rate <<boom_count;
            **/
            for(var c in score){
                if(c == game.button){
                    //score[c] += 2*(global.LANDLORD_BASE_SCORE*game.rate);
                    score[c] += 2*(base_score*game.rate);
                }else{
                    //score[c] -=(global.LANDLORD_BASE_SCORE*game.rate);
                    score[c] -=(base_score*game.rate);
                }
            }

        }else{
            //需要判断反春
            var ref_power = true;
            var seat_data =game.game_seats[game.button];
            var actions = seat_data.action;
            for(var a in actions){
                if(a !=0){
                    if(actions[a] != global.PASS){
                        ref_power= false;
                        break;
                    }
                }
            }

            if(ref_power){
                game.rate = game.rate <<1;
                spring =2;
            }
            /** 
            var boom_count =0;
            for(var b in boom_num){
                boom_count += boom_num[b];
            }

            game.rate = game.rate <<boom_count;
            ***/
            for(var c in score){
                if(c == game.button){
                    //score[c] -= 2*(global.LANDLORD_BASE_SCORE*game.rate);
                    score[c] -= 2*(base_score*game.rate);
                }else{
                    //score[c] +=(global.LANDLORD_BASE_SCORE*game.rate);
                    score[c] +=(base_score*game.rate);
                }
            }

        }
    // //计算剩余牌
    //     for(var a in holds_num){
    //         if(a != winner){
    //             if(holds_num[a] >1){
    //                 if(holds_num[a] != max_card_num){
    //                     score[winner] += holds_num[a];
    //                     score[a] -= holds_num[a];
    //                 }else{
    //                     score[winner] += 2*holds_num[a];
    //                     score[a] -= 2*holds_num[a];
    //                 }

    //             }else{
    //                 //只剩一张牌不扣分
    //             }
    //         }
    //     }
    //     //计算炸弹
    //     for(var b in boom_value){
    //         if(boom_value[b] !=0){
    //             for(var c in score){
    //                 if(b !=c){
    //                     score[c] -= 10*boom_value[b];
    //                 }else{
    //                     score[c] += 10*(game.seats_num-1)*boom_value[b];
    //                 }
    //             }
    //         }
    //     }
    }
    //组合结算信息
    //user_id:0,
    // card_num:0,
    // boom_num:0,
    // score:0,
    for(var a=0;a<score.length;++a){
        var seat_statistic = game.game_seats[a].statistic;
        //处理统计信息seat_data.statistic
        // max_score:0,
        // boom_counts:0,
        // win_counts:0,
        // lose_counts:0,
        // total_score:0,
        if(score[a] >seat_statistic.max_score){
            seat_statistic.max_score = score[a];
        }
        if(score[a] >0){
            seat_statistic.win_counts +=1;
        }
        else if(score[a]<0){
            seat_statistic.lose_counts +=1;
        }
        seat_statistic.boom_counts += boom_num[a];
        seat_statistic.total_score += score[a];

        game.room_info.seats[a].score = seat_statistic.total_score;

        var base_score =0;
        if(game.button != -1){
            base_score =game.game_seats[game.button].call_banker
        }

        game.room_info.seats[a].statistic = seat_statistic;

        var data ={
            user_id:game.game_seats[a].user_id,
            card_num:holds_num[a],
            boom_num:boom_num[a],
            base_score:base_score,
            rate:game.rate,
            banker:game.button,
            end_score:score[a],
            spring: spring,//0无 , 1 春天，2反春
            total_score:seat_statistic.total_score,
        }

        msg.end_seats_data.push(data)

    }

    //游戏状态改变
    game.state = global.GAME_STATE_FREE
    notice_game_state(game.room_info.id,game.state);

    //游戏结果
    userManager.send_to_room('game_over',msg,game.room_info.id)
    
    //清除玩家状态

    //需要清除当前还剩余的牌和其它一些临时信息
    //data.holds = [];
    //data.folds = [];
    //data.action = [];
    //data.boom_num =0;

    for(var i=0;i<game.seats_num;++i){
        var seat_data =game.game_seats[i];
        seat_data.holds =[];
        seat_data.folds =[];
        seat_data.action =[];
        seat_data.boom_num =0;
        seat_data.boom_value =0;
        seat_data.boom_value_index =-1;
        exports.set_ready(seat_data.user_id,false);
    }
    
    //poker数组
    //是否写入历史记录
    // logger.debug('show me check game over .................',game.game_index,game.room_info.conf.max_games,game.room_info.num_of_games)
    if(game.game_index == game.room_info.conf.max_games || (force && over)){
        is_game_over = true
    }

    //如果是第一局扣除房主金币
    if(!force &&game.game_index ==1){
        if(!game.conf.free && (!game.room_info.agent_user_id || game.room_info.agent_user_id==0)){
            //房卡游戏
            if(global.has_rule(game.conf.rule_index,global.MASK_INGOT_GAME)){
                if(game.game_index == 1){
                    var ingot_value = global.get_ingot_value(game.conf.rule_index);
                    user_lose_ingot(game.conf.creator,ingot_value);
                }
            }
            //金币游戏
            if(global.has_rule(game.conf.rule_index,global.MASK_GOLD_GAME)){
                //检测每位玩家是否是第一局，如果是第一局就扣除所有玩家一份金币
                //因为此处并不允许缺人开始，所以仅仅是第一局的时候就可以扣除每个玩家的金币
                if(game.game_index ==1){
                    var gold_value = global.get_ingot_value(game.conf.rule_index);
                    for(var i=0;i<game.room_info.seats_num;++i){
                        var seat_d = game.game_seats[i];
                        if(seat_d && seat_d.user_id >0){
                            user_lose_gold(seat_d.user_id,gold_value);
                        }
                    }
                }
            }
        }
        roomManager.update_room_seat_info(room_id);
    }

    //prepare clean game cache
    //将数据存放到数据库
    update_room_info(game,true,score,force);

    if(is_game_over){
        game_over(room_id,force);
        return;
    }
}

//game over
function game_over (room_id,force){
    //logger.debug("call game over ---------------->",room_id,force);
    if(force != true){force = false;};
    var game = games[room_id];
    if(game == null){
        //走房间解散流程
        //房间结算，游戏中不结算
        var room = roomManager.getRoom(room_id);
        if(room == null) return;
        var msg = JSON.parse(msg_templete.SC_game_over);

        for(var i=0;i<room.seats_num;++i){
            var seat_data = room.seats[i];
            if(seat_data && seat_data.user_id >0){
                var seat_statistic = seat_data.statistic;
                var data ={
                    max_score:seat_statistic.max_score,
                    boom_counts:seat_statistic.boom_counts,
                    win_counts:seat_statistic.win_counts,
                    lose_counts:seat_statistic.lose_counts,
                    redheart_ten_counts:seat_statistic.redheart_ten,
                    total_score:seat_statistic.total_score,
                }
                msg.over_seats_data.push(data);
            }
        }
        userManager.send_to_room('game_result',msg,room_id);
        //清除掉游戏
        userManager.kickAllInRoom(room_id);
        var reason = (force)?global.ROOM_ACHIVE_DIS:global.ROOM_ACHIVE_OVER;
        roomManager.destroy(room_id,reason);
        return;
    }

    var msg = JSON.parse(msg_templete.SC_game_over);

    // max_score:0,
    // boom_counts:0,
    // win_counts:0,
    // lose_counts:0,
    // total_score:0,
    for(var i=0;i<game.seats_num;++i){
        var seat_statistic = game.game_seats[i].statistic;
        var data ={
            max_score:seat_statistic.max_score,
            boom_counts:seat_statistic.boom_counts,
            win_counts:seat_statistic.win_counts,
            lose_counts:seat_statistic.lose_counts,
            total_score:seat_statistic.total_score,
        }
        msg.over_seats_data.push(data);
    }
    
    userManager.send_to_room('game_result',msg,room_id);

    


    //write data to db

    //clean data 
    
    //chean 玩家身上的数据
    //清除掉游戏
    userManager.kickAllInRoom(room_id);
    var reason = (force)?global.ROOM_ACHIVE_DIS:global.ROOM_ACHIVE_OVER;
    roomManager.destroy(room_id,reason);
    games[room_id] == null;
}
//game dump begin ---------------------------------------------------------------------------------------
//we need
//{ roominfo:game<>,step<>,result}
// 1，临时数据保存(用于游戏恢复)  {room_uuid,game_index,base_info,create_time,snapshots,action_records,result}
// 2，完整数据用于回放   {room_uuid,game_index,base_info,create_time,snapshots,action_records,result}

//用于存放临时数据(固定不会变得数据)
function init_game_base_info(game){
    //base_info包含内容:<创建后不会变>
    //conf,room_info,button,seats_num,current_index,poker,
    //房间配置信息，房间信息,庄家，作为数量，当前的index,卡牌
    //statistic包含内容：<创建后不会变，只有游戏结束后才会改变>
    //statistic: {max_score,boom_counts,win_counts,lose_counts,total_score}
    //change_info:随时更改的信息
    //turn,boom_value_index,state,now_max_index,now_card_type,now_card_data,black_three,boom_num_list,boom_value_list
    data ={}
    
    data.uuid = game.room_info.uuid;
    data.game_index = game.room_info.num_of_games;
    data.create_time = game.room_info.create_time;
    //基础信息
    data.base_info ={
        conf:game.conf,
        //button:game.button,
        seats_num:game.seats_num,
        current_index:game.current_index,
        poker:game.poker,
        begin_call:game.begin_call//开始的地主位置
    };
    data.holds =[];
    data.folds =[];
    data.actions =[];
    data.result =[];
    //统计信息
    data.statistic =[];
    //变化信息
    data.change_info ={
        turn:game.turn,
        boom_value_index:game.boom_value_index,
        state:game.state,
        now_max_index:game.now_max_index,
        now_card_type:game.now_card_type,
        now_card_data:game.now_card_data,
        black_three:game.black_three,
        boom_num_list:[],
        boom_value_list:[],
        button:game.button,
        rate:game.rate,//new add 倍率
        landlord_card:game.landlord_card,
        call_banker:[],//叫地主列表
    }
    for(var i=0;i<game.game_seats.length;++i){
        var seats_data = game.game_seats[i];
        data.holds.push(seats_data.holds);
        data.folds.push(seats_data.folds);
        data.actions.push(seats_data.action);
        data.result.push(0);
        data.statistic.push(seats_data.statistic);
        data.change_info.boom_num_list.push(seats_data.boom_num);
        data.change_info.boom_value_list.push(seats_data.boom_value);
        data.change_info.call_banker.push(seats_data.call_banker);
    }

    logger.debug("Init game base Info to DB===>",JSON.stringify(data));

    db.init_game_base_info(data,function(err,rows,fileds){
        if(err){
            logger.error(err.stack);
            return;
        }
        if(rows[0][0].result != 1){
            logger.warn('init game to db result = %d',rows[0][0].result);
        }
    });
}

/**
 * 获取需要(实时)更新的数据
 * **/
function get_game_update_info(game){
    //change_info:随时更改的信息
    //turn,boom_value_index,state,now_max_index,now_card_type,now_card_data,black_three,boom_num_list,boom_value_list
    var data = {};
    data.room_uuid= game.room_info.uuid;
    data.game_index = game.room_info.num_of_games;
    data.holds =[];
    data.folds =[];
    data.actions = [];
    data.change_info ={
        turn:game.turn,
        boom_value_index:game.boom_value_index,
        state:game.state,
        now_max_index:game.now_max_index,
        now_card_type:game.now_card_type,
        now_card_data:game.now_card_data,
        black_three:game.black_three,
        boom_num_list:[],
        boom_value_list:[],
        button:game.button,//庄家
        //added 解散信息
        dissmiss:game.room_info.dissmiss,
        rate:game.rate,
        landlord_card:game.landlord_card,//地主牌
        begin_call:game.begin_call,//开始叫地主的索引
        call_banker:[],//叫庄信息
    }
    //data.result =[];
    for(var i in game.game_seats){
        var seats_data = game.game_seats[i];
        data.holds.push(seats_data.holds);
        data.folds.push(seats_data.folds);
        data.actions.push(seats_data.action);
        data.change_info.boom_num_list.push(seats_data.boom_num);
        data.change_info.boom_value_list.push(seats_data.boom_value);
        data.change_info.call_banker.push(seats_data.call_banker);
    }
    //TODO 可变信息缺少一个解散信息

    return data;
}


/**
 * 获取结算信息
 * **/
function get_game_end_info(game){
    //
}

//实时更新游戏每个步骤
function update_game_info(game){
    var data = get_game_update_info(game);

    logger.debug("Update game info to DB===>",JSON.stringify(data));

    var self = this;
    db.update_game_info(data,function(err,rows,fileds){
        if(err){
            logger.error(err.stack);
            return;
        }
        if(rows[0][0].result !=1){
            logger.warn('update game info get result = %d',rows[0][0].result);
        }
    });
}

//从数据库中加载游戏
function load_game_from_db (game){
    
    var ret = null;
    db.load_game_from_db(game.room_info.room_uuid,function(err,rows,fields){
        if(err){
            logger.error(err.stack);
            return;
        }    
    });
}

//更新房间信息
function update_room_info(game,is_game_end,score,force){
    //游戏轮数
    if(is_game_end!= true){is_game_end = false;};
    if(!score){score =[];};
    if(force != true){force = false;};
    var data ={
        room_uuid:game.room_info.uuid,
        game_index:game.game_index,
        score_list:[],
        change_info:game.room_info.change_info,
    };
    // max_score:0,
    // boom_counts:0,
    // win_counts:0,
    // lose_counts:0,
    // total_score:0,
    for(var i=0;i<game.seats_num;++i){
        var seat_statistic = game.game_seats[i].statistic;
        data.score_list.push(seat_statistic.total_score);
    }

    db.update_room_info(data,function(err,rows,fields){
        if(err){
            logger.error(err.stack);
            return;
        }
        if(is_game_end){
            //强制解散
            var par ={
                room_uuid:game.room_info.uuid,
                game_index:game.game_index,
                create_time:game.room_info.create_time,
                force :Number(force),
                result :score
            };
            store_game(par);
        }
    });
}

//游戏结束后将结果存放入固定的表
function store_game (args){
    //需要结果
    //如果是强制解散则清理掉这条记录
    //将整个游戏移动到archive中

    db.add_result_achive_game(args,function(err,rows,fields){
        if(err){
            logger.error(err.stack);
        }
        if(rows[0][0].result !=1){
            logger.warn("add result achive game get result = %d",rows[0][0].result);
        }
    });
}

/**
 * 从数据库实例化游戏
 * **/
exports.init_game_from_db = function(db_data,room_info){
    var room_id = db_data.id;
    if(room_id == null) return;
    var game = games[db_data.id];
    if(game == null){
        //游戏不存在初始化
        var base_info = JSON.parse(db_data.gamebaseinfo);
        var action_list = JSON.parse(db_data.actions);
        var result_list = JSON.parse(db_data.result);
        var statistic = JSON.parse(db_data.statistic);
        var change_info = JSON.parse(db_data.change_info);
        var holds = JSON.parse(db_data.holds);
        var folds = JSON.parse(db_data.folds);
        var game_index = db.num_of_turns;

        //logger.debug("show me room_info==========>",room_info)
        //初始化基础信息
        //baseinfo {"conf":{"type_index":2,"rule_index":2442,"creator":10000,"max_games":10,"poker_nums":48,"card_nums":16},
        //"button":0,"seats_num":3,"current_index":48,"poker":[]}
        var seats = room_info.seats;
        game ={
            conf:base_info.conf,
            room_info:room_info,
            game_index:room_info.num_of_games,
            //button:base_info.button,
            button:change_info.button,
            seats_num:base_info.seats_num,
            current_index:base_info.current_index,
            poker:base_info.poker,
            game_seats:new Array(room_info.seats_num),
            num_of_que:0,
            turn:change_info.turn,
            boom_value_index:change_info.boom_value_index,
            state:change_info.state,
            chupai_cnt:0,
            now_max_index:change_info.now_max_index,
            now_card_type:change_info.now_card_type,
            now_card_data:change_info.now_card_data,
            black_three:change_info.black_three,
            rate:change_info.rate,
            landlord_card:change_info.landlord_card,//地主牌
            begin_call:base_info.begin_call,//开始叫地主的索引
        }
        //初始化其它信息
        for(var i=0;i<room_info.seats_num;++i){
            var data = game.game_seats[i] ={};
            data.seat_index =i;
            data.user_id = seats[i].user_id;
            data.holds = holds[i];
            data.folds = folds[i];
            data.action = action_list[i];
            data.boom_num = change_info.boom_num_list[i];
            data.boom_value = change_info.boom_value_list[i];
            data.statistic =statistic[i];
            data.call_banker = change_info.call_banker[i];
            game_seats_of_user[data.user_id] = data;
        }
        //增加解散信息
        if(change_info.dissmiss){
            room_info.dissmiss = change_info.dissmiss;
            apply_dissmiss_room[room_id];
        }
        games[room_id] = game;
        //初始化可变信息
    }else{
        //TODO确定是否要更新
    }
    

}
//game dump over---------------------------------------------------------------------------------------------------------

//get player game
function get_game_by_user (user_id){
    var room_id = roomManager.getUserRoom(user_id);
    if(room_id == null){
        return null;
    }
    var game = games[room_id];
    return game;
}

//get seat index
function get_seat_index (user_id){
    return roomManager.getUserSeat(user_id);
}


//玩家扣除钻石
function user_lose_ingot (user_id,ingot_value){
    logger.debug("user[%d] lose ingot[ingot_value].....",user_id,ingot_value);
    db.cost_ingot(user_id,ingot_value,function (error,rows,fileds){
        if(error){
            logger.error(error.stack);
            return;
        }
        if(rows[0][0].result != 1){
            logger.warn('user lose ingot db result = %d',rows[0][0].result);
        }else{
            logger_manager.insert_ingot_log(user_id,user_id,0,log_point.INGOT_COST_OPEN,ingot_value,rows[0][0].now_ingot)
        }
    });
}

//玩家扣除金币
function user_lose_gold(user_id,gold_value){
    logger.debug("user[%d] lose gold[gold_value].....",user_id,gold_value);
    db.cost_gold(user_id,gold_value,function (error,rows,fileds){
        if(error){
            logger.error(error.stack);
            return;
        }
        if(rows[0][0].result != 1){
            logger.warn('user lose gold db result = %d',rows[0][0].result);
        }else{
            logger_manager.insert_gold_log(user_id,user_id,0,log_point.GOLD_COST_OPEN,gold_value,rows[0][0].now_gold);
        }
    });
}

//广播手牌变化
function notice_user_holds_change (user_id,holds,folds,show_all){
    if(show_all != true){show_all = false;};
    var game = get_game_by_user(user_id);
    if(game==null) return;
    var seat_data = game.game_seats;
    if(seat_data == null) return;

    var crypt_holds = get_crypt_list(holds.length);
    var crypt_msg ={
        user_id:user_id,
        holds:crypt_holds,
        folds:folds,
    };
    for(var a in seat_data){
        var data = seat_data[a];
        if(data.user_id == user_id ||show_all){
            crypt_msg.holds = holds;
            userManager.sendMsg(data.user_id,'game_holds_push',crypt_msg);
        }else{
            crypt_msg.holds = crypt_holds;
            userManager.sendMsg(data.user_id,'game_holds_push',crypt_msg);
        }
    }
}

//游戏状态广播
function notice_game_state (room_id,game_state){
    var msg = JSON.parse(msg_templete.SC_game_state);
    msg.state = game_state;
    userManager.send_to_room("game_state_push",msg,room_id);
}

//确定游戏没有开始
exports.has_began = function(room_id){
    var game =games[room_id];
    if(game == null) return false;
    if(game.state != global.GAME_STATE_FREE || game.game_index !=0){
        return true;
    }
    return false;
}

//申请解散游戏
exports.apply_dissmiss = function(room_id,user_id){
    var room_info = roomManager.getRoom(room_id);
    if(room_info == null){
        return null;
    }

    if(room_info.dissmiss != null){
        return null;
    }

    var seatIndex = roomManager.getUserSeat(user_id);
    if(seatIndex == null){
        return null;
    }

    room_info.dissmiss = {
        chose_index:0,
        endTime:Date.now() + global.DISMISS_TIME,
        states:[]
    };
    for(var i=0;i<room_info.seats_num;++i){
        room_info.dissmiss.states.push(false);
    }
    room_info.dissmiss.states[seatIndex] = true;
    room_info.dissmiss.chose_index += 0x01<<(seatIndex+1);
    //设置超时强制解散
    var timer = setTimeout(function(){
        exports.force_over_room(room_id);
    },global.DISMISS_TIME);

    apply_dissmiss_room.push(room_id);
    apply_dissmiss_timer[room_id] = timer;

    return room_info;
}
//操作
exports.dissolve_operation = function(room_id,user_id,agree){
    var room_info = roomManager.getRoom(room_id);
    if(room_info == null) return null;
    if(room_info.dissmiss == null) return null;
    var seat_index = roomManager.getUserSeat(user_id);
    if(seat_index == null) return null;

    //如果已经做了选择就不让再选择了
    if((room_info.dissmiss.chose_index &(0x01<<(seat_index+1)))!=0){
        return null;
    }

    //同意
    if(agree == true){
        room_info.dissmiss.states[seat_index] = true;
        room_info.dissmiss.chose_index += 0x01<<(seat_index+1);
    }else{
        //拒绝
        room_info.dissmiss = null;
        var index = apply_dissmiss_room.indexOf(room_id);
        if(index !=-1){
            apply_dissmiss_room.splice(index,1);
        }
        //取消超时强制解散
        var timer = apply_dissmiss_timer[room_id];
        if(timer != null) {
            clearTimeout(timer);
            apply_dissmiss_timer[room_id] = null;
        }

    }
    return room_info;
}

//强制解散房间
exports.force_over_room = function (room_id){
    var room_info = roomManager.getRoom(room_id);
    if(room_info == null){
        return null;
    }
    game_end(room_id,true,true);

}

//导出的方法
exports.get_game_by_user = function(user_id){
    return get_game_by_user(user_id);
}

//抢地主轮子推送
function call_banker_broad(game,call_value){
    var msg = JSON.parse(msg_templete.SC_CallBankTurnPush);
    msg.turn = game.turn;
    msg.begin_call = game.begin_call;
    msg.current_max_value = call_value
    msg.rate = game.rate;
    userManager.send_to_room('call_turn_push',msg,game.room_info.id);
}

//叫地主移动到下一家
function call_move_to_next(game){
    var cur_turn  = game.turn;

    //真实的下一家
    var next_value_turn = -1;

    var next_turn = (cur_turn +1)%3;
    var seat_data = game.game_seats[next_turn];
    while(next_turn != cur_turn){
        if(seat_data.call_banker ==0){
            next_turn =(next_turn+1)%3;
            seat_data = game.game_seats[next_turn];
        }else{
            next_value_turn = next_turn;
            break;
        }
    }
    return next_value_turn;
}

//斗地主
exports.call_banker = function(user_id,callif){
    var game = get_game_by_user(user_id);
    if(game == null) return;

    if(game.state != global.GAME_STATE_CALL_LANDLORD){
        logger.warn("call banker not in state call landlord.")
        return;
    }

    var seat_index = get_seat_index(user_id);

    if(game.turn != seat_index){
        logger.warn("call banker not the turn.")
        return;
    }

    //座位信息
    var seat_data = game.game_seats[game.turn];


    if(seat_data.call_banker == 0){
        logger.warn("call banker has reject not call again.");
        return;
    }
    //叫地主，基础分可加倍
    var is_call_end = false;
    var need_force_end = false;
    if(callif !=0){
        //庄家抢地主
        if(game.turn == game.begin_call){
            if(seat_data.call_banker ==1){
                //庄家第二次选择地主,则庄家为地主
                is_call_end = true;
                //turn 不变
                //倍率增加
                game.rate = game.rate <<1;
            }else{
                //庄家第一次选择地主
                seat_data.call_banker =1;//设置地主
                game.turn = (game.turn +1)%3;//移动到下一位
                //倍率增加
                game.rate = game.rate <<1;
            }
        }else{
            //非庄家抢地主
            var next_turn = (game.turn +1)%3;//下一家
            //如果下家是庄家
            if(next_turn == game.begin_call){
                //如果庄家放弃抢地主那么，抢地主结束，当前玩家为地主
                if(game.game_seats[next_turn].call_banker ==0){
                    is_call_end = true;
                    seat_data.call_banker =1;
                    //倍率增加
                    game.rate = game.rate <<1;
                }else{
                    //如果庄家未放弃地主继续轮到庄家
                    seat_data.call_banker =1;
                    game.turn =next_turn;
                    //倍率增加
                    game.rate = game.rate <<1;
                }
            }else{
                //如果下家不是庄家，继续
                seat_data.call_banker =1;
                game.turn = next_turn;
                game.rate = game.rate <<1;
            }
        }

        var msg = JSON.parse(msg_templete.SC_CallLandLord);
        msg.user_id = user_id;
        msg.seat_index = seat_index;
        msg.call = callif;
        msg.rate = game.rate;
        //console.log("=============>",msg)
        userManager.send_to_room('call_banker_push',msg,game.room_info.id);
        if(!is_call_end){
            call_banker_broad(game,call_value);
        }
    }else{
        //庄家放弃地主
       if(game.turn == game.begin_call){
            //庄家放弃地主（第二次选择）
            if(seat_data.call_banker ==1){
                //上家抢地主的为地主
                is_call_end = true;
                seat_data.call_banker =0;
                //查找上一家叫地主的
                var next_turn =(game.turn +1)%3;
                var next_seat_data = game.game_seats[next_turn];

                var next_turn2 =(next_turn+1)%3;
                var next_seat_data2 = game.game_seats[next_turn2];

                if(next_seat_data2.call_banker ==1){
                    game.turn = next_turn2;
                }else{
                    if(next_seat_data.call_banker ==1){
                        game.turn = next_turn;
                    }else{
                        game.turn = -1;
                        need_force_end =true;
                    }
                }

            }else{
                //庄家第一次选择
                var next_turn = (game.turn+1)%3;
                game.turn = next_turn;
                seat_data.call_banker =0;
            }
       }else{
           //非庄家放弃地主
           var next_turn = (game.turn +1)%3;
           var next_seat_data = game.game_seats[next_turn];
           if(next_turn == game.begin_call){
               //下家为庄家
               if(next_seat_data.call_banker ==0){
                   //庄家放弃，找前面的玩家是否有叫地主的
                   var next_turn2 = (next_turn+1)%3;
                   var next_seat_data2 = game.game_seats[next_turn2];
                   if(next_seat_data2.call_banker ==0){
                       is_call_end =true;
                       need_force_end = true;
                       seat_data.call_banker =0;
                       game.turn =-1;
                   }else if(next_seat_data2.call_banker ==1){
                        is_call_end = true;
                        seat_data.call_banker =0;
                        game.turn = next_turn2;
                   }else{
                       console.log("none banker give up landlord error");
                   }
               }else{
                   //庄家没放弃继续庄家
                   seat_data.call_banker =0;
                   game.turn = next_turn;
               }
           }else{
               //下家不是庄家
               seat_data.call_banker =0;
               game.turn = next_turn;
           }
        }

        var msg = JSON.parse(msg_templete.SC_CallLandLord);
        msg.user_id = user_id;
        msg.seat_index = seat_index;
        msg.call = callif;
        msg.rate = game.rate;

        userManager.send_to_room('call_banker_push',msg,game.room_info.id);
        //叫地主未结束才会向下移动

        if(!is_call_end){
            call_banker_broad(game,0);
        }
    }
    //如果已经完成抢地主，把最后几张牌明牌，并发送给已经赢了的玩家
    if(is_call_end){
        game.button = game.turn;//设置庄家

        //添加地主牌
        var landlord_card =[]
        while(game.current_index < game.conf.poker_nums){
            landlord_card.push(game.poker[game.current_index]);
            game.current_index ++;
        }

        var base_score =0;
        if(game.button !=-1){
            base_score = game.game_seats[game.button].call_banker;
        }
        var msg = JSON.parse(msg_templete.SC_CallLandLordEnd);
        msg.base_score = base_score;
        msg.button = game.button;
        msg.rate = game.rate;

        var landlord_seats_data = game.game_seats[game.button];
        for(var a in landlord_card){
            
            msg.cards.push(landlord_card[a]);
            if(!need_force_end){
                landlord_seats_data.holds.push(landlord_card[a]);
                game.landlord_card.push(landlord_card[a]);
            }
        }

        //推送地主牌
        userManager.send_to_room('call_end_push',msg,game.room_info.id);
        if(need_force_end){
            //更新信息
            update_game_info(game);
            game_end(game.room_info.id,true,false);
        }else{
            game.state = global.GAME_STATE_PLAYING;
            //推动玩家的牌变动
            notice_user_holds_change(landlord_seats_data.user_id,landlord_seats_data.holds,landlord_seats_data.folds);
            //推送游戏状态开始
            notice_game_state(game.room_info.id,game.state);
            //广播游戏开始
            userManager.send_to_room('game_begin_push',game.button,game.room_info.id);
            //更新信息
            update_game_info(game);
        }
        return;
    }
    //更新信息
    update_game_info(game);
}

//新的叫庄
exports.call_banker2 = function(user_id,call_value){
    var game = get_game_by_user(user_id);
    if(game == null) return;

    if(game.state != global.GAME_STATE_CALL_LANDLORD){
        logger.warn("call banker not in state call landlord.")
        return;
    }

    var seat_index = get_seat_index(user_id);

    if(game.turn != seat_index){
        logger.warn("call banker not the turn.")
        return;
    }

    //座位信息
    var seat_data = game.game_seats[game.turn];


    if(seat_data.call_banker == 0){
        logger.warn("call banker has reject not call again.");
        return;
    }

    var is_call_end = false;
    var need_force_end = false;

    var next_turn = (game.turn +1)%3;

    //地主叫分检测
    if(call_value <0 || call_value >3){
        logger.warn("call banker value[%d] error ",call_value);
        return;
    }

    var current_max_call_value = 0;
    for(var i=0;i<game.game_seats.length;++i){
        var tmp_seat_data = game.game_seats[i];
        if(tmp_seat_data){
            if(tmp_seat_data.call_banker >current_max_call_value){
                current_max_call_value = tmp_seat_data.call_banker;
            }
        }
    }

    if(current_max_call_value > call_value && call_value !=0){
        logger.warn("call banker must bigger.")
        return;
    }

    if(call_value !=0){
        //叫地主
        seat_data.call_banker =call_value;
    }else{
        //放弃地主
        seat_data.call_banker = call_value;
    }

    //如果下一家是庄家
    if(next_turn == game.begin_call){
        is_call_end = true;
    }else{
        game.turn = next_turn;
    }

    if(call_value == 3){
        is_call_end = true;
    }

    var msg = JSON.parse(msg_templete.SC_CallLandLord);
    msg.user_id = user_id;
    msg.seat_index = seat_index;
    msg.call = call_value;
    msg.rate = game.rate;
    userManager.send_to_room('call_banker_push',msg,game.room_info.id);


    
    if(!is_call_end){
        call_banker_broad(game,call_value);
    }else{
        //投分最大的玩家
        var max_call_value =0;
        var max_index_list =[];

        for(var i=0;i<game.game_seats.length;++i){
            var seat_info = game.game_seats[i];
            if(seat_info && seat_info.user_id>0){
                if(seat_info.call_banker >max_call_value){
                    max_call_value = seat_info.call_banker;
                }
            }
        }
        if(max_call_value ==0){
            need_force_end = true;
        }else{
            for(var i=0;i<game.game_seats.length;++i){
                var seat_info = game.game_seats[i];
                //console.log("seat info =============>",seat_info);
                if(seat_info && seat_info.user_id>0){
                    if(seat_info.call_banker == max_call_value){
                        max_index_list.push(i);
                    }
                }
            }
            // console.log("max_call_value ---->",max_call_value);
            // console.log("max_call_index============>",max_index_list)
            game.turn = max_index_list[Math.floor(Math.random()*max_index_list.length)];
        }
    }

    // console.log("game.turn ==============>",game.turn);

    //如果已经完成抢地主，把最后几张牌明牌，并发送给已经赢了的玩家
    if(is_call_end){
        game.button = game.turn;//设置庄家
        if(need_force_end){
            game.button =-1;
        }

        //添加地主牌
        var landlord_card =[]
        while(game.current_index < game.conf.poker_nums){
            landlord_card.push(game.poker[game.current_index]);
            game.current_index ++;
        }

        var base_score = 0;
        if(game.button != -1){
            base_score = game.game_seats[game.button].call_banker
        }

        var msg = JSON.parse(msg_templete.SC_CallLandLordEnd);
        msg.base_score = base_score;
        msg.button = game.button;
        msg.rate = game.rate;

        var landlord_seats_data = game.game_seats[game.button];
        for(var a in landlord_card){
            
            msg.cards.push(landlord_card[a]);
            if(!need_force_end){
                landlord_seats_data.holds.push(landlord_card[a]);
                game.landlord_card.push(landlord_card[a]);
            }
        }

        //推送地主牌
        userManager.send_to_room('call_end_push',msg,game.room_info.id);
        if(need_force_end){
            //更新信息
            update_game_info(game);
            game_end(game.room_info.id,true,false);
        }else{
            game.state = global.GAME_STATE_PLAYING;
            //推动玩家的牌变动
            notice_user_holds_change(landlord_seats_data.user_id,landlord_seats_data.holds,landlord_seats_data.folds);
            //推送游戏状态开始
            notice_game_state(game.room_info.id,game.state);
            //广播游戏开始
            userManager.send_to_room('game_begin_push',game.button,game.room_info.id);
            //更新信息
            update_game_info(game);
        }
        return;
    }
    //更新信息
    update_game_info(game);

    
}