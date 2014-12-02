// config/database.js
var express = require('express'),
    app = express();

if('development' == app.get('env')) {
    module.exports = {

	    'facebookAuth' : {
		    'clientID' 		: '561543940541408', // your App ID
		    'clientSecret' 	: 'd550945b38741f8f0dde17027270218e', // your App Secret
		    'callbackURL' 	: 'http://localhost:55345/auth/facebook/callback'
	    },

	    'twitterAuth' : {
		    'consumerKey' 		: 'd7Nm9kGmddTbp8bVPd3IRWpAq',
		    'consumerSecret' 	: 'x2FJbmrix0HaHd0HXWpw5mLVbRvmalCnWLc83bxv481KMd9QeL',
		    'callbackURL' 		: 'http://localhost:55345/auth/twitter/callback'
	    },

	    'googleAuth' : {
		    'clientID' 		: '255367409904.apps.googleusercontent.com',
		    'clientSecret' 	: '99dda7gFKNaONJL6rg23odNZ',
		    'callbackURL' 	: 'http://localhost:55345/auth/google/callback'
	    }

    };
}else{
    module.exports = {

	    'facebookAuth' : {
		    'clientID' 		: '561543940541408', // your App ID
		    'clientSecret' 	: 'd550945b38741f8f0dde17027270218e', // your App Secret
		    'callbackURL' 	: 'http://www.gueime.com.br/auth/facebook/callback'
	    },

	    'twitterAuth' : {
		    'consumerKey' 		: 'd7Nm9kGmddTbp8bVPd3IRWpAq',
		    'consumerSecret' 	: 'x2FJbmrix0HaHd0HXWpw5mLVbRvmalCnWLc83bxv481KMd9QeL',
		    'callbackURL' 		: 'http://www.gueime.com.br/auth/twitter/callback'
	    },

	    'googleAuth' : {
		    'clientID' 		: '255367409904.apps.googleusercontent.com',
		    'clientSecret' 	: '99dda7gFKNaONJL6rg23odNZ',
		    'callbackURL' 	: 'http://www.gueime.com.br/auth/google/callback'
	    }

    };
}

// config/auth.js

// expose our config directly to our application using module.exports
