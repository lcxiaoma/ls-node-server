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
function get_ox_value(value){
    if(value >9) return 10
    return value +1;
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

    var flower =0;//花牌
    var ten =false; //是否包含10
    var same_count =0;//相同的数目
    var last_value = null;//上一个值
    var card_value =[];//值列表
    var is_four = false; //炸弹
    var is_three = false; //3个
    var max_value = null; //最大值

    var total_value =0; //用于计算五小牛
    var small = true; //五小牛

    for(var i=0;i<len;++i){
        var value = exports.get_poker_value(card_list[i]);
        card_value.push(value);
        //用于判断五小牛
        if((value+1) >=5){
            small = false;
        }
        total_value += value+1;
        if(value >9){
            //花牌
            flower +=1;
        }else if(value ==9){
            //10
            ten = true;
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
    if(same_count ==4){
        is_four = true;
        max_value = last_value;
    }
    if(same_count ==3){
        is_three = true;
        max_value = last_value
    }
    //console.log(same_count,small)
    //五小牛
    if(small &&total_value <=10){
        card_type.type = global.OX_SMALL;
        card_type.card_value = card_value;
        card_type.max_color = exports.get_poker_color(card_list[0]);
        return card_type;
    }

    //炸弹牛
    if(is_four){
        card_type.type = global.OX_BOOM;
        card_type.max_value = max_value;
        return card_type;
    }
    //金花牛
    if(flower ==5){
        card_type.type = global.OX_GOLD;
        card_type.card_value = card_value;
        card_type.max_color = exports.get_poker_color(card_list[0]);
        return card_type;
    }
    //银花牛
    if(flower ==4){
        if(ten){
            //银花牛
            card_type.type = global.OX_SILVER;
            card_type.card_value = card_value;
            card_type.max_color = exports.get_poker_color(card_list[0])
            return card_type;
        }
    }
    

    //牛牛及牛N
    var val_ox =[]
    for(var i=0;i<5;++i){
        val_ox.push(get_ox_value(card_value[i]));
    }
    var ox =0;
    for(var i=0;i<3;++i){
        for(var j=i+1;j<4;++j){
            for(var k=j+1;k<5;++k){
                var tmp = (val_ox[i]+val_ox[j]+val_ox[k])%10;
                if(tmp ==0){
                    var v =0;
                    for(var l=0;l<5;++l){
                        if(l!=i && l!=j && l!=k){
                            v += val_ox[l]
                        }
                    }
                    v = v%10;
                    if(v ==0){
                        //牛牛
                        card_type.type =global.OX_DOUBLE;
                        card_type.card_value = card_value;
                        card_type.max_color = exports.get_poker_color(card_list[0]);
                        return card_type;
                    }else if(ox <v){
                        //牛N
                        ox = v;
                    }
                }
            }
        }
    }
    if(ox !=0){
        card_type.type = global.OX_ONE;
        card_type.max_value = ox;
    }else{
        card_type.type = global.OX_NONE;
    }
    card_type.card_value = card_value;
    card_type.max_color = exports.get_poker_color(card_list[0]);
    return card_type;
}

//比较大小
//true card_type1大
//false card_type1小
exports.compare = function(card_type1,card_type2){
    if(card_type1.type != card_type2.type){
        return card_type1.type >card_type2.type;
    }
    if(card_type1.type == global.OX_BOOM){
        return card_type1.value >card_type2.value;
    }
    //card_type 相等
    if(card_type1.max_value != card_type2.max_value){
        return card_type1.max_value > card_type2.max_value;
    }
    return card_type1.max_color >card_type2.max_color;
    // //card_type  和max_value都相等
    // for(var i=0;i<card_type1.card_value.length;++i){
    //     var v1 = card_type1.card_value[i];
    //     var v2 = card_type2.card_value[i];
    //     if(v1 > v2){
    //         return true;
    //     }else if(v1 <v2){
    //         return false;
    //     }
    // }
}

//获取倍率
exports.get_times = function(card_type){
    if(card_type.type ==global.OX_NONE){
        return global.OX_NONE_VALUE;
    }
    if(card_type.type ==global.OX_ONE){
        if(card_type.max_value ==8){
            return global.OX_ONE_BASE_VALUE+1;
        }
        else if(card_type.max_value ==9){
            return global.OX_ONE_BASE_VALUE +2;
        }
        return global.OX_ONE_BASE_VALUE;
    }
    if(card_type.type ==global.OX_DOUBLE){
        return global.OX_DOUBLE_VALUE;
    }
    if(card_type.type ==global.OX_SILVER){
        return global.OX_SILVER_VALUE;
    }
    if(card_type.type ==global.OX_GOLD){
        return global.OX_GOLD_VALUE;
    }
    if(card_type.type ==global.OX_BOOM){
        return global.OX_BOOM_VALUE;
    }
    if(card_type.type ==global.OX_SMALL){
        return global.OX_SMALL_VALUE;
    }
}