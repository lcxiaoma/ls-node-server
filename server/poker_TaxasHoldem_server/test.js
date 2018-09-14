/**
 * logic test
 * **/
const assert = require('assert');
var poker_utils = require("./poker_utils");
var global = require('./global_setting').global;


// var ags =[12,7,6,4,3,2,1]
// var a =poker_utils.pick_out_max_fseq(ags,true);

// console.log("args = %s, result = %s",ags,a);

// var ags =[12,11,10,9,8,7]
// var a =poker_utils.pick_out_max_fseq(ags);

// console.log("args = %s, result = %s",ags,a);

// var ags =[12,12,12,11,10,9,8,7]
// var a =poker_utils.pick_out_max_fseq(ags);

// console.log("args = %s, result = %s",ags,a);

// var ags =[12,12,12,11,10,10,8,7]
// var a =poker_utils.pick_out_max_fseq(ags);

// console.log("args = %s, result = %s",ags,a);

/**
    0,1,2,3, ---2
    4,5,6,7, ---3
    8,9,10,11, ---4
    12,13,14,15 ---5
    16,17,18,19 ---6
    20,21,22,23 ---7
    24,25,26,27 ---8
    28,29,30,31 ---9
    32,33,34,35 ---10
    36,37,38,39 ---J
    40,41,42,43 ---Q
    44,45,46,47 ---K
    48,49,50,51 ---A  48/4 = 12
**/

// K 7
// var public_card = [48,0,4,8,1]
// var private_card =[12,2];

// var card_type =poker_utils.check_card_type(private_card,public_card);

// console.log(card_type)
// var private_card =[12,5];
// var card_type1 = poker_utils.check_card_type(private_card,public_card);

// var r =poker_utils.compare(card_type,card_type1);
// console.log(r);
// var private_card =[];
// var public_card =[]

// public_card =[48,32,29,24,17,9,0]
// var card_type =poker_utils.check_card_type(private_card,public_card);
// console.log("card_type ====>1",card_type)

// public_card = [48,32,29,24,17,9,0,1]
// var card_type =poker_utils.check_card_type(private_card,public_card);
// console.log("card_type ====>2",card_type)

// public_card = [48,32,29,24,17,9,0,1,10]
// var card_type =poker_utils.check_card_type(private_card,public_card);
// console.log("card_type ====>3",card_type)

// public_card = [48,32,29,24,17,9,0,1,2]
// var card_type =poker_utils.check_card_type(private_card,public_card);
// console.log("card_type ====>4",card_type)

// public_card = [1,6,48,9,13,18,20]
// var card_type =poker_utils.check_card_type(private_card,public_card);
// console.log("card_type ====>5",card_type)

// public_card = [48,0,4,20,28,36,50]
// var card_type =poker_utils.check_card_type(private_card,public_card);
// console.log("card_type ====>6",card_type)

// public_card = [44,45,46,36,37,38,27]
// var card_type =poker_utils.check_card_type(private_card,public_card);
// console.log("card_type ====>7",card_type)

// public_card = [44,45,46,47,37,38,27]
// var card_type =poker_utils.check_card_type(private_card,public_card);
// console.log("card_type ====>8",card_type)

// public_card = [48,0,4,8,12,22,23]
// var card_type =poker_utils.check_card_type(private_card,public_card);
// console.log("card_type ====>9",card_type)

// public_card = [32,36,40,44,48,49,50]
// var card_type =poker_utils.check_card_type(private_card,public_card);
// console.log("card_type ====>10",card_type)
// var winner_index =[0,1,2];
// var lose_index =[3,4];
// var all_in_win_map ={};
// all_in_win_map[0] =60;
// all_in_win_map[1] =120;
// all_in_win_map[2] =180;

// var lose_map ={
//     3:100,
//     4:100,
// }

// var win_score = 200;
// var score ={3:-100,4:-100};
// var player_num = 5;

