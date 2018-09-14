/**
 * poker工具
 * **/
//获取poker值
//0-12 王牌13

var global = require('./global_setting').global;

//常量
//8的最小值 用来判断全大全小
var EIGHT_MIN = 24;
var EIGHT_MAX = 27;
//J的最小值用于判断 12皇族
var J_MIN = 36;

var SPACILA_2_VALUE = 0;//2的牌面值
var SPACILA_K_VALUE = 11;//K值
var SPACILA_A_VALUE = 12;//A的特殊值
var SPACILA_A_BEGIN = 48;//A的起始值

exports.get_poker_value = function (poker) {
    return Math.floor(poker / 4);
}

//获取poker花色
//0 方块 1梅花 2红桃 3黑桃
exports.get_poker_color = function (poker) {
    return poker % 4;
}

function list_equal(l1, l2) {
    if (l1.length != l2.length) {
        return false;
    }
    var a = l1.slice();
    var b = l2.slice();
    a.sort(function (a1, a2) { return a1 - a2; });
    b.sort(function (a1, a2) { return a1 - a2; });

    for (var i = 0; i < l1.length; ++i) {
        if (a[i] != b[i]) {
            return false;
        }
    }
    return true;
}

exports.list_equal = function (l1, l2) {
    return list_equal(l1, l2);
}
//检测客户端发来的数据格式是否是合法格式
exports.check_data_format = function (data) {
    if (typeof data == 'string') {
        try {
            data = JSON.parse(data);
        } catch (error) {
            console.warn("data parse error.")
            return false;
        }
    }

    if (typeof data != 'object') {
        console.warn("data type error.")
        return false;
    }

    var out_type = Number(data.out_type);
    var stage = data.stage;

    if (!out_type || !stage) {
        console.warn("data out obj error.")
        return false;
    }

    if (typeof stage != 'object') {
        console.warn("stage type error.")
        return false;
    }

    if (stage.length != 3) {
        console.warn("stage length error.")
        return false;
    }
    for (var i = 0; i < stage.length; ++i) {
        var tmp = stage[i];
        if (typeof tmp != 'object') {
            console.warn("stage[i] type error.")
            return false;
        }
        if (!tmp.type || !tmp.card_data) {
            console.warn("stage[i] obj error.")
            return false;
        }
        if (typeof tmp.card_data != 'object') {
            console.warn("card_data type error.")
            return false;
        }
        if (i == 0) {
            if (tmp.card_data.length != 3) {
                console.warn("card_data[0] length error.")
                return false;
            }
        } else {
            if (tmp.card_data.length != 5) {
                console.warn("card_data[?] length error.")
                return false;
            }
        }
    }
    return true;
}
//检测所选的牌是否合法
//stage客户端传过来的三墩
exports.check_card_invalied = function (stage, holds) {
    var tmp_card = [];
    for (var i = 0; i < stage.length; ++i) {
        var st = stage[i];
        for (var j = 0; j < st.card_data.length; ++j) {
            tmp_card.push(st.card_data[j]);
        }
    }
    return list_equal(tmp_card.slice(), holds.slice());
}

/**
 * 检测没一墩的类型
 * 检测倒水的情况
 */
exports.check_stage_type = function (stage, check) {
    for (var i = 0; i < stage.length; ++i) {
        var st = stage[i];
        if (check_stage(st.type, st.card_data) == false) {
            console.warn(" stage %d failed.  type = %d ", i, st.type);
            return false;
        }
    }
    if (check) {
        var st1 = stage[0];
        var st2 = stage[1];
        var st3 = stage[2];

        var s1 = exports.compare_stage(st1, st2);
        var s2 = exports.compare_stage(st2, st3);
        // console.log("=====>",s1);
        // console.log("=====>",s2);

        if (!s1 && !s2) {
            return true;
        }
        return false;
    }
    return true;
}
/**
 * 检测内部每一墩牌的类型
 * @param {*} stage_type 
 * @param {*} card_data 
 */
function check_stage(stage_type, card_data) {
    switch (stage_type) {
        case global.SHISSHUI_TYPE_NONE:
            return true;
        case global.SHISSHUI_TYPE_DOUBLE:
            var card_count = get_card_count(card_data);
            if (card_count.double == 1) {
                return true;
            }
            return false;
        case global.SHISSHUI_TYPE_2DOUBLE:
            var card_count = get_card_count(card_data);
            if (card_count.double == 2) {
                return true;
            }
            return false;
        case global.SHISSHUI_TYPE_THREE:
            var card_count = get_card_count(card_data);
            if (card_count.three == 1) {
                return true;
            }
            return false;
        case global.SHISSHUI_TYPE_SEQ:
            return check_seq(card_data);
        case global.SHISSHUI_TYPE_SAME:
            return check_same(card_data);
        case global.SHISSHUI_TYPE_HULU:
            var card_count = get_card_count(card_data);
            if (card_count.three == 1 && card_count.double == 1) {
                return true;
            }
            return false;
        case global.SHISSHUI_TYPE_BOOM:
            var card_count = get_card_count(card_data);
            if (card_count.four == 1) {
                return true;
            }
            return false;
        case global.SHISSHUI_TYPE_SAME_SEQ:
            return check_same_seq(card_data);
        default:
            return false;;
    }
}

