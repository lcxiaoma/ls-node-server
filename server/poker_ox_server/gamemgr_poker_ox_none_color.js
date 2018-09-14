/**
 * 经典玩法
 * **/

var roomManager = require("./roommgr");
var userManager = require("./usermgr");
var pokerUtils = require("./poker_utils");
var db = require("../utils/db");
var crypt = require("../utils/crypto");
var games = {};


var game_seats_of_user ={};

//日志
var logger = require('./log.js').log_poker_ox;

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

//提前开始游戏房间
var start_play_room =[];
var start_play_timer ={};

function get_crypt_list(length){
    var arr =[];
    for(var i=0;i<length;++i){
        arr.push(-1);
    }
    return arr;
}

//shuffle card
function shuffle(game){
    //AAAA 2222 ..... 10,10,10,10,J,J,J,J,Q,Q,Q,Q,K,K,K,K
    //52张牌
    //need poker_numbers
    var poker = game.poker;
    var poker_nums = game.conf.poker_nums;//固定等于52
    
    for(var i=0;i<poker_nums;++i){
        poker[i] =i;
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
function dispatch_card(game){
    //need card_numbers
    //reset 0
    game.current_index =0;
    //var seat_index = game.button;
    var seat_index =0;

    var card_num = game.conf.card_nums;

    var player_num = game.seats_num;

    var cards_count = game.conf.poker_nums;

    //这里的玩家数量得用真实的玩家数量
    for(var i=0;i<game.game_seats.length;++i){
        var seat_data = game.game_seats[i];
        if(seat_data && seat_data.user_id >0){
            for(var j=0;j< card_num;++j){
                var r = Math.floor(Math.random()*cards_count);
                seat_data.holds[j] = game.poker[r];
                if(r!=(cards_count-1)){
                    var tmp = game.poker[cards_count-1];
                    game.poker[cards_count-1] = game.poker[r];
                    game.poker[r] = tmp;
                }
                cards_count -=1;
            }
        }
    }
}

//set ready
//重新连接进来后的操作处理
exports.set_ready = function(user_id,status){

    //all ready game begin
    var roomid = roomManager.getUserRoom(user_id);
    if(roomid == null){
        logger.warn("set ready roomid is None.")
        return;
    }
    var room_info = roomManager.getRoom(roomid);
    if(room_info == null){
        logger.warn("set ready room info is None.")
        return;
    }

    var rd_who =roomManager.setReady(user_id,status);

    if(rd_who ==1){
        var ready_msg ={
            userid:user_id,
            ready:status,
        }

        userManager.send_to_room('user_ready_push',ready_msg,roomid);
    }

    var game = games[roomid];
    if(game ==null){
        //new game
        //logger.debug("roominfo.seats.length %d seats_num %d",room_info.seats.length,room_info.seats_num);
        if(room_info.seats.length == room_info.seats_num || room_info.less_begin){
            //此处要添加在游戏中新进来的玩家
            var new_join_seats =[];
            for(var i=0;i<room_info.seats_num;++i){
                var watch_seat = room_info.watch_seats[i];
                if(watch_seat){
                    if(watch_seat.user_id >0 && watch_seat.join){
                        new_join_seats.push(i);
                    }
                }
            }
            var new_begin_index =0;

            for(var i=0;i<new_join_seats.length;++i){
                var seat_info = room_info.watch_seat[new_join_seats[i]];
                seat_info.watch = false;
                if(user_id != seat_info.user_id){
                     seat_info.ready = false;
                }
                //在开始游戏的身上寻找新的位置
                //if(seat_info.ready && userManager.isOnline(seat_info.user_id)){
                new_begin_index +=1;
                seat_info.seat_index = new_begin_index;
                var localtions =roomManager.getUserLocations();
                if(localtions[seat_info.user_id]){
                    if(localtions[seat_info.user_id].seatIndex != new_begin_index){
                        localtions[seat_info.user_id].seatIndex = new_begin_index;
                    }
                }
                delete seat_info.join;
                room_info.seats[new_begin_index] = seat_info;
                room_info.watch_seats[new_join_seats[i]] = null;
                //添加一个用户加入游戏的消息进入牌局
                var userData ={
                    userid:seat_info.user_id,
                    ip:seat_info.ip,
                    score:seat_info.score,
                    name:seat_info.name,
                    online:userManager.isOnline(seat_info.user_id),
                    ready:seat_info.ready,
                    seatindex:seat_info.seat_index,
                    holds:[],
                    folds:[],
                    watch:seat_info.watch,
                }
                userManager.broacastInRoom('new_user_comes_push',userData,seat_info.user_id,true);
                //}
                
            }
            roomManager.update_room_seat_info(roomid);
            var ready_player_count =0;
            for(var i=0;i<room_info.seats_num;++i){
                var s= room_info.seats[i];
                if(!s || s.user_id <=0) continue;
                if(s.ready == false || userManager.isOnline(s.user_id)== false){
                    return;
                }else{
                    ready_player_count +=1;
                }
            }
            if(ready_player_count <2)return;
            begin(roomid);
        }
    }else{
        //logger.debug("has game check can begin  less_begin =%s",game.less_begin);
        //console.log(game.room_info.seats)
        //如果游戏是结束状态
        if(game.state == global.GAME_STATE_FREE){

            //此处要添加在游戏中新进来的玩家
            var new_join_seats =[];
            for(var i=0;i<room_info.seats_num;++i){
                var watch_seat = room_info.watch_seats[i];
                if(watch_seat){
                    if(watch_seat.user_id >0 && watch_seat.join){
                        new_join_seats.push(i);
                    }
                }
            }
            var new_begin_index =0;
            for(var i=0;i<room_info.seats_num;++i){
                var seat = game.game_seats[i];
                if(seat && seat.user_id >0){
                    new_begin_index =i;
                }
            }
            for(var i=0;i<new_join_seats.length;++i){
                var seat_info = room_info.watch_seats[new_join_seats[i]];
                seat_info.watch = false;
                if(user_id != seat_info.user_id){
                     seat_info.ready = false;
                }
                //在开始游戏的身上寻找新的位置
                //if(seat_info.ready && userManager.isOnline(seat_info.user_id)){
                //console.log(room_info.watch_seats)
                new_begin_index +=1;
                seat_info.seat_index = new_begin_index;
                var localtions =roomManager.getUserLocations();
                if(localtions[seat_info.user_id]){
                    if(localtions[seat_info.user_id].seatIndex != new_begin_index){
                        localtions[seat_info.user_id].seatIndex = new_begin_index;
                    }
                }
                delete seat_info.join;
                room_info.seats[new_begin_index] = seat_info;
                room_info.watch_seats[new_join_seats[i]] = null;
                //添加一个用户加入游戏的消息进入牌局
                var userData ={
                    userid:seat_info.user_id,
                    ip:seat_info.ip,
                    score:seat_info.score,
                    name:seat_info.name,
                    online:userManager.isOnline(seat_info.user_id),
                    ready:seat_info.ready,
                    seatindex:seat_info.seat_index,
                    holds:[],
                    folds:[],
                    watch:seat_info.watch,
                }
                userManager.broacastInRoom('new_user_comes_push',userData,seat_info.user_id,true);
                //}
                
            }
            roomManager.update_room_seat_info(roomid);
            //console.log("after===========>",room_info.seats);

            //检测是否可以开始游戏
            var ready_player_count =0;
            if(room_info.seats.length == room_info.seats_num || game.less_begin){
                for(var i=0;i<room_info.seats_num;++i){
                    var s= room_info.seats[i];
                    if(!s || s.user_id <=0) continue;
                    if(s.ready == false || userManager.isOnline(s.user_id)== false){
                        //console.log("show me  who not ready============>",s)
                        return;
                    }else{
                        ready_player_count+=1;
                    }
                }
                if(ready_player_count <2) return;
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
        };

        data.seats =[];

        //确定开几张牌
        var open_card =0;
        if(global.has_rule(game.conf.rule_index,global.OPNE_CARD_NUM_THREE)){
            open_card = 3;
        }
        if(global.has_rule(game.conf.rule_index,global.OPNE_CARD_NUM_FOUR)){
            open_card =4;
        }
        //console.log("show me open card num=========>",open_card)
        for(var i=0;i<room_info.seats_num;++i){
            var seat_data = game.game_seats[i];
            if(!seat_data) continue;
            //self codes
            if(seat_data.user_id == user_id){
                var open_holds =[-1,-1,-1,-1,-1]
                for(var j=0;j<open_card;++j){
                    open_holds[j] = seat_data.holds[j];
                }
                var tmp ={
                    user_id:seat_data.user_id,
                    seat_index:seat_data.seat_index,
                    holds:open_holds,
                    folds:seat_data.folds,
                    bet_coin:seat_data.bet_coin,
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
                    bet_coin:seat_data.bet_coin,
                }
                data.seats.push(tmp);
            }
        }

        for(var i=0;i<room_info.seats_num;++i){
            var watch_seat = room_info.watch_seats[i];
            if(watch_seat){
                if(watch_seat.user_id >0){
                    var tmp ={
                        user_id:watch_seat.user_id,
                        seat_index:watch_seat.seat_index,
                        holds:[],
                        folds:[],
                        bet_coin:0,
                        join:watch_seat.join,
                    }
                    data.seats.push(tmp);
                }
            }
        }
        //show game_seats_of_user
        //logger.debug("show game seats of user =====>",game_seats_of_user[user_id]);
        //notice to client
        userManager.sendMsg(user_id,'game_sync_push',JSON.stringify(data));
        
        //send operation send current operation
        // var msg = JSON.parse(msg_templete.SC_turn);
        // msg.turn = game.turn;
        // msg.black_three = game.black_three;
        // msg.max_index = game.button;
        // msg.now_card_type = game.now_card_type;
        // msg.now_card_data = game.now_card_data;
        // userManager.sendMsg(user_id,'turn_push',msg);

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

function init_game_base(room_id){
    logger.debug('game begin  room_id = %d',room_id);
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
            button:roominfo.change_info.current_banker_index,//庄家标记
            seats_num:roominfo.seats_num,
            current_index:0, //当前牌的索引(发牌用)
            poker: new Array(roominfo.conf.poker_nums),
            game_seats:new Array(roominfo.seats_num),
            turn:0,
            state:global.GAME_STATE_FREE,
            current_banker_count:0,
            less_begin:roominfo.change_info.less_begin,//缺人开始标记
        }

        for(var i=0;i<roominfo.seats_num;++i){
            //更具具体的玩家来初始化game_seats的长度
            var seat_data = seats[i];
            if(!seat_data) continue
            var data = {
                seat_index:i,
                user_id:seat_data.user_id,
                holds:[],
                folds:[],
                action:[],
                bet_coin:0,
                statistic:{
                    banker_count:0,
                    ox_type_count:{},
                    total_score:0
                }
            }
            game.game_seats[i] = data;
            game_seats_of_user[data.user_id] = data;
        }
        games[room_id] = game;
    }
}

//game begin
//牛牛游戏开始后内容改变
function begin (room_id){
    logger.debug('game begin  room_id = %d',room_id);
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
            button:roominfo.change_info.current_banker_index,//庄家标记
            seats_num:roominfo.seats_num,
            current_index:0, //当前牌的索引(发牌用)
            poker: new Array(roominfo.conf.poker_nums),
            game_seats:new Array(roominfo.seats_num),
            turn:0,
            state:global.GAME_STATE_FREE,
            less_begin:roominfo.change_info.less_begin,//是否可以提前开始
            call_banker_index:0,//叫庄掩码
            bet_coin_index:0, //下注掩码
            current_banker_count:0,//当前庄的轮数
        }
        // //for test
        // roominfo.num_of_games +=5;
        // game.game_index +=5;
        // //test end

        roominfo.num_of_games ++;
        game.game_index ++;

        for(var i=0;i<roominfo.seats_num;++i){
            //更具具体的玩家来初始化game_seats的长度
            var seat_data = seats[i];
            if(!seat_data) continue
            var data = {
                seat_index:i,
                user_id:seat_data.user_id,
                holds:[],
                folds:[],
                action:[],
                bet_coin:0,
                call_banker:-1,
                statistic:seat_data.statistic
            }
            game.game_seats[i] = data;
            game_seats_of_user[data.user_id] = data;
        }
        games[room_id] = game;
    }else{

        var seats = roominfo.seats;

        //重置掉一些初始化的东西
        game.poker = new Array(roominfo.conf.poker_nums);
        //game.game_seats = new Array(roominfo.seats_num);
        game.state = global.GAME_STATE_FREE;
        game.current_index = 0; //当前牌的索引(用于发牌)
        game.call_banker_index =0;//叫庄掩码
        game.bet_coin_index =0; //下注掩码
        // //for test
        // roominfo.num_of_games +=5;
        // game.game_index +=5;
        // //test end

        roominfo.num_of_games ++;
        game.game_index ++;

        //console.log("game begin roominfo seats _info ---->",seats);
        for(var i=0;i<roominfo.seats_num;++i){
            var game_seat_info = game.game_seats[i];
            var room_seat_info = seats[i];

            if(room_seat_info && room_seat_info.user_id >0){
                if(game_seat_info){
                    game_seat_info.seat_index = i;
                    game_seat_info.user_id = seats[i].user_id;
                    game_seat_info.holds = [];
                    game_seat_info.folds = [];
                    game_seat_info.action = [];
                    game_seat_info.bet_coin =0;
                    game_seat_info.call_banker =-1;
                    game_seat_info.statistic = seats[i].statistic
                }else{
                    //当游戏中玩家信息不存在的时候要新建一个玩家状态
                    game_seat_info ={
                        seat_index:room_seat_info.seat_index,
                        user_id:room_seat_info.user_id,
                        holds:[],
                        folds:[],
                        action:[],
                        bet_coin:[],
                        call_banker:-1,
                        statistic:room_seat_info.statistic
                    }
                    game.game_seats[i]=game_seat_info;
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
    //
    if(global.has_rule(game.conf.rule_index,global.GRAB_BANKER)){
        //抢庄---每次抢庄
        game.state = global.GAME_STATE_CALL_BANKER;
        game.button =-1;
    }
    else if(global.has_rule(game.conf.rule_index,global.TURN_BANKER)){
        //轮庄-- 自动轮庄
        if(game.game_index ==1){
            game.button =0;
        }else{
            var player_num = get_game_realplayernum(game);
            game.button = (game.button +1)%player_num;
        }
        game.state = global.GAME_STATE_BETTING;
    }else{
        if(game.game_index ==1){
            game.state = global.GAME_STATE_CALL_BANKER
        }else{
            game.state = global.GAME_STATE_BETTING;
        }
    }

    game.current_banker_count +=1;
    

    for(var i=0;i<seats.length;++i){
        //client need know
        var s= game.game_seats[i];
        if(!s ||s.user_id <=0) continue;
        //show hand card
        //userManager.sendMsg(s.user_id,'game_holds_push',msg);
        notice_user_holds_change(s.user_id,s.holds,s.folds);
        //show how manney play counts
        //userManager.sendMsg(s.user_id,'game_num_push',roominfo.num_of_games);
        //show game begin
        //TODO如果不是随机庄 在这之前需要处理庄家问题
        // userManager.sendMsg(s.user_id,'game_begin_push',game.button);

        //userManager.sendMsg(s.user_id,'game_state_push',game.state);
    }

    //客户端需要每个人都知道
    userManager.send_to_room('game_num_push',roominfo.num_of_games,roominfo.id);
    userManager.send_to_room('game_begin_push',game.button,game.room_info.id)
    
    if(game.state == global.GAME_STATE_BETTING){
        
    }

    notice_game_state(roominfo.id,game.state);

    //开始增加更新房间信息
    update_room_info(game);


    //更新房间信息
    init_game_base_info(game);
}

//game end
/**
 * 1，比较牌
 * 2，计算输赢
 * 3，获得倍率
 * **/
function game_end (room_id,force,over ){
    //logger.debug("call game end --------------->",room_id,force);
    if(force != true){force = false};
    if(over != false){over = true};
    //check is game over
    var is_game_over =false;

    var game = games[room_id];
    if(game == null){
        //如果游戏为空,将利用room_info 上的数据进行结算

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
                    holds:[],
                    card_type:{},
                    bet_coin:0,
                    end_score:0,
                    total_score:seat.statistic.total_score
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

    var score ={};//最终分数
    var card_type_list ={};//牌型列表
    if(!force){
        //不是强制结算才会计分
        var banker_index = game.button;//庄家
        var banker_seat_data = game.game_seats[banker_index];
        var banker_card_type = pokerUtils.check_card_type(banker_seat_data.holds);
        card_type_list[banker_index] =banker_card_type;
        var len = game.game_seats.length;
        for(var i=0;i<len;++i){
            if(i!=banker_index){
                var user_seat_data = game.game_seats[i];
                if(user_seat_data &&user_seat_data.user_id>0){
                    var user_card_type = pokerUtils.check_card_type(user_seat_data.holds);
                    card_type_list[i] = user_card_type;
                    if(pokerUtils.compare(banker_card_type,user_card_type)){
                        //banker win
                        //console.log("banker win---->")
                        var ss =global.OX_BASE_SCORE *(pokerUtils.get_times(banker_card_type))*user_seat_data.bet_coin;
                        if(!score[banker_index]){
                            score[banker_index] = ss;
                        }else{
                            score[banker_index] +=ss;
                        }
                        if(!score[i]){
                            score[i] = -ss;
                        }else{
                            score[i] -=ss;
                        }

                        //统计信息
                        banker_seat_data.statistic.total_score += ss;
                        user_seat_data.statistic.total_score -=ss;
                        if(!user_seat_data.statistic.ox_type_count[user_card_type.type]){
                            user_seat_data.statistic.ox_type_count[user_card_type.type] =1;
                        }else{
                            user_seat_data.statistic.ox_type_count[user_card_type.type] +=1;                            
                        }
                    }else{
                        //user win
                        //console.log("user win=============>")
                        var ss =global.OX_BASE_SCORE *(pokerUtils.get_times(user_card_type))*user_seat_data.bet_coin;
                        if(!score[banker_index]){
                            score[banker_index] = -ss;
                        }else{
                            score[banker_index] -=ss;
                        }
                        if(!score[i]){
                            score[i] = ss;
                        }else{
                            score[i] +=ss;
                        }

                        //统计信息
                        banker_seat_data.statistic.total_score -= ss;
                        user_seat_data.statistic.total_score +=ss;

                        if(!user_seat_data.statistic.ox_type_count[user_card_type.type]){
                            user_seat_data.statistic.ox_type_count[user_card_type.type] =1;
                        }else{
                            user_seat_data.statistic.ox_type_count[user_card_type.type] +=1;                            
                        }
                    }
                }
            }else{
                //庄家统计信息
                banker_seat_data.statistic.banker_count +=1;
                if(!banker_seat_data.statistic.ox_type_count[banker_card_type.type]){
                    banker_seat_data.statistic.ox_type_count[banker_card_type.type] =1;
                }else{
                    banker_seat_data.statistic.ox_type_count[banker_card_type.type] +=1;
                }
            }
        }
    }
    //end_seats_data
    //user_id
    //holds
    //card_type
    //end_score
    //total_score
    var len = game.game_seats.length;
    for(var i=0;i<len;++i){
        var seat_data = game.game_seats[i];
        if(seat_data && seat_data.user_id >0){
            var seat_statistic = game.game_seats[i].statistic;
            var coin = score[i];
            if(!coin){
                coin =0;
            }
            var card_type_tmp = card_type_list[i];
            var card_type ={
                type:0,
                max_value:0,
            }
            if(card_type_tmp){
                card_type.type = card_type_tmp.type;
                card_type.max_value = card_type_tmp.max_value;
            }
            
            game.room_info.seats[i].score = seat_statistic.total_score;
            game.room_info.seats[i].statistic = seat_statistic;
            var data ={
                user_id:game.game_seats[i].user_id,
                holds:game.game_seats[i].holds,
                card_type:card_type,
                bet_coin:seat_data.bet_coin,
                end_score:coin,
                total_score:seat_statistic.total_score
            }
            msg.end_seats_data.push(data);
        }
    }

    //霸王庄，牌大做庄，牛牛做庄这里判断庄家
    if(global.has_rule(game.conf.rule_index,global.OXOX_BANKER)){
        //牛牛做庄
        var ox_ox_index =[];
        for(var a in card_type_list){
            var card_type =card_type_list[a];
            if(card_type.type == global.OX_DOUBLE){
                ox_ox_index.push(a);
            }
        }
        //
        //console.log("show me oxox ++++++++++++++++++++>",ox_ox_index)
        if(ox_ox_index.length !=0){
            //如果有多个牛牛，随机一个庄
            game.button = ox_ox_index[Math.floor(Math.random()*ox_ox_index.length)];
            //此处需要更新到数据库
            game.room_info.change_info.current_banker_index = game.button
            update_room_change_info(game);
        }
    }else if(global.has_rule(game.conf.rule_index,global.MAX_BANKER)){
        //牌大做庄
        var max_index =0;
        for(var a in card_type_list){
            if(a == max_index) continue;
            var card_type =card_type_list[a];
            var max_card_type = card_type_list[max_index];
            if(!pokerUtils.compare(max_card_type,card_type)){
                max_index =a;
            }
        }
        game.button = Number(max_index);
        //此处需要更新到数据库
        game.room_info.change_info.current_banker_index = game.button;
        update_room_change_info(game);

    }else if(global.has_rule(game.conf.rule_index,global.OVERLORD_BANKER)){
        //霸王庄,庄家不变
    }

    //游戏状态改变
    game.state = global.GAME_STATE_FREE
    notice_game_state(game.room_info.id,game.state);

    //游戏结果
    userManager.send_to_room('game_over',msg,game.room_info.id)
    
    //清除玩家状态

    //需要清除当前还剩余的牌和其它一些临时信息
    for(var i=0;i<game.seats_num;++i){
        var seat_data =game.game_seats[i];
        if(!seat_data) continue;
        seat_data.holds =[];
        seat_data.folds =[];
        seat_data.action =[];
        seat_data.bet_coin =0,
        seat_data.call_banker =-1;
        exports.set_ready(seat_data.user_id,false);
    }
    //poker数组
    //是否写入历史记录
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
                for(var i=0;i<game.room_info.seats_num;++i){
                    var r_s = game.room_info.seats[i];
                    if(r_s && r_s.user_id >0){
                        r_s.game_counts +=1;
                    }
                }
                var gold_value = global.get_ingot_value(game.conf.rule_index);
                for(var i=0;i<game.room_info.seats_num;++i){
                    var seat_d = game.room_info.seats[i];
                    if(seat_d && seat_d.user_id >0 && seat_d.game_counts >=1 && seat_d.pay == false){
                        user_lose_gold(seat_d.user_id,gold_value)
                        seat_d.pay = true;
                    }
                }
            }
        }
        roomManager.update_room_seat_info(game.room_info.id);
    }
    /***
    //如果游戏未结束，判断是否可以下庄
    if(!is_game_over){
        //如果可以下庄，通知一下
        var seat_data = game.game_seats[game.button];
        //只有当庄的次数大于等于1的时候才可以下庄
        // console.log(game)
        // console.log("current banker_count----------->",game.current_banker_count)
        if(global.has_rule(game.conf.rule_index,global.TURN_BANKER) || global.has_rule(game.conf.rule_index,global.GRAB_BANKER)){
            if(seat_data && seat_data.user_id >0 && game.current_banker_count >0){
                var off_state_msg = JSON.parse(msg_templete.SC_OffBankerState);
                off_state_msg.off_index = game.button;
                userManager.sendMsg(seat_data.user_id,'off_banker_state',off_state_msg);
            }
        }
    }
    ***/
    //prepare clean game cache
    //将数据存放到数据库
    update_room_info(game,true,score,force);

    if(is_game_over){
        game_over(room_id,force);
        return;
    }
}

//game over
//发送统计信息
function game_over (room_id,force){
    if(force != true) {force = false;};
    var game = games[room_id];
    if(game == null) {
        //房间结算，游戏中不结算
        var room = roomManager.getRoom(room_id);
        if(room == null) return;
        var msg = JSON.parse(msg_templete.SC_game_over);

        for(var i=0;i<room.seats_num;++i){
            var seat_data = room.seats[i];
            if(seat_data && seat_data.user_id >0){
                var seat_statistic = room.seats[i].statistic;
                var data ={
                    banker_count:seat_statistic.banker_count,
                    ox_type_count:seat_statistic.ox_type_count,
                    total_score:seat_statistic.total_score,
                }
                msg.over_seats_data.push(data);
            }
        }
        userManager.send_to_room('game_result',msg,room_id);

        //chean 玩家身上的数据
        //清除掉游戏
        userManager.kickAllInRoom(room_id);
        var reason = (force)?global.ROOM_ACHIVE_DIS:global.ROOM_ACHIVE_OVER;
        roomManager.destroy(room_id,reason);
        return;
    }


    var msg = JSON.parse(msg_templete.SC_game_over);

    // banker_count:0,
    // ox_type_count:{},
    // total_score:0
    for(var i=0;i<game.seats_num;++i){
        var seat_data = game.game_seats[i];
        if(!seat_data || seat_data.user_id <=0) continue;
        var seat_statistic = game.game_seats[i].statistic;
        var data ={
            banker_count:seat_statistic.banker_count,
            ox_type_count:seat_statistic.ox_type_count,
            total_score:seat_statistic.total_score,
        }
        msg.over_seats_data.push(data);
    }
    
    userManager.send_to_room('game_result',msg,room_id);

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
        seats_num:game.seats_num,
        current_index:game.current_index,
        poker:game.poker
    };
    data.holds =[];
    data.folds =[];
    data.actions =[];
    data.result =[];
    //统计信息
    data.statistic =[];
    //变化信息
    data.change_info ={
        state:game.state,
        button:game.button,
        less_begin:game.less_begin,//缺人开始
        call_banker_index:game.call_banker_index, //叫庄掩码
        call_banker_list:[],//叫庄数据列表
        bet_coin_index:game.bet_coin_index, //下注掩码
        bet_coin_list:[],//押注列表
        current_banker_count:0,
    }
    for(var i=0;i<game.game_seats.length;++i){
        var seats_data = game.game_seats[i];
        if(!seats_data) continue;
        data.holds.push(seats_data.holds);
        data.folds.push(seats_data.folds);
        data.actions.push(seats_data.action);
        data.result.push(0);
        data.statistic.push(seats_data.statistic);
        data.change_info.call_banker_list.push(seats_data.call_banker);
        data.change_info.bet_coin_list.push(seats_data.bet_coin);
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
        state:game.state,
        button:game.button,
        less_begin:game.less_begin,
        call_banker_index:game.call_banker_index, //叫庄掩码
        call_banker_list:[],//叫庄数据列表
        bet_coin_index:game.bet_coin_index, //下注掩码
        bet_coin_list:[],//押注列表
        //added 解散信息 此处需要添加一些游戏中生成的临时状态
        dissmiss:game.room_info.dissmiss,
        current_banker_count:game.current_banker_count,
    }
    //data.result =[];
    for(var i in game.game_seats){
        var seats_data = game.game_seats[i];
        if(!seats_data) continue;
        data.holds.push(seats_data.holds);
        data.folds.push(seats_data.folds);
        data.actions.push(seats_data.action);
        data.change_info.call_banker_list.push(seats_data.call_banker);
        data.change_info.bet_coin_list.push(seats_data.bet_coin);
    }
    //TODO 可变信息缺少一个解散信息

    return data;
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
    if(!score) {score =[]};
    if(force != true){force = false;};
    var data ={
        room_uuid:game.room_info.uuid,
        game_index:game.game_index,
        less_begin:game.room_info.less_begin,
        score_list:[],
        change_info:game.room_info.change_info,
    };
    // max_score:0,
    // boom_counts:0,
    // win_counts:0,
    // lose_counts:0,
    // total_score:0,
    for(var i=0;i<game.seats_num;++i){
        var seat_data = game.game_seats[i]
        if(!seat_data) continue;
        var seat_statistic =seat_data.statistic;
        data.score_list.push(seat_statistic.total_score);
        //添加断线重连积分
        game.room_info.seats[i].score =seat_statistic.total_score;
    }
    //console.log("call update room info ====>",data)
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
        var seats = room_info.seats;

        game ={
            conf:base_info.conf,
            room_info:room_info,
            game_index:room_info.num_of_games,
            button:change_info.button,
            seats_num:base_info.seats_num,
            current_index:base_info.current_index,
            poker:base_info.poker,
            game_seats:new Array(room_info.seats_num),
            state:change_info.state,
            less_begin:change_info.less_begin,
            call_banker_index:change_info.call_banker_index,
            bet_coin_index:change_info.bet_coin_index,
            current_banker_count:change_info.current_banker_count,
        }
        //初始化其它信息
        for(var i=0;i<room_info.seats_num;++i){
            var seat = seats[i];
            if(!seat) continue;
            var data = game.game_seats[i] ={};
            data.seat_index =i;
            data.user_id = seats[i].user_id;
            data.holds = holds[i];
            data.folds = folds[i];
            data.action = action_list[i];
            data.statistic =statistic[i];
            data.call_banker = change_info.call_banker_list[i]
            data.bet_coin =change_info.bet_coin_list[i];
            game_seats_of_user[data.user_id] = data;
        }
        //增加解散信息
        if(change_info.dissmiss){
            room_info.dissmiss = change_info.dissmiss;
            apply_dissmiss_room[room_id];
        }
        games[room_id] = game;
        // console.log("load game from db---->",game)
        // console.log("load game from db---->",games)        
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
            return;
        }else{
            logger_manager.insert_gold_log(user_id,user_id,0,log_point.GOLD_COST_OPEN,gold_value,rows[0][0].now_gold);
        }
    });
}

