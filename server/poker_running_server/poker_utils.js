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
//检测卡牌是否合法
exports.check_card = function(base_card,out_card){
    for(var a=0;a<out_card.length;++a){
        if(base_card.indexOf(out_card[a])==-1){
            return false;
        }
    }
    return true;
}

//获取卡牌数据
function get_value_list(card_list,keep_king){
    if(keep_king != true){keep_king = false;};
    //keep_king 保留王
    var val_list =[];
    for(var a=0;a<card_list.length;++a){
        var card_value = exports.get_poker_value(card_list[a])
        if(card_value == global.KING_VALUE && keep_king){
            val_list.push(card_list[a])
        }else{
            val_list.push(card_value);
        }
    }
    val_list.sort(function(a,b){return a-b;});
    return val_list;
}

//获取颜色列表
function get_color_list(card_list){
    var color_list = [];
    for(var a=0;a<card_list.length;++a){
        color_list.push(exports.get_poker_color(card_list[a]));
    }
    //color_list.sort(function(a,b){return a-b;});
    return color_list;
}
//检测卡牌是否是顺序的
//特殊顺序A 2
//2 不能包含在顺序中 2的值为12
//王不能包含在顺序中 王的值为13
function check_sequ(value_list){
    var len = value_list.length;
    for(var i=0;i<len-1;++i){
        if(value_list[i]==12 || value_list[i]==13 ||value_list[i+1] ==12 ||value_list[i+1] ==13){
            return false;
        }
        if(value_list[i] != value_list[i+1]-1){
            return false;
        }
    }
    return true;
}

//检测是否是连对
function check_more_double(value_list){
    var len = value_list.length;
    var tmp =[];
    for(var i=0;i<len;){
        if(value_list[i] != value_list[i+1]){
            return false;
        }
        tmp.push(value_list[i]);
        i+=2;
    }
    return check_sequ(tmp);
}

//检测3个 并返回3个的value
function check_three_value(value_list){
    var find = false;
    var three_list =[];
    for(var a=0;a<value_list.length;++a){
        var count =0;
        for(var b=a+1; b<value_list.length;++b){
            if(value_list[a] ==value_list[b]){
                count ++;
            }
        }
        if(count >=2){
            three_list.push(value_list[a])
        }
    }
    three_list.sort(function(a,b){return b-a;});
    return three_list;
}

//检测指定长度的连续3个
function check_more_three_value(value_list,len){
    var three_value =[]
    for(var a=0;a<value_list.length;++a){
        var count =0;
        for(var b=a+1;b<value_list.length;++b){
            if(value_list[a] == value_list[b]){
                count ++;
            }
        }
        if(count >=2){
            if(three_value.indexOf(value_list[a]) ==-1){
                three_value.push(value_list[a]);
            }
        }
    }
    three_value.sort(function(a,b){return a-b;});
    if(three_value.length > len){
        var tmp_seq =[]
        for(var i=0;i<three_value.length -len+1;++i){
            var tmp=[]
            for(var j=0;j<len;++j){
                tmp.push(three_value[i+j]);
            }
            if(check_sequ(tmp)){
                tmp_seq.push(tmp);
            }
        }
        if(tmp_seq.length!=0){
            return tmp_seq[tmp_seq.length-1]
        }
        return [];
    }else if(three_value.length == len){
        return check_sequ(three_value)?three_value:[];
    }
    return [];
}

//检测是否有炸弹并返回炸弹值
//两副牌的时候炸弹可能大于等于4
//todo如何处理大于长度的情况
function check_has_boom(val_list,len){
    if(len == null) {len ==4;};
    var boom_value = {};
    for(var a=0;a<val_list.length;++a){
        var count =0;
        for(var b=a+1; b<val_list.length;++b){
            if(val_list[a] == val_list[b]){
                count ++;
            }
        }

        //4个王炸
        if(val_list[a] == global.KING_VALUE){
            if(count ==3){
                boom_value[val_list[a]] = count +1;
            }
        }
        //不是4个王的炸弹
        if(count >=(len-1)){
            var real_count =count +1;
            if(!boom_value[val_list[a]]){
                boom_value[val_list[a]]= real_count;
            }
            else if(boom_value[val_list[a]] <real_count){
                boom_value[val_list[a]]= real_count;
            }
        }

    }
    return boom_value;
}