//检测外部类型
//大类型
exports.check_out_type = function (out_type, holds) {
    var out_card_type = Number(out_type);
    switch (out_card_type) {
        case global.OUT_TYPE_NONE:
            return check_out_type_none(holds);
        case global.OUT_TYPE_THREE_SAME:
            return check_out_type_three_same(holds);
        case global.OUT_TYPE_THREE_SEQ:
            return check_out_type_three_seq(holds);
        case global.OUT_TYPE_6DOUBLE:
            return check_out_type_6double(holds);
        case global.OUT_TYPE_5DOUBLE_THREE:
            return check_out_type_5double_three(olds);
        case global.OUT_TYPE_4THREE:
            return check_out_type_4three(holds);
        case global.OUT_TYPE_2HULU_THREE:
            return check_out_type_2hulu_three(holds);
        case global.OUT_TYPE_ALL_SAME:
            return check_out_type_all_same(holds);
        case global.OUT_TYPE_ALL_SMALL:
            return check_out_type_all_small(holds);
        case global.OUT_TYPE_ALL_BIG:
            return check_out_type_all_big(holds);
        case global.OUT_TYPE_3BOOM:
            return check_out_type_3boom(holds);
        case global.OUT_TYPE_3SAME_SEQ:
            return check_out_type_3same_seq(holds);
        case global.OUT_TYPE_12KING:
            return check_out_type_12king(holds);
        case global.OUT_TYPE_A_K:
            return check_out_type_a_k(holds);
        case global.OUT_TYPE_KINGKING:
            return check_out_type_kingking(holds);
        default:
            return false;
    }
}
//无类型
function check_out_type_none(holds) {
    return true;
}
//三同花
//modifed 20170616
//只需要判断花色满足355 就是3同花
function check_out_type_three_same(holds) {
    var color_map = {};
    for (var i = 0; i < holds.length; ++i) {
        var c = exports.get_poker_color(holds[i]);
        if (!color_map[c]) {
            color_map[c] = 1;
        } else {
            color_map[c] += 1;
        }
    }

    var three_color = false;
    var five_color1 = false;
    var five_color2 = false;

    for (var a in color_map) {
        if (color_map[a] == 3) {
            if (three_color == false) {
                three_color = true;
            }
        }
        if (color_map[a] == 5) {
            if (five_color1 == false) {
                five_color1 = true;
            } else {
                if (five_color2 == false) {
                    five_color2 = true;
                }
            }
        }
    }

    if (three_color && five_color1 && five_color2) {
        return true;
    }
    return false;
    // for (var i = 0; i < stage.length; ++i) {
    //     if (check_same(stage[i].card_data) == false) {
    //         return false;
    //     }
    // }
    // return true;
}
//三顺子
//只要满足 3 5 5的顺子 就算成3顺子
function check_out_type_three_seq(holds) {
    var value_list = [];
    for (var i = 0; i < holds.length; ++i) {
        value_list.push(poker_utils.get_poker_value(holds[i]));
    }

    value_list.sort(function (a, b) { return b - a; });
    //console.log("show me value list---------->",value_list)


    var tmp_seq_obj1 = null;
    var tmp_seq_obj2 = null;
    var tmp_seq_obj3 = null;

    var find_value_list = value_list.slice();
    var begin = find_value_list[0];
    find_value_list.splice(0, 1);

    tmp_seq_obj1 = find_seq(begin, find_value_list);
    find_value_list = tmp_seq_obj1.rest;

    if (find_value_list.length >= 3) {
        begin = find_value_list[0];
        find_value_list.splice(0, 1);
        tmp_seq_obj2 = find_seq(begin, find_value_list);
        find_value_list = tmp_seq_obj2.rest;
    }
    if (find_value_list.length >= 3) {
        begin = find_value_list[0];
        find_value_list.splice(0, 1);
        tmp_seq_obj3 = find_seq(begin, find_value_list);
        find_value_list = tmp_seq_obj3.rest;
    }
    // console.log("1===>",tmp_seq_obj1)
    // console.log("2===>",tmp_seq_obj2)
    // console.log("3===>",tmp_seq_obj3)
    if (find_value_list.length == 0) {
        return true;
    }
    return false;


    //以下判断不合法
    // for (var i = 0; i < stage.length; ++i) {
    //     if (check_seq(stage[i].card_data) == false) {
    //         return false;
    //     }
    // }
    // return true;
}
//6对半
function check_out_type_6double(holds) {
    var card_count = get_card_count(holds);
    if (card_count.double != 6) {
        return false;
    }
    return true;
}
//5对三条
function check_out_type_5double_three(holds) {
    var card_count = get_card_count(holds);
    if (card_count.double != 5 || card_count.three != 1) {
        return false;
    }
    return true;
}
//4套三条   4个三条
function check_out_type_4three(holds) {
    var card_count = get_card_count(holds);
    if (card_count.three != 4) {
        return false;
    }
    return true;
}
//双怪冲3   两对葫芦，一个三条
function check_out_type_2hulu_three(holds) {
    var card_count = get_card_count(holds);
    if (card_count.three == 3 && card_count.double == 2) {
        return true;
    }
    return false;
}
//凑一色    全是1个花色
function check_out_type_all_same(holds) {
    return check_same(holds);
}
//全小      全是2-8
function check_out_type_all_small(holds) {
    for (var i = 0; i < holds.length; ++i) {
        if (holds[i] >= EIGHT_MAX) {
            return false;
        }
    }
    return true;
}
//全大      全是8-A
function check_out_type_all_big(holds) {
    for (var i = 0; i < holds.length; ++i) {
        if (holds[i] <= EIGHT_MIN) {
            return false;
        }
    }
    return true;
}
//三分天下  三个炸弹余一张
function check_out_type_3boom(holds) {
    var card_count = get_card_count(holds);
    if (card_count.four == 3) {
        return true;
    }
    return false;
}
//三同花顺  三墩都是同花顺
//满足 355 同花顺 即可满足这个条件
function check_out_type_3same_seq(holds) {
    var cards = holds.slice();
    cards.sort(function (a, b) { return b - a; });

    console.log(cards)

    var begin = cards[0];
    cards.splice(0, 1);

    var tmp_same_seq1 = null;
    var tmp_same_seq2 = null;
    var tmp_same_seq3 = null;

    tmp_same_seq1 = find_same_seq(begin, cards);
    cards = tmp_same_seq1.cards;

    if (cards.length >= 3) {
        begin = cards[0];
        cards.splice(0, 1);
        tmp_same_seq2 = find_same_seq(begin, cards);
        cards = tmp_same_seq2.cards;
    }

    if (cards.length >= 3) {
        begin = cards[0];
        cards.splice(0, 1);
        tmp_same_seq3 = find_same_seq(begin, cards);
        cards = tmp_same_seq3.cards
    }
    // console.log("1=======>",tmp_same_seq1)
    // console.log("2=======>",tmp_same_seq2)
    // console.log("3=======>",tmp_same_seq3)
    if (cards.length == 0) {
        return true;
    }
    return false;
    // for (var i = 0; i < stage.length; ++i) {
    //     if (check_same_seq(stage.card_data) == false) {
    //         return false;
    //     }
    // }
    // return true;
}
//12皇族   全是J Q K A
function check_out_type_12king(holds) {
    var count = 0;
    for (var i = 0; i < holds.length; ++i) {
        if (holds[i] >= J_MIN) {
            count++;
        }
    }
    if (count == 12) {
        return true;
    }
    return false;
}
//一条龙    A,K齐全 不同花
function check_out_type_a_k(holds) {
    return check_seq(holds);

}
//至尊青龙  A,K 齐全 同花
function check_out_type_kingking(holds) {
    return check_same_seq(holds);
}

/**
 * 检测同花顺
 * @param {*} card_list
 * 特殊处理A
 */
function check_same_seq(card_list) {
    var tmp_card = card_list.slice();
    tmp_card.sort(function (a, b) { return a - b; });
    var card_value = [];
    var card_color = [];
    for (var i = 0; i < tmp_card.length; ++i) {
        card_value.push(exports.get_poker_value(tmp_card[i]));
        var color = exports.get_poker_color(tmp_card[i]);
        if (card_color.indexOf(color) == -1) {
            card_color.push(color);
        }
    }
    //对A特殊处理
    var has_A = false;
    if (card_value.indexOf(SPACILA_A_VALUE) != -1) {
        card_value.splice(card_value.indexOf(SPACILA_A_VALUE, 1));
        has_A = true;
    }

    var begin = card_value[0];
    var end = card_value[card_value.length - 1];
    for (var i = 1; i < card_value.length; ++i) {
        if (card_value[i] != (begin + i)) {
            return false;
        }
    }

    if (card_color.length != 1) {
        return false;
    }
    if (has_A) {
        if (begin == SPACILA_2_VALUE || end == SPACILA_K_VALUE) {
            return true;
        }
        return false;
    }
    return true;
}
/**
 * 检测同花
 * @param {*} card_list 
 */
function check_same(card_list) {
    var color = exports.get_poker_color(card_list[0]);
    for (var i = 1; i < card_list.length; ++i) {
        var c = exports.get_poker_color(card_list[i]);
        if (color != c) {
            return false;
        }
    }
    return true;
}
/**
 * 检测连子
 * @param {*} card_list 
 * 需要对A特殊处理
 */
function check_seq(card_list) {
    var tmp_card_list = card_list.slice();
    tmp_card_list.sort(function (a, b) { return a - b; });
    var card_value = []
    var card_color = [];
    for (var i = 0; i < tmp_card_list.length; ++i) {
        card_value.push(exports.get_poker_value(tmp_card_list[i]));
        var color = exports.get_poker_color(tmp_card_list[i]);
        if (card_color.indexOf(color) == -1) {
            card_color.push(color);
        }
    }

    var has_A = false;
    if (card_value.indexOf(SPACILA_A_VALUE) != -1) {
        card_value.splice(card_value.indexOf(SPACILA_A_VALUE), 1);
        has_A = true;
    }

    var begin = card_value[0];
    var end = card_value[card_value.length - 1];

    for (var i = 1; i < card_value.length; ++i) {
        if (card_value[i] != (begin + i)) {
            return false;
        }
    }

    if (card_color.length < 2) {
        console.warn("SQE MORE SAME SQE");
    }
    if (has_A) {
        if (begin == SPACILA_2_VALUE || end == SPACILA_K_VALUE) {
            return true;
        }
        return false;
    }
    return true;
}
/**
 * 获取同的牌的数量
 * @param {*} card_list 
 */
