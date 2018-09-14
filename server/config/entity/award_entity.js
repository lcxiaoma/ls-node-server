/**
 * 物品奖励实体
 * **/

//奖励类型
exports.award_type ={
    item:'item.none',
    ingot:'ingot.none',
    gold:'gold.none',
}

exports.item_type ={
    ingot:55,
    gold:50,
}

exports.quality ={
    garbage:0,
    ordinary:1,
    excelent:2,
    superior:3,
    epic:4,
    legend:5,
}

//奖励格式 [item.none,type,qunity,num]
var award =JSON.stringify({
    award_type:'',
    item_type:0,
    quality:0,
    num:0,
});