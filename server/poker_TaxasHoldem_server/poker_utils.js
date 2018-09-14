/**
 * poker工具
 * **/
//获取poker值
//0-12 王牌13

var global = require('./global_setting').global;

//德州扑克是52张牌，不包含王牌
//A可以和2,3,4,5组成连子
//A也可以  10,J,Q,K组成连子
//2开始   A结束
exports.get_poker_value= function(poker){
    return Math.floor(poker/4)+1;
}

//获取poker花色
//0 方块 1梅花 2红桃 3黑桃
exports.get_poker_color= function(poker){
    return poker % 4;
}


//检测手牌类型
//{type,value,max_color}
exports.check_card_type = function(private_card,public_card){
    var card_type ={
        type:0,
        max_value:0,
        next_value:0,
        max_color:0,
        card_value:[]
    }
    //权位
    var mask_right =0;
    var result_right =0;

    var tmp_card =[];
    for(var i=0;i<5;i++){
        if(private_card[i] >=0){
            tmp_card.push(private_card[i]);
        }
        if(public_card[i] >=0){
            tmp_card.push(public_card[i]);
        }
    }
    //tmp_card为临时的所有卡牌顺序
    tmp_card.sort(function(a,b){return b-a;});

    var len = tmp_card.length;


    var color_list =[];
    var value_list =[];

    //检测value 获取 对子 3个 4个 顺子
    var value_count_right =0;
    var value_count =0;
    var last_value = null;

    var has_A = false;

    var value_map ={};
    // console.log("-----------------------------------------------------")
    // console.log("show me tmp card====>",tmp_card)
    for(var i=0;i<len;++i){
        var value = exports.get_poker_value(tmp_card[i]);
        var color = exports.get_poker_color(tmp_card[i]);
        color_list.push(color);
        value_list.push(value);
        if(value == global.TAXAS_POKER_A_VALUE){
            has_A = true;
        }
        if(!value_map[value]){
            value_map[value] = 1;
        }else{
            value_map[value] +=1;
        }
        if(last_value == null){
            last_value = value;
            value_count =1;
        }else if(last_value != value){
            if(!(value_count_right &(0x01<<value_count))){
                value_count_right += 0x01 <<value_count
            }
            last_value = value;
            value_count =1;
        }else{
            value_count +=1;
        }
    }
    //console.log("show me last value count---->",value_count)
    if(!(value_count_right &(0x01<<value_count))){
        value_count_right += 0x01 <<value_count;
    }

    if(value_count_right &(0x01<<2)){
        mask_right += 0x01 <<global.TAXAS_TYPE_DOUBLE;
    }
    if(value_count_right &(0x01<<3)){
        mask_right += 0x01 <<global.TAXAS_TYPE_THREE;       
    }
    if(value_count_right &(0x01<<4)){
        mask_right += 0X01 <<global.TAXAS_TYPE_FOUR;
    }
    // console.log("show me value map===========>",value_map)
    // console.log("show me value list===========>",value_list)
    // console.log("show me color list===========>",color_list)
    // console.log("show me value count right---->",value_count_right)
    //4个
    if(mask_right & (0x01<<global.TAXAS_TYPE_FOUR)){
        card_type.type = global.TAXAS_TYPE_FOUR;
        //找出最大的4个
        for(var a in value_map){
            var tmp_value = value_map[a];
            if(tmp_value ==4){
                card_type.max_value = Number(a);
                break;
            } 
        }
        card_type.color =0;
        card_type.card_value =card_type.max_value;
        return card_type;
    }
    //葫芦
    var three_counts =0;
    for(var a in value_map){
        var tmp_value = value_map[a];
        if(tmp_value ==3){
            three_counts +=1;
        }
    }
    if((mask_right &(0x01<<global.TAXAS_TYPE_THREE)) &&(mask_right &(0x01<<global.TAXAS_TYPE_DOUBLE)) || three_counts >=2){
        card_type.type = global.TAXAS_TYPE_THREED;
        //找出最大的3个对子
        var three_value =0;
        var double_value =0;
        if(three_counts <2){
            for(var a in value_map){
                var tmp_value = value_map[a];
                if(tmp_value ==3){
                    if(a -three_value >0){
                        three_value =Number(a);
                    }
                }
                if(tmp_value ==2){
                    if(a-double_value >0){
                        double_value = Number(a);
                    }
                }
            }
        }else{
            for(var a in value_map){
                var tmp_value = value_map[a];
                if(tmp_value ==3){
                    if(a -three_value >0){
                        three_value =Number(a);
                    }
                }
            }
            for(var a in value_map){
                var tmp_value = value_map[a];
                if(tmp_value >=2 && (a -three_value) !=0){
                    if(a-double_value >0){
                        double_value = Number(a);
                    }
                }
            }
        }
        card_type.max_value = three_value;
        card_type.next_value = double_value;
        card_type.max_color =0;
        card_type.card_value =[three_value,double_value];
        return card_type;
    }
    //检测color 获取同花
    var max_color_count =0;
    var color_count =0;
    var last_color = null;
    var max_color = null;
    //color必须要排序才可以用
    var tmp_color=[];
    for(var i=0;i<len;++i){
        tmp_color.push(color_list[i]);
    }
    tmp_color.sort(function(a,b){return a-b;});
    for(var i=0;i<len;++i){
        if(last_color == null){
            last_color =tmp_color[i];
            color_count =1;
        }else if(last_color != tmp_color[i]){
            if(color_count >max_color_count){
                max_color_count = color_count;
                max_color = last_color;
            }
            last_color = tmp_color[i];
            color_count =1;
        }else{
            color_count +=1;
        }
    }
    if(color_count >max_color_count){
        max_color_count = color_count;
        max_color = last_color;
    }

    if(max_color_count >=5){
        mask_right +=0x01 <<global.TAXAS_TYPE_SAME_COLOR;
    }
    //console.log("show me max color count & max color--->",max_color_count,max_color)
    //此处以上已经检测到的内容
    //对子，3个，4个，同花
    //排斥内容
    //有同花就不会有  4个， 葫芦  同花以下的都不需要判断
    if(mask_right & (0x01 <<global.TAXAS_TYPE_SAME_COLOR)){
        //此处只需要判断同花顺，皇家同花顺
        //选出所有同花
        var same_color_value =[];
        for(var i=0;i<len;++i){
            if(color_list[i] == max_color){
                same_color_value.push(value_list[i]);
            }
        }
        // console.log("show me has A---------->",has_A)
       
        //选出same_color_value中最大的5个连子
        var fseq  =pick_out_max_fseq(same_color_value,has_A);
        //console.log("show me same_color_value---->",same_color_value)

        if(fseq!= null){
            if(has_A && fseq.indexOf(13) == -1){
                card_type.type = global.TAXAS_TYPE_KING_SAME_COLOR_SEQ;
            }else{
                card_type.type = global.TAXAS_TYPE_SAME_COLOR_SEQ;
            }
            card_type.max_value = fseq[0];
            card_type.max_color =0;
            card_type.card_value = fseq;
        }else{
            card_type.type = global.TAXAS_TYPE_SAME_COLOR;
            card_type.max_value =same_color_value[0];
            card_type.max_color =0;
            card_type.card_value =same_color_value;
        }
        return card_type;
    }
    //顺子
    var tmp_seq_value_list =[];
    for(var i=0;i<len;++i){
        tmp_seq_value_list[i] = value_list[i];
    }
    // console.log("value lust --->",value_list)
    // console.log(" has A-----------------------------<",has_A)
    // console.log(tmp_seq_value_list)
    var seq_list = pick_out_max_fseq(tmp_seq_value_list,has_A);
    // console.log(seq_list);
    if(seq_list){
        card_type.type = global.TAXAS_TYPE_SEQ;
        card_type.max_value = seq_list[0];
        card_type.max_color =0;
        card_type.card_value = seq_list;
        return card_type;
    }


    //对子 两对
    if(mask_right &(0x01<<global.TAXAS_TYPE_DOUBLE)){
        var double_count =0;
        var max_double =0;
        for(var a in value_map){
            var tmp_value = value_map[a];
            if(tmp_value == 2){
                double_count +=1;
                if(a-max_double>0){
                    max_double = Number(a);
                }
            }
        }
        if(double_count >=2){
            card_type.type = global.TAXAS_TYPE_2DOUBLE;
        }else{
            card_type.type = global.TAXAS_TYPE_DOUBLE;
        }

        var next_double =0;
        if(double_count >=2){
            for(var a in value_map){
                var tmp_value = value_map[a];
                if(tmp_value == 2){
                    if(a != max_double){
                        if(a >next_double){
                            next_double = Number(a);
                        }
                    }
                }
            }
        }
        card_type.max_value = max_double;
        card_type.next_value = next_double;
        card_type.max_color =0;
        card_type.card_value = value_list;
        return card_type;
    }
    //3个
    if(mask_right &(0x01<<global.TAXAS_TYPE_THREE)){
        var three_value =0;
        for(var a in value_map){
            var tmp_value = value_map[a];
            if(tmp_value ==3){
                three_value = Number(a);
                break;
            }
        }
        card_type.type = global.TAXAS_TYPE_THREE;
        card_type.max_value = three_value;
        card_type.max_color =0;
        card_type.card_value = value_list;
        return card_type;
    }
    //高牌
    card_type.type = global.TAXAS_TYPE_NONE;
    card_type.max_value = value_list[0];
    card_type.max_color =0;
    card_type.card_value = value_list;

    return card_type;
}