function get_card_count(card_list) {
    var card_count = {
        four: 0,
        three: 0,
        double: 0,
    }
    var tmp_card = card_list.slice();
    tmp_card.sort(function (a, b) { return b - a; })
    var card_value = [];
    for (var i = 0; i < tmp_card.length; ++i) {
        card_value.push(exports.get_poker_value(tmp_card[i]));
    }

    var last_value = null;
    var counts = 0;
    var four_count = 0;
    var three_count = 0;
    var double_count = 0;


    for (var i = 0; i < card_value.length; ++i) {
        if (last_value == null) {
            last_value = card_value[i];
            counts = 1;
        } else {
            if (last_value != card_value[i]) {
                if (counts == 4) {
                    four_count += 1;
                }
                if (counts == 3) {
                    three_count += 1;
                }
                if (counts == 2) {
                    double_count += 1;
                }
                last_value = card_value[i];
                counts = 1;
            } else {
                counts += 1;
            }
        }
    }

    if (counts == 4) {
        four_count += 1;
    }
    if (counts == 3) {
        three_count += 1;
    }
    if (counts == 2) {
        double_count += 1;
    }

    card_count.four = four_count;
    card_count.three = three_count;
    card_count.double = double_count;
    return card_count;
}
//比较大小
//true stage1大
//false stage1小
exports.compare_stage = function (stage1, stage2) {
    if (stage1.type != stage2.type) {
        return stage1.type > stage2.type;
    }
    //TYPE 相等比最大值 比花色
    switch (stage1.type) {
        case global.SHISSHUI_TYPE_NONE:
            return compare_stage_none(stage1.card_data, stage2.card_data)
        case global.SHISSHUI_TYPE_DOUBLE:
            return compare_stage_double(stage1.card_data, stage2.card_data)
        case global.SHISSHUI_TYPE_2DOUBLE:
            return compare_stage_2double(stage1.card_data, stage2.card_data)
        case global.SHISSHUI_TYPE_THREE:
            return compare_stage_three(stage1.card_data, stage2.card_data)
        case global.SHISSHUI_TYPE_SEQ:
            return compare_stage_seq(stage1.card_data, stage2.card_data)
        case global.SHISSHUI_TYPE_SAME:
            return compare_stage_same(stage1.card_data, stage2.card_data)
        case global.SHISSHUI_TYPE_HULU:
            return compare_stage_hulu(stage1.card_data, stage2.card_data)
        case global.SHISSHUI_TYPE_BOOM:
            return compare_stage_boom(stage1.card_data, stage2.card_data)
        case global.SHISSHUI_TYPE_SAME_SEQ:
            return compare_stage_same_seq(stage1.card_data, stage2.card_data)
        default:
            return null;
    }
}

//比较大类型
//true data1大
//false data2小
exports.compare_out_type = function (data1, data2) {
    if (data1.out_type != data2.out_type) {
        return data1.out_type > data2.out_type;
    }
    //如果相等，比大小，比花色
    switch (data1.out_type) {
        case global.OUT_TYPE_NONE:
            return compare_out_type_none(data1, data2);
        case global.OUT_TYPE_THREE_SAME:
            return compare_out_type_three_same(data1, data2);
        case global.OUT_TYPE_THREE_SEQ:
            return compare_out_type_three_seq(data1, data2);
        case global.OUT_TYPE_6DOUBLE:
            return compare_out_type_6double(data1, data2);
        case global.OUT_TYPE_5DOUBLE_THREE:
            return compare_out_type_5double_three(data1, data2);
        case global.OUT_TYPE_4THREE:
            return compare_out_type_4three(data1, data2);
        case global.OUT_TYPE_2HULU_THREE:
            return compare_out_type_2hulu_three(data1, data2);
        case global.OUT_TYPE_ALL_SAME:
            return compare_out_type_all_same(data1, data2);
        case global.OUT_TYPE_ALL_SMALL:
            return compare_out_type_all_small(data1, data2);
        case global.OUT_TYPE_ALL_BIG:
            return compare_out_type_all_big(data1, data2);
        case global.OUT_TYPE_3BOOM:
            return compare_out_type_3boom(data1, data2);
        case global.OUT_TYPE_3SAME_SEQ:
            return compare_out_type_3same_seq(data1, data2);
        case global.OUT_TYPE_12KING:
            return compare_out_type_12king(data1, data2);
        case global.OUT_TYPE_A_K:
            return compare_out_type_a_k(data1, data2);
        case global.OUT_TYPE_KINGKING:
            return compare_out_type_kingking(data1, data2);
        default:
            return null;;
    }
}

//////////////////////////比较墩大小9种///////////////////////////
//true   card_list1 大
//false  card_list2 大
//乌龙(3/5张牌)
function compare_stage_none(card_list1, card_list2) {
    return comapre_none_seq_same(card_list1, card_list2);
}
//对子(3/5张牌)
function compare_stage_double(card_list1, card_list2) {
    return compare_double_to_four(card_list1, card_list2, 2);
}
//两对(5张牌)
function compare_stage_2double(card_list1, card_list2) {
    //获取对子
    var cards1 = card_list1.slice();
    var cards2 = card_list2.slice();

    var single1 = null;
    var last_value1 = null;
    var counts1 = 0;
    var single2 = null;
    var last_value2 = null;
    var counts1 = 0;
    for (var i = 0; i < cards1.length; ++i) {
        var v1 = exports.get_poker_value(cards1[i]);
        if (last_value1 == null) {
            last_value1 = v1;
            counts1 = 1;
        } else {
            if (v1 != last_value1) {
                if (counts1 == 1) {
                    single1 = cards1[i];
                }
            } else {
                counts1++;
            }
        }

        var v2 = exports.get_poker_value(cards2[i]);
        if (last_value2 == null) {
            last_value2 = v2;
            counts2 = 1;
        } else {
            if (v2 != last_value2) {
                if (counts2 == 1) {
                    single2 = cards2[i];
                }
            } else {
                counts2++;
            }
        }
    }

    cards1.splice(cards1.indexOf(single1), 1);
    cards2.splice(cards2.indexOf(single2), 1);

    //比较对子大小
    var double_list1 = [];
    var double_list2 = [];

    for (var i = 0; i < cards1.length; ++i) {
        var v1 = exports.get_poker_value(cards1[i]);
        var v2 = exports.get_poker_value(cards2[i]);

        if (double_list1.indexOf(v1) == -1) {
            double_list1.push(v1);
        }
        if (double_list2.indexOf(v2) == -1) {
            double_list2.push(v2);
        }
    }

    double_list1.sort(function (a, b) { return b - a; });
    double_list2.sort(function (a, b) { return b - a; });

    for (var i = 0; i < double_list1.length; ++i) {
        if (double_list1[i] != double_list2[i]) {
            return double_list1[i] > double_list2[i];
        }
    }

    var s_va11 = exports.get_poker_value(single1);
    var s_val2 = exports.get_poker_value(single2);

    if (s_va11 != s_val2) {
        return s_va11 > s_val2;
    }

    //比较对子的花色
    cards1.sort(function (a, b) { return b - a; });
    cards2.sort(function (a, b) { return b - a; });

    for (var i = 0; i < cards1.length; ++i) {
        if (cards1[i] != cards2[i]) {
            return cards1[i] > cards2[i];
        }
    }
    return null;
}
//三个(3/5张牌)
function compare_stage_three(card_list1, card_list2) {
    return compare_double_to_four(card_list1, card_list2, 3);
}
//连子(5张牌)
//
function compare_stage_seq(card_list1, card_list2) {
    return compare_seq_color(card_list1, card_list2);
}
//同花(5张牌)
function compare_stage_same(card_list1, card_list2) {
    return comapre_none_seq_same(card_list1, card_list2);
}
//葫芦(5张牌)
function compare_stage_hulu(card_list1, card_list2) {
    //只需要比3个
    return compare_double_to_four(card_list1, card_list2, 3);
}
//炸弹(5张牌)
function compare_stage_boom(card_list1, card_list2) {
    //只需要比4个
    return compare_double_to_four(card_list1, card_list2, 4);
}
//同花顺(5张牌)
function compare_stage_same_seq(card_list1, card_list2) {
    return compare_seq_color(card_list1, card_list2);
}