//检测卡牌是否全部是相同的牌面值
//magic 是针对癞子玩法做的
function check_card_same(card_value,magic){
    if(magic == null) {magic =0;};
    var length = card_value.length;
    var value = card_value[0];
    for(var i=1;i<length;++i){
        //如果是癞子牌过
        if(magic!=0 && card_value[i] == magic){
            continue;
        }
        if(value != card_value[i]){
            return false;
        }
    }
    return true;
}

//检测牌颜色类别是否相同
function check_color_same(color_value){
    var length = color_value.length;
    var value = color_value[0];
    for(var i=0;i<length;++i){
        if(value != color_value[i]){
            return false;
        }
    }
    return true;
}

//检测牌类型是否正确
//都没确认王牌是能当成对子打或者炸弹打
exports.check_card_type = function(base_card_type,base_card,card_type,out_card,is_last){
    if(is_last != true){is_last = false;};
    var action = false;
    var base_value = get_value_list(base_card);
    var out_value = get_value_list(out_card);
    var out_color = get_color_list(out_card);

    //当base_card_type为0的时候，不需要检测前面的出牌
    console.log("base card type [%d],card type [%d]",base_card_type,card_type);
    console.log("---------->",base_value,out_value);

    //如果基础的类型是炸弹，而且炸弹是4个王，只能过
    if(base_card_type == global.BOOM){
        if(base_value[0] == global.KING_VALUE){
            if(card_type != global.PASS){
                return false;
            }
        }
    }
    console.log("------------------------------------------------->>>>>")

    if(base_card_type == card_type || base_card_type ==0){
        
        switch (card_type) {
            case global.PASS:
                action = out_value.length!=0?false:true;
                if(base_card_type==0){
                    action = false;
                } 
                return action;
                break;
            case global.SINGLE:
                action = out_value.length !=1?false:true;
                if(!action) return action;
                if(base_card_type !=0){
                    //如果是大小王的时候需要特殊判断一下
                    if(base_value[0] == global.KING_VALUE){
                        if(base_card[0] < out_card[0]) return true;
                        return false;
                    }
                    if(base_value[0] < out_value[0]) return true;
                    return false;
                }
                return true;
                break;
            case global.DOUBLE:
                action = out_value.length !=2?false:true;
                if(!action) return action;
                //如果对子是王，只能对小王 或者对大王
                if(out_value[0] == global.KING_VALUE){
                    //检测是否牌面值相等
                    if(out_card[0] != out_card[1]) return false;
                    //如果上一手不是过,检测当前值是否大于基础牌面值
                    if(base_card_type !=0){
                        if(out_card[0] <= base_card[0]) return false;
                    }
                }else{
                    //不是王的情况
                    if(out_value[0] != out_value[1]) return false;
                    if(base_card_type !=0){
                        if(out_value[0] <= base_value[0]) return false
                    }
                }
                return true;
                break;
            case global.MORE_DOUBLE:
                action = (out_value.length >=2*2 && out_value.length %2==0)?true:false;
                if(!action) return action;
                if(out_value.length !=base_value.length && base_card_type !=0) return false;
                //check type
                action = check_more_double(out_value);
                if(!action) return action;

                return (base_value[0] < out_value[0]||base_card_type ==0)?true:false;

                break;
            case global.SEQUNECE:
                action = out_value.length >=5?true:false;
                if(!action) return action;
                if(base_value.length != out_value.length && base_card_type !=0) return false;
                action =check_sequ(out_value);
                if(!action) return action;
                
                return (base_value[0] <out_value[0]||base_card_type ==0)?true:false;

                break;
            case global.THREE_PICK_TWO:
                if(is_last){
                    if(out_value.length <3 || out_value.length >5){
                        return false;
                    }
                }else{
                    action = out_value.length !=5?false:true;
                    if(!action) return action;
                }
                var out_t = check_three_value(out_value);
                if(out_t[0] == global.KING_VALUE) return false;
                console.log("check three pick 2 three value ----->",out_t)
                if(out_t.length == 0) return false;
                var base_t = check_three_value(base_value);
                return (base_t[0] < out_t[0]||base_card_type ==0) ?true:false;
                
                break;
            case global.MORE_THREE_PICK_TWO:
                action =(out_value.length> 5 && out_value.length%5==0)?true:false;
                if(!action) return action;
                //
                if(base_card_type !=0){
                    if(base_value.length != out_value.length) return false;
                    //后出牌需要检测是否合法，是否大于前面的牌
                    var fly_length = base_value.length /5;

                    var base_three_list =check_more_three_value(base_value,fly_length);
                    var out_three_list = check_more_three_value(out_value,fly_length);

                    console.log("base three list ========>",base_three_list)
                    console.log("out three list ========>",out_three_list)

                    if(base_three_list.length != out_three_list.length) return false;
                    if(base_three_list[0] < out_three_list[0]) return true;
                    return false;

                }else{
                    //首出牌，只需要检测出牌的内容是否合法
                    var fly_length = out_value.length/5;
                    var three_list =check_more_three_value(out_value,fly_length);
                    if(three_list.length == fly_length) return true;
                    return false;
                }

                break;
            case global.BOOM:
                action = (out_value.length <4)?false:true;
                if(!action) return action;
                //check card all are same
                action =check_card_same(out_value);
                if(!action) return action;
                console.log("show me action check the same......",action)
                if(out_value.length < base_value.length){
                    //如果out_value是4个王是可以出的
                    if(out_value[0] == global.KING_VALUE){
                        return true;
                    }
                    return false;
                }
                console.log("show me this time...............")
                //炸弹长度大于当前炸弹
                if(base_value[0] != global.KING_VALUE){
                    if(out_value.length > base_value.length) return true;
                }else{
                    return false;
                }
                //炸弹长度等于当前炸弹
                if((base_value[0]<out_value[0])||base_card_type ==0)return true
                return false;
                break;
            case global.SAME_SEQUNECE:
                //同花顺
                action = out_value.length >=5?true:false;
                if(!action) return action;
                if(base_value.length != out_value.length && base_card_type !=0) return false;
                action =check_sequ(out_value);
                if(!action) return action;
                action = check_color_same(out_color);
                if(!action) return action;

                return (base_value[0] <out_value[0]||base_card_type ==0)?true:false;
                break;
        }
    }else{
        if(card_type == global.PASS){
            return true;
        }else if(card_type == global.BOOM){
            //check BOOM
            if(out_card.length >=4){
                action = check_card_same(out_value);
                return (action == false)?false:true;
            }
            return false;
        }else{
            return false;
        }
    }
}
//////工具方法
//有必出返回false
//无必出返回true
function check_must_single(base_value,hold_value){
    /*
        如果是非王传入的是牌值
        否则传入牌面值
    **/
    for(var a=0;a<hold_value.length;++a){
        if(hold_value[a] > base_value[0]) return false;
    }
    return true;
}