// var game={
//     game_seats:[
//         {},
//         {},
//         {},
//         {total_bet_score:100},
//         {total_bet_score:100}
//     ]
// }


// var tmp_win_score =200;

// var fuck_min =function get_min(obj,current_min){
//     var tmp ={};
//     for(var a in obj){
//         if(obj[a] > current_min){
//             tmp[a] = obj[a];
//         }
//     }
//     var min = -1;
//     for(var b in tmp){
//         if(min == -1){
//             min = tmp[b];
//         }else{
//             if(tmp[b] <min){
//                 min = tmp[b];
//             }
//         }
//     }
//     return min;
// }
// var current_min = fuck_min(all_in_win_map,-1);

// var tmp_winner_index  =[];
// for(var i=0;i<winner_index.length;++i){
//     tmp_winner_index[i] = winner_index[i];
// }
// console.log("tmp win index:",tmp_winner_index);
// var total_e =0;
// var total_c_e =tmp_winner_index.length;

// //总共输的个数
// var total_l_c = lose_index.length;

// while(current_min !=-1){
//     //分配当前最小的分 均分
//     win_score -= current_min;
//     var per_s = Math.floor((current_min-total_e) / total_c_e);
//     var offset_all_in = 0;
//     if(per_s * total_c_e != (current_min-total_e)){
//         offset_all_in = current_min-total_e - per_s *total_c_e;
//     }
//     total_e += offset_all_in + per_s *total_c_e;
//     console.log("per socre===>",per_s);
//     console.log("offset all in ==>",offset_all_in);

//     //此处减掉已经输掉的分
//     var per_lose = (offset_all_in +per_s *total_c_e)/total_l_c;
//     var lose_offset =0;
//     if(per_lose * total_l_c != (offset_all_in +per_s *total_c_e)){
//         lose_offset =(offset_all_in +per_s *total_c_e)-per_lose * total_l_c;
//     }

//     for(var l in lose_map){
//         if(lose_map[l] -per_lose >0){
//             lose_map[l] -= per_lose;
//         }else{
//             lose_offset += per_lose -lose_map[l];
//             lose_map[l] =0;
//             total_l_c -=1;
//         }
//     }

//     while(lose_offset >0){
//         var per_offset = Math.floor(lose_offset /total_l_c);
//         var lose_offset_offset =0;
//         if(per_offset*total_l_c != lose_offset){
//             lose_offset_offset = lose_offset - per_offset*total_l_c;
//         }

//         if(per_offset ==0){
//             if(lose_offset_offset>0){
//                 if(total_l_c >0){
//                     for(var ll in lose_map){
//                         if(lose_map[ll] -per_offset >0){
//                             lose_map[ll] -= per_offset;
//                         }
//                     }
//                 }else{
//                     console.error("offset endness.",lose_offset_offset);
//                     break;
//                 }
//             }
//         }
//         for(var ll in lose_map){
//             if(lose_map[ll] -per_offset >0){
//                 lose_map[ll] -= per_offset;
//             }else{
//                 lose_offset_offset += per_offset -lose_map[ll];
//                 lose_map[ll] =0;
//             }
//         }
//         lose_offset = lose_offset_offset;
//     }

//     for(var i=0;i<player_num;++i){
//         if(tmp_winner_index.indexOf(i) != -1){
//             if(score[i]){
//                 score[i] += per_s;
//             }else{
//                 score[i] = per_s +offset_all_in;
//                 offset_all_in =0;
//             }
//             if(all_in_win_map[i] == current_min){
//                 delete tmp_winner_index[i];
//             }
//         }
//     }
//     total_c_e -= 1;
//     current_min =fuck_min(all_in_win_map,current_min);
//     console.log("tmp win index:",tmp_winner_index,total_c_e);
//     console.log("current min ======>",current_min)
//     if(total_c_e ==0){
//         break;
//     }
// }

