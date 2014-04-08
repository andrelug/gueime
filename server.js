require('newrelic');
var express = require('express')
  , http = require('http')
  , mongoose = require('mongoose')
  , passport = require('passport')
  , flash = require('connect-flash')
  , configDB = require('./config/database.js')
  , MongoStore = require('connect-mongo')(express)
  , path = require('path');

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
        mongoose_connection: gueimesessions
    }), secret: 'blablabladfkdaskldsfblkablafdsa34', cookie: { maxAge: 36000000 }
    })); // session secret
    app.use(passport.initialize());
    app.use(passport.session()); // persistent login sessions
    app.use(flash()); // use connect-flash for flash messages stored in session
    app.use(app.router);
    app.use(require('stylus').middleware(path.join(__dirname, 'public')));
    app.use(express.static(path.join(__dirname, 'public')));
    app.enable('trust proxy');
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// routes ======================================================================
require('./app/routes.js')(app, passport, mongoose); // load our routes and pass in our app and fully configured passport


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
