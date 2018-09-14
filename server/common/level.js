/**
 * 升级信息
 */

var exp_config ={
    //跑得快
    20001:{
        win:2,
        lose:1,
        banker:0,
        lucky:1,
    },
    //斗地主
    20002:{
        win:2,
        lose:1,
        banker:1,
        lucky:1,
    },
    //牛牛
    20003:{
        win:2,
        lose:1,
        banker:1,
        lucky:1,
    },
    //炸金花
    20004:{
        win:2,
        lose:1,
        banker:0,
        lucky:1,
    },
    //德州扑克
    20005:{
        win:1,
        lose:1,
        banker:0,
        lucky:1,
    },
    //跑胡子
    20006:{
        win:2,
        lose:1,
        banker:0,
        lucky:1,
    },
    //21点
    20007:{
        win:2,
        lose:1,
        banker:1,
        lucky:1,
    },
    //三公
    20008:{
        win:2,
        lose:1,
        banker:0,
        lucky:1,
    },
    //十三水
    20009:{
        win:2,
        lose:1,
        banker:1,
        lucky:1,
    },
    //三达哈
    20010:{
        win:2,
        lose:1,
        banker:1,
        lucky:1,
    },
    //10点半
    20011:{
        win:2,
        lose:1,
        banker:1,
        lucky:1,
    },
    //默认配置
    'default':{
        win:1,
        lose:1,
        banker:0,
        lucky:1,
    }
}

function get_level_up_exp(level){
    return Math.floor(level*level *1000 +1000 + Math.pow(Math.log(level),3)*5000*level*level);
}

/**
 * 获取游戏过程的经验值和幸运值
 */
exports.get_exp_lucky = function(server_type,banker,win){
    var cnf =exp_config[server_type];
    if(!cnf){
        cnf = exp_config['default'];
    }
    var info ={
        exp:0,
        lucky:0,
    };
    if(win){
        info.exp +=cnf.win;
    }else{
        info.exp +=cnf.lose;
    }
    if(banker){
        info.exp +=cnf.banker;
    }
    info.lucky = cnf.lucky;

    return info;
}
//添加经验，返回当前的等级和经验
exports.add_exp = function(level,exp,add_exp){
    var info ={
        level:level,
        exp:exp,
    }
    var need_exp = get_level_up_exp(level);
    var now_exp = exp +add_exp;
    if(now_exp > need_exp){
        info.level +=1;
        info.exp = now_exp -need_exp;
    }else{
        info.exp += add_exp;
    }
    return info;
}