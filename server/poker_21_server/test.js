/**
 * logic test
 * **/
const assert = require('assert');
var poker_utils = require("./poker_utils");
var global = require('./global_setting').global;

/*
0,1,2,3      A 0
4,5,6,7      2 1
8,9,10,11    3 2
12,13,14,15  4 3
16,17,18,19  5 4
20,21,22,23  6 5
24,25,26,27  7 6
28,29,30,31  8 7
32,33,34,35  9 8
36,37,38,39  10 9
40,41,42,43  J  10
44,45,46,47  Q  11
48,49,50,51  K  12
*/
// var card1 = [0,1,2,3,4] //A,A,A,A,2
// var type1 = poker_utils.check_card_type(card1);
// console.log('type 5 value 16',type1);

// var card1 = [48,49,0] //K,K,A
// var type2 = poker_utils.check_card_type(card1);

// console.log('type 3 value 21',type1);

// var card1 =[48,1]; //K,A
// var type3 = poker_utils.check_card_type(card1);
// console.log('type 4 value 21',type1);

// var card1 =[48,16,36]; //K,5,10
// var type4 = poker_utils.check_card_type(card1);
// console.log('type 1 value 25',type1);

// //5个
// var aa =poker_utils.compare(type1,type1);
// console.log("null",aa);
// var aa =poker_utils.compare(type1,type2);
// console.log("true",aa);
// var aa =poker_utils.compare(type1,type3);
// console.log("true",aa);
// var aa =poker_utils.compare(type1,type4);
// console.log("true",aa);
// //21点
// var aa =poker_utils.compare(type2,type1);
// console.log("false",aa);
// var aa =poker_utils.compare(type2,type2);
// console.log("null",aa);
// var aa =poker_utils.compare(type2,type3);
// console.log("false",aa);
// var aa =poker_utils.compare(type2,type4);
// console.log("true",aa);
// //黑杰克
// var aa =poker_utils.compare(type3,type1);
// console.log("false",aa);
// var aa =poker_utils.compare(type3,type2);
// console.log("true",aa);
// var aa =poker_utils.compare(type3,type3);
// console.log("null",aa);
// var aa =poker_utils.compare(type3,type4);
// console.log("true",aa);
// //爆
// var aa =poker_utils.compare(type4,type1);
// console.log("false",aa);
// var aa =poker_utils.compare(type4,type2);
// console.log("false",aa);
// var aa =poker_utils.compare(type4,type3);
// console.log("false",aa);
// var aa =poker_utils.compare(type4,type4);
// console.log("null",aa);



// var card =[41,44,43]
// var t =poker_utils.check_card_type(card)
// console.log(t);