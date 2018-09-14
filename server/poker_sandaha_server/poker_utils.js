/**
 * poker工具
 * **/
var global = require('./global_setting').global;

//获取poker值
exports.get_poker_value= function(poker){
    return Math.floor(poker/4);
}

//获取poker花色
//0 方块 1梅花 2红桃 3黑桃
exports.get_poker_color= function(poker){
    return poker%4;
}

//检测卡牌是否合法
exports.check_card = function(base_card,out_card){
    var temp = base_card.slice();
    for(var a=0;a<out_card.length;++a){
        var index = temp.indexOf(out_card[a]);
        if(index==-1){
            return false;
        } else {
            temp.splice(index,1);
        }
    }
    return true;
}

//检查两组牌是否相同
exports.check_card_same = function(base_card_1,base_card_2){
    if(base_card_1.length != base_card_2.length){
        return false;
    }
    //将两组牌分别排序
    base_card_1.sort(function(a,b){return a-b;});
    base_card_2.sort(function(a,b){return a-b;});
    //开始比较
    var base_length = base_card_1.length;
    for(var i=0; i<base_length; ++i){
        if(base_card_1[i]!=base_card_2[i]){
            return false;
        }
    }
    return true;
}

//检查是否是单张
exports.check_single = function(card_value){
    var length = card_value.length;
    if(length != 1){
        return false;
    }
    return true;
}

//检查是否是对子
exports.check_double = function(card_value){
    var length = card_value.length;
    if(length!=2){
        return false;
    }
    return card_value[0]==card_value[1];
}

//检测是否是连对
exports.check_more_double = function(card_value, main_color){
    var len = card_value.length;
    if(len<4 || len%2!=0){
        return false;
    }
    //将card_value存入临时列表中，并排序.
    var temp_value = [];
    for(var i=0; i<len; ++i){
        temp_value.push(card_value[i]);
    }
    //升序排列, 按所属花色排序.
    temp_value.sort(function(a,b)
    {
        if(a==b){
            return a-b;
        } else {
            if(main_color==-1){
                return a-b;
            } else{
                var value_a = exports.get_poker_value(a);
                var value_b = exports.get_poker_value(b);
                if(value_a>8 && value_a<11 && value_a==value_b){
                    var color_a = exports.get_poker_color(a);
                    var color_b = exports.get_poker_color(b);
                    if(color_a == main_color){
                        return 1;
                    } else {
                        return -1;
                    }
                } else {
                    return a-b;
                }
            }
        }
    });
    var last_value = -1;
    var last_color = -1;
    for(var i=0;i<len;){
        if(temp_value[i] != temp_value[i+1]){
            return false;
        }
        var value = exports.get_poker_value(temp_value[i]);
        var color = exports.get_poker_color(temp_value[i]);
        if(last_value != -1 && last_color != -1){
            //7、2、King需特殊处理
            if(value <= 8){
                if(value != last_value+1 || color != last_color){
                    return false;
                }
            } else {
                if(last_value <= 7){
                    return false;
                } else if (last_value == 8){
                    if(value != last_value+1){
                        return false;
                    }
                    if(last_color != main_color){
                        return false;
                    }
                    if(last_color == color){
                        return false;
                    }
                } else {
                    //King单独处理
                    //如果是大王的话, 前面必须是小王
                    if(value == 11 && color == 1){
                        if(value != last_value){
                            return false;
                        }
                    }
                    //如果是小王的话， last_color要等于主花色
                    else if(value == 11 && color == 0){
                        if(value != last_value+1 || last_color != main_color){
                            return false;
                        }
                    } else {
                        //如果color等于主花色
                        if(color == main_color){
                            if(last_color == main_color || value != last_value){
                                return false;
                            }
                        } else {
                            if(last_color != main_color || value == last_value){
                                return false;
                            }
                        }
                    }
                }
            }
        }
        last_value = value;
        last_color = color;
        i+=2;
    }
    return true;
}

//检查牌数量是否一致
function check_card_same_num(base_card, out_card){
    var base_length = base_card.length;
    var out_length = out_card.length;
    return base_length == out_length;
}

//获得所属花色.
function get_belongs_color(card_value,main_color){
    var value = exports.get_poker_value(card_value);
    if(value == 9 || value == 10 || value == 11){
        return main_color;
    } else {
        return exports.get_poker_color(card_value);
    }
}

