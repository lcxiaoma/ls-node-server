/**
 * logic test
 * **/
const assert = require('assert');
var poker_utils = require("./poker_utils");

// function get_poker_card(value_list){
//     //根据扑克的值获取牌
//     var tmp =[]
//     for(var a =0;a<value_list.length;++a){
//         tmp.push(value_list[a]*4);
//     }

//     return tmp;
// };

// //check must out
// value = null;
// //=====================================================================================================
// // global.PASS =0;  //过
// //裸出
// holds = [1,2,3,4,5,6,7,8,10]
// holds_value = get_poker_card(holds)
// value = poker_utils.check_must(holds_value,0,[])
// console.log("BASE 0 [] pass false ==== ",value)
// assert(value == false);
// //SINGLE
// holds = [1,2,3,4,5,6,7,8,10]
// holds_value = get_poker_card(holds)
// value = poker_utils.check_must(holds_value,1,[1])
// console.log("BASE 1 [1] pass false ====",value)
// assert(value == false);
// value = poker_utils.check_must(holds_value,1,[41])
// console.log("BASE 1 [41] pass true ====",value)
// assert(value == true)
// //DOUBLE
// holds =[1,1,2,2,3,3,4,4]
// holds_value = get_poker_card(holds);
// value = poker_utils.check_must(holds_value,2,[4,4]);
// console.log("BASE 2 [4,4] pass false ===",value);
// assert(value == false);
// value = poker_utils.check_must(holds_value,2,[8,8]);
// console.log("BASE 2 [8,8] pass false ===",value);
// assert(value == false);

// value = poker_utils.check_must(holds_value,2,[16,16]);
// console.log("BASE 2 [16,16] pass true ===",value)
// assert(value == true);
// //=======================================================================================================
// // global.SINGLE =1;//单
// // global.DOUBLE =2;//对
// // global.MORE_DOUBLE =3;//连对
// // global.SEQUNECE =4; //连子
// // global.THREE_PICK_TWO =5;//三代2
// // global.MORE_THREE_PICK_TWO =6;//飞机
// holds = [1,1,1,2,2,2,4,5,6,7];
// holds_value = get_poker_card(holds);
// value  = poker_utils.check_must(holds_value,6,[1,1,1,2,2,2,4,5,6,7])
// console.log("BASE 0 [] MTPT false ====",value)
// assert(value == false);
// // global.BOOM =7; //炸弹



// //check can out

// // global.PASS =0;  //过
// // global.SINGLE =1;//单
// // global.DOUBLE =2;//对
// // global.MORE_DOUBLE =3;//连对
// // global.SEQUNECE =4; //连子
// // global.THREE_PICK_TWO =5;//三代2
// // global.MORE_THREE_PICK_TWO =6;//飞机
// // global.BOOM =7; //炸弹

// out_card =[1,1,1,2,2,2,3,4,5,6]
// out_card_value = get_poker_card(out_card)
// value = poker_utils.check_card_type(0,[],6,out_card_value)
// console.log("check card_type true ====>",value);
// assert(value == true);

// out_card =[0,1,2,3,4,5,6,7,8,9,10,11];
// out_card_value = get_poker_card(out_card)
// value = poker_utils.check_card_type(0,[],4,out_card_value)
// console.log("check card_type true ====>",value);
// assert(value == true);

// var aa = function(){

//     var tt = setTimeout(function(){
//         console.log("show+++++++++++++++++++++++++")
//     },1000);
//     return tt;
// }

// var bb = function(id){
//     clearTimeout(id);
// }

// var cc =aa();
// //bb(cc);

function call_banker(game,call,index){
    console.log("call banker begin ==========>",call,index)

    var seat_data = game.game_seats[index]

    if(seat_data.call_banker ==0) return;
    var is_call_end = false;
    var need_force_end = false;
    if(call !=0){
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
    }else{
       //放弃地主

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
    }
    console.log("show call banker result  call = %d,is_call_end =%d,need_force_end = %d,turn = %d",call,is_call_end,need_force_end,game.turn)
}


//叫庄
var game = {
    button:-1,
    turn:-1,
    begin_call:-1,
    game_seats:[],
    rate:1
}

game.turn = Math.floor(Math.random()*3);
game.begin_call = game.turn;
for(var i=0;i<3;++i){
    var data ={
        call_banker:-1
    }
    game.game_seats[i] = data;
}
// //user1
// var next_turn =game.turn;
// call_banker(game,0,next_turn)
// //user2
// next_turn = (next_turn+1)%3;
// call_banker(game,0,next_turn);
// //user3
// next_turn = (next_turn+1)%3;
// call_banker(game,0,next_turn);

// console.log("is_end = true  need_force_end = true ,turn =-1")

// //user1
// var next_turn =game.turn;
// var tmp = next_turn;
// call_banker(game,1,next_turn)
// //user2
// next_turn = (next_turn+1)%3;
// call_banker(game,1,next_turn);
// //user3
// next_turn = (next_turn+1)%3;
// call_banker(game,1,next_turn);
// //user1
// next_turn = (next_turn+1)%3;
// call_banker(game,1,next_turn);

// console.log("is_end = true  need_force_end = false ,turn =%d",tmp)

// //user1
// var next_turn =game.turn;
// var tmp = next_turn;
// call_banker(game,1,next_turn)
// //user2
// next_turn = (next_turn+1)%3;
// call_banker(game,0,next_turn);
// //user3
// next_turn = (next_turn+1)%3;
// call_banker(game,0,next_turn);

// console.log("is_end = true  need_force_end = false ,turn =%d",tmp)




// //user1
// var next_turn =game.turn;
// var tmp = next_turn;
// call_banker(game,1,next_turn)
// //user2
// next_turn = (next_turn+1)%3;
// call_banker(game,0,next_turn);
// //user3
// next_turn = (next_turn+1)%3;
// call_banker(game,1,next_turn);
// //user1
// next_turn = (next_turn+1)%3;
// call_banker(game,1,next_turn);

// console.log("is_end = true  need_force_end = false ,turn =%d",tmp)

//user1
var next_turn =game.turn;
var tmp = next_turn;
call_banker(game,1,next_turn)
//user2
next_turn = (next_turn+1)%3;
call_banker(game,0,next_turn);
//user3
next_turn = (next_turn+1)%3;
tmp = next_turn
call_banker(game,1,next_turn);
//user1
next_turn = (next_turn+1)%3;
call_banker(game,0,next_turn);

console.log("is_end = true  need_force_end = false ,turn =%d",tmp)


var a =poker_utils.check_card_type(0,[],11,[41, 40, 7, 2, 43, 42])
console.log("show me a ========",a)
