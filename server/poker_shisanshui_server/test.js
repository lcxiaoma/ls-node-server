/**
 * logic test
 * **/
const assert = require('assert');
var poker_utils = require("./poker_utils");
var global = require('./global_setting').global;


/** 方块 梅花 红桃 黑桃
 *  0,   1,   2,  3   2 0
 *  4,   5,   6,  7   3 1
 *  8,   9,   10, 11  4 2
 *  12   ,13, 14, 15  5 3
 *  16   ,17, 18, 19  6
 *  20   ,21, 22, 23  7
 *  24   ,25, 26, 27  8
 *  28   ,29, 30, 31  9
 *  32   ,33, 34, 35  10
 *  36   ,37, 38, 39  J
 *  40   ,41, 42, 43  Q
 *  44   ,45, 46, 47  K
 *  48   ,49, 50, 51  A
*/

//45 32.... K 10
//44 36.... K J


exports.check_data ={
////////////////////////空类型/////////////////////////////
    type_none:{
        data1:{
            holds:[44,34,37,8,18,40,42,41,5,4,14,13,12],
            out_type:global.OUT_TYPE_NONE,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[37,34,44]
                },{
                    type:global.SHISSHUI_TYPE_THREE,
                    card_data:[41,42,40,18,8]
                },{
                    type:global.SHISSHUI_TYPE_HULU,
                    card_data:[12,13,14,4,5]
                },
            ],
        },
        data2:{
            holds:[45,31,29,0,1,6,7,15,32,35,38,24,36],
            out_type:global.OUT_TYPE_NONE,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_DOUBLE,
                    card_data:[45,31,29]
                },{
                    type:global.SHISSHUI_TYPE_2DOUBLE,
                    card_data:[0,1,6,7,15]
                },{
                    type:global.SHISSHUI_TYPE_2DOUBLE,
                    card_data:[32,35,38,24,36]
                },
            ],
        },
    },