//获得所属花色牌列表
exports.get_belongs_color_card_list = function (card_value,belongs_color,main_color){
    var length = card_value.length;
    var card_list = [];
    for(var i=0; i<length; ++i){
        var color = get_belongs_color(card_value[i], main_color);
        if(color == belongs_color){
            card_list.push(card_value[i]);
        }
    }
    return card_list;
}

//检测第一轮次角色出牌是否正确
exports.check_first_type = function(card_type,out_card,main_color){
    switch(card_type){
        case global.SINGLE:
            return exports.check_single(out_card);
        case global.DOUBLE:
            return exports.check_double(out_card);
        case global.MORE_DOUBLE:
            return exports.check_more_double(out_card, main_color);
    }
    return false;
}

//检测牌类型是否正确
exports.check_card_type = function(holds,base_card_type,base_card,out_card_type,out_card,main_color){
    // console.log("-------check_card_type----------",holds, base_card_type, base_card, out_card_type, out_card, main_color);
    if(base_card_type == 0){
        if(out_card_type == global.SINGLE){
            return exports.check_single(out_card);
        }
        if(out_card_type == global.DOUBLE){
            return exports.check_double(out_card);
        }
        if(out_card_type == global.MORE_DOUBLE){
            return exports.check_more_double(out_card,main_color);
        }
        return false;
    } else {
        //检查牌数量是否一致
        if(!check_card_same_num(base_card,out_card)){
            return false;
        }

        var belongs_color = get_belongs_color(base_card[0], main_color);
        var hold_belongs_color_card_list = exports.get_belongs_color_card_list(holds, belongs_color, main_color);
        var out_belongs_color_card_list = exports.get_belongs_color_card_list(out_card, belongs_color, main_color);
        //如果出牌中包含其他不满足花色的牌，并且手牌中有足够满足花色的牌
        if(out_card.length > out_belongs_color_card_list.length && out_belongs_color_card_list.length < hold_belongs_color_card_list.length){
            return false;
        }
        //检查必出牌(如果包含满足条件的手牌但没出的话，返回false)
        var action = exports.check_must(hold_belongs_color_card_list, base_card_type, out_card, main_color);
        return action;
    }
}

//对子必出检测(如果包含对子，但是没出返回false)
exports.check_must_double = function(hold_value,out_card){
    var temp_list = exports.combination(hold_value,2);
    var double_card_list = [];
    for(var i=0; i<temp_list.length; ++i){
        if(exports.check_double(temp_list[i])){
            double_card_list.push(temp_list[i]);
        }
    }
    var list_length = double_card_list.length;
    var has = false;
    for(var i=0; i<list_length; ++i){
        if(exports.check_card_same(double_card_list[i], out_card)){
            has = true;
        }
    }
    //如果包含对子，但是没出返回false
    if(list_length>0 && !has){
        return false;
    }
    return true;
}

//连对必出检测(如果包含连对，但是没出返回false)--先检测连对，再检测对子.
exports.check_must_more_double = function(hold_value,out_card,main_color){
    var temp_list = exports.combination(hold_value,out_card.length);
    var more_double_card_list = [];
    for(var i=0; i<temp_list.length; ++i){
        if(exports.check_more_double(temp_list[i], main_color)){
            more_double_card_list.push(temp_list[i]);
        }
    }
    var list_length = more_double_card_list.length;
    var has = false;
    for(var i=0; i<list_length; ++i){
        if(exports.check_card_same(more_double_card_list[i], out_card)){
            has = true;
        }
    }
    //如果包含连对，但是没出返回false
    if(list_length>0 && !has){
        return false;
    }
    var temp_list = exports.combination(hold_value,2);
    var double_card_list = [];
    for(var i=0; i<temp_list.length; ++i){
        if(exports.check_double(temp_list[i])){
            double_card_list.push(temp_list[i]);
        }
    }
    var list_length = double_card_list.length;
    var temp_list = exports.combination(out_card,2);
    var out_double_card_list = [];
    for(var i=0; i<temp_list.length; ++i){
        if(exports.check_double(temp_list[i])){
            out_double_card_list.push(temp_list[i]);
        }
    }
    var out_list_length = out_double_card_list.length;
    //如果手牌有足够满足条件的对子，但是出牌未出那么多相应的对子。
    if(list_length>=out_card.length/2){
        if(out_list_length < out_card.length/2){
            return false;
        }
    } else {
        if(out_list_length < list_length){
            return false;
        }
    }
    var has_count = 0;
    for(var i=0; i<list_length; ++i){
        for(var j=0; j<out_list_length; ++j){
            if(exports.check_card_same(double_card_list[i], out_double_card_list[j])){
                has_count++;
            }
        }
    }
    //如果包含对子，但是没出返回false
    if(list_length>0 && has_count!=out_list_length){
        return false;
    }
    return true;
}

