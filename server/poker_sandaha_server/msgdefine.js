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

//event='sdh_turn_push';
//SC当前操作玩家
msg_templete.SC_turn =
JSON.stringify({
    turn:0,
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

//event = 'sdh_game_over'
//SC游戏结束信息
msg_templete.SC_game_end =
JSON.stringify({
    force:false,//是否是解散
    has_dig:false,//是否有扣底
    give_up:false,//是否认输
    bury_card:[],//当有扣底时才有值--扣的底牌
    dig_score_cards:[],//当有扣底时才有值--扣的底牌分牌
    dig_score_value:0,//当有扣底时才有值--扣的底牌分值
    dig_score_rate:1,//当有扣底时才有值--扣的底牌倍率
    score_card:[],//此局游戏获得的分牌
    call_score:0,//游戏叫分
    game_score:0,//游戏得分
    winner:0,//赢家
    end_seats_data:[],//用户情况
    win_lose_state:3,//输赢状态  大光-小光-正常-大倒-小倒-垮庄
});

//event = 'sdh_game_result'
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

//event ='sdh_call_banker'
//CS叫庄
msg_templete.CS_CallBanker =
JSON.stringify({
    call:0
});

//event ='sdh_call_banker_push'
//SC叫庄
msg_templete.SC_CallBanker =
JSON.stringify({
    user_id:0,
    seat_index:0,
    call:0
});

//event ='sdh_call_end_push'
//SC叫庄结束
msg_templete.SC_CallBankerEnd =
JSON.stringify({
    button:0,
    call_score:0
});

//event='sdh_dig_card_push'
//SC通知玩家底牌
msg_templete.SC_DigCard = 
JSON.stringify({
    dig_card:[]
});

//event ='sdh_call_turn_push'
//SC叫庄轮次
msg_templete.SC_CallBankTurnPush =
JSON.stringify({
    turn:-1,
    current_min_value:0,
});

//event='sdh_decide_main_color'
//CS确定主花色
msg_templete.CS_DecideMainColor =
JSON.stringify({
    color:-1
});

//event='sdh_decide_main_color_push'
//SC确定主花色
msg_templete.SC_DecideMainColor =
JSON.stringify({
    color:-1
});

//event='sdh_bury_card'
//CS埋牌
msg_templete.CS_BuryCard =
JSON.stringify({
    cards:[]
});

//event='sdh_bury_card_push'
//SC埋牌
msg_templete.SC_BuryCard =
JSON.stringify({

});

//event='sdh_give_up'
//CS认输
msg_templete.CS_GiveUp =
JSON.stringify({

});

//event='sdh_turn_result_push'
//SC一轮出牌结果
msg_templete.SC_Turn_Result =
JSON.stringify({
    max_index:0,
    score_card:[],
    score_value:0,
    score:0,
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

//SC推送报副状态
//event='sdh_deputy_push'
msg_templete.SC_Deputy = 
JSON.stringify({
    user_id:0,
    deputy:0
});

exports.msg_templete = msg_templete;