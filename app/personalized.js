var Users = require('./models/user'),
    Artigos = require('./models/article'),
    Games = require('./models/game'),
    Search = require('./models/search'),
    Console = require('./models/console'),
    Product = require('./models/product'),
    DevPub = require('./models/devPub'),
    Genre = require('./models/genre'),
    Grid = require('./models/grid'),
    func = require('../config/functions'),
    facebook = require('../config/facebook.js'),
    ip = require('ip'),
    fs = require("fs"),
    transloadit = require('node-transloadit'),
    async = require('async'),
    mandrill = require('mandrill-api/mandrill'),
    mandrill_client = new mandrill.Mandrill('9OnGzepS5J_rDmLYVSjWnQ'),
    Feed = require('feed'),
    google = require('googleapis');

var client = new transloadit('195786e09f8911e495eae1be63259780', '360133efc358574ed2fef9c645c5fb62f65623af');

// Session check function
/*
var sessionReload = function(req, res, next){
    if('HEAD' == req.method || 'OPTIONS' == req.method){
        return next();
    }else{
        req.session._garbage = Date();
        req.session.touch();
    }
}
*/

var plusView = function(user){
    //check level
    var addLevel,
        points = user.gamification.points;

    if (points >= 100 && points < 300){
        addLevel = 2;
    } else if(points >= 300 && points < 600){
        addLevel = 3;
    } else if(points >= 600 && points < 1000){
        addLevel = 4;
    } else if(points >= 1000 && points < 2000){
        addLevel = 5;
    } else if(points >= 2000 && points < 3000){
        addLevel = 6;
    } else if(points >= 3000 && points < 4000){
        addLevel = 7;
    } else if(points >= 4000 && points < 5500){
        addLevel = 8;
    } else if(points >= 5500 && points < 7000){
        addLevel = 9;
    } else if(points >= 7000 && points < 10000){
        addLevel = 10;
    } else if(points >= 10000 && points < 15000){
        addLevel = 11;
    } else{
        addLevel = user.gamification.level;
    }
    Users.update({'_id': user._id}, {$inc: {'graph.visits': 1}, $set: {'gamification.level': addLevel}}, function(err){

    });
};

var managePoints = function(userId, points){
    Users.update({_id: userId},{$inc: {'gamification.points': points}}, function(err){

    });
};