// console.log("lose map -------------->",lose_map)
// //边池分数
// if(win_score >0){
//     //还剩余奖池 由后面的人来分
//     if(tmp_winner_index.length >0){
//         //如果有赢家，由赢家来分
//         if(tmp_winner_index.length ==1){
//             //就这个玩家赢
//             score[tmp_winner_index[0]] += win_score;
//         }else{
//             //还有多个玩家赢
//         }
//     }else{
//         //投次注的输家比大小来分
//         if(lose_index.length == 1){
//             score[lose_index[0]] += win_score;
//         }else{
//             //当有多个玩家输的时候，要判断次分数为谁
//             for(var a in lose_map){
//                 //还在输的玩家将进入比牌阶段

//             }

//         }
//     }
// }

// console.log(score);

var game={
    game_seats:[
        {
            user_id:1000,
            all_in:false,
            current_bet_score:0,
            total_bet_score:0,
            die:false,
            can_win_score:0,
            win:0,
        },
        {
            user_id:1001,
            all_in:false,
            current_bet_score:0,
            total_bet_score:0,
            die:false,
            can_win_score:0,
            win:0,
        },
        {
            user_id:1002,
            all_in:false,
            current_bet_score:0,
            total_bet_score:0,
            die:false,
            can_win_score:0,
            win:0,
        },
        // {
        //     user_id:1003,
        //     all_in:false,
        //     current_bet_score:0,
        //     total_bet_score:0,
        //     die:false,
        //     can_win_score:0,
        //     win:0,
        // },
        // {
        //     user_id:1004,
        //     all_in:false,
        //     current_bet_score:0,
        //     total_bet_score:0,
        //     die:false,
        //     can_win_score:0,
        //     win:0,
        // },
        // {
        //     user_id:1004,
        //     all_in:false,
        //     current_bet_score:0,
        //     total_bet_score:0,
        //     die:false,
        //     can_win_score:0,
        //     win:0,
        // },
        // {
        //     user_id:1004,
        //     all_in:false,
        //     current_bet_score:0,
        //     total_bet_score:0,
        //     die:false,
        //     can_win_score:0,
        //     win:0,
        // },
        // {
        //     user_id:1004,
        //     all_in:false,
        //     current_bet_score:0,
        //     total_bet_score:0,
        //     die:false,
        //     can_win_score:0,
        //     win:0,
        // },
    ]
}

var betting = function (index,bet_coin,all_in,die){
    var seat_data = game.game_seats[index];

    var current_seat_score = seat_data.current_bet_score;
    seat_data.current_bet_score += bet_coin;
    seat_data.total_bet_score += bet_coin;
    seat_data.all_in = all_in;
    seat_data.die = die;

    for(var i=0;i<game.game_seats.length;++i){
        var score_seat = game.game_seats[i];
        if(score_seat && score_seat.user_id>0){
            var total_can_win =0;
            for(var j=0;j<game.game_seats.length;++j){
                var add_seat = game.game_seats[j];
                if(add_seat && add_seat.user_id>0){
                    if(score_seat.total_bet_score >=add_seat.total_bet_score){
                        total_can_win += add_seat.total_bet_score;
                    }else{
                        total_can_win += score_seat.total_bet_score;
                    }
                }
            }
            score_seat.can_win_score = total_can_win;
        }
    }
}

betting(1,10,true,false);
betting(0,1000,true,false)
betting(2,1000,false,false)