/////////////////////比较大类型大小//////////////////////
// ture data1大
// false data2 大
//无类型
function compare_out_type_none(data1, data2) {
    var card_list1 = [];
    var card_list2 = [];
    for (var i = 0; i < data1.stage.length; ++i) {
        card_list1 = card_list1.concat(data1.stage[i].card_data);
        card_list2 = card_list2.concat(data2.stage[i].card_data);
    }
    return comapre_none_seq_same(card_list1, card_list2);
}
//三同花         三墩都是同花
//355同花
function compare_out_type_three_same(data1, data2) {
    var card_list1 = [];
    var card_list2 = [];
    for (var i = 0; i < data1.stage.length; ++i) {
        card_list1 = card_list1.concat(data1.stage[i].card_data);
        card_list2 = card_list2.concat(data2.stage[i].card_data);
    }
    //比较大小
    return compare_seq_color(card_list1, card_list2);
    //
    // var win_counts =0;
    // var lose_counts =0;
    // //每墩比较大小
    // for(var i=0;i<data1.stage.length;++i){
    //     var r =comapre_none_seq_same(data1.stage[i].card_data,data2.stage[i].card_data);
    //     if(r == true){
    //         win_counts +=1;
    //     }
    //     if(r == false){
    //         lose_counts +=1;
    //     }
    // }

    // if(win_counts >=2){
    //     return true
    // }
    // if(win_counts<2 && lose_counts >=2){
    //     return false;
    // }
    // return null;
}
//三顺子         三墩都是顺子
//355 顺子
function compare_out_type_three_seq(data1, data2) {
    //这个判断有问题，只需要判断每个人的内部的牌
    var card_list1 = [];
    var card_list2 = [];
    for (var i = 0; i < data1.stage.length; ++i) {
        card_list1 = card_list1.concat(data1.stage[i].card_data);
        card_list2 = card_list2.concat(data2.stage[i].card_data);
    }
    //比较大小
    return compare_seq_color(card_list1, card_list2);
    // var win_counts =0;
    // var lose_counts =0;
    // //每墩比较大小
    // for(var i=0;i<data1.stage.length;++i){
    //     var r =compare_seq_color(data1.stage[i].card_data,data2.stage[i].card_data);
    //     if(r == true){
    //         win_counts +=1;
    //     }
    //     if(r == false){
    //         lose_counts +=1;
    //     }
    // }

    // if(win_counts >=2){
    //     return true
    // }
    // if(win_counts<2 && lose_counts >=2){
    //     return false;
    // }
    // return null;
}
//6对半          6对
function compare_out_type_6double(data1, data2) {
    //b比对子大小
    var card_list1 = [];
    var card_list2 = [];
    for (var i = 0; i < data1.stage.length; ++i) {
        card_list1 = card_list1.concat(data1.stage[i].card_data);
        card_list2 = card_list2.concat(data2.stage[i].card_data);
    }
    //获取对子
    var cards1 = card_list1.slice();
    var cards2 = card_list2.slice();

    var single1 = null;
    var last_value1 = null;
    var counts1 = 0;
    var single2 = null;
    var last_value2 = null;
    var counts1 = 0;
    for (var i = 0; i < cards1.length; ++i) {
        var v1 = exports.get_poker_value(cards1[i]);
        if (last_value1 == null) {
            last_value1 = v1;
            counts1 = 1;
        } else {
            if (v1 != last_value1) {
                if (counts1 == 1) {
                    single1 = cards1[i];
                }
            } else {
                counts1++;
            }
        }

        var v2 = exports.get_poker_value(cards2[i]);
        if (last_value2 == null) {
            last_value2 = v2;
            counts2 = 1;
        } else {
            if (v2 != last_value2) {
                if (counts2 == 1) {
                    single2 = cards2[i];
                }
            } else {
                counts2++;
            }
        }
    }

    cards1.splice(cards1.indexOf(single1), 1);
    cards2.splice(cards2.indexOf(single2), 1);

    //比较对子大小
    var double_list1 = [];
    var double_list2 = [];

    for (var i = 0; i < cards1.length; ++i) {
        var v1 = exports.get_poker_value(cards1[i]);
        var v2 = exports.get_poker_value(cards2[i]);

        if (double_list1.indexOf(v1) == -1) {
            double_list1.push(v1);
        }
        if (double_list2.indexOf(v2) == -1) {
            double_list2.push(v2);
        }
    }

    double_list1.sort(function (a, b) { return b - a; });
    double_list2.sort(function (a, b) { return b - a; });

    for (var i = 0; i < double_list1.length; ++i) {
        if (double_list1[i] != double_list2[i]) {
            return double_list1[i] > double_list2[i];
        }
    }

    var s_va11 = exports.get_poker_value(single1);
    var s_val2 = exports.get_poker_value(single2);

    if (s_va11 != s_val2) {
        return s_va11 > s_val2;
    }

    //比较对子的花色
    cards1.sort(function (a, b) { return b - a; });
    cards2.sort(function (a, b) { return b - a; });

    for (var i = 0; i < cards1.length; ++i) {
        if (cards1[i] != cards2[i]) {
            return cards1[i] > cards2[i];
        }
    }
    return null;
}
//五对三条  五对+1个三条
function compare_out_type_5double_three(data1, data2) {
    var card_list1 = [];
    var card_list2 = [];
    for (var i = 0; i < data1.stage.length; ++i) {
        card_list1 = card_list1.concat(data1.stage[i].card_data);
        card_list2 = card_list2.concat(data2.stage[i].card_data);
    }
    //比对子和三条大小
    //优先比3个
    return compare_double_to_four(card_list1, card_list2, 3);
}
//4套三条   4个三条
function compare_out_type_4three(data1, data2) {
    var card_list1 = [];
    var card_list2 = [];
    for (var i = 0; i < data1.stage.length; ++i) {
        card_list1 = card_list1.concat(data1.stage[i].card_data);
        card_list2 = card_list2.concat(data2.stage[i].card_data);
    }

    card_list1.sort(function (a, b) { return b - a; });
    card_list2.sort(function (a, b) { return b - a; });

    return compare_more_three_to_four(card_list1, card_list2, 3);
}
//双怪冲3   两对葫芦，一个三条
function compare_out_type_2hulu_three(data1, data2) {
    var card_list1 = [];
    var card_list2 = [];
    for (var i = 0; i < data1.stage.length; ++i) {
        card_list1 = card_list1.concat(data1.stage[i].card_data);
        card_list2 = card_list2.concat(data2.stage[i].card_data);
    }

    card_list1.sort(function (a, b) { return b - a; });
    card_list2.sort(function (a, b) { return b - a; });

    return compare_more_three_to_four(card_list1, card_list2, 3);
}
//凑一色    全是1个花色
function compare_out_type_all_same(data1, data2) {
    var card_list1 = [];
    var card_list2 = [];
    for (var i = 0; i < data1.stage.length; ++i) {
        card_list1 = card_list1.concat(data1.stage[i].card_data);
        card_list2 = card_list2.concat(data2.stage[i].card_data);
    }
    //比较值
    return comapre_none_seq_same(card_list1, card_list2);
}
//全小      全是2-8
function compare_out_type_all_small(data1, data2) {
    var card_list1 = [];
    var card_list2 = [];
    for (var i = 0; i < data1.stage.length; ++i) {
        card_list1 = card_list1.concat(data1.stage[i].card_data);
        card_list2 = card_list2.concat(data2.stage[i].card_data);
    }
    //比较值
    return comapre_none_seq_same(card_list1, card_list2);
}
//全大      全是8-A
function compare_out_type_all_big(data1, data2) {
    var card_list1 = [];
    var card_list2 = [];
    for (var i = 0; i < data1.stage.length; ++i) {
        card_list1 = card_list1.concat(data1.stage[i].card_data);
        card_list2 = card_list2.concat(data2.stage[i].card_data);
    }
    //比较值
    return comapre_none_seq_same(card_list1, card_list2);
}
//三分天下  三个炸弹余一张
function compare_out_type_3boom(data1, data2) {
    var card_list1 = [];
    var card_list2 = [];
    for (var i = 0; i < data1.stage.length; ++i) {
        card_list1 = card_list1.concat(data1.stage[i].card_data);
        card_list2 = card_list2.concat(data2.stage[i].card_data);
    }
    //比较炸弹的大小 ---只需要比较最大的个炸弹
    return compare_more_three_to_four(card_list1, card_list2, 4);
}
//三同花顺  三墩都是同花顺
//355同花顺
function compare_out_type_3same_seq(data1, data2) {
    var card_list1 = [];
    var card_list2 = [];
    for (var i = 0; i < data1.stage.length; ++i) {
        card_list1 = card_list1.concat(data1.stage[i].card_data);
        card_list2 = card_list2.concat(data2.stage[i].card_data);
    }
    //整把手牌比较大小
    return compare_seq_color(card_list1, card_list2);
    // var win_counts =0;
    // var lose_counts =0;
    // //每墩比较大小
    // for(var i=0;i<data1.stage.length;++i){
    //     var r =compare_stage_same_seq(data1.stage[i].card_data,data2.stage[i].card_data);
    //     if(r == true){
    //         win_counts +=1;
    //     }
    //     if(r == false){
    //         lose_counts +=1;
    //     }
    // }

    // if(win_counts >=2){
    //     return true
    // }
    // if(win_counts<2 && lose_counts >=2){
    //     return false;
    // }
    // return null;
}
//12皇族   全是J Q K A
//只会有一个（不会存在第二个）
function compare_out_type_12king(data1, data2) {
    //比较值
    //花色
    return true;
}
//一条龙    A,K齐全 不同花
function compare_out_type_a_k(data1, data2) {
    var card_list1 = [];
    var card_list2 = [];
    for (var i = 0; i < data1.stage.length; ++i) {
        card_list1 = card_list1.concat(data1.stage[i].card_data);
        card_list2 = card_list2.concat(data2.stage[i].card_data);
    }
    //由大到小比较花色
    return compare_seq_color(card_list1, card_list2);
}
//至尊青龙  A,K 齐全 同花
function compare_out_type_kingking(data1, data2) {
    var card_list1 = [];
    var card_list2 = [];
    for (var i = 0; i < data1.stage.length; ++i) {
        card_list1 = card_list1.concat(data1.stage[i].card_data);
        card_list2 = card_list2.concat(data2.stage[i].card_data);
    }
    //只需要比较花色
    return compare_seq_color(card_list1, card_list2);
}


