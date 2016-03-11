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
        'url': "mongodb://gueimeProd:0Gdf4l6V_wO_fckqbkpdiKP3AEk5Z.LNkNOhdkS0plo-@ds027748.mongolab.com:27748/gueimeProd",
        'url2': "mongodb://gueimeProdSessions:eax8mm2JbFPuhblHCKMxojb55hCtGAgRkgZsRLinAy4-@ds027748.mongolab.com:27748/gueimeProdSessions"
    }
}
