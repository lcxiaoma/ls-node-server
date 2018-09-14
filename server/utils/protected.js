const domain = require('domain');
var logger = require('../utils/log.js').logger;

exports.RunFuncSafe = function(func,args){
    var d = domain.create();
    d.on('error',function(err){
        logger.error(err.stack);
    });
    d.run(function(){
        func(args);
    });
};