module.exports = function (app, passport, mongoose) {

    // SÓ ARTIGOS
    app.get('/artigos', function (req, res) {
        var user = req.user,
            status = req.query.status,
            gameStr,
            searchTag = req.query.t;

        if (!user) {
            Artigos.find({ status: 'publicado', type: 'artigo' }, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ publishDate: -1 }).limit(6).exec(function (err, docs) {

                res.render('index', { title: "Os mais novos artigos", docs: docs, status: status, type: 'artigo' });
            });
        } else {
            if (user.deleted === true) {
                res.redirect('/users/restore');
            } else {
                // sessionReload(req, res, next);

                async.parallel([
                        function (cb) {
                            Artigos.find({ status: 'publicado', type: 'artigo' }, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ publishDate: -1 }).limit(6).exec(cb);
                        },
                        function (cb) {
                            Users.update({ '_id': user }, { $inc: { 'graph.visits': 1} }, cb);
                        }
                    ], function (err, result) {
                        res.render('index', { user: user, title: "Os mais novos artigos", docs: result[0], status: status, type: 'artigo' });
                    });
            }
        }
    });

    // SÓ NOTÍCIAS
    app.get('/noticias', function (req, res) {
        var user = req.user,
            status = req.query.status,
            gameStr,
            searchTag = req.query.t;

        if (!user) {
            Artigos.find({ status: 'publicado', type: 'noticia' }, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ publishDate: -1 }).limit(6).exec(function (err, docs) {

                res.render('index', { title: "As mais novas notícias", docs: docs, status: status, type: 'noticia' });
            });
        } else {
            if (user.deleted === true) {
                res.redirect('/users/restore');
            } else {
                // sessionReload(req, res, next);

                async.parallel([
                        function (cb) {
                            Artigos.find({ status: 'publicado', type: 'noticia' }, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ publishDate: -1 }).limit(6).exec(cb);
                        },
                        function (cb) {
                            Users.update({ '_id': user }, { $inc: { 'graph.visits': 1} }, cb);
                        }
                    ], function (err, result) {
                        res.render('index', { user: user, title: "As mais novas notícias", docs: result[0], status: status, type: 'noticia' });
                    });
            }
        }
    });

    // SÓ ANALISES
    app.get('/analises', function (req, res) {
        var user = req.user,
            status = req.query.status,
            gameStr,
            searchTag = req.query.t;

        if (!user) {
            Artigos.find({ status: 'publicado', type: 'analise' }, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ publishDate: -1 }).limit(6).exec(function (err, docs) {

                res.render('index', { title: "As mais novas análises", docs: docs, status: status, type: 'analise' });
            });
        } else {
            if (user.deleted === true) {
                res.redirect('/users/restore');
            } else {
                // sessionReload(req, res, next);

                async.parallel([
                        function (cb) {
                            Artigos.find({ status: 'publicado', type: 'analise' }, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ publishDate: -1 }).limit(6).exec(cb);
                        },
                        function (cb) {
                            Users.update({ '_id': user }, { $inc: { 'graph.visits': 1} }, cb);
                        }
                    ], function (err, result) {
                        res.render('index', { user: user, title: "As mais novas análises", docs: result[0], status: status, type: 'analise' });
                    });
            }
        }
    });

    // SÓ VÍDEOS
    app.get('/videos', function (req, res) {
        var user = req.user,
            status = req.query.status,
            gameStr,
            searchTag = req.query.t;

        if (!user) {
            Artigos.find({ status: 'publicado', type: 'video' }, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ publishDate: -1 }).limit(6).exec(function (err, docs) {

                res.render('index', { title: "Mais novos vídeos", docs: docs, status: status, type: 'video' });
            });
        } else {
            if (user.deleted === true) {
                res.redirect('/users/restore');
            } else {
                // sessionReload(req, res, next);

                async.parallel([
                        function (cb) {
                            Artigos.find({ status: 'publicado', type: 'video' }, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ publishDate: -1 }).limit(6).exec(cb);
                        },
                        function (cb) {
                            Users.update({ '_id': user }, { $inc: { 'graph.visits': 1} }, cb);
                        }
                    ], function (err, result) {
                        res.render('index', { user: user, title: "Mais novos vídeos", docs: result[0], status: status, type: 'video' });
                    });
            }
        }
    });


    // PAGINAÇÃO PARA TIPOS
    app.get('/pagination/:type', function (req, res) {
        n = req.query.n;
        type = req.params.type;

        var searchStr = [];

        if (!req.query.str) {
            Artigos.find({ status: 'publicado', type: type }, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ publishDate: -1 }).limit(6).skip(n).exec(function (err, docs) {

                res.render('loadMore', { docs: docs });
            });
        } else {
            for (i = 0; i < req.query.str.length; i++) {
                searchStr.push(func.string_to_slug(req.query.str[i]));
                if (searchStr[i].indexOf('-') > -1) {
                    searchStr[i] = searchStr[i].split(/[\s,-]+/);
                }
            }
            searchStr = searchStr.toString().split(',');

            Artigos.find({ facet: { $all: searchStr }, status: 'publicado', type: type }, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ publishDate: -1 }).limit(6).skip(n).exec(function (err, docs) {

                res.render('loadMore', { docs: docs });
            });
        }
    });




    // NEW DASHBOARD
    var key = require('../node_modules/dashboard-ff2427dd9389.json');
    var jwtClient = new google.auth.JWT(key.client_email, null, key.private_key, ['https://www.googleapis.com/auth/analytics.readonly'], null);
    var VIEW_ID = 'ga:92206921';
    var VIEW_ID_BLOG = "ga:91195968";

    app.get('/dashboard', function (req, res) {
        var user = req.user;
        var analyticsValues;

        // Google Analytics

        function queryData(analytics, viewId, callback) {
          analytics.data.ga.get({
            'auth': jwtClient,
            'ids': viewId,
            'metrics': 'ga:sessions',
            'dimensions': 'ga:date',
            'start-date': '30daysAgo',
            'end-date': 'today',
//            'sort': '-ga:uniquePageviews',
//            'max-results': 10,
//            'filters': 'ga:pagePath=~/ch_[-a-z0-9]+[.]html$',
          }, function (err, response) {
            if (err) {
              console.log(err);
              return;
            }
//            console.log(JSON.stringify(response, null, 4));
            analyticsValues = JSON.stringify(response, null, 4);
            console.log(analyticsValues)
            callback(analyticsValues);
          });
      }
          if (!user) {
              Grid.findOne({ name: "1" }, function (err, docs) {
                  var query;
                  jwtClient.authorize(function(err, tokens){
                          if(err){
                              console.log(err);
                              return;
                          }
                          var analytics = google.analytics('v3');
                          queryData(analytics, "ga:92206921", function(query){
                            queryData(analytics, "ga:91195968", function(queryBlog){
                                res.render('dash/index', { grid: docs.grid, values: query, valuesBlog: queryBlog });
                            });
                          });

                      });

              });
          } else {
              var widgets = [];
              for (i = 0; i < user.dashboard.widget.length; i++) {
                  console.log('esse é ' + user.dashboard.widget[i]);
                  switch (user.dashboard.widget[i]) {
                      case 'top':
                          Artigos.find({ status: 'publicado' }, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ 'graph.views': -1 }).limit(10).exec(function (err, docs) {
                              widgets = docs;
                              console.log(user.dashboard.grid[0]);
                              res.render('dash/index', { user: user, widget: widgets, grid: JSON.stringify(user.dashboard.grid) });
                          });
                  }
              }
          }
    });

    app.get('/mydash', function (req, res) {
        var user = req.user;

          if (!user) {
              Grid.findOne({ name: "1" }, function (err, docs) {
                  res.render('dash/my');

              });
          } else {
              var widgets = [];
              for (i = 0; i < user.dashboard.widget.length; i++) {
                  console.log('esse é ' + user.dashboard.widget[i]);
                  switch (user.dashboard.widget[i]) {
                      case 'top':
                          Artigos.find({ status: 'publicado' }, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ 'graph.views': -1 }).limit(10).exec(function (err, docs) {
                              widgets = docs;
                              console.log(user.dashboard.grid[0]);
                              res.render('dash/index', { user: user, widget: widgets, grid: JSON.stringify(user.dashboard.grid) });
                          });
                  }
              }
          }
    });

    app.post('/grid', function (req, res) {
        var thisGrid = req.body.grid;

        Grid.update({"name": "1"},{
            grid: thisGrid
        }, function(err){
            res.send('OK');
        });

    });
};
