var app = require('express')();
var fs = require('fs');
var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync('./certificate/private.pem', 'utf8');
var certificate = fs.readFileSync('./certificate/file.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);
var PORT = 18080;
var SSLPORT = 18081;

exports.start = function(){
    httpServer.listen(PORT, function() {
        console.log('HTTP Server is running on: http://localhost:%s', PORT);
    });
    httpsServer.listen(SSLPORT, function() {
        console.log('HTTPS Server is running on: https://localhost:%s', SSLPORT);
    });
}

// Welcome
app.get('/', function(req, res) {
    if(req.protocol === 'https') {
        res.status(200).send('Welcome to Safety Land!');
    }
    else {
        res.status(200).send('Welcome!');
    }
});

app.get('/hello',function(req,res){
    var args = req.query;
    if(req.protocol === 'https'){
        res.status(200).send({hello:'Hello',status:'0',msg:'Success',type:'https',query:args})
    }else{
        res.status(200).send({hello:'Hello',status:'0',msg:'Success',type:'http',query:args})        
    }
});

app.get('/good',function(req,res){
    var args = req.query
    if(req.protocol === 'https'){
        res.status(200).send({good:'good',status:'0',msg:'Success',type:'https',query:args})
    }else{
        res.status(200).send({good:'good',status:'0',msg:'Success',type:'http',query:args})        
    }
})