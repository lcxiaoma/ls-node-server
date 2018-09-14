/**
 * 1，生成chanllenge
 * 2，dh64 密钥交换
 * 3，生成密钥
 * 4，认证chanllenge 认证成功给token
 * 5，des加密token (randomByte生成的token) token的生命周期为5分钟
 * 6，以后的传输都用token来MD5生成签名
 * **/
var crypto = require('crypto')
var assert = require("assert");


String.prototype.MD5 = function (bit)
{
    var sMessage = this;
    function RotateLeft(lValue, iShiftBits) { return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits)); } 
    function AddUnsigned(lX,lY)
    {
        var lX4,lY4,lX8,lY8,lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF); 
        if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8); 
        if (lX4 | lY4)
        { 
            if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8); 
            else return (lResult ^ 0x40000000 ^ lX8 ^ lY8); 
        } else return (lResult ^ lX8 ^ lY8); 
    } 
    function F(x,y,z) { return (x & y) | ((~x) & z); } 
    function G(x,y,z) { return (x & z) | (y & (~z)); } 
    function H(x,y,z) { return (x ^ y ^ z); } 
    function I(x,y,z) { return (y ^ (x | (~z))); } 
    function FF(a,b,c,d,x,s,ac)
    { 
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac)); 
        return AddUnsigned(RotateLeft(a, s), b); 
    } 
    function GG(a,b,c,d,x,s,ac)
    { 
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac)); 
        return AddUnsigned(RotateLeft(a, s), b); 
    } 
    function HH(a,b,c,d,x,s,ac)
    { 
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac)); 
        return AddUnsigned(RotateLeft(a, s), b); 
    } 
    function II(a,b,c,d,x,s,ac)
    { 
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac)); 
        return AddUnsigned(RotateLeft(a, s), b); 
    } 
    function ConvertToWordArray(sMessage)
    { 
        var lWordCount; 
        var lMessageLength = sMessage.length; 
        var lNumberOfWords_temp1=lMessageLength + 8; 
        var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64; 
        var lNumberOfWords = (lNumberOfWords_temp2+1)*16; 
        var lWordArray=Array(lNumberOfWords-1); 
        var lBytePosition = 0; 
        var lByteCount = 0; 
        while ( lByteCount < lMessageLength )
        { 
            lWordCount = (lByteCount-(lByteCount % 4))/4; 
            lBytePosition = (lByteCount % 4)*8; 
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (sMessage.charCodeAt(lByteCount)<<lBytePosition)); 
            lByteCount++; 
        } 
        lWordCount = (lByteCount-(lByteCount % 4))/4; 
        lBytePosition = (lByteCount % 4)*8; 
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition); 
        lWordArray[lNumberOfWords-2] = lMessageLength<<3; 
        lWordArray[lNumberOfWords-1] = lMessageLength>>>29; 
        return lWordArray; 
    } 
    function WordToHex(lValue)
    { 
        var WordToHexValue="",WordToHexValue_temp="",lByte,lCount; 
        for (lCount = 0;lCount<=3;lCount++)
        { 
            lByte = (lValue>>>(lCount*8)) & 255; 
            WordToHexValue_temp = "0" + lByte.toString(16); 
            WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2); 
        } 
        return WordToHexValue; 
    } 
    var x=Array(); 
    var k,AA,BB,CC,DD,a,b,c,d 
    var S11=7, S12=12, S13=17, S14=22; 
    var S21=5, S22=9 , S23=14, S24=20; 
    var S31=4, S32=11, S33=16, S34=23; 
    var S41=6, S42=10, S43=15, S44=21; 
    // Steps 1 and 2. Append padding bits and length and convert to words 
    x = ConvertToWordArray(sMessage); 
    // Step 3. Initialise 
    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476; 
    // Step 4. Process the message in 16-word blocks 
    for (k=0;k<x.length;k+=16)
    { 
        AA=a; BB=b; CC=c; DD=d; 
        a=FF(a,b,c,d,x[k+0], S11,0xD76AA478); 
        d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756); 
        c=FF(c,d,a,b,x[k+2], S13,0x242070DB); 
        b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE); 
        a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF); 
        d=FF(d,a,b,c,x[k+5], S12,0x4787C62A); 
        c=FF(c,d,a,b,x[k+6], S13,0xA8304613); 
        b=FF(b,c,d,a,x[k+7], S14,0xFD469501); 
        a=FF(a,b,c,d,x[k+8], S11,0x698098D8); 
        d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF); 
        c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1); 
        b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE); 
        a=FF(a,b,c,d,x[k+12],S11,0x6B901122); 
        d=FF(d,a,b,c,x[k+13],S12,0xFD987193); 
        c=FF(c,d,a,b,x[k+14],S13,0xA679438E); 
        b=FF(b,c,d,a,x[k+15],S14,0x49B40821); 
        a=GG(a,b,c,d,x[k+1], S21,0xF61E2562); 
        d=GG(d,a,b,c,x[k+6], S22,0xC040B340); 
        c=GG(c,d,a,b,x[k+11],S23,0x265E5A51); 
        b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA); 
        a=GG(a,b,c,d,x[k+5], S21,0xD62F105D); 
        d=GG(d,a,b,c,x[k+10],S22,0x2441453); 
        c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681); 
        b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8); 
        a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6); 
        d=GG(d,a,b,c,x[k+14],S22,0xC33707D6); 
        c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87); 
        b=GG(b,c,d,a,x[k+8], S24,0x455A14ED); 
        a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905); 
        d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8); 
        c=GG(c,d,a,b,x[k+7], S23,0x676F02D9); 
        b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A); 
        a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942); 
        d=HH(d,a,b,c,x[k+8], S32,0x8771F681); 
        c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122); 
        b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C); 
        a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44); 
        d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9); 
        c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60); 
        b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70); 
        a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6); 
        d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA); 
        c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085); 
        b=HH(b,c,d,a,x[k+6], S34,0x4881D05); 
        a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039); 
        d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5); 
        c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8); 
        b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665); 
        a=II(a,b,c,d,x[k+0], S41,0xF4292244); 
        d=II(d,a,b,c,x[k+7], S42,0x432AFF97); 
        c=II(c,d,a,b,x[k+14],S43,0xAB9423A7); 
        b=II(b,c,d,a,x[k+5], S44,0xFC93A039); 
        a=II(a,b,c,d,x[k+12],S41,0x655B59C3); 
        d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92); 
        c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D); 
        b=II(b,c,d,a,x[k+1], S44,0x85845DD1); 
        a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F); 
        d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0); 
        c=II(c,d,a,b,x[k+6], S43,0xA3014314); 
        b=II(b,c,d,a,x[k+13],S44,0x4E0811A1); 
        a=II(a,b,c,d,x[k+4], S41,0xF7537E82); 
        d=II(d,a,b,c,x[k+11],S42,0xBD3AF235); 
        c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB); 
        b=II(b,c,d,a,x[k+9], S44,0xEB86D391); 
        a=AddUnsigned(a,AA); b=AddUnsigned(b,BB); c=AddUnsigned(c,CC); d=AddUnsigned(d,DD); 
    }
    if(bit==32)
    {
        return WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);
    }
    else
    {
        return WordToHex(b)+WordToHex(c);
    }
}

