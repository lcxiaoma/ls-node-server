var base = require('./oop_base');

function son(){
    this.son_name = 'son_name';
}

son.prototype = new base();
exports = module.exports = new son();

son.prototype.show_name1 = function(){
    console.log("son call show name1",this.name);
};

// son.prototype.show_name = function(){
//     console.log("some call show name ",this.name);
// }