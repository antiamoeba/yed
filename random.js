var express = require('express');
var app = express();
var fs = require('fs');
var http = require('http').Server(app);
app.get('/home', function(req, res) {
    var name = req.query.name;
    res.send("Hi " + name);
});
http.listen(process.env.PORT, function(){
	console.log('listening on *:3000');
});