console.log(game)
// //第一轮
// betting(0,10,false,false);
// betting(1,20,false,false);
// betting(2,20,false,false);
// betting(3,20,false,false);
// betting(4,20,false,false);
// betting(5,20,false,false);
// betting(6,20,false,false);
// betting(7,20,false,false);
// betting(0,20,true,false);
// betting(1,10,false,false);
// betting(2,10,false,false);
// betting(3,10,false,false);
// betting(4,10,false,false);
// betting(5,10,false,false);
// betting(6,10,false,false);
// betting(7,10,false,false);
// // console.log("1----------------------------------------",150)
// // console.log(game);
// //第二轮
// betting(1,10,false,false);
// betting(2,20,false,false);
// betting(3,20,false,false);
// betting(4,20,false,false);
// betting(5,20,false,false);
// betting(6,20,false,false);
// betting(7,20,false,false);
// betting(1,20,true,false);
// betting(2,10,false,false);
// betting(3,10,false,false);
// betting(4,10,false,false);
// betting(5,10,false,false);
// betting(6,10,false,false);
// betting(7,10,false,false);
// // console.log("2----------------------------------------")
// // console.log(game)
// //第三轮
// betting(2,10,false,false);
// betting(3,20,false,false);
// betting(4,20,false,false);
// betting(5,20,false,false);
// betting(6,20,false,false);
// betting(7,20,false,false);
// betting(2,20,true,false);
// betting(3,10,false,false);
// betting(4,10,false,false);
// betting(5,10,false,false);
// betting(6,10,false,false);
// betting(7,10,false,false);
// // console.log("3----------------------------------------")
// // console.log(game)

// betting(3,10,false,false);
// betting(4,20,false,false);
// betting(5,20,false,false);
// betting(6,20,false,false);
// betting(7,20,false,false);

// betting(3,20,true,false);
// betting(4,10,false,false);
// betting(5,10,false,false);
// betting(6,10,false,false);
// betting(7,10,false,false);

// // console.log("4----------------------------------------")
// // console.log(game)

// var set_win =function(index,value){
//     game.game_seats[index].win = value;
// }


// set_win(0,5);
// set_win(1,4);
// set_win(2,3);
// set_win(3,4);
// set_win(4,5);
// set_win(5,3);
// set_win(6,2);
// set_win(7,1);


// function clone(obj){
//     var new_obj ={};
//     for(var a in obj){
//         new_obj[a] = obj[a];
//     }
//     return new_obj;
// }

// function get_end_obj(game){
//     var obj_list =[];
//     var obj_map ={};
//     for(var i=game.game_seats.length-1;i>=0;--i){
//         var seat = game.game_seats[i];
//         if(seat && seat.user_id >0 && !seat.die){
//             var obj = {
//                 can_win_score:seat.can_win_score,
//                 win:seat.win,
//                 index:i,
//             }
//             //obj_list.push(obj);
//             if(!obj_map[obj.win]){
//                 obj_map[obj.win] = [];
//             }
//             obj_map[obj.win].push(obj);
//         }
//     }


//     var fuck_sort = function(obj_list){
//         for(var i=0;i<obj_list.length;++i){
//             for(var j=i+1;j<obj_list.length;++j){
//                 var o = clone(obj_list[i]);
//                 var o_next = clone(obj_list[j]);
//                 if(o_next.win > o.win){
//                     obj_list[j].can_win_score=o.can_win_score;
//                     obj_list[j].win =o.win;
//                     obj_list[j].index =o.index;

//                     obj_list[i].can_win_score= o_next.can_win_score;
//                     obj_list[i].win =o_next.win;
//                     obj_list[i].index = o_next.index;
//                 }
//             }
//         }

//         for(var i=0;i<obj_list.length;++i){
//             for(var j=i+1;j<obj_list.length;++j){
//                 var o = clone(obj_list[i]);
//                 var o_next = clone(obj_list[j]);
//                 if(o_next.can_win_score < o.can_win_score){
//                     obj_list[j].can_win_score=o.can_win_score;
//                     obj_list[j].win =o.win;
//                     obj_list[j].index =o.index;

//                     obj_list[i].can_win_score= o_next.can_win_score;
//                     obj_list[i].win =o_next.win;
//                     obj_list[i].index = o_next.index;
//                 }
//             }
//         }
//         return obj_list;
//     }
//     var map_keys = Object.keys(obj_map);