function check_must_double(base_value,hold_value){
    /*
        如果是非王传入的是牌值
        否则传入牌面值
    **/
    if(hold_value.length<2) return true;
    var double_value =[]
    for(var a=0;a<hold_value.length;++a){
        for(var b=a+1; b<hold_value.length;++b){
            if(hold_value[a] == hold_value[b] && hold_value[a] != global.KING_VALUE){
                double_value.push(hold_value[a]);
            }
        }
    }

    for(var c=0;c<double_value.length;++c){
        if(double_value[c] > base_value[0]) return false;
    }
    return true;
}

//查看是否有begin开始长度为length的连子
function sequence(hold_value,begin,length){
    hold_value.sort(function(a,b){return a -b;});
    var need_list =[];
    for(var a=0;a<hold_value.length;++a){
        if(hold_value[a]>begin){
            need_list.push(hold_value[a]);
        }
    }
    if(need_list.length < length) return false;

    //查询剩余的牌是否能组成指定长度的连子
    for(var b=0; b<need_list.length-length+1;++b){
        var tmp =0;
        for(var c =need_list[b];c<need_list[b]+length;++c){
            if(need_list.indexOf(c) != -1){tmp++;};
        }
        if(tmp == length){
            return true;
        }
    }

    return false;
}

//must 为true  没有可出的
//must 为false  有必出的
function check_must_more_double(base_value,hold_value){
    if(hold_value.length<4 || hold_value.length <base_value.length) return true;

    var double_value =[]
    for(var a=0;a<hold_value.length;++a){
        for(var b=a+1; b<hold_value.length;++b){
            //检测连对的时候去掉王和2
            if(hold_value[a] == hold_value[b] && hold_value[a] >(global.KING_VALUE-1) &&double_value.indexOf(hold_value[a]) ==-1){
                double_value.push(hold_value[a]);
            }
        }
    }

    console.log("check must more double get double value =====>",double_value);

    if(double_value.length <2) return true;

    //check sequ
    return sequence(double_value,base_value[0],base_value.length/2)?false:true;
}

