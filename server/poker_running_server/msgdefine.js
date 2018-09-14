/**
 * msg define templete
 * **/

var msg_templete ={}

//CS出牌消息
msg_templete.CS_out_card =
JSON.stringify({
    card_type:0,
    cards_data:[],
});
//SC出牌消息
msg_templete.SC_out_card =
JSON.stringify({
    error_code:0,
    out_user:0,
    out_card_type:0,
    out_cards_data:[],
});
msg_templete.SC_game_state =
JSON.stringify({
    state:1,
});
//SC当前操作玩家
msg_templete.SC_turn =
JSON.stringify({
    turn:0,
    black_three:0,
    red_ten:0,
    max_index:0,
    now_card_type:0,
    now_card_data:[],
});
//SC当前出牌信息push
msg_templete.SC_out_push =
JSON.stringify({
    card_type:0,
    card_data:[],
});
//SC房间信息
msg_templete.SC_room_info =
JSON.stringify({
    room_id:0,
});
//SC玩家信息
msg_templete.SC_user_info =
JSON.stringify({
    seat_index:0,
    user_id:0,
});
//SC游戏结束信息
msg_templete.SC_game_end =
JSON.stringify({
    end_seats_data:[],
    force:false,
    redheart_ten:0,
});
//SC游戏结算信息
msg_templete.SC_game_over =
JSON.stringify({
    over_seats_data:[],
});
//CS战绩回放
msg_templete.CS_rollback =
JSON.stringify({
    uuid:0,
    index:0,
});
//SC战绩回放
msg_templete.SC_rollback =
JSON.stringify({
    
});
//CS申请解散房间
msg_templete.CS_Dismiss =
JSON.stringify({

});

//SC申请解散房间
msg_templete.SC_Dismiss =
JSON.stringify({
    
});

//CS转让房主
//event='transfer'
msg_templete.CS_Transfer = 
JSON.stringify({
    target:0
});
msg_templete.SC_Transfer =
JSON.stringify({
    new_seat:[] //新座位顺序--数组为用户id数组.
});

//CS房主踢人
//event='kick'
msg_templete.CS_Kick = 
JSON.stringify({
    target:0
});
msg_templete.SC_Kick =
JSON.stringify({
    kicked:0,//被踢用户
    new_seat:[]//新座位顺序--数组为用户id数组.
});

exports.msg_templete = msg_templete;