//     map_keys.sort(function(a,b){ return b-a;});

//     console.log(" show me map keys --------------->",map_keys);

//     for(var i=0;i<map_keys.length;++i){
//         if(obj_map[map_keys[i]].length >1){
//             var tmp =fuck_sort(obj_map[map_keys[i]]);
//             obj_list.push(tmp);
//         }else{
//             obj_list.push(obj_map[map_keys[i]]);
//         }
//     }

//     return obj_list;
// }

// var game_end = function(game){

//     //排序后结算信息
//     var end_obj = get_end_obj(game);

//     console.log("get end obj:\n",end_obj);
//     var score ={};
//     var all_score =780;
//     var current_send_score =0;
//     for(var i=0;i<end_obj.length;++i){
//         if((all_score -current_send_score) ==0){
//             break;
//         }
//         var now_obj = end_obj[i];
//         var avg_num = now_obj.length;
//         if(avg_num >1){
//             //多个人赢,从最少的人开始算
//             var last_score =0;
//             var send_num = avg_num;
//             for(var x=0;x<avg_num;++x){
//                 var has_score =(now_obj[x].can_win_score - current_send_score);
//                 var per_score = Math.floor(has_score/send_num);
//                 current_send_score += has_score;
//                 var offset =0;
//                 if(per_score *send_num != has_score){
//                     offset = has_score -per_score*send_num;
//                 }
//                 if(!score[x]){
//                     score[x] =0;
//                 }
//                 score[x] += per_score +offset+last_score;
//                 last_score = per_score +offset+last_score;
//                 offset =0;
//                 send_num --;
//             }
//         }else{
//             var score_obj = now_obj[0];
//             score[score_obj.index] = score_obj.can_win_score - current_send_score;
//             current_send_score += score_obj.can_win_score - current_send_score;
//         }
//     }

//     console.log("score ---->",score)
// }


// game_end(game);

// var card_type_list ={
//     1:{
//         type:1,
//         max_value:2,
//         max_color:0,
//         card_value:[],
//     },
//     2:{
//         type:2,
//         max_value:2,
//         max_color:0,
//         card_value:[],
//     },
//     3:{
//         type:4,
//         max_value:2,
//         max_color:0,
//         card_value:[],
//     },
//     4:{
//         type:3,
//         max_value:2,
//         max_color:0,
//         card_value:[],
//     },
//     5:{
//         type:3,
//         max_value:2,
//         max_color:0,
//         card_value:[],
//     },
//     6:{
//         type:4,
//         max_value:2,
//         max_color:0,
//         card_value:[],
//     },
//     7:{
//         type:5,
//         max_value:2,
//         max_color:0,
//         card_value:[],
//     },
//     8:{
//         type:3,
//         max_value:2,
//         max_color:0,
//         card_value:[],
//     },
// }

// var pokerUtils = require('./poker_utils');
// //排序牌型
// var fuck_sort_card_type = function(card_type_list){

//     var card_type_index_list =Object.keys(card_type_list);
//     var len = card_type_index_list.length;
//     var tmp_map = {}
//     for(var i=0;i<len;++i){
//         tmp_map[card_type_index_list[i]] =0;
//     }

//     //找出相同的
//     var fuck_push_same = function(same,a1,a2){
//         if(same.length ==0){
//             var tmp =[];
//             tmp.push(a1);
//             tmp.push(a2);
//             same.push(tmp);
//             return same;
//         }
//         var find_index =-1;
//         for(var i=0;i<same.length;++i){
//             var v = same[i];
//             if(v.indexOf(a1) !=-1 || v.indexOf(a2) !=-1){
//                 find_index =i;
//                 break;
//             }
//         }