function check_must_sequence(base_value,hold_value){
    if(hold_value.length <5|| hold_value.length <base_value.length) return true;
    var single_value =[]
    //remove same value 2 King need remove
    for(var a=0;a<hold_value.length;++a){
        if(single_value.indexOf(hold_value[a]) ==-1){
            if(hold_value[a] <12){
                single_value.push(hold_value[a]);
            }
        }
    }

    //check length
    if(single_value.length <5 || single_value.length < base_value.length) return true;

    return sequence(single_value,base_value[0],base_value.length)?false:true;
}

function check_must_three_pick2(base_value,hold_value){

    if(hold_value.length<5) return true;

    var three_value =[];
    for(var a=0;a<hold_value.length;++a){
        if(three_value.indexOf(hold_value[a])!=-1) continue;
        var count =0;
        for(var b=a+1; b<hold_value.length;++b){
            if(hold_value[a] == hold_value[b]){
                count ++;
            }
        }
        //去掉3个王
        if(count >=2 && hold_value[a] < global.KING_VALUE){
            three_value.push(hold_value[a]);
        }
    }

    var base = check_three_value(base_value);
    
    console.log("check must three value base ",base,three_value)

    for(var c in three_value){
        if(three_value[c] >base[0]) return false;
    }

    return true;
}
//检测飞机
function check_must_more_three_pick2(base_value,hold_value){
    if(hold_value.length <5*2) return true
    
    var three_value =[];
    //基础的3个值数量
    var base_three_value = check_three_value(base_value)
    //基础的飞机长度
    var fly_length = base_value.length/5;

    //选出最大的飞机
    base_three_value.sort(function(a,b){return a-b;})
    var max_out = []
    if(base_three_value.length >fly_length){
        var temp_seq =[]
        for(var i=0;i<base_three_value.length -fly_length+1;++i){
            var tmp =[]
            for(var j=0;j<fly_length;++j){
                tmp.push(base_three_value[i+j]);
            }
            if(check_sequ(tmp)){
                temp_seq.push(tmp);
            }
        }
        max_out = tmp_sque[temp_seq.length -1];
        max_out.sort(function(a,b){return a-b;});
    }else{
        max_out = base_three_value;
    }

    for(var a=0;a<hold_value.length;++a){
        if(three_value.indexOf(hold_value[a])!=-1) continue;
        var count =0;
        for(var b=a+1; b<hold_value.length;++b){
            if(hold_value[a] == hold_value[b]){
                count ++;
            }
        }
        if(count >=2 && hold_value[a] >max_out[0]){
            three_value.push(hold_value[a]);
        }
    }
    console.log("show me base max out three value ===>",max_out);
    console.log("show me three value =============>",three_value);
    
    if(three_value.length <fly_length) return true;

    three_value.sort(function(a,b){return a -b;});

    for(var i =0;i<three_value.length -fly_length+1;++i){
        var tmp=[]
        for(var j=0;j<fly_length;++j){
            tmp.push(three_value[i+j]);
        }
        console.log("show me tmp seq ==================>",tmp);
        if(check_sequ(tmp)) return false;
    }
    return true;
}

//检测是否有大于的同花顺
function check_must_same_sequnece(base_value,holds){
    //取出color来判断每个color是否有这么长的连子
    var len = holds.length;
    var color_map ={0:[],1:[],2:[],3:[]}
    for(var i=0;i<len;++i){
        var color = exports.get_poker_color(holds[i]);
        var value = exports.get_poker_value(holds[i]);
        if(value <12){
            color_map[color].push(value);
        }
    }
    var has =0;
    for(var j=0;j<4;++j){
        if(!check_must_sequence(base_value,color_map[j])){
            has++;
        }
    }

    if(has!=0){
        return false
    }
    return true;

}

