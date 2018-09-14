/**
 * logic test
 * **/
const assert = require('assert');
var poker_utils = require("./poker_utils");
var global = require('./global_setting').global;

// global.GLOD_NONE =1;//无类型
// global.GOLD_DOUBLE =2;//对子
// global.GOLD_SEQ =3;//连子
// global.GOLD_FLOWER =4;//金花
// global.GOLD_SEQ_FLOWER =5;//顺金花
// global.GOLD_THREE =6; //三个头
function show_card_type(card_type){
    if(card_type.type ==global.GLOD_NONE){
        console.log("============>GLOD_NONE");
    }
    if(card_type.type ==global.GOLD_DOUBLE){
        console.log("============>GOLD_DOUBLE");
    }
    if(card_type.type ==global.GOLD_SEQ){
        console.log("============>GOLD_SEQ");
    }
    if(card_type.type ==global.GOLD_FLOWER){
        console.log("============>GOLD_FLOWER");
    }
    if(card_type.type ==global.GOLD_SEQ_FLOWER){
        console.log("============>GOLD_SEQ_FLOWER");
    }
    if(card_type.type ==global.GOLD_THREE){
        console.log("============>GOLD_THREE");
    }
    console.log(card_type)
    console.log('--------------------------------------------')
}
/**
 * 
 * 0,1,2,3      2
 * 4,5,6,7      3
 * 8,9,10,11    4
 * 12,13,14,15  5
 * 16,17,18,19  6
 * 20,21,22,23  7
 * 24,25,26,27  8
 * 28,29,30,31  9
 * 32,33,34,35  10
 * 36,37,38,39  J
 * 40,41,42,43  Q
 * 44,45,46,47  K
 * 48,49,50,51  A
*/

// var card_list =[0,1,2,3,4]
// console.log('small ox')
// var card_type1 =poker_utils.check_card_type(card_list)
// show_card_type(card_type1)

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

/**
 * 
 * 0,1,2,3      2
 * 4,5,6,7      3
 * 8,9,10,11    4
 * 12,13,14,15  5
 * 16,17,18,19  6
 * 20,21,22,23  7
 * 24,25,26,27  8
 * 28,29,30,31  9
 * 32,33,34,35  10
 * 36,37,38,39  J
 * 40,41,42,43  Q
 * 44,45,46,47  K
 * 48,49,50,51  A
*/
// var card_list =[0,1,2]
// var card_type1 =poker_utils.check_card_type(card_list)
// show_card_type(card_type1)

// card_list =[4,5,6]
// var card_type2 =poker_utils.check_card_type(card_list)
// show_card_type(card_type2)

// card_list =[4,5,9]
// var card_type3 =poker_utils.check_card_type(card_list)
// show_card_type(card_type3)

// card_list =[8,9,12]
// var card_type4 =poker_utils.check_card_type(card_list)
// show_card_type(card_type4)

// card_list =[0,4,8];
// var card_type5 =poker_utils.check_card_type(card_list)
// show_card_type(card_type5)

// card_list =[0,4,9];
// var card_type6 =poker_utils.check_card_type(card_list)
// show_card_type(card_type6)

// card_list =[0,51,9];
// var card_type7 =poker_utils.check_card_type(card_list)
// show_card_type(card_type7)

// assert(!poker_utils.compare(card_type1,card_type2))
// assert(poker_utils.compare(card_type1,card_type3))
// assert(poker_utils.compare(card_type1,card_type4))
// assert(poker_utils.compare(card_type1,card_type5))
// assert(poker_utils.compare(card_type1,card_type6))
// assert(poker_utils.compare(card_type1,card_type7))


// function get_random_card(){
//     var card_list = []
//     while(true){
//         var v =Math.floor(Math.random()*52)
//         if(card_list.indexOf(v) == -1){
//             card_list.push(v);
//         }
//         if(card_list.length ==3) break;
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
// function get_random_card(){
//     var card_list = []
//     while(true){
//         var v =Math.floor(Math.random()*52)
//         if(card_list.indexOf(v) == -1){
//             card_list.push(v);
//         }
//         if(card_list.length ==3) break;
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


// var card_type1 =poker_utils.check_card_type([41,45,48])
// var card_type2 =poker_utils.check_card_type([20,21,26])

// console.log(card_type1)
// console.log(card_type2)

// console.log(poker_utils.compare(card_type1,card_type2))

var card = [10, 3, 2]
var t = poker_utils.check_card_type(card)
console.log(t);

var card1 = [38, 23, 20]
var t1 = poker_utils.check_card_type(card1)
console.log(t1);