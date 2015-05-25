var Users = require('./models/user'),
    Artigos = require('./models/article'),
    Games = require('./models/game'),
    Search = require('./models/search'),
    Console = require('./models/console'),
    Product = require('./models/product'),
    DevPub = require('./models/devPub'),
    Genre = require('./models/genre'),
    func = require('../config/functions'),
    facebook = require('../config/facebook.js'),
    ip = require('ip'),
    fs = require("fs"),
    transloadit = require('node-transloadit'),
    async = require('async'),
    mandrill = require('mandrill-api/mandrill'),
    mandrill_client = new mandrill.Mandrill('9OnGzepS5J_rDmLYVSjWnQ'),
    Feed = require('feed');

var client = new transloadit('6a960970bff411e38b2aefa7e162a72d', '293a0ad266df65f8e8396cb6d972da8d14f2e608');

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
}

var managePoints = function(userId, points){
    Users.update({_id: userId},{$inc: {'gamification.points': points}}, function(err){
        
    });
}

module.exports = function (app, passport, mongoose) {

    // =====================================
    // HOME PAGE ===========================
    // =====================================
    app.get('/', function (req, res, next) {
        var user = req.user,
            status = req.query.status,
            gameStr,
            searchTag = req.query.t;

        if(searchTag){
            var searchStr = [];

            searchStr = searchTag.split('-');
                    
            if(searchTag != undefined){
                gameStr = searchTag.split('-').join(' ');
            } else{
                gameStr = 0
            }

            if (!user) {
                async.parallel([
                    function(cb){
                        Artigos.find({$or: [{ facet: { $all: searchStr}, status: 'publicado' }, {title: new RegExp(gameStr, 'i'), status: 'publicado'}]}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({publishDate: -1}).limit(6).exec(cb);
                    },
                    function(cb){
                        Games.find({status: 'publicado', title: new RegExp(gameStr, 'i') }, cb);
                    }
                ], function(err, result){
                    res.render('index', { title: "O melhor site de games do Brasil!", docs: result[0], games: result[1], searchTag: searchTag, status: status});
                });
            } else {
                if(user.deleted == true){
                    res.redirect('/users/restore');
                } else {
                    // sessionReload(req, res, next);

                    
                    async.parallel([
                        function(cb){
                            Artigos.find({$or: [{ facet: { $all: searchStr}, status: 'publicado' }, {title: new RegExp(gameStr, 'i'), status: 'publicado'}]}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({publishDate: -1}).limit(6).exec(cb);
                        },
                        function(cb){
                            Games.find({status: 'publicado', title: new RegExp(gameStr, 'i') }, cb);
                        },
                        function(cb){
                            Users.update({'_id': user}, {$inc: {'graph.visits': 1}}, cb);
                        }
                    ], function(err, result){
                        res.render('index', { user: user, title: "O melhor site de games do Brasil!", docs: result[0], games: result[1], searchTag: searchTag, status: status});
                    });
                }
            }
        } else {
            if (!user) {
                Artigos.find({status: 'publicado'}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({publishDate: -1}).limit(6).exec(function (err, docs) {

                    res.render('index', { title: "O melhor site de games do Brasil!", docs: docs, status: status});
                });
            } else {
                if(user.deleted == true){
                    res.redirect('/users/restore');
                } else {
                    // sessionReload(req, res, next);

                    async.parallel([
                        function(cb){
                            Artigos.find({status: 'publicado'}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({publishDate: -1}).limit(6).exec(cb);
                        },
                        function(cb){
                            Users.update({'_id': user}, {$inc: {'graph.visits': 1}}, cb);
                        }
                    ], function(err, result){
                        res.render('index', { user: user, title: "O melhor site de games do Brasil!", docs: result[0], status: status});
                    });
                }
            }
        }
    });

    /*
    // Fix Route for publishDate
    app.get('/fix', function(req, res){
        Artigos.find({status: 'publicado'}).exec(function(err, docs){
            var number = 0;
            for(i=0; i < docs.length; i++){
                Artigos.findOneAndUpdate({ '_id': docs[i].id }, { $set: {
                    publishDate: new Date()
                }}, function (err, docs) {
                    number = number + 1;
                    if (number >= 215){
                        res.send('ok');
                    }
                });
            }
            
        });
    });
    */

    // AUTOCOMPLETE
    app.get('/autocomplete', function(req, res){
        data = req.query.query;

        async.parallel([
            function(cb){
                Artigos.find({facet: new RegExp(data, 'i')}, {facet: 1, _id: 0}, cb)
            },
            function(cb){
                Games.find({title: new RegExp(data, 'i')}, {title: 1, _id: 0}, cb)
            },
            function(cb){
                DevPub.find({title: new RegExp(data, 'i')}, {title: 1, _id: 0}, cb)
            }
        ], function(err, result){

            console.log(result);
            var sendArray = [];
            for(i=0; i < result[0].length; i++){
                sendArray.push(result[0][i].facet);
            }
            for(i=0; i < result[1].length; i++){
                sendArray.push(result[1][i].title);
            }
            for(i=0; i < result[2].length; i++){
                sendArray.push(result[2][i].title);
            }

            sendArray = sendArray.toString().toLowerCase().split(',');

            var uniqueArray = sendArray.filter(function(elem, pos) {
                return sendArray.indexOf(elem) == pos;
            });

            var filtered = (function(pattern){
                var filtered = [], i = uniqueArray.length, re = new RegExp(pattern, 'i');
                while (i--) {
                    if (re.test(uniqueArray[i])) {
                        filtered.push(uniqueArray[i]);
                    }
                }
                return filtered;
            })(data);

            send = {
                suggestions: filtered
            }

            res.end(JSON.stringify(send));
        });
    });


    // PAGINAÇÃO 
    app.get('/pagination', function(req, res){
        n = req.query.n;

        var searchStr = [];

        if (!req.query.str) {
            Artigos.find({status: 'publicado'}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({publishDate: -1}).limit(6).skip(n).exec(function (err, docs) {

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

            Artigos.find({ facet: { $all: searchStr}, status: 'publicado' }, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({publishDate: -1}).limit(6).skip(n).exec(function (err, docs) {

                res.render('loadMore', { docs: docs });
            });
        }
    });

    // TRENDING
    app.get('/trending', function(req, res){
        var user = req.user;
        if(!user){
            if (req.xhr === true) {
                Artigos.find({status: 'publicado'}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ 'graph.views': -1 }).limit(12).exec(function (err, docs) {
                    res.render('tags', { docs: docs});
                });
            } else {
                Artigos.find({status: 'publicado'}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ 'graph.views': -1 }).limit(12).exec(function (err, docs) {
                    res.render('index', { user: user, title: "O melhor site de games do Brasil!", docs: docs});
                });
            
            }
        } else {
            if (req.xhr === true) {
                Artigos.find({status: 'publicado'}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ 'graph.views': -1 }).limit(12).exec(function (err, docs) {
                    res.render('tags', { docs: docs});
                });
            } else {
                Artigos.find({status: 'publicado'}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ 'graph.views': -1 }).limit(12).exec(function (err, docs) {
                    res.render('index', { title: "O melhor site de games do Brasil!", docs: docs});
                });
            
            }
        }
        
    });


    // BUSCA TAGS
    app.get('/tags', function (req, res) {
        var user = req.user;
        var searchStr = [];

        if (!req.query.str) {
            Artigos.find({status: 'publicado'}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ '_id': -1 }).limit(6).exec(function (err, docs) {

                res.render('tags', { docs: docs});

            });
        } else {
            for (i = 0; i < req.query.str.length; i++) {
                searchStr.push(func.string_to_slug(req.query.str[i]));
                if (searchStr[i].indexOf('-') > -1) {
                    searchStr[i] = searchStr[i].split(/[\s,-]+/);
                }
            }
            searchStr = searchStr.toString().split(',');

            var gameStr;
            console.log('1');
            if(req.query.str != undefined){
                gameStr = req.query.str.toString().split(/[ ,]+/).join(' ');
            } else{
                gameStr = 0
            }
            if(!user){

                async.parallel([
                    function(cb){
                        Artigos.find({$or: [{ facet: { $all: searchStr}, status: 'publicado' }, {title: new RegExp(gameStr, 'i'), status: 'publicado'}]}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).limit(6).exec(cb);
                    },
                    function(cb){
                        Games.find({status: 'publicado', title: new RegExp(gameStr, 'i') }, cb);
                    }
                ], function(err, result){
                    res.render('tags', { docs: result[0], games: result[1]  });
                });

            } else {

                async.parallel([
                    function(cb){
                        Artigos.find({$or: [{ facet: { $all: searchStr}, status: 'publicado' }, {title: new RegExp(gameStr, 'i'), status: 'publicado'}]}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).limit(6).exec(cb);
                    },
                    function(cb){
                        Games.find({status: 'publicado', title: new RegExp(gameStr, 'i') }, cb);
                    }, function(cb){
                        Search.update({user: user._id}, {$inc: {searches: 1}, $push: {searchStr: searchStr}}, {upsert: true}, cb);
                    }
                ], function(err, result){
                    res.render('tags', { docs: result[0], games: result[1]  });
                });
            }
        }

    });

    //Load Related ajax
    app.get('/loadRelated', function(req, res){
        Artigos.find({ facet: { $all: req.query.related.split(',')}, status: 'publicado', _id: {$ne: req.query.id} }, {_id: -1, title: 1, 'graph.views': 1, 'cover.position': 1,slug: 1, type: 1}).sort({'graph.views': -1}).limit(4).exec(function(err, related){
            res.render('related', {related: related})
        });
    });


    // INLINE COMMENTS
    app.post('/comments/:id', function(req,res, next){
        var id = req.params.id;
        var user = req.user;
        var comment = req.body;

        Artigos.findOne({ _id: id}, function(err, docs){
            var newComments;
            if(!docs.comments[comment.sectionId]){

                newComments = {sectionId: comment.sectionId, comments: [
                    {authorAvatarUrl: comment.authorAvatarUrl, authorName: comment.authorName, comment: comment.comment, _id: -1}
                ], _id: -1}

                Artigos.update({_id: id}, {$addToSet: {
                    comments: newComments
                }, $inc: {
                    'totalComments': 1
                }}, function(err){
                    res.send("OK");
                });
            } else {
                var oldComments = docs.comments;

                oldComments[comment.sectionId].comments.push({authorAvatarUrl: comment.authorAvatarUrl, authorName: comment.authorName, comment: comment.comment, _id: -1});

                Artigos.update({_id: id}, {$set: {
                    comments: oldComments
                }, $inc: {
                    'totalComments': 1
                }}, function(err){
                    res.send("OK");
                });
            }
        });
        
    });
    
    // AJAX E FALLBACK PARA NOTICIAS
    app.get('/noticias/:noticia', function (req, res, next) {
        var user = req.user;
        var noticia = req.params.noticia;
        
        if (req.xhr === true) {

            Artigos.findOneAndUpdate({ slug: noticia, type: 'noticia' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
                if(docs == null){
                    res.redirect('/');
                } else{
                    if(docs.status == 'publicado'){
                        var title = docs.title,
                        body = decodeURIComponent(docs.text);

                        if(docs.status == 'publicado'){
                            var date = docs.publishDate;
                        } else {
                            var timeStamp = docs._id.toString().substring(0,8);
                            var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                        }
                        docs.date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();

                        Users.find({ _id: docs.authors.main },{'name.loginName': 1, 'name.first': 1, 'name.last': 1, photo: 1, 'social': 1}, function (err, author) {
                            if(!user){
                                    res.render('artigoAjax', { tipo: 'noticia', article: docs, title: title, body: body, author: author[0], date: date, relate: docs.facet, id: docs._id });
                            }else {
                                plusView(user);
                                res.render('artigoAjax', { tipo: 'noticia', article: docs, title: title, body: body, author: author[0], user: user, date: date, relate: docs.facet, id: docs._id });
                            }
                        });
                    } else{
                        res.redirect('/?status=redirect');
                    }
                }
            });


        } else {
            if (!user) {
                Artigos.findOneAndUpdate({ slug: noticia, type: 'noticia' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
                    if(docs == null){
                        res.redirect('/');
                    } else{
                        if(docs.status == 'publicado'){
                            var title = docs.title,
                            body = decodeURIComponent(docs.text);
                            if(docs.status == 'publicado'){
                                var date = docs.publishDate;
                            } else {
                                var timeStamp = docs._id.toString().substring(0,8);
                                var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                            }
                            docs.date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();

                            Users.find({ _id: docs.authors.main }, {'name.loginName': 1, 'name.first': 1, 'name.last': 1, photo: 1, 'social': 1},function (err, author) {
                            
                                    res.render('artigo', { tipo: 'noticia', article: docs, title: title, body: body, author: author[0], date:date, relate: docs.facet, id: docs._id });
                            });
                        } else{
                            res.redirect('/?status=redirect');
                        }
                    }
                });
            } else {
                if(user.deleted == true){
                    res.redirect('/users/restore');
                } else{
                    plusView(user);
                    // sessionReload(req, res, next);
                    Artigos.findOneAndUpdate({ slug: noticia, type: 'noticia' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
                        if(docs == null){
                            res.redirect('/');
                        } else{
                            if(docs.status == 'publicado'){
                                var title = docs.title,
                                    body = decodeURIComponent(docs.text);

                                if(docs.status == 'publicado'){
                                    var date = docs.publishDate;
                                } else {
                                    var timeStamp = docs._id.toString().substring(0,8);
                                    var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                                }
                                docs.date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();

                                Users.find({ _id: docs.authors.main },{'name.loginName': 1, 'name.first': 1, 'name.last': 1, photo: 1, 'social': 1}, function (err, author) {
                                    res.render('artigo', { tipo: 'noticia', article: docs, title: title, body: body, user: user, author: author[0], date: date, relate: docs.facet, id: docs._id });
                                });
                            } else {
                                res.redirect('/?status=redirect');
                            }
                        }
                    });
                }
                
            }
        }
    });

    // AJAX E FALLBACK PARA ARTIGOS
    app.get('/artigos/:artigo', function (req, res, next) {
        var user = req.user;
        var artigo = req.params.artigo;
        if (req.xhr === true) {

            Artigos.findOneAndUpdate({ slug: artigo, type: 'artigo' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
                if(docs == null){
                    res.redirect('/');
                } else{
                    if(docs.status == 'publicado'){
                        var title = docs.title,
                            body = decodeURIComponent(docs.text);

                        if(docs.status == 'publicado'){
                            var date = docs.publishDate;
                        } else {
                            var timeStamp = docs._id.toString().substring(0,8);
                            var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                        }
                        docs.date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();

                        Users.find({ _id: docs.authors.main },{'name.loginName': 1, 'name.first': 1, 'name.last': 1, photo: 1, 'social': 1}, function (err, author) {
                            if(!user){
                                res.render('artigoAjax', { tipo: 'artigo', article: docs, title: title, body: body, author: author[0], date: date, relate: docs.facet, id: docs._id });
                            } else {
                                plusView(user);
                                res.render('artigoAjax', { tipo: 'artigo', article: docs, title: title, body: body, author: author[0], user: user, date: date, relate: docs.facet, id: docs._id });
                            }
                        });
                    } else {
                        res.redirect('/?status=redirect');
                    }
                }
            });

        } else {
            if (!user) {
                Artigos.findOneAndUpdate({ slug: artigo, type: 'artigo' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
                    if(docs == null){
                        res.redirect('/');
                    } else{
                        if(docs.status == 'publicado'){
                            var title = docs.title,
                                body = decodeURIComponent(docs.text);

                            if(docs.status == 'publicado'){
                                var date = docs.publishDate;
                            } else {
                                var timeStamp = docs._id.toString().substring(0,8);
                                var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                            }
                            docs.date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();

                            Users.find({ _id: docs.authors.main },{'name.loginName': 1, 'name.first': 1, 'name.last': 1, photo: 1, 'social': 1}, function (err, author) {
                            
                            res.render('artigo', { tipo: 'artigo', article: docs, title: title, body: body, author: author[0], date: date, relate: docs.facet, id: docs._id });
                            });
                        } else {
                            res.redirect('/?status=redirect');
                        }
                    }
                });
            } else {
                if(user.deleted == true){
                    res.redirect('/users/restore');
                } else{
                    // sessionReload(req, res, next);
                    Artigos.findOneAndUpdate({ slug: artigo, type: 'artigo' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
                        if(docs == null){
                            res.redirect('/');
                        } else{
                            if(docs.status == 'publicado'){
                                var title = docs.title,
                                    body = decodeURIComponent(docs.text);
                                if(docs.status == 'publicado'){
                                    var date = docs.publishDate;
                                } else {
                                    var timeStamp = docs._id.toString().substring(0,8);
                                    var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                                }
                                docs.date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();

                                Users.find({ _id: docs.authors.main },{'name.loginName': 1, 'name.first': 1, 'name.last': 1, photo: 1, 'social': 1}, function (err, author) {
                                    plusView(user);
                                    res.render('artigo', { tipo: 'artigo', article: docs, title: title, body: body, user: user, author: author[0], date: date, relate: docs.facet, id: docs._id });
                                });
                            } else {
                                res.redirect('/?status=redirect');
                            }
                        }
                    });
                }
            }
        }
    });

    // AJAX E FALLBACK PARA ANALISES
    app.get('/analises/:analise', function (req, res, next) {
        var user = req.user;
        var analise = req.params.analise;
        if (req.xhr === true) {

            Artigos.findOneAndUpdate({ slug: analise, type: 'analise' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
                if(docs == null){
                    res.redirect('/');
                } else{
                    if(docs.status == 'publicado'){
                        var title = docs.title,
                            body = decodeURIComponent(docs.text);
                    
                        var scores = docs.review.score.toString().split('.'),
                            score = scores[0],
                            decimal;

                        if(scores.length < 2){
                            decimal = 0;
                        } else{
                            decimal = scores[1];
                        }
                        var bad = docs.review.bad.split(','),
                            good = docs.review.good.split(',');

                        if(docs.status == 'publicado'){
                            var date = docs.publishDate;
                        } else {
                            var timeStamp = docs._id.toString().substring(0,8);
                            var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                        }
                        docs.date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                        Users.find({ _id: docs.authors.main },{'name.loginName': 1, 'name.first': 1, 'name.last': 1, photo: 1, 'social': 1}, function (err, author) {
                            console.log('1');
                            if(!user){
                            
                                Games.findOne({slug: analise, status: 'publicado'}, function(err, game){
                              
                                    if(game.release){
                                        var date = game.release;
                                        date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                                    }
                                    res.render('artigoAjax', { tipo: 'analise', article: docs, title: title, body: body, author: author[0], decimal: decimal, score: score, bad: bad, good: good, game: game, date: date, relate: docs.facet, id: docs._id });
                                });
                            } else {
                                plusView(user);
                                    Games.findOne({slug: analise, status: 'publicado'}, function(err, game){
                                        if (game != null){
                                            if(game.release){
                                                var date = game.release;
                                                date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                                            }
                                            res.render('artigoAjax', { tipo: 'analise', article: docs, title: title, body: body, author: author[0], user: user, decimal: decimal, score: score, bad: bad, good: good, game: game, date: date, relate: docs.facet, id: docs._id });
                                        } else {
                                            res.render('artigoAjax', { tipo: 'analise', article: docs, title: title, body: body, author: author[0], user: user, decimal: decimal, score: score, bad: bad, good: good, game: game, date: "indefinido", relate: docs.facet, id: docs._id });
                                        }
                                    });
                            }
                        });
                    } else {
                        res.redirect('/?status=redirect');
                    }
                }
            });

        } else {
            if (!user) {
                Artigos.findOneAndUpdate({ slug: analise, type: 'analise' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
                    if(docs == null){
                        res.redirect('/');
                    } else{
                        if(docs.status == 'publicado'){
                            var title = docs.title,
                                body = decodeURIComponent(docs.text);
                             var scores = docs.review.score.toString().split('.'),
                                score = scores[0],
                                decimal;
                            var bad = docs.review.bad.split(','),
                                good = docs.review.good.split(',');

                            if(scores.length < 2){
                                decimal = 0;
                            } else{
                                decimal = scores[1];
                            }
                            if(docs.status == 'publicado'){
                                var date = docs.publishDate;
                            } else {
                                var timeStamp = docs._id.toString().substring(0,8);
                                var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                            }
                            docs.date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            Users.find({ _id: docs.authors.main },{'name.loginName': 1, 'name.first': 1, 'name.last': 1, photo: 1, 'social': 1}, function (err, author) {
                                Games.findOne({slug: analise, status: 'publicado'}, function(err, game){
                                    if (game != null){
                                        if(game.release){
                                            var date = game.release;
                                            date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                                        }
                                        res.render('artigo', { tipo: 'analise', article: docs, title: title, body: body, author: author[0], decimal: decimal, score: score, bad: bad, good: good, game: game, date: date, relate: docs.facet, id: docs._id });
                                    } else{
                                        res.render('artigo', { tipo: 'analise', article: docs, title: title, body: body, author: author[0], decimal: decimal, score: score, bad: bad, good: good, game: game, date: "indefinido", relate: docs.facet, id: docs._id });
                                    }
                                });
                            });
                        } else {
                            res.redirect('/?status=redirect');
                        }
                    }
                });
            } else {
                if(user.deleted == true){
                    res.redirect('/users/restore');
                } else{
                    // sessionReload(req, res, next);
                    Artigos.findOneAndUpdate({ slug: analise, type: 'analise' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
                        if(docs == null){
                            res.redirect('/');
                        } else{
                            if(docs.status == 'publicado'){
                                var title = docs.title,
                                    body = decodeURIComponent(docs.text);
                                 var scores = docs.review.score.toString().split('.'),
                                    score = scores[0],
                                    decimal;
                                var bad = docs.review.bad.split(','),
                                    good = docs.review.good.split(',');

                                if(scores.length < 2){
                                    decimal = 0;
                                } else{
                                    decimal = scores[1];
                                }
                                if(docs.status == 'publicado'){
                                    var date = docs.publishDate;
                                } else {
                                    var timeStamp = docs._id.toString().substring(0,8);
                                    var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                                }
                                docs.date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();

                                Users.find({ _id: docs.authors.main },{'name.loginName': 1, 'name.first': 1, 'name.last': 1, photo: 1, 'social': 1}, function (err, author) {
                                    plusView(user);
                                        Games.findOne({slug: analise, status: 'publicado'}, function(err, game){
                                            if (game != null){
                                                if(game.release){
                                                    var date = game.release;
                                                    date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                                                }
                                                res.render('artigo', { tipo: 'analise', article: docs, title: title, body: body, user: user, author: author[0], decimal: decimal, score: score, bad: bad, good: good, game: game, date:date, relate: docs.facet, id: docs._id });
                                            } else {
                                                res.render('artigo', { tipo: 'analise', article: docs, title: title, body: body, user: user, author: author[0], decimal: decimal, score: score, bad: bad, good: good, game: game, date: "indefinido", relate: docs.facet, id: docs._id });
                                            }
                                            
                                        });
                                });
                            } else {
                                res.redirect('/?status=redirect');
                            }
                        }
                    });
                }
            }
        }
    });

    // AJAX E FALLBACK PARA VIDEOS
    app.get('/videos/:video', function (req, res, next) {
        var user = req.user;
        var video = req.params.video;
        if (req.xhr === true) {

            Artigos.findOneAndUpdate({ slug: video, type: 'video' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
                if(docs == null){
                    res.redirect('/');
                } else{
                    if(docs.status == 'publicado'){
                        var title = docs.title,
                            body = decodeURIComponent(docs.text);
                        if(docs.status == 'publicado'){
                            var date = docs.publishDate;
                        } else {
                            var timeStamp = docs._id.toString().substring(0,8);
                            var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                        }
                        docs.date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();

                        Users.find({ _id: docs.authors.main }, {'name.loginName': 1, 'name.first': 1, 'name.last': 1, photo: 1, 'social': 1},function (err, author) {
                            if(!user){
                                res.render('artigoAjax', { tipo: 'video', article: docs, title: title, body: body, author: author[0], date: date, relate: docs.facet, id: docs._id });
                            } else {
                                plusView(user);
                                res.render('artigoAjax', { tipo: 'video', article: docs, title: title, body: body, author: author[0], user: user, date:date, relate: docs.facet, id: docs._id });
                            }
                        });
                    } else {
                        res.redirect('/?status=redirect');
                    }
                }
            });

        } else {
            if (!user) {
                Artigos.findOneAndUpdate({ slug: video, type: 'video' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
                    if(docs == null){
                        res.redirect('/');
                    } else{
                        if(docs.status == 'publicado'){
                            var title = docs.title,
                                body = decodeURIComponent(docs.text);

                            if(docs.status == 'publicado'){
                                var date = docs.publishDate;
                            } else {
                                var timeStamp = docs._id.toString().substring(0,8);
                                var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                            }
                            docs.date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();

                            Users.find({ _id: docs.authors.main },{'name.loginName': 1, 'name.first': 1, 'name.last': 1, photo: 1, 'social': 1}, function (err, author) {
                            res.render('artigo', { tipo: 'video', article: docs, title: title, body: body, author: author[0], date:date, relate: docs.facet, id: docs._id });
                            });
                        } else {
                            res.redirect('/?status=redirect');
                        }
                    }
                });
            } else {
                if(user.deleted == true){
                    res.redirect('/users/restore');
                } else{
                    // sessionReload(req, res, next);
                    Artigos.findOneAndUpdate({ slug: video, type: 'video' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
                        if(docs == null){
                            res.redirect('/');
                        } else{
                            if(docs.status == 'publicado'){
                                var title = docs.title,
                                    body = decodeURIComponent(docs.text);
                                if(docs.status == 'publicado'){
                                    var date = docs.publishDate;
                                } else {
                                    var timeStamp = docs._id.toString().substring(0,8);
                                    var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                                }
                                docs.date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();

                                Users.find({ _id: docs.authors.main },{'name.loginName': 1, 'name.first': 1, 'name.last': 1, photo: 1, 'social': 1}, function (err, author) {
                                    plusView(user);
                                    res.render('artigo', { tipo: 'video', article: docs, title: title, body: body, user: user, author: author[0], date: date, relate: docs.facet, id: docs._id });
                                });
                            } else {
                                res.redirect('/?status=redirect');
                            }
                        }
                    });
                }
            }
        }
    });


    // PÁGINA DE CRIAÇÃO DE NOVOS TUDO
    app.get('/criar/:tipo', function (req, res, next) {
        var user = req.user;
        var tipo = req.params.tipo;
        
        if (!user) {
            res.redirect('/parceiros')
        } else if (user.status == 'admin' || user.status == 'parceiro' || user.status == 'editor') {
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                // sessionReload(req, res, next); 
                new Artigos({
                    'authors.main': user._id,
                    'authors.name': user.name.first + ' ' + user.name.last,
                    type: tipo
                }).save(function (err, docs) {
                    if (err)
                        throw err
                    res.render('create', { user: user, title: "Hora de criar um artigo sensacional!", id: docs._id, tipo: tipo, criar: true });

                });
            }
        } else {
            // sessionReload(req, res, next);
            res.redirect('/parceiros');
        }
    });


    // EDIÇÃO DE TUDO
    app.get('/editar/:id', function(req, res){
        var texto = req.params.id;
        var user = req.user;
        if(!user){
            res.redirect('/parceiros');
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                Artigos.findOneAndUpdate({_id: texto}, {$set: {status: 'rascunho'}}, {new: false}, function(err, docs){
                    if (user.status == 'admin' || user.status == 'editor' || user.status == 'parceiro' && user._id == docs.authors.main) {
                        var title = docs.title,
                            body = decodeURIComponent(docs.text);
                        var points = 0,
                            publications = 0;
                        if(docs.type == 'video' && docs.status == 'publicado'){
                            publications = 1;
                            if(docs.video.autoral == true){
                                points = 50;
                            } else {
                                points = 5;
                            }
                        } else if(docs.status == 'publicado'){
                            publications = 1;
                            switch(docs.type){
                                case 'noticia':
                                    points = 10;
                                    break;
                                case 'artigo':
                                    points = 30;
                                    break;
                                case 'analise':
                                    points = 50;
                                    break;
                            }
                        } else {
                            points = 0;
                        }
                        
                        Users.update({ _id: docs.authors.main }, { $inc: {'graph.publications': -publications, 'gamification.points': -points} }, function (err) {
                            res.render('editar', {user: user, article: docs, title: title, body: body, tipo: docs.type, id: docs._id});
                        });
                    } else {
                        Artigos.update({slug: texto}, {status: docs.status}, function(err, docs){
                            res.redirect('/');
                        });
                    }
                });
            }
        }
    });


    // DELETAR CRIANDO
    app.post('/deletar/:id', function(req, res){
        var user = req.user;
        var id = req.params.id;
        
        if (user.status == 'admin' || user.status == 'parceiro' || user.status == 'editor') {
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                Artigos.findOneAndUpdate({_id: id}, {$set: {status: 'deletado'}},{new: false}, function(err, docs){
                    if (user.status == 'admin' || docs.authors.main == user.id) {
                        res.redirect('/?status=deletado');
                    } else {
                        Artigos.update({_id: id}, {$set: {status: docs.status}}, function(err, docs){
                            res.redirect('/');
                        });
                    }
                });
            }
        } else {
            res.redirect('/');
        }
    });




    // UPLOAD DE NOVA COVER NA CRIAÇÃO DE ARTIGOS
    app.post('/newCover', function (req, res, next) {
        var user = req.user;
        var sendImg = user.name.loginName + req.files.file.name;
        if (user.status == 'admin' || user.status == 'parceiro' || user.status == 'editor') {
            // get the temporary location of the file
            var tmp_path = req.files.file.path;
            // set where the file should actually exists - in this case it is in the "images" directory
            var target_path = './public/uploads/' + sendImg;
            // move the file from the temporary location to the intended location
            fs.rename(tmp_path, target_path, function (err) {
                if (err) throw err;
                // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
                fs.unlink(tmp_path, function () {
                    if (err) throw err;
                    
                });
            });
            var params = {
                steps: {
                    ':original': {
                        robot: '/http/import',
                        url: 'http://www.gueime.com.br/uploads/' + sendImg
                    }
                },
                template_id: '4d6889709f8911e48553eb5f0b551edf'
            };
            client.send(params, function(ok) {
                // success callback [optional]
                res.send('http://www.gueime.com.br/uploads/' + sendImg );
            }, function(err) {
                // error callback [optional]
                console.log('Error: ' + JSON.stringify(err));
            });
        } 
    });


    // UPLOAD DE IMAGENS DURANTE A CRIAÇÃO DE ARTIGOS
    app.post('/artigoImage', function (req, res, next) {
        var user = req.user;
        var sendImg =  user.name.loginName + req.files.file.name;

        if (user.status == 'admin' || user.status == 'parceiro' || user.status == 'editor') {
            // get the temporary location of the file
            var tmp_path = req.files.file.path;
            // set where the file should actually exists - in this case it is in the "images" directory
            var target_path = './public/uploads/' + sendImg;
            // move the file from the temporary location to the intended location
            fs.rename(tmp_path, target_path, function (err) {
                if (err) throw err;
                // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
                fs.unlink(tmp_path, function () {
                    if (err) throw err;
                    
                });
            });

            var params = {
                steps: {
                    ':original': {
                        robot: '/http/import',
                        url: 'http://www.gueime.com.br/uploads/' + sendImg
                    }
                },
                template_id: '3cec90f09f8911e4b258515ca93bba8f'
            };

            client.send(params, function(ok) {
                res.send({ "filelink": 'http://www.gueime.com.br/uploads/' + sendImg });
            }, function(err) {
                // error callback [optional]
                console.log('Error: ' + JSON.stringify(err));
            });

        } else {
            res.redirect('/parceiros');
        }

    });



    // SALVAR NOVO ARTIGO
    app.post('/novoArtigo/:id', function (req, res) {
        var user = req.user;
        var id = req.params.id;

        if (user.status == 'admin' || user.status == 'parceiro' || user.status == 'editor') {

            Artigos.update({_id: id}, {$set: {text: req.body.content}}, function(err){
                if (err)
                    throw err
                res.send(JSON.stringify(req.body));
            });
        } else {
            res.redirect('/parceiros');
        }
    });

    // SALVAR NOVO TITULO
    app.post('/novoTitulo/:id', function (req, res) {
        var user = req.user;
        var id = req.params.id;

        if (user.status == 'admin' || user.status == 'parceiro' || user.status == 'editor') {

            Artigos.update({_id: id},{ $set: { title: decodeURIComponent(req.body.content).replace('<p>', '').replace('</p>', '')} }, function(err){
                if (err)
                    throw err
                res.send(JSON.stringify(req.body));
            });

        } else {
            res.redirect('/parceiros');
        }
    });

    // SLUG CHECK
    app.get('/titleCheck/:id', function(req,res){
        var user = req.user,
            id = req.params.id,
            check = req.query.check,
            title = req.query.title;
            slug = func.string_to_slug(decodeURIComponent(title.replace('<p>', '').replace('</p>', '')));
            console.log(check);

        if(check == 'true'){
            Artigos.find({ _id: id}, function(err, docs){
                if(docs[0].slug == slug){
                    res.end('yes');
                } else{
                    Artigos.find({slug: slug}, function(err, arts){
                        if(arts.length > 0){
                            res.end('no');
                        } else{
                            res.end('yes');
                        }
                    });
                }
            });
        }else{
            Artigos.find({slug: slug}, function(err, arts){
                if(arts.length > 0){
                    res.end('no');
                } else{
                    res.end('yes');
                }
            });
        }
    });


    // GRAPH NOVO ARTIGO
    app.post('/graph/:id', function (req, res) {
        var user = req.user;
        var b = req.body;
        var id = req.params.id;

        if (user.status == 'admin' || user.status == 'parceiro' || user.status == 'editor') {
            // Não consegui ainda pensar num jeito simples de colocar $push apenas nas arrays e $set quando for único...no momento usarei esse código abaixo na hora de pegar as infos e jogar na página (transformando em arrays)
            var games = b.jogo,
                sendGames,
                tags = b.tags,
                sendTags,
                consoles = b.consoles,
                sendConsoles,
                publicadoras = b.publicadoras,
                sendPublicadoras,
                desenvolvedores = b.desenvolvedores,
                sendDesenvolvedores,
                generos = b.generos,
                sendGeneros,
                categoriaArtigo = b.categoriaArtigo,
                sendCategoriaArtigo,
                analiseBom = b.analiseBom,
                analiseRuim = b.analiseRuim,
                slug = func.string_to_slug(decodeURIComponent(b.docTitle.replace('<p>', '').replace('</p>', '')));

            var autoral = b.autoral;

            var facet = [];

           
            if (games != undefined) { games = func.string_to_slug(b.jogo); if (games.indexOf('-') > -1) { games = games.split(/[\s,-]+/); sendGames = b.jogo.toString().replace(/,\s*$/, "").split(','); facet = facet.concat(games); } else { facet.push(games.split(' ')); sendGames = b.jogo } }

            if (tags != undefined) { tags = func.string_to_slug(b.tags); if (tags.indexOf('-') > -1) { tags = tags.split(/[\s,-]+/); sendTags = b.tags.toString().replace(/,\s*$/, "").split(','); facet = facet.concat(tags); } else { facet.push(tags.split(' ')); sendTags = b.tags; } }

            if (consoles != undefined) { consoles = func.string_to_slug(b.consoles); if (consoles.indexOf('-') > -1) { consoles = consoles.split(/[\s,-]+/); sendConsoles = b.consoles.toString().replace(/,\s*$/, "").split(','); facet = facet.concat(consoles); } else { facet.push(consoles.split(' ')); sendConsoles = b.consoles; } }

            if (publicadoras != undefined) { publicadoras = func.string_to_slug(b.publicadoras); if (publicadoras.indexOf('-') > -1) { publicadoras = publicadoras.split(/[\s,-]+/); sendPublicadoras = b.publicadoras.toString().replace(/,\s*$/, "").split(','); facet = facet.concat(publicadoras); } else { facet.push(publicadoras.split(' ')); sendPublicadoras = b.publicadoras; } }

            if (desenvolvedores != undefined) { desenvolvedores = func.string_to_slug(b.desenvolvedores); if (desenvolvedores.indexOf('-') > -1) { desenvolvedores = desenvolvedores.split(/[\s,-]+/); sendDesenvolvedores = b.desenvolvedores.toString().replace(/,\s*$/, "").split(','); facet = facet.concat(desenvolvedores); } else { facet.push(desenvolvedores.split(' ')); sendDesenvolvedores = b.desenvolvedores; } }

            if (generos != undefined) { generos = func.string_to_slug(b.generos); if (generos.indexOf('-') > -1) { generos = generos.split(/[\s,-]+/); sendGeneros = b.generos.toString().replace(/,\s*$/, "").split(','); facet = facet.concat(generos); } else { facet.push(generos.split(' ')); sendGeneros = b.generos; } }

            if (categoriaArtigo != undefined) { categoriaArtigo = func.string_to_slug(b.categoriaArtigo); if (categoriaArtigo.indexOf('-') > -1) { categoriaArtigo = categoriaArtigo.split(/[\s,]+/); sendCategoriaArtigo = b.categoriaArtigo.toString().replace(/,\s*$/, "").split(','); facet = facet.concat(categoriaArtigo); } else { facet.push(categoriaArtigo.split(' ')); sendCategoriaArtigo = b.categoriaArtigo; } }

            if (analiseBom != undefined) { if (analiseBom.indexOf(',') > -1) { analiseBom = analiseBom.split(','); } }
            if (analiseRuim != undefined) { if (analiseRuim.indexOf(',') > -1) { analiseRuim = analiseRuim.split(','); } }

            facet.push(b.serieArtigo, b.tipoVideo, b.canalVideo);

            facet = func.cleanArray(facet);

            sendFacet = facet.filter(function(elem, pos) {
                return facet.indexOf(elem) == pos;
            });

            var criador;
            if(b.criador != undefined){
                criador = b.criador;
            } else {
                criador = user._id;
            }

            Artigos.findOne({_id: id}, function(err, publishD){
                var status;
                var publishDate;

                if(user.status == 'admin' || user.status == 'editor'){
                    status = 'publicado';
                    if(publishD.publishDate == undefined || publishD.publishDate.getFullYear() == "1988"){
                        publishDate = new Date();
                    } else {
                        publishDate = publishD.publishDate;
                    }
                } else {
                    status = 'revisao';
                    publishDate = new Date();
                    publishDate.setFullYear(1988);
                }


                if (b.tipo == 'noticia') {
                    Artigos.findOneAndUpdate({_id: id}, { $set: {

                        description: b.descricao,
                        status: status,
                        publishDate: publishDate,   
                        'cover.image': b.coverUrl,
                        'cover.position': b.position,
                        tags: sendTags,
                        'graph.games': sendGames,
                        'graph.consoles': sendConsoles,
                        'graph.genres': sendGeneros,
                        'graph.developers': sendDesenvolvedores,
                        'graph.publishers': sendPublicadoras,
                        'news.story': b.continuacaoHistoria,
                        slug: slug,
                        'authors.revision': user._id

                    }, $addToSet: {
                        facet: { $each: sendFacet }
                    }
                    }, function (err, art) {
                        if (err)
                            throw err
                        if(user.status == 'admin' || user.status == 'editor'){
                            // Atribuição de pontuação
                            Users.findOneAndUpdate({_id: criador}, {$inc: {'graph.publications': 1, 'gamification.points': 10}}, function(err, thisCreator){
                                // Ganha pontos por revisão
                                if(criador != user._id){
                                    if(user.graph.revisionCol.indexOf(art._id) > -1){
                                        res.redirect('/' + b.tipo + 's/' + slug);
                                    } else {
                                        Users.update({_id: user._id}, {$inc: {'gamification.points': 30, 'graph.revisions': 1}, $addToSet: {'graph.revisionCol': art._id}}, function(err){
                                            // Email enviado para artigos revisados e publicados
                                            var pubMessage = {
                                                "html": "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'><html xmlns='http://www.w3.org/1999/xhtml'><head><meta content='text/html; charset=utf-8' http-equiv='Content-Type' /><title></title><style type='text/css'>@media only screen and (max-width:480px){body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:none !important}body{width:100% !important;min-width:100% !important}td[id=bodyCell]{padding:10px !important}table.kmMobileHide{display:none !important}table[class=kmTextContentContainer]{width:100% !important}table[class=kmBoxedTextContentContainer]{width:100% !important}td[class=kmImageContent]{padding-left:0 !important;padding-right:0 !important}img[class=kmImage]{width:100% !important}table[class=kmSplitContentLeftContentContainer],table[class=kmSplitContentRightContentContainer],table[class=kmColumnContainer],td[class=kmVerticalButtonBarContentOuter] table[class=kmButtonBarContent],td[class=kmVerticalButtonCollectionContentOuter] table[class=kmButtonCollectionContent],table[class=kmVerticalButton],table[class=kmVerticalButtonContent]{width:100% !important}td[class=kmButtonCollectionInner]{padding-left:9px !important;padding-right:9px !important;padding-top:9px !important;padding-bottom:0 !important;background-color:transparent !important}td[class=kmVerticalButtonIconContent],td[class=kmVerticalButtonTextContent],td[class=kmVerticalButtonContentOuter]{padding-left:0 !important;padding-right:0 !important;padding-bottom:9px !important}table[class=kmSplitContentLeftContentContainer] td[class=kmTextContent],table[class=kmSplitContentRightContentContainer] td[class=kmTextContent],table[class=kmColumnContainer] td[class=kmTextContent],table[class=kmSplitContentLeftContentContainer] td[class=kmImageContent],table[class=kmSplitContentRightContentContainer] td[class=kmImageContent]{padding-top:9px !important}td[class='rowContainer kmFloatLeft'],td[class='rowContainer kmFloatLeft firstColumn'],td[class='rowContainer kmFloatLeft lastColumn']{float:left;clear:both;width:100% !important}table[id=templateContainer],table[class=templateRow]{max-width:600px !important;width:100% !important}h1{font-size:24px !important;line-height:130% !important}h2{font-size:20px !important;line-height:130% !important}h3{font-size:18px !important;line-height:130% !important}h4{font-size:16px !important;line-height:130% !important}td[class=kmTextContent]{font-size:14px !important;line-height:130% !important}td[class=kmTextBlockInner] td[class=kmTextContent]{padding-right:18px !important;padding-left:18px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner]{padding-left:9px !important;padding-right:9px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner] [class=kmTextContent]{font-size:14px !important;line-height:130% !important;padding-left:4px !important;padding-right:4px !important}}</style></head><body style='margin:0;padding:0;background-color:#c7c7c7'><center><table align='center' border='0' cellpadding='0' cellspacing='0' id='bodyTable' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;background-color:#c7c7c7;height:100%;margin:0;width:100%'><tbody><tr><td align='center' id='bodyCell' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding-top:50px;padding-left:20px;padding-bottom:20px;padding-right:20px;border-top:0;height:100%;margin:0;width:100%'><table border='0' cellpadding='0' cellspacing='0' id='templateContainer' width='600' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;border:1px solid #aaa;background-color:#f4f4f4;border-radius:0'><tbody><tr><td id='templateContainerInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmImageBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmImageBlockOuter'><tr><td class='kmImageBlockInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:9px;' valign='top'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmImageContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmImageContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;padding-top:0px;padding-bottom:0;padding-left:9px;padding-right:9px;'><img align='left' alt='' class='kmImage' src='https://d3k81ch9hvuctc.cloudfront.net/company%2Fb674Zj%2Fimages%2Fheader_email.jpg' width='564' style='border:0;height:auto;line-height:100%;outline:none;text-decoration:none;padding-bottom:0;display:inline;vertical-align:bottom;margin-right:0;max-width:800px;' /></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmTextBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmTextBlockOuter'><tr><td class='kmTextBlockInner' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmTextContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmTextContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#505050;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;'><h1 style='color:#222;display:block;font-family:Helvetica, Arial;font-size:26px;font-style:normal;font-weight:bold;line-height:110%;letter-spacing:normal;margin:0;margin-bottom:9px;text-align:left'>Artigo Revisado e Publicado!</h1><p style='margin:0;padding-bottom:1em'> </p><p style='margin:0;padding-bottom:1em'>O artigo " + b.docTitle.replace('<p>', '').replace('</p>', '') + " foi revisado por " + user.name.first + " " + user.name.last + ". Você poderá acessá-lo pelo link: http://www.gueime.com.br/" + b.tipo + "s/" + slug + " . Agradecemos muito e esperamos muitos mais artigos excelentes pela frente!</p><p style='margin:0;padding-bottom:1em'>Abraços,</p><p style='margin:0;padding-bottom:0'>Equipe Gueime</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></table></td></tr></tbody></table></td></tr></tbody></table></center></body></html>",
                                                "text": "O artigo " + b.docTitle.replace('<p>', '').replace('</p>', '') + " foi revisado por " + user.name.first + " " + user.name.last + ". Você poderá acessá-lo pelo link: http://www.gueime.com.br/" + b.tipo + "s/" + slug + " . Agradecemos muito e esperamos muitos mais artigos excelentes pela frente!",
                                                "subject": "Gueime - Artigo Revisado e Publicado",
                                                "from_email": "parceiros@gueime.com.br",
                                                "from_name": "Gueime - Parceiros",
                                                "to": [{
                                                        "email": user.email,
                                                        "name": user.name.first,
                                                        "type": "to"
                                                    },
                                                    {
                                                        "email": criador.email,
                                                        "name": criador.name.first,
                                                        "type": "to"
                                                    },
                                                    {
                                                        "email": "parceiros@gueime.com.br",
                                                        "name": "Parceiros",
                                                        "type": "bcc"
                                                    }],
                                                "headers": {
                                                    "Reply-To": "parceiros@gueime.com.br"
                                                },
                                                "important": false,
                                                "track_opens": true,
                                                "track_clicks": true,
                                                "auto_text": null,
                                                "auto_html": true,
                                                "inline_css": null,
                                                "url_strip_qs": null,
                                                "preserve_recipients": null,
                                                "view_content_link": null,
                                                "return_path_domain": null,
                                                "tags": [
                                                    "pubMessage"
                                                ]
                                            };
                                            var async = false;
                                            var ip_pool = "Main Pool";
                                            // Evio de Email
                                            mandrill_client.messages.send({"message": pubMessage, "async": async, "ip_pool": ip_pool}, function(result) {
                                                console.log(result);
                                                // Direciona pro artigo
                                                res.redirect('/' + b.tipo + 's/' + slug);
                                            }, function(e) {
                                                console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                                                // Direciona pro artigo
                                                res.redirect('/' + b.tipo + 's/' + slug);
                                            });
                                        });
                                    }
                                } else {
                                    // Email para artigos publicados diretametne
                                    var dirMessage = {
                                        "html": "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'><html xmlns='http://www.w3.org/1999/xhtml'><head><meta content='text/html; charset=utf-8' http-equiv='Content-Type' /><title></title><style type='text/css'>@media only screen and (max-width:480px){body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:none !important}body{width:100% !important;min-width:100% !important}td[id=bodyCell]{padding:10px !important}table.kmMobileHide{display:none !important}table[class=kmTextContentContainer]{width:100% !important}table[class=kmBoxedTextContentContainer]{width:100% !important}td[class=kmImageContent]{padding-left:0 !important;padding-right:0 !important}img[class=kmImage]{width:100% !important}table[class=kmSplitContentLeftContentContainer],table[class=kmSplitContentRightContentContainer],table[class=kmColumnContainer],td[class=kmVerticalButtonBarContentOuter] table[class=kmButtonBarContent],td[class=kmVerticalButtonCollectionContentOuter] table[class=kmButtonCollectionContent],table[class=kmVerticalButton],table[class=kmVerticalButtonContent]{width:100% !important}td[class=kmButtonCollectionInner]{padding-left:9px !important;padding-right:9px !important;padding-top:9px !important;padding-bottom:0 !important;background-color:transparent !important}td[class=kmVerticalButtonIconContent],td[class=kmVerticalButtonTextContent],td[class=kmVerticalButtonContentOuter]{padding-left:0 !important;padding-right:0 !important;padding-bottom:9px !important}table[class=kmSplitContentLeftContentContainer] td[class=kmTextContent],table[class=kmSplitContentRightContentContainer] td[class=kmTextContent],table[class=kmColumnContainer] td[class=kmTextContent],table[class=kmSplitContentLeftContentContainer] td[class=kmImageContent],table[class=kmSplitContentRightContentContainer] td[class=kmImageContent]{padding-top:9px !important}td[class='rowContainer kmFloatLeft'],td[class='rowContainer kmFloatLeft firstColumn'],td[class='rowContainer kmFloatLeft lastColumn']{float:left;clear:both;width:100% !important}table[id=templateContainer],table[class=templateRow]{max-width:600px !important;width:100% !important}h1{font-size:24px !important;line-height:130% !important}h2{font-size:20px !important;line-height:130% !important}h3{font-size:18px !important;line-height:130% !important}h4{font-size:16px !important;line-height:130% !important}td[class=kmTextContent]{font-size:14px !important;line-height:130% !important}td[class=kmTextBlockInner] td[class=kmTextContent]{padding-right:18px !important;padding-left:18px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner]{padding-left:9px !important;padding-right:9px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner] [class=kmTextContent]{font-size:14px !important;line-height:130% !important;padding-left:4px !important;padding-right:4px !important}}</style></head><body style='margin:0;padding:0;background-color:#c7c7c7'><center><table align='center' border='0' cellpadding='0' cellspacing='0' id='bodyTable' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;background-color:#c7c7c7;height:100%;margin:0;width:100%'><tbody><tr><td align='center' id='bodyCell' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding-top:50px;padding-left:20px;padding-bottom:20px;padding-right:20px;border-top:0;height:100%;margin:0;width:100%'><table border='0' cellpadding='0' cellspacing='0' id='templateContainer' width='600' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;border:1px solid #aaa;background-color:#f4f4f4;border-radius:0'><tbody><tr><td id='templateContainerInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmImageBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmImageBlockOuter'><tr><td class='kmImageBlockInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:9px;' valign='top'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmImageContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmImageContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;padding-top:0px;padding-bottom:0;padding-left:9px;padding-right:9px;'><img align='left' alt='' class='kmImage' src='https://d3k81ch9hvuctc.cloudfront.net/company%2Fb674Zj%2Fimages%2Fheader_email.jpg' width='564' style='border:0;height:auto;line-height:100%;outline:none;text-decoration:none;padding-bottom:0;display:inline;vertical-align:bottom;margin-right:0;max-width:800px;' /></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmTextBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmTextBlockOuter'><tr><td class='kmTextBlockInner' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmTextContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmTextContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#505050;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;'><h1 style='color:#222;display:block;font-family:Helvetica, Arial;font-size:26px;font-style:normal;font-weight:bold;line-height:110%;letter-spacing:normal;margin:0;margin-bottom:9px;text-align:left'>Artigo Publicado!</h1><p style='margin:0;padding-bottom:1em'> </p><p style='margin:0;padding-bottom:1em'>O artigo " + b.docTitle.replace('<p>', '').replace('</p>', '') + " foi publicado. Você poderá acessá-lo pelo link: http://www.gueime.com.br/" + b.tipo + "s/" + slug + " . Agradecemos muito e esperamos muitos mais artigos excelentes pela frente!</p><p style='margin:0;padding-bottom:1em'>Abraços,</p><p style='margin:0;padding-bottom:0'>Equipe Gueime</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></table></td></tr></tbody></table></td></tr></tbody></table></center></body></html>",
                                        "text": "O artigo " + b.docTitle.replace('<p>', '').replace('</p>', '') + " foi publicado. Você poderá acessá-lo pelo link: http://www.gueime.com.br/" + b.tipo + "s/" + slug + " . Agradecemos muito e esperamos muitos mais artigos excelentes pela frente!",
                                        "subject": "Gueime - Artigo Publicado",
                                        "from_email": "parceiros@gueime.com.br",
                                        "from_name": "Gueime - Parceiros",
                                        "to": [{
                                                "email": user.email,
                                                "name": user.name.first,
                                                "type": "to"
                                            },
                                            {
                                                "email": "parceiros@gueime.com.br",
                                                "name": "Parceiros",
                                                "type": "bcc"
                                            }],
                                        "headers": {
                                            "Reply-To": "parceiros@gueime.com.br"
                                        },
                                        "important": false,
                                        "track_opens": true,
                                        "track_clicks": true,
                                        "auto_text": null,
                                        "auto_html": true,
                                        "inline_css": null,
                                        "url_strip_qs": null,
                                        "preserve_recipients": null,
                                        "view_content_link": null,
                                        "return_path_domain": null,
                                        "tags": [
                                            "dirMessage"
                                        ]
                                    };
                                    var async = false;
                                    var ip_pool = "Main Pool";
                                    // Evio de Email
                                    mandrill_client.messages.send({"message": dirMessage, "async": async, "ip_pool": ip_pool}, function(result) {
                                        console.log(result);
                                        // Direciona pro artigo
                                        res.redirect('/' + b.tipo + 's/' + slug);
                                    }, function(e) {
                                        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                                        // Direciona pro artigo
                                        res.redirect('/' + b.tipo + 's/' + slug);
                                    });
                                }
                            });
                        } else{
                            // Email para artigos enviados para revisão
                            var revMessage = {
                                "html": "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'><html xmlns='http://www.w3.org/1999/xhtml'><head><meta content='text/html; charset=utf-8' http-equiv='Content-Type' /><title></title><style type='text/css'>@media only screen and (max-width:480px){body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:none !important}body{width:100% !important;min-width:100% !important}td[id=bodyCell]{padding:10px !important}table.kmMobileHide{display:none !important}table[class=kmTextContentContainer]{width:100% !important}table[class=kmBoxedTextContentContainer]{width:100% !important}td[class=kmImageContent]{padding-left:0 !important;padding-right:0 !important}img[class=kmImage]{width:100% !important}table[class=kmSplitContentLeftContentContainer],table[class=kmSplitContentRightContentContainer],table[class=kmColumnContainer],td[class=kmVerticalButtonBarContentOuter] table[class=kmButtonBarContent],td[class=kmVerticalButtonCollectionContentOuter] table[class=kmButtonCollectionContent],table[class=kmVerticalButton],table[class=kmVerticalButtonContent]{width:100% !important}td[class=kmButtonCollectionInner]{padding-left:9px !important;padding-right:9px !important;padding-top:9px !important;padding-bottom:0 !important;background-color:transparent !important}td[class=kmVerticalButtonIconContent],td[class=kmVerticalButtonTextContent],td[class=kmVerticalButtonContentOuter]{padding-left:0 !important;padding-right:0 !important;padding-bottom:9px !important}table[class=kmSplitContentLeftContentContainer] td[class=kmTextContent],table[class=kmSplitContentRightContentContainer] td[class=kmTextContent],table[class=kmColumnContainer] td[class=kmTextContent],table[class=kmSplitContentLeftContentContainer] td[class=kmImageContent],table[class=kmSplitContentRightContentContainer] td[class=kmImageContent]{padding-top:9px !important}td[class='rowContainer kmFloatLeft'],td[class='rowContainer kmFloatLeft firstColumn'],td[class='rowContainer kmFloatLeft lastColumn']{float:left;clear:both;width:100% !important}table[id=templateContainer],table[class=templateRow]{max-width:600px !important;width:100% !important}h1{font-size:24px !important;line-height:130% !important}h2{font-size:20px !important;line-height:130% !important}h3{font-size:18px !important;line-height:130% !important}h4{font-size:16px !important;line-height:130% !important}td[class=kmTextContent]{font-size:14px !important;line-height:130% !important}td[class=kmTextBlockInner] td[class=kmTextContent]{padding-right:18px !important;padding-left:18px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner]{padding-left:9px !important;padding-right:9px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner] [class=kmTextContent]{font-size:14px !important;line-height:130% !important;padding-left:4px !important;padding-right:4px !important}}</style></head><body style='margin:0;padding:0;background-color:#c7c7c7'><center><table align='center' border='0' cellpadding='0' cellspacing='0' id='bodyTable' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;background-color:#c7c7c7;height:100%;margin:0;width:100%'><tbody><tr><td align='center' id='bodyCell' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding-top:50px;padding-left:20px;padding-bottom:20px;padding-right:20px;border-top:0;height:100%;margin:0;width:100%'><table border='0' cellpadding='0' cellspacing='0' id='templateContainer' width='600' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;border:1px solid #aaa;background-color:#f4f4f4;border-radius:0'><tbody><tr><td id='templateContainerInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmImageBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmImageBlockOuter'><tr><td class='kmImageBlockInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:9px;' valign='top'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmImageContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmImageContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;padding-top:0px;padding-bottom:0;padding-left:9px;padding-right:9px;'><img align='left' alt='' class='kmImage' src='https://d3k81ch9hvuctc.cloudfront.net/company%2Fb674Zj%2Fimages%2Fheader_email.jpg' width='564' style='border:0;height:auto;line-height:100%;outline:none;text-decoration:none;padding-bottom:0;display:inline;vertical-align:bottom;margin-right:0;max-width:800px;' /></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmTextBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmTextBlockOuter'><tr><td class='kmTextBlockInner' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmTextContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmTextContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#505050;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;'><h1 style='color:#222;display:block;font-family:Helvetica, Arial;font-size:26px;font-style:normal;font-weight:bold;line-height:110%;letter-spacing:normal;margin:0;margin-bottom:9px;text-align:left'>Artigo em Revisão!</h1><p style='margin:0;padding-bottom:1em'> </p><p style='margin:0;padding-bottom:1em'>Obrigado pelo envio do texto " + b.docTitle.replace('<p>', '').replace('</p>', '') + ". Em breve um de nossos editores irá avaliá-lo e ou o publicará ou retornará com comentários e correções. Enquanto isso, aproveite para ler mais alguns textos excelentes do Gueime!</p><p style='margin:0;padding-bottom:1em'>Abraços,</p><p style='margin:0;padding-bottom:0'>Equipe Gueime</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></table></td></tr></tbody></table></td></tr></tbody></table></center></body></html>",
                                "text": "Obrigado pelo envio do texto " + b.docTitle.replace('<p>', '').replace('</p>', '') + ". Em breve um de nossos editores irá avaliá-lo e ou o publicará ou retornará com comentários e correções. Enquanto isso, aproveite para ler mais alguns textos excelentes do Gueime!",
                                "subject": "Gueime - Artigo em Revisão",
                                "from_email": "parceiros@gueime.com.br",
                                "from_name": "Gueime - Parceiros",
                                "to": [{
                                        "email": user.email,
                                        "name": user.name.first,
                                        "type": "to"
                                    },
                                    {
                                        "email": "parceiros@gueime.com.br",
                                        "name": "Parceiros",
                                        "type": "bcc"
                                    }],
                                "headers": {
                                    "Reply-To": "parceiros@gueime.com.br"
                                },
                                "important": false,
                                "track_opens": true,
                                "track_clicks": true,
                                "auto_text": null,
                                "auto_html": true,
                                "inline_css": null,
                                "url_strip_qs": null,
                                "preserve_recipients": null,
                                "view_content_link": null,
                                "return_path_domain": null,
                                "tags": [
                                    "revMessage"
                                ]
                            };
                            var async = false;
                            var ip_pool = "Main Pool";
                            // Evio de Email
                            mandrill_client.messages.send({"message": revMessage, "async": async, "ip_pool": ip_pool}, function(result) {
                                console.log(result);
                                // Direciona pro artigo
                                res.redirect('/' + b.tipo + 's/' + slug);
                            }, function(e) {
                                console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                                // Manda pra revisão
                                res.redirect('/?status=revision');
                            });
                            
                        }
                    });
                } else if (b.tipo == 'artigo') {
                    Artigos.findOneAndUpdate({_id: id}, { $set: {

                        description: b.descricao,
                        status: status,
                        publishDate: publishDate,
                        'cover.image': b.coverUrl,
                        'cover.position': b.position,
                        tags: sendTags,
                        'graph.games': sendGames,
                        'graph.consoles': sendConsoles,
                        'graph.genres': sendGeneros,
                        'graph.developers': sendDesenvolvedores,
                        'graph.publishers': sendPublicadoras,
                        'article.category': sendCategoriaArtigo,
                        'article.serie': b.serieArtigo,
                        slug: slug,
                        'authors.revision': user._id

                    }, $addToSet: {
                        facet: { $each: sendFacet }
                    }
                    }, function (err, art) {
                        if (err)
                            throw err
                        if(user.status == 'admin' || user.status == 'editor'){
                            // Atribuição de pontuação
                            Users.findOneAndUpdate({_id: criador}, {$inc: {'graph.publications': 1, 'gamification.points': 30}}, function(err, thisCreator){
                                // Ganha pontos por revisão
                                if(criador != user._id){
                                    if(user.graph.revisionCol.indexOf(art._id) > -1){
                                        res.redirect('/' + b.tipo + 's/' + slug);
                                    } else {
                                        Users.update({_id: user._id}, {$inc: {'gamification.points': 30, 'graph.revisions': 1}, $addToSet: {'graph.revisionCol': art._id}}, function(err){
                                            // Email enviado para artigos revisados e publicados
                                            var pubMessage = {
                                                "html": "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'><html xmlns='http://www.w3.org/1999/xhtml'><head><meta content='text/html; charset=utf-8' http-equiv='Content-Type' /><title></title><style type='text/css'>@media only screen and (max-width:480px){body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:none !important}body{width:100% !important;min-width:100% !important}td[id=bodyCell]{padding:10px !important}table.kmMobileHide{display:none !important}table[class=kmTextContentContainer]{width:100% !important}table[class=kmBoxedTextContentContainer]{width:100% !important}td[class=kmImageContent]{padding-left:0 !important;padding-right:0 !important}img[class=kmImage]{width:100% !important}table[class=kmSplitContentLeftContentContainer],table[class=kmSplitContentRightContentContainer],table[class=kmColumnContainer],td[class=kmVerticalButtonBarContentOuter] table[class=kmButtonBarContent],td[class=kmVerticalButtonCollectionContentOuter] table[class=kmButtonCollectionContent],table[class=kmVerticalButton],table[class=kmVerticalButtonContent]{width:100% !important}td[class=kmButtonCollectionInner]{padding-left:9px !important;padding-right:9px !important;padding-top:9px !important;padding-bottom:0 !important;background-color:transparent !important}td[class=kmVerticalButtonIconContent],td[class=kmVerticalButtonTextContent],td[class=kmVerticalButtonContentOuter]{padding-left:0 !important;padding-right:0 !important;padding-bottom:9px !important}table[class=kmSplitContentLeftContentContainer] td[class=kmTextContent],table[class=kmSplitContentRightContentContainer] td[class=kmTextContent],table[class=kmColumnContainer] td[class=kmTextContent],table[class=kmSplitContentLeftContentContainer] td[class=kmImageContent],table[class=kmSplitContentRightContentContainer] td[class=kmImageContent]{padding-top:9px !important}td[class='rowContainer kmFloatLeft'],td[class='rowContainer kmFloatLeft firstColumn'],td[class='rowContainer kmFloatLeft lastColumn']{float:left;clear:both;width:100% !important}table[id=templateContainer],table[class=templateRow]{max-width:600px !important;width:100% !important}h1{font-size:24px !important;line-height:130% !important}h2{font-size:20px !important;line-height:130% !important}h3{font-size:18px !important;line-height:130% !important}h4{font-size:16px !important;line-height:130% !important}td[class=kmTextContent]{font-size:14px !important;line-height:130% !important}td[class=kmTextBlockInner] td[class=kmTextContent]{padding-right:18px !important;padding-left:18px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner]{padding-left:9px !important;padding-right:9px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner] [class=kmTextContent]{font-size:14px !important;line-height:130% !important;padding-left:4px !important;padding-right:4px !important}}</style></head><body style='margin:0;padding:0;background-color:#c7c7c7'><center><table align='center' border='0' cellpadding='0' cellspacing='0' id='bodyTable' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;background-color:#c7c7c7;height:100%;margin:0;width:100%'><tbody><tr><td align='center' id='bodyCell' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding-top:50px;padding-left:20px;padding-bottom:20px;padding-right:20px;border-top:0;height:100%;margin:0;width:100%'><table border='0' cellpadding='0' cellspacing='0' id='templateContainer' width='600' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;border:1px solid #aaa;background-color:#f4f4f4;border-radius:0'><tbody><tr><td id='templateContainerInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmImageBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmImageBlockOuter'><tr><td class='kmImageBlockInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:9px;' valign='top'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmImageContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmImageContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;padding-top:0px;padding-bottom:0;padding-left:9px;padding-right:9px;'><img align='left' alt='' class='kmImage' src='https://d3k81ch9hvuctc.cloudfront.net/company%2Fb674Zj%2Fimages%2Fheader_email.jpg' width='564' style='border:0;height:auto;line-height:100%;outline:none;text-decoration:none;padding-bottom:0;display:inline;vertical-align:bottom;margin-right:0;max-width:800px;' /></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmTextBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmTextBlockOuter'><tr><td class='kmTextBlockInner' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmTextContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmTextContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#505050;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;'><h1 style='color:#222;display:block;font-family:Helvetica, Arial;font-size:26px;font-style:normal;font-weight:bold;line-height:110%;letter-spacing:normal;margin:0;margin-bottom:9px;text-align:left'>Artigo Revisado e Publicado!</h1><p style='margin:0;padding-bottom:1em'> </p><p style='margin:0;padding-bottom:1em'>O artigo " + b.docTitle.replace('<p>', '').replace('</p>', '') + " foi revisado por " + user.name.first + " " + user.name.last + ". Você poderá acessá-lo pelo link: http://www.gueime.com.br/" + b.tipo + "s/" + slug + " . Agradecemos muito e esperamos muitos mais artigos excelentes pela frente!</p><p style='margin:0;padding-bottom:1em'>Abraços,</p><p style='margin:0;padding-bottom:0'>Equipe Gueime</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></table></td></tr></tbody></table></td></tr></tbody></table></center></body></html>",
                                                "text": "O artigo " + b.docTitle.replace('<p>', '').replace('</p>', '') + " foi revisado por " + user.name.first + " " + user.name.last + ". Você poderá acessá-lo pelo link: http://www.gueime.com.br/" + b.tipo + "s/" + slug + " . Agradecemos muito e esperamos muitos mais artigos excelentes pela frente!",
                                                "subject": "Gueime - Artigo Revisado e Publicado",
                                                "from_email": "parceiros@gueime.com.br",
                                                "from_name": "Gueime - Parceiros",
                                                "to": [{
                                                        "email": user.email,
                                                        "name": user.name.first,
                                                        "type": "to"
                                                    },
                                                    {
                                                        "email": criador.email,
                                                        "name": criador.name.first,
                                                        "type": "to"
                                                    },
                                                    {
                                                        "email": "parceiros@gueime.com.br",
                                                        "name": "Parceiros",
                                                        "type": "bcc"
                                                    }],
                                                "headers": {
                                                    "Reply-To": "parceiros@gueime.com.br"
                                                },
                                                "important": false,
                                                "track_opens": true,
                                                "track_clicks": true,
                                                "auto_text": null,
                                                "auto_html": true,
                                                "inline_css": null,
                                                "url_strip_qs": null,
                                                "preserve_recipients": null,
                                                "view_content_link": null,
                                                "return_path_domain": null,
                                                "tags": [
                                                    "pubMessage"
                                                ]
                                            };
                                            var async = false;
                                            var ip_pool = "Main Pool";
                                            // Evio de Email
                                            mandrill_client.messages.send({"message": pubMessage, "async": async, "ip_pool": ip_pool}, function(result) {
                                                console.log(result);
                                                // Direciona pro artigo
                                                res.redirect('/' + b.tipo + 's/' + slug);
                                            }, function(e) {
                                                console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                                                // Direciona pro artigo
                                                res.redirect('/' + b.tipo + 's/' + slug);
                                            });
                                        });
                                    }
                                } else {
                                    // Email para artigos publicados diretametne
                                    var dirMessage = {
                                        "html": "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'><html xmlns='http://www.w3.org/1999/xhtml'><head><meta content='text/html; charset=utf-8' http-equiv='Content-Type' /><title></title><style type='text/css'>@media only screen and (max-width:480px){body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:none !important}body{width:100% !important;min-width:100% !important}td[id=bodyCell]{padding:10px !important}table.kmMobileHide{display:none !important}table[class=kmTextContentContainer]{width:100% !important}table[class=kmBoxedTextContentContainer]{width:100% !important}td[class=kmImageContent]{padding-left:0 !important;padding-right:0 !important}img[class=kmImage]{width:100% !important}table[class=kmSplitContentLeftContentContainer],table[class=kmSplitContentRightContentContainer],table[class=kmColumnContainer],td[class=kmVerticalButtonBarContentOuter] table[class=kmButtonBarContent],td[class=kmVerticalButtonCollectionContentOuter] table[class=kmButtonCollectionContent],table[class=kmVerticalButton],table[class=kmVerticalButtonContent]{width:100% !important}td[class=kmButtonCollectionInner]{padding-left:9px !important;padding-right:9px !important;padding-top:9px !important;padding-bottom:0 !important;background-color:transparent !important}td[class=kmVerticalButtonIconContent],td[class=kmVerticalButtonTextContent],td[class=kmVerticalButtonContentOuter]{padding-left:0 !important;padding-right:0 !important;padding-bottom:9px !important}table[class=kmSplitContentLeftContentContainer] td[class=kmTextContent],table[class=kmSplitContentRightContentContainer] td[class=kmTextContent],table[class=kmColumnContainer] td[class=kmTextContent],table[class=kmSplitContentLeftContentContainer] td[class=kmImageContent],table[class=kmSplitContentRightContentContainer] td[class=kmImageContent]{padding-top:9px !important}td[class='rowContainer kmFloatLeft'],td[class='rowContainer kmFloatLeft firstColumn'],td[class='rowContainer kmFloatLeft lastColumn']{float:left;clear:both;width:100% !important}table[id=templateContainer],table[class=templateRow]{max-width:600px !important;width:100% !important}h1{font-size:24px !important;line-height:130% !important}h2{font-size:20px !important;line-height:130% !important}h3{font-size:18px !important;line-height:130% !important}h4{font-size:16px !important;line-height:130% !important}td[class=kmTextContent]{font-size:14px !important;line-height:130% !important}td[class=kmTextBlockInner] td[class=kmTextContent]{padding-right:18px !important;padding-left:18px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner]{padding-left:9px !important;padding-right:9px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner] [class=kmTextContent]{font-size:14px !important;line-height:130% !important;padding-left:4px !important;padding-right:4px !important}}</style></head><body style='margin:0;padding:0;background-color:#c7c7c7'><center><table align='center' border='0' cellpadding='0' cellspacing='0' id='bodyTable' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;background-color:#c7c7c7;height:100%;margin:0;width:100%'><tbody><tr><td align='center' id='bodyCell' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding-top:50px;padding-left:20px;padding-bottom:20px;padding-right:20px;border-top:0;height:100%;margin:0;width:100%'><table border='0' cellpadding='0' cellspacing='0' id='templateContainer' width='600' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;border:1px solid #aaa;background-color:#f4f4f4;border-radius:0'><tbody><tr><td id='templateContainerInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmImageBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmImageBlockOuter'><tr><td class='kmImageBlockInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:9px;' valign='top'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmImageContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmImageContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;padding-top:0px;padding-bottom:0;padding-left:9px;padding-right:9px;'><img align='left' alt='' class='kmImage' src='https://d3k81ch9hvuctc.cloudfront.net/company%2Fb674Zj%2Fimages%2Fheader_email.jpg' width='564' style='border:0;height:auto;line-height:100%;outline:none;text-decoration:none;padding-bottom:0;display:inline;vertical-align:bottom;margin-right:0;max-width:800px;' /></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmTextBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmTextBlockOuter'><tr><td class='kmTextBlockInner' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmTextContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmTextContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#505050;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;'><h1 style='color:#222;display:block;font-family:Helvetica, Arial;font-size:26px;font-style:normal;font-weight:bold;line-height:110%;letter-spacing:normal;margin:0;margin-bottom:9px;text-align:left'>Artigo Publicado!</h1><p style='margin:0;padding-bottom:1em'> </p><p style='margin:0;padding-bottom:1em'>O artigo " + b.docTitle.replace('<p>', '').replace('</p>', '') + " foi publicado. Você poderá acessá-lo pelo link: http://www.gueime.com.br/" + b.tipo + "s/" + slug + " . Agradecemos muito e esperamos muitos mais artigos excelentes pela frente!</p><p style='margin:0;padding-bottom:1em'>Abraços,</p><p style='margin:0;padding-bottom:0'>Equipe Gueime</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></table></td></tr></tbody></table></td></tr></tbody></table></center></body></html>",
                                        "text": "O artigo " + b.docTitle.replace('<p>', '').replace('</p>', '') + " foi publicado. Você poderá acessá-lo pelo link: http://www.gueime.com.br/" + b.tipo + "s/" + slug + " . Agradecemos muito e esperamos muitos mais artigos excelentes pela frente!",
                                        "subject": "Gueime - Artigo Publicado",
                                        "from_email": "parceiros@gueime.com.br",
                                        "from_name": "Gueime - Parceiros",
                                        "to": [{
                                                "email": user.email,
                                                "name": user.name.first,
                                                "type": "to"
                                            },
                                            {
                                                "email": "parceiros@gueime.com.br",
                                                "name": "Parceiros",
                                                "type": "bcc"
                                            }],
                                        "headers": {
                                            "Reply-To": "parceiros@gueime.com.br"
                                        },
                                        "important": false,
                                        "track_opens": true,
                                        "track_clicks": true,
                                        "auto_text": null,
                                        "auto_html": true,
                                        "inline_css": null,
                                        "url_strip_qs": null,
                                        "preserve_recipients": null,
                                        "view_content_link": null,
                                        "return_path_domain": null,
                                        "tags": [
                                            "dirMessage"
                                        ]
                                    };
                                    var async = false;
                                    var ip_pool = "Main Pool";
                                    // Evio de Email
                                    mandrill_client.messages.send({"message": dirMessage, "async": async, "ip_pool": ip_pool}, function(result) {
                                        console.log(result);
                                        // Direciona pro artigo
                                        res.redirect('/' + b.tipo + 's/' + slug);
                                    }, function(e) {
                                        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                                        // Direciona pro artigo
                                        res.redirect('/' + b.tipo + 's/' + slug);
                                    });
                                }
                            });
                        } else{
                            // Email para artigos enviados para revisão
                            var revMessage = {
                                "html": "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'><html xmlns='http://www.w3.org/1999/xhtml'><head><meta content='text/html; charset=utf-8' http-equiv='Content-Type' /><title></title><style type='text/css'>@media only screen and (max-width:480px){body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:none !important}body{width:100% !important;min-width:100% !important}td[id=bodyCell]{padding:10px !important}table.kmMobileHide{display:none !important}table[class=kmTextContentContainer]{width:100% !important}table[class=kmBoxedTextContentContainer]{width:100% !important}td[class=kmImageContent]{padding-left:0 !important;padding-right:0 !important}img[class=kmImage]{width:100% !important}table[class=kmSplitContentLeftContentContainer],table[class=kmSplitContentRightContentContainer],table[class=kmColumnContainer],td[class=kmVerticalButtonBarContentOuter] table[class=kmButtonBarContent],td[class=kmVerticalButtonCollectionContentOuter] table[class=kmButtonCollectionContent],table[class=kmVerticalButton],table[class=kmVerticalButtonContent]{width:100% !important}td[class=kmButtonCollectionInner]{padding-left:9px !important;padding-right:9px !important;padding-top:9px !important;padding-bottom:0 !important;background-color:transparent !important}td[class=kmVerticalButtonIconContent],td[class=kmVerticalButtonTextContent],td[class=kmVerticalButtonContentOuter]{padding-left:0 !important;padding-right:0 !important;padding-bottom:9px !important}table[class=kmSplitContentLeftContentContainer] td[class=kmTextContent],table[class=kmSplitContentRightContentContainer] td[class=kmTextContent],table[class=kmColumnContainer] td[class=kmTextContent],table[class=kmSplitContentLeftContentContainer] td[class=kmImageContent],table[class=kmSplitContentRightContentContainer] td[class=kmImageContent]{padding-top:9px !important}td[class='rowContainer kmFloatLeft'],td[class='rowContainer kmFloatLeft firstColumn'],td[class='rowContainer kmFloatLeft lastColumn']{float:left;clear:both;width:100% !important}table[id=templateContainer],table[class=templateRow]{max-width:600px !important;width:100% !important}h1{font-size:24px !important;line-height:130% !important}h2{font-size:20px !important;line-height:130% !important}h3{font-size:18px !important;line-height:130% !important}h4{font-size:16px !important;line-height:130% !important}td[class=kmTextContent]{font-size:14px !important;line-height:130% !important}td[class=kmTextBlockInner] td[class=kmTextContent]{padding-right:18px !important;padding-left:18px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner]{padding-left:9px !important;padding-right:9px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner] [class=kmTextContent]{font-size:14px !important;line-height:130% !important;padding-left:4px !important;padding-right:4px !important}}</style></head><body style='margin:0;padding:0;background-color:#c7c7c7'><center><table align='center' border='0' cellpadding='0' cellspacing='0' id='bodyTable' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;background-color:#c7c7c7;height:100%;margin:0;width:100%'><tbody><tr><td align='center' id='bodyCell' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding-top:50px;padding-left:20px;padding-bottom:20px;padding-right:20px;border-top:0;height:100%;margin:0;width:100%'><table border='0' cellpadding='0' cellspacing='0' id='templateContainer' width='600' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;border:1px solid #aaa;background-color:#f4f4f4;border-radius:0'><tbody><tr><td id='templateContainerInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmImageBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmImageBlockOuter'><tr><td class='kmImageBlockInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:9px;' valign='top'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmImageContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmImageContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;padding-top:0px;padding-bottom:0;padding-left:9px;padding-right:9px;'><img align='left' alt='' class='kmImage' src='https://d3k81ch9hvuctc.cloudfront.net/company%2Fb674Zj%2Fimages%2Fheader_email.jpg' width='564' style='border:0;height:auto;line-height:100%;outline:none;text-decoration:none;padding-bottom:0;display:inline;vertical-align:bottom;margin-right:0;max-width:800px;' /></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmTextBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmTextBlockOuter'><tr><td class='kmTextBlockInner' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmTextContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmTextContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#505050;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;'><h1 style='color:#222;display:block;font-family:Helvetica, Arial;font-size:26px;font-style:normal;font-weight:bold;line-height:110%;letter-spacing:normal;margin:0;margin-bottom:9px;text-align:left'>Artigo em Revisão!</h1><p style='margin:0;padding-bottom:1em'> </p><p style='margin:0;padding-bottom:1em'>Obrigado pelo envio do texto " + b.docTitle.replace('<p>', '').replace('</p>', '') + ". Em breve um de nossos editores irá avaliá-lo e ou o publicará ou retornará com comentários e correções. Enquanto isso, aproveite para ler mais alguns textos excelentes do Gueime!</p><p style='margin:0;padding-bottom:1em'>Abraços,</p><p style='margin:0;padding-bottom:0'>Equipe Gueime</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></table></td></tr></tbody></table></td></tr></tbody></table></center></body></html>",
                                "text": "Obrigado pelo envio do texto " + b.docTitle.replace('<p>', '').replace('</p>', '') + ". Em breve um de nossos editores irá avaliá-lo e ou o publicará ou retornará com comentários e correções. Enquanto isso, aproveite para ler mais alguns textos excelentes do Gueime!",
                                "subject": "Gueime - Artigo em Revisão",
                                "from_email": "parceiros@gueime.com.br",
                                "from_name": "Gueime - Parceiros",
                                "to": [{
                                        "email": user.email,
                                        "name": user.name.first,
                                        "type": "to"
                                    },
                                    {
                                        "email": "parceiros@gueime.com.br",
                                        "name": "Parceiros",
                                        "type": "bcc"
                                    }],
                                "headers": {
                                    "Reply-To": "parceiros@gueime.com.br"
                                },
                                "important": false,
                                "track_opens": true,
                                "track_clicks": true,
                                "auto_text": null,
                                "auto_html": true,
                                "inline_css": null,
                                "url_strip_qs": null,
                                "preserve_recipients": null,
                                "view_content_link": null,
                                "return_path_domain": null,
                                "tags": [
                                    "revMessage"
                                ]
                            };
                            var async = false;
                            var ip_pool = "Main Pool";
                            // Evio de Email
                            mandrill_client.messages.send({"message": revMessage, "async": async, "ip_pool": ip_pool}, function(result) {
                                console.log(result);
                                // Direciona pro artigo
                                res.redirect('/' + b.tipo + 's/' + slug);
                            }, function(e) {
                                console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                                // Manda pra revisão
                                res.redirect('/?status=revision');
                            });
                        }
                    });
                } else if (b.tipo == 'analise') {
                    console.log('mais aqui');
                    Artigos.findOneAndUpdate({_id: id}, { $set: {

                        description: b.descricao,
                        status: status,
                        publishDate: publishDate,
                        'cover.image': b.coverUrl,
                        'cover.position': b.position,
                        tags: sendTags,
                        'graph.games': sendGames,
                        'review.score': b.nota,
                        'review.good': analiseBom,
                        'review.bad': analiseRuim,
                        'review.punchLine': b.analiseEfeito,
                        slug: slug,
                        'authors.revision': user._id


                    }, $addToSet: {
                        facet: { $each: sendFacet }
                    }
                    }, function (err, art) {
                        if (err)
                            throw err
                        if(user.status == 'admin' || user.status == 'editor'){
                            // Atribuição de pontuação
                            Users.findOneAndUpdate({_id: criador}, {$inc: {'graph.publications': 1, 'gamification.points': 50}}, function(err, thisCreator){
                                // Ganha pontos por revisão
                                if(criador != user._id){
                                    if(user.graph.revisionCol.indexOf(art._id) > -1){
                                        res.redirect('/' + b.tipo + 's/' + slug);
                                    } else {
                                        Users.update({_id: user._id}, {$inc: {'gamification.points': 30, 'graph.revisions': 1}, $addToSet: {'graph.revisionCol': art._id}}, function(err){
                                            // Email enviado para artigos revisados e publicados
                                            var pubMessage = {
                                                "html": "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'><html xmlns='http://www.w3.org/1999/xhtml'><head><meta content='text/html; charset=utf-8' http-equiv='Content-Type' /><title></title><style type='text/css'>@media only screen and (max-width:480px){body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:none !important}body{width:100% !important;min-width:100% !important}td[id=bodyCell]{padding:10px !important}table.kmMobileHide{display:none !important}table[class=kmTextContentContainer]{width:100% !important}table[class=kmBoxedTextContentContainer]{width:100% !important}td[class=kmImageContent]{padding-left:0 !important;padding-right:0 !important}img[class=kmImage]{width:100% !important}table[class=kmSplitContentLeftContentContainer],table[class=kmSplitContentRightContentContainer],table[class=kmColumnContainer],td[class=kmVerticalButtonBarContentOuter] table[class=kmButtonBarContent],td[class=kmVerticalButtonCollectionContentOuter] table[class=kmButtonCollectionContent],table[class=kmVerticalButton],table[class=kmVerticalButtonContent]{width:100% !important}td[class=kmButtonCollectionInner]{padding-left:9px !important;padding-right:9px !important;padding-top:9px !important;padding-bottom:0 !important;background-color:transparent !important}td[class=kmVerticalButtonIconContent],td[class=kmVerticalButtonTextContent],td[class=kmVerticalButtonContentOuter]{padding-left:0 !important;padding-right:0 !important;padding-bottom:9px !important}table[class=kmSplitContentLeftContentContainer] td[class=kmTextContent],table[class=kmSplitContentRightContentContainer] td[class=kmTextContent],table[class=kmColumnContainer] td[class=kmTextContent],table[class=kmSplitContentLeftContentContainer] td[class=kmImageContent],table[class=kmSplitContentRightContentContainer] td[class=kmImageContent]{padding-top:9px !important}td[class='rowContainer kmFloatLeft'],td[class='rowContainer kmFloatLeft firstColumn'],td[class='rowContainer kmFloatLeft lastColumn']{float:left;clear:both;width:100% !important}table[id=templateContainer],table[class=templateRow]{max-width:600px !important;width:100% !important}h1{font-size:24px !important;line-height:130% !important}h2{font-size:20px !important;line-height:130% !important}h3{font-size:18px !important;line-height:130% !important}h4{font-size:16px !important;line-height:130% !important}td[class=kmTextContent]{font-size:14px !important;line-height:130% !important}td[class=kmTextBlockInner] td[class=kmTextContent]{padding-right:18px !important;padding-left:18px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner]{padding-left:9px !important;padding-right:9px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner] [class=kmTextContent]{font-size:14px !important;line-height:130% !important;padding-left:4px !important;padding-right:4px !important}}</style></head><body style='margin:0;padding:0;background-color:#c7c7c7'><center><table align='center' border='0' cellpadding='0' cellspacing='0' id='bodyTable' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;background-color:#c7c7c7;height:100%;margin:0;width:100%'><tbody><tr><td align='center' id='bodyCell' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding-top:50px;padding-left:20px;padding-bottom:20px;padding-right:20px;border-top:0;height:100%;margin:0;width:100%'><table border='0' cellpadding='0' cellspacing='0' id='templateContainer' width='600' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;border:1px solid #aaa;background-color:#f4f4f4;border-radius:0'><tbody><tr><td id='templateContainerInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmImageBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmImageBlockOuter'><tr><td class='kmImageBlockInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:9px;' valign='top'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmImageContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmImageContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;padding-top:0px;padding-bottom:0;padding-left:9px;padding-right:9px;'><img align='left' alt='' class='kmImage' src='https://d3k81ch9hvuctc.cloudfront.net/company%2Fb674Zj%2Fimages%2Fheader_email.jpg' width='564' style='border:0;height:auto;line-height:100%;outline:none;text-decoration:none;padding-bottom:0;display:inline;vertical-align:bottom;margin-right:0;max-width:800px;' /></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmTextBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmTextBlockOuter'><tr><td class='kmTextBlockInner' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmTextContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmTextContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#505050;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;'><h1 style='color:#222;display:block;font-family:Helvetica, Arial;font-size:26px;font-style:normal;font-weight:bold;line-height:110%;letter-spacing:normal;margin:0;margin-bottom:9px;text-align:left'>Artigo Revisado e Publicado!</h1><p style='margin:0;padding-bottom:1em'> </p><p style='margin:0;padding-bottom:1em'>O artigo " + b.docTitle.replace('<p>', '').replace('</p>', '') + " foi revisado por " + user.name.first + " " + user.name.last + ". Você poderá acessá-lo pelo link: http://www.gueime.com.br/" + b.tipo + "s/" + slug + " . Agradecemos muito e esperamos muitos mais artigos excelentes pela frente!</p><p style='margin:0;padding-bottom:1em'>Abraços,</p><p style='margin:0;padding-bottom:0'>Equipe Gueime</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></table></td></tr></tbody></table></td></tr></tbody></table></center></body></html>",
                                                "text": "O artigo " + b.docTitle.replace('<p>', '').replace('</p>', '') + " foi revisado por " + user.name.first + " " + user.name.last + ". Você poderá acessá-lo pelo link: http://www.gueime.com.br/" + b.tipo + "s/" + slug + " . Agradecemos muito e esperamos muitos mais artigos excelentes pela frente!",
                                                "subject": "Gueime - Artigo Revisado e Publicado",
                                                "from_email": "parceiros@gueime.com.br",
                                                "from_name": "Gueime - Parceiros",
                                                "to": [{
                                                        "email": user.email,
                                                        "name": user.name.first,
                                                        "type": "to"
                                                    },
                                                    {
                                                        "email": criador.email,
                                                        "name": criador.name.first,
                                                        "type": "to"
                                                    },
                                                    {
                                                        "email": "parceiros@gueime.com.br",
                                                        "name": "Parceiros",
                                                        "type": "bcc"
                                                    }],
                                                "headers": {
                                                    "Reply-To": "parceiros@gueime.com.br"
                                                },
                                                "important": false,
                                                "track_opens": true,
                                                "track_clicks": true,
                                                "auto_text": null,
                                                "auto_html": true,
                                                "inline_css": null,
                                                "url_strip_qs": null,
                                                "preserve_recipients": null,
                                                "view_content_link": null,
                                                "return_path_domain": null,
                                                "tags": [
                                                    "pubMessage"
                                                ]
                                            };
                                            var async = false;
                                            var ip_pool = "Main Pool";
                                            // Evio de Email
                                            mandrill_client.messages.send({"message": pubMessage, "async": async, "ip_pool": ip_pool}, function(result) {
                                                console.log(result);
                                                // Direciona pro artigo
                                                res.redirect('/' + b.tipo + 's/' + slug);
                                            }, function(e) {
                                                console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                                                // Direciona pro artigo
                                                res.redirect('/' + b.tipo + 's/' + slug);
                                            });
                                        });
                                    }
                                } else {
                                    // Email para artigos publicados diretametne
                                    var dirMessage = {
                                        "html": "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'><html xmlns='http://www.w3.org/1999/xhtml'><head><meta content='text/html; charset=utf-8' http-equiv='Content-Type' /><title></title><style type='text/css'>@media only screen and (max-width:480px){body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:none !important}body{width:100% !important;min-width:100% !important}td[id=bodyCell]{padding:10px !important}table.kmMobileHide{display:none !important}table[class=kmTextContentContainer]{width:100% !important}table[class=kmBoxedTextContentContainer]{width:100% !important}td[class=kmImageContent]{padding-left:0 !important;padding-right:0 !important}img[class=kmImage]{width:100% !important}table[class=kmSplitContentLeftContentContainer],table[class=kmSplitContentRightContentContainer],table[class=kmColumnContainer],td[class=kmVerticalButtonBarContentOuter] table[class=kmButtonBarContent],td[class=kmVerticalButtonCollectionContentOuter] table[class=kmButtonCollectionContent],table[class=kmVerticalButton],table[class=kmVerticalButtonContent]{width:100% !important}td[class=kmButtonCollectionInner]{padding-left:9px !important;padding-right:9px !important;padding-top:9px !important;padding-bottom:0 !important;background-color:transparent !important}td[class=kmVerticalButtonIconContent],td[class=kmVerticalButtonTextContent],td[class=kmVerticalButtonContentOuter]{padding-left:0 !important;padding-right:0 !important;padding-bottom:9px !important}table[class=kmSplitContentLeftContentContainer] td[class=kmTextContent],table[class=kmSplitContentRightContentContainer] td[class=kmTextContent],table[class=kmColumnContainer] td[class=kmTextContent],table[class=kmSplitContentLeftContentContainer] td[class=kmImageContent],table[class=kmSplitContentRightContentContainer] td[class=kmImageContent]{padding-top:9px !important}td[class='rowContainer kmFloatLeft'],td[class='rowContainer kmFloatLeft firstColumn'],td[class='rowContainer kmFloatLeft lastColumn']{float:left;clear:both;width:100% !important}table[id=templateContainer],table[class=templateRow]{max-width:600px !important;width:100% !important}h1{font-size:24px !important;line-height:130% !important}h2{font-size:20px !important;line-height:130% !important}h3{font-size:18px !important;line-height:130% !important}h4{font-size:16px !important;line-height:130% !important}td[class=kmTextContent]{font-size:14px !important;line-height:130% !important}td[class=kmTextBlockInner] td[class=kmTextContent]{padding-right:18px !important;padding-left:18px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner]{padding-left:9px !important;padding-right:9px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner] [class=kmTextContent]{font-size:14px !important;line-height:130% !important;padding-left:4px !important;padding-right:4px !important}}</style></head><body style='margin:0;padding:0;background-color:#c7c7c7'><center><table align='center' border='0' cellpadding='0' cellspacing='0' id='bodyTable' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;background-color:#c7c7c7;height:100%;margin:0;width:100%'><tbody><tr><td align='center' id='bodyCell' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding-top:50px;padding-left:20px;padding-bottom:20px;padding-right:20px;border-top:0;height:100%;margin:0;width:100%'><table border='0' cellpadding='0' cellspacing='0' id='templateContainer' width='600' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;border:1px solid #aaa;background-color:#f4f4f4;border-radius:0'><tbody><tr><td id='templateContainerInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmImageBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmImageBlockOuter'><tr><td class='kmImageBlockInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:9px;' valign='top'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmImageContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmImageContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;padding-top:0px;padding-bottom:0;padding-left:9px;padding-right:9px;'><img align='left' alt='' class='kmImage' src='https://d3k81ch9hvuctc.cloudfront.net/company%2Fb674Zj%2Fimages%2Fheader_email.jpg' width='564' style='border:0;height:auto;line-height:100%;outline:none;text-decoration:none;padding-bottom:0;display:inline;vertical-align:bottom;margin-right:0;max-width:800px;' /></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmTextBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmTextBlockOuter'><tr><td class='kmTextBlockInner' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmTextContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmTextContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#505050;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;'><h1 style='color:#222;display:block;font-family:Helvetica, Arial;font-size:26px;font-style:normal;font-weight:bold;line-height:110%;letter-spacing:normal;margin:0;margin-bottom:9px;text-align:left'>Artigo Publicado!</h1><p style='margin:0;padding-bottom:1em'> </p><p style='margin:0;padding-bottom:1em'>O artigo " + b.docTitle.replace('<p>', '').replace('</p>', '') + " foi publicado. Você poderá acessá-lo pelo link: http://www.gueime.com.br/" + b.tipo + "s/" + slug + " . Agradecemos muito e esperamos muitos mais artigos excelentes pela frente!</p><p style='margin:0;padding-bottom:1em'>Abraços,</p><p style='margin:0;padding-bottom:0'>Equipe Gueime</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></table></td></tr></tbody></table></td></tr></tbody></table></center></body></html>",
                                        "text": "O artigo " + b.docTitle.replace('<p>', '').replace('</p>', '') + " foi publicado. Você poderá acessá-lo pelo link: http://www.gueime.com.br/" + b.tipo + "s/" + slug + " . Agradecemos muito e esperamos muitos mais artigos excelentes pela frente!",
                                        "subject": "Gueime - Artigo Publicado",
                                        "from_email": "parceiros@gueime.com.br",
                                        "from_name": "Gueime - Parceiros",
                                        "to": [{
                                                "email": user.email,
                                                "name": user.name.first,
                                                "type": "to"
                                            },
                                            {
                                                "email": "parceiros@gueime.com.br",
                                                "name": "Parceiros",
                                                "type": "bcc"
                                            }],
                                        "headers": {
                                            "Reply-To": "parceiros@gueime.com.br"
                                        },
                                        "important": false,
                                        "track_opens": true,
                                        "track_clicks": true,
                                        "auto_text": null,
                                        "auto_html": true,
                                        "inline_css": null,
                                        "url_strip_qs": null,
                                        "preserve_recipients": null,
                                        "view_content_link": null,
                                        "return_path_domain": null,
                                        "tags": [
                                            "dirMessage"
                                        ]
                                    };
                                    var async = false;
                                    var ip_pool = "Main Pool";
                                    // Evio de Email
                                    mandrill_client.messages.send({"message": dirMessage, "async": async, "ip_pool": ip_pool}, function(result) {
                                        console.log(result);
                                        // Direciona pro artigo
                                        res.redirect('/' + b.tipo + 's/' + slug);
                                    }, function(e) {
                                        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                                        // Direciona pro artigo
                                        res.redirect('/' + b.tipo + 's/' + slug);
                                    });
                                }
                            });
                        } else{
                            // Email para artigos enviados para revisão
                            var revMessage = {
                                "html": "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'><html xmlns='http://www.w3.org/1999/xhtml'><head><meta content='text/html; charset=utf-8' http-equiv='Content-Type' /><title></title><style type='text/css'>@media only screen and (max-width:480px){body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:none !important}body{width:100% !important;min-width:100% !important}td[id=bodyCell]{padding:10px !important}table.kmMobileHide{display:none !important}table[class=kmTextContentContainer]{width:100% !important}table[class=kmBoxedTextContentContainer]{width:100% !important}td[class=kmImageContent]{padding-left:0 !important;padding-right:0 !important}img[class=kmImage]{width:100% !important}table[class=kmSplitContentLeftContentContainer],table[class=kmSplitContentRightContentContainer],table[class=kmColumnContainer],td[class=kmVerticalButtonBarContentOuter] table[class=kmButtonBarContent],td[class=kmVerticalButtonCollectionContentOuter] table[class=kmButtonCollectionContent],table[class=kmVerticalButton],table[class=kmVerticalButtonContent]{width:100% !important}td[class=kmButtonCollectionInner]{padding-left:9px !important;padding-right:9px !important;padding-top:9px !important;padding-bottom:0 !important;background-color:transparent !important}td[class=kmVerticalButtonIconContent],td[class=kmVerticalButtonTextContent],td[class=kmVerticalButtonContentOuter]{padding-left:0 !important;padding-right:0 !important;padding-bottom:9px !important}table[class=kmSplitContentLeftContentContainer] td[class=kmTextContent],table[class=kmSplitContentRightContentContainer] td[class=kmTextContent],table[class=kmColumnContainer] td[class=kmTextContent],table[class=kmSplitContentLeftContentContainer] td[class=kmImageContent],table[class=kmSplitContentRightContentContainer] td[class=kmImageContent]{padding-top:9px !important}td[class='rowContainer kmFloatLeft'],td[class='rowContainer kmFloatLeft firstColumn'],td[class='rowContainer kmFloatLeft lastColumn']{float:left;clear:both;width:100% !important}table[id=templateContainer],table[class=templateRow]{max-width:600px !important;width:100% !important}h1{font-size:24px !important;line-height:130% !important}h2{font-size:20px !important;line-height:130% !important}h3{font-size:18px !important;line-height:130% !important}h4{font-size:16px !important;line-height:130% !important}td[class=kmTextContent]{font-size:14px !important;line-height:130% !important}td[class=kmTextBlockInner] td[class=kmTextContent]{padding-right:18px !important;padding-left:18px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner]{padding-left:9px !important;padding-right:9px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner] [class=kmTextContent]{font-size:14px !important;line-height:130% !important;padding-left:4px !important;padding-right:4px !important}}</style></head><body style='margin:0;padding:0;background-color:#c7c7c7'><center><table align='center' border='0' cellpadding='0' cellspacing='0' id='bodyTable' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;background-color:#c7c7c7;height:100%;margin:0;width:100%'><tbody><tr><td align='center' id='bodyCell' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding-top:50px;padding-left:20px;padding-bottom:20px;padding-right:20px;border-top:0;height:100%;margin:0;width:100%'><table border='0' cellpadding='0' cellspacing='0' id='templateContainer' width='600' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;border:1px solid #aaa;background-color:#f4f4f4;border-radius:0'><tbody><tr><td id='templateContainerInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmImageBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmImageBlockOuter'><tr><td class='kmImageBlockInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:9px;' valign='top'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmImageContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmImageContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;padding-top:0px;padding-bottom:0;padding-left:9px;padding-right:9px;'><img align='left' alt='' class='kmImage' src='https://d3k81ch9hvuctc.cloudfront.net/company%2Fb674Zj%2Fimages%2Fheader_email.jpg' width='564' style='border:0;height:auto;line-height:100%;outline:none;text-decoration:none;padding-bottom:0;display:inline;vertical-align:bottom;margin-right:0;max-width:800px;' /></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmTextBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmTextBlockOuter'><tr><td class='kmTextBlockInner' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmTextContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmTextContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#505050;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;'><h1 style='color:#222;display:block;font-family:Helvetica, Arial;font-size:26px;font-style:normal;font-weight:bold;line-height:110%;letter-spacing:normal;margin:0;margin-bottom:9px;text-align:left'>Artigo em Revisão!</h1><p style='margin:0;padding-bottom:1em'> </p><p style='margin:0;padding-bottom:1em'>Obrigado pelo envio do texto " + b.docTitle.replace('<p>', '').replace('</p>', '') + ". Em breve um de nossos editores irá avaliá-lo e ou o publicará ou retornará com comentários e correções. Enquanto isso, aproveite para ler mais alguns textos excelentes do Gueime!</p><p style='margin:0;padding-bottom:1em'>Abraços,</p><p style='margin:0;padding-bottom:0'>Equipe Gueime</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></table></td></tr></tbody></table></td></tr></tbody></table></center></body></html>",
                                "text": "Obrigado pelo envio do texto " + b.docTitle.replace('<p>', '').replace('</p>', '') + ". Em breve um de nossos editores irá avaliá-lo e ou o publicará ou retornará com comentários e correções. Enquanto isso, aproveite para ler mais alguns textos excelentes do Gueime!",
                                "subject": "Gueime - Artigo em Revisão",
                                "from_email": "parceiros@gueime.com.br",
                                "from_name": "Gueime - Parceiros",
                                "to": [{
                                        "email": user.email,
                                        "name": user.name.first,
                                        "type": "to"
                                    },
                                    {
                                        "email": "parceiros@gueime.com.br",
                                        "name": "Parceiros",
                                        "type": "bcc"
                                    }],
                                "headers": {
                                    "Reply-To": "parceiros@gueime.com.br"
                                },
                                "important": false,
                                "track_opens": true,
                                "track_clicks": true,
                                "auto_text": null,
                                "auto_html": true,
                                "inline_css": null,
                                "url_strip_qs": null,
                                "preserve_recipients": null,
                                "view_content_link": null,
                                "return_path_domain": null,
                                "tags": [
                                    "revMessage"
                                ]
                            };
                            var async = false;
                            var ip_pool = "Main Pool";
                            // Evio de Email
                            mandrill_client.messages.send({"message": revMessage, "async": async, "ip_pool": ip_pool}, function(result) {
                                console.log(result);
                                // Direciona pro artigo
                                res.redirect('/' + b.tipo + 's/' + slug);
                            }, function(e) {
                                console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                                // Manda pra revisão
                                res.redirect('/?status=revision');
                            });
                        }
                    });
                } else {
                    Artigos.findOneAndUpdate({_id: id}, { $set: {

                        description: b.descricao,
                        status: status,
                        publishDate: publishDate,
                        'cover.image': b.coverUrl,
                        'cover.position': b.position,
                        tags: sendTags,
                        'graph.games': sendGames,
                        'graph.consoles': sendConsoles,
                        'graph.genres': sendGeneros,
                        'graph.developers': sendDesenvolvedores,
                        'graph.publishers': sendPublicadoras,
                        'video.tipo': b.tipoVideo,
                        'video.canal': b.canalVideo,
                        'video.url': b.urlVideo,
                        slug: slug,
                        'authors.revision': user._id,
                        'video.autoral': autoral

                    }, $addToSet: {
                        facet: { $each: sendFacet }
                    }
                    }, function (err, art) {
                        if (err)
                            throw err
                        if(user.status == 'admin' || user.status == 'editor'){
                            var videoPoints;
                            if(autoral == 'true'){
                                videoPoints = 50;
                            } else {
                                videoPoints = 5;
                            }
                            // Atribuição de pontuação
                            Users.findOneAndUpdate({_id: criador}, {$inc: {'graph.publications': 1, 'gamification.points': videoPoints}}, function(err, thisCreator){
                                // Ganha pontos por revisão
                                if(criador != user._id){
                                    if(user.graph.revisionCol.indexOf(art._id) > -1){
                                        res.redirect('/' + b.tipo + 's/' + slug);
                                    } else {
                                        Users.update({_id: user._id}, {$inc: {'gamification.points': 30, 'graph.revisions': 1}, $addToSet: {'graph.revisionCol': art._id}}, function(err){
                                            // Email enviado para artigos revisados e publicados
                                            var pubMessage = {
                                                "html": "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'><html xmlns='http://www.w3.org/1999/xhtml'><head><meta content='text/html; charset=utf-8' http-equiv='Content-Type' /><title></title><style type='text/css'>@media only screen and (max-width:480px){body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:none !important}body{width:100% !important;min-width:100% !important}td[id=bodyCell]{padding:10px !important}table.kmMobileHide{display:none !important}table[class=kmTextContentContainer]{width:100% !important}table[class=kmBoxedTextContentContainer]{width:100% !important}td[class=kmImageContent]{padding-left:0 !important;padding-right:0 !important}img[class=kmImage]{width:100% !important}table[class=kmSplitContentLeftContentContainer],table[class=kmSplitContentRightContentContainer],table[class=kmColumnContainer],td[class=kmVerticalButtonBarContentOuter] table[class=kmButtonBarContent],td[class=kmVerticalButtonCollectionContentOuter] table[class=kmButtonCollectionContent],table[class=kmVerticalButton],table[class=kmVerticalButtonContent]{width:100% !important}td[class=kmButtonCollectionInner]{padding-left:9px !important;padding-right:9px !important;padding-top:9px !important;padding-bottom:0 !important;background-color:transparent !important}td[class=kmVerticalButtonIconContent],td[class=kmVerticalButtonTextContent],td[class=kmVerticalButtonContentOuter]{padding-left:0 !important;padding-right:0 !important;padding-bottom:9px !important}table[class=kmSplitContentLeftContentContainer] td[class=kmTextContent],table[class=kmSplitContentRightContentContainer] td[class=kmTextContent],table[class=kmColumnContainer] td[class=kmTextContent],table[class=kmSplitContentLeftContentContainer] td[class=kmImageContent],table[class=kmSplitContentRightContentContainer] td[class=kmImageContent]{padding-top:9px !important}td[class='rowContainer kmFloatLeft'],td[class='rowContainer kmFloatLeft firstColumn'],td[class='rowContainer kmFloatLeft lastColumn']{float:left;clear:both;width:100% !important}table[id=templateContainer],table[class=templateRow]{max-width:600px !important;width:100% !important}h1{font-size:24px !important;line-height:130% !important}h2{font-size:20px !important;line-height:130% !important}h3{font-size:18px !important;line-height:130% !important}h4{font-size:16px !important;line-height:130% !important}td[class=kmTextContent]{font-size:14px !important;line-height:130% !important}td[class=kmTextBlockInner] td[class=kmTextContent]{padding-right:18px !important;padding-left:18px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner]{padding-left:9px !important;padding-right:9px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner] [class=kmTextContent]{font-size:14px !important;line-height:130% !important;padding-left:4px !important;padding-right:4px !important}}</style></head><body style='margin:0;padding:0;background-color:#c7c7c7'><center><table align='center' border='0' cellpadding='0' cellspacing='0' id='bodyTable' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;background-color:#c7c7c7;height:100%;margin:0;width:100%'><tbody><tr><td align='center' id='bodyCell' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding-top:50px;padding-left:20px;padding-bottom:20px;padding-right:20px;border-top:0;height:100%;margin:0;width:100%'><table border='0' cellpadding='0' cellspacing='0' id='templateContainer' width='600' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;border:1px solid #aaa;background-color:#f4f4f4;border-radius:0'><tbody><tr><td id='templateContainerInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmImageBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmImageBlockOuter'><tr><td class='kmImageBlockInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:9px;' valign='top'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmImageContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmImageContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;padding-top:0px;padding-bottom:0;padding-left:9px;padding-right:9px;'><img align='left' alt='' class='kmImage' src='https://d3k81ch9hvuctc.cloudfront.net/company%2Fb674Zj%2Fimages%2Fheader_email.jpg' width='564' style='border:0;height:auto;line-height:100%;outline:none;text-decoration:none;padding-bottom:0;display:inline;vertical-align:bottom;margin-right:0;max-width:800px;' /></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmTextBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmTextBlockOuter'><tr><td class='kmTextBlockInner' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmTextContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmTextContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#505050;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;'><h1 style='color:#222;display:block;font-family:Helvetica, Arial;font-size:26px;font-style:normal;font-weight:bold;line-height:110%;letter-spacing:normal;margin:0;margin-bottom:9px;text-align:left'>Artigo Revisado e Publicado!</h1><p style='margin:0;padding-bottom:1em'> </p><p style='margin:0;padding-bottom:1em'>O artigo " + b.docTitle.replace('<p>', '').replace('</p>', '') + " foi revisado por " + user.name.first + " " + user.name.last + ". Você poderá acessá-lo pelo link: http://www.gueime.com.br/" + b.tipo + "s/" + slug + " . Agradecemos muito e esperamos muitos mais artigos excelentes pela frente!</p><p style='margin:0;padding-bottom:1em'>Abraços,</p><p style='margin:0;padding-bottom:0'>Equipe Gueime</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></table></td></tr></tbody></table></td></tr></tbody></table></center></body></html>",
                                                "text": "O artigo " + b.docTitle.replace('<p>', '').replace('</p>', '') + " foi revisado por " + user.name.first + " " + user.name.last + ". Você poderá acessá-lo pelo link: http://www.gueime.com.br/" + b.tipo + "s/" + slug + " . Agradecemos muito e esperamos muitos mais artigos excelentes pela frente!",
                                                "subject": "Gueime - Artigo Revisado e Publicado",
                                                "from_email": "parceiros@gueime.com.br",
                                                "from_name": "Gueime - Parceiros",
                                                "to": [{
                                                        "email": user.email,
                                                        "name": user.name.first,
                                                        "type": "to"
                                                    },
                                                    {
                                                        "email": criador.email,
                                                        "name": criador.name.first,
                                                        "type": "to"
                                                    },
                                                    {
                                                        "email": "parceiros@gueime.com.br",
                                                        "name": "Parceiros",
                                                        "type": "bcc"
                                                    }],
                                                "headers": {
                                                    "Reply-To": "parceiros@gueime.com.br"
                                                },
                                                "important": false,
                                                "track_opens": true,
                                                "track_clicks": true,
                                                "auto_text": null,
                                                "auto_html": true,
                                                "inline_css": null,
                                                "url_strip_qs": null,
                                                "preserve_recipients": null,
                                                "view_content_link": null,
                                                "return_path_domain": null,
                                                "tags": [
                                                    "pubMessage"
                                                ]
                                            };
                                            var async = false;
                                            var ip_pool = "Main Pool";
                                            // Evio de Email
                                            mandrill_client.messages.send({"message": pubMessage, "async": async, "ip_pool": ip_pool}, function(result) {
                                                console.log(result);
                                                // Direciona pro artigo
                                                res.redirect('/' + b.tipo + 's/' + slug);
                                            }, function(e) {
                                                console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                                                // Direciona pro artigo
                                                res.redirect('/' + b.tipo + 's/' + slug);
                                            });
                                        });
                                    }
                                } else {
                                    // Email para artigos publicados diretametne
                                    var dirMessage = {
                                        "html": "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'><html xmlns='http://www.w3.org/1999/xhtml'><head><meta content='text/html; charset=utf-8' http-equiv='Content-Type' /><title></title><style type='text/css'>@media only screen and (max-width:480px){body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:none !important}body{width:100% !important;min-width:100% !important}td[id=bodyCell]{padding:10px !important}table.kmMobileHide{display:none !important}table[class=kmTextContentContainer]{width:100% !important}table[class=kmBoxedTextContentContainer]{width:100% !important}td[class=kmImageContent]{padding-left:0 !important;padding-right:0 !important}img[class=kmImage]{width:100% !important}table[class=kmSplitContentLeftContentContainer],table[class=kmSplitContentRightContentContainer],table[class=kmColumnContainer],td[class=kmVerticalButtonBarContentOuter] table[class=kmButtonBarContent],td[class=kmVerticalButtonCollectionContentOuter] table[class=kmButtonCollectionContent],table[class=kmVerticalButton],table[class=kmVerticalButtonContent]{width:100% !important}td[class=kmButtonCollectionInner]{padding-left:9px !important;padding-right:9px !important;padding-top:9px !important;padding-bottom:0 !important;background-color:transparent !important}td[class=kmVerticalButtonIconContent],td[class=kmVerticalButtonTextContent],td[class=kmVerticalButtonContentOuter]{padding-left:0 !important;padding-right:0 !important;padding-bottom:9px !important}table[class=kmSplitContentLeftContentContainer] td[class=kmTextContent],table[class=kmSplitContentRightContentContainer] td[class=kmTextContent],table[class=kmColumnContainer] td[class=kmTextContent],table[class=kmSplitContentLeftContentContainer] td[class=kmImageContent],table[class=kmSplitContentRightContentContainer] td[class=kmImageContent]{padding-top:9px !important}td[class='rowContainer kmFloatLeft'],td[class='rowContainer kmFloatLeft firstColumn'],td[class='rowContainer kmFloatLeft lastColumn']{float:left;clear:both;width:100% !important}table[id=templateContainer],table[class=templateRow]{max-width:600px !important;width:100% !important}h1{font-size:24px !important;line-height:130% !important}h2{font-size:20px !important;line-height:130% !important}h3{font-size:18px !important;line-height:130% !important}h4{font-size:16px !important;line-height:130% !important}td[class=kmTextContent]{font-size:14px !important;line-height:130% !important}td[class=kmTextBlockInner] td[class=kmTextContent]{padding-right:18px !important;padding-left:18px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner]{padding-left:9px !important;padding-right:9px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner] [class=kmTextContent]{font-size:14px !important;line-height:130% !important;padding-left:4px !important;padding-right:4px !important}}</style></head><body style='margin:0;padding:0;background-color:#c7c7c7'><center><table align='center' border='0' cellpadding='0' cellspacing='0' id='bodyTable' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;background-color:#c7c7c7;height:100%;margin:0;width:100%'><tbody><tr><td align='center' id='bodyCell' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding-top:50px;padding-left:20px;padding-bottom:20px;padding-right:20px;border-top:0;height:100%;margin:0;width:100%'><table border='0' cellpadding='0' cellspacing='0' id='templateContainer' width='600' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;border:1px solid #aaa;background-color:#f4f4f4;border-radius:0'><tbody><tr><td id='templateContainerInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmImageBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmImageBlockOuter'><tr><td class='kmImageBlockInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:9px;' valign='top'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmImageContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmImageContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;padding-top:0px;padding-bottom:0;padding-left:9px;padding-right:9px;'><img align='left' alt='' class='kmImage' src='https://d3k81ch9hvuctc.cloudfront.net/company%2Fb674Zj%2Fimages%2Fheader_email.jpg' width='564' style='border:0;height:auto;line-height:100%;outline:none;text-decoration:none;padding-bottom:0;display:inline;vertical-align:bottom;margin-right:0;max-width:800px;' /></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmTextBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmTextBlockOuter'><tr><td class='kmTextBlockInner' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmTextContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmTextContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#505050;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;'><h1 style='color:#222;display:block;font-family:Helvetica, Arial;font-size:26px;font-style:normal;font-weight:bold;line-height:110%;letter-spacing:normal;margin:0;margin-bottom:9px;text-align:left'>Artigo Publicado!</h1><p style='margin:0;padding-bottom:1em'> </p><p style='margin:0;padding-bottom:1em'>O artigo " + b.docTitle.replace('<p>', '').replace('</p>', '') + " foi publicado. Você poderá acessá-lo pelo link: http://www.gueime.com.br/" + b.tipo + "s/" + slug + " . Agradecemos muito e esperamos muitos mais artigos excelentes pela frente!</p><p style='margin:0;padding-bottom:1em'>Abraços,</p><p style='margin:0;padding-bottom:0'>Equipe Gueime</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></table></td></tr></tbody></table></td></tr></tbody></table></center></body></html>",
                                        "text": "O artigo " + b.docTitle.replace('<p>', '').replace('</p>', '') + " foi publicado. Você poderá acessá-lo pelo link: http://www.gueime.com.br/" + b.tipo + "s/" + slug + " . Agradecemos muito e esperamos muitos mais artigos excelentes pela frente!",
                                        "subject": "Gueime - Artigo Publicado",
                                        "from_email": "parceiros@gueime.com.br",
                                        "from_name": "Gueime - Parceiros",
                                        "to": [{
                                                "email": user.email,
                                                "name": user.name.first,
                                                "type": "to"
                                            },
                                            {
                                                "email": "parceiros@gueime.com.br",
                                                "name": "Parceiros",
                                                "type": "bcc"
                                            }],
                                        "headers": {
                                            "Reply-To": "parceiros@gueime.com.br"
                                        },
                                        "important": false,
                                        "track_opens": true,
                                        "track_clicks": true,
                                        "auto_text": null,
                                        "auto_html": true,
                                        "inline_css": null,
                                        "url_strip_qs": null,
                                        "preserve_recipients": null,
                                        "view_content_link": null,
                                        "return_path_domain": null,
                                        "tags": [
                                            "dirMessage"
                                        ]
                                    };
                                    var async = false;
                                    var ip_pool = "Main Pool";
                                    // Evio de Email
                                    mandrill_client.messages.send({"message": dirMessage, "async": async, "ip_pool": ip_pool}, function(result) {
                                        console.log(result);
                                        // Direciona pro artigo
                                        res.redirect('/' + b.tipo + 's/' + slug);
                                    }, function(e) {
                                        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                                        // Direciona pro artigo
                                        res.redirect('/' + b.tipo + 's/' + slug);
                                    });
                                }
                            });
                        } else{
                            // Email para artigos enviados para revisão
                            var revMessage = {
                                "html": "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'><html xmlns='http://www.w3.org/1999/xhtml'><head><meta content='text/html; charset=utf-8' http-equiv='Content-Type' /><title></title><style type='text/css'>@media only screen and (max-width:480px){body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:none !important}body{width:100% !important;min-width:100% !important}td[id=bodyCell]{padding:10px !important}table.kmMobileHide{display:none !important}table[class=kmTextContentContainer]{width:100% !important}table[class=kmBoxedTextContentContainer]{width:100% !important}td[class=kmImageContent]{padding-left:0 !important;padding-right:0 !important}img[class=kmImage]{width:100% !important}table[class=kmSplitContentLeftContentContainer],table[class=kmSplitContentRightContentContainer],table[class=kmColumnContainer],td[class=kmVerticalButtonBarContentOuter] table[class=kmButtonBarContent],td[class=kmVerticalButtonCollectionContentOuter] table[class=kmButtonCollectionContent],table[class=kmVerticalButton],table[class=kmVerticalButtonContent]{width:100% !important}td[class=kmButtonCollectionInner]{padding-left:9px !important;padding-right:9px !important;padding-top:9px !important;padding-bottom:0 !important;background-color:transparent !important}td[class=kmVerticalButtonIconContent],td[class=kmVerticalButtonTextContent],td[class=kmVerticalButtonContentOuter]{padding-left:0 !important;padding-right:0 !important;padding-bottom:9px !important}table[class=kmSplitContentLeftContentContainer] td[class=kmTextContent],table[class=kmSplitContentRightContentContainer] td[class=kmTextContent],table[class=kmColumnContainer] td[class=kmTextContent],table[class=kmSplitContentLeftContentContainer] td[class=kmImageContent],table[class=kmSplitContentRightContentContainer] td[class=kmImageContent]{padding-top:9px !important}td[class='rowContainer kmFloatLeft'],td[class='rowContainer kmFloatLeft firstColumn'],td[class='rowContainer kmFloatLeft lastColumn']{float:left;clear:both;width:100% !important}table[id=templateContainer],table[class=templateRow]{max-width:600px !important;width:100% !important}h1{font-size:24px !important;line-height:130% !important}h2{font-size:20px !important;line-height:130% !important}h3{font-size:18px !important;line-height:130% !important}h4{font-size:16px !important;line-height:130% !important}td[class=kmTextContent]{font-size:14px !important;line-height:130% !important}td[class=kmTextBlockInner] td[class=kmTextContent]{padding-right:18px !important;padding-left:18px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner]{padding-left:9px !important;padding-right:9px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner] [class=kmTextContent]{font-size:14px !important;line-height:130% !important;padding-left:4px !important;padding-right:4px !important}}</style></head><body style='margin:0;padding:0;background-color:#c7c7c7'><center><table align='center' border='0' cellpadding='0' cellspacing='0' id='bodyTable' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;background-color:#c7c7c7;height:100%;margin:0;width:100%'><tbody><tr><td align='center' id='bodyCell' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding-top:50px;padding-left:20px;padding-bottom:20px;padding-right:20px;border-top:0;height:100%;margin:0;width:100%'><table border='0' cellpadding='0' cellspacing='0' id='templateContainer' width='600' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;border:1px solid #aaa;background-color:#f4f4f4;border-radius:0'><tbody><tr><td id='templateContainerInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmImageBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmImageBlockOuter'><tr><td class='kmImageBlockInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:9px;' valign='top'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmImageContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmImageContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;padding-top:0px;padding-bottom:0;padding-left:9px;padding-right:9px;'><img align='left' alt='' class='kmImage' src='https://d3k81ch9hvuctc.cloudfront.net/company%2Fb674Zj%2Fimages%2Fheader_email.jpg' width='564' style='border:0;height:auto;line-height:100%;outline:none;text-decoration:none;padding-bottom:0;display:inline;vertical-align:bottom;margin-right:0;max-width:800px;' /></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmTextBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmTextBlockOuter'><tr><td class='kmTextBlockInner' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmTextContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmTextContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#505050;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;'><h1 style='color:#222;display:block;font-family:Helvetica, Arial;font-size:26px;font-style:normal;font-weight:bold;line-height:110%;letter-spacing:normal;margin:0;margin-bottom:9px;text-align:left'>Artigo em Revisão!</h1><p style='margin:0;padding-bottom:1em'> </p><p style='margin:0;padding-bottom:1em'>Obrigado pelo envio do texto " + b.docTitle.replace('<p>', '').replace('</p>', '') + ". Em breve um de nossos editores irá avaliá-lo e ou o publicará ou retornará com comentários e correções. Enquanto isso, aproveite para ler mais alguns textos excelentes do Gueime!</p><p style='margin:0;padding-bottom:1em'>Abraços,</p><p style='margin:0;padding-bottom:0'>Equipe Gueime</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></table></td></tr></tbody></table></td></tr></tbody></table></center></body></html>",
                                "text": "Obrigado pelo envio do texto " + b.docTitle.replace('<p>', '').replace('</p>', '') + ". Em breve um de nossos editores irá avaliá-lo e ou o publicará ou retornará com comentários e correções. Enquanto isso, aproveite para ler mais alguns textos excelentes do Gueime!",
                                "subject": "Gueime - Artigo em Revisão",
                                "from_email": "parceiros@gueime.com.br",
                                "from_name": "Gueime - Parceiros",
                                "to": [{
                                        "email": user.email,
                                        "name": user.name.first,
                                        "type": "to"
                                    },
                                    {
                                        "email": "parceiros@gueime.com.br",
                                        "name": "Parceiros",
                                        "type": "bcc"
                                    }],
                                "headers": {
                                    "Reply-To": "parceiros@gueime.com.br"
                                },
                                "important": false,
                                "track_opens": true,
                                "track_clicks": true,
                                "auto_text": null,
                                "auto_html": true,
                                "inline_css": null,
                                "url_strip_qs": null,
                                "preserve_recipients": null,
                                "view_content_link": null,
                                "return_path_domain": null,
                                "tags": [
                                    "revMessage"
                                ]
                            };
                            var async = false;
                            var ip_pool = "Main Pool";
                            // Evio de Email
                            mandrill_client.messages.send({"message": revMessage, "async": async, "ip_pool": ip_pool}, function(result) {
                                console.log(result);
                                // Direciona pro artigo
                                res.redirect('/' + b.tipo + 's/' + slug);
                            }, function(e) {
                                console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                                // Manda pra revisão
                                res.redirect('/?status=revision');
                            });
                        }
                    });
                }

            });

        } else {
            res.redirect('/parceiros');
        }
    });

    




    // =====================================
    // PROFILE PESSOAL =====================
    // =====================================
    app.get('/profile', function(req, res, next){
        var user = req.user;
        if(!user){
            res.redirect('/');
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                // sessionReload(req, res, next);
                Artigos.find({status: 'publicado', 'authors.main': user._id}, {description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1}).sort({'_id': -1}).limit(6).exec(function(err, docs){

                    if(user.birthDate){
                        var date = user.birthDate;
                        date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                    }
                    
                    plusView(user);
                        res.render('profile',{user: user, title: "" + user.name.first + ' ' + user.name.last, docs: docs, profile: user, canonical: true, date: date, public: false});
                });
            }
        }
    });


    // PROFILE PHOTOS EDIT
    app.get('/profile/editar', function(req, res, next){
        var user = req.user;
        if(!user){
            res.redirect('/');
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                // sessionReload(req, res, next);
                Artigos.find({status: 'publicado', 'authors.main': user._id}, {description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1}).sort({'_id': -1}).limit(6).exec(function(err, docs){

                    if(user.birthDate){
                        var date = user.birthDate;
                        date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                    }

                    res.render('profileEdit',{user: user, title: "" + user.name.first + ' ' + user.name.last, docs: docs, profile: user, canonical: true, date: date, public: false, edit: true});
                });
            }
        }
    });

    
    // UPLOAD DE NOVA COVER NA CRIAÇÃO DE PERFIL
    app.post('/newProfileCover', function (req, res, next) {
        var user = req.user;
        var sendImg = user.name.loginName + req.files.file.name;
        if (user.status == 'admin' || user.status == 'parceiro' || user.status == 'editor') {
            // get the temporary location of the file
            var tmp_path = req.files.file.path;
            // set where the file should actually exists - in this case it is in the "images" directory
            var target_path = './public/uploads/' + sendImg;
            // move the file from the temporary location to the intended location
            fs.rename(tmp_path, target_path, function (err) {
                if (err) throw err;
                // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
                fs.unlink(tmp_path, function () {
                    if (err) throw err;
                    
                });
            });
            var params = {
                steps: {
                    ':original': {
                        robot: '/http/import',
                        url: 'http://www.gueime.com.br/uploads/' + sendImg
                    }
                },
                template_id: '4d6889709f8911e48553eb5f0b551edf'
            };
            client.send(params, function(ok) {
                // success callback [optional]
                res.send('http://www.gueime.com.br/uploads/' + sendImg );
            }, function(err) {
                // error callback [optional]
                console.log('Error: ' + JSON.stringify(err));
            });
        } 
    });

    // UPDATE DA IMAGEM
    app.post('/profileImage', function(req, res){
        var user = req.user;
        var position = req.body.position;
        var b = req.body;

        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else {
                Users.update({_id: user._id}, {$set: {cover: position, photo: b.gameCover}}, function(err){
                    res.redirect('/profile');
                });
            }
        }
    });

    // =====================================
    // PROFILE UPDATES =====================
    // =====================================

    // INFORMAÇÕES
    app.put('/infoSend', function(req, res){
        var user = req.user;
        var b = req.body;
        var date, birthDate;
        
        if(b.birthDate != ''){
            date = b.birthDate.split('/');
            birthDate = new Date(date[2], date[1] - 1, date[0]);
        } else {
            birthDate = null;
        }
        

        if(!user){
            res.redirect('/');
        } else{
            Users.update({'_id': user._id},{$set:{
                'name.first': b.firstName,
                'name.last': b.lastName,
                'name.nickName': b.nickname,
                'birthDate': birthDate,
                'gender': b.gender,
                'site': b.site,
                'localization.country': b.country,
                'localization.city': b.city,
                'bio': b.bio
            }}, function(err){
                if(err)
                    throw err
                res.send('OK');
            });
        }
    });

    // SOCIAL
    app.put('/socialSend', function(req, res){
        var user = req.user;
        var b = req.body;

        if(!user){
            res.redirect('/');
        } else{
            Users.update({'_id': user._id},{$set:{
                'social.facebook.url': b.facebookUrl,
                'social.twitter.url': b.twitterUrl,
                'social.google.url': b.googleUrl,
                'social.xboxLive.name': b.xboxLive,
                'social.psn.name': b.psn,
                'social.steam.name': b.steam,
                'social.nintendo': b.nintendo,
                'social.gameCenter': b.gameCenter,
                'social.alvanista': b.alvanista
            }}, function(err){
                if(err)
                    throw err
                res.send('OK');
            });
        }
    });

    // CONTA
    app.put('/contaSend', function(req, res, next){
        passport.authenticate('local-signup', function(err, user, info){
            if(err) { 
                return res.send('err' + err);
            } else {
                return res.send('OK');
            }
        })(req,res,next);
    });

    // ACESSO TODOS PROFILES
    app.get('/profile/:user', function(req, res, next){
        var profile = req.params.user;
        var user = req.user;
        if(!user){
            Users.findOne({'name.loginName': profile}, function(err, profileUser){
                if(profileUser == null){
                    res.redirect('/');
                } else{
                    Artigos.find({status: 'publicado', 'authors.main': profileUser._id}, {description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1}).sort({'_id': -1}).limit(6).exec(function(err, docs){
                        if(profileUser.birthDate){
                            var date = profileUser.birthDate;
                            date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                        }
                        res.render('profile',{title: "" + profileUser.name.first + ' ' + profileUser.name.last, docs: docs, profile: profileUser, public: true, date: date});
                    });
                }
            });
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                // sessionReload(req, res, next);
                plusView(user);
                Users.findOne({'name.loginName': profile}, function(err, profileUser){
                    if(profileUser == null){
                        res.redirect('/');
                    } else{
                        Artigos.find({status: 'publicado', 'authors.main': profileUser._id}, {description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1}).sort({'_id': -1}).limit(6).exec(function(err, docs){

                            if(profileUser.birthDate){
                                var date = profileUser.birthDate;
                                date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }
                        
                            res.render('profile',{user: user, title: "" + profileUser.name.first + ' ' + profileUser.name.last, docs: docs, profile: profileUser, public: true, date: date});
                        });
                    }
                });
            }
        }
    });

    // PAGINAÇÃO PROFILE
    app.get('/paginationProfile', function(req, res){
        var userId = req.query.b;
        var n = req.query.n;

        Artigos.find({status: 'publicado', 'authors.main': userId}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ '_id': -1 }).limit(6).skip(n).exec(function (err, docs) {

            res.render('loadMore', { docs: docs });
        });
    });

    // =====================================
    // CONSOLE PAGE ========================
    // =====================================
    app.get('/consoles/:con', function(req, res, next){
        var user = req.user;
        var dev = req.params.con;

        if(!user){
            Console.findOneAndUpdate({slug: dev, status: 'publicado'}, {$inc: { 'graph.views': 1}}, function(err, dev){
                if(dev == null){
                    res.redirect('/');
                } else{
                    Artigos.find({status: 'publicado', 'graph.consoles': new RegExp(dev.title, 'i'), type: {$ne: 'analise'}}).sort({_id: -1}).limit(6).exec(function(err, articles){
                        Games.find({status: 'publicado', 'graph.console': new RegExp(dev.title, 'i')}).sort({'graph.views':-1}).limit(8).exec(function(err, games){
                            var artigo = [];
                        
                            for (i = 0; i < articles.length; i++) {
                                artigo.push(articles[i]);
                            }
                            if(games.length > 0) {

                            } else{
                                games = undefined;
                            }

                            if(dev.startDate){
                                var date = dev.startDate;
                                date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }

                            res.render('console', {user: user, title: "" + dev.title, dev: dev, docs: artigo, games: games, date: date, pub: true })
                        });
                    });
                }
            });
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                // sessionReload(req, res, next);
                plusView(user);
                Console.findOneAndUpdate({slug: dev, status: 'publicado'}, {$inc: { 'graph.views': 1}}, function(err, dev){
                    if(dev == null){
                        res.redirect('/');
                    } else{
                        Artigos.find({status: 'publicado', 'graph.consoles': new RegExp(dev.title, 'i'), type: {$ne: 'analise'}}).sort({_id: -1}).limit(6).exec(function(err, articles){
                            Games.find({status: 'publicado', 'graph.console': new RegExp(dev.title, 'i')}).sort({'graph.views':-1}).limit(8).exec(function(err, games){
                                var artigo = [];
                        
                                for (i = 0; i < articles.length; i++) {
                                    artigo.push(articles[i]);
                                }
                                if(games.length > 0) {

                                } else{
                                    games = undefined;
                                }

                                if(dev.startDate){
                                    var date = dev.startDate;
                                    date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                                }

                            
                                    res.render('console', {user: user, title: "" + dev.title, dev: dev, docs: artigo, games: games, date: date, pub: true });
                            });
                        });
                    }
                });
            }
        }
    });

    // EDIT CONSOLE
    app.get('/consoles/:con/editar', function(req, res, next){
        var user = req.user;
        var dev = req.params.con;
        if(!user){
            res.redirect('/');
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                // sessionReload(req, res, next);
                Console.findOneAndUpdate({slug: dev}, {status: 'rascunho'}, {new: false}, function(err, docs){
                    if(docs.status == 'publicado'){
                        managePoints(user._id, -10);
                    }
                    var date;
                    if(docs.startDate){
                        date = docs.startDate;
                        date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                    }
                    res.render('consoleEdit',{user: user, title: "" + docs.title, developer: docs, date: date, edit: true});
                });
            }
        }
    });

    // NOVO CONSOLE
    app.get('/criar/novo/console', function(req, res, next){
        var user = req.user;
        if(!user){
            res.redirect('/');
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else if(user.status == 'admin' || user.status == 'editor'){
                // sessionReload(req, res, next);
                res.render('consoleEdit',{user: user, title: "Novo Console", edit: false});
            } else{
                res.redirect('/parceiros');
            }
        }
    });

    // CRIAÇÃO CONSOLE
    app.post('/newConsole', function(req, res){
        var user = req.user,
            b = req.body;

        var slug = func.string_to_slug(b.nomeConsole);

        var date = b.date.split('/');
        var lauchDate = new Date(date[2], date[1] - 1, date[0]);

        if(!b.position){
            b.position = "background: url(https://s3-sa-east-1.amazonaws.com/portalgueime/images/gameBg.jpg) no-repeat center -65px;";
        }


        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else if(user.status == 'admin' || user.status == 'editor'){
                managePoints(user._id, 10);
                var status;
                if(user.status == 'admin'){
                    status = 'publicado';
                } else{
                    status = 'revisao';
                }
                if(b.editing == 'yes'){
                    Console.update({slug: b.lastSlug}, {$set:{
                        title: b.nomeConsole,
                        about: b.sobre,
                        slug: slug,
                        startDate: lauchDate,
                        genCover: b.gameCover,
                        cover: b.position,
                        status: status
                    }}, function(err){
                        res.redirect('/consoles/' + slug);
                    });
                } else {
                    new Console({
                        title: b.nomeConsole,
                        about: b.sobre,
                        slug: slug,
                        startDate: lauchDate,
                        genCover: b.gameCover,
                        cover: b.position,
                        status: status
                    }).save(function(err, docs){
                        res.redirect('/consoles/' + docs.slug);
                    });
                }           
            }
        }
    });

    // PAGINAÇÃO CONSOLE
    app.get('/paginationConsole', function(req, res){
        var pubTitle = req.query.b.toString();
        var n = req.query.n;

        Artigos.find({status: 'publicado', 'graph.consoles': new RegExp(pubTitle, 'i'), type: {$ne: 'analise'}}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ '_id': -1 }).limit(6).skip(n).exec(function (err, docs) {
            res.render('loadMore', { docs: docs });
        });
    });

    // =====================================
    // GENERO PAGE =========================
    // =====================================
    app.get('/generos/:gen', function(req, res, next){
        var user = req.user;
        var dev = req.params.gen;

        if(!user){
            Genre.findOneAndUpdate({slug: dev, status: 'publicado'}, {$inc: { 'graph.views': 1}}, function(err, dev){
                if(dev == null){
                    res.redirect('/');
                } else{
                    Artigos.find({status: 'publicado', 'graph.genres': new RegExp(dev.title, 'i'), type: {$ne: 'analise'}}).sort({_id: -1}).limit(6).exec(function(err, articles){
                        Games.find({status: 'publicado', 'graph.genre': new RegExp(dev.title, 'i')}).sort({release:1}).limit(8).exec(function(err, games){
                            var artigo = [];
                        
                            for (i = 0; i < articles.length; i++) {
                                artigo.push(articles[i]);
                            }
                            if(games.length > 0) {

                            } else{
                                games = undefined;
                            }

                            res.render('genre', {user: user, title: "" + dev.title, dev: dev, docs: artigo, games: games, pub: true })
                        });
                    });
                }
            });
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                // sessionReload(req, res, next);
                plusView(user);
                Genre.findOneAndUpdate({slug: dev, status: 'publicado'}, {$inc: { 'graph.views': 1}}, function(err, dev){
                    if(dev == null){
                        res.redirect('/');
                    } else{
                        Artigos.find({status: 'publicado', 'graph.genres': new RegExp(dev.title, 'i'), type: {$ne: 'analise'}}).sort({_id: -1}).limit(6).exec(function(err, articles){
                            Games.find({status: 'publicado', 'graph.genre': new RegExp(dev.title, 'i')}).sort({release:1}).limit(8).exec(function(err, games){
                                var artigo = [];
                        
                                for (i = 0; i < articles.length; i++) {
                                    artigo.push(articles[i]);
                                }
                                if(games.length > 0) {

                                } else{
                                    games = undefined;
                                }

                            
                                res.render('genre', {user: user, title: "" + dev.title, dev: dev, docs: artigo, games: games, pub: true });
                            });
                        });
                    }
                });
            }
        }
    });


    // EDIT GENERO
    app.get('/generos/:dev/editar', function(req, res, next){
        var user = req.user;
        var dev = req.params.dev;
        if(!user){
            res.redirect('/');
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                // sessionReload(req, res, next);
                Genre.findOneAndUpdate({slug: dev},{status: 'rascunho'}, {new: false}, function(err, docs){
                    if(docs.status == 'publicado'){
                        managePoints(user._id, -10);
                    }
                    res.render('genreEdit',{user: user, title: "" + docs.title, developer: docs, edit: true});
                });
            }
        }
    });

    // NOVO GENERO
    app.get('/criar/novo/genero', function(req, res, next){
        var user = req.user;
        if(!user){
            res.redirect('/');
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else if(user.status == 'admin' || user.status == 'editor'){
                // sessionReload(req, res, next);
                res.render('genreEdit',{user: user, title: "Novo Gênero", edit: false});
            } else{
                res.redirect('/parceiros');
            }
        }
    });

    // CRIAÇÃO GENERO
    app.post('/newGenre', function(req, res){
        var user = req.user,
            b = req.body;

        var slug = func.string_to_slug(b.nomeGenero);


            if(!b.position){
                b.position = "background: url(https://s3-sa-east-1.amazonaws.com/portalgueime/images/gameBg.jpg) no-repeat center -65px;";
            }


        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else if(user.status == 'admin' || user.status == 'editor'){
                managePoints(user._id, 10);
                var status;
                if(user.status == 'admin'){
                    status = 'publicado';
                } else{
                    status = 'revisao';
                }
                if(b.editing == 'yes'){
                    Genre.update({slug: b.lastSlug}, {$set:{
                        title: b.nomeGenero,
                        about: b.sobre,
                        slug: slug,
                        genCover: b.gameCover,
                        cover: b.position,
                        status: status
                    }}, function(err){
                        res.redirect('/generos/' + slug);
                    });
                } else {
                    new Genre({
                        title: b.nomeGenero,
                        about: b.sobre,
                        slug: slug,
                        genCover: b.gameCover,
                        cover: b.position,
                        status: status
                    }).save(function(err, docs){
                        res.redirect('/generos/' + docs.slug);
                    });
                }           
            }
        }
    });

    // PAGINAÇÃO GENERO
    app.get('/paginationGenre', function(req, res){
        var pubTitle = req.query.b.toString();
        var n = req.query.n;

        Artigos.find({status: 'publicado', 'graph.genres': new RegExp(pubTitle, 'i'), type: {$ne: 'analise'}}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ '_id': -1 }).limit(6).skip(n).exec(function (err, docs) {
            res.render('loadMore', { docs: docs });
        });
    });

    // =====================================
    // DISTRIBUIDORA PAGE ==================
    // =====================================
    app.get('/distribuidoras/:dev', function(req, res, next){
        var user = req.user;
        var dev = req.params.dev;

        if(!user){
            DevPub.findOneAndUpdate({slug: dev, type: 'publisher', status: 'publicado'}, {$inc: { 'graph.views': 1}}, function(err, dev){
                if(dev == null){
                    res.redirect('/');
                } else{
                    Artigos.find({status: 'publicado', 'graph.publishers': new RegExp(dev.title, 'i'), type: {$ne: 'analise'}}).sort({_id: -1}).limit(6).exec(function(err, articles){
                        Games.find({status: 'publicado', 'graph.publisher': new RegExp(dev.title, 'i')}).sort({release:1}).limit(8).exec(function(err, games){
                            var artigo = [];
                        
                            for (i = 0; i < articles.length; i++) {
                                artigo.push(articles[i]);
                            }
                            if(games.length > 0) {

                            } else{
                                games = undefined;
                            }
                        
                            if(dev.startDate){
                                var date = dev.startDate;
                                date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }

                            res.render('devPub', {user: user, title: "" + dev.title, dev: dev, docs: artigo, games: games, date: date, pub: true })
                        });
                    });
                }
            });
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                // sessionReload(req, res, next);
                plusView(user);
                DevPub.findOneAndUpdate({slug: dev, type: 'publisher', status: 'publicado'}, {$inc: { 'graph.views': 1}}, function(err, dev){
                    if(dev == null){
                        res.redirect('/');
                    } else{
                        Artigos.find({status: 'publicado', 'graph.publishers': new RegExp(dev.title, 'i'), type: {$ne: 'analise'}}).sort({_id: -1}).limit(6).exec(function(err, articles){
                            Games.find({status: 'publicado', 'graph.publisher': new RegExp(dev.title, 'i')}).sort({release:1}).limit(8).exec(function(err, games){
                                var artigo = [];
                        
                                for (i = 0; i < articles.length; i++) {
                                    artigo.push(articles[i]);
                                }
                                if(games.length > 0) {

                                } else{
                                    games = undefined;
                                }
                        
                                if(dev.startDate){
                                    var date = dev.startDate;
                                    date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                                }

                                res.render('devPub', {user: user, title: "" + dev.title, dev: dev, docs: artigo, games: games, date: date, pub: true });
                            });
                        });
                    }
                });
            }
        }
    });

    

    // PAGINAÇÃO DISTRIBUIDORA
    app.get('/paginationPub', function(req, res){
        var pubTitle = req.query.b.toString();
        var n = req.query.n;

        Artigos.find({status: 'publicado', 'graph.publishers': new RegExp(pubTitle, 'i'), type: {$ne: 'analise'}}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ '_id': -1 }).limit(6).skip(n).exec(function (err, docs) {
            res.render('loadMore', { docs: docs });
        });
    });

    // EDIT DISTRIBUIDORA
    app.get('/distribuidoras/:dev/editar', function(req, res, next){
        var user = req.user;
        var dev = req.params.dev;
        if(!user){
            res.redirect('/');
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                // sessionReload(req, res, next);
                DevPub.findOneAndUpdate({type: 'publisher', slug: dev}, {status: 'rascunho'}, {new: false}, function(err, docs){
                    if(docs.status == 'publicado'){
                        managePoints(user._id, -10);
                    }
                    var date;
                    if(docs.startDate){
                        date = docs.startDate;
                        date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                    }
                    res.render('devPubEdit',{user: user, title: "" + docs.title, developer: docs, edit: true, date: date, pub: true});
                });
            }
        }
    });

    // NOVO DISTRIBUIDORA
    app.get('/criar/novo/distribuidora', function(req, res, next){
        var user = req.user;
        if(!user){
            res.redirect('/');
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else if(user.status == 'admin' || user.status == 'editor'){
                // sessionReload(req, res, next);
                res.render('devPubEdit',{user: user, title: "Nova Distribuidora", edit: false, pub: true});
            } else{
                res.redirect('/parceiros');
            }
        }
    });

    // =====================================
    // DESENVOLVEDOR PAGE ==================
    // =====================================
    app.get('/desenvolvedores/:dev', function(req, res, next){
        var user = req.user;
        var dev = req.params.dev;

        if(!user){
            DevPub.findOneAndUpdate({slug: dev, type: 'developer', status: 'publicado'}, {$inc: { 'graph.views': 1}}, function(err, dev){
                if(dev == null){
                    res.redirect('/');
                } else{
                    Artigos.find({status: 'publicado', 'graph.developers': new RegExp(dev.title, 'i'), type: {$ne: 'analise'}}).sort({_id: -1}).limit(6).exec(function(err, articles){
                        Games.find({status: 'publicado', 'graph.developer': new RegExp(dev.title, 'i')}).sort({release:1}).limit(8).exec(function(err, games){
                            var artigo = [];
                        
                            for (i = 0; i < articles.length; i++) {
                                artigo.push(articles[i]);
                            }
                            if(games.length > 0) {

                            } else{
                                games = undefined;
                            }
                        
                            if(dev.startDate){
                                var date = dev.startDate;
                                date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }

                            res.render('devPub', {user: user, title: "" + dev.title, dev: dev, docs: artigo, games: games, date: date, pub: false })
                        });
                    });
                }
            });
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                // sessionReload(req, res, next);
                plusView(user);
                DevPub.findOneAndUpdate({slug: dev, type: 'developer', status: 'publicado'}, {$inc: { 'graph.views': 1}}, function(err, dev){
                    if(dev == null){
                        res.redirect('/');
                    } else{
                        Artigos.find({status: 'publicado', 'graph.developers': new RegExp(dev.title, 'i'), type: {$ne: 'analise'}}).sort({_id: -1}).limit(6).exec(function(err, articles){
                            Games.find({status: 'publicado', 'graph.developer': new RegExp(dev.title, 'i')}).sort({release:1}).limit(8).exec(function(err, games){
                                var artigo = [];
                        
                                for (i = 0; i < articles.length; i++) {
                                    artigo.push(articles[i]);
                                }
                                if(games.length > 0) {

                                } else{
                                    games = undefined;
                                }
                        
                                if(dev.startDate){
                                    var date = dev.startDate;
                                    date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                                }

                                res.render('devPub', {user: user, title: "" + dev.title, dev: dev, docs: artigo, games: games, date: date, pub: false });
                            });
                        });
                    }
                });
            }
        }
    });

    // EDIT DESENVOLVEDOR
    app.get('/desenvolvedores/:dev/editar', function(req, res, next){
        var user = req.user;
        var dev = req.params.dev;
        if(!user){
            res.redirect('/');
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                // sessionReload(req, res, next);
                DevPub.findOneAndUpdate({type: 'developer', slug: dev}, {status: 'rascunho'}, {new: false},function(err, docs){
                    if(docs.status == 'publicado'){
                        managePoints(user._id, -10);
                    }
                    var date;
                    if(docs.startDate){
                        date = docs.startDate;
                        date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                    }
                    res.render('devPubEdit',{user: user, title: "" + docs.title, developer: docs, edit: true, date: date, dev: true});
                });
            }
        }
    });

    // PAGINAÇÃO DEVELOPER
    app.get('/paginationDev', function(req, res){
        var devTitle = req.query.b.toString();
        var n = req.query.n;

        Artigos.find({status: 'publicado', 'graph.developers': new RegExp(devTitle, 'i'), type: {$ne: 'analise'}}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ '_id': -1 }).limit(6).skip(n).exec(function (err, docs) {
            res.render('loadMore', { docs: docs });
        });
    });

    // NOVO DESENVOLVEDOR
    app.get('/criar/novo/desenvolvedor', function(req, res, next){
        var user = req.user;
        if(!user){
            res.redirect('/');
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else if(user.status == 'admin' || user.status == 'editor'){
                // sessionReload(req, res, next);
                res.render('devPubEdit',{user: user, title: "Novo Desenvolvedor", edit: false, dev: true});
            } else{
                res.redirect('/parceiros');
            }
        }
    });

    // CRIAÇÃO DESENVOLVEDOR E DISTRIBUIDORA
    app.post('/newDevPub', function(req, res){
        var user = req.user,
            b = req.body,
            website = b.website,
            sendWebsite,
            type = b.type;

        var slug = func.string_to_slug(b.nomeDevPub);

        var date = b.date.split('/');
        var lauchDate = new Date(date[2], date[1] - 1, date[0]);

            if (website != undefined) { website = func.string_to_slug(b.website); if (website.indexOf('-') > -1) { website = website.split(/[\s,-]+/); sendWebsite = b.website.toString().split(',');; } else { sendWebsite = b.website } }


            if(!b.position){
                b.position = "background: url(https://s3-sa-east-1.amazonaws.com/portalgueime/images/gameBg.jpg) no-repeat center -65px;";
            }


        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else if(user.status == 'admin' || user.status == 'editor'){
                managePoints(user._id, 10);
                var status;
                if(user.status == 'admin'){
                    status = 'publicado';
                } else{
                    status = 'revisao';
                }
                if(type == 'dev'){
                    if(b.editing == 'yes'){
                        DevPub.update({slug: b.lastSlug, type: 'developer'}, {$set:{
                            type: 'developer',
                            title: b.nomeDevPub,
                            about: b.sobre,
                            slug: slug,
                            devCover: b.gameCover,
                            cover: b.position,
                            startDate: lauchDate,
                            website: sendWebsite,
                            status: status
                        }}, function(err){
                            res.redirect('/desenvolvedores/' + slug);
                        });
                    } else {
                        new DevPub({
                            type: 'developer',
                            title: b.nomeDevPub,
                            about: b.sobre,
                            slug: slug,
                            devCover: b.gameCover,
                            cover: b.position,
                            startDate: lauchDate,
                            website: sendWebsite,
                            status: status
                        }).save(function(err, docs){
                            res.redirect('/desenvolvedores/' + docs.slug);
                        });
                    }
                } else if(type == 'pub'){
                    if(b.editing == 'yes'){
                        DevPub.update({slug: b.lastSlug, type: 'publisher'}, {$set:{
                            type: 'publisher',
                            title: b.nomeDevPub,
                            about: b.sobre,
                            slug: slug,
                            devCover: b.gameCover,
                            cover: b.position,
                            startDate: lauchDate,
                            website: sendWebsite,
                            status: status
                        }}, function(err){
                            res.redirect('/distribuidoras/' + slug);
                        });
                    } else {
                        new DevPub({
                            type: 'publisher',
                            title: b.nomeDevPub,
                            about: b.sobre,
                            slug: slug,
                            devCover: b.gameCover,
                            cover: b.position,
                            startDate: lauchDate,
                            website: sendWebsite,
                            status: status
                        }).save(function(err, docs){
                            console.log(docs);
                            res.redirect('/distribuidoras/' + docs.slug);
                        });
                    }
                }            
            }
        }
    });

    // =====================================
    // GAMES PAGE ==========================
    // =====================================
    app.get('/jogos/:jogo', function(req, res, next){
        var user = req.user;
        var jogo = req.params.jogo;

        if(!user){
            Games.findOneAndUpdate({slug: jogo, status: 'publicado'}, {$inc: { 'graph.views': 1}}, function(err, game){
                if(game == null){
                    res.redirect('/');
                } else{
                    Artigos.find({status: 'publicado', $or: [{slug: jogo, type: 'analise'}, {'graph.games': new RegExp(game.title, 'i')}]}).sort({_id: -1}).limit(6).exec(function(err, articles){
                        var analise = [];
                            var artigo = [];
                            var decimal, score;
                        
                            for (i = 0; i < articles.length; i++) {
                                if(articles[i].type == 'analise'){
                                    analise.push(articles[i]);
                                    
                                } else{
                                    artigo.push(articles[i]);
                                }
                            }
                            if(analise.length > 0) {
                                scores = analise[0].review.score.toString().split('.');
                                score = scores[0];

                                if(scores.length < 2){
                                    decimal = 0;
                                } else{
                                    decimal = scores[1];
                                }
                            } else{
                                analise = undefined;
                            }
                        
                            if(game.release){
                                var date = game.release;
                                date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }

                        res.render('game', {title: "" + game.title, game: game, docs: artigo, analise: analise, date: date, score: score, decimal: decimal })
                    });
                }
            });
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                // sessionReload(req, res, next);
                plusView(user);
                Games.findOneAndUpdate({slug: jogo, status: 'publicado'}, {$inc: { 'graph.views': 1}}, function(err, game){
                    if(game == null){
                        res.redirect('/');
                    } else{
                        Artigos.find({status: 'publicado', $or: [{slug: jogo, type: 'analise'}, {'graph.games': new RegExp(game.title, 'i')}] }).sort({_id: -1}).limit(6).exec(function(err, articles){
                        
                            var analise = [];
                            var artigo = [];
                            var decimal, score;
                        
                            for (i = 0; i < articles.length; i++) {
                                if(articles[i].type == 'analise'){
                                    analise.push(articles[i]);
                                    
                                } else{
                                    artigo.push(articles[i]);
                                }
                            }
                            if(analise.length > 0) {
                                scores = analise[0].review.score.toString().split('.');
                                score = scores[0];

                                if(scores.length < 2){
                                    decimal = 0;
                                } else{
                                    decimal = scores[1];
                                }
                            } else{
                                analise = undefined;
                            }
                        
                            if(game.release){
                                var date = game.release;
                                date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }

                            res.render('game', {user: user, title: "" + game.title, game: game, docs: artigo, analise: analise, date: date, score: score, decimal: decimal });
                        });
                    }
                });
            }
        }
    });


    // ADD GAME TO FAVORITES
    app.put('/addToFavorites', function(req, res){
        var user = req.user;
        var game = req.body.game;
        var operation = req.body.add;
        
        if(operation == 'true'){
            managePoints(user._id, 2);
            Users.update({_id: user._id}, {$addToSet: {'graph.gamesLike': game}}, function(err){
                res.send('OK');
            });
        } else {
            managePoints(user._id, -2);
            Users.update({_id: user._id}, {$pull: {'graph.gamesLike': game}}, function(){
                res.send('OK');
            }); 
        }
    });

    

    // ADD GAME TO COLLECTION
    app.put('/addToCollection', function(req, res){
        var user = req.user;
        var game = req.body.game;
        var operation = req.body.add;

        if(operation == 'true'){
            Users.update({_id: user._id}, {$addToSet: {'graph.gamesCol': game}, $inc: {'gamification.points': 2}}, function(){
                Games.update({title: game}, {$inc: {'graph.gamers': 1}}, function(err){
                    res.send('OK');
                });
            });
        } else {
           Users.update({_id: user._id}, {$pull: {'graph.gamesCol': game}, $inc: {'gamification.points': -2}}, function(){
                Games.update({title: game}, {$inc: {'graph.gamers': -1}}, function(err){
                    res.send('OK');
                });
            }); 
        }
    });

    // PAGINAÇÃO GAME
    app.get('/paginationGame', function(req, res){
        var gameTitle = req.query.b.toString();
        var n = req.query.n;

        Artigos.find({status: 'publicado', 'graph.games': new RegExp(gameTitle, 'i'), type: {$ne: 'analise'}}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ '_id': -1 }).limit(6).skip(n).exec(function (err, docs) {
            res.render('loadMore', { docs: docs });
        });
    });

    // EDIT GAME
    app.get('/jogos/:jogo/editar', function(req, res, next){
        var user = req.user;
        var jogo = req.params.jogo;
        if(!user){
            res.redirect('/');
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                // sessionReload(req, res, next);
                
                Games.findOneAndUpdate({slug: jogo}, {status: 'rascunho'}, {new: false}, function(err, docs){
                    if(docs == null){
                        res.redirect('/');
                    } else{
                        if(docs.status == 'publicado'){
                            managePoints(user._id, -10);
                        }
                        var date;
                        if(docs.release){
                            date = docs.release;
                            date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                        }
                        res.render('gameEdit',{user: user, title: "" + docs.title, game: docs, edit: true, date: date});
                    }
                });
            }
        }
    });

    // NOVO GAME
    app.get('/criar/novo/jogo', function(req, res, next){
        var user = req.user;
        if(!user){
            res.redirect('/');
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else if(user.status == 'admin' || user.status == 'editor'){
                // sessionReload(req, res, next);
                res.render('gameEdit',{user: user, title: "Novo Jogo", edit: false});
            } else{
                res.redirect('/parceiros');
            }
        }
    });

    // UPLOAD DE NOVA COVER NA CRIAÇÃO DE GAME
    app.post('/newGameCapa', function (req, res, next) {
        var user = req.user;
        var sendImg = user.name.loginName + req.files.file.name;
        if (user.status == 'admin' || user.status == 'parceiro' || user.status == 'editor') {
            // get the temporary location of the file
            var tmp_path = req.files.file.path;
            // set where the file should actually exists - in this case it is in the "images" directory
            var target_path = './public/uploads/' + sendImg;
            // move the file from the temporary location to the intended location
            fs.rename(tmp_path, target_path, function (err) {
                if (err) throw err;
                // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
                fs.unlink(tmp_path, function () {
                    if (err) throw err;
                    
                });
            });
            var params = {
                steps: {
                    ':original': {
                        robot: '/http/import',
                        url: 'http://www.gueime.com.br/uploads/' + sendImg
                    }
                },
                template_id: '4d6889709f8911e48553eb5f0b551edf'
            };
            client.send(params, function(ok) {
                // success callback [optional]
                res.send('http://www.gueime.com.br/uploads/' + sendImg );
            }, function(err) {
                // error callback [optional]
                console.log('Error: ' + JSON.stringify(err));
            });
        } 
    });


    // NOVA CAPA DO JOGO
    app.post('/newGameCover', function (req, res, next) {
        var user = req.user;
        var sendImg = user.name.loginName + req.files.file.name;
        if (user.status == 'admin' || user.status == 'parceiro' || user.status == 'editor') {
            // get the temporary location of the file
            var tmp_path = req.files.file.path;
            // set where the file should actually exists - in this case it is in the "images" directory
            var target_path = './public/uploads/' + sendImg;
            // move the file from the temporary location to the intended location
            fs.rename(tmp_path, target_path, function (err) {
                if (err) throw err;
                // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
                fs.unlink(tmp_path, function () {
                    if (err) throw err;
                    
                });
            });
            var params = {
                steps: {
                    ':original': {
                        robot: '/http/import',
                        url: 'http://www.gueime.com.br/uploads/' + sendImg
                    }
                },
                template_id: '5dcf9a609f8911e482f9bfe5e714dbb8'
            };
            client.send(params, function(ok) {
                // success callback [optional]
                res.send('http://www.gueime.com.br/uploads/' + sendImg );
            }, function(err) {
                // error callback [optional]
                console.log('Error: ' + JSON.stringify(err));
            });
        } 
    });

    // CRIAÇÃO GAME
    app.post('/newGame', function(req, res){
        var user = req.user,
            b = req.body,
            plataformas = b.plataformas,
            sendPlataformas,
            esrb = b.esrb,
            sendEsrb,
            genero = b.genero,
            sendGenero,
            desenvolvedor = b.desenvolvedor,
            sendDesenvolvedor,
            distribuidora = b.distribuidora,
            sendDistribuidora;

        var slug = func.string_to_slug(b.nomeJogo);

        var date = b.date.split('/');
        var lauchDate = new Date(date[2], date[1] - 1, date[0]);

            var facet = [];

            if (plataformas != undefined) { plataformas = func.string_to_slug(b.plataformas); if (plataformas.indexOf('-') > -1) { plataformas = plataformas.split(/[\s,-]+/); sendPlataformas = b.plataformas.toString().replace(/,\s*$/, "").split(','); facet = facet.concat(plataformas); } else { facet.push(plataformas.split(' ')); sendPlataformas = b.plataformas}}

            if (esrb != undefined) { esrb = func.string_to_slug(b.esrb); if (esrb.indexOf('-') > -1) { esrb = esrb.split(/[\s,-]+/); sendEsrb = b.esrb.toString().replace(/,\s*$/, "").split(','); facet = facet.concat(esrb); } else { facet.push(esrb.split(' ')); sendEsrb = b.esrb } }

            if (genero != undefined) { genero = func.string_to_slug(b.genero); if (genero.indexOf('-') > -1) { genero = genero.split(/[\s,-]+/); sendGenero = b.genero.toString().replace(/,\s*$/, "").split(','); facet = facet.concat(genero); } else { facet.push(genero.split(' ')); sendGenero = b.genero } }

            if (desenvolvedor != undefined) { desenvolvedor = func.string_to_slug(b.desenvolvedor); if (desenvolvedor.indexOf('-') > -1) { desenvolvedor = desenvolvedor.split(/[\s,-]+/); sendDesenvolvedor = b.desenvolvedor.toString().replace(/,\s*$/, "").split(','); facet = facet.concat(desenvolvedor); } else { facet.push(desenvolvedor.split(' ')); sendDesenvolvedor = b.desenvolvedor } }

            if (distribuidora != undefined) { distribuidora = func.string_to_slug(b.distribuidora); if (distribuidora.indexOf('-') > -1) { distribuidora = distribuidora.split(/[\s,-]+/); sendDistribuidora = b.distribuidora.toString().replace(/,\s*$/, "").split(','); facet = facet.concat(distribuidora); } else { facet.push(distribuidora.split(' ')); sendDistribuidora = b.distribuidora }}

            if(!b.position){
                b.position = "background: url(https://s3-sa-east-1.amazonaws.com/portalgueime/images/gameBg.jpg) no-repeat center -65px;";
            }

            facet = func.cleanArray(facet);

            sendFacet = facet.filter(function(elem, pos) {
                return facet.indexOf(elem) == pos;
            });
            

        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else if(user.status == 'admin' || user.status == 'editor'){
                managePoints(user._id, 10);
                var status;
                if(user.status == 'admin'){
                    status = 'publicado';
                } else{
                    status = 'revisao';
                }
                if(b.editing == 'yes'){
                    Games.update({slug: b.lastSlug}, {$set:{
                        title: b.nomeJogo,
                        about: b.sobre,
                        slug: slug,
                        gameCover: b.gameCover,
                        cover: b.position,
                        release: lauchDate,
                        'graph.esrb': sendEsrb,
                        facet: sendFacet,
                        'graph.console': sendPlataformas,
                        'graph.genre': sendGenero,
                        'graph.developer': sendDesenvolvedor,
                        'graph.publisher': sendDistribuidora,
                        status: status
                    }}, function(err){
                        res.redirect('/jogos/' + slug);
                    });
                } else {
                    new Games({
                        title: b.nomeJogo,
                        about: b.sobre,
                        slug: slug,
                        gameCover: b.gameCover,
                        cover: b.position,
                        release: lauchDate,
                        'graph.esrb': sendEsrb,
                        facet: sendFacet,
                        'graph.console': sendPlataformas,
                        'graph.genre': sendGenero,
                        'graph.developer': sendDesenvolvedor,
                        'graph.publisher': sendDistribuidora,
                        status: status

                    }).save(function(err, docs){
                        console.log(docs);
                        res.redirect('/jogos/' + docs.slug);
                    });
                }                
            }
        }
    });

    // =====================================
    // CHECAR CONTEÚDO =====================
    // ===================================== 
    app.get('/checkContent/:tipo', function(req, res, next){
        var user = req.user;
        var tipo = req.params.tipo;

        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin' || user.status == 'editor'){
                switch(tipo){
                    case 'jogos':
                        Games.find({}).sort({_id: -1}).exec(function(err, docs){
                            for(i=0;i < docs.length;i++){
                                var timeStamp = docs[i]._id.toString().substring(0,8);
                                var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                                docs[i].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }
                            res.render('checkContent', {title: "Gerenciar Jogos", user: user, games: docs});
                        });
                        break

                    case 'artigos':
                        Artigos.find({}, {title: 1, slug: 1, 'authors.name': 1, type: 1, 'graph.views': 1, status: 1, publishDate: 1}).sort({_id: -1}).exec(function(err, docs){
                            for(i=0;i < docs.length;i++){
                                if(docs[i].status == 'publicado'){
                                    var date = docs[i].publishDate;
                                } else {
                                    var timeStamp = docs[i]._id.toString().substring(0,8);
                                    var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                                }
                                
                                docs[i].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }
                            res.render('checkContent', {title: "Gerenciar Artigos", user: user, articles: docs});
                        });
                        break
                }

            } else{
                res.redirect('/');
            }
        }
    });


    // =====================================
    // GERENCIAR PÁGINAS ===================
    // ===================================== 
    app.get('/gerenciar/:tipo', function(req, res, next){
        var user = req.user;
        var tipo = req.params.tipo;

        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin' || user.status == 'editor'){
                switch(tipo){
                    case 'jogos':
                        Games.find({}).sort({_id: -1}).exec(function(err, docs){
                            for(i=0;i < docs.length;i++){
                                var timeStamp = docs[i]._id.toString().substring(0,8);
                                var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                                docs[i].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }
                            res.render('gerenciar', {title: "Gerenciar Jogos", user: user, games: docs});
                        });
                        break

                    case 'artigos':
                        Artigos.find({$or: [{status: 'publicado'}, {status: 'revisao'}]}, {title: 1, slug: 1, 'authors.name': 1, type: 1, 'graph.views': 1, status: 1, publishDate: 1, totalComments: 1}).sort({_id: -1}).exec(function(err, docs){
                            for(i=0;i < docs.length;i++){
                                if(docs[i].status == 'publicado'){
                                    var date = docs[i].publishDate;
                                } else {
                                    var timeStamp = docs[i]._id.toString().substring(0,8);
                                    var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                                }
                                
                                docs[i].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }
                            res.render('gerenciar', {title: "Gerenciar Artigos", user: user, articles: docs});
                        });
                        break

                    case 'artigosAll':
                        Artigos.find({}, {title: 1, slug: 1, 'authors.name': 1, type: 1, 'graph.views': 1, status: 1, publishDate: 1, totalComments: 1}).sort({_id: -1}).exec(function(err, docs){
                            for(i=0;i < docs.length;i++){
                                if(docs[i].status == 'publicado'){
                                    var date = docs[i].publishDate;
                                } else {
                                    var timeStamp = docs[i]._id.toString().substring(0,8);
                                    var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                                }
                                
                                docs[i].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }
                            res.render('gerenciar', {title: "Gerenciar Artigos", user: user, articles: docs});
                        });
                        break

                    case 'desenvolvedores':
                        DevPub.find({type: 'developer'}).sort({_id: -1}).exec(function(err, docs){
                            for(i=0;i < docs.length;i++){
                                var timeStamp = docs[i]._id.toString().substring(0,8);
                                var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                                docs[i].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }
                            res.render('gerenciar', {title: "Gerenciar Desenvolvedores", user: user, devs: docs});
                        });
                        break

                    case 'distribuidoras':
                        DevPub.find({type: 'publisher'}).sort({_id: -1}).exec(function(err, docs){
                            for(i=0;i < docs.length;i++){
                                var timeStamp = docs[i]._id.toString().substring(0,8);
                                var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                                docs[i].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }
                            res.render('gerenciar', {title: "Gerenciar Distribuidoras", user: user, pubs: docs});
                        });
                        break

                    case 'generos':
                        Genre.find({}).sort({_id: -1}).exec(function(err, docs){
                            for(i=0;i < docs.length;i++){
                                var timeStamp = docs[i]._id.toString().substring(0,8);
                                var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                                docs[i].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }
                            res.render('gerenciar', {title: "Gerenciar Gêneros", user: user, gens: docs});
                        });
                        break

                    case 'usuarios':
                        if(user.status == 'admin'){
                            Users.find({}, {name: 1, email: 1, graph: 1, deleted: 1, status: 1}).sort({_id: -1}).exec(function(err, docs){
                                res.render('gerenciar', {title: "Gerenciar Usuários", user: user, profile: docs});
                            });
                            break
                        } else{
                            res.redirect('/gerenciar/artigos');
                            break
                        }
                        

                    case 'consoles':
                        Console.find({}).sort({_id: -1}).exec(function(err, docs){
                            for(i=0;i < docs.length;i++){
                                var timeStamp = docs[i]._id.toString().substring(0,8);
                                var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                                docs[i].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }
                            res.render('gerenciar', {title: "Gerenciar Consoles", user: user, consoles: docs});
                        });
                        break

                }

            } else{
                res.redirect('/');
            }
        }
    });


    // GERENCIAR USER ARTICLES
    app.get('/profile/:name/gerenciar', function(req, res){
        var user = req.user;

        if(!user || user.name.loginName != req.params.name){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin' || user.status == 'editor' || user.status == 'parceiro'){
                Artigos.find({'authors.main': user._id}, {title: 1, slug: 1, type: 1, 'graph.views': 1, status: 1, publishDate: 1}).sort({_id: -1}).exec(function(err, docs){
                    for(i=0;i < docs.length;i++){
                        if(docs[i].status == 'publicado'){
                            var date = docs[i].publishDate;
                        } else {
                            var timeStamp = docs[i]._id.toString().substring(0,8);
                            var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                        }
                                
                        docs[i].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                    }
                    res.render('gerenciar', {title: "Gerenciar Artigos", user: user, articles: docs});
                });
            } else {
                res.redirect('/');
            }
        }
    });

    // =====================================
    // DELETAR ELEMENTOS ===================
    // ===================================== 

    // JOGOS
    app.put('/jogos/:jogo/deletar', function(req, res){
        var user = req.user;
        var jogo = req.params.jogo;
        var action = req.body.action;
        
        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin'){
                if(action == 'del'){
                    Games.remove({slug: jogo}, function(err){
                        if(err)
                            throw err
                        res.send('OK');
                    });
                } else if(action == 'des'){
                    Games.update({slug: jogo}, {$set: {status: 'deletado'}}, function(err){
                        if(err)
                            throw err
                        res.send('OK');
                    });
                }
            } else {
                res.redirect('/');
            }
        }
    });

    // ARTIGOS
    app.put('/artigos/:id/deletar', function(req, res){
        var user = req.user;
        var id = req.params.id;
        var action = req.body.action;
        
        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin'){
                if(action == 'del'){
                    Artigos.remove({_id: id}, function(err){
                        if(err)
                            throw err
                        res.send('OK');
                    });
                } else if(action == 'des'){
                    Artigos.update({_id: id}, {$set: {status: 'deletado'}}, function(err){
                        if(err)
                            throw err
                        res.send('OK');
                    });
                }
            } else {
                res.redirect('/');
            }
        }
    });

    // DEVELOPERS
    app.put('/desenvolvedores/:dev/deletar', function(req, res){
        var user = req.user;
        var dev = req.params.dev;
        var action = req.body.action;
        
        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin'){
                if(action == 'del'){
                    DevPub.remove({slug: dev, type: 'developer'}, function(err){
                        if(err)
                            throw err
                        res.send('OK');
                    });
                } else if(action == 'des'){
                    DevPub.update({slug: dev, type: 'developer'}, {$set: {status: 'deletado'}}, function(err){
                        if(err)
                            throw err
                        res.send('OK');
                    });
                }
            } else {
                res.redirect('/');
            }
        }
    });

    // PUBLISHERS
    app.put('/distribuidoras/:pub/deletar', function(req, res){
        var user = req.user;
        var pub = req.params.pub;
        var action = req.body.action;
        
        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin'){
                if(action == 'del'){
                    DevPub.remove({slug: pub, type: 'publisher'}, function(err){
                        if(err)
                            throw err
                        res.send('OK');
                    });
                } else if(action == 'des'){
                    DevPub.update({slug: pub, type: 'publisher'}, {$set: {status: 'deletado'}}, function(err){
                        if(err)
                            throw err
                        res.send('OK');
                    });
                }
            } else {
                res.redirect('/');
            }
        }
    });

    // GENRES
    app.put('/generos/:gen/deletar', function(req, res){
        var user = req.user;
        var gen = req.params.gen;
        var action = req.body.action;
        
        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin'){
                if(action == 'del'){
                    Genre.remove({slug: gen}, function(err){
                        if(err)
                            throw err
                        res.send('OK');
                    });
                } else if(action == 'des'){
                    Genre.update({slug: gen}, {$set: {status: 'deletado'}}, function(err){
                        if(err)
                            throw err
                        res.send('OK');
                    });
                }
            } else {
                res.redirect('/');
            }
        }
    });

    // USUARIOS
    app.put('/usuarios/:usuario/deletar', function(req, res){
        var user = req.user;
        var usuario = req.params.usuario;
        var action = req.body.action;
        
        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin'){
                if(action == 'del'){
                    Users.remove({'name.loginName': usuario}, function(err){
                        if(err)
                            throw err
                        res.send('OK');
                    });
                } else if(action == 'des'){
                    Users.update({'name.loginName': usuario}, {$set: {deleted: true}}, function(err){
                        if(err)
                            throw err
                        res.send('OK');
                    });
                }
            } else {
                res.redirect('/');
            }
        }
    });

    // CONSOLES
    app.put('/consoles/:con/deletar', function(req, res){
        var user = req.user;
        var con = req.params.con;
        var action = req.body.action;
        
        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin'){
                if(action == 'del'){
                    Console.remove({slug: con}, function(err){
                        if(err)
                            throw err
                        res.send('OK');
                    });
                } else if(action == 'des'){
                    Console.update({slug: con}, {$set: {status: 'deletado'}}, function(err){
                        if(err)
                            throw err
                        res.send('OK');
                    });
                }
            } else {
                res.redirect('/');
            }
        }
    });

    // CHANGE USER STATUS
    app.put('/changeUserStatus', function(req, res){
        var user = req.user;
        var changeUser = req.body.user;
        var status = req.body.status;

        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin'){
                Users.update({'name.loginName': changeUser}, {$set: {status: status}}, function(err){
                    res.send('OK');
                });
            }
        }
    });

    // CHANGE ARTICLE STATUS
    app.put('/changeArticleStatus', function(req, res){
        var user = req.user;
        var changeArt = req.body.art;
        var status = req.body.status;

        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin' || user.status == 'editor'){
                Artigos.findOneAndUpdate({slug: changeArt}, {$set: {status: status}}, {new: false}, function(err, docs){
                    if(status == 'publicado'){
                        if(docs.type == 'noticia'){
                            Users.update({_id: docs.authors.main}, {$inc: {'graph.publications': 1, 'gamification.points': 10}}, function(err){
                                res.send('OK');
                            });
                        } else if(docs.type == 'artigo'){
                            Users.update({_id: docs.authors.main}, {$inc: {'graph.publications': 1, 'gamification.points': 30}}, function(err){
                                res.send('OK');
                            });
                        } else if(docs.type == 'analise'){
                            Users.update({_id: docs.authors.main}, {$inc: {'graph.publications': 1, 'gamification.points': 50}}, function(err){
                                res.send('OK');
                            });
                        } else if(docs.type == 'video' && docs.video.autoral == false){
                            Users.update({_id: docs.authors.main}, {$inc: {'graph.publications': 1, 'gamification.points': 5}}, function(err){
                                res.send('OK');
                            });
                        } else if(docs.type == 'video' && docs.video.autoral == true){
                            Users.update({_id: docs.authors.main}, {$inc: {'graph.publications': 1, 'gamification.points': 50}}, function(err){
                                res.send('OK');
                            });
                        }
                    } else if(status == 'rascunho' && docs.status == 'publicado' || status == 'revisao' && docs.status == 'publicado' || status == 'deletado' && docs.status == 'publicado'){
                        if(docs.type == 'noticia'){
                            Users.update({_id: docs.authors.main}, {$inc: {'graph.publications': -1, 'gamification.points': -10}}, function(err){
                                res.send('OK');
                            });
                        } else if(docs.type == 'artigo'){
                            Users.update({_id: docs.authors.main}, {$inc: {'graph.publications': -1, 'gamification.points': -30}}, function(err){
                                res.send('OK');
                            });
                        } else if(docs.type == 'analise'){
                            Users.update({_id: docs.authors.main}, {$inc: {'graph.publications': -1, 'gamification.points': -50}}, function(err){
                                res.send('OK');
                            });
                        } else if(docs.type == 'video' && docs.video.autoral == false){
                            Users.update({_id: docs.authors.main}, {$inc: {'graph.publications': -1, 'gamification.points': -5}}, function(err){
                                res.send('OK');
                            });
                        } else if(docs.type == 'video' && docs.video.autoral == true){
                            Users.update({_id: docs.authors.main}, {$inc: {'graph.publications': -1, 'gamification.points': -50}}, function(err){
                                res.send('OK');
                            });
                        }
                    } else {
                        res.send('OK');
                    }
                });
            }
        }
    });

    // =====================================
    // RESTORE ELEMENTOS ===================
    // =====================================

    // JOGOS
    app.put('/jogos/:jogo/restore', function(req, res){
        var user = req.user;
        var jogo = req.params.jogo;
        
        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin'){
                Games.update({slug: jogo},{$set: {status: 'publicado'}}, function(err){
                    if(err)
                        throw err
                    res.send('OK');
                });
            } else {
                res.redirect('/');
            }
        }
    });

    // ARTIGOS
    app.put('/artigos/:artigo/restore', function(req, res){
        var user = req.user;
        var artigo = req.params.artigo;
        
        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin'){
                Artigos.update({slug: artigo},{$set: {status: 'publicado'}}, function(err){
                    if(err)
                        throw err
                    res.send('OK');
                });
            } else {
                res.redirect('/');
            }
        }
    });

    // DEVELOPER
    app.put('/desenvolvedores/:dev/restore', function(req, res){
        var user = req.user;
        var dev = req.params.dev;
        
        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin'){
                DevPub.update({slug: dev, type: 'developer'},{$set: {status: 'publicado'}}, function(err){
                    if(err)
                        throw err
                    res.send('OK');
                });
            } else {
                res.redirect('/');
            }
        }
    });

    // PUBLISHER
    app.put('/distribuidoras/:pub/restore', function(req, res){
        var user = req.user;
        var pub = req.params.pub;
        
        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin'){
                DevPub.update({slug: pub, type: 'publisher'},{$set: {status: 'publicado'}}, function(err){
                    if(err)
                        throw err
                    res.send('OK');
                });
            } else {
                res.redirect('/');
            }
        }
    });

    // GENRES
    app.put('/generos/:gen/restore', function(req, res){
        var user = req.user;
        var gen = req.params.gen;
        
        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin'){
                Genre.update({slug: gen},{$set: {status: 'publicado'}}, function(err){
                    if(err)
                        throw err
                    res.send('OK');
                });
            } else {
                res.redirect('/');
            }
        }
    });

    // USUARIOS
    app.put('/usuarios/:usuario/restore', function(req, res){
        var user = req.user;
        var usuario = req.params.usuario;
        
        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin'){
                Users.update({'name.loginName': usuario},{$set: {deleted: false}}, function(err){
                    if(err)
                        throw err
                    res.send('OK');
                });
            } else {
                res.redirect('/');
            }
        }
    });

    // CONSOLES
    app.put('/consoles/:con/restore', function(req, res){
        var user = req.user;
        var con = req.params.con;
        
        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin'){
                Console.update({slug: con},{$set: {status: 'publicado'}}, function(err){
                    if(err)
                        throw err
                    res.send('OK');
                });
            } else {
                res.redirect('/');
            }
        }
    });

    // =====================================
    // AUTOCOMPLETES =======================
    // =====================================

    // GAMES
    app.get('/autoGame', function(req, res){
        var user = req.user;
        var query = req.query.query;

        Games.find({title: new RegExp(query, 'i')}, {title: 1, _id: 0}, function(err, games){
            var sendArray = [];

            for(i=0; i < games.length; i++){
                sendArray.push(games[i].title);
            }

            sendArray = sendArray.toString().toLowerCase().split(',');

            var uniqueArray = sendArray.filter(function(elem, pos) {
                return sendArray.indexOf(elem) == pos;
            });

            var filtered = (function(pattern){
                var filtered = [], i = uniqueArray.length, re = new RegExp(pattern, 'i');
                while (i--) {
                    if (re.test(uniqueArray[i])) {
                        filtered.push(uniqueArray[i]);
                    }
                }
                return filtered;
            })(query);

            res.end(JSON.stringify(filtered));
        });
    });

    // AUTHORS
    app.get('/autoAuthor', function(req, res){
        var user = req.user;
        var query = req.query.query;

        Users.find({$or: [{'name.first': new RegExp(query, 'i')}, {'name.last': new RegExp(query, 'i')}, {'name.loginName': new RegExp(query, 'i')}], 'name.loginName': {$ne: user.name.loginName}}, {'name.first': 1, 'name.last': 1, 'name.loginName': 1, _id: 0}, function(err, authors){
            var sendArray = [];

            for(i=0; i < authors.length; i++){
                sendArray.push(authors[i].name.first + ' ' + authors[i].name.last + '(' + authors[i].name.loginName + ')');
            }

            sendArray = sendArray.toString().toLowerCase().split(',');

            var uniqueArray = sendArray.filter(function(elem, pos) {
                return sendArray.indexOf(elem) == pos;
            });

            var filtered = (function(pattern){
                var filtered = [], i = uniqueArray.length, re = new RegExp(pattern, 'i');
                while (i--) {
                    if (re.test(uniqueArray[i])) {
                        filtered.push(uniqueArray[i]);
                    }
                }
                return filtered;
            })(query);

            res.end(JSON.stringify(filtered));
        });
    });


    // CONTINUAÇÃO HISTÓRIA
    app.get('/autoStory', function(req, res){
        var user = req.user;
        var query = req.query.query;

        Artigos.find({'news.story': new RegExp(query, 'i')}, {'news.story': 1, _id: 0}, function(err, story){
            var sendArray = [];

            for(i=0; i < story.length; i++){
                sendArray.push(story[i].news.story);
            }

            sendArray = sendArray.toString().toLowerCase().split(',');

            var uniqueArray = sendArray.filter(function(elem, pos) {
                return sendArray.indexOf(elem) == pos;
            });

            var filtered = (function(pattern){
                var filtered = [], i = uniqueArray.length, re = new RegExp(pattern, 'i');
                while (i--) {
                    if (re.test(uniqueArray[i])) {
                        filtered.push(uniqueArray[i]);
                    }
                }
                return filtered;
            })(query);

            res.end(JSON.stringify(filtered));
        });
    });
    
    // CATEGORIA ARTIGO
    app.get('/autoArtCat', function(req, res){
        var user = req.user;
        var query = req.query.query;

        Artigos.find({'article.category': new RegExp(query, 'i')}, {'article.category': 1, _id: 0}, function(err, cat){
            var sendArray = [];

            for(i=0; i < cat.length; i++){
                sendArray.push(cat[i].article.category);
            }

            sendArray = sendArray.toString().toLowerCase().split(',');

            var uniqueArray = sendArray.filter(function(elem, pos) {
                return sendArray.indexOf(elem) == pos;
            });

            var filtered = (function(pattern){
                var filtered = [], i = uniqueArray.length, re = new RegExp(pattern, 'i');
                while (i--) {
                    if (re.test(uniqueArray[i])) {
                        filtered.push(uniqueArray[i]);
                    }
                }
                return filtered;
            })(query);

            res.end(JSON.stringify(filtered));
        });
    });

    // SERIE ARTIGO
    app.get('/autoArtSerie', function(req, res){
        var user = req.user;
        var query = req.query.query;

        Artigos.find({'article.serie': new RegExp(query, 'i')}, {'article.serie': 1, _id: 0}, function(err, cat){
            var sendArray = [];
            console.log(cat)
            for(i=0; i < cat.length; i++){
                sendArray.push(cat[i].article.serie);
            }

            sendArray = sendArray.toString().toLowerCase().split(',');

            var uniqueArray = sendArray.filter(function(elem, pos) {
                return sendArray.indexOf(elem) == pos;
            });

            var filtered = (function(pattern){
                var filtered = [], i = uniqueArray.length, re = new RegExp(pattern, 'i');
                while (i--) {
                    if (re.test(uniqueArray[i])) {
                        filtered.push(uniqueArray[i]);
                    }
                }
                return filtered;
            })(query);

            res.end(JSON.stringify(filtered));
        });
    });

    // TIPO VÍDEO
    app.get('/autoTipoVideo', function(req, res){
        var user = req.user;
        var query = req.query.query;

        Artigos.find({'video.tipo': new RegExp(query, 'i')}, {'video.tipo': 1, _id: 0}, function(err, vid){
            var sendArray = [];

            for(i=0; i < vid.length; i++){
                sendArray.push(vid[i].video.tipo);
            }

            sendArray = sendArray.toString().toLowerCase().split(',');

            var uniqueArray = sendArray.filter(function(elem, pos) {
                return sendArray.indexOf(elem) == pos;
            });

            var filtered = (function(pattern){
                var filtered = [], i = uniqueArray.length, re = new RegExp(pattern, 'i');
                while (i--) {
                    if (re.test(uniqueArray[i])) {
                        filtered.push(uniqueArray[i]);
                    }
                }
                return filtered;
            })(query);

            res.end(JSON.stringify(filtered));
        });
    });

    // CONSOLES
    app.get('/autoConsoles', function(req, res){
        var user = req.user;
        var query = req.query.query;

        Console.find({title: new RegExp(query, 'i')}, {title: 1, _id: 0}, function(err, consoles){
            var sendArray = [];

            for(i=0; i < consoles.length; i++){
                sendArray.push(consoles[i].title);
            }

            sendArray = sendArray.toString().toLowerCase().split(',');

            var uniqueArray = sendArray.filter(function(elem, pos) {
                return sendArray.indexOf(elem) == pos;
            });

            var filtered = (function(pattern){
                var filtered = [], i = uniqueArray.length, re = new RegExp(pattern, 'i');
                while (i--) {
                    if (re.test(uniqueArray[i])) {
                        filtered.push(uniqueArray[i]);
                    }
                }
                return filtered;
            })(query);

            res.end(JSON.stringify(filtered));
        });
    });

    // GENEROS
    app.get('/autoGeneros', function(req, res){
        var user = req.user;
        var query = req.query.query;

        Genre.find({title: new RegExp(query, 'i')}, {title: 1, _id: 0}, function(err, gen){
            var sendArray = [];

            for(i=0; i < gen.length; i++){
                sendArray.push(gen[i].title);
            }

            sendArray = sendArray.toString().toLowerCase().split(',');

            var uniqueArray = sendArray.filter(function(elem, pos) {
                return sendArray.indexOf(elem) == pos;
            });

            var filtered = (function(pattern){
                var filtered = [], i = uniqueArray.length, re = new RegExp(pattern, 'i');
                while (i--) {
                    if (re.test(uniqueArray[i])) {
                        filtered.push(uniqueArray[i]);
                    }
                }
                return filtered;
            })(query);

            res.end(JSON.stringify(filtered));
        });
    });

    // DESENVOLVEDORES
    app.get('/autoDes', function(req, res){
        var user = req.user;
        var query = req.query.query;

        DevPub.find({title: new RegExp(query, 'i'), type: 'developer'}, {title: 1, _id: 0}, function(err, dev){
            var sendArray = [];

            for(i=0; i < dev.length; i++){
                sendArray.push(dev[i].title);
            }

            sendArray = sendArray.toString().toLowerCase().split(',');

            var uniqueArray = sendArray.filter(function(elem, pos) {
                return sendArray.indexOf(elem) == pos;
            });

            var filtered = (function(pattern){
                var filtered = [], i = uniqueArray.length, re = new RegExp(pattern, 'i');
                while (i--) {
                    if (re.test(uniqueArray[i])) {
                        filtered.push(uniqueArray[i]);
                    }
                }
                return filtered;
            })(query);

            res.end(JSON.stringify(filtered));
        });
    });

    // DISTRIBUIDORAS
    app.get('/autoPub', function(req, res){
        var user = req.user;
        var query = req.query.query;

        DevPub.find({title: new RegExp(query, 'i'), type: 'publisher'}, {title: 1, _id: 0}, function(err, pub){
            var sendArray = [];

            for(i=0; i < pub.length; i++){
                sendArray.push(pub[i].title);
            }

            sendArray = sendArray.toString().toLowerCase().split(',');

            var uniqueArray = sendArray.filter(function(elem, pos) {
                return sendArray.indexOf(elem) == pos;
            });

            var filtered = (function(pattern){
                var filtered = [], i = uniqueArray.length, re = new RegExp(pattern, 'i');
                while (i--) {
                    if (re.test(uniqueArray[i])) {
                        filtered.push(uniqueArray[i]);
                    }
                }
                return filtered;
            })(query);

            res.end(JSON.stringify(filtered));
        });
    });

    // =====================================
    // TRIVIA ==============================
    // =====================================
    app.get('/trivia', function(req, res, next){
        var user = req.user;
        res.render('trivia', {user: user, title: "Trivia"});
    });

    // =====================================
    // PÁGINAS ESPECIAIS ===================
    // ===================================== 


    // TROCA DE PONTOS
    app.get('/troca', function(req, res){
        var user = req.user;

        Product.find({status: 'publicado', many: {$gte: 1}}, function(err, docs){
            res.render('troca', {user: user, title: 'Troca de Pontos', products: docs});
        });
    });

    // NOVO TROCA ( PRODUTO )
    app.get('/criar/novo/troca', function(req, res, next){
        var user = req.user;
        if(!user){
            res.redirect('/');
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else if(user.status == 'admin'){
                // sessionReload(req, res, next);
                res.render('trocaEdit',{user: user, title: "Nova Troca", edit: false});
            } else{
                res.redirect('/parceiros');
            }
        }
    });

    // EDIT TROCA
    app.get('/troca/:troca/editar', function(req, res, next){
        var user = req.user;
        var troca = req.params.troca;
        if(!user){
            res.redirect('/');
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else if(user.status == 'admin'){
                // sessionReload(req, res, next);
                Product.findOneAndUpdate({slug: troca}, {status: 'rascunho'}, {new: false}, function(err, docs){
                    res.render('trocaEdit',{user: user, title: "" + docs.title, developer: docs, edit: true});
                });
            } else{
                res.redirect('/');
            }
        }
    });

    // PRODUTO (NÃO IMPLEMENTADO)
    app.get('/troca/produto/:prod', function(req, res){
        var user = req.user,
            produto = req.pararms.prod;

        Product.findOneAndUpdate({slug: produto, status: 'publicado'}, {$inc: {'graph.views': 1}}, function(err, docs){
            res.render('produto', {user: user, title: '' + docs.title, product: docs});
        });
    });

    // CRIAÇÃO TROCA
    app.post('/newProduto', function(req, res){
        var user = req.user,
            b = req.body;

        var slug = func.string_to_slug(b.nomeProd);

        var theCover;
        if(!b.gameCover){
            theCover = '/images/gift_gueime.jpg';
        } else {
            theCover = b.gameCover;
        }

        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else if(user.status == 'admin'){
                managePoints(user._id, 100);
                var status;
                if(user.status == 'admin'){
                    status = 'publicado';
                } else{
                    status = 'revisao';
                }
                if(b.editing == 'yes'){
                    Product.update({slug: b.lastSlug}, {$set:{
                        title: b.nomeProd,
                        about: b.sobre,
                        slug: slug,
                        much: b.custo,
                        many: b.quantidade,
                        cover: theCover,
                        status: status
                    }}, function(err){
                        res.redirect('/troca');
                    });
                } else {
                    new Product({
                        title: b.nomeProd,
                        about: b.sobre,
                        slug: slug,
                        much: b.custo,
                        many: b.quantidade,
                        cover: theCover,
                        status: status
                    }).save(function(err, docs){
                        res.redirect('/troca');
                    });
                }           
            }
        }
    });

    // PEDIR PRODUTO
    app.put('/pedirProduto', function(req, res){
        var user = req.user,
            prod = req.body.prod;

        if(!user){
            res.redirect('/');
        } else {
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else if(user.status == 'admin' || user.status == 'editor' || user.status == 'parceiro'){
                Product.findOne({slug: prod, status: 'publicado'}, function(err, docs){
                    if(docs.many < 1){
                        var message = {
                            message: 'Não há mais este produto',
                            many: docs.many
                        }
                        res.send(message);
                    } else if(user.gamification.points - user.gamification.expended < docs.much){
                        var message = {
                            message: 'Você não tem pontos suficientes',
                            many: docs.many
                        }
                        res.send(message);
                    } else {
                        Users.update({_id: user._id}, {$inc: {'gamification.expended': docs.much}, $push: {'gamification.trocas': docs._id}}, function(err){
                           Product.update({_id: docs._id}, {$inc: {many: -1}, $push: {'graph.users': user._id}}, function(){

                               var message = {
                                   message: 'Concluído',
                                   many: docs.many - 1
                               }
                              res.send(message);
                           });
                        });
                    }
                });
            } else {
                res.redirect('/parceiros');
            }
        }
    });

    // ENVIAR EMAIL TROCA
    app.post('/trocaEmail', function(req, res){
        var user = req.user,
            prod = req.body.prod;

         if(!user){
             res.redirect('/');
         } else {
             if(user.deleted == true){
                res.redirect('/users/restore');
             } else {
                 Product.findOne({slug: prod, status: 'publicado'}, function(err, docs){

                    // Email para troca
                    var troMessage = {
                        "html": "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'><html xmlns='http://www.w3.org/1999/xhtml'><head><meta content='text/html; charset=utf-8' http-equiv='Content-Type' /><title></title><style type='text/css'>@media only screen and (max-width:480px){body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:none !important}body{width:100% !important;min-width:100% !important}td[id=bodyCell]{padding:10px !important}table.kmMobileHide{display:none !important}table[class=kmTextContentContainer]{width:100% !important}table[class=kmBoxedTextContentContainer]{width:100% !important}td[class=kmImageContent]{padding-left:0 !important;padding-right:0 !important}img[class=kmImage]{width:100% !important}table[class=kmSplitContentLeftContentContainer],table[class=kmSplitContentRightContentContainer],table[class=kmColumnContainer],td[class=kmVerticalButtonBarContentOuter] table[class=kmButtonBarContent],td[class=kmVerticalButtonCollectionContentOuter] table[class=kmButtonCollectionContent],table[class=kmVerticalButton],table[class=kmVerticalButtonContent]{width:100% !important}td[class=kmButtonCollectionInner]{padding-left:9px !important;padding-right:9px !important;padding-top:9px !important;padding-bottom:0 !important;background-color:transparent !important}td[class=kmVerticalButtonIconContent],td[class=kmVerticalButtonTextContent],td[class=kmVerticalButtonContentOuter]{padding-left:0 !important;padding-right:0 !important;padding-bottom:9px !important}table[class=kmSplitContentLeftContentContainer] td[class=kmTextContent],table[class=kmSplitContentRightContentContainer] td[class=kmTextContent],table[class=kmColumnContainer] td[class=kmTextContent],table[class=kmSplitContentLeftContentContainer] td[class=kmImageContent],table[class=kmSplitContentRightContentContainer] td[class=kmImageContent]{padding-top:9px !important}td[class='rowContainer kmFloatLeft'],td[class='rowContainer kmFloatLeft firstColumn'],td[class='rowContainer kmFloatLeft lastColumn']{float:left;clear:both;width:100% !important}table[id=templateContainer],table[class=templateRow]{max-width:600px !important;width:100% !important}h1{font-size:24px !important;line-height:130% !important}h2{font-size:20px !important;line-height:130% !important}h3{font-size:18px !important;line-height:130% !important}h4{font-size:16px !important;line-height:130% !important}td[class=kmTextContent]{font-size:14px !important;line-height:130% !important}td[class=kmTextBlockInner] td[class=kmTextContent]{padding-right:18px !important;padding-left:18px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner]{padding-left:9px !important;padding-right:9px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner] [class=kmTextContent]{font-size:14px !important;line-height:130% !important;padding-left:4px !important;padding-right:4px !important}}</style></head><body style='margin:0;padding:0;background-color:#c7c7c7'><center><table align='center' border='0' cellpadding='0' cellspacing='0' id='bodyTable' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;background-color:#c7c7c7;height:100%;margin:0;width:100%'><tbody><tr><td align='center' id='bodyCell' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding-top:50px;padding-left:20px;padding-bottom:20px;padding-right:20px;border-top:0;height:100%;margin:0;width:100%'><table border='0' cellpadding='0' cellspacing='0' id='templateContainer' width='600' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;border:1px solid #aaa;background-color:#f4f4f4;border-radius:0'><tbody><tr><td id='templateContainerInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmImageBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmImageBlockOuter'><tr><td class='kmImageBlockInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:9px;' valign='top'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmImageContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmImageContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;padding-top:0px;padding-bottom:0;padding-left:9px;padding-right:9px;'><img align='left' alt='' class='kmImage' src='https://d3k81ch9hvuctc.cloudfront.net/company%2Fb674Zj%2Fimages%2Fheader_email.jpg' width='564' style='border:0;height:auto;line-height:100%;outline:none;text-decoration:none;padding-bottom:0;display:inline;vertical-align:bottom;margin-right:0;max-width:800px;' /></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmTextBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmTextBlockOuter'><tr><td class='kmTextBlockInner' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmTextContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmTextContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#505050;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;'><h1 style='color:#222;display:block;font-family:Helvetica, Arial;font-size:26px;font-style:normal;font-weight:bold;line-height:110%;letter-spacing:normal;margin:0;margin-bottom:9px;text-align:left'>Seu novo presente está a caminho!</h1><p style='margin:0;padding-bottom:1em'> </p><p style='margin:0;padding-bottom:1em'>Parabéns!! Você ganhou um: " + docs.title + "! Algum de nossos administradores irá te enviar o prêmio em breve.</p><p style='margin:0;padding-bottom:1em'>Abraços,</p><p style='margin:0;padding-bottom:0'>Equipe Gueime</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></table></td></tr></tbody></table></td></tr></tbody></table></center></body></html>",
                        "text": "Parabéns!! Você ganhou um: " + docs.title + "! Algum de nossos administradores irá te enviar o prêmio em breve.",
                        "subject": "Gueime - Troca Realizada",
                        "from_email": "parceiros@gueime.com.br",
                        "from_name": "Gueime - Parceiros",
                        "to": [{
                                "email": user.email,
                                "name": user.name.first,
                                "type": "to"
                            },
                            {
                                "email": "parceiros@gueime.com.br",
                                "name": "Parceiros",
                                "type": "bcc"
                            }],
                        "headers": {
                            "Reply-To": "parceiros@gueime.com.br"
                        },
                        "important": false,
                        "track_opens": true,
                        "track_clicks": true,
                        "auto_text": null,
                        "auto_html": true,
                        "inline_css": null,
                        "url_strip_qs": null,
                        "preserve_recipients": null,
                        "view_content_link": null,
                        "return_path_domain": null,
                        "tags": [
                            "troMessage"
                        ]
                    };
                    var async = false;
                    var ip_pool = "Main Pool";

                    // Evio de Email
                    mandrill_client.messages.send({"message": troMessage, "async": async, "ip_pool": ip_pool}, function(result) {
                        console.log(result);
                        res.send('OK');
                    }, function(e) {
                        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                        res.send('OK');
                    });
                });
             }
         }
    });

    // PAGINAÇÃO TROCA
    app.get('/paginationTroca', function(req, res){
        var pubTitle = req.query.b.toString();
        var n = req.query.n;

        Artigos.find({status: 'publicado', 'graph.consoles': new RegExp(pubTitle, 'i'), type: {$ne: 'analise'}}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ '_id': -1 }).limit(6).skip(n).exec(function (err, docs) {
            res.render('loadMore', { docs: docs });
        });
    });

    // CONTATO
    app.get('/contato', function(req, res){
        var user = req.user;

        if(user && user.deleted == true){
            res.redirect('/users/restore');
        }else{

            if(user){
                plusView(user);
            }

            res.render('contato', {title: "Contato", user: user});
        }
    });

    // SEND EMAIL
    app.post('/contatoSend', function(req, res){
        var user = req.user;
        var b = req.body;

        // Email para Contato
        var conMessage = {
            "html": "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'><html xmlns='http://www.w3.org/1999/xhtml'><head><meta content='text/html; charset=utf-8' http-equiv='Content-Type' /><title></title><style type='text/css'>@media only screen and (max-width:480px){body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:none !important}body{width:100% !important;min-width:100% !important}td[id=bodyCell]{padding:10px !important}table.kmMobileHide{display:none !important}table[class=kmTextContentContainer]{width:100% !important}table[class=kmBoxedTextContentContainer]{width:100% !important}td[class=kmImageContent]{padding-left:0 !important;padding-right:0 !important}img[class=kmImage]{width:100% !important}table[class=kmSplitContentLeftContentContainer],table[class=kmSplitContentRightContentContainer],table[class=kmColumnContainer],td[class=kmVerticalButtonBarContentOuter] table[class=kmButtonBarContent],td[class=kmVerticalButtonCollectionContentOuter] table[class=kmButtonCollectionContent],table[class=kmVerticalButton],table[class=kmVerticalButtonContent]{width:100% !important}td[class=kmButtonCollectionInner]{padding-left:9px !important;padding-right:9px !important;padding-top:9px !important;padding-bottom:0 !important;background-color:transparent !important}td[class=kmVerticalButtonIconContent],td[class=kmVerticalButtonTextContent],td[class=kmVerticalButtonContentOuter]{padding-left:0 !important;padding-right:0 !important;padding-bottom:9px !important}table[class=kmSplitContentLeftContentContainer] td[class=kmTextContent],table[class=kmSplitContentRightContentContainer] td[class=kmTextContent],table[class=kmColumnContainer] td[class=kmTextContent],table[class=kmSplitContentLeftContentContainer] td[class=kmImageContent],table[class=kmSplitContentRightContentContainer] td[class=kmImageContent]{padding-top:9px !important}td[class='rowContainer kmFloatLeft'],td[class='rowContainer kmFloatLeft firstColumn'],td[class='rowContainer kmFloatLeft lastColumn']{float:left;clear:both;width:100% !important}table[id=templateContainer],table[class=templateRow]{max-width:600px !important;width:100% !important}h1{font-size:24px !important;line-height:130% !important}h2{font-size:20px !important;line-height:130% !important}h3{font-size:18px !important;line-height:130% !important}h4{font-size:16px !important;line-height:130% !important}td[class=kmTextContent]{font-size:14px !important;line-height:130% !important}td[class=kmTextBlockInner] td[class=kmTextContent]{padding-right:18px !important;padding-left:18px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner]{padding-left:9px !important;padding-right:9px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner] [class=kmTextContent]{font-size:14px !important;line-height:130% !important;padding-left:4px !important;padding-right:4px !important}}</style></head><body style='margin:0;padding:0;background-color:#c7c7c7'><center><table align='center' border='0' cellpadding='0' cellspacing='0' id='bodyTable' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;background-color:#c7c7c7;height:100%;margin:0;width:100%'><tbody><tr><td align='center' id='bodyCell' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding-top:50px;padding-left:20px;padding-bottom:20px;padding-right:20px;border-top:0;height:100%;margin:0;width:100%'><table border='0' cellpadding='0' cellspacing='0' id='templateContainer' width='600' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;border:1px solid #aaa;background-color:#f4f4f4;border-radius:0'><tbody><tr><td id='templateContainerInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmImageBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmImageBlockOuter'><tr><td class='kmImageBlockInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:9px;' valign='top'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmImageContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmImageContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;padding-top:0px;padding-bottom:0;padding-left:9px;padding-right:9px;'><img align='left' alt='' class='kmImage' src='https://d3k81ch9hvuctc.cloudfront.net/company%2Fb674Zj%2Fimages%2Fheader_email.jpg' width='564' style='border:0;height:auto;line-height:100%;outline:none;text-decoration:none;padding-bottom:0;display:inline;vertical-align:bottom;margin-right:0;max-width:800px;' /></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmTextBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmTextBlockOuter'><tr><td class='kmTextBlockInner' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmTextContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmTextContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#505050;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;'><h1 style='color:#222;display:block;font-family:Helvetica, Arial;font-size:26px;font-style:normal;font-weight:bold;line-height:110%;letter-spacing:normal;margin:0;margin-bottom:9px;text-align:left'>Contato de " + b.nome + "!</h1><p style='margin:0;padding-bottom:1em'> </p><p style='margin:0;padding-bottom:1em'>" + b.mensagem + "</p><p style='margin:0;padding-bottom:1em'> " + b.email + "</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></table></td></tr></tbody></table></td></tr></tbody></table></center></body></html>",
            "text": b.mensagem + " " + b.email,
            "subject": "Gueime - Contato de " + b.nome,
            "from_email": "parceiros@gueime.com.br",
            "from_name": "Gueime - Parceiros",
            "to": [{
                    "email": b.email,
                    "name": b.nome,
                    "type": "to"
                },
                {
                    "email": "parceiros@gueime.com.br",
                    "name": "Parceiros",
                    "type": "bcc"
                }],
            "headers": {
                "Reply-To": b.email
            },
            "important": false,
            "track_opens": true,
            "track_clicks": true,
            "auto_text": null,
            "auto_html": true,
            "inline_css": null,
            "url_strip_qs": null,
            "preserve_recipients": null,
            "view_content_link": null,
            "return_path_domain": null,
            "tags": [
                "conMessage"
            ]
        };
        var async = false;
        var ip_pool = "Main Pool";
        // Evio de Email
        mandrill_client.messages.send({"message": conMessage, "async": async, "ip_pool": ip_pool}, function(result) {
            console.log(result);
            res.send('OK');
        }, function(e) {
            console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
            res.send('OK');
        });
    });

    // PARCEIROS
    app.get('/parceiros', function(req, res){
        var user = req.user

        if(user){
            plusView(user);
        }
        res.render('parceiros', {title: "Parceiros", user: user})
    });

    // PARCEIROS
    app.get('/quem-somos', function(req, res){
        var user = req.user

        if(user){
            plusView(user);
        }
        res.render('quem', {title: "Quem Somos", user: user})
    });


    // =====================================
    // FEED ================================
    // =====================================
    app.get('/rss', function(req, res){
        // Setting the appropriate Content-Type
        res.set('Content-Type', 'text/xml');

        // Initializing feed object
        var feed = new Feed({
            title:          'Gueime',
            description:    'O melhor site de games do Brasil',
            link:           'http://www.gueime.com.br/',
            image:          'http://www.gueime.com.br/images/gueime.png',
            copyright:      'Copyright © 2015 - Gueime',

            author: {
                name:       'André Lucas',
                email:      'andre@gueime.com.br',
                link:       'https://www.gueime.com.br/profile/andrelug'
            }
        });

        Artigos.find({status: 'publicado'}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1 }).sort({ '_id': -1 }).limit(10).exec(function (err, docs) {

            if(err)
                res.send("404 Não encontrado");
            else{
                for (i = 0; i < docs.length; i++) {
                    var timeStamp = docs[i]._id.toString().substring(0,8);
                    var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                    docs[i].date = date;

                    feed.item({
                        title:          docs[i].title,
                        link:           "http://www.gueime.com.br/" + docs[i].type + "s/" + docs[i].slug,
                        description:    docs[i].description,
                        date:           docs[i].date,
                        image:          docs[i].cover.image
                    });
                }

                

                // Sending the feed as a response
                res.send(feed.render('atom-1.0'));
            }
        });
    });



    // =====================================
    // SITEMAP =============================
    // =====================================

    app.get('/sitemap.xml', function(req, res) {
        Artigos.find({status: 'publicado'}, {type: 1, slug: 1}).sort({ '_id': -1 }).exec(function (err, docs) {
            var myArticles = [];

            for (i = 0; i < docs.length; i++) {
                myArticles.push(docs[i].type + "s/" + docs[i].slug);
            }

            var urls = myArticles;
            // the root of your website - the protocol and the domain name with a trailing slash
            var root_path = 'http://www.gueime.com.br/';
            // XML sitemap generation starts here
            var priority = 0.5;
            var freq = 'monthly';
            var xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
            xml += "<url><loc>http://www.gueime.com.br</loc><changefreq>daily</changefreq><priority>1.0</priority></url>"
            for (var i in urls) {
                xml += '<url>';
                xml += '<loc>'+ root_path + urls[i] + '</loc>';
                xml += '<changefreq>'+ freq +'</changefreq>';
                xml += '<priority>'+ priority +'</priority>';
                xml += '</url>';
                i++;
            }
            xml += '</urlset>';

            res.header('Content-Type', 'text/xml');
            res.send(xml);  
        });

           
    });

    // Sitemap Games
    app.get('/sitemapgames.xml', function(req, res) {
        Games.find({status: 'publicado'}).sort({ '_id': -1 }).exec(function (err, docs) {
            var myArticles = [];

            for (i = 0; i < docs.length; i++) {
                myArticles.push("jogos/" + docs[i].slug);
            }

            var urls = myArticles;
            // the root of your website - the protocol and the domain name with a trailing slash
            var root_path = 'http://www.gueime.com.br/';
            // XML sitemap generation starts here
            var priority = 0.5;
            var freq = 'monthly';
            var xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
            for (var i in urls) {
                xml += '<url>';
                xml += '<loc>'+ root_path + urls[i] + '</loc>';
                xml += '<changefreq>'+ freq +'</changefreq>';
                xml += '<priority>'+ priority +'</priority>';
                xml += '</url>';
                i++;
            }
            xml += '</urlset>';

            res.header('Content-Type', 'text/xml');
            res.send(xml);  
        });
    });

    // Sitemap pub
    app.get('/sitemappub.xml', function(req, res) {
        DevPub.find({status: 'publicado', type: 'publisher'}).sort({ '_id': -1 }).exec(function (err, docs) {
            var myArticles = [];

            for (i = 0; i < docs.length; i++) {
                myArticles.push("distribuidoras/" + docs[i].slug);
            }

            var urls = myArticles;
            // the root of your website - the protocol and the domain name with a trailing slash
            var root_path = 'http://www.gueime.com.br/';
            // XML sitemap generation starts here
            var priority = 0.5;
            var freq = 'monthly';
            var xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
            for (var i in urls) {
                xml += '<url>';
                xml += '<loc>'+ root_path + urls[i] + '</loc>';
                xml += '<changefreq>'+ freq +'</changefreq>';
                xml += '<priority>'+ priority +'</priority>';
                xml += '</url>';
                i++;
            }
            xml += '</urlset>';

            res.header('Content-Type', 'text/xml');
            res.send(xml);  
        });
    });

    // Sitemap dev
    app.get('/sitemapdev.xml', function(req, res) {
        DevPub.find({status: 'publicado', type: 'developer'}).sort({ '_id': -1 }).exec(function (err, docs) {
            var myArticles = [];

            for (i = 0; i < docs.length; i++) {
                myArticles.push("desenvolvedores/" + docs[i].slug);
            }

            var urls = myArticles;
            // the root of your website - the protocol and the domain name with a trailing slash
            var root_path = 'http://www.gueime.com.br/';
            // XML sitemap generation starts here
            var priority = 0.5;
            var freq = 'monthly';
            var xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
            for (var i in urls) {
                xml += '<url>';
                xml += '<loc>'+ root_path + urls[i] + '</loc>';
                xml += '<changefreq>'+ freq +'</changefreq>';
                xml += '<priority>'+ priority +'</priority>';
                xml += '</url>';
                i++;
            }
            xml += '</urlset>';

            res.header('Content-Type', 'text/xml');
            res.send(xml);  
        });
    });

     // Sitemap user
    app.get('/sitemapusers.xml', function(req, res) {
        Users.find({deleted: false}).sort({ '_id': -1 }).exec(function (err, docs) {
            var myArticles = [];

            for (i = 0; i < docs.length; i++) {
                myArticles.push("profile/" + docs[i].name.loginName);
            }

            var urls = myArticles;
            // the root of your website - the protocol and the domain name with a trailing slash
            var root_path = 'http://www.gueime.com.br/';
            // XML sitemap generation starts here
            var priority = 0.5;
            var freq = 'monthly';
            var xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
            for (var i in urls) {
                xml += '<url>';
                xml += '<loc>'+ root_path + urls[i] + '</loc>';
                xml += '<changefreq>'+ freq +'</changefreq>';
                xml += '<priority>'+ priority +'</priority>';
                xml += '</url>';
                i++;
            }
            xml += '</urlset>';

            res.header('Content-Type', 'text/xml');
            res.send(xml);  
        });
    });

    // Sitemap genre
    app.get('/sitemapgenero.xml', function(req, res) {
        Genre.find({status: 'publicado'}).sort({ '_id': -1 }).exec(function (err, docs) {
            var myArticles = [];

            for (i = 0; i < docs.length; i++) {
                myArticles.push("generos/" + docs[i].slug);
            }

            var urls = myArticles;
            // the root of your website - the protocol and the domain name with a trailing slash
            var root_path = 'http://www.gueime.com.br/';
            // XML sitemap generation starts here
            var priority = 0.5;
            var freq = 'monthly';
            var xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
            for (var i in urls) {
                xml += '<url>';
                xml += '<loc>'+ root_path + urls[i] + '</loc>';
                xml += '<changefreq>'+ freq +'</changefreq>';
                xml += '<priority>'+ priority +'</priority>';
                xml += '</url>';
                i++;
            }
            xml += '</urlset>';

            res.header('Content-Type', 'text/xml');
            res.send(xml);  
        });
    });

    // Sitemap console
    app.get('/sitemapconsole.xml', function(req, res) {
        Console.find({status: 'publicado'}).sort({ '_id': -1 }).exec(function (err, docs) {
            var myArticles = [];

            for (i = 0; i < docs.length; i++) {
                myArticles.push("consoles/" + docs[i].slug);
            }

            var urls = myArticles;
            // the root of your website - the protocol and the domain name with a trailing slash
            var root_path = 'http://www.gueime.com.br/';
            // XML sitemap generation starts here
            var priority = 0.5;
            var freq = 'monthly';
            var xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
            for (var i in urls) {
                xml += '<url>';
                xml += '<loc>'+ root_path + urls[i] + '</loc>';
                xml += '<changefreq>'+ freq +'</changefreq>';
                xml += '<priority>'+ priority +'</priority>';
                xml += '</url>';
                i++;
            }
            xml += '</urlset>';

            res.header('Content-Type', 'text/xml');
            res.send(xml);  
        });
    });

    // =====================================
    // USER SIGNUP =========================
    // ===================================== I should later find a way to pass params to the jade file here and put values on the inputs
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages     
    }));

    app.get('/signup', function (req, res) {
        var user = req.user;
        if (!user) {
            res.render("signup", { message: req.flash('signupMessage') });
        } else {
            res.redirect("/");
        }
    });

    // =====================================
    // LOG IN ==============================
    // =====================================
    app.get('/login', function (req, res) {
        var user = req.user;
        if (!user) {
            res.render("login", { message: req.flash('loginMessage') });
            if (req.url === '/favicon.ico') {
                r.writeHead(200, { 'Content-Type': 'image/x-icon' });
                return r.end();
            }
        } else {
            res.redirect("/");
        }
    });


    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_friends']
    }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
	    passport.authenticate('facebook', {
	        successRedirect: '/facebook',
	        failureRedirect: '/'
	    })
    );

    // =====================================
    // TWITTER ROUTES ======================
    // =====================================
    // route for twitter authentication and login
    app.get('/auth/twitter', passport.authenticate('twitter'));

    // handle the callback after twitter has authenticated the user
    app.get('/auth/twitter/callback',
		passport.authenticate('twitter', {
		    successRedirect: '/profile',
		    failureRedirect: '/'
		})
    );

    // =====================================
    // GOOGLE ROUTES =======================
    // =====================================
    // send to google to do the authentication
    // profile gets us their basic information including their name
    // email gets their emails
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email', 'openid'] }));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect: '/profile',
            failureRedirect: '/'
        })
    );


    // =============================================================================
    // AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
    // =============================================================================

    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/connect/facebook', passport.authorize('facebook', { scope: ['email', 'user_about_me',
    'user_birthday ', 'user_hometown', 'user_website']
    }));

    // handle the callback after facebook has authorized the user
    app.get('/connect/facebook/callback',
			passport.authorize('facebook', {
			    successRedirect: '/facebook',
			    failureRedirect: '/'
			})
        );

    // twitter --------------------------------

    // send to twitter to do the authentication
    app.get('/connect/twitter', passport.authorize('twitter', { scope: 'email' }));

    // handle the callback after twitter has authorized the user
    app.get('/connect/twitter/callback',
			passport.authorize('twitter', {
			    successRedirect: '/profile',
			    failureRedirect: '/'
			})
        );


    // google ---------------------------------

    // send to google to do the authentication
    app.get('/connect/google', passport.authorize('google', { scope: ['profile', 'email', 'openid'] }));

    // the callback after google has authorized the user
    app.get('/connect/google/callback',
		passport.authorize('google', {
		    successRedirect: '/profile',
		    failureRedirect: '/'
		})
    );


    // =============================================================================
    // UNLINK ACCOUNTS =============================================================
    // =============================================================================
    // facebook -------------------------------
    app.get('/unlink/facebook', function (req, res) {
        var user = req.user;
        user.social.facebook.token = undefined;
        user.save(function (err) {
            res.redirect('/profile');
        });
    });


    // ADD FACEBOOK FRIENDS
    app.get('/facebook', function (req, res) {
        var user = req.user;
        facebook.getFbData(user.social.facebook.token, '/me/friends', function (data) {
            var friend = eval("(" + data + ")")
            Users.update({ _id: user._id }, { $pushAll: { 'social.facebook.friends': friend.data} }, function (err) {
                res.redirect('/');
            });
        });
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', function (req, res) {
        var user = req.user;
        user.social.twitter.token = undefined;
        user.save(function (err) {
            res.redirect('/profile');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', function (req, res) {
        var user = req.user;
        user.social.google.token = undefined;
        user.save(function (err) {
            res.redirect('/profile');
        });
    });

    // =====================================
    // delete USER =========================
    // =====================================
    app.put('/users/delete', function (req, res) {
        // Email para artigos publicados diretametne
        var delMessage = {
            "html": "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'><html xmlns='http://www.w3.org/1999/xhtml'><head><meta content='text/html; charset=utf-8' http-equiv='Content-Type' /><title></title><style type='text/css'>@media only screen and (max-width:480px){body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:none !important}body{width:100% !important;min-width:100% !important}td[id=bodyCell]{padding:10px !important}table.kmMobileHide{display:none !important}table[class=kmTextContentContainer]{width:100% !important}table[class=kmBoxedTextContentContainer]{width:100% !important}td[class=kmImageContent]{padding-left:0 !important;padding-right:0 !important}img[class=kmImage]{width:100% !important}table[class=kmSplitContentLeftContentContainer],table[class=kmSplitContentRightContentContainer],table[class=kmColumnContainer],td[class=kmVerticalButtonBarContentOuter] table[class=kmButtonBarContent],td[class=kmVerticalButtonCollectionContentOuter] table[class=kmButtonCollectionContent],table[class=kmVerticalButton],table[class=kmVerticalButtonContent]{width:100% !important}td[class=kmButtonCollectionInner]{padding-left:9px !important;padding-right:9px !important;padding-top:9px !important;padding-bottom:0 !important;background-color:transparent !important}td[class=kmVerticalButtonIconContent],td[class=kmVerticalButtonTextContent],td[class=kmVerticalButtonContentOuter]{padding-left:0 !important;padding-right:0 !important;padding-bottom:9px !important}table[class=kmSplitContentLeftContentContainer] td[class=kmTextContent],table[class=kmSplitContentRightContentContainer] td[class=kmTextContent],table[class=kmColumnContainer] td[class=kmTextContent],table[class=kmSplitContentLeftContentContainer] td[class=kmImageContent],table[class=kmSplitContentRightContentContainer] td[class=kmImageContent]{padding-top:9px !important}td[class='rowContainer kmFloatLeft'],td[class='rowContainer kmFloatLeft firstColumn'],td[class='rowContainer kmFloatLeft lastColumn']{float:left;clear:both;width:100% !important}table[id=templateContainer],table[class=templateRow]{max-width:600px !important;width:100% !important}h1{font-size:24px !important;line-height:130% !important}h2{font-size:20px !important;line-height:130% !important}h3{font-size:18px !important;line-height:130% !important}h4{font-size:16px !important;line-height:130% !important}td[class=kmTextContent]{font-size:14px !important;line-height:130% !important}td[class=kmTextBlockInner] td[class=kmTextContent]{padding-right:18px !important;padding-left:18px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner]{padding-left:9px !important;padding-right:9px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner] [class=kmTextContent]{font-size:14px !important;line-height:130% !important;padding-left:4px !important;padding-right:4px !important}}</style></head><body style='margin:0;padding:0;background-color:#c7c7c7'><center><table align='center' border='0' cellpadding='0' cellspacing='0' id='bodyTable' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;background-color:#c7c7c7;height:100%;margin:0;width:100%'><tbody><tr><td align='center' id='bodyCell' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding-top:50px;padding-left:20px;padding-bottom:20px;padding-right:20px;border-top:0;height:100%;margin:0;width:100%'><table border='0' cellpadding='0' cellspacing='0' id='templateContainer' width='600' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;border:1px solid #aaa;background-color:#f4f4f4;border-radius:0'><tbody><tr><td id='templateContainerInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmImageBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmImageBlockOuter'><tr><td class='kmImageBlockInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:9px;' valign='top'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmImageContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmImageContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;padding-top:0px;padding-bottom:0;padding-left:9px;padding-right:9px;'><img align='left' alt='' class='kmImage' src='https://d3k81ch9hvuctc.cloudfront.net/company%2Fb674Zj%2Fimages%2Fheader_email.jpg' width='564' style='border:0;height:auto;line-height:100%;outline:none;text-decoration:none;padding-bottom:0;display:inline;vertical-align:bottom;margin-right:0;max-width:800px;' /></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmTextBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmTextBlockOuter'><tr><td class='kmTextBlockInner' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmTextContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmTextContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#505050;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;'><h1 style='color:#222;display:block;font-family:Helvetica, Arial;font-size:26px;font-style:normal;font-weight:bold;line-height:110%;letter-spacing:normal;margin:0;margin-bottom:9px;text-align:left'>Lamentamos sua saída!</h1><p style='margin:0;padding-bottom:1em'> </p><p style='margin:0;padding-bottom:1em'>É uma pena que você já deletou sua conta. Mas Gostaríamos muito de te continuar vendo em nosso site! Lembre-se: Você sempre será bem vindo novamente em nosso grupo de usuários.</p><p style='margin:0;padding-bottom:1em'>Abraços,</p><p style='margin:0;padding-bottom:0'>Equipe Gueime</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></table></td></tr></tbody></table></td></tr></tbody></table></center></body></html>",
            "text": "É uma pena que você já deletou sua conta. Mas Gostaríamos muito de te continuar vendo em nosso site! Lembre-se: Você sempre será bem vindo novamente em nosso grupo de usuários.",
            "subject": "Gueime - Conta Desativada",
            "from_email": "parceiros@gueime.com.br",
            "from_name": "Gueime - Parceiros",
            "to": [{
                    "email": user.email,
                    "name": user.name.first,
                    "type": "to"
                },
                {
                    "email": "parceiros@gueime.com.br",
                    "name": "Parceiros",
                    "type": "bcc"
                }],
            "headers": {
                "Reply-To": "parceiros@gueime.com.br"
            },
            "important": false,
            "track_opens": true,
            "track_clicks": true,
            "auto_text": null,
            "auto_html": true,
            "inline_css": null,
            "url_strip_qs": null,
            "preserve_recipients": null,
            "view_content_link": null,
            "return_path_domain": null,
            "tags": [
                "delMessage"
            ]
        };
        var async = false;
        var ip_pool = "Main Pool";
        // Evio de Email
        mandrill_client.messages.send({"message": delMessage, "async": async, "ip_pool": ip_pool}, function(result) {
            console.log(result);
            Users.update(
                { 'name.loginName': req.user.name.loginName },
                { $set: {
                    deleted: true
                }
                },
                function (err) {
                    res.redirect('/logout')
                }
            );
        }, function(e) {
            console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
            
            Users.update(
                { 'name.loginName': req.user.name.loginName },
                { $set: {
                    deleted: true
                }
                },
                function (err) {
                    res.redirect('/logout')
                }
            );
        });
    });

    // =====================================
    // RESTORE USER ========================
    // =====================================
    app.get('/users/restore', function (req, res) {
        user = req.user;
        res.render('profile/restore', { user: user });
    });

    app.put('/users/restore', function (req, res) {
        Users.update(
            { 'name.loginName': req.user.name.loginName },
            { $set: {
                deleted: false
            }
            },
            function (err) {
                res.redirect('/profile')
            }
        );
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });
}