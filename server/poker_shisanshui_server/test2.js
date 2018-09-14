var pokerUtils = require('./poker_utils')
var global = require('./global_setting').global;

// function new_score_obj() {
//     var score_obj = {
//         out: {
//             type: 0,
//             score: 0
//         },
//         stage: [],
//         extro_score: 0,
//     };
//     score_obj.stage.push({ type: 0, score: 0 })
//     score_obj.stage.push({ type: 0, score: 0 })
//     score_obj.stage.push({ type: 0, score: 0 })
//     return score_obj;
// }

// function get_compare_obj(banker_card_type,folds){
//     var data ={
//         out_type:banker_card_type.out_type,
//         stage:[],
//     }

//     for(var i=0;i<folds.length;++i){
//         var tmp ={
//             type:banker_card_type.stage[i],
//             card_data:folds[i],
//         }
//         data.stage.push(tmp);
//     }
//     return data;
// }

// var game ={
//     button:0,
//     game_seats:[
//         {
//             seat_index:0,
//             user_id:10001,
//             group:{
//                 out_type:global.OUT_TYPE_NONE,
//                 stage:[global.SHISSHUI_TYPE_DOUBLE,global.SHISSHUI_TYPE_2DOUBLE,global.SHISSHUI_TYPE_2DOUBLE],
//             },
//             folds:[[45,31,29],[0,1,6,7,15],[32,35,38,24,36]],
//         },{
//             seat_index:1,
//             user_id:10002,
//             group:{
//                 out_type:global.OUT_TYPE_NONE,
//                 stage:[global.SHISSHUI_TYPE_NONE,global.SHISSHUI_TYPE_THREE,global.SHISSHUI_TYPE_HULU],
//             },
//             folds:[[37,34,44],[41,42,40,18,8],[12,13,14,4,5]],
//         }
//     ]
// }

// function game_end(game,force) {
//     var score = {};//最终分数
//     var card_type_list = {};//牌型列表
//     //分数计算
//     // score ={out:{type:0,score:0},[stage:{type,score}],extro_score:0}
//     if (!force) {
//         //不是强制结算才会计分
//         var banker_index = game.button;//庄家
//         var banker_seat_data = game.game_seats[banker_index];
//         var banker_card_type = banker_seat_data.group;
//         var banker_folds = banker_seat_data.folds;
//         var banker_score_obj = new_score_obj();
//         var data_banker = get_compare_obj(banker_card_type,banker_folds);//用于比较大小的对象

//         card_type_list[banker_index] = banker_card_type;
//         score[banker_index] = banker_score_obj;
//         banker_score_obj.out.type  = data_banker.out_type;

//         //初始化stage type
//         for(var i=0;i<data_banker.stage.length;++i){
//             banker_score_obj.stage[i].type = data_banker.stage[i].type;
//         }

//         var len = game.game_seats.length;
//         for (var i = 0; i < len; ++i) {
//             if (i != banker_index) {
//                 var user_seat_data = game.game_seats[i];
//                 if (user_seat_data && user_seat_data.user_id > 0) {
//                     var user_card_type = user_seat_data.group;
//                     var user_folds = user_seat_data.folds;
//                     var user_score_obj = new_score_obj();
//                     var data_user = get_compare_obj(user_card_type,user_folds);
//                     score[i] = user_score_obj;
//                     card_type_list[i] = user_card_type;
//                     user_score_obj.out.type = data_user.out_type;

//                     var need_stage_compare = true;
//                     //先比大的牌型
//                     if (banker_card_type.out_type == user_card_type.out_type && banker_card_type.out_type == global.OUT_TYPE_NONE) {
//                         //外类型相同
//                         console.log(" out type none ---->")
//                     } else {
//                         var out_r = pokerUtils.compare_out_type(data_banker, data_user);

//                         if (out_r == true) {
//                             //banker win
//                             console.log("out type banker win.")
//                             var times = pokerUtils.get_out_times(banker_card_type.out.type);
//                             banker_score_obj.out.score += times;
//                             user_score_obj.out.score -= times;

//                             need_stage_compare = false;
//                         }
//                         if (out_r == false) {
//                             //user win
//                             console.log("out type user win.")
//                             var times = pokerUtils.get_out_times(user_score_obj.out.type)
//                             banker_score_obj.out.score -= times;
//                             user_score_obj.out.score += times;

//                             need_stage_compare = false;
//                         }
//                         if(out_r == null){
//                             //一样大
//                             console.log("out type same.")
//                         }
//                     }
//                     console.log("banker ===>",JSON.stringify(data_banker,null,2));
//                     console.log("user   ===>",JSON.stringify(data_user,null,2))
//                     if(need_stage_compare){
//                         //比较具体的没墩
//                         for(var i=0;i<data_banker.stage.length;++i){
//                             var stage_r =pokerUtils.compare_stage(data_banker.stage[i],data_user.stage[i]);
//                             user_score_obj.stage[i].type = data_user.stage[i].type;

//                             if(stage_r == true){
//                                 console.warn("stage compare banker win.")
//                                 var times =pokerUtils.get_stage_time(data_banker.stage[i].type,i);
//                                 banker_score_obj.stage[i].score += times;
//                                 user_score_obj.stage[i].score -= times;                            
//                             }
//                             if(stage_r == false){
//                                 console.warn("stage compare user win.")
//                                 var times = pokerUtils.get_stage_time(data_user.stage[i].type,i); 
//                                 banker_score_obj.stage[i].score -= times;
//                                 user_score_obj.stage[i].score += times; 
//                             }
//                             if(stage_r == null){
//                                 console.warn("stage compare equal.")
//                             }
//                         }
//                     }
//                 }
//             } else {
//                 //庄家统计信息
//             }
//         }
//     }
//     //打印出具体的分数对象
//     console.log(JSON.stringify(score,null,2));
// }

// game_end(game,false);

// var data = {"out_type":1,"stage":[{"type":1,"card_data":[33,21,16]},{"type":3,"card_data":[3,0,7,4,10]},{"type":5,"card_data":[43,37,35,28,25]}]}

// var data2 = {"out_type":1,"stage":[{"type":1,"card_data":[30,15,2]},{"type":5,"card_data":[49,45,42,37,35]},{"type":7,"card_data":[11,9,8,18,16]}]}

// pokerUtils.check_stage_type(data2.stage);


var data ={"out_type":1,"stage":[{"type":2,"card_data":[30,26,25]},{"type":2,"card_data":[39,38,11,7,1]},{"type":6,"card_data":[48,44,20,12,8]}]}

console.log(pokerUtils.check_stage_type(data.stage,true))