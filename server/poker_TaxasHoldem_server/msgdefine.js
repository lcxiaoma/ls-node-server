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


//牛牛消息

//庄家开始游戏
//event = start_play
msg_templete.CS_StartPlay =
JSON.stringify({

});

msg_templete.SC_StartPlay =
JSON.stringify({
    start_user_id:0,
    start_index:0
});

//提前开始游戏选择
//event = start_play_choice
msg_templete.CS_StartPlay_Choice =
JSON.stringify({
    agree:0,
});

msg_templete.SC_StartPlay_Choice =
JSON.stringify({
    choice_index:0,
    user_id:0,
    user_index:0,
    agree_list:{},
})

//提前开始游戏结果
//event = start_play_end
msg_templete.SC_StartPlay_End =
JSON.stringify({
    success:0,
    seat_index:0,
});
//下注
//event = betting
msg_templete.CS_Betting =
JSON.stringify({
    type:0,
    coin:0
});

msg_templete.SC_Betting =
JSON.stringify({
    error_code:0,
    seat_index:0,
    type:0,
    coin:0,
    current_loop_score:0
});

//叫庄
//event= call_banker
msg_templete.CS_CallBanker =
JSON.stringify({
    call:0,
});

msg_templete.SC_CallBanker =
JSON.stringify({
    call:0,
    seat_index:0
});

/////扎金花消息
//游戏状态
//event = goldflower_state
// user_state =[
//     {
//         seat_index:0,
//         current_bet_score:0,
//         total_bet_score:0,
//         see_card:false,
//         die:false,
//     },
// ]
msg_templete.SC_GoldFlowerState=
JSON.stringify({
    current_turn:0,
    see_min_coin:0,
    see_max_coin:0,
    unsee_min_coin:0,
    unsee_max_coin:0,
    user_state:[],
});

//看牌
//event = open_card
msg_templete.CS_OpenCard =
JSON.stringify({
    open_index:0
});

msg_templete.SC_OpenCard =
JSON.stringify({
    user_index:0,
    user_id:0,
    open_card:[],
});

//查牌
//event = compare
msg_templete.CS_Compare =
JSON.stringify({
    watch_index:0,
    compare_index:0,
});

msg_templete.SC_Compare =
JSON.stringify({
    watch_index:0,
    compare_index:0,
    result:0,
    watch_card:[],
    compare_card:[],
});


//放弃牌
//event = giveup
msg_templete.CS_GiveUp =
JSON.stringify({
    giveup_index:0,
})

msg_templete.SC_GiveUp =
JSON.stringify({
    user_index:0
})

//玩家加入当前局
msg_templete.CS_Join =
JSON.stringify({});

msg_templete.SC_Join =
JSON.stringify({
    watch_index:0,
    join:false,
})


//taxas消息
msg_templete.SC_PublicInfo=
JSON.stringify({
    current_turn:0,
    max_coin:0,
    min_coin:0,
    public_card:[],
    current_bet_turn:0,
    user_state:[],
})

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