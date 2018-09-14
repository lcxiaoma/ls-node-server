var secret = require('../utils/secret');
var http = require('../utils/http');
var logger = require('./log').log_http;
// http.init(logger, "TEST")
// //和大厅交互生成密钥

// var my_key = null;
// var private_key = null;

// var config = {
//     HALL_IP: '192.168.0.152',
//     HALL_PORT: '9001',
// }

// function gen_secret(callback) {
//     var challenge = null;//用于握手验证
//     var key_hall = null;
//     var blob = secret.dh64_gen_key();
//     var public_key = blob.getPublicKey('base64');
//     var rd_str = secret.random_b64() + Date.now();
//     my_key = secret.md5_16(rd_str);
//     http.get(config.HALL_IP, config.HALL_PORT, '/who', { key1: my_key, key2: public_key }, function (ret, data) {
//         if (ret == true) {
//             if (data.errcode != 0) {
//                 logger.error("WHO:", data.errcode);
//                 callback(false);
//                 return;
//             } else {
//                 challenge = data.challenge;
//                 key_hall = data.key;
//                 var hall_secret = secret.dh64_secret(blob, key_hall);
//                 if (hall_secret == null) {
//                     callback(false);
//                     return;
//                 }
//                 var hmac = secret.hmac64(challenge, hall_secret);
//                 // console.log(hall_secret);
//                 // console.log(hmac);
//                 http.get(config.HALL_IP, config.HALL_PORT, '/challenge', { key1: my_key, key2: hmac }, function (ret, data) {
//                     if (ret == true) {
//                         if (data.errcode != 0) {
//                             logger.error("CHALLENGE:", data.errcode);
//                             callback(false);
//                             return;
//                         } else {
//                             //握手成功后服务器下发随机的密钥
//                             // var encypt=  data.data;
//                             // var plant = secret.aes_decrypt(encypt,hall_secret);
//                             // console.log("hall_secret====>",hall_secret);
//                             // console.log("en ------=========>",data.data);
//                             // console.log("show me ==========>",plant);
//                             private_key = hall_secret;
//                             callback(true);
//                         }
//                     }
//                 })
//             }
//         }
//     });
// }


// gen_secret(function (ret) {
//     if (ret) {
//         console.log(my_key);
//         console.log(private_key);
//         var data = {
//             account: 'guest_aaa1',
//             target: 10002,
//             ingot: 10,
//         };
//         http.crypto_get(config.HALL_IP, config.HALL_PORT, '/give_ingot', data, private_key, my_key, function (ret, data) {
//             if (ret) {
//                 console.log("SUCCESS===>", data);
//             } else {
//                 console.log("failed.")
//             }
//         })

//     } else {
//         console.error("failed.")
//     }
// })
// console.log("===========================================================================")

// // var blob1 = secret.dh64_gen_key();

// // var blob2 = secret.dh64_gen_key();

// // var p1= blob1.getPublicKey('base64');
// // var pr1 = blob1.getPrivateKey('base64');
// // var prim1 = blob1.getPrime('base64');

// // var p2= blob2.getPublicKey('base64');
// // var pr2 = blob2.getPrivateKey('base64');
// // var prim2 = blob2.getPrime('base64');

// // console.log("===========================================================================")
// // console.log(p1)
// // console.log(pr2)
// // console.log(prim1)
// // console.log("===========================================================================")
// // console.log("===========================================================================")
// // console.log(p2)
// // console.log(pr1)
// // console.log(prim2)
// // console.log("===========================================================================")

