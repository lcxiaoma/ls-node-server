exports = module.exports = Base;

function Base(){
    this.name = "base_name";
    // this.show_name =function(){
    //     console.log("base call ==>",this.name);
    // };
}

Base.prototype.name1 = {};
Base.prototype.show_name1 = function(){
    console.log("base call show name1==>",this.name1);
}
Base.prototype.show_name = function(){
	console.log("base call show name ==>",this.name);
};