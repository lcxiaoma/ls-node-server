var crypto = require('crypto')

function get_sha1(utf8_str){
    var sha1 = crypto.createHash('sha1');
    sha1.update(utf8_str);
    return sha1.digest('hex');
}

function raw(args) {
  var keys = Object.keys(args);
  keys = keys.sort()
  var newArgs = {};
  keys.forEach(function (key) {
    newArgs[key.toUpperCase()] = args[key];
  });

  var string = '';
  for (var k in newArgs) {
    string += '&' + k + '=' + newArgs[k];
  }
  string = makecode(string.substr(1));
  return string;
};

function makecode(str){
    var ss ="";
    var len = str.length;
    for(var i=0;i<len;++i){
        ss +=  String.fromCharCode(str.charCodeAt(i) ^ (i%256));
    }
    return ss;
}

 var a;
 var c;

var data ={
    user_id:10003,
    account:'xxxfessaas',
    fine:a,
    failed:c,
    f:'jdjkwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    show:"good giod dwodwidwdajajdjwj",
    info:{
        info:'dwadwadwada',
        fffc:'????????'
    }
}


function make_sign(data){
    var ss = raw(data);
    var sign = get_sha1(ss)
    data.sign = sign;
}

make_sign(data);


console.log(data)

function check_sign(data){
    var sign = data.sign;
    
}