///////////////////////////////三同花///////////////////////////////
    type_three_same :{
        data1:{
            holds:[],
            out_type:global.OUT_TYPE_THREE_SAME,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
        data2:{
            out_type:global.OUT_TYPE_THREE_SAME,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
    },
//////////////////////////////三连子////////////////////////////////
    type_three_seq :{
        data1:{
            out_type:global.OUT_TYPE_THREE_SEQ,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
        data2:{
            out_type:global.OUT_TYPE_THREE_SEQ,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
    },
/////////////////////////////////6对半//////////////////////////////
    type_6double :{
        data1:{
            out_type:global.OUT_TYPE_6DOUBLE,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
        data2:{
            out_type:global.OUT_TYPE_6DOUBLE,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
    },
////////////////////////////////五对三条//////////////////////////////
    type_5double_three :{
        data1:{
            out_type:global.OUT_TYPE_5DOUBLE_THREE,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
        data2:{
            out_type:global.OUT_TYPE_5DOUBLE_THREE,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
    },
///////////////////////////////4套三条///////////////////////////////
    type_four_three:{
        data1:{
            holds:[36,28,31,30,26,24,2,0,1,35,25,32,34],
            out_type:global.OUT_TYPE_4THREE,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_THREE,
                    card_data:[32,34,35]
                },{
                    type:global.SHISSHUI_TYPE_THREE,
                    card_data:[0,1,2,36,25]
                },{
                    type:global.SHISSHUI_TYPE_HULU,
                    card_data:[24,26,28,30,31]
                },
            ],
        },
        data2:{
            holds:[51,44,49,50,19,17,16,23,15,12,22,21,13],
            out_type:global.OUT_TYPE_4THREE,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[15,44,23]
                },{
                    type:global.SHISSHUI_TYPE_HULU,
                    card_data:[19,17,16,13,12]
                },{
                    type:global.SHISSHUI_TYPE_HULU,
                    card_data:[51,49,50,22,21]
                },
            ],
        },
    },
/////////////////////////////////双怪冲3   两对葫芦，一个三条/////////////
    type_3three_2double :{
        data1:{
            out_type:global.OUT_TYPE_2HULU_THREE,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
        data2:{
            out_type:global.OUT_TYPE_2HULU_THREE,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
    },
/////////////////////////////////凑一色    全是1个花色/////////////
    type_all_same:{
        data1:{
            out_type:global.OUT_TYPE_ALL_SAME,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
        data2:{
            out_type:global.OUT_TYPE_ALL_SAME,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
    },
/////////////////////////////////全小      全是2-8/////////////
    type_all_small :{
        data1:{
            out_type:global.OUT_TYPE_ALL_SMALL,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
        data2:{
            out_type:global.OUT_TYPE_ALL_SMALL,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
    },
/////////////////////////////////全大      全是8-A/////////////
    type_all_big :{
        data1:{
            out_type:global.OUT_TYPE_ALL_BIG,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
        data2:{
            out_type:global.OUT_TYPE_ALL_BIG,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
    },
/////////////////////////////////三分天下  三个炸弹余一张/////////////
    type_three_boom :{
        data1:{
            out_type:global.OUT_TYPE_3BOOM,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
        data2:{
            out_type:global.OUT_TYPE_3BOOM,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
    },
/////////////////////////////////三同花顺  三墩都是同花顺/////////////
    type_three_same_seq :{
        data1:{
            out_type:global.OUT_TYPE_3SAME_SEQ,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
        data2:{
            out_type:global.OUT_TYPE_3SAME_SEQ,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
    },
/////////////////////////////////12皇族   全是J Q K A/////////////
    type_12king :{
        data1:{
            out_type:global.OUT_TYPE_12KING,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
        data2:{
            out_type:global.OUT_TYPE_12KING,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
    },
/////////////////////////////////一条龙    A,K齐全 不同花/////////////
    type_a_k :{
        data1:{
            out_type:global.OUT_TYPE_A_K,
            stage:[
                {
                    type:global.OUT_TYPE_A_K,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
        data2:{
            out_type:global.OUT_TYPE_A_K,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
    },
/////////////////////////////////至尊青龙  A,K 齐全 同花/////////////
    type_kingking :{
        data1:{
            out_type:global.OUT_TYPE_KINGKING,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
        data2:{
            out_type:global.OUT_TYPE_KINGKING,
            stage:[
                {
                    type:global.SHISSHUI_TYPE_NONE,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },{
                    type:0,
                    card_data:[]
                },
            ],
        },
    },
}

var check_data = exports.check_data;

// console.log("check data format====>",poker_utils.check_data_format(check_data.type_none.data1));
// console.log("check card ivalid ===>",poker_utils.check_card_invalied(check_data.type_none.data1.stage,check_data.type_none.data1.holds));
// console.log("check out type   ====>",poker_utils.check_out_type(check_data.type_none.data1,check_data.type_none.data1.holds));
// console.log("check stage type ====>",poker_utils.check_stage_type(check_data.type_none.data1.stage));
// console.log('----------------------------------------------------------------------------------------------------------------------------------')
// console.log("check data format====>",poker_utils.check_data_format(check_data.type_none.data2));
// console.log("check card ivalid ===>",poker_utils.check_card_invalied(check_data.type_none.data2.stage,check_data.type_none.data2.holds));
// console.log("check out type   ====>",poker_utils.check_out_type(check_data.type_none.data2,check_data.type_none.data2.holds));
// console.log("check stage type ====>",poker_utils.check_stage_type(check_data.type_none.data2.stage));
// console.log('----------------------------------------------------------------------------------------------------------------------------------')
// console.log("out_type ===>",poker_utils.compare_out_type(check_data.type_none.data1,check_data.type_none.data2))
// for(var i=0;i<check_data.type_none.data1.stage.length;++i){
//     console.log("stage type ===>",poker_utils.compare_stage(check_data.type_none.data1.stage[i],check_data.type_none.data2.stage[i]))
// }
// console.log("-----------------------------------------------------------------------------------------------------------------------------------")
// //4个3条

// console.log("check data format====>",poker_utils.check_data_format(check_data.type_four_three.data1));
// console.log("check card ivalid ===>",poker_utils.check_card_invalied(check_data.type_four_three.data1.stage,check_data.type_four_three.data1.holds));
// console.log("check out type   ====>",poker_utils.check_out_type(check_data.type_four_three.data1,check_data.type_four_three.data1.holds));
// console.log("check stage type ====>",poker_utils.check_stage_type(check_data.type_four_three.data1.stage));
// console.log('----------------------------------------------------------------------------------------------------------------------------------')
// console.log("check data format====>",poker_utils.check_data_format(check_data.type_four_three.data2));
// console.log("check card ivalid ===>",poker_utils.check_card_invalied(check_data.type_four_three.data2.stage,check_data.type_four_three.data2.holds));
// console.log("check out type   ====>",poker_utils.check_out_type(check_data.type_four_three.data2,check_data.type_four_three.data2.holds));
// console.log("check stage type ====>",poker_utils.check_stage_type(check_data.type_four_three.data2.stage));

// //check  list_equal 
// var l1 = [1,2,3,4,5,6,7,8,9]
// var l2 = [9,8,7,6,5,4,3,2,1]

// console.log("true",poker_utils.list_equal(l1,l2));
// console.log(l1);
// console.log(l2);
// console.log('--------------------------------------------')

// var l1 = [1,2,3,4,5,6,7,8,9]
// var l2 = [9,8,7,6,5,4,3,2,1,1]
// console.log("false",poker_utils.list_equal(l1,l2));
// console.log(l1);
// console.log(l2);
// console.log('--------------------------------------------')

// //check  list_equal 
// var l1 = [1,2,3,4,5,6,7,9,9]
// var l2 = [9,8,7,6,5,4,3,2,1]

// console.log("false",poker_utils.list_equal(l1,l2));
// console.log(l1);
// console.log(l2);
// console.log('--------------------------------------------')

// //check client data invalid
// console.log("=============================================")
// var data ={
//     out_type:1,
//     stage:[
//         {
//             type:1,
//             card_data:[1,2,3],
//         },
//         {
//             type:1,
//             card_data:[1,2,3,4,5],
//         },
//         {
//             type:1,
//             card_data:[1,2,3,4,5],
//         }
//     ]
// }
// console.log("check data format--->true",poker_utils.check_data_format(data));
// console.log("=============================================")
// var data ={
//     out_type:1,
//     stage:[
//         {
//             type:1,
//             card_data:[1,2,3,4],
//         },
//         {
//             type:1,
//             card_data:[1,2,3,4,5],
//         },
//         {
//             type:1,
//             card_data:[1,2,3,4,5],
//         }
//     ]
// }
// console.log("check data format--->false",poker_utils.check_data_format(data));
// console.log("=============================================")
// var data ={
//     out_type:1,
//     stage:[
//         {
//             type:1,
//             card_data:[1,2,3,4],
//         },
//         {
//             type:1,
//             card_data:[1,2,3,4,5],
//         },
//     ]
// }
// console.log("check data format--->false",poker_utils.check_data_format(data));
// console.log("=============================================")
// var data ={
//     out_type:'ffffffffffffffffffffff',
//     stage:[
//         {
//             type:1,
//             card_data:[1,2,3],
//         },
//         {
//             type:1,
//             card_data:[1,2,3,4,5],
//         },
//         {
//             type:1,
//             card_data:[1,2,3,4,5],
//         }
//     ]
// }
// console.log("check data format--->false",poker_utils.check_data_format(data));
// console.log("=============================================")

// // 检测牌是否相等
// var stage=[
//         {
//             type:1,
//             card_data:[1,2,3],
//         },
//         {
//             type:1,
//             card_data:[1,2,3,4,5],
//         },
//         {
//             type:1,
//             card_data:[1,2,3,4,5],
//         }
//     ];
// var holds =[1,1,1,2,2,2,3,3,3,4,4,5,5]

// console.log("check stage===>true",poker_utils.check_card_invalied(stage,holds))
// console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")

// var stage=[
//         {
//             type:1,
//             card_data:[1,2,3,4],
//         },
//         {
//             type:1,
//             card_data:[1,2,3,4,5],
//         },
//         {
//             type:1,
//             card_data:[1,2,3,4,5],
//         }
//     ];
// var holds =[1,1,1,2,2,2,3,3,3,4,4,5,5]

// console.log("check stage===>false",poker_utils.check_card_invalied(stage,holds))
// console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")


// var stage=[
//         {
//             type:1,
//             card_data:[1,2,4],
//         },
//         {
//             type:1,
//             card_data:[1,2,3,4,5],
//         },
//         {
//             type:1,
//             card_data:[1,2,3,4,5],
//         }
//     ];
// var holds =[1,1,1,2,2,2,3,3,3,4,4,5,5]

// console.log("check stage===>false",poker_utils.check_card_invalied(stage,holds))
// console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")

// var stage=[
//         {
//             type:1,
//             card_data:[1,2,3],
//         },
//         {
//             type:1,
//             card_data:[1,2,3,4,5],
//         },
//         {
//             type:1,
//             card_data:[1,2,3,4,5],
//         }
//     ];
// var holds =[1,1,1,2,2,2,3,3,3,4,4,5,12]

// console.log("check stage===>false",poker_utils.check_card_invalied(stage,holds))
// console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")

//check card out_type
//十三水牌类型
// global.OUT_TYPE_NONE =1;        //无类型
// global.OUT_TYPE_THREE_SAME =2; //三同花         三墩都是同花
// global.OUT_TYPE_THREE_SEQ =3;  //三顺子         三墩都是顺子
// global.OUT_TYPE_6DOUBLE =4;    //6对半          6对
// global.OUT_TYPE_5DOUBLE_THREE =5;   //五对三条  五对+1个三条
// global.OUT_TYPE_4THREE =6;          //4套三条   4个三条
// global.OUT_TYPE_2HULU_THREE =7;     //双怪冲3   两对葫芦，一个三条
// global.OUT_TYPE_ALL_SAME = 8;       //凑一色    全是1个花色
// global.OUT_TYPE_ALL_SMALL =9;       //全小      全是2-8
// global.OUT_TYPE_ALL_BIG =10;         //全大      全是8-A
// global.OUT_TYPE_3BOOM =11;          //三分天下  三个炸弹余一张
// global.OUT_TYPE_3SAME_SEQ =12;      //三同花顺  三墩都是同花顺
// global.OUT_TYPE_12KING =13;         //12皇族   全是J Q K A
// global.OUT_TYPE_A_K= 14;            //一条龙    A,K齐全 不同花
// global.OUT_TYPE_KINGKING =15;       //至尊青龙  A,K 齐全 同花
// var data ={
//     out_type:global.OUT_TYPE_NONE,
//     stage:[]
// };
// var holds =[];
// console.log("无类型=====>",poker_utils.check_out_type(data,holds))
// console.log("----------------------------------------------------")

// var data ={
//     out_type:global.OUT_TYPE_THREE_SAME,
//     stage:[]
// };
// var holds =[];
// console.log("三同花=====>",poker_utils.check_out_type(data,holds))
// console.log("----------------------------------------------------")

// var data ={
//     out_type:global.OUT_TYPE_THREE_SEQ,
//     stage:[]
// };
// var holds =[];
// console.log("三顺子=====>",poker_utils.check_out_type(data,holds))
// console.log("----------------------------------------------------")

// var data ={
//     out_type:global.OUT_TYPE_6DOUBLE,
//     stage:[]
// };
// var holds =[];
// console.log("6对半=====>",poker_utils.check_out_type(data,holds))
// console.log("----------------------------------------------------")

// var data ={
//     out_type:global.OUT_TYPE_5DOUBLE_THREE,
//     stage:[]
// };
// var holds =[];
// console.log("五对三条=====>",poker_utils.check_out_type(data,holds))
// console.log("----------------------------------------------------")

// var data ={
//     out_type:global.OUT_TYPE_4THREE,
//     stage:[]
// };
// var holds =[];
// console.log("四套三条=====>",poker_utils.check_out_type(data,holds))
// console.log("----------------------------------------------------")

// var data ={
//     out_type:global.OUT_TYPE_2HULU_THREE,
//     stage:[]
// };
// var holds =[];
// console.log("双怪冲3=====>",poker_utils.check_out_type(data,holds))
// console.log("----------------------------------------------------")

// var data ={
//     out_type:global.OUT_TYPE_ALL_SAME,
//     stage:[]
// };
// var holds =[];
// console.log("凑一色=====>",poker_utils.check_out_type(data,holds))
// console.log("----------------------------------------------------")

// var data ={
//     out_type:global.OUT_TYPE_ALL_SMALL,
//     stage:[]
// };
// var holds =[];
// console.log("全小=====>",poker_utils.check_out_type(data,holds))
// console.log("----------------------------------------------------")

// var data ={
//     out_type:global.OUT_TYPE_ALL_BIG,
//     stage:[]
// };
// var holds =[];
// console.log("全大=====>",poker_utils.check_out_type(data,holds))
// console.log("----------------------------------------------------")

// var data ={
//     out_type:global.OUT_TYPE_3BOOM,
//     stage:[]
// };
// var holds =[0,1,2,3,4,5,6,7,12,20,21,22,23];
// console.log("三分天下=====>",poker_utils.check_out_type(data,holds))
// console.log("----------------------------------------------------")

// var data ={
//     out_type:global.OUT_TYPE_3SAME_SEQ,
//     stage:[]
// };
// var holds =[];
// console.log("三同花顺=====>",poker_utils.check_out_type(data,holds))
// console.log("----------------------------------------------------")

// var data ={
//     out_type:global.OUT_TYPE_12KING,
//     stage:[]
// };
// var holds =[];
// console.log("12皇族=====>",poker_utils.check_out_type(data,holds))
// console.log("----------------------------------------------------")

// var data ={
//     out_type:global.OUT_TYPE_A_K,
//     stage:[]
// };
// var holds =[];
// console.log("一条龙=====>",poker_utils.check_out_type(data,holds))
// console.log("----------------------------------------------------")

// var data ={
//     out_type:global.OUT_TYPE_KINGKING,
//     stage:[]
// };
// var holds =[];
// console.log("至尊青龙=====>",poker_utils.check_out_type(data,holds))
// console.log("----------------------------------------------------")

// var game ={
//     button:0,
//     open_card_mask:0,

//     game_seats:[
//         {
//             seat_index:0,
//             user_id:10001,
//             holds:[1,2,3,4,5,6,7],
//             folds:[[1,2,3],[4,5,6,7,8,9],[4,5,6,7,8,9]],
//             group:{
//                 out_type:1,
//                 stage:[1,2,3]
//             },
//         },{
//             seat_index:1,
//             user_id:10002,
//             holds:[1,2,3,4,5,6,7],
//             folds:[[1,2,3],[4,5,6,7,8,9],[4,5,6,7,8,9]],
//             group:{
//                 out_type:1,
//                 stage:[1,2,3]
//             },
//         },
//     ],
// }
// function get_crypt_list(length){
//     var arr =[];
//     for(var i=0;i<length;++i){
//         arr.push(-1);
//     }
//     return arr;
// }

// function get_crypt_folds(folds){
//     var arr =[];
//     for(var i=0;i<folds.length;++i){
//         var tmp =[];
//         for(var j=0;j<folds[i].length;++j){
//             tmp.push(-1);
//         }
//         arr.push(tmp);
//     }
//     return arr;
// }

// function notice_self_holds_change(game,seat_data,broad){
//     var my_msg ={
//         user_id:seat_data.user_id,   //玩家ID
//         holds:seat_data.holds,       //玩家手牌
//         folds:seat_data.folds,       //玩家出牌
//         folds_type:seat_data.group,  //玩家出牌类型
//     };
//     var other_msg ={
//         user_id:seat_data.user_id,   //玩家ID
//         holds:seat_data.holds,       //玩家手牌
//         folds:seat_data.folds,       //玩家出牌
//         folds_type:seat_data.group,  //玩家出牌类型
//     }
//     if(seat_data.seat_index == game.button){
//         //如果是庄家
//         var crypt_holds = get_crypt_list(seat_data.holds.length);
//         other_msg.holds = crypt_holds;
//         if(!global.has_rule(game.open_card_mask,global.OPEN_CARD_HOLDS_BANKER_ONLY)){
//             my_msg.holds = crypt_holds;
//         }

//         if(!global.has_rule(game.open_card_mask,global.OPEN_CARD_FOLDS_BANKER)){
//             var crypt_folds = get_crypt_folds(seat_data.folds);
//             other_msg.folds = crypt_folds;
//             other_msg.folds_type ={};
//         }
//     }else{
//         //闲家
//         var crypt_holds = get_crypt_list(seat_data.holds.length);
//         other_msg.holds = crypt_holds;
//         if(!global.has_rule(game.open_card_mask,global.OPEN_CARD_HOLDS_USER)){
//             my_msg.holds = crypt_holds;
//         }

//         if(!global.has_rule(game.open_card_mask,global.OPEN_CARD_FOLDS_ALL)){
//             var crypt_folds = get_crypt_folds(seat_data.folds);
//             other_msg.folds = crypt_folds;
//             other_msg.folds_type ={};
//         }
//     }

//     console.log("send-to-room self msg:",my_msg);
//     console.log("send-to-room other msg:",other_msg)
//     console.log("=====================================================================")
//     // if(broad){
//     //     //
//     //     // userManager.send_to_room('game_holds_push',crypt_msg,game.room_id.id);
//     // }else{
//     //     console.log("send-to-user",my_msg);
//     //     // userManager.sendMsg(seat_data.user_id,'game_holds_push',crypt_msg);
//     // }
// }

// game.open_card_mask += 0x01 << global.OPEN_CARD_HOLDS_BANKER_ONLY;
// game.open_card_mask += 0x01 <<global.OPEN_CARD_HOLDS_USER;
// game.open_card_mask += 0x01 <<global.OPEN_CARD_FOLDS_BANKER;
// game.open_card_mask += 0x01 <<global.OPEN_CARD_FOLDS_ALL;

// var seat_data = game.game_seats[0];
// var seat_data1 = game.game_seats[1];

// // seat_data.folds =[];
// // seat_data.group ={};

// // seat_data1.folds =[];
// // seat_data1.group ={};


// seat_data.holds =[];
// seat_data1.holds =[];

// console.log("banker---------------------------------------------->")
// notice_self_holds_change(game,seat_data,true);

// console.log("other---------------------------------------------->")
// notice_self_holds_change(game,seat_data1,true);


function check_out_type_three_seq(holds) {
    var value_list =[];
    for(var i=0;i<holds.length;++i){
        value_list.push(poker_utils.get_poker_value(holds[i]));
    }

    value_list.sort(function(a,b){return b-a;});
    console.log("show me value list---------->",value_list)


    var tmp_seq_obj1 =null;
    var tmp_seq_obj2 =null;
    var tmp_seq_obj3 =null;

    var find_value_list = value_list.slice();
    var begin = find_value_list[0];
    find_value_list.splice(0,1);

    tmp_seq_obj1 =find_seq(begin,find_value_list);
    find_value_list = tmp_seq_obj1.rest;

    if(find_value_list.length >=3){
        begin = find_value_list[0];
        find_value_list.splice(0,1);
        tmp_seq_obj2 = find_seq(begin,find_value_list);
        find_value_list = tmp_seq_obj2.rest;
    }
    if(find_value_list.length >=3){
        begin = find_value_list[0];
        find_value_list.splice(0,1);
        tmp_seq_obj3 = find_seq(begin,find_value_list);
        find_value_list = tmp_seq_obj3.rest;
    }
    console.log("1===>",tmp_seq_obj1)
    console.log("2===>",tmp_seq_obj2)
    console.log("3===>",tmp_seq_obj3)
    if(find_value_list.length == 0){
        return true;
    }
    return false;
}


function find_seq(begin,value_list){
    var tmp_seq =[];
    tmp_seq.push(begin);

    var tmp_value_list = value_list.slice();
    if(begin == 12){
        //A需要特殊处理
        //向下
        var offset =1;
        while(tmp_value_list.indexOf(begin -offset) != -1){
            tmp_seq.push(begin -offset);
            tmp_value_list.splice(tmp_value_list.indexOf(begin -offset),1);
            offset +=1;
        }
        //向下 如果长度 不符合想要的  5 3 8 10% ==0
        if(tmp_seq.length !=3 && tmp_seq.length !=5 && tmp_seq.length !=8 && tmp_seq.length !=10 && tmp_seq.length !=13){
            if(tmp_seq.length >10){
                //只能取长度10
                var remove_list =[];
                for(var i=tmp_seq.length-1;i>9;--i){
                    remove_list.push(tmp_seq[i]);
                }

                for(var i=0;i<remove_list.length;++i){
                    tmp_seq.splice(tmp_seq.indexOf(remove_list[i]),1)
                    tmp_value_list.push(remove_list[i]);
                }
                tmp_value_list.sort(function(a,b){return b-a;});

                return {seq:tmp_seq,rest:tmp_value_list};

            }else if(tmp_seq.length >8){
                //最多只能取8
                var remove_list =[];
                for(var i=tmp_seq.length-1;i>7;--i){
                    remove_list.push(tmp_seq[i]);
                }

                for(var i=0;i<remove_list.length;++i){
                    tmp_seq.splice(tmp_seq.indexOf(remove_list[i]),1)
                    tmp_value_list.push(remove_list[i]);
                }
                tmp_value_list.sort(function(a,b){return b-a;});

                return {seq:tmp_seq,rest:tmp_value_list};
            }else if(tmp_seq.length >5){
                //只能取5个
                var remove_list =[];
                for(var i=tmp_seq.length-1;i>4;--i){
                    remove_list.push(tmp_seq[i]);
                }

                for(var i=0;i<remove_list.length;++i){
                    tmp_seq.splice(tmp_seq.indexOf(remove_list[i]),1)
                    tmp_value_list.push(remove_list[i]);
                }
                tmp_value_list.sort(function(a,b){return b-a;});

                return {seq:tmp_seq,rest:tmp_value_list};
            }else if(tmp_seq.length >3){
                //只能取3个
                var remove_list =[];
                for(var i=tmp_seq.length-1;i>2;--i){
                    remove_list.push(tmp_seq[i]);
                }

                for(var i=0;i<remove_list.length;++i){
                    tmp_seq.splice(tmp_seq.indexOf(remove_list[i]),1)
                    tmp_value_list.push(remove_list[i]);
                }
                tmp_value_list.sort(function(a,b){return b-a;});

                return {seq:tmp_seq,rest:tmp_value_list};
            }else{
                //尝试向下取
                tmp_seq =[];
                tmp_seq.push(begin);
                tmp_value_list = value_list.slice();
                var offset = 0;
                var vir_begin = 0;
                while(tmp_value_list.indexOf(vir_begin +offset) !=-1){
                    tmp_seq.push(vir_begin +offset);
                    tmp_value_list.splice(tmp_value_list.indexOf(vir_begin +offset),1);
                    offset +=1;
                }
                //不满足条件不能取
                if(tmp_seq.length !=3 && tmp_seq.length !=5 && tmp_seq.length !=8 && tmp_seq.length !=10 && tmp_seq.length !=13){
                    if(tmp_seq.length >10){
                            //只能取长度10
                            var remove_list =[];
                            for(var i=tmp_seq.length-1;i>9;--i){
                                remove_list.push(tmp_seq[i]);
                            }

                            for(var i=0;i<remove_list.length;++i){
                                tmp_seq.splice(tmp_seq.indexOf(remove_list[i]),1)
                                tmp_value_list.push(remove_list[i]);
                            }
                            tmp_value_list.sort(function(a,b){return b-a;});

                            return {seq:tmp_seq,rest:tmp_value_list};

                        }else if(tmp_seq.length >8){
                            //最多只能取8
                            var remove_list =[];
                            for(var i=tmp_seq.length-1;i>7;--i){
                                remove_list.push(tmp_seq[i]);
                            }

                            for(var i=0;i<remove_list.length;++i){
                                tmp_seq.splice(tmp_seq.indexOf(remove_list[i]),1)
                                tmp_value_list.push(remove_list[i]);
                            }
                            tmp_value_list.sort(function(a,b){return b-a;});

                            return {seq:tmp_seq,rest:tmp_value_list};
                        }else if(tmp_seq.length >5){
                            //只能取5个
                            var remove_list =[];
                            for(var i=tmp_seq.length-1;i>4;--i){
                                remove_list.push(tmp_seq[i]);
                            }

                            for(var i=0;i<remove_list.length;++i){
                                tmp_seq.splice(tmp_seq.indexOf(remove_list[i]),1)
                                tmp_value_list.push(remove_list[i]);
                            }
                            tmp_value_list.sort(function(a,b){return b-a;});

                            return {seq:tmp_seq,rest:tmp_value_list};
                        }else if(tmp_seq.length >3){
                            //只能取3个
                            var remove_list =[];
                            for(var i=tmp_seq.length-1;i>2;--i){
                                remove_list.push(tmp_seq[i]);
                            }

                            for(var i=0;i<remove_list.length;++i){
                                tmp_seq.splice(tmp_seq.indexOf(remove_list[i]),1)
                                tmp_value_list.push(remove_list[i]);
                            }
                            tmp_value_list.sort(function(a,b){return b-a;});

                            return {seq:tmp_seq,rest:tmp_value_list};
                        }else{
                            //只能取当前这个
                            //只能包含那一元素
                            tmp_seq =[];
                            tmp_seq.push(begin);
                            return {seq:tmp_seq,rest:value_list};
                        }
                }
                return {seq:tmp_seq,rest:tmp_value_list};
            }

        }else{
            return {seq:tmp_seq,rest:tmp_value_list};
        }
    }else{
        var offset =1;
        while(tmp_value_list.indexOf(begin -offset) != -1){
            tmp_seq.push(begin -offset);
            tmp_value_list.splice(tmp_value_list.indexOf(begin -offset),1);
            offset +=1;
        }

        if(tmp_seq.length !=3 && tmp_seq.length !=5 && tmp_seq.length !=8 && tmp_seq.length !=10 && tmp_seq.length !=13){
            if(tmp_seq.length >10){
                //只能取长度10
                var remove_list =[];
                for(var i=tmp_seq.length-1;i>9;--i){
                    remove_list.push(tmp_seq[i]);
                }

                for(var i=0;i<remove_list.length;++i){
                    tmp_seq.splice(tmp_seq.indexOf(remove_list[i]),1)
                    tmp_value_list.push(remove_list[i]);
                }
                tmp_value_list.sort(function(a,b){return b-a;});

                return {seq:tmp_seq,rest:tmp_value_list};

            }else if(tmp_seq.length >8){
                //最多只能取8
                var remove_list =[];
                for(var i=tmp_seq.length-1;i>7;--i){
                    remove_list.push(tmp_seq[i]);
                }

                for(var i=0;i<remove_list.length;++i){
                    tmp_seq.splice(tmp_seq.indexOf(remove_list[i]),1)
                    tmp_value_list.push(remove_list[i]);
                }
                tmp_value_list.sort(function(a,b){return b-a;});

                return {seq:tmp_seq,rest:tmp_value_list};
            }else if(tmp_seq.length >5){
                //只能取5个
                var remove_list =[];
                for(var i=tmp_seq.length-1;i>4;--i){
                    remove_list.push(tmp_seq[i]);
                }

                for(var i=0;i<remove_list.length;++i){
                    tmp_seq.splice(tmp_seq.indexOf(remove_list[i]),1)
                    tmp_value_list.push(remove_list[i]);
                }
                tmp_value_list.sort(function(a,b){return b-a;});

                return {seq:tmp_seq,rest:tmp_value_list};
            }else if(tmp_seq.length >3){
                //只能取3个
                var remove_list =[];
                for(var i=tmp_seq.length-1;i>2;--i){
                    remove_list.push(tmp_seq[i]);
                }

                for(var i=0;i<remove_list.length;++i){
                    tmp_seq.splice(tmp_seq.indexOf(remove_list[i]),1)
                    tmp_value_list.push(remove_list[i]);
                }
                tmp_value_list.sort(function(a,b){return b-a;});

                return {seq:tmp_seq,rest:tmp_value_list};
            }else{
                //只能包含那一元素
                tmp_seq =[];
                tmp_seq.push(begin);
                return {seq:tmp_seq,rest:value_list};
            }
        }
        return {seq:tmp_seq,rest:tmp_value_list};
    }
}

var holds1 =[3,5,8,13,9,4,1,48,40,33,51,44,37];
var holds2 =[26,21,35,29,38,17,25,31,32,20,12,16,23];

var holds3 =[22,25,32,19,28,18,24,47,6,30,26,23,38]

var holds4 =[0,4,8,12,16,20,24,28,32,36,40,44,48];


// check_out_type_three_seq(holds4);


function find_same_seq(begin,cards){
    var tmp =[];
    tmp.push(begin);
    //A特殊处理
    if(poker_utils.get_poker_value(begin) == 12){
        var next = begin-4;
        while(cards.indexOf(next) !=-1){
            tmp.push(next);
            cards.splice(cards.indexOf(next),1);
            next -=4;
        }
        if(tmp.length != 3 && tmp.length !=5 && tmp.length !=8 && tmp.length !=10 && tmp.length !=13){
            if(tmp.length >10){
                //最多只能取10个
                var remove =tmp.splice(10,tmp.length-10);
                cards =cards.concat(remove);
                cards.sort(function(a,b){return b-a;});
            }else if(tmp.length >8){
                var remove =tmp.splice(8,tmp.length-8);
                cards=cards.concat(remove);
                cards.sort(function(a,b){return b-a;});  
            }else if(tmp.length >5){
                var remove =tmp.splice(5,tmp.length-5);
                cards=cards.concat(remove);
                cards.sort(function(a,b){return b-a;});    
            }else if(tmp.length >3){
                var remove =tmp.splice(3,tmp.length-3);
                cards= cards.concat(remove);
                cards.sort(function(a,b){return b-a;});    
            }else{
                //尝试倒序取
                tmp.splice(tmp.indexOf(begin),1);
                cards= cards.concat(tmp);
                cards.sort(function(a,b){return b-a;});
                tmp =[];
                tmp.push(begin)
                var next = begin %4;
                while(cards.indexOf(next) !=-1){
                    tmp.push(next);
                    cards.splice(cards.indexOf(next),1);
                    next +=4;
                }

                if(tmp.length != 3 && tmp.length !=5 && tmp.length !=8 && tmp.length !=10 && tmp.length !=13){
                    if(tmp.length >10){
                        //最多只能取10个
                        var remove =tmp.splice(10,tmp.length-10);
                        cards =cards.concat(remove);
                        cards.sort(function(a,b){return b-a;});
                    }else if(tmp.length >8){
                        var remove =tmp.splice(8,tmp.length-8);
                        cards=cards.concat(remove);
                        cards.sort(function(a,b){return b-a;});  
                    }else if(tmp.length >5){
                        var remove =tmp.splice(5,tmp.length-5);
                        cards=cards.concat(remove);
                        cards.sort(function(a,b){return b-a;});    
                    }else if(tmp.length >3){
                        var remove =tmp.splice(3,tmp.length-3);
                        cards= cards.concat(remove);
                        cards.sort(function(a,b){return b-a;});    
                    }else{
                        //只能取当前这个
                        var remove =tmp.splice(1,tmp.length-1);
                        cards=cards.concat(remove);
                        cards.sort(function(a,b){return b-a;}); 
                    }
                    return {same_seq:tmp,cards:cards};
                }else{
                    return {same_seq:tmp,cards:cards};
                }
            }
        }else{
            return {same_seq:tmp,cards:cards};
        }
    }else{
        var next = begin -4;
        while(cards.indexOf(next) !=-1){
            tmp.push(next);
            cards.splice(cards.indexOf(next),1);
            next -=4;
        }
        if(tmp.length != 3 && tmp.length !=5 && tmp.length !=8 && tmp.length !=10 && tmp.length !=13){
            if(tmp.length >10){
                //最多只能取10个
                var remove =tmp.splice(10,tmp.length-10);
                cards =cards.concat(remove);
                cards.sort(function(a,b){return b-a;});
            }else if(tmp.length >8){
                var remove =tmp.splice(8,tmp.length-8);
                cards=cards.concat(remove);
                cards.sort(function(a,b){return b-a;});  
            }else if(tmp.length >5){
                var remove =tmp.splice(5,tmp.length-5);
                cards=cards.concat(remove);
                cards.sort(function(a,b){return b-a;});    
            }else if(tmp.length >3){
                var remove =tmp.splice(3,tmp.length-3);
                cards= cards.concat(remove);
                cards.sort(function(a,b){return b-a;});    
            }else{
                //只能取当前这个
                var remove =tmp.splice(1,tmp.length-1);
                cards=cards.concat(remove);
                cards.sort(function(a,b){return b-a;}); 
            }
            return {same_seq:tmp,cards:cards};
        }else{
            return {same_seq:tmp,cards:cards};
        }
    }

}

function check_out_type_3same_seq(holds){
    
    var cards = holds.slice();
    cards.sort(function(a,b){return b-a;});

    console.log(cards)

    var begin = cards[0];
    cards.splice(0,1);

    var tmp_same_seq1 = null;
    var tmp_same_seq2 = null;
    var tmp_same_seq3 = null;

    tmp_same_seq1 =find_same_seq(begin,cards);
    cards = tmp_same_seq1.cards;

    if(cards.length >=3){
        begin = cards[0];
        cards.splice(0,1);
        tmp_same_seq2 = find_same_seq(begin,cards);
        cards = tmp_same_seq2.cards;
    }

    if(cards.length >=3){
        begin = cards[0];
        cards.splice(0,1);
        tmp_same_seq3 = find_same_seq(begin,cards);
        cards = tmp_same_seq3.cards
    }
    // console.log("1=======>",tmp_same_seq1)
    // console.log("2=======>",tmp_same_seq2)
    // console.log("3=======>",tmp_same_seq3)
    if(cards.length == 0){
        return true;
    }
    return false;
}

var holds5 =[24,20,28,9,13,1,5,49,32,40,36,48,44];

check_out_type_3same_seq(holds5);

// check_out_type_three_seq(holds5)