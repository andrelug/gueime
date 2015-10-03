// config/database.js
var express = require('express'),
    app = express();

if('development' == app.get('env')) {
    module.exports = {
        'url': 'mongodb://localhost/gueime',
        'url2': 'mongodb://localhost/gueimesessions'
    }
}else{
    module.exports = {
        'url': 'mongodb://localhost/gueime',
        'url2': 'mongodb://localhost/gueimesessions'
    }
}