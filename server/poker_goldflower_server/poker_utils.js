/**
 * poker工具
 * **/
//获取poker值
//0-12 王牌13

var global = require('./global_setting').global;

//金花的牌是2开始  A结束
exports.get_poker_value= function(poker){
    return Math.floor(poker/4);
}

//获取poker花色
//0 方块 1梅花 2红桃 3黑桃
exports.get_poker_color= function(poker){
    return poker % 4;
}


//检测手牌类型
//{type,value,max_color}
exports.check_card_type = function(card_list){
    var card_type ={
        type:0,
        max_value:0,
        max_color:0,
        card_value:[]
    }
    //倒序
    card_list.sort(function(a,b) {return b-a;});
    //优先检测特殊的类型
    var len = card_list.length;
    if(len !=3) return;

    var three=0;
    var last_value =null;
    var same_value_count =0;
    var last_color =null;
    var same_color_count =0;
    var card_value =[];

    var gold_flower =false;//是否是金花
    var double =false;//对子
    var double_value =0;
    var three = false;//三个头
    var three_value =0;

    for(var i=0;i<len;++i){
        var value = exports.get_poker_value(card_list[i]);
        var color = exports.get_poker_color(card_list[i]);
        card_value.push(value);

        if(last_color == null){
            last_color = color;
            same_color_count =1;
        }else if(last_color != color){
            last_color = color;
            same_color_count =1;
        }else{
            same_color_count +=1;
        }
        if(last_value == null){
            last_value = value;
            same_value_count =1;
        }else if(last_value !=value){
            last_value = value;
            same_value_count =1;
        }else{
            same_value_count +=1;
        }

        if(same_color_count ==3){
            gold_flower = true;
        }
        if(same_value_count ==2){
            double = true;
            double_value = value;
        }
        if(same_value_count ==3){
            three = true;
            three_value = value
        }
    }
    //先检测特殊的牌
    if(three){
        card_type.type =global.GOLD_THREE;
        card_type.max_value = three_value;
        return card_type;
    }
    if(double){
        card_type.type =global.GOLD_DOUBLE;
        card_type.max_value = double_value;
        card_type.max_color = exports.get_poker_color(card_list[0]);
        card_type.card_value = card_value;
        return card_type;
    }
    //再检测基础牌
    if(card_value[0] == card_value[1]+1 && card_value[1] == card_value[2]+1){
        if(gold_flower){
            card_type.type = global.GOLD_SEQ_FLOWER;
        }else{
            card_type.type = global.GOLD_SEQ;
        }
        card_type.max_color = exports.get_poker_color(card_list[0]);
        card_type.card_value = card_value;
        return card_type;
    }

    if(gold_flower){
        card_type.type = global.GOLD_FLOWER;
    }else{
        card_type.type = global.GLOD_NONE;
    }
    card_type.max_color = exports.get_poker_color(card_list[0]);
    card_type.max_value = exports.get_poker_value(card_list[0]);
    card_type.card_value = card_value;
    
    return card_type;
}

//比较大小
//true card_type1大
//false card_type1小
exports.compare = function(card_type1,card_type2){
    if(card_type1.type != card_type2.type){
        return card_type1.type >card_type2.type;
    }
    //card_type 相等
    if(card_type1.max_value != card_type2.max_value){
        return card_type1.max_value > card_type2.max_value;
    }
    //card_type  和max_value都相等
    for(var i=0;i<card_type1.card_value.length;++i){
        var v1 = card_type1.card_value[i];
        var v2 = card_type2.card_value[i];
        if(v1 > v2){
            return true;
        }else if(v1 <v2){
            return false;
        }
    }
    return card_type1.max_color >card_type2.max_color;
}