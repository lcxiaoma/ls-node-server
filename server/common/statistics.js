/**
 * 统计信息
 */

exports.statistic={
    init_statistic_from_data:function(data){
        return JSON.parse(data);
    },

    dump_statistic:function(statistic){
        return JSON.stringify(statistic);
    },
    /**
     * 添加统计数
     */
    add_statitsic:function(statistic,add_key,value){
        if(!value){value =1;};
        var add = statistic[add_key];
        if(!add){
            statistic[add_key] = value;
        }else{
            statistic[add_key] = add + value;
        }
    },

    /**
     * 最大值计数
     */
    max_statistic:function(statistic,max_key,value,compare_func){
        var old_value = statistic[max_key];
        if(!old_value){
            statistic[max_key] = value;
        }else{
            if(!compare_func){
                if(value > old_value){
                    statistic[max_key] = value;
                }
            }else{
                if(compare_func(value,old_value)){
                    statistic[max_key] = value;
                }
            }
        }
    },

    /**
     * 最小计数
     */
    min_statistic:function(statistic,min_key,value){
        var old_value = statistic[min_key];
        if(!old_value){
            statistic[min_key] = value;
        }else{
            if(value <old_value){
                statistic[min_key] = value;
            }
        }
    },

    /**
     * 获取计数
     */
    get_statistic:function(statistic,key,default_value){
        if(!default_value){default_value=0;}
        var value = statistic[key];
        if(!value){
            return default_value;
        }
        return value;
    },
}