////////////////工具方法
/**
 * 判断单个同数量的牌的大小
 * @param {*} card_list1 
 * @param {*} card_list2 
 * @param {*} counts  需要判断的数量
 */
function compare_double_to_four(card_list1, card_list2, counts) {
    //首先判断对子
    var ct1 = card_list1.slice();
    var ct2 = card_list2.slice();
    ct1.sort(function (a, b) { return b - a; });
    ct2.sort(function (a, b) { return b - a; });
    var ct1_value = [];
    var ct2_value = [];
    for (var i = 0; i < ct1.length; ++i) {
        ct1_value.push(exports.get_poker_value(ct1[i]));
    }
    for (var i = 0; i < ct2.length; ++i) {
        ct2_value.push(exports.get_poker_value(ct2[i]));
    }
    var last_value1 = null;
    var counts1 = 0;
    var double1 = null;

    var last_value2 = null;
    var counts2 = 0;
    var double2 = null;

    for (var i = 0; i < ct1_value.length; i++) {
        if (last_value1 == null) {
            last_value1 = ct1_value[i];
            counts1 = 1;
        } else {
            if (ct1_value[i] != last_value1) {
                if (counts1 == counts) {
                    double1 = last_value1;
                    break;
                }
                last_value1 = ct1_value[i];
                counts1 = 1;
            } else {
                counts1++;
            }
        }
    }
    for (var i = 0; i < ct2_value.length; ++i) {
        if (last_value2 == null) {
            last_value2 = ct2_value[i];
            counts2 = 1;
        } else {
            if (ct2_value[i] != last_value2) {
                if (counts2 == counts) {
                    double2 = last_value2;
                    break;
                }
                last_value2 = ct2_value[i];
                counts2 = 1;
            } else {
                counts2++;
            }
        }
    }

    if (counts1 == counts) {
        double1 = last_value1;
    }
    if (counts2 == counts) {
        double2 = last_value2;
    }
    // console.log(ct1_value)
    // console.log(ct2_value)
    // console.log(counts1, double1)
    // console.log(counts2, double2)
    //判断牌面值
    if (double1 != double2) {
        return double1 > double2;
    }
    ct1_value.splice(ct1_value.indexOf(double1), counts);
    ct2_value.splice(ct2_value.indexOf(double2), counts);

    //比单牌值
    for (var i = 0; i < ct1_value.length; ++i) {
        if (ct1_value[i] != ct2_value[i]) {
            return ct1_value[i] > ct2_value[i];
        }
    }
    //对子花
    var double1_max_color = null;
    var double2_max_color = null;
    for (var i = 1; i < ct1.length; ++i) {
        var value1 = exports.get_poker_value(ct1[i])
        var value2 = exports.get_poker_value(ct2[i])
        if (value1 == double1) {
            if (double1_max_color == null) {
                double1_max_color = ct1[i];
            } else {
                if (ct1[i] > double1_max_color) {
                    double1_max_color = ct1[i];
                }
            }
        }
        if (value2 == double2) {
            if (double2_max_color == null) {
                double2_max_color = ct2[i];
            } else {
                if (ct2[i] > double2_max_color) {
                    double2_max_color = ct2[i];
                }
            }
        }

    }
    if (double1_max_color != double2_max_color) {
        return double1_max_color > double2_max_color;
    }
    return null;
}

/**
 * 比较不是连牌的 同花 或者单牌
 * @param {*} card_list1 
 * @param {*} card_list2 
 */
function comapre_none_seq_same(card_list1, card_list2) {
    var ct1 = card_list1.slice();
    var ct2 = card_list2.slice();
    ct1.sort(function (a, b) { return b - a; });
    ct2.sort(function (a, b) { return b - a; });
    // var ct1_value = [];
    // var ct2_value = [];
    for (var i = 0; i < ct1.length; ++i) {
        var v1 = exports.get_poker_value(ct1[i]);
        var v2 = exports.get_poker_value(ct2[i]);
        if (v1 != v2) {
            return v1 > v2;
        }
    }

    for (var i = 0; i < ct1.length; ++i) {
        var c1 = exports.get_poker_color(ct1[i]);
        var c2 = exports.get_poker_color(ct2[i]);
        if (c1 != c2) {
            return c1 > c2;
        }
    }
    return null;
    // //比牌面值
    // for (var i = 0; i < ct1_value.length; ++i) {
    //     if (ct1_value[i] != ct2_value[i]) {
    //         return ct1_value[i] > ct2_value[i];
    //     }
    // }
    // //比花色
    // for (var i = 0; i < ct1.length; ++i) {
    //     var color1 = exports.get_poker_color(ct1[i]);
    //     var color2 = exports.get_poker_color(ct2[i]);
    //     if (color1 != color2) {
    //         return color1 > color2;
    //     }
    // }
    // return null;
}