//组合
exports.combination = function(arr, size){
    var allResult = [];
    (function (arr, size, result) {
        var arrLen = arr.length;
        if (size > arrLen) {
            return;
        }
        if (size == arrLen) {
            allResult.push([].concat(result, arr))
        } else {
            for (var i = 0 ; i < arrLen; i++) {
                var newResult = [].concat(result);
                newResult.push(arr[i]);

                if (size == 1) {
                    allResult.push(newResult);
                } else {
                    var newArr = [].concat(arr);
                    newArr.splice(0, i + 1);
                    arguments.callee(newArr, size - 1, newResult);
                }
            }
        }
    })(arr, size, []);
    return allResult;
}

//检测必出牌是否就是out_card
exports.check_must = function(hold_value,base_card_type,out_card,main_color){
    if(base_card_type == global.SINGLE){
        return true;
    } else if(base_card_type == global.DOUBLE){
        return exports.check_must_double(hold_value,out_card);
    } else if(base_card_type == global.MORE_DOUBLE){
        return exports.check_must_more_double(hold_value,out_card,main_color);
    }
    return false;
}

//检查单张大小  1--1st大，-1--2nd大
function check_big_or_small_single(base_card_1,base_card_2,main_color) {
    //base_card_1必定是单张
    if(!exports.check_single(base_card_2)){
        return 1;
    }
    //判断是否相等.
    if(exports.check_card_same(base_card_1, base_card_2)){
        return 1;
    }
    var belongs_color_1 = get_belongs_color(base_card_1[0], main_color);
    var belongs_color_2 = get_belongs_color(base_card_2[0], main_color);
    //1st是主牌，2nd是副牌
    if(belongs_color_1 == main_color && belongs_color_2 != main_color){
        return 1;
    }
    //1st是副牌牌，2nd是主牌
    if(belongs_color_1 != main_color && belongs_color_2 == main_color){
        return -1;
    }
    //1st、2nd都是副牌
    if(belongs_color_1 != main_color && belongs_color_2 != main_color){
        if(belongs_color_1 == belongs_color_2){
            if(base_card_1[0] > base_card_2[0]){
                return 1;
            } else {
                return -1;
            }
        } else {
            return 1;
        }
    }
    //1st、2nd都是主牌
    if(belongs_color_1 == main_color && belongs_color_1 == belongs_color_2){
        var value_1 = exports.get_poker_value(base_card_1[0]);
        var value_2 = exports.get_poker_value(base_card_2[0]);
        if(value_1 > value_2){
            return 1;
        } else if(value_1 < value_2){
            return -1;
        } else {
            //King单独处理
            if(value_1 == 11){
                var color_1 = exports.get_poker_color(base_card_1[0]);
                var color_2 = exports.get_poker_color(base_card_2[0]);
                if(color_1>color_2){
                    return 1;
                } else {
                    return -1;
                }
            } else {
                if(main_color == -1){
                    return 1;
                } else {
                    var color_1 = exports.get_poker_color(base_card_1[0]);
                    var color_2 = exports.get_poker_color(base_card_2[0]);
                    if(color_2 == main_color){
                        return -1;
                    } else {
                        return 1;
                    }
                }
            }
        }
    }
}