//生成公钥和私钥
function dh64_gen_key(){
    var blob =crypto.getDiffieHellman('modp5');
    blob.generateKeys();
    return blob;
}

//生成密钥
function dh64_secret(blob,public_key){
    var secret = blob.computeSecret(public_key,'base64','base64');
    return secret;
}

//握手认证
function hmac64(content,secret){
    var hmac =crypto.createHmac('sha1',secret)
    var sign =hmac.update(content,'utf8').digest().toString('base64');
    return sign;
}

//des加密
function des_encrypt(plantext,key,iv){
    var algorithm ={ ecb:'des-ecb',cbc:'des-cbc',ede3:'des-ede3-cbc' };
    key = new Buffer(key,'base64');
    iv = new Buffer(iv ? iv : 0);
    console.log(key.length);
    console.log(iv.length);
    var cipher = crypto.createCipheriv(algorithm.ede3, key, iv);
    cipher.setAutoPadding(true) //default true
    var ciph = cipher.update(plantext, 'utf8', 'base64');
    ciph += cipher.final('base64');
    return ciph;
}
//des解密
function des_decrypt(encrypt_text,key,iv){
    var algorithm ={ ecb:'des-ecb',cbc:'des-cbc',ede3:'des-ede3-cbc'};
    key = new Buffer(key,'base64');
    iv = new Buffer(iv ? iv : 0);
    console.log(key.length);
    console.log(iv.length);
    var decipher = crypto.createDecipheriv(algorithm.ede3, key, iv);
    decipher.setAutoPadding(true);
    var txt = decipher.update(encrypt_text, 'base64', 'utf8');
    txt += decipher.final('utf8');
    return txt;
}

exports.aes_encrypt = function(plantext,key,iv){
    var algorithm ={aes256:'aes-256-cbc'};
    key = new Buffer(key,'utf8');
    iv = new Buffer(iv ? iv : 0);
    console.log(key.length);
    console.log(iv.length);
    var cipher = crypto.createCipheriv(algorithm.aes256, key,iv);
    cipher.setAutoPadding(true) //default true
    var ciph = cipher.update(plantext, 'utf8', 'base64');
    ciph += cipher.final('base64');
    return ciph;
}

exports.aes_decrypt = function(encrypt_text,key,iv){
    var algorithm ={aes256:'aes-256-cbc'};
    key = new Buffer(key,'utf8');
    iv = new Buffer(iv ? iv : 0);
    console.log(key.length);
    console.log(iv.length);
    var decipher = crypto.createDecipheriv(algorithm.aes256, key,iv);
    decipher.setAutoPadding(true);
    var txt = decipher.update(encrypt_text, 'base64', 'utf8');
    txt += decipher.final('utf8');
    return txt;
}

