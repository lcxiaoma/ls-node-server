/**
 * 统计的键值
 */

exports.statistic_key ={

    /////////////////全局统计///////////////////////
    //累加
    WIN_COUNTS:1,     //赢的总次数
    JOIN_COUNTS:2,    //参与游戏的总次数


    //最大
    MAX_WIN_SCORE:3,    //最大赢取的分数
    MAX_LOSE_SCORE:4,   //最大输的分数

    //最小


    SHARE_COUNTS:50,     //分享次数
    CALL_JOIN_COUNTS:51, //邀请加入的玩家总数

    //////////////////分类统计////////////////////////
    ////跑得快100////
    RUNNING_JOIN_COUNT:100,     //参与次数
    RUNNING_WIN_COUNT:101,      //赢的次数

    RUNNING_WIN_MAX_SCORE:102,  //赢的最大分数
    RUNNING_LOSE_MAX_SCORE:103, //输的最大分数

    ////斗地主200////
    LANDLORD_JOIN_COUNT:200,    //参与次数
    LANDLORD_WIN_COUNT:201,     //赢的次数

    LANDLORD_WIN_MAX_SCORE:202, //赢的最大分数
    LANDLORD_LOSE_MAX_SCORE:203,//输的最大分数

    LANDLORD_LANDLORD_COUNT:250,//当地主的次数
    ////牛牛300//////
    OX_JOIN_COUNT:300,           //参与次数
    OX_WIN_COUNT:301,            //赢的次数

    OX_WIN_MAX_SCORE:302,         //赢的最大分数
    OX_LOSE_MAX_SCORE:303,        //输的最大分数

    OX_MAX_CARD:399,              //最大手牌

    ////炸金花400///////
    GF_JOIN_COUNT:400,           //参与次数
    GF_WIN_COUNT:401,            //赢的次数

    GF_WIN_MAX_SCORE:402,         //赢的最大分数
    GF_LOSE_MAX_SCORE:403,        //输的最大分数

    GF_MAX_CARD:499,              //金花最大手牌
    ////德州扑克500/////
    TAXAS_JOIN_COUNT:500,           //参与次数
    TAXAS_WIN_COUNT:501,            //赢的次数

    TAXAS_WIN_MAX_SCORE:502,         //赢的最大分数
    TAXAS_LOSE_MAX_SCORE:503,        //输的最大分数

    TAXAS_MAX_CARD:599,              //德州最大手牌

    ////跑胡子600///////

    ////21点700/////////
    P21_JOIN_COUNT:700,           //参与次数
    P21_WIN_COUNT:701,            //赢的次数

    P21_WIN_MAX_SCORE:702,         //赢的最大分数
    P21_LOSE_MAX_SCORE:703,        //输的最大分数

    P21_MAX_CARD:799,              //21点最大手牌
    ////三公800/////////
    SANGONG_JOIN_COUNT:800,           //参与次数
    SANGONG_WIN_COUNT:801,            //赢的次数

    SANGONG_WIN_MAX_SCORE:802,         //赢的最大分数
    SANGONG_LOSE_MAX_SCORE:803,        //输的最大分数

    SANGONG_MAX_CARD:899,              //三公最大手牌
    ////十三水900///////
    SHISS_JOIN_COUNT:900,           //参与次数
    SHISS_WIN_COUNT:901,            //赢的次数

    SHISS_WIN_MAX_SCORE:902,         //赢的最大分数
    SHISS_LOSE_MAX_SCORE:903,        //输的最大分数

    SHISS_MAX_CARD:999,              //十三水最大手牌
    ////三打哈1000//////
    SDH_JOIN_COUNT:1000,           //参与次数
    SDH_WIN_COUNT:1001,            //赢的次数

    SDH_WIN_MAX_SCORE:1002,         //赢的最大分数
    SDH_LOSE_MAX_SCORE:1003,        //输的最大分数

    ////10点半1100//////
    P105_JOIN_COUNT:1100,           //参与次数
    P105_WIN_COUNT:1101,            //赢的次数

    P105_WIN_MAX_SCORE:1102,         //赢的最大分数
    P105_LOSE_MAX_SCORE:1103,        //输的最大分数

    P105_MAX_CARD:1199,              //10点半最大手牌
}