//检查对子大小  1--1st大，-1--2nd大
function check_big_or_small_double(base_card_1,base_card_2,main_color) {
    //base_card_1必定是对子
    if(!exports.check_double(base_card_2)){
        return 1;
    }
    var belongs_color_1 = get_belongs_color(base_card_1[0], main_color);
    var belongs_color_2 = get_belongs_color(base_card_2[0], main_color);
    //1st是主牌，2nd是副牌
    if(belongs_color_1 == main_color && belongs_color_2 != main_color){
        return 1;
    }
    //1st是副牌牌，2nd是主牌
    if(belongs_color_1 != main_color && belongs_color_2 == main_color){
        return -1;
    }
    //1st、2nd都是副牌
    if(belongs_color_1 != main_color && belongs_color_2 != main_color){
        if(belongs_color_1 == belongs_color_2){
            if(base_card_1[0] > base_card_2[0]){
                return 1;
            } else {
                return -1;
            }
        } else {
            return 1;
        }
    }
    //1st、2nd都是主牌
    if(belongs_color_1 == main_color && belongs_color_1 == belongs_color_2){
        var value_1 = exports.get_poker_value(base_card_1[0]);
        var value_2 = exports.get_poker_value(base_card_2[0]);
        if(value_1 > value_2){
            return 1;
        } else if(value_1 < value_2){
            return -1;
        } else {
            //King单独处理
            if(value_1 == 11){
                var color_1 = exports.get_poker_color(base_card_1[0]);
                var color_2 = exports.get_poker_color(base_card_2[0]);
                if(color_1>color_2){
                    return 1;
                } else {
                    return -1;
                }
            } else {
                if(main_color == -1){
                    return 1;
                } else {
                    var color_1 = exports.get_poker_color(base_card_1[0]);
                    var color_2 = exports.get_poker_color(base_card_2[0]);
                    if(color_2 == main_color){
                        return -1;
                    } else {
                        return 1;
                    }
                }
            }
        }
    }
}

//检查连对大小  1--1st大，-1--2nd大
function check_big_or_small_more_double(base_card_1,base_card_2,main_color) {
    //base_card_1必定是连对
    if(!exports.check_more_double(base_card_2, main_color)){
        return 1;
    }
    var belongs_color_1 = get_belongs_color(base_card_1[0], main_color);
    var belongs_color_2 = get_belongs_color(base_card_2[0], main_color);
    //1st是主牌，2nd是副牌
    if(belongs_color_1 == main_color && belongs_color_2 != main_color){
        return 1;
    }
    //1st是副牌牌，2nd是主牌
    if(belongs_color_1 != main_color && belongs_color_2 == main_color){
        return -1;
    }
    base_card_1.sort(function(a,b){return a-b;});
    base_card_2.sort(function(a,b){return a-b;});
    //1st、2nd都是副牌
    if(belongs_color_1 != main_color && belongs_color_2 != main_color){
        if(belongs_color_1 == belongs_color_2){
            if(base_card_1[0] > base_card_2[0]){
                return 1;
            } else {
                return -1;
            }
        } else {
            return 1;
        }
    }
    //1st、2nd都是主牌
    if(belongs_color_1 == main_color && belongs_color_1 == belongs_color_2){
        var value_1 = exports.get_poker_value(base_card_1[0]);
        var value_2 = exports.get_poker_value(base_card_2[0]);
        if(value_1 > value_2){
            return 1;
        } else {
            return -1;
        }
    }
}


//检查大小(将4个玩家出的牌比大小, 返回出牌索引)
exports.check_big_or_small = function(base_card_type, base_card_list, main_color){
    //默认第一个最大.
    var length = base_card_list.length;
    var max_index = 0;
    for(var i=1; i<length; ++i){
        var res = 1;
        if(base_card_type == global.SINGLE){
            res = check_big_or_small_single(base_card_list[max_index], base_card_list[i], main_color);
        } else if(base_card_type == global.DOUBLE){
            res = check_big_or_small_double(base_card_list[max_index], base_card_list[i], main_color);
        } else if(base_card_type == global.MORE_DOUBLE){
            res = check_big_or_small_more_double(base_card_list[max_index], base_card_list[i], main_color);
        }
        if(res == 1){
            continue;
        } else {
            max_index = i;
        }
    }
    return max_index;
}

//获得分牌
exports.get_score_card = function(turn_card){
    var score_card = [];
    var length = turn_card.length;
    for(var i=0; i<length; ++i){
        var cards = turn_card[i];
        score_card = score_card.concat(exports.get_score_card_list(cards));
    }
    return score_card;
}

//获得分牌
exports.get_score_card_list = function(cards){
    var card_list = [];
    var length = cards.length;
    for(var i=0; i<length; ++i){
        var card_value = exports.get_poker_value(cards[i]);
        if(card_value == 0 || card_value == 4 || card_value == 7){
            card_list.push(cards[i]);
        }
    }
    return card_list;
}

//获得分值
exports.get_score_value = function(score_cards){
    var score = 0;
    var length = score_cards.length;
    for(var i=0; i<length; ++i){
        var card_value = exports.get_poker_value(score_cards[i]);
        if(card_value == 0){
            score += 5;
        }
        if(card_value == 4){
            score += 10;
        }
        if(card_value == 7){
            score += 10;
        }
    }
    return score;
}

//判断是否全是副牌
exports.check_card_no_main = function(cards,main_color){

}