exports.md5 = function (content) {
	var md5 = crypto.createHash('md5');
	md5.update(new Buffer(content));
	return md5.digest('hex');	
}

var k1 =dh64_gen_key();
var k2 =dh64_gen_key();

var s1 = dh64_secret(k1,k2.getPublicKey('base64'));
var s2 = dh64_secret(k2,k1.getPublicKey('base64'));

console.log('a',s1);
console.log('b',s2);

console.log(s1.MD5());
console.log(s1.MD5(32));
console.log(exports.md5(s1));


// var a = crypto.randomBytes(24);
// var tmp_key = a.toString('base64');
// console.log(a.toString('base64'));

// var content2 = "??????????????????";

// var c = crypto.randomBytes(4);
// console.log(c.toString('base64'));

// var b = c.toString('base64');

// var en = des_encrypt(content2,tmp_key,b);
// var plant =des_decrypt(en,tmp_key,b);

// console.log(plant);
console.log('--------------------------------------------------------')
var content ="test000001";
console.log(s1);
var aa =exports.aes_encrypt(content,s1.MD5(32),s1.MD5());
console.log(aa);
var bb = exports.aes_decrypt(aa,s1.MD5(32),s1.MD5());
console.log(bb);
// assert(s1==s2);
//明文 test000001
//密钥 tpypJ0DOMI5Q0GVRMB1rERjGpgxv0FdAJLL4rBi87YiRkDh2v1O030DOwIrdx3xF0rfgPnpvYKiHavrjM/JngOxDMRrKn0UXhfq7K2mj+zYEPzydMu81DdMeuBV8586OxynSal3yafvvJbVzns+E0ONUHnXRJNGnn5HfbHebtWWNIQvIvhM33NhQUwq+A4Q+O0mbbJdMRfssTklyzd7HNgkE2IjPnArScC/NS9ngmdyaPs9MNQBAleqRFNN99VYA
//密文 i/ACMRW0q2wOoSPtYS8MtA==

// var content = crypto.randomBytes(16).toString('base64');

// console.log("content ==============>",content)
// var a1 = exports.aes_encrypt(content,s11,'1234567890123456');
// console.log("encrypto==============>",a1);
// var a2 = exports.aes_decrypt(a1,s22,'1234567890123456');
// var aaa = new Buffer(a2);
// aaa = aaa.toString('base64');
// console.log("decrypt===============>",aaa);

// var content ="ddddddddddddddddddddddddddddd";
// var ss1 =hmac64(content,s1);
// var ss2 =hmac64(content,s2);
//97360db54b1777ec9efcafad521060b2
// var kk = new Buffer(s1,'utf8');
// console.log(kk);


// console.log(ss1);
// console.log(ss2);

// var a = crypto.randomBytes(24);
// var tmp_key = a.toString('base64');
// console.log(a.toString('base64'));

// var content2 = "??????????????????";

// var c = crypto.randomBytes(4);
// console.log(c.toString('base64'));

// var b = c.toString('base64');

// var en = des_encrypt(content2,tmp_key,b);
// var plant =des_decrypt(en,tmp_key,b);

// console.log(plant);




// var crypto = require('crypto');
// var key = '12345670';
// exports.des = {
 
//   algorithm:{ ecb:'des-ecb',cbc:'des-cbc' },
//   encrypt:function(plaintext,iv){
//     var key = new Buffer(key);
//     var iv = new Buffer(iv ? iv : 0);
//     var cipher = crypto.createCipheriv(this.algorithm.ecb, key, iv);
//     cipher.setAutoPadding(true) //default true
//     var ciph = cipher.update(plaintext, 'utf8', 'base64');
//     ciph += cipher.final('base64');
//     return ciph;
//   },
//   decrypt:function(encrypt_text,iv){
//     var key = new Buffer(key);
//     var iv = new Buffer(iv ? iv : 0);
//     var decipher = crypto.createDecipheriv(this.algorithm.ecb, key, iv);
//     decipher.setAutoPadding(true);
//     var txt = decipher.update(encrypt_text, 'base64', 'utf8');
//     txt += decipher.final('utf8');
//     return txt;
//   }
 
// };

// var crypto = require("crypto");
// var assert = require("assert");

// var diffieHellman1 = crypto.createDiffieHellman(256);
// var prime1 = diffieHellman1.getPrime('base64');
// var diffieHellman2 = crypto.createDiffieHellman(prime1, 'base64');
// var key1 = diffieHellman1.generateKeys();
// var key2 = diffieHellman2.generateKeys('hex');
// var secret1 = diffieHellman1.computeSecret(key2, 'hex', 'base64');
// var secret2 = diffieHellman2.computeSecret(key1, 'binary', 'base64');

// console.log(secret1);
// console.log(secret2);

// assert.equal(secret1, secret2);
var path = require('path');
var fs = require('fs');

var filename =path.resolve('../config/key/key_hall.pem');

console.log(filename)
var key = fs.readFileSync(filename).toString('base64');

console.log(key);