/**
 * 比较顺子  同花  需要特殊处理A
 * modified 20170616  顺子判断永远取最大的一个值
 * @param {*} card_list1 
 * @param {*} card_list2 
 */
function compare_seq_color(card_list1, card_list2) {
    var cards1 = card_list1.slice();
    var cards2 = card_list2.slice();

    cards1.sort(function (a, b) { return b - a; });
    cards2.sort(function (a, b) { return b - a; });

    //先比较值大小
    for (var i = 0; i < cards1.length; ++i) {
        var v1 = exports.get_poker_value(cards1[i]);
        var v2 = exports.get_poker_value(cards2[i]);
        if (v1 != v2) {
            return v1 > v2;
        }
    }

    //再比较花色
    for (var i = 0; i < cards1.length; ++i) {
        var c1 = exports.get_poker_color(cards1[i]);
        var c2 = exports.get_poker_color(cards2[i]);
        if (v1 != v2) {
            return v1 > v2;
        }
    }
    //如果全部相同，返回NULL
    //如果仅仅只有一副牌，那么是异常
    return null;
    //下面情况是特出处理了A的，card1,card2需要顺序排序
    // var cards1_value_max = null;
    // var cards1_value_min = null;
    // var cards2_value_max = null;
    // var cards2_value_min = null;
    // for (var i = 0; i < cards1.length; ++i) {
    //     var v1 = exports.get_poker_value(cards1[i]);
    //     var v2 = exports.get_poker_value(cards2[i]);
    //     if (cards1_value_max == null) {
    //         cards1_value_max = v1;
    //     } else {
    //         if (v1 > cards1_value_max) {
    //             cards1_value_max = v1;
    //         }
    //     }
    //     if (cards1_value_min == null) {
    //         cards1_value_min = v1;
    //     } else {
    //         if (v1 < cards1_value_min) {
    //             cards1_value_min = v1;
    //         }
    //     }
    //     if (cards2_value_max == null) {
    //         cards2_value_max = v2;
    //     } else {
    //         if (v2 > cards2_value_max) {
    //             cards2_value_max = v2;
    //         }
    //     }
    //     if (cards2_value_min == null) {
    //         cards2_value_min = v2;
    //     } else {
    //         if (v2 < cards2_value_min) {
    //             cards2_value_min = v2;
    //         }
    //     }
    // }

    // var c1_max = null;
    // var c2_max = null;
    // //检测最大连牌的最大值
    // if (cards1_value_max == SPACILA_A_VALUE) {
    //     if (cards1_value_min == SPACILA_K_VALUE) {
    //         c1_max = SPACILA_A_VALUE;
    //     }
    //     if (cards1_value_min == SPACILA_2_VALUE) {
    //         c1_max = SPACILA_2_VALUE + 3;
    //     }
    // }

    // if (cards2_value_max == SPACILA_A_VALUE) {
    //     if (cards2_value_min == SPACILA_K_VALUE) {
    //         c2_max = SPACILA_A_VALUE;
    //     }
    //     if (cards2_value_min == SPACILA_2_VALUE) {
    //         c2_max = SPACILA_2_VALUE + 3;
    //     }
    // }
    // if (c1_max != c2_max) {
    //     return c1_max > c2_max;
    // }
    // //比较花色
    // var max_color1 = null;
    // var max_color2 = null;
    // for (var i = 0; i < cards1.length; ++i) {
    //     var v1 = exports.get_poker_value(cards1[i]);
    //     var v2 = exports.get_poker_value(cards2[i]);
    //     if (v1 == c1_max) {
    //         max_color1 = cards1[i];
    //     }
    //     if (v2 == c2_max) {
    //         max_color2 = cards2[i];
    //     }
    // }

    // if (max_color1 != max_color2) {
    //     return max_color1 > max_color2;
    // }
    // return null;
}

/**
 * 比较多个3个和4个的大小
 * @param {*} card_list1 
 * @param {*} card_list2 
 */
function compare_more_three_to_four(card_list1, card_list2, count) {
    //比较最大的3个就行
    var max_three_value1 = null;
    var max_three_value2 = null;
    var last_value1 = null;
    var counts1 = 0;
    var last_valu2 = null;
    var counts2 = 0;

    for (var i = 0; i < card_list1.length; ++i) {
        var v1 = exports.get_poker_value(card_list1[i]);
        var v2 = exports.get_poker_value(card_list2[i]);
        if (last_value1 == null) {
            last_value1 = v1;
            counts1 = 1;
        } else {
            if (last_value1 != v1) {
                if (counts1 == count) {
                    if (max_three_value1 == null) {
                        max_three_value1 = last_value1;
                    } else {
                        if (last_value1 > max_three_value1) {
                            max_three_value1 = last_value1;
                        }
                    }
                }
                last_value1 = v1;
                counts1 = 1;
            } else {
                counts1 += 1;
            }
        }

        if (last_value2 == null) {
            last_value2 = v2;
            counts1 = 1;
        } else {
            if (last_value2 != v2) {
                if (counts2 == count) {
                    if (max_three_value2 == null) {
                        max_three_value2 = last_value2;
                    } else {
                        if (last_value2 > max_three_value2) {
                            max_three_value2 = last_value2;
                        }
                    }
                }
                last_value2 = v2;
                counts2 = 1;
            } else {
                counts2 += 1;
            }
        }
    }

    if (counts1 == count) {
        if (last_value1 > max_three_value1) {
            max_three_value1 = last_value1;
        }
    }


    if (counts2 == count) {
        if (last_value2 > max_three_value2) {
            max_three_value2 = last_value2;
        }
    }

    if (max_three_value1 != max_three_value2) {
        return max_three_value1 > max_three_value2;
    }
    return null;
}


//大类型倍率
exports.get_out_times = function (out_type) {
    switch (out_type) {
        case global.OUT_TYPE_NONE:
            return global.OUT_TYPE_NONE_VALUE;
        case global.OUT_TYPE_THREE_SAME:
            return global.OUT_TYPE_THREE_SAME_VALUE;
        case global.OUT_TYPE_THREE_SEQ:
            return global.OUT_TYPE_THREE_SEQ_VALUE;
        case global.OUT_TYPE_6DOUBLE:
            return global.OUT_TYPE_6DOUBLE_VALUE;
        case global.OUT_TYPE_5DOUBLE_THREE:
            return global.OUT_TYPE_5DOUBLE_THREE_VALUE;
        case global.OUT_TYPE_4THREE:
            return global.OUT_TYPE_4THREE_VALUE;
        case global.OUT_TYPE_2HULU_THREE:
            return global.OUT_TYPE_2HULU_THREE_VALUE;
        case global.OUT_TYPE_ALL_SAME:
            return global.OUT_TYPE_ALL_SAME_VALUE;
        case global.OUT_TYPE_ALL_SMALL:
            return global.OUT_TYPE_ALL_SMALL_VALUE;
        case global.OUT_TYPE_ALL_BIG:
            return global.OUT_TYPE_ALL_BIG_VALUE;
        case global.OUT_TYPE_3BOOM:
            return global.OUT_TYPE_3BOOM_VALUE;
        case global.OUT_TYPE_3SAME_SEQ:
            return global.OUT_TYPE_3SAME_SEQ_VALUE;
        case global.OUT_TYPE_12KING:
            return global.OUT_TYPE_12KING_VALUE;
        case global.OUT_TYPE_A_K:
            return global.OUT_TYPE_A_K_VALUE;
        case global.OUT_TYPE_KINGKING:
            return global.OUT_TYPE_KINGKING_VALUE;
    }
    console.warn("GET OUT TIMES no fetch --->out_type:", out_type)
    return global.OUT_TYPE_NONE_VALUE;
};

