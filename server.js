var express = require('express')
  , http = require('http')
  , mongoose = require('mongoose')
  , passport = require('passport')
  , flash = require('connect-flash')
  , configDB = require('./config/database.js')
  , MongoStore = require('connect-mongo')(express)
  , path = require('path');




  // DASHBOARD


// END DASHBOARD

var app = express();

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

var gueimesessions = mongoose.createConnection(configDB.url2);

require('./config/passport')(passport); // pass passport for configuration

app.configure(function () {
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.logger('dev'));
	app.use(express.bodyParser({ keepExtensions: true, uploadDir: "uploads" }));
	app.use(express.cookieParser());
	app.use(express.methodOverride());
	app.use(express.session({ store: new MongoStore({
		mongooseConnection: gueimesessions
	}), secret: 'blablabladfkdaskldsfblkablafdsa34', cookie: { maxAge: 2419200000 }
	})); // session secret
	app.use(passport.initialize());
	app.use(passport.session()); // persistent login sessions
	app.use(flash()); // use connect-flash for flash messages stored in session
	app.use(function (req, res, next) { // make sure no trailing slashes
		if (req.path.substr(-1) == '/' && req.path.length > 1) {
			var query = req.url.slice(req.path.length);
			res.redirect(301, req.path.slice(0, -1) + query);
		} else {
			next();
		}
	});

	app.use(require('forest-express-mongoose').init({
  modelsDir: __dirname + '/app/models', // Your models directory.
  secretKey: 'da330be54621c0185d0d1871aba7f18a0c8d24a92dd50971a8e4cfcb7fba6a00',
  authKey: 'eCiI!qu$jy(OvvL(', // Choose a secret authentication key.
  mongoose: require('mongoose') // The mongoose database connection.
}));

	app.use(app.router);
	app.use(require('stylus').middleware(path.join(__dirname, 'public')));
	app.use(express.static(path.join(__dirname, 'public'), { maxAge: 86400000 }));
	if ('development' !== app.get('env')) {
		app.use(function (req, res) {
			var user = req.user;
			res.status(400);
			if (!user) {
				res.render('404', { title: '404: File Not Found' });
			} else {
				res.render('404', { title: '404: File Not Found', user: user });
			}

		});
		app.use(function (error, req, res, next) {
			var user = req.user;
			res.status(500);
			if (!user) {
				res.render('500', { title: '500: Internal Server Error', error: error });
			} else {
				res.render('500', { title: '500: Internal Server Error', error: error, user: user });
			}

		});
		app.get('/*', function(req, res, next) {
			  if (req.headers.host.match(/^www/) === null ) {
				res.redirect(301, 'http://' + "www.gueime.com.br" + req.url);
			  } else {
				next();
			  }
		  });
	}
	app.enable('trust proxy');
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// routes ======================================================================
require('./app/routes.js')(app, passport, mongoose); // load our routes and pass in our app and fully configured passport
require('./app/personalized.js')(app, passport, mongoose); // load our routes and pass in our app and fully configured passport



app.use(function(error, req, res, next) {
	res.status(500);
	res.render('500.jade', {title:'500: Internal Server Error', error: error});
});


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
