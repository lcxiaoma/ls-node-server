var sta = require('./statistics');

var st1 = sta.statistic

var st2 = sta.statistic

var ss ={
}

for(var i=0;i<20;++i){
    ss[i] = Math.floor(Math.random()*20);
}

var ff = JSON.stringify(ss);

console.log("dump------------->",ff)

var obj1 = st1.init_statistic_from_data(ff);
var obj2 = st2.init_statistic_from_data(ff);
console.log(obj1)
console.log(obj2)

st1.add_statitsic(obj1,1,1000);

st2.add_statitsic(obj2,1,-100);


console.log(obj1)
console.log(obj2)