//         if(find_index !=-1){
//             var a_p = same[find_index];
//             if(a_p.indexOf(a1) == -1){
//                 a_p.push(a1);
//             }
//             if(a_p.indexOf(a2) == -1){
//                 a_p.push(a2);
//             }
//             same[find_index] = a_p;
//         }else{
//             var tmp =[];
//             tmp.push(a1);
//             tmp.push(a2);
//             same.push(tmp);
//         }

//         return same;
//     }
//     var equal_value =[];
//     for(var f=0;f<len;++f){
//         for(var f1=f+1;f1<len;++f1){
//             var a1 =card_type_index_list[f];
//             var a2 =card_type_index_list[f1]
//             var cto1 = clone(card_type_list[a1]);
//             var cto2 = clone(card_type_list[a2]);
//             var result =pokerUtils.compare(cto1,cto2);
//             if(result){
//                 //cto1大
//             }else{
//                 if(result == null){
//                     //相等
//                     equal_value = fuck_push_same(equal_value,a1,a2);
//                 }else{
//                     //cto2大
//                     card_type_index_list[f] =a2;
//                     card_type_index_list[f1] =a1; 
//                 }
//             }
//         }
//     }
//     for(var i=0;i<len;++i){
//         var value = len -card_type_index_list.indexOf(card_type_index_list[i]);
//         tmp_map[card_type_index_list[i]] = value;
//     }

//     for(var u=0;u<equal_value.length;++u){
//         var equal_u = equal_value[u];
//         var max_equal =-1;
//         for(var g in tmp_map){
//             if(equal_u.indexOf(g) !=-1){
//                 if(max_equal ==-1){
//                     max_equal =tmp_map[g];
//                 }else{
//                     if(tmp_map[g] >max_equal){
//                         max_equal = tmp_map[g];
//                     }
//                 }
//             }
//         }
//         if(max_equal != -1){
//             //设置最大值
//             for(var i in tmp_map){
//                 if(equal_u.indexOf(i) !=-1){
//                     tmp_map[i] = max_equal;
//                 }
//             }
//         }
//     }
// }

// fuck_sort_card_type(card_type_list);

// var obj1 = {
//     index:0,
//     score:10
// }

// var obj2 ={
//     index:1,
//     score:20
// }

// var l = [];
// l.push(obj1);
// l.push(obj2);


// var obj3 = clone(l[0]);
// obj3.score =100;


// console.log(obj1);
// console.log(obj3);
// //发送分数
// function send_score(){

// }
// var game_end = function(game){
//     var winner_index =[];
//     var max_card_index =null;
//     var max_card_type =null;
//     var all_score =0;
//     for(var i=0;i<game.game_seats.length;++i){
//         if(max_card_type == null){
//             max_card_type = game.game_seats[i].win;
//             winner_index.push(i);
//         }else{
//             if(game.game_seats[i].win >max_card_type){
//                 max_card_type =game.game_seats[i].win;
//                 winner_index =[];
//                 winner_index.push(i);
//             }else if(game.game_seats[i].win == max_card_type){
//                 winner_index.push(i);
//             }
//         }
//         all_score += game.game_seats[i].total_bet_score;
//     }

//     console.log("winner index ---->",winner_index);

//     var win_score_map = {};
//     var real_win_map = {};
//     for(var i=0;i<winner_index.length;++i){
//         win_score_map[winner_index[i]]=game.game_seats[winner_index[i]].can_win_score
//         real_win_map[winner_index[i]] =0;
//     }

//     console.log("win score map---->",win_score_map);

//     console.log("====================================================")
//     var fuck_min =function get_min(obj,current_min){
//         var tmp ={};
//         for(var a in obj){
//             if(obj[a] > current_min){
//                 tmp[a] = obj[a];
//             }
//         }
//         var min = {
//             index:-1,
//             value:-1
//         };
//         for(var b in tmp){
//             if(min.value == -1){
//                 min.value= tmp[b];
//                 min.index = b;
//             }else{
//                 if(tmp[b] <min.value){
//                     min.value = tmp[b];
//                     min.index =b;
//                 }
//             }
//         }
//         return min;
//     }