//墩倍率
exports.get_stage_time = function (stage_type, stage) {
    switch (stage_type) {

        case global.SHISSHUI_TYPE_NONE: //乌龙
            return global.SHISSHUI_TYPE_NONE_VALUE;
        case global.SHISSHUI_TYPE_DOUBLE://一对
            return global.SHISSHUI_TYPE_DOUBLE_VALUE;
        case global.SHISSHUI_TYPE_2DOUBLE: //两对
            return global.SHISSHUI_TYPE_2DOUBLE_VALUE;
        case global.SHISSHUI_TYPE_THREE:  //三条
            if (stage == 0) {
                return global.SHISSHUI_TYPE_THREE_VALUE * 3;
            }
            return global.SHISSHUI_TYPE_THREE_VALUE;
        case global.SHISSHUI_TYPE_SEQ:    //顺子
            return global.SHISSHUI_TYPE_SEQ_VALUE;
        case global.SHISSHUI_TYPE_SAME:    //同花
            return global.SHISSHUI_TYPE_SAME_VALUE;
        case global.SHISSHUI_TYPE_HULU:   //葫芦
            if (stage == 1) {
                return global.SHISSHUI_TYPE_HULU_VALUE * 2;
            }
            return global.SHISSHUI_TYPE_HULU_VALUE;
        case global.SHISSHUI_TYPE_BOOM:   //炸弹 底墩
            if (stage == 1) {
                return global.SHISSHUI_TYPE_BOOM_VALUE * 2;
            }
            return global.SHISSHUI_TYPE_BOOM_VALUE;
        case global.SHISSHUI_TYPE_SAME_SEQ: //同花顺
            if (stage == 1) {
                return global.SHISSHUI_TYPE_SAME_SEQ_VALUE * 2;
            }
            return global.SHISSHUI_TYPE_SAME_SEQ_VALUE;
    }
    console.warn("GET STAGE TIMES no fetch --->stage_type:%d,stage:%d", stage_type, stage);
    return global.OUT_TYPE_NONE_VALUE;
}

/**
 * 找出begin开始的连牌
 * @param {*} begin 
 * @param {*} value_list 
 */
function find_seq(begin, value_list) {
    var tmp_seq = [];
    tmp_seq.push(begin);

    var tmp_value_list = value_list.slice();
    if (begin == 12) {
        //A需要特殊处理
        //向下
        var offset = 1;
        while (tmp_value_list.indexOf(begin - offset) != -1) {
            tmp_seq.push(begin - offset);
            tmp_value_list.splice(tmp_value_list.indexOf(begin - offset), 1);
            offset += 1;
        }
        //向下 如果长度 不符合想要的  5 3 8 10% ==0
        if (tmp_seq.length != 3 && tmp_seq.length != 5 && tmp_seq.length != 8 && tmp_seq.length != 10 && tmp_seq.length != 13) {
            if (tmp_seq.length > 10) {
                //只能取长度10
                var remove_list = [];
                for (var i = tmp_seq.length - 1; i > 9; --i) {
                    remove_list.push(tmp_seq[i]);
                }

                for (var i = 0; i < remove_list.length; ++i) {
                    tmp_seq.splice(tmp_seq.indexOf(remove_list[i]), 1)
                    tmp_value_list.push(remove_list[i]);
                }
                tmp_value_list.sort(function (a, b) { return b - a; });

                return { seq: tmp_seq, rest: tmp_value_list };

            } else if (tmp_seq.length > 8) {
                //最多只能取8
                var remove_list = [];
                for (var i = tmp_seq.length - 1; i > 7; --i) {
                    remove_list.push(tmp_seq[i]);
                }

                for (var i = 0; i < remove_list.length; ++i) {
                    tmp_seq.splice(tmp_seq.indexOf(remove_list[i]), 1)
                    tmp_value_list.push(remove_list[i]);
                }
                tmp_value_list.sort(function (a, b) { return b - a; });

                return { seq: tmp_seq, rest: tmp_value_list };
            } else if (tmp_seq.length > 5) {
                //只能取5个
                var remove_list = [];
                for (var i = tmp_seq.length - 1; i > 4; --i) {
                    remove_list.push(tmp_seq[i]);
                }

                for (var i = 0; i < remove_list.length; ++i) {
                    tmp_seq.splice(tmp_seq.indexOf(remove_list[i]), 1)
                    tmp_value_list.push(remove_list[i]);
                }
                tmp_value_list.sort(function (a, b) { return b - a; });

                return { seq: tmp_seq, rest: tmp_value_list };
            } else if (tmp_seq.length > 3) {
                //只能取3个
                var remove_list = [];
                for (var i = tmp_seq.length - 1; i > 2; --i) {
                    remove_list.push(tmp_seq[i]);
                }

                for (var i = 0; i < remove_list.length; ++i) {
                    tmp_seq.splice(tmp_seq.indexOf(remove_list[i]), 1)
                    tmp_value_list.push(remove_list[i]);
                }
                tmp_value_list.sort(function (a, b) { return b - a; });

                return { seq: tmp_seq, rest: tmp_value_list };
            } else {
                //尝试向下取
                tmp_seq = [];
                tmp_seq.push(begin);
                tmp_value_list = value_list.slice();
                var offset = 0;
                var vir_begin = 0;
                while (tmp_value_list.indexOf(vir_begin + offset) != -1) {
                    tmp_seq.push(vir_begin + offset);
                    tmp_value_list.splice(tmp_value_list.indexOf(vir_begin + offset), 1);
                    offset += 1;
                }
                //不满足条件不能取
                if (tmp_seq.length != 3 && tmp_seq.length != 5 && tmp_seq.length != 8 && tmp_seq.length != 10 && tmp_seq.length != 13) {
                    if (tmp_seq.length > 10) {
                        //只能取长度10
                        var remove_list = [];
                        for (var i = tmp_seq.length - 1; i > 9; --i) {
                            remove_list.push(tmp_seq[i]);
                        }

                        for (var i = 0; i < remove_list.length; ++i) {
                            tmp_seq.splice(tmp_seq.indexOf(remove_list[i]), 1)
                            tmp_value_list.push(remove_list[i]);
                        }
                        tmp_value_list.sort(function (a, b) { return b - a; });

                        return { seq: tmp_seq, rest: tmp_value_list };

                    } else if (tmp_seq.length > 8) {
                        //最多只能取8
                        var remove_list = [];
                        for (var i = tmp_seq.length - 1; i > 7; --i) {
                            remove_list.push(tmp_seq[i]);
                        }

                        for (var i = 0; i < remove_list.length; ++i) {
                            tmp_seq.splice(tmp_seq.indexOf(remove_list[i]), 1)
                            tmp_value_list.push(remove_list[i]);
                        }
                        tmp_value_list.sort(function (a, b) { return b - a; });

                        return { seq: tmp_seq, rest: tmp_value_list };
                    } else if (tmp_seq.length > 5) {
                        //只能取5个
                        var remove_list = [];
                        for (var i = tmp_seq.length - 1; i > 4; --i) {
                            remove_list.push(tmp_seq[i]);
                        }

                        for (var i = 0; i < remove_list.length; ++i) {
                            tmp_seq.splice(tmp_seq.indexOf(remove_list[i]), 1)
                            tmp_value_list.push(remove_list[i]);
                        }
                        tmp_value_list.sort(function (a, b) { return b - a; });

                        return { seq: tmp_seq, rest: tmp_value_list };
                    } else if (tmp_seq.length > 3) {
                        //只能取3个
                        var remove_list = [];
                        for (var i = tmp_seq.length - 1; i > 2; --i) {
                            remove_list.push(tmp_seq[i]);
                        }

                        for (var i = 0; i < remove_list.length; ++i) {
                            tmp_seq.splice(tmp_seq.indexOf(remove_list[i]), 1)
                            tmp_value_list.push(remove_list[i]);
                        }
                        tmp_value_list.sort(function (a, b) { return b - a; });

                        return { seq: tmp_seq, rest: tmp_value_list };
                    } else {
                        //只能取当前这个
                        //只能包含那一元素
                        tmp_seq = [];
                        tmp_seq.push(begin);
                        return { seq: tmp_seq, rest: value_list };
                    }
                }
                return { seq: tmp_seq, rest: tmp_value_list };
            }

        } else {
            return { seq: tmp_seq, rest: tmp_value_list };
        }
    } else {
        var offset = 1;
        while (tmp_value_list.indexOf(begin - offset) != -1) {
            tmp_seq.push(begin - offset);
            tmp_value_list.splice(tmp_value_list.indexOf(begin - offset), 1);
            offset += 1;
        }

        if (tmp_seq.length != 3 && tmp_seq.length != 5 && tmp_seq.length != 8 && tmp_seq.length != 10 && tmp_seq.length != 13) {
            if (tmp_seq.length > 10) {
                //只能取长度10
                var remove_list = [];
                for (var i = tmp_seq.length - 1; i > 9; --i) {
                    remove_list.push(tmp_seq[i]);
                }

                for (var i = 0; i < remove_list.length; ++i) {
                    tmp_seq.splice(tmp_seq.indexOf(remove_list[i]), 1)
                    tmp_value_list.push(remove_list[i]);
                }
                tmp_value_list.sort(function (a, b) { return b - a; });

                return { seq: tmp_seq, rest: tmp_value_list };

            } else if (tmp_seq.length > 8) {
                //最多只能取8
                var remove_list = [];
                for (var i = tmp_seq.length - 1; i > 7; --i) {
                    remove_list.push(tmp_seq[i]);
                }

                for (var i = 0; i < remove_list.length; ++i) {
                    tmp_seq.splice(tmp_seq.indexOf(remove_list[i]), 1)
                    tmp_value_list.push(remove_list[i]);
                }
                tmp_value_list.sort(function (a, b) { return b - a; });

                return { seq: tmp_seq, rest: tmp_value_list };
            } else if (tmp_seq.length > 5) {
                //只能取5个
                var remove_list = [];
                for (var i = tmp_seq.length - 1; i > 4; --i) {
                    remove_list.push(tmp_seq[i]);
                }

                for (var i = 0; i < remove_list.length; ++i) {
                    tmp_seq.splice(tmp_seq.indexOf(remove_list[i]), 1)
                    tmp_value_list.push(remove_list[i]);
                }
                tmp_value_list.sort(function (a, b) { return b - a; });

                return { seq: tmp_seq, rest: tmp_value_list };
            } else if (tmp_seq.length > 3) {
                //只能取3个
                var remove_list = [];
                for (var i = tmp_seq.length - 1; i > 2; --i) {
                    remove_list.push(tmp_seq[i]);
                }

                for (var i = 0; i < remove_list.length; ++i) {
                    tmp_seq.splice(tmp_seq.indexOf(remove_list[i]), 1)
                    tmp_value_list.push(remove_list[i]);
                }
                tmp_value_list.sort(function (a, b) { return b - a; });

                return { seq: tmp_seq, rest: tmp_value_list };
            } else {
                //只能包含那一元素
                tmp_seq = [];
                tmp_seq.push(begin);
                return { seq: tmp_seq, rest: value_list };
            }
        }
        return { seq: tmp_seq, rest: tmp_value_list };
    }
}
/**
 * 找出begin开始的同花
 * @param {*} begin 
 * @param {*} cards 
 */
