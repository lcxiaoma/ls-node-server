/**
 * logic test
 * **/
const assert = require('assert');
var poker_utils = require("./poker_utils");
var global = require('./global_setting').global;


// function show_card_type(card_type){
//     if(card_type.type ==global.OX_NONE){
//         console.log("============>OX_NONE");
//     }
//     if(card_type.type ==global.OX_ONE){
//         console.log("============>OX_ONE");
//     }
//     if(card_type.type ==global.OX_DOUBLE){
//         console.log("============>OX_DOUBLE");
//     }
//     if(card_type.type ==global.OX_SILVER){
//         console.log("============>OX_SILVER");
//     }
//     if(card_type.type ==global.OX_GOLD){
//         console.log("============>OX_GOLD");
//     }
//     if(card_type.type ==global.OX_BOOM){
//         console.log("============>OX_BOOM");
//     }
//     if(card_type.type ==global.OX_SMALL){
//         console.log("============>OX_SMALL");
//     }
//     console.log(card_type)
//     console.log('--------------------------------------------')
// }
/**
 * 
 * 0,1,2,3      A
 * 4,5,6,7      2
 * 8,9,10,11    3
 * 12,13,14,15  4
 * 16,17,18,19  5
 * 20,21,22,23  6
 * 24,25,26,27  7
 * 28,29,30,31  8
 * 32,33,34,35  9
 * 36,37,38,39  10
 * 40,41,42,43  J
 * 44,45,46,47  Q
 * 48,49,50,51  K
*/

var card_list =[24,20,4]
var card_list1 =[36,8,0]
var card_type1 =poker_utils.check_card_type(card_list)
var card_type2 =poker_utils.check_card_type(card_list1)
console.log(card_type1)
console.log(card_type2)

var aaa =poker_utils.compare(card_type1,card_type2);
console.log(aaa);

// var card_list =[4,5,6]
// var card_type1 =poker_utils.check_card_type(card_list)
// console.log("type 3 value 1",card_type1);
// var times = poker_utils.get_times(card_type1);
// console.log("time ==========>",times)

// var card_list =[40,41,42]
// var card_type1 =poker_utils.check_card_type(card_list)
// console.log("type 4 value 10",card_type1);
// var times = poker_utils.get_times(card_type1);
// console.log("time ==========>",times)


// var card_list =[44,45,46]
// var card_type1 =poker_utils.check_card_type(card_list)
// console.log("type 4 value 11",card_type1);
// var times = poker_utils.get_times(card_type1);
// console.log("time ==========>",times)

// var card_list =[44,45,40]
// var card_type1 =poker_utils.check_card_type(card_list)
// console.log("type 2 value 11",card_type1);
// var times = poker_utils.get_times(card_type1);
// console.log("time ==========>",times)

// card_list =[0,1,2,3,16]
// console.log('boom ox')
// var card_type2 = poker_utils.check_card_type(card_list)
// show_card_type(card_type2)

// card_list =[48,49,45,51,44]
// console.log('gold ox')
// var card_type3 = poker_utils.check_card_type(card_list)
// show_card_type(card_type3)

// card_list =[48,49,45,51,36]
// console.log('siver ox')
// var card_type4 = poker_utils.check_card_type(card_list)
// show_card_type(card_type4)

// card_list =[48,49,50,36,37]
// console.log('double ox')
// var card_type5 = poker_utils.check_card_type(card_list)
// show_card_type(card_type5)

// card_list =[48,49,50,8,22]
// console.log('ox 9')
// var card_type6 = poker_utils.check_card_type(card_list)
// show_card_type(card_type6)

// console.log(poker_utils.compare(card_type1,card_type1));
// console.log(poker_utils.compare(card_type1,card_type2));
// console.log(poker_utils.compare(card_type1,card_type3));
// console.log(poker_utils.compare(card_type1,card_type4));
// console.log(poker_utils.compare(card_type1,card_type5));
// console.log(poker_utils.compare(card_type1,card_type6));
// console.log("1 false 5 true")

// console.log(poker_utils.compare(card_type2,card_type1));
// console.log(poker_utils.compare(card_type2,card_type2));
// console.log(poker_utils.compare(card_type2,card_type3));
// console.log(poker_utils.compare(card_type2,card_type4));
// console.log(poker_utils.compare(card_type2,card_type5));
// console.log(poker_utils.compare(card_type2,card_type6));
// console.log("2 false 5 true")

// console.log(poker_utils.compare(card_type3,card_type1));
// console.log(poker_utils.compare(card_type3,card_type2));
// console.log(poker_utils.compare(card_type3,card_type3));
// console.log(poker_utils.compare(card_type3,card_type4));
// console.log(poker_utils.compare(card_type3,card_type5));
// console.log(poker_utils.compare(card_type3,card_type6));
// console.log("3 false 5 true")

// console.log(poker_utils.compare(card_type4,card_type1));
// console.log(poker_utils.compare(card_type4,card_type2));
// console.log(poker_utils.compare(card_type4,card_type3));
// console.log(poker_utils.compare(card_type4,card_type4));
// console.log(poker_utils.compare(card_type4,card_type5));
// console.log(poker_utils.compare(card_type4,card_type6));
// console.log("4 false 5 true")

