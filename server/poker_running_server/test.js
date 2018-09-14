/**
 * logic test
 * **/
const assert = require('assert');
var poker_utils = require("./poker_utils");

function get_poker_card(value_list){
    //根据扑克的值获取牌
    var tmp =[]
    for(var a =0;a<value_list.length;++a){
        tmp.push(value_list[a]*4);
    }

    return tmp;
};


// global.PASS =0;  //过
// global.SINGLE =1;//单
// global.DOUBLE =2;//对
// global.MORE_DOUBLE =3;//连对
// global.SEQUNECE =4; //连子
// global.THREE_PICK_TWO =5;//三代2
// global.MORE_THREE_PICK_TWO =6;//飞机
// global.BOOM =7; //炸弹
// global.SAME_SEQUNECE = 8;//同花顺
hold = []
for(var i=0;i<2;i++){
    for(var j=0;j<54;j++){
        hold.push(j);
    }
}

// //单牌
// poker_utils.check_must(hold,0,[])
// for(var i =0;i<54;++i){
//     var now =[]
//     now.push(i);
//     var must =poker_utils.check_must(hold,1,now)
//     if(must == true){
//         console.log("single true value ====",now)
//     }
// }

// //对子
// for(var i=0;i<54;++i){
//     var now =[];
//     now.push(i);
//     now.push(i);
//     var must =poker_utils.check_must(hold,2,now)
//     if(must == true){
//         console.log("double true value ====",now);
//     }
// }

// //连对
// for (var len =2;len <12;++len){
//     for(var a =0;a<54-len;++a){
//         var v=[];
//         for(var i=0;i<len;i++){
//             v.push(a+i)
//         }
//         var base =get_poker_card(v);
//         var must =poker_utils.check_must(hold,3,base)
//         if(must == true){
//             console.log("more double true value =====",base)
//         }
//     }
// }

// //连子
// //0-11
// for(var aa =5;aa<13;aa++){
    
//     for(var i=0;i<13-aa;i++){
//         var va =[]
//         for(var cc =0;cc<aa;cc++){
//             va.push(i+cc)
//         }
//         var base = get_poker_card(va)
//         var must = poker_utils.check_must(hold,4,base);
//         if(must == true){
//             console.log("SEQUNECE true value ====",base);
//         }
//     }
// }

// //3代2
// for(var i=0;i<13;i++){
//     var va =[]
//     va.push(i);
//     va.push(i);
//     va.push(i);
//     va.push(0);
//     va.push(0);

//     var base = get_poker_card(va)
//     var must = poker_utils.check_must(hold,5,base)
//     if(must== true){
//         console.log("THREE_PICK_TWO true value ====",base)
//     }    
// }


// //飞机
// //最多5个飞机
// for(var f=2;f<5;f++){
//     for(var i=0;i<13-f;i++){
//         var va =[]
//         for(var cc =0;cc<f;cc++){
//             va.push(i+cc)
//             va.push(i+cc)
//             va.push(i+cc)
//         }
//         for(var b=0;b<f;b++){
//             va.push(0);
//             va.push(0);            
//         }

//         var base = get_poker_card(va)
//         var must = poker_utils.check_must(hold,6,base)
//         if(must == true){
//             console.log("MORE_THREE_PICK_TWO  true value ====",base)
//         }
//     }
// }

// //炸弹
// for(var b=4;b<=8;b++){
//     for(var i=0;i<13;i++){
//         var va=[];
//         for(var cc =0;cc<b;cc++){
//             va.push(i);
//         }
//         var base = get_poker_card(va)
//         var must = poker_utils.check_must(hold,7,base)
//         if(must == true){
//             console.log("BOOM  true value ====",base)
//         }
//     }
    
// }

// var kingboom = [52,52,53,53]

// var must = poker_utils.check_must(hold,7,kingboom)

// if(!must){
//     console.log("king boom return false ..........")
// }

// poker_utils.check_must(hold,7,[])
// poker_utils.check_must(hold,8,[])

// var holds = [53,42,4,26,35,1,21,7,44,33,49,17,22,30,46,50,14,28,0,36,18,31,32]
// var aa =poker_utils.check_must(holds,6,[43, 41, 40, 39, 38, 36, 8, 5, 28, 19])
// global.PASS =0;  //过
// global.SINGLE =1;//单
// global.DOUBLE =2;//对
// global.MORE_DOUBLE =3;//连对
// global.SEQUNECE =4; //连子
// global.THREE_PICK_TWO =5;//三代2
// global.MORE_THREE_PICK_TWO =6;//飞机
// global.BOOM =7; //炸弹
// global.SAME_SEQUNECE = 8;//同花顺

var value =poker_utils.check_must([ 53,53,52,0,0 ],5,[51,51,51,1,1])

console.log(value)