function find_same_seq(begin, cards) {
    var tmp = [];
    tmp.push(begin);
    //A特殊处理
    if (poker_utils.get_poker_value(begin) == 12) {
        var next = begin - 4;
        while (cards.indexOf(next) != -1) {
            tmp.push(next);
            cards.splice(cards.indexOf(next), 1);
            next -= 4;
        }
        if (tmp.length != 3 && tmp.length != 5 && tmp.length != 8 && tmp.length != 10 && tmp.length != 13) {
            if (tmp.length > 10) {
                //最多只能取10个
                var remove = tmp.splice(10, tmp.length - 10);
                cards = cards.concat(remove);
                cards.sort(function (a, b) { return b - a; });
            } else if (tmp.length > 8) {
                var remove = tmp.splice(8, tmp.length - 8);
                cards = cards.concat(remove);
                cards.sort(function (a, b) { return b - a; });
            } else if (tmp.length > 5) {
                var remove = tmp.splice(5, tmp.length - 5);
                cards = cards.concat(remove);
                cards.sort(function (a, b) { return b - a; });
            } else if (tmp.length > 3) {
                var remove = tmp.splice(3, tmp.length - 3);
                cards = cards.concat(remove);
                cards.sort(function (a, b) { return b - a; });
            } else {
                //尝试倒序取
                tmp.splice(tmp.indexOf(begin), 1);
                cards = cards.concat(tmp);
                cards.sort(function (a, b) { return b - a; });
                tmp = [];
                tmp.push(begin)
                var next = begin % 4;
                while (cards.indexOf(next) != -1) {
                    tmp.push(next);
                    cards.splice(cards.indexOf(next), 1);
                    next += 4;
                }

                if (tmp.length != 3 && tmp.length != 5 && tmp.length != 8 && tmp.length != 10 && tmp.length != 13) {
                    if (tmp.length > 10) {
                        //最多只能取10个
                        var remove = tmp.splice(10, tmp.length - 10);
                        cards = cards.concat(remove);
                        cards.sort(function (a, b) { return b - a; });
                    } else if (tmp.length > 8) {
                        var remove = tmp.splice(8, tmp.length - 8);
                        cards = cards.concat(remove);
                        cards.sort(function (a, b) { return b - a; });
                    } else if (tmp.length > 5) {
                        var remove = tmp.splice(5, tmp.length - 5);
                        cards = cards.concat(remove);
                        cards.sort(function (a, b) { return b - a; });
                    } else if (tmp.length > 3) {
                        var remove = tmp.splice(3, tmp.length - 3);
                        cards = cards.concat(remove);
                        cards.sort(function (a, b) { return b - a; });
                    } else {
                        //只能取当前这个
                        var remove = tmp.splice(1, tmp.length - 1);
                        cards = cards.concat(remove);
                        cards.sort(function (a, b) { return b - a; });
                    }
                    return { same_seq: tmp, cards: cards };
                } else {
                    return { same_seq: tmp, cards: cards };
                }
            }
        } else {
            return { same_seq: tmp, cards: cards };
        }
    } else {
        var next = begin - 4;
        while (cards.indexOf(next) != -1) {
            tmp.push(next);
            cards.splice(cards.indexOf(next), 1);
            next -= 4;
        }
        if (tmp.length != 3 && tmp.length != 5 && tmp.length != 8 && tmp.length != 10 && tmp.length != 13) {
            if (tmp.length > 10) {
                //最多只能取10个
                var remove = tmp.splice(10, tmp.length - 10);
                cards = cards.concat(remove);
                cards.sort(function (a, b) { return b - a; });
            } else if (tmp.length > 8) {
                var remove = tmp.splice(8, tmp.length - 8);
                cards = cards.concat(remove);
                cards.sort(function (a, b) { return b - a; });
            } else if (tmp.length > 5) {
                var remove = tmp.splice(5, tmp.length - 5);
                cards = cards.concat(remove);
                cards.sort(function (a, b) { return b - a; });
            } else if (tmp.length > 3) {
                var remove = tmp.splice(3, tmp.length - 3);
                cards = cards.concat(remove);
                cards.sort(function (a, b) { return b - a; });
            } else {
                //只能取当前这个
                var remove = tmp.splice(1, tmp.length - 1);
                cards = cards.concat(remove);
                cards.sort(function (a, b) { return b - a; });
            }
            return { same_seq: tmp, cards: cards };
        } else {
            return { same_seq: tmp, cards: cards };
        }
    }

}