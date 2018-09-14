/**
 * poker工具
 * **/
//获取poker值
//0-12 王牌13

var global = require('./global_setting').global;

exports.get_poker_value= function(poker){
    return Math.floor(poker/4);
}

//获取poker花色
//0 方块 1梅花 2红桃 3黑桃
exports.get_poker_color= function(poker){
    return poker % 4;
}


//获取计算牛的牌面值
function get_sangong_value(value){
    if(value >9) return 10
    return value +1;
}


//检测手牌类型
//{type,value,max_color}
exports.check_card_type = function(card_list){
    var card_type ={
        type:0,
        flower:0, //花色数量
        max_value:0,//牌最大值
        max_color:0,//最大的花色
        card_value:[]
    }
    //倒序
    card_list.sort(function(a,b) {return b-a;});
    //优先检测特殊的类型
    var len = card_list.length;

    var flower =0;//花牌
    var same_count =0;//相同的数目
    var last_value = null;//上一个值
    var card_value =[];//值列表
    var is_three = false; //3个相同，3公
    var max_value = null; //最大值

    for(var i=0;i<len;++i){
        var value = exports.get_poker_value(card_list[i]);
        card_value.push(value);
        if(value >9){
            //花牌
            flower +=1;
        }
        if(last_value == null){
            last_value =value;
            same_count =1;
        }else if(last_value != value){
            if(same_count ==4){
                is_four = true;
                max_value = last_value;
            }else if (same_count ==3){
                is_three = true;
                max_value = last_value;
            }
            last_value = value;
            same_count =1;
        }else{
            same_count +=1;
        }
    }

    card_type.flower = flower;
 
    if(same_count ==3){
        is_three = true;
        max_value = last_value
    }

    //大三公
    if(is_three&&flower==3){
        card_type.type = global.SANGONG_DA_SAN;
        card_type.max_value = max_value;
        return card_type;
    }

    //小三公
    if(is_three){
        card_type.type = global.SANGONG_XIAO_SAN;
        card_type.max_value = max_value;
        return card_type;
    }

    //混三公
    if(flower==3){
        card_type.type = global.SANGONG_HUN_SAN;
        card_type.max_value = exports.get_poker_value(card_list[0]);
        card_type.max_color = exports.get_poker_color(card_list[0]);
        card_type.card_value = card_value;
        return card_type;
    }

    //散点
    card_type.type = global.SANGONG_NONE;
    card_type.card_value = card_value;
    card_type.max_color = exports.get_poker_color(card_list[0]);
    card_type.max_value = get_point(card_value);
    card_type.card_value = card_value;
    return card_type;
}

//比较大小
//true card_type1大
//false card_type1小
exports.compare = function(card_type1,card_type2){
    //大类型
    if(card_type1.type != card_type2.type){
        return card_type1.type >card_type2.type;
    }
    //小三公和大三公
    if(card_type1.type == global.SANGONG_XIAO_SAN || card_type2.type == global.SANGONG_DA_SAN){
        return card_type1.max_value >card_type2.max_value;
    }
    //混三公
    if(card_type1.type == global.SANGONG_HUN_SAN){
        if(card_type1.max_value != card_type2.max_value){
            return card_type1.max_value > card_type2.max_value;
        }
        for(var i=0;i<card_type1.card_value.length;++i){
            if(card_type1.card_value[i] != card_type2.card_value[i]){
                return card_type1.card_value[i]>card_type2.card_value[i];
            }
        }
        return card_type1.max_color >card_type2.max_color;
    }
    //混三公
    if(card_type1.max_value != card_type2.max_value){
        return card_type1.max_value >card_type2.max_value;
    }
    if(card_type1.flower != card_type2.flower){
        return card_type1.flower > card_type2.flower;
    }
    //点数 和公牌输相等，先比每张大小
    for(var i=0;i<card_type1.card_value.length;++i){
        if(card_type1.card_value[i] != card_type2.card_value[i]){
            return card_type1.card_value[i]>card_type2.card_value[i];
        }
    }
    return  card_type1.max_color >card_type2.max_color;
}
//获得点数
function get_point(poker_value){
    var total = 0;
    for(var i=0;i<poker_value.length;i++){
        total+= get_sangong_value(poker_value[i]);//公牌统统算作10点
    }
    return total%10;
}

//获取倍率
exports.get_times = function(card_type){
    if(card_type.type ==global.SANGONG_NONE){
        var pt = get_point(card_type.card_value);
        if(pt ==8){
            return global.SANGONG_NONE_VALUE+1;
        }
        else if(pt ==9){
            return global.SANGONG_NONE_VALUE +2;
        }
        return global.SANGONG_NONE_VALUE;
    }
    if(card_type.type ==global.SANGONG_HUN_SAN){
        return global.SANGONG_HUN_SAN_VALUE;
    }
    if(card_type.type ==global.SANGONG_XIAO_SAN){
        return global.SANGONG_XIAO_SAN_VALUE;
    }
    if(card_type.type ==global.SANGONG_DA_SAN){
        return global.SANGONG_DA_SAN_VALUE;
    }
}