//广播手牌变化
function notice_user_holds_change (user_id,holds,folds,show_all){
    if(show_all != true){show_all = false;};
    var game = get_game_by_user(user_id);
    //判断是否需要显示牌,需要根据规则来判断是否要显示牌
    var open_card =0;
    if(global.has_rule(game.conf.rule_index,global.OPNE_CARD_NUM_THREE)){
        open_card = 3;
    }
    if(global.has_rule(game.conf.rule_index,global.OPNE_CARD_NUM_FOUR)){
        open_card =4;
    }
    if (global.has_rule(game.conf.rule_index,global.OPEN_CARD_NUM_0)){
        open_card = 0;
    }
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
        if(data.user_id == user_id){
            if(show_all){
                crypt_msg.holds = holds;
                userManager.sendMsg(data.user_id,'game_holds_push',crypt_msg);
            }else{
                //全是背面牌
                var tmp = [-1,-1,-1,-1,-1]
                for(var i=0;i<open_card;++i){
                    tmp[i] = holds[i];
                }
                crypt_msg.holds = tmp;
                userManager.sendMsg(data.user_id,'game_holds_push',crypt_msg);
            }
        }else{
            if(show_all){
                crypt_msg.holds = holds;
            }else{
                crypt_msg.holds = crypt_holds;
            }
            userManager.sendMsg(data.user_id,'game_holds_push',crypt_msg);
        }
    }
    var watch_seats = game.room_info.watch_seats;
    for(var i=0;i<watch_seats.length;++i){
        var watch_seat = watch_seats[i];
        if(watch_seat){
            if(watch_seat.user_id >0){
                crypt_msg.holds = crypt_holds;
                if(show_all){
                    crypt_msg.holds = holds;
                }
                userManager.sendMsg(watch_seat.user_id,'game_holds_push',crypt_msg);
            }
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

//确定玩家是直接进入游戏还是进入观众席
exports.can_join = function(room_id){
    var game = games[room_id];
    if(game == null) return true;
    if(game.state == global.GAME_STATE_FREE) return true;
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

    //观察玩家不能参与游戏动作
    if(room_info.watch_seats[seatIndex]){
        if(room_info.watch_seats[seatIndex].user_id == user_id){
            return;
        }
    }

    room_info.dissmiss = {
        chose_index:0,
        endTime:Date.now() + global.DISMISS_TIME,
        states:[]
    };
    for(var i=0;i<room_info.seats_num;++i){
        if(room_info.seats[i] && room_info.seats[i].user_id>0){
            room_info.dissmiss.states.push(false);
        }
    }
    // console.log("roominfo seat num ======>",room_info.seats_num);
    // console.log(room_info.dissmiss);

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

    //观察玩家不需要加入投票中
    if(room_info.watch_seats[seat_index]){
        if(room_info.watch_seats[seat_index].user_id == user_id){
            return;
        }
    }

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


//牛牛主动开始游戏(玩家未满时)
exports.start_play = function(user_id){

    var game =get_game_by_user(user_id);
    
    if(game == null){
        //如果提前开始，必须得初始化游戏内容
        var room_id = roomManager.getUserRoom(user_id);
        if(room_id == null) return;
        init_game_base(room_id);
        game = games[room_id];
    }else{
        if(game.num_of_games >1){
            logger.warn('game exsits can not start play.')
            return;
        }
        
    }

    //只有房主能决定是否在人数未满的时候开始游戏
    console.log(game.conf.creator)
    if(game.conf.creator != user_id){
        logger.warn('user[%d] not creator [%d]',user_id,game.conf.creator);
        return;
    }
    
    var seat_index =get_seat_index(user_id);
    if(seat_index == null){
        logger.warn('user seat index none.')
        return;
    }
    var room_info = game.room_info;

    var player_num = get_game_realplayernum(game);
    if(player_num <2){
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
    userManager.send_to_room('start_play',msg,game.room_info.id);

    // choice_index:0,
    // user_id:0,
    // user_index:0,
    // agree:0,
    room_info.start_choice ={
        choice_index:(0x01 << (seat_index+1)),
        agree_list:{}
    }
    var msg2 = JSON.parse(msg_templete.SC_StartPlay_Choice);
    msg2.choice_index = (0x01 << (seat_index+1));
    msg2.user_id = user_id;
    msg2.user_index = seat_index;
    msg2.agree_list[seat_index] = 1;
    room_info.start_choice.agree_list[seat_index] =1;

    userManager.send_to_room('start_play_choice',msg2,game.room_info.id);

    //begin(room_info.id);
    var timer = setTimeout(function(){
        start_play_failed(game.room_info.id);
    },global.START_PLAY_TIME);
    start_play_room.push(game.room_info.id);
    start_play_timer[game.room_info.id] = timer;
}

//提前开始失败
function start_play_failed(room_id){
    var room_info = roomManager.getRoom(room_id);
    if(room_info == null) return;
    //TODO此处需要注意是否要更新到数据库
    var msg = JSON.parse(msg_templete.SC_StartPlay_End)
    msg.success =0;
    msg.seat_index =0;
    userManager.send_to_room('start_play_end',msg,room_info.id);

    //移除掉定时器
    room_info.start_choice = null;
    var index = start_play_room.indexOf(room_id);
    if(index !=-1){
        start_play_room.splice(index,1);
    }
    var timer = start_play_timer[room_id];
    if(timer!=null){
        clearTimeout(timer);
        start_play_timer[room_id] = null;
    }

}

//开始游戏通知
exports.start_play_choice = function(user_id,data){
    data = JSON.parse(data);
    var game = get_game_by_user(user_id);
    if(game == null){
        logger.warn('game is None');
        return;
    }
    //如果全部都同意提前开始，则游戏提前开始
    if(game.state != global.GAME_STATE_FREE){
        logger.warn('game state not free.')
        return;
    }
    
    if(data.agree !=0 && data.agree !=1){
        logger.warn('client args error.',data.agree);
        return;
    }

    var room_info =game.room_info;
    var seat_index = get_seat_index(user_id);
    //已经选择了，不能让其再次选择
    if(room_info.start_choice == null){
        logger.warn('start choice is None.')
        return;
    }else{
        if(room_info.start_choice.choice_index & (0x01 <<(seat_index+1))){
            logger.warn('has made choice.')
            return;
        }
    }
    if(data.agree ==0){
        //有人拒绝，结束
        room_info.start_choice.choice_index += 0x01 <<(seat_index+1);
        room_info.start_choice.agree_list[seat_index] =data.agree;

        var msg = JSON.parse(msg_templete.SC_StartPlay_Choice);
        msg.choice_index = room_info.start_choice.choice_index;
        msg.user_id = user_id;
        msg.user_index = seat_index;
        msg.agree_list = room_info.start_choice.agree_list;

        userManager.send_to_room('start_play_choice',msg,room_info.id);

        var msg = JSON.parse(msg_templete.SC_StartPlay_End)
        msg.success =0;
        msg.seat_index =seat_index;
        userManager.send_to_room('start_play_end',msg,room_info.id);


        //移除掉定时器
        room_info.start_choice = null;
        var index = start_play_room.indexOf(game.room_info.id);
        if(index !=-1){
            start_play_room.splice(index,1);
        }
        var timer = start_play_timer[game.room_info.id];
        if(timer!=null){
            clearTimeout(timer);
            start_play_timer[game.room_info.id] = null;
        }
        return;
    }

    room_info.start_choice.choice_index += 0x01 <<(seat_index+1);
    room_info.start_choice.agree_list[seat_index] =data.agree;

    var msg = JSON.parse(msg_templete.SC_StartPlay_Choice);
    msg.choice_index = room_info.start_choice.choice_index;
    msg.user_id = user_id;
    msg.user_index = seat_index;
    msg.agree_list = room_info.start_choice.agree_list;

    userManager.send_to_room('start_play_choice',msg,room_info.id);

    console.log("check can start game")
    var all_choice = true;
    var seats_length = room_info.seats.length
    for(var i=0;i<seats_length;++i){
        var s= room_info.seats[i];
        if(!s) continue;
        if( s.user_id >0){
            if(!room_info.start_choice.agree_list[i]  && room_info.start_choice.agree_list[i] !=0){
                console.log(room_info.start_choice)
                all_choice = false;
            }
        }
    }

    if(all_choice){
        //开始游戏
        var msg = JSON.parse(msg_templete.SC_StartPlay_End)
        msg.success =1;
        userManager.send_to_room('start_play_end',msg,room_info.id);
        game.less_begin = true;//允许少人开始
        game.room_info.change_info.less_begin = true;//允许少人玩

        //移除掉定时器
        room_info.start_choice = null;
        var index = start_play_room.indexOf(game.room_info.id);
        if(index !=-1){
            start_play_room.splice(index,1);
        }
        var timer = start_play_timer[game.room_info.id];
        if(timer!=null){
            clearTimeout(timer);
            start_play_timer[game.room_info.id] = null;
        }

        begin(room_info.id);
    }
}

//下注
exports.betting = function(user_id,data){
    //data ={coin:0}
    var game = get_game_by_user(user_id);
    if(game == null) return;

    var seat_index = get_seat_index(user_id);

    if(seat_index == game.button){
        logger.warn('banker can not betting.')
        return;
    }

    var seat_data = game.game_seats[seat_index];

    if(seat_data == null) return false;
    data = JSON.parse(data)

    var msg = JSON.parse(msg_templete.SC_Betting);
    //只能在下注状态的时候下注
    if(game.state != global.GAME_STATE_BETTING){
        msg.error_code =error.USER_STATE_NOT_BETING;
        userManager.sendMsg(user_id,'betting',msg);
        return;
    }
    
    //下注不能小于0
    //coin在0-10范围内
    data.coin = Number(data.coin);
    if(!data.coin){
        msg.error_code = error.USER_COIN_NOT_INVALID;
        userManager.sendMsg(user_id,'betting',msg);
        return;
    }
    var bet_coin = [0,1,2,3,4,5,6,7,8,9,10]
    if(bet_coin.indexOf(data.coin) == -1 ){
        msg.error_code = error.USER_COIN_NOT_INVALID;
        userManager.sendMsg(user_id,'betting',msg);
        return;
    }

    if(seat_data.bet_coin !=0) return;
    seat_data.bet_coin += data.coin;
    //TODO不确定总数是否需要减少
    //seat_data.statistic.total_score -= data.coin;
    
    msg.error_code = error.SUCCESS;
    msg.seat_index = seat_index;
    msg.coin = data.coin;
    msg.total_coin = seat_data.coin;
    userManager.send_to_room('betting',msg,game.room_info.id);

    //全部下注完毕，翻牌结算

    var all_bet =true;

    for(var i=0;i<game.game_seats.length;++i){
        var seat_data = game.game_seats[i];
        if(seat_data && seat_data.user_id >0 && i!= game.button){
            if(seat_data.bet_coin ==0){
                all_bet = false;
                break;
            }
        }
    }

    if(all_bet){
        //显示结果，结算，更改游戏状态
        game.state = global.GAME_STATE_FREE;
        var seats = game.room_info.seats;
        for(var i=0;i<seats.length;++i){
            //client need know
            var s= game.game_seats[i];
            if(!s ||s.user_id <=0) continue;
            notice_user_holds_change(s.user_id,s.holds,s.folds,true);
        }

        notice_game_state(game.room_info.id,game.state);

        //结算游戏
        game_end(game.room_info.id);

    }

}
//叫庄(发牌后，如果是抢庄进入这个阶段)
exports.call_banker = function(user_id,data){

    var game = get_game_by_user(user_id);
    if(game == null) return;

    if(game.state != global.GAME_STATE_CALL_BANKER){
        return;
    }
    data = JSON.parse(data);
    //强制检测参数
    if(data.call !=0 && data.call !=1){
        return;
    }

    var seat_index = get_seat_index(user_id);

    var seat_data = game.game_seats[seat_index];

    if(!seat_data){
        return;
    }


    if(seat_data.call_banker !=-1){
        logger.warn('has called banker.')
        return;
    }

    seat_data.call_banker =data.call;
    game.game_seats[seat_index] = seat_data;

    var msg = JSON.parse(msg_templete.SC_CallBanker);
    msg.call = data.call;
    msg.seat_index = seat_index;

    userManager.send_to_room('call_banker',msg,game.room_info.id);
    //叫庄结束后开始押注
    var all_call = true;
    var call_list = [];
    var no_call_list =[];
    //console.log(game.game_seats)
    for(var i=0;i<game.game_seats.length;++i){
        var seat_data = game.game_seats[i];
        if(seat_data && seat_data.user_id>0){
            if(seat_data.call_banker == -1){
                all_call = false;
                break;
            }else if(seat_data.call_banker ==1){
                call_list.push(i);
            }else if(seat_data.call_banker ==0){
                no_call_list.push(i);
            }
        }
    }

    if(all_call){
       game.state = global.GAME_STATE_BETTING;
       //如果都不叫庄的处理
       if(call_list.length == 0){
           if(no_call_list.length ==0){
               logger.warn('call no call is length of 0.');
               notice_game_state(game.room_info.id,game.state);
               game_end(game.room_info.id,true,false)
               return;
           }else{
               game.button =no_call_list[Math.floor(Math.random()*no_call_list.length)];
           }
       }else{
           game.button =call_list[Math.floor(Math.random()*call_list.length)];
       }
       userManager.send_to_room('game_begin_push',game.button,game.room_info.id)
       notice_game_state(game.room_info.id,game.state);
    }
}

//获取真实的玩家数量
function get_game_realplayernum(game){
    var real_num =0;
    var seats_info = game.game_seats;
    for(var i=0;i<seats_info.length;++i){
        var seat =seats_info[i];
        if(seat && seat.user_id >0){
            real_num ++;
        }
    }
    return real_num;
}

//玩家主动下庄
//奖励池中分大于30 需要手动下庄，小于0自动下庄
exports.off_banker = function(user_id,data){
    //20170508  取消下庄，抢庄每次抢庄，轮庄自动轮庄
    return;
    var game = get_game_by_user(user_id);
    if(game == null) return;

    if(game.state != global.GAME_STATE_FREE){
        return;
    }

    var seat_index = get_seat_index(user_id);
    
    if(seat_index != data.off_index || seat_index != game.button){
        logger.warn('not banker call off banker.')
        return;
    }

    var seat_data = game.game_seats[seat_index];

    if(!seat_data){
        return;
    }
    //这是斗公牛的规则
    // //检测是否满足 当前分数为0，或者已经3局后，玩家的累计积分大于30
    // var can_off = true;
    // if(seat_data.statistic.total_score == (0-global.OX_OX_BANKER_SCORE)){

    // }
    //通知客户端下庄
    var msg = JSON.parse(msg_templete.SC_OffBanker);
    msg.off_index = game.button;

    userManager.send_to_room('off_banker',msg,game.room_info.id);

    //如果下庄成功，如果是轮庄庄家自动移动至下一家，如果是抢庄，进入抢庄状态而且当前玩家不能再参与抢庄
    if(global.has_rule(game.conf.rule_index,global.GRAB_BANKER)){
        //抢庄
        //下一局开始的时候就进入抢庄状态
        game.button = -1;//将庄家重置
        game.current_banker_count =0;
    }else if(global.has_rule(game.conf.rule_index,global.TURN_BANKER)){
        //轮庄
        var player_num = get_game_realplayernum(game);
        game.button = (game.button+1)%player_num;
        game.current_banker_count =0;
    }

}
//设置准备加入游戏
exports.set_join = function(user_id,join){
    var game = get_game_by_user(user_id);
    if(game == null) return;
    //这里的所有操作都将是对房间内面watch_seats操作
    var room_info = game.room_info;
    if(room_info == null) return;

    var seat_index = get_seat_index(user_id);

    var watch_seats = room_info.watch_seats;
    if(!watch_seats) return;
    var my_watch_seat = watch_seats[seat_index];
    if(!my_watch_seat) return;
    if(my_watch_seat.join) return;

    my_watch_seat.join = true;
    roomManager.update_room_seat_info(game.room_info.id);

    var msg = JSON.parse(msg_templete.SC_Join);
    msg.watch_index = seat_index;
    msg.join = true;
    userManager.send_to_room('join',msg,game.room_info.id);
}


//更新房间可变信息
function update_room_change_info(game){
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
        room_uuid:game.room_info.uuid,
        change_info:game.room_info.change_info
    }

    db.update_room_change_info(data,function(err,rows,fields){
        if(err){
            logger.error(err.stack);
            return;
        }
    });

}