//找出5个连续的
//如果没有返回null
function  pick_out_max_fseq(same_color_value,has_A){
    var step =0;
    var begin =null;
    if(has_A){
        same_color_value.push(0);
    }
    same_color_value.sort(function(a,b){return b-a;})
    for(var i=0;i<same_color_value.length;++i){
        if(begin == null){
            begin = same_color_value[i];
            step =1;
        }else if(begin == (same_color_value[i] +step)){
            step += 1;
            if(step == 5){
                break;
            }
        }else{
            begin = same_color_value[i];
            step =1;
        }
    }

    if(step ==5){
        var tmp =[];
        for(var i=0;i<step;++i){
            tmp.push(begin-i);
        }
        return tmp;
    }
    return null;
}

exports.pick_out_max_fseq = function(same_color_value,has_A){
    return pick_out_max_fseq(same_color_value,has_A);
}


//比较大小
//true card_type1大
//false card_type1小
//null 两个相等
exports.compare = function(card_type1,card_type2){
    if(card_type1.type != card_type2.type){
        return card_type1.type >card_type2.type;
    }
    //card_type 相等
    if(card_type1.max_value != card_type2.max_value){
        return card_type1.max_value > card_type2.max_value;
    }

    if(card_type1.next_value != card_type2.next_value){
        return card_type1.next_value >card_type2.next_value;
    }
    //card_type  和max_value都相等
    for(var i=0;i<5;++i){
        var v1 = card_type1.card_value[i];
        var v2 = card_type2.card_value[i];
        if(v1 > v2){
            return true;
        }else if(v1 <v2){
            return false;
        }
    }
    return null;
}