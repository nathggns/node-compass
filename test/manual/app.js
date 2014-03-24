var express = require('express');
var compass = require('../../index');

var app = express();

app.use(compass({ project : require('path').join(__dirname, 'public'), logging : true }));

app.use(express.static(__dirname + '/public'));

app.listen(8080);