// console.log(poker_utils.compare(card_type5,card_type1));
// console.log(poker_utils.compare(card_type5,card_type2));
// console.log(poker_utils.compare(card_type5,card_type3));
// console.log(poker_utils.compare(card_type5,card_type4));
// console.log(poker_utils.compare(card_type5,card_type5));
// console.log(poker_utils.compare(card_type5,card_type6));
// console.log("5 false 5 true")

// console.log(poker_utils.compare(card_type6,card_type1));
// console.log(poker_utils.compare(card_type6,card_type2));
// console.log(poker_utils.compare(card_type6,card_type3));
// console.log(poker_utils.compare(card_type6,card_type4));
// console.log(poker_utils.compare(card_type6,card_type5));
// console.log(poker_utils.compare(card_type6,card_type6));




// function get_random_card(){
//     var card_list = []
//     while(true){
//         var v =Math.floor(Math.random()*52)
//         if(card_list.indexOf(v) == -1){
//             card_list.push(v);
//         }
//         if(card_list.length == 5) break;
//     }
//     return card_list;
// }

// for(var i=0;i<10;++i){
//     var card_list1 = get_random_card();
//     var card_list2 = get_random_card();

//     var card_type1 = poker_utils.check_card_type(card_list1);
//     var card_type2 = poker_utils.check_card_type(card_list2);
//     console.log(i,"------------------------------------------------------------------------")
//     console.log(card_type1)
//     console.log(card_type2)
//     console.log('card_type1 > card_type2 ==',poker_utils.compare(card_type1,card_type2));
//     console.log("------------------------------------------------------------------------")
//     console.log('');
//     console.log('');
//     console.log('');    
// }

// console.log(global.type_check(2))

/**
 * 
 * 0,1,2,3      A
 * 4,5,6,7      2
 * 8,9,10,11    3
 * 12,13,14,15  4
 * 16,17,18,19  5
 * 20,21,22,23  6
 * 24,25,26,27  7
 * 28,29,30,31  8
 * 32,33,34,35  9
 * 36,37,38,39  10
 * 40,41,42,43  J
 * 44,45,46,47  Q
 * 48,49,50,51  K
*/

// var card_list =[45,6,23,9,8] //Q 2 6 3 3 无牛  不输 -10
// var card_list2 =[46,11,13,27,5] //Q 3 4 7 2  牛六  宇文 -10
// var card_list3 =[50,7,42,35,28] //K 2 J 9 8  牛九   东方 30
// var card_list4 =[17,24,33,51,15] //5 7 9 k 4  牛五  赌圣-10  庄家
// //[[5,37,17,36,49],[21,0,11,4,31]]
// var card_type = poker_utils.check_card_type(card_list)
// var card_type1 = poker_utils.check_card_type(card_list2)
// var card_type2 =poker_utils.check_card_type(card_list3)
// var card_type3 =poker_utils.check_card_type(card_list4)

// //console.log(card_type)
// console.log(card_type1)
// //console.log(card_type2)
// console.log(card_type3)

// //console.log("------------",poker_utils.compare(card_type3,card_type))
// console.log("------------",poker_utils.compare(card_type3,card_type1))
// //console.log("------------",poker_utils.compare(card_type3,card_type2))

// //4player
// var score={
//     0:-45,
//     1:-10,
//     2:33,
//     3:22
// }

// var statistic ={
//     0:0,
//     1:0,
//     2:0,
//     3:0
// }
// var current_banker_score = 33;
// var banker_lose = 55;
// var banker_win =10;

// var total_win = current_banker_score +banker_win;
// for(var a in score){
//     if(a !=0){
//         if(score[a] >0){
//             var ss = Math.round(score[a] /banker_lose *total_win);
//             statistic[a] += ss;
//         }else{
//             statistic[a] +=score[a];
//         }
//     }else{
//         current_banker_score =0;
//     }
// }

// console.log(statistic);
// var banker_circle =[0,0];

// banker_circle[0] = 10

// var max_game =1;
// var player_num =3;
// var is_game_over = true;
// if(max_game ==1){
//     //一圈庄
//     var mask =banker_circle[0];
//     for(var i=0;i<player_num;++i){
//         if((mask &(0x01 <<(i+1))) ==0){
//             is_game_over = false;
//             break;
//         }
//     }
    
// }else if(max_game ==2){
//     //2圈庄
//     var mask = banker_circle[1];
//     for(var i=0;i<player_num;++i){
//         if((mask &(0x01 <<(i+1))) ==0){
//             is_game_over = false;
//             break;
//         }
//     }
// }

// console.log("game end ?",is_game_over)



// var card_type1 ={
//     type:2,
//     max_value:4,
//     max_color:0,
//     card_value:[12,7,2,1,0]
// }

// var card_type2 ={
//     type:3,
//     max_value:0,
//     max_color:2,
//     card_value:[11,10,8,6,3],
// }

// var tmp_max =[];
// tmp_max.push(card_type1);
// tmp_max.push(card_type2);
// console.log("before sort====>",tmp_max)
// tmp_max.sort(function(a,b){return poker_utils.compare(b,a)});
// console.log(tmp_max)