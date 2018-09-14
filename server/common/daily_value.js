/**
 * 日常信息
 */

exports.daily_value ={
    
    //获取日常值
    get_daily_value:function(daily_data,daily_key,default_value){
        var v = daily_data[daily_key];
        if(v){
            return v;
        }else{
            return default_value;
        }
    },

    //
    add_daily_value:function(daily_data,daily_key,add_value){
        var v = daily_data[daily_key];
        if(v){
            daily_data[daily_key] = v+add_value;
        }else{
            daily_data[daily_key] = add_value;
        }
        return daily_data;
    }

}