//     var current_min = fuck_min(win_score_map,-1);
//     var send_score =0;
//     var send_cout = winner_index.length;
//     while(true){
//         console.log("current min====>",current_min)
//         var per_s = Math.floor((current_min.value-send_score) /send_cout);
//         var offset =0;
//         if(per_s * send_cout != (current_min.value -send_score)){
//             offset = current_min.value-send_score - per_s*send_cout;
//         }
//         for(var i=0;i<winner_index.length;++i){
//             if(win_score_map[winner_index[i]]){
//                 real_win_map[winner_index[i]] += per_s +offset;
//                 send_score += per_s +offset;
//                 if(offset >0){
//                     offset =0;
//                 }
//             }
//         }
//         send_cout -=1;
//         delete win_score_map[current_min.index];
//         console.log("win score map ---->",win_score_map)
//         console.log("real win map ===>",real_win_map);
//         current_min = fuck_min(win_score_map,current_min.value);
//         if(current_min.value == -1){
//             break;
//         }
//     }
    
//     console.log("all score = %d ,send score = %d",all_score,send_score);

//     var has_score = all_score - send_score;
//     var all_user = 8;

//     /**
//      * 
//      * @param {*} obj 玩家分数对象 
//      */
//     var find_win_map = function(obj){
//         var current_win_index = [];
//         var current_win_value = null;
//         for(var a in obj){
//             if(current_win_value == null){
//                 current_win_value = game.game_seats[a].win;
//                 current_win_index.push(a);
//             }else{
//                 if(game.game_seats[a].win > current_win_value){
//                     current_win_index = []
//                     current_win_index.push(a);
//                 }else if(game.game_seats[a].win == current_win_value){
//                     current_win_index.push(a);
//                 }
//             }
//         }
//         return current_win_index;
//     }

//     /**
//      * 发放剩余的钱
//      * @param {*} more_score  多余的分数
//      * @param {*} current_win_index 当前赢的玩家索引 
//      */
//     var send_more = function(more_score,current_win_index,current_send_user){
//         //有多余的分数 给剩余的玩家分
//         var lose_map ={};
//         for(var i=0;i<game.game_seats.length;++i){
//             if(current_win_index.indexOf(i) == -1){
//                 lose_map[i] = game.game_seats[i].can_win_score - send_score;
//             }
//         }
//         console.log("lose map----------->",lose_map)
//         if(lose_map.length == 1){
//             for(var a in lose_map){
//                 real_win_map[a] = more_score;
//                 more_score =0;
//             }
//         }else{
//             //看谁赢
//             var lose_win_index = find_win_map(lose_map);
//             if(lose_win_index.length ==1){
//                 //只剩一个人
//                 if((current_send_user+1) == all_user){
//                     real_win_map[lose_win_index[0]] = more_score;
//                     more_score =0;
//                 }else{
//                     //还剩多个人
//                 }
//             }else{
//                 //输中赢的玩家还有超过2位
//                 var lose_win_map = fuck_lose_win_map(lose_win_index);
//             }
//         }
//         return more_score;
//     }

//     var current_win_index =[];
//     for(var i=0;i<winner_index.length;++i){
//         current_win_index.push(winner_index[i]);
//     }
//     var loops_times =0;
//     var current_send_user = winner_index.length;

//     while(has_score >0){
//         loops_times +=1;
//         has_score =send_more(has_score,current_win_index,current_send_user);
//         if(loops_times >100){
//             console.error("send more endness loop error.");
//             break;
//         }
//     }

//     console.log(">>>>>>>>>>>>>>>>>>",real_win_map);
// }

// game_end(game);



// var private_card = [50,43]
// var public_card = [16,3,39,6,44]
// var card_type =poker_utils.check_card_type(private_card,public_card)
// console.log(card_type);