// var p1 = 'HN2iZuAuVCkEh3oGaq5vNd6LD3scaRomnzrsOX6jeVD8Qcq0gVO6zNggxgfeNfi14tOro0CfVTZBCWTTcKxT548zHFxcqpoaAxS1klZ/CTusdREPfR5ELGG1Kl/leQ3/H9uRI/Qgl0SCcXSRCeJAbUMBFp2f8kTq5vDz0qQlyHX/u6U72WOZQ/SBrKcglF6ENJEJvjb8mGJvifr6PURrTMhAnCt+oUzn5xHTW4LfVIicwzstZf9SMvFq8ZilsB0i';
// var pr2 = 'TP8n61zxW/xyLsGeWG2HDr+2shZI334wAy7Rta3GPYQROh7G1etEwU64WgXGKm1bF6tPRKsVZ1fW6CZuqsbqrOgN0PpsITQcvtpxSJS4+BUQCepNAJpzG8PxBxnCvxRv6sx2PiKIhKoCpRETN+6Ygm/aloovytj9Fm5UP8MM8kUvb9v6ZrnnSrp7Blfc3zI7Ys8J4SFAoVFaexlm2aAMcJP8kmdTtU0KqGIfwjC5/1TKAH0kNfiX76qJKbJEROzL';
// var prim1 ='///////////JD9qiIWjCNMTGYouA3BzRKQJOCIpnzHQCC76mOxObIlFKCHmONATd75UZs806QxswKwpt8l8UN0/hNW1tUcJF5IW1dmJefsb0TELppjftawv/XLb0Brft7jhr+1qJn6WunyQRfEsf5kkoZlHs5Fs9wgB8uKFjvwWY2kg2HFXTmmkWP6j9JM9fg2VdI9yjrZYcYvNWIIVSu57VKQdwlpZtZww1Tkq8mATxdGwIyiNzJ///////////'
// var p2 = 'W/bwJCXKvxgVPyGXlhyyQtAzrgHYj/kUzUMy0WcPYXv4Rm87CaIq4fToA4Ehp4tLhqf05YGJ4cWDYuolVil769OuniMRlBNfAXBclz9AoVz1q5pxsSk+p6Q63X3VWYruM1WDvKJhmIeXmlu4ZD0wFagkCXflCx3ld/x2JgoS0sidzE2JxN/PwU1ikNA4cUsOsOgXBVUUkld0amWFzeAM1VHAGvedVPcmLS9QJGcrkJFC9KwWBiglubOkM6BRgaYT';
// var pr1 = 'bKY8phvjaOethvWUA4SHbOCBPZKmgJeK0rkMKodw/n15E2E9WAa/6p2JIeohh+Q1wLZOM60Qx4dsB36rQsv1NR/bsUtx2YKGmmHw61Cm0WOIcBxPqSAyCJLXgoFtswfBQARCNR93RUjVw52iYN3tnZmahoZKwHhxDJlwqkF36mw9M9Y2F6Ldzxy/7UqTN7vi9/ZiNiRK8RTZv7wyw9ySomDdmgL+zR1QCgFWO/Qz7fDNtkuoZQafsI2l1t+6GegU';
// var prim2 ='///////////JD9qiIWjCNMTGYouA3BzRKQJOCIpnzHQCC76mOxObIlFKCHmONATd75UZs806QxswKwpt8l8UN0/hNW1tUcJF5IW1dmJefsb0TELppjftawv/XLb0Brft7jhr+1qJn6WunyQRfEsf5kkoZlHs5Fs9wgB8uKFjvwWY2kg2HFXTmmkWP6j9JM9fg2VdI9yjrZYcYvNWIIVSu57VKQdwlpZtZww1Tkq8mATxdGwIyiNzJ///////////';

// var crypto = require('crypto')

// var bloba = crypto.createDiffieHellman(prim1,'base64');

// bloba.setPrivateKey(pr1, 'base64');


// var blobb = crypto.createDiffieHellman(prim2,'base64');
// blobb.setPrivateKey(pr2, 'base64');


// var sa = bloba.computeSecret(p2, 'base64','base64');

// var sb = blobb.computeSecret(p1, 'base64','base64');

// console.log(sa === sb);

var crypto = require('crypto')
function random_b64(account){
    var a = crypto.randomBytes(16).toString('hex');
    var b = secret.md5_16(account);
    var c =new Buffer(b+a,'hex');
    return c.toString('base64')
}

console.log(random_b64("guest_aaa1"))

var str ="jsapi_ticket=HoagFKDcsGMVCIY2vOjf9oIN80WmMlwkwM1q3RWrF3vvDvzBd_Vb3sVzls2rP0vubiCfjejomrJQOmDNwXG0VQ&noncestr=eUTyGgxAPUHKYrm/xcf/I6vdbX0uTAPw&timestamp=149925327&url=http://assets.totorotec.com/web-mobile/index.html?code=051pTa1y1DFEFf06Xn2y1jkg1y1pTa1T&state=STATE"
function get_sha1(utf8_str){
    var sha1 = crypto.createHash('sha1');
    sha1.update(utf8_str);
    return sha1.digest('hex');
}

console.log(get_sha1(str))



var str ="http://awdadw.com?web_args=channel$wechat_default"

var v = str.split('$$')[0].split('$')

console.log(v)

var str = "柚子."

var s = new Buffer(str,'utf8').toString('base64')

console.log(s)