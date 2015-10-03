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
        'url': 'mongodb://gueime:Watashiwa1!@ds027748.mongolab.com:27748/gueimeProd',
        'url2': 'mongodb://gueime:Watashiwa1!@ds027748.mongolab.com:27748/gueimeProdSessions'
    }
}