function check_must_boom(base_value,hold_value){

    if(hold_value.length <4) return true;

    var boom_value =[]
    for(var a=0;a<hold_value.length;++a){
        if(boom_value.indexOf(hold_value[a])!= -1) continue;
        var count =0;
        for(var b=a+1;b<hold_value.length;++b){
            if(hold_value[a] == hold_value[b]){
                count++;
            }
            if(count ==3){
                boom_value.push(hold_value[a]);
            }
        }
    }

    for(var c in boom_value){
        if(boom_value[c] > base_value[0]) return false;
    }
    return true;
}

//检测必出
exports.check_must = function(holds,now_card_type,now_card_data){
    if(now_card_type == global.PASS) return false;
    //return false 标识可以出此类型的牌
    var hold_value = get_value_list(holds);
    var base_value = get_value_list(now_card_data);


    console.log("check must base value",base_value)
    if(now_card_type == global.BOOM){
        //如果是炸弹，只检测炸弹
        //如果已经是王炸了就不在继续检测
        if(base_value[0] == global.KING_VALUE){
            return true;
        }
        //当有两副牌的时候，炸弹可以大于等于4
        var boom_len = now_card_data.length;
        var boom_value = check_has_boom(hold_value,boom_len);

        var find = false;
        //console.log("boom map ========>",boom_value)
        for(var a in boom_value){
            if(a - base_value[0]>0){
                find = true;
                break;
            }
            if(boom_value[a] -boom_len >0){
                find = true;
                break;
            }
            if((boom_value[a] - global.KING_VALUE) ==0){
                find = true;
                break;
            }
        }
        return find? false:true;
    }else{
        //先检测指定牌型
        var must = true;
        switch (now_card_type) {
            case global.SINGLE://单
                //如果前一手是王  直接比较王的牌面值
                if(base_value[0]== global.KING_VALUE){
                    must =check_must_single(now_card_data,holds);
                }else{
                    must =check_must_single(base_value,hold_value);
                }
                break;
            case global.DOUBLE://对子
                
                if(base_value[0] == global.KING_VALUE){
                    //如果基础牌是个王
                    var count =0;
                    for(var i=0;i<holds.length;++i){
                        if(holds[i] > now_card_data[0]){
                            count ++;
                        }
                    }
                    must = (count >= 2) ?false:true;
                    
                }else{
                    must = check_must_double(base_value,hold_value);
                    if(must){
                        //如果没最大的检测是否有王
                        var tmp_king_list =[]
                        for(var i=0;i<holds.length;++i){
                            var card_value = exports.get_poker_value(holds[i]);
                            if(card_value == global.KING_VALUE){
                                tmp_king_list.push(holds[i]);
                            }
                        }
                        console.log("all king list=====>",tmp_king_list)
                        //查找相同的王
                        var tmp_same_king =[]
                        for(var i=0;i<tmp_king_list.length-1;++i){
                            for(var j=i+1;j<tmp_king_list.length;++j){
                                if(tmp_king_list[i] == tmp_king_list[j]){
                                    if(tmp_same_king.indexOf(tmp_king_list[i]) == -1){
                                        tmp_same_king.push(tmp_king_list[i])
                                    }
                                }
                            }
                        }
                        console.log("double same king =====>",tmp_same_king)
                        must = (tmp_same_king.length !=0)?false:true;
                    }
                }
                break;
            case global.MORE_DOUBLE://连对
                must =check_must_more_double(base_value,hold_value);
                break;
            case global.SEQUNECE://连子
                must =check_must_sequence(base_value,hold_value);
                break;
            case global.THREE_PICK_TWO://三代
                must =check_must_three_pick2(base_value,hold_value);
                break;
            case global.MORE_THREE_PICK_TWO://飞机
                must = check_must_more_three_pick2(base_value,hold_value);
                break;
            case global.SAME_SEQUNECE://同花顺
                must = check_must_same_sequnece(base_value,holds);
        }
        //must 为true  没有可出的
        //must 为false  有必出的
        if(must){
            //检测炸弹
            console.log("must is true................")
            var boom_value = check_has_boom(hold_value);
            for(var a in boom_value){
                must = false;
                break;
            }
        }
        return must;
    }
}