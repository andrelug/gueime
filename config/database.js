// config/database.js
var express = require('express'),
    app = express();

if('development' == app.get('env')) {
    module.exports = {
        'url': 'mongodb://localhost/gueime',
        'url2': 'mongodb://localhost/gueimesessions',
		'forest': 'da330be54621c0185d0d1871aba7f18a0c8d24a92dd50971a8e4cfcb7fba6a00'
    }
}else{
    module.exports = {
        'url': process.env.CUSTOMCONNSTR_MONGOLAB_URI,
        'url2': process.env.CUSTOMCONNSTR_MONGOLAB_URIA,
		'forest': process.env.CUSTOMCONNSTR_FOREST
    }
}
