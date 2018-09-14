var logger =require('./log.js').log_init;

var mongoclient = require('mongodb').MongoClient,assert = require('assert');

//connection URL
var mongourl = 'mongodb://localhost:27017/game_db_10001';


//insert data
var insert_data = function(db,callback){
    var collection = db.collection('tb1');
    var data = [{"name":'zhouhong',"age":20},{"name":"zhouhong1","age":21}];
    collection.insert(data,function (err,result){
        if(err){
            logger.error(err.stack);
            return;
        }
        callback(result);
    });
}

var select_data = function(db,callback){
    var collection = db.collection('tb1');
    var query = {"name":'zhouhong'};
    collection.find(query).toArray(function(err,result){
        if(err){
            logger.error(err.stack);
            return;
        }
        callback(result);
    });
}

var update_data = function(db,callback){
    var collection = db.collection('tb1');
    var update_who = {"name":'zhouhong'};
    var update_value = {$set:{"age":30}};
    collection.update(update_who,update_value,function(err,result){
        if(err){
            logger.error(err.stack);
            return;
        }
        callback(result);
    });
}

var delete_data = function(db,callback){
    var collection = db.collection('tb1');
    var delete_who = {"name":'zhouhong'};
    collection.remove(delete_who,function(err,result){
        if(err){
            logger.error(err.stack);
            return;
        }
        callback(result);
    });
}

var call_proc = function(db,callback){

    db.eval('get_tb2_count()',function(err,result){
        if(err){
            logger.error(err.stack);
            return;
        }
        callback(result);
    });
}


//test code
function Test(){
    //insert data
    mongoclient.connect(mongourl,function(err,db){
        insert_data(db,function(result){
            logger.debug('insert result===>',result);
            db.close();
        });
    });
   

    //select data
    mongoclient.connect(mongourl,function(err,db){
        select_data(db,function(result){
            logger.debug('select result===>',result);
            db.close();
        });
    });

    //update data
    mongoclient.connect(mongourl,function(err,db){
        update_data(db,function(result){
            logger.debug('update result===>',result.result);
            db.close();
        });
    });

    //delete data
    mongoclient.connect(mongourl,function(err,db){
        delete_data(db,function(result){
            logger.debug('delete result===>',result.result);
            db.close();
        });
    });
    //call proc
    mongoclient.connect(mongourl,function(err,db){
        call_proc(db,function(result){
            logger.debug('callproc result===>',result);
            db.close();
        });
    });
}

Test();