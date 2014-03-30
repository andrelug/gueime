// config/database.js
var express = require('express'),
    app = express();

if('development' == app.get('env')) {
    module.exports = {

	    'facebookAuth' : {
		    'clientID' 		: '471413439653703', // your App ID
		    'clientSecret' 	: 'b7c033b4c7877410afc5e25493b299ae', // your App Secret
		    'callbackURL' 	: 'http://localhost:24279/auth/facebook/callback'
	    },

	    'twitterAuth' : {
		    'consumerKey' 		: 'VW9Qu0dlq9cKE5TlkU3joQ',
		    'consumerSecret' 	: '8Hg3uADYMHSCouhe9W8YmtN3QWf6q1eXf1xBJbUnf8c',
		    'callbackURL' 		: 'http://localhost:24279/auth/twitter/callback'
	    },

	    'googleAuth' : {
		    'clientID' 		: '886140459979-r26dp1t5it9a8oc6cjevhe0p4mrvr2te.apps.googleusercontent.com',
		    'clientSecret' 	: 'nKSXebFZEen0mmKB8WuuIXuK',
		    'callbackURL' 	: 'http://localhost:24279/auth/google/callback'
	    }

    };
}else{
    module.exports = {

	    'facebookAuth' : {
		    'clientID' 		: '471413439653703', // your App ID
		    'clientSecret' 	: 'b7c033b4c7877410afc5e25493b299ae', // your App Secret
		    'callbackURL' 	: 'http://www.numbersclash.com/auth/facebook/callback'
	    },

	    'twitterAuth' : {
		    'consumerKey' 		: 'VW9Qu0dlq9cKE5TlkU3joQ',
		    'consumerSecret' 	: '8Hg3uADYMHSCouhe9W8YmtN3QWf6q1eXf1xBJbUnf8c',
		    'callbackURL' 		: 'http://www.numbersclash.com/auth/twitter/callback'
	    },

	    'googleAuth' : {
		    'clientID' 		: '886140459979-r26dp1t5it9a8oc6cjevhe0p4mrvr2te.apps.googleusercontent.com',
		    'clientSecret' 	: 'nKSXebFZEen0mmKB8WuuIXuK',
		    'callbackURL' 	: 'http://www.numbersclash.com/auth/google/callback'
	    }

    };
}

// config/auth.js

// expose our config directly to our application using module.exports
