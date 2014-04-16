var newrelic = require('newrelic');
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
    }), secret: 'blablabladfkdaskldsfblkablafdsa34', cookie: { maxAge: 172800000 }
    })); // session secret
    app.use(passport.initialize());
    app.use(passport.session()); // persistent login sessions
    app.use(flash()); // use connect-flash for flash messages stored in session
    app.use(app.router);
    app.use(require('stylus').middleware(path.join(__dirname, 'public')));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(function(error, req, res, next) {
            res.status(500);
            res.render('500.jade', {title:'500: Internal Server Error', error: error});
        });
        app.use(function(req, res, next){
      res.status(404);

      // respond with html page
      if (req.accepts('html')) {
        res.render('404', { url: req.url });
        return;
      }

      // respond with json
      if (req.accepts('json')) {
        res.send({ error: 'Not found' });
        return;
      }

      // default to plain-text. send()
      res.type('txt').send('Not found');
    });
    app.enable('trust proxy');
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


// New Relic
app.locals.newrelic = newrelic;

// routes ======================================================================
require('./app/routes.js')(app, passport, mongoose); // load our routes and pass in our app and fully configured passport


// ERRORS ROUTES
app.get('/404', function(req, res, next){
  // trigger a 404 since no other middleware
  // will match /404 after this one, and we're not
  // responding here
  next();
});

app.get('/403', function(req, res, next){
  // trigger a 403 error
  var err = new Error('not allowed!');
  err.status = 403;
  next(err);
});

app.get('/500', function(req, res, next){
  // trigger a generic (500) error
  next(new Error('keyboard cat!'));
});



app.use(function(error, req, res, next) {
    res.status(500);
    res.render('500.jade', {title:'500: Internal Server Error', error: error});
});


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
