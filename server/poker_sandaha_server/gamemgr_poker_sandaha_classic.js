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
var logger = require('./log.js').log_sandaha;

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
    //0123 4567  891011  32 33 34 35  36 37 38 39  40 41 42 43  44  45
    //0000 1111  222 2   8  8  8  8   9  9  9  9   10 10 10 10  11  11
    //5555 6666  888 8   A  A  A  A   2  2  2  2   7  7  7  7  king King
    //
    //need poker_numbers
    var poker = game.poker;
    var poker_nums = game.conf.poker_nums;  //固定为92张，并且为两副扑克
    
    var index =0;
    for(var j=0;j<2;++j){
        for(var i=0;i<46;++i){
            poker[index] =i;
            index ++;
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

    // logger.debug("dispatch info  card_num = %d,player_num = %d",card_num,player_num);

    for(var i=0;i<max_card;++i){
        // console.log("show me seat_index......................",seat_index)
        var poker = game.game_seats[seat_index].holds;
        if(poker == null){
            poker =[];
            game.game_seats[seat_index].holds = poker;
        }
        send_card(game,seat_index);
        seat_index ++;
        seat_index %=player_num;
    }
    //start test
    // var aaa = [45,45,44,44,43,43,42,42,41,41,40,40,39,39,38,38,37,37,36,36,35];
    // game.game_seats[0].holds = aaa;
    // var bbb = [0,0,4,4,8,8,12,12,16,16,20,20,24,24,28,28,32,32,36,36,35];
    // game.game_seats[1].holds = bbb;
    //end test

    //添加底牌
    while(game.current_index < game.conf.poker_nums){
        game.landlord_card.push(game.poker[game.current_index]);
        game.current_index ++;
    }
}
//send card to player index
function send_card (game,seat_index){
    if(game.current_index == game.poker.length){
        return -1;
    }
    var data = game.game_seats[seat_index];
    var poker = data.holds;
    var card = game.poker[game.current_index];
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

        var data = {
            state:game.state,
            num_of_pokers:num_of_poker,
            button:game.button,
            turn:game.turn,
            now_max_index:game.now_max_index,
            now_card_type:game.now_card_type,
            now_card_data:game.now_card_data,
            sandaha:{
                main_color:game.main_color,
                call_score:game.call_score,
                score:game.score,
                max_index:game.now_max_index,
                turn_card:game.turn_card,
            }
        };

        data.seats =[];
        var deputy = [];
        for(var i=0;i<room_info.seats_num;++i){
            var seat_data = game.game_seats[i];
            if(game.state == global.GAME_STATE_PLAYING){
                var main_card = pokerUtils.get_belongs_color_card_list(seat_data.holds,game.main_color,game.main_color);
                deputy.push(main_card.length==0?1:0);
            } else {
                deputy.push(0);
            }
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
        }
        //是否报副.
        data.sandaha.deputy = deputy;
        //show game_seats_of_user
        //logger.debug("show game seats of user =====>",game_seats_of_user[user_id]);
        //notice to client
        userManager.sendMsg(user_id,'game_sync_push',JSON.stringify(data));
        

        if(game.state == global.GAME_STATE_CALL_BANKER){
            //如果还是叫分状态，将发送叫分相关信息
            call_banker_broad(game,game.call_score);
            return;
        }

        if(game.state == global.GAME_STATE_PLAYING){
            //推送当前出牌.
            var msg = JSON.parse(msg_templete.SC_turn);
            msg.turn = game.turn;
            msg.max_index = game.now_max_index;
            msg.now_card_type = game.now_card_type;
            msg.now_card_data = game.now_card_data;
            userManager.sendMsg(user_id,'sdh_turn_push',msg);
        }

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
    if(error_num == error.SUCCESS){
        //check can out
        error_num =check_can_out(user_id,card_data);
        if( error_num == error.SUCCESS){
            //add put card action
            game.game_seats[user_index].action.push(card_data.card_type);
            game.turn_card.push(card_data.cards_data);
            remove_card(user_id,card_data);
        }
    }
    logger.debug('check can out code = %d',error_num);

    var msg_tmp = JSON.parse(msg_templete.SC_out_card);
    msg_tmp.error_code = error_num;
    msg_tmp.out_user = user_id;
    msg_tmp.out_card_type = card_data.card_type;
    msg_tmp.out_cards_data = card_data.cards_data;

    if(error_num == error.SUCCESS){
        userManager.broacastInRoom('out_card_push',msg_tmp,user_id,true);

        //检查此轮出牌是否结束，如果结束需要判断牌的大小,并获得分数，然后确定下一次出牌的玩家.
        move_to_next(game,user_id,card_data);
    }else{
        userManager.sendMsg(user_id,'out_card_push',msg_tmp,card_data.card_type);
    }

}

//检查此轮出牌是否结束，如果结束需要判断牌的大小,并获得分数，然后确定下一次出牌的玩家.
function move_to_next (game,user_id,card_data){
    //判断此轮出牌是否结束
    if((game.turn+1)%game.seats_num == game.now_max_index){
        var dadao = false;
        //比较此轮牌大小
        logger.debug("check_big_or_small=====================>", game.now_card_type, game.turn_card, game.main_color);
        var max_poker_index = pokerUtils.check_big_or_small(game.now_card_type, game.turn_card, game.main_color);
        game.now_max_index = (game.now_max_index+max_poker_index)%game.seats_num;
        logger.debug("check_big_or_small   result======================>", game.now_max_index, max_poker_index);
        //如果此轮最大牌不是庄，则需要计分.
        var score_cards = [];
        var score_value = 0;
        if(game.now_max_index != game.button){
            score_cards = pokerUtils.get_score_card(game.turn_card);
            score_value = pokerUtils.get_score_value(score_cards);
            if(score_cards.length != 0) {
                game.score_card = game.score_card.concat(score_cards);
                game.score += score_value;
                if(game.score >= game.call_score+70){
                    dadao = true;
                }
            }
        }
        //推送此轮出牌结果.
        var msg = JSON.parse(msg_templete.SC_Turn_Result);
        msg.max_index = game.now_max_index;
        msg.score_card = score_cards;
        msg.score_value = score_value;
        msg.score = game.score;
        userManager.send_to_room("sdh_turn_result_push",msg,game.room_info.id);

        //判断游戏结束.
        var seat_data = game_seats_of_user[user_id];
        if(dadao || seat_data.holds.length == 0){
            update_game_info(game);
            game_end(game.room_info.id,false);
            return;
        }

        //这一轮出牌第一个出牌索引.
        game.turn = game.now_max_index;

        game.now_card_type = 0;
        game.now_card_data =[];
        //清掉turn_card
        game.turn_card = [];
    } else {
        //如果是此轮第一次出牌 则需要记录此次出牌的牌形和牌数据.
         if(game.now_card_type == 0){
              game.now_card_type = card_data.card_type;
              game.now_card_data = card_data.cards_data;
         }
         game.turn = (game.turn+1)%game.seats_num;
    }

    //dump data to db----this can use to resue game
    update_game_info(game);

    var msg = JSON.parse(msg_templete.SC_turn);
    msg.turn = game.turn;
    msg.max_index = game.now_max_index;
    msg.now_card_type = game.now_card_type;
    msg.now_card_data = game.now_card_data;
    userManager.broacastInRoom('sdh_turn_push',msg,user_id,true);
}
//check can out card
function check_can_out (user_id,card_data){
    //check game
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

    if(!pokerUtils.check_card_type(seat_data.holds,game.now_card_type,game.now_card_data,card_data.card_type,card_data.cards_data,game.main_color)){
        logger.warn("check type filed -------------------------->>>>>")
        return error.GAME_ERROR_CARD_TYPE_INVALID;
    }
    return error.SUCCESS;
}
//remove card
function remove_card (user_id,card_data){
    var seat_data = game_seats_of_user[user_id];
    //set server cache
    var game = get_game_by_user(user_id);
    var user_index = get_seat_index(user_id);
    //holds remove
    remove_from_list(seat_data.holds,card_data.cards_data);
    //folds add
    //add_to_list(seat_data.folds,card_data.cards_data);
    seat_data.folds.push(card_data.cards_data);
    notice_user_holds_change(user_id,seat_data.holds,seat_data.folds);

    return error.SUCCESS;
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
            landlord_card:[],//底牌
            bury_card:[],//埋牌
            begin_call:-1,//开始叫庄的索引
            main_color:-1,//主花色
            call_score:0,//叫分
            score:0,//得分
            turn_card:[],//轮次出牌数组
            score_card:[],//得分牌列表
        }

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
        game.bury_card=[];//埋牌
        game.begin_call = -1;//开始叫地主的索引
        game.main_color = -1;//主花色
        game.call_score = 0;//叫分
        game.score = 0;//得分
        game.turn_card = [];//轮次出牌数组
        game.score_card = [];//得分牌列表

        roominfo.num_of_games ++;
        game.game_index ++;

        logger.debug('show me rebegin game ==========>',game);

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

    logger.warn("show me I need Info  now_type [%d], now_max_index[%d], turn[%d] ,banker[%d] ",game.now_card_type,game.now_max_index,game.turn,game.button);

    //洗牌
    shuffle(game);

    //发牌
    dispatch_card(game);

    //开始抢庄--第一个叫分玩家为庄家
    game.turn = game.button;
    game.begin_call = game.turn;

    //notife
    var num_of_poker = game.poker.length - game.current_index;

    //叫庄阶段
    game.state = global.GAME_STATE_CALL_BANKER;

    for(var i=0;i<seats.length;++i){
        //client need know
        var s= game.game_seats[i];
        //show hand card
        notice_user_holds_change(s.user_id,s.holds,s.folds);
        //show all cards leave
        userManager.sendMsg(s.user_id,'poker_count_push',num_of_poker);
        //show how manney play counts
        userManager.sendMsg(s.user_id,'game_num_push',roominfo.num_of_games);
    }
    userManager.send_to_room('game_begin_push',game.button,roominfo.id);

    notice_game_state(roominfo.id,game.state);

    call_banker_broad(game,game.call_score);

    //开始增加更新房间信息
    update_room_info(game);

    //初始化房间信息
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
                    end_score:0,
                    total_score:seat.statistic.total_score,
                }
                msg.end_seats_data.push(data);
            }
            
        }
        userManager.send_to_room('sdh_game_over',msg,room_id)
        game_over(room_id,force);
        return;
    }


    //add game end result
    var msg = JSON.parse(msg_templete.SC_game_end);
    //新增解散标记
    msg.force = force;

    //判断是否扣底.(最后轮次赢家不是庄，并且牌全部出完.)
    var already_complete = true;
    for(var i=0;i<game.seats_num;++i){
        var seat_data =game.game_seats[i];
        if(seat_data.holds.length != 0){
            already_complete = false;
            break;
        }
    }
    if(game.now_max_index != game.button && already_complete){
        msg.has_dig = true;
        var score_cards = pokerUtils.get_score_card_list(game.bury_card);
        var score_value = pokerUtils.get_score_value(score_cards);
        msg.bury_card = game.bury_card;
        msg.dig_score_cards = score_cards;
        //判断扣底倍率.
        var rate = 1;
        if(game.now_card_type == global.SINGLE){
            rate *= 1;
        }
        if(game.now_card_type == global.DOUBLE || game.now_card_type == global.MORE_DOUBLE){
            var size = game.now_card_data.length/2;
            rate *= 2<<(size-1);
        }
        score_value *= rate;
        game.score += score_value;
        game.score_card = game.score_card.concat(score_cards);
        msg.dig_score_value = score_value;
        msg.dig_score_rate = rate;
    } else {
        msg.has_dig = false;
    }

    msg.give_up = false;
    msg.score_card = game.score_card;
    msg.call_score = game.call_score;
    msg.game_score = game.score;
    //判断输赢.
    var winner = global.BANKER_WIN;
    if(game.score >= game.call_score){
        winner = global.OTHER_WIN;
    }
    msg.winner = winner;

    var user_score =new Array(game.seats_num);
    for (var i=0;i<game.seats_num;++i){
        user_score[i] = 0;
    }

    //强制结束，不计算分数
    if(!force ) {
        //三打哈基础分
        var base_score = global.SANDAHA_BASE_SCORE;
        var win_lose_state = global.NORMAL;
        var rate = 1;
        if(winner == global.BANKER_WIN){
            //小光
            if(game.score < 30){
                win_lose_state = global.XIAO_GUANG;
                rate = 2;
            }
            //大光
            if(game.score == 0){
                win_lose_state = global.DA_GUANG;
                rate = 3;
            }
        }else{
            //垮庄
            win_lose_state = global.PASS_BOTTON
            //小倒
            if(game.score >= game.call_score+40){
                win_lose_state = global.XIAO_DAO;
                rate = 2;
            }
            //大倒
            if(game.score >= game.call_score+70){
                win_lose_state = global.DA_DAO
                rate = 3;
            }
        }
        //计算分数.
        for (var i=0;i<game.seats_num;++i){
            if(i == game.button){
                if(winner == global.BANKER_WIN){
                    user_score[i] = base_score * rate * 3;
                } else {
                    user_score[i] = -(base_score * rate * 3);
                }
            } else {
                if(winner == global.BANKER_WIN){
                    user_score[i] = -(base_score * rate);
                } else {
                    user_score[i] = base_score * rate;
                }
            }
        }
        msg.win_lose_state = win_lose_state;
    }

    //组合结算信息
    for(var a=0;a<user_score.length;++a){
        var seat_statistic = game.game_seats[a].statistic;
        //处理统计信息seat_data.statistic
        if(user_score[a] >seat_statistic.max_score){
            seat_statistic.max_score = user_score[a];
        }
        if(user_score[a] >0){
            seat_statistic.win_counts +=1;
        }
        else if(user_score[a]<0){
            seat_statistic.lose_counts +=1;
        }
        seat_statistic.total_score += user_score[a];

        game.room_info.seats[a].score = seat_statistic.total_score;

        var data ={
            user_id:game.game_seats[a].user_id,
            end_score:user_score[a],
            total_score:seat_statistic.total_score,
        }
        msg.end_seats_data.push(data)

        game.room_info.seats[a].statistic = seat_statistic;
    }

    //判断庄是否更改. 当闲家赢， 则庄则改为下一位.
    if(winner == global.OTHER_WIN){
        game.button = (game.button+1)%game.seats_num;
    }

    //游戏状态改变
    game.state = global.GAME_STATE_FREE
    notice_game_state(game.room_info.id,game.state);

    //游戏结果
    userManager.send_to_room('sdh_game_over',msg,game.room_info.id);

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
    logger.debug('show me check game over .................',game.game_index,game.room_info.conf.max_games,game.room_info.num_of_games)
    if(game.game_index == game.room_info.conf.max_games || (force && over)){
        is_game_over = true
    }

    //如果是第一局扣除房主金币
    if(!force){
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
        roomManager.update_room_seat_info(game.room_info.id);
    }

    //prepare clean game cache
    //将数据存放到数据库
    update_room_info(game,true,user_score,force);

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
                    win_counts:seat_statistic.win_counts,
                    lose_counts:seat_statistic.lose_counts,
                    total_score:seat_statistic.total_score,
                }
                msg.over_seats_data.push(data);
            }
        }
        userManager.send_to_room('sdh_game_result',msg,room_id);
        //清除掉游戏
        userManager.kickAllInRoom(room_id);
        var reason = (force)?global.ROOM_ACHIVE_DIS:global.ROOM_ACHIVE_OVER;
        roomManager.destroy(room_id,reason);
        return;
    }

    var msg = JSON.parse(msg_templete.SC_game_over);

    // max_score:0,
    // win_counts:0,
    // lose_counts:0,
    // total_score:0,
    for(var i=0;i<game.seats_num;++i){
        var seat_statistic = game.game_seats[i].statistic;
        var data ={
            max_score:seat_statistic.max_score,
            win_counts:seat_statistic.win_counts,
            lose_counts:seat_statistic.lose_counts,
            total_score:seat_statistic.total_score,
        }
        msg.over_seats_data.push(data);
    }
    
    userManager.send_to_room('sdh_game_result',msg,room_id);

    


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
    //statistic: {max_score,win_counts,lose_counts,total_score}
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
        begin_call:game.begin_call//开始的庄位置
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
        bury_card:game.bury_card,
        call_banker:[],//叫地主列表
        main_color:game.main_color,//主花色
        call_score:game.call_score,//叫分
        score:game.score,//得分
        turn_card:game.turn_card,//轮次出牌数组
        score_card:game.score_card,//得分牌列表
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
        landlord_card:game.landlord_card,//底牌
        bury_card:game.bury_card,//埋牌
        begin_call:game.begin_call,//开始叫地主的索引
        call_banker:[],//叫庄信息
        main_color:game.main_color,//主花色
        call_score:game.call_score,//叫分
        score:game.score,//得分
        turn_card:game.turn_card,//轮次出牌数组
        score_card:game.score_card,//得分牌列表
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
        score_list:[]
    };
    // max_score:0,
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
            landlord_card:change_info.landlord_card,//底牌
            bury_card:change_info.bury_card,//埋牌
            begin_call:base_info.begin_call,//开始叫地主的索引
            main_color:change_info.main_color,//主花色
            call_score:change_info.call_score,//叫分
            score:change_info.score,//得分
            turn_card:change_info.turn_card,//轮次出牌数组
            score_card:change_info.score_card,//得分牌列表
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
function notice_user_holds_change (user_id,holds,folds){
    var game = get_game_by_user(user_id);
    if(game==null) return;
    var seat_data = game.game_seats;
    if(seat_data == null) return;

    var deputy_msg = JSON.parse(msg_templete.SC_Deputy);
    var main_card = pokerUtils.get_belongs_color_card_list(holds,game.main_color,game.main_color);
    deputy_msg.user_id = user_id;
    deputy_msg.deputy = main_card.length==0 ?1:0;

    var crypt_holds = get_crypt_list(holds.length);
    var crypt_msg ={
        user_id:user_id,
        holds:crypt_holds,
        folds:folds,
    };
    for(var a in seat_data){
        var data = seat_data[a];
        if(data.user_id == user_id){
            crypt_msg.holds = holds;
            userManager.sendMsg(data.user_id,'game_holds_push',crypt_msg);
        }else{
            crypt_msg.holds = crypt_holds;
            userManager.sendMsg(data.user_id,'game_holds_push',crypt_msg);
        }
        userManager.sendMsg(data.user_id,'sdh_deputy_push',deputy_msg);
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

//抢庄轮子推送
function call_banker_broad(game,call_value){
    var msg = JSON.parse(msg_templete.SC_CallBankTurnPush);
    msg.turn = game.turn;
    msg.current_min_value = call_value;
    userManager.send_to_room('sdh_call_turn_push',msg,game.room_info.id);
}

//叫庄移动到下一家
function call_move_to_next(game){
    var cur_turn  = game.turn;
    //真实的下一家
    var next_turn_value = -1;
    var next_turn = (cur_turn +1)%game.seats_num;
    var seat_data = game.game_seats[next_turn];
    while(next_turn != cur_turn){
        if(seat_data.call_banker ==0){
            next_turn =(next_turn+1)%game.seats_num;
            seat_data = game.game_seats[next_turn];
        }else{
            next_turn_value = next_turn;
            break;
        }
    }
    return next_turn_value;
}

//叫庄
exports.call_banker = function(user_id,call_value){
    var game = get_game_by_user(user_id);
    if(game == null) return;
    //判断游戏状态是否是叫庄状态
    if(game.state != global.GAME_STATE_CALL_BANKER){
        logger.warn("call banker not in state call landlord.")
        return;
    }
    //判断当前轮次是否是玩家
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
    //叫分检测
    if(call_value<0 || call_value>80 || call_value%5 != 0){
        logger.warn("call banker value[%d] error ",call_value);
        return;
    }
    //判断当前叫分是否小于已叫分.
    if(game.call_score != 0 && game.call_score<=call_value){
        logger.warn("call banker value[%d] error  call_score[%d]",call_value,game.call_score);
    }
    if(call_value !=0){
        //叫庄
        seat_data.call_banker =call_value;
        game.call_score = call_value;
    }else{
        //放弃庄
        seat_data.call_banker = call_value;
    }

    var all_give_up = false;
    var is_call_end = false;
    var next_turn = call_move_to_next(game);
    //如果叫分达到最小值，则直接结束抢庄.
    if(call_value == 5){
        is_call_end = true;
    } else {
        //判断是否全部放弃当庄.
        if(call_value == 0 && next_turn == -1){
            all_give_up = true;
            is_call_end = true;
        } else {
            var give_up_count = 0;
            for(var i=0; i<game.game_seats.length; ++i){
                var seat_info = game.game_seats[i];
                if(seat_info.call_banker == 0){
                    give_up_count++;
                }
            }
            if(give_up_count == 3 && game.game_seats[next_turn].call_banker != -1){
                is_call_end = true;
            }
        }
    }
    
    //推送叫庄情况.
    var msg = JSON.parse(msg_templete.SC_CallBanker);
    msg.user_id = user_id;
    msg.seat_index = seat_index;
    msg.call = call_value;
    userManager.send_to_room('sdh_call_banker_push',msg,game.room_info.id);

    if(!is_call_end){
        game.turn = next_turn;
        call_banker_broad(game,game.call_score);
    }else{
        var min_call_value = game.call_score;
        if(all_give_up){
            game.call_score = 80;
            game.turn = game.button;
        } else {
            for(var i=0;i<game.game_seats.length;++i){
                 var seat_info = game.game_seats[i];
                 if(seat_info && seat_info.user_id>0){
                     if(seat_info.call_banker == min_call_value){
                         game.turn = i;
                         break;
                     }
                 }
            }
        }
    }
    logger.debug("game.turn ==============>",game.turn);

    //如果已经完成抢庄，把最后几张牌发给庄家.
    if(is_call_end){
        game.button = game.turn;//设置庄家
        game.now_max_index = game.button;

        //推送抢庄结束.
        var msg = JSON.parse(msg_templete.SC_CallBankerEnd);
        msg.button = game.button;
        msg.call_score = game.call_score;
        userManager.send_to_room('sdh_call_end_push',msg,game.room_info.id);

        //将底牌发给庄家
        var landlord_seats_data = game.game_seats[game.button];
        var landlord_card = game.landlord_card;
        landlord_seats_data.holds = landlord_seats_data.holds.concat(landlord_card);

        var digCardMsg = JSON.parse(msg_templete.SC_DigCard);
        digCardMsg.dig_card = landlord_card;   
        userManager.sendMsg(landlord_seats_data.user_id,"sdh_dig_card_push",digCardMsg);

        game.state = global.GAME_STATE_DECIDE_COLOR;
        //推动玩家的牌变动
        notice_user_holds_change(landlord_seats_data.user_id,landlord_seats_data.holds,landlord_seats_data.folds);
        //推送游戏状态开始
        notice_game_state(game.room_info.id,game.state);
        //更新信息
        update_game_info(game);
        return;
    }
    //更新信息
    update_game_info(game);
}

//确定主花色
exports.decide_main_color = function(user_id,main_color){
    logger.debug("decide_main_color====================>", main_color);
    var game = get_game_by_user(user_id);
    if(game == null) return;
    //判断游戏状态是否是定花色阶段
    if(game.state != global.GAME_STATE_DECIDE_COLOR){
        logger.warn("decide main ncolor not in state.")
        return;
    }
    //判断当前轮次是否是玩家
    var seat_index = get_seat_index(user_id);
    if(game.turn != seat_index){
        logger.warn("decide main ncolor not the turn.")
        return;
    }
    //花色检测.
    if(main_color < -1 || main_color > 4){
        logger.warn("main_color:[%d] error.", main_color);
        return;
    }

    //定花色
    game.main_color = main_color;

    //推送确定花色.
    var msg = JSON.parse(msg_templete.SC_DecideMainColor);
    msg.color = main_color;
    userManager.send_to_room('sdh_decide_main_color_push',msg,game.room_info.id);

    //更改游戏状态
    game.state = global.GAME_STATE_BURY_CARD;
    //推送游戏状态开始
    notice_game_state(game.room_info.id,game.state);
    //更新信息
    update_game_info(game);
}


//埋牌
exports.bury_card = function(user_id,bury_cards){
    var game = get_game_by_user(user_id);
    if(game == null) return;
     //判断游戏状态是否是埋牌阶段
    if(game.state != global.GAME_STATE_BURY_CARD){
        logger.warn("bury card not in state")
        return;
    }
    //判断当前轮次是否是玩家
    var seat_index = get_seat_index(user_id);
    if(game.turn != seat_index){
        logger.warn("bury card not the turn.")
        return;
    }
    //座位信息
    var seat_data = game.game_seats[game.turn];
    if(seat_data == null){
        logger.warn("seat_data is null.");
        return;
    }
    var length = bury_cards.length;
    if(length != 8){
        logger.warn("check poker num .........",length);
        return error.GAME_ERROR_CARD_INVALID;
    }
    //判断玩家是否拥有这些牌
    if(!pokerUtils.check_card(seat_data.holds,bury_cards)){
        logger.warn("check card failed .........",bury_cards,seat_data.holds);
        return error.GAME_ERROR_CARD_INVALID;
    }

    //移除这些牌.
    remove_from_list(seat_data.holds,bury_cards);
    notice_user_holds_change(user_id,seat_data.holds,seat_data.folds);

    //将埋牌添加到游戏中.
    game.bury_card = game.bury_card.concat(bury_cards);

    //推送埋牌
    var msg = JSON.parse(msg_templete.SC_BuryCard);
    userManager.send_to_room('sdh_bury_card_push',msg,game.room_info.id);

     //更改游戏状态
    game.state = global.GAME_STATE_PLAYING;
    //推送游戏状态开始
    notice_game_state(game.room_info.id,game.state);

    var msg = JSON.parse(msg_templete.SC_turn);
    msg.turn = game.turn;
    msg.max_index = game.now_max_index;
    msg.now_card_type = game.now_card_type;
    msg.now_card_data = game.now_card_data;
    userManager.broacastInRoom('sdh_turn_push',msg,user_id,true);

    //更新信息
    update_game_info(game);
}


//认输
exports.give_up = function(user_id){
    var game = get_game_by_user(user_id);
    if(game == null) return;
     //判断游戏状态
    if(game.state != global.GAME_STATE_DECIDE_COLOR && game.state != global.GAME_STATE_BURY_CARD && game.state != global.GAME_STATE_PLAYING){
        logger.warn("give up not in state.")
        return;
    }
    //判断当前轮次是否是玩家
    var seat_index = get_seat_index(user_id);
    if(game.turn != seat_index){
        logger.warn("give up not the turn.")
        return;
    }
    //座位信息
    var seat_data = game.game_seats[game.turn];
    if(seat_data == null){
        logger.warn("seat_data is null.");
        return;
    }
    //判断如果出牌了不能认输
    if(game.state == global.GAME_STATE_PLAYING){
        var card_nums = game.room_info.conf.card_nums;
        if(card_nums > seat_data.holds.length){
            logger.warn("already out card, no give up.");
            return;
        }
    }

    var msg = JSON.parse(msg_templete.SC_game_end);
    msg.force = false;
    msg.has_dig = false;
    msg.give_up = true;
    msg.call_score = game.call_score;
    msg.game_score = game.score;
    //认输闲家赢
    var winner = global.OTHER_WIN;
    msg.winner = winner;

    var user_score =new Array(game.seats_num);
    for (var i=0;i<game.seats_num;++i){
        user_score[i] = 0;
    }
    //三打哈基础分
    var base_score = global.SANDAHA_BASE_SCORE;
    var win_lose_state = global.PASS_BOTTON;
    var rate = 1;
    //小倒
    if(game.call_score <= 50){
        win_lose_state = global.XIAO_DAO;
        rate = 2;
    }
    //大倒
    if(game.call_score <= 30){
        win_lose_state = global.DA_DAO
        rate = 3;
    }
    //计算分数.
    for (var i=0;i<game.seats_num;++i){
        if(i == game.button){
            user_score[i] = -(base_score * rate * 3);
        } else {
            user_score[i] = base_score * rate;
        }
    }
    msg.win_lose_state = win_lose_state;

    //组合结算信息
    for(var a=0;a<user_score.length;++a){
        var seat_statistic = game.game_seats[a].statistic;
        //处理统计信息seat_data.statistic
        if(user_score[a] >seat_statistic.max_score){
            seat_statistic.max_score = user_score[a];
        }
        if(user_score[a] >0){
            seat_statistic.win_counts +=1;
        }
        else if(user_score[a]<0){
            seat_statistic.lose_counts +=1;
        }
        seat_statistic.total_score += user_score[a];

        game.room_info.seats[a].score = seat_statistic.total_score;

        var data ={
            user_id:game.game_seats[a].user_id,
            end_score:user_score[a],
            total_score:seat_statistic.total_score,
        }
        msg.end_seats_data.push(data);

        game.room_info.seats[a].statistic = seat_statistic
    }


    //庄家认输，则庄改为下一位.
    game.button = (game.button+1)%game.seats_num;

    //游戏状态改变
    game.state = global.GAME_STATE_FREE
    notice_game_state(game.room_info.id,game.state);

    //游戏结果
    userManager.send_to_room('sdh_game_over',msg,game.room_info.id);

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
    logger.debug('show me check game over .................',game.game_index,game.room_info.conf.max_games,game.room_info.num_of_games)
    var is_game_over = false;
    if(game.game_index == game.room_info.conf.max_games){
        is_game_over = true
    }

    //如果是第一局扣除房主金币
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
    roomManager.update_room_seat_info(game.room_info.id);
    
    //prepare clean game cache
    //将数据存放到数据库
    update_room_info(game,true,user_score,false);

    if(is_game_over){
        game_over(game.room_info.id,false);
        return;
    }
}

