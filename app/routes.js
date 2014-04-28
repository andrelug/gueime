var Users = require('./models/user'),
    Artigos = require('./models/article'),
    Games = require('./models/game'),
    Console = require('./models/console'),
    DevPub = require('./models/devPub'),
    Genre = require('./models/genre'),
    func = require('../config/functions'),
    facebook = require('../config/facebook.js'),
    ip = require('ip'),
    fs = require("fs"),
    transloadit = require('node-transloadit'),
    nodemailer = require("nodemailer");

var client = new transloadit('6a960970bff411e38b2aefa7e162a72d', '293a0ad266df65f8e8396cb6d972da8d14f2e608');

// Session check function
var sessionReload = function(req, res, next){
    if('HEAD' == req.method || 'OPTIONS' == req.method){
        return next();
    }else{
        req.session._garbage = Date();
        req.session.touch();
    }
}

module.exports = function (app, passport, mongoose) {

    // =====================================
    // HOME PAGE ===========================
    // =====================================
    app.get('/', function (req, res, next) {
        var user = req.user;

        var redirected = req.query.redirect;

        var deletado = req.query.deletado;

        var onlyOne = req.query.onlyOne;

        var revision = req.query.revision;

        var searchTag = req.query.t;

        if(searchTag){
            var searchStr = [];

            searchStr = searchTag.split('-');
            if (!user) {
                Artigos.find({ facet: { $all: searchStr}, status: 'publicado' }, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({'_id': -1}).limit(6).exec(function (err, docs) {
                    var gameStr;
                    
                    if(searchTag != undefined){
                        gameStr = searchTag.toString().split(/[ ,]+/).join(' ');
                    } else{
                        gameStr = 0
                    }
                    Games.find({status: 'publicado', title: new RegExp(gameStr, 'i') }, function(err, game){
                        res.render('index', { title: "Gueime - O melhor site de games do Brasil!", docs: docs, messages: redirected, deletado: deletado, onlyOne: onlyOne, games: game, searchTag: searchTag});
                    });
                });
            } else {
                if(user.deleted == true){
                    res.redirect('/users/restore');
                } else {
                    sessionReload(req, res, next);
                    Artigos.find({ facet: { $all: searchStr}, status: 'publicado' }, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).limit(6).exec(function (err, docs) {
                        if(err)
                            throw(err);

                        var gameStr;
                    
                        if(searchTag != undefined){
                            gameStr = searchTag.split('-').join(' ');
                        } else{
                            gameStr = 0
                        }
                        console.log(gameStr);
                        Games.find({status: 'publicado', title: new RegExp(gameStr, 'i') }, function(err, game){
                            Users.update({'_id': user._id}, {$inc: {'graph.visits': 1}}, function(err){
                                res.render('index', { user: user, title: "Gueime - O melhor site de games do Brasil!", docs: docs, messages: redirected, deletado: deletado, onlyOne: onlyOne, games: game, searchTag: searchTag});
                            });
                        });
                    
                    });
                }
            }
        } else {
            if (!user) {
                Artigos.find({status: 'publicado'}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ '_id': -1 }).limit(6).exec(function (err, docs) {

                    res.render('index', { title: "Gueime - O melhor site de games do Brasil!", docs: docs, messages: redirected, deletado: deletado, onlyOne: onlyOne});
                });
            } else {
                if(user.deleted == true){
                    res.redirect('/users/restore');
                } else {
                    sessionReload(req, res, next);
                    Artigos.find({status: 'publicado'}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ '_id': -1 }).limit(6).exec(function (err, docs) {

                        Users.update({'_id': user._id}, {$inc: {'graph.visits': 1}}, function(err){
                            res.render('index', { user: user, title: "Gueime - O melhor site de games do Brasil!", docs: docs, messages: redirected, deletado: deletado, onlyOne: onlyOne, revision: revision});
                        });
                    
                    });
                }
            }
        }
    });


    // AUTOCOMPLETE
    app.get('/autocomplete', function(req, res){
        data = req.query.query;

        
        Artigos.find({facet: new RegExp(data, 'i')}, {facet: 1, _id: 0}, function(err, docs){
            Games.find({title: new RegExp(data, 'i')}, {title: 1, _id: 0}, function(err, games){
                DevPub.find({title: new RegExp(data, 'i')}, {title: 1, _id: 0}, function(err, devPub){
                    var sendArray = [];
                    for(i=0; i < docs.length; i++){
                        sendArray.push(docs[i].facet);
                    }
                    for(i=0; i < games.length; i++){
                        sendArray.push(games[i].title);
                    }
                    for(i=0; i < devPub.length; i++){
                        sendArray.push(devPub[i].title);
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
        });
    });


    // PAGINAÇÃO 
    app.get('/pagination', function(req, res){
        n = req.query.n;

        var searchStr = [];

        if (!req.query.str) {
            Artigos.find({status: 'publicado'}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ '_id': -1 }).limit(6).skip(n).exec(function (err, docs) {

                res.render('tags', { docs: docs });
            });
        } else {
            for (i = 0; i < req.query.str.length; i++) {
                searchStr.push(func.string_to_slug(req.query.str[i]));
                if (searchStr[i].indexOf('-') > -1) {
                    searchStr[i] = searchStr[i].split(/[\s,-]+/);
                }
            }
            searchStr = searchStr.toString().split(',');

            Artigos.find({ facet: { $all: searchStr}, status: 'publicado' }, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).limit(6).skip(n).exec(function (err, docs) {

                res.render('tags', { docs: docs });
            });
        }
    });


    // BUSCA TAGS
    app.get('/tags', function (req, res) {
        var user = req.user;
        var searchStr = [];

        if (!req.query.str) {
            Artigos.find({status: 'publicado'}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ '_id': -1 }).limit(6).exec(function (err, docs) {

                if(!user){
                    res.render('tags', { docs: docs});
                } else {
                    Users.update({'_id': user._id}, {$inc: {'graph.searches': 1}}, function(err){
                        res.render('tags', { docs: docs});
                    });
                }
            });
        } else {
            for (i = 0; i < req.query.str.length; i++) {
                searchStr.push(func.string_to_slug(req.query.str[i]));
                if (searchStr[i].indexOf('-') > -1) {
                    searchStr[i] = searchStr[i].split(/[\s,-]+/);
                }
            }
            searchStr = searchStr.toString().split(',');
            Artigos.find({ facet: { $all: searchStr}, status: 'publicado' }, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).limit(6).exec(function (err, docs) {

                if(!user){
                    var gameStr;
                    
                    if(req.query.str != undefined){
                        gameStr = req.query.str.toString().split(/[ ,]+/).join(' ');
                    } else{
                        gameStr = 0
                    }
                    Games.find({status: 'publicado', title: new RegExp(gameStr, 'i') }, function(err, game){
                        res.render('tags', { docs: docs, game: game  });
                    });
                } else {
                    Users.update({'_id': user._id}, {$inc: {'graph.searches': 1}, $push: {'graph.searchStr': searchStr}}, function(err){
                        var gameStr;

                        if(req.query.str != undefined){
                            gameStr = req.query.str.toString().split(/[ ,]+/).join(' ');
                        } else{
                            gameStr = 0
                        }
                        Games.find({status: 'publicado', title: new RegExp(gameStr, 'i') }, function(err, game){
                            res.render('tags', { docs: docs, games: game });
                        });
                    });
                }
            });
        }

    });


    
    // AJAX E FALLBACK PARA NOTICIAS
    app.get('/noticias/:noticia', function (req, res, next) {
        var user = req.user;
        var noticia = req.params.noticia;
        
        if (req.xhr === true) {

            Artigos.findOneAndUpdate({ slug: noticia, type: 'noticia' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
                if(docs.status == 'publicado'){
                    var title = docs.title,
                        body = decodeURIComponent(docs.text);
                    Users.find({ _id: docs.authors.main }, function (err, author) {
                        if(!user){
                            res.render('artigoAjax', { tipo: 'noticia', article: docs, title: title, body: body, author: author[0] });
                        }else {
                            Users.update({'_id': user._id}, {$inc: {'graph.visits': 1}}, function(err){
                                res.render('artigoAjax', { tipo: 'noticia', article: docs, title: title, body: body, author: author[0], user: user });
                            });
                        }
                    });
                } else{
                    res.redirect('/?redirect=true');
                }
                
            });


        } else {
            if (!user) {
                Artigos.findOneAndUpdate({ slug: noticia, type: 'noticia' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
                    if(docs.status == 'publicado'){
                        var title = docs.title,
                            body = decodeURIComponent(docs.text);
                        Users.find({ _id: docs.authors.main }, function (err, author) {
                            res.render('artigo', { tipo: 'noticia', article: docs, title: title, body: body, author: author[0] });
                        });
                    } else{
                        res.redirect('/?redirect=true');
                    }
                });
            } else {
                if(user.deleted == true){
                    res.redirect('/users/restore');
                } else{
                    sessionReload(req, res, next);
                    Artigos.findOneAndUpdate({ slug: noticia, type: 'noticia' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
                        if(docs.status == 'publicado'){
                            var title = docs.title,
                                body = decodeURIComponent(docs.text);
                            Users.find({ _id: docs.authors.main }, function (err, author) {
                                Users.update({'_id': user._id}, {$inc: {'graph.visits': 1}}, function(err){
                                    res.render('artigo', { tipo: 'noticia', article: docs, title: title, body: body, user: user, author: author[0] });
                                });
                            });
                        } else {
                            res.redirect('/?redirect=true');
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
                if(docs.status == 'publicado'){
                    var title = docs.title,
                        body = decodeURIComponent(docs.text);

                    Users.find({ _id: docs.authors.main }, function (err, author) {
                        if(!user){
                            res.render('artigoAjax', { tipo: 'artigo', article: docs, title: title, body: body, author: author[0] });
                        } else {
                            Users.update({'_id': user._id}, {$inc: {'graph.visits': 1}}, function(err){
                                res.render('artigoAjax', { tipo: 'artigo', article: docs, title: title, body: body, author: author[0], user: user });
                            });
                        }
                    });
                } else {
                    res.redirect('/?redirect=true');
                }
            });

        } else {
            if (!user) {
                Artigos.findOneAndUpdate({ slug: artigo, type: 'artigo' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
                    if(docs.status == 'publicado'){
                        var title = docs.title,
                            body = decodeURIComponent(docs.text);
                        Users.find({ _id: docs.authors.main }, function (err, author) {
                            res.render('artigo', { tipo: 'artigo', article: docs, title: title, body: body, author: author[0] });
                        });
                    } else {
                        res.redirect('/?redirect=true');
                    }
                });
            } else {
                if(user.deleted == true){
                    res.redirect('/users/restore');
                } else{
                    sessionReload(req, res, next);
                    Artigos.findOneAndUpdate({ slug: artigo, type: 'artigo' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
                        if(docs.status == 'publicado'){
                            var title = docs.title,
                                body = decodeURIComponent(docs.text);

                            Users.find({ _id: docs.authors.main }, function (err, author) {
                                Users.update({'_id': user._id}, {$inc: {'graph.visits': 1}}, function(err){
                                    res.render('artigo', { tipo: 'artigo', article: docs, title: title, body: body, user: user, author: author[0] });
                                });
                            });
                        } else {
                            res.redirect('/?redirect=true');
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

                    Users.find({ _id: docs.authors.main }, function (err, author) {
                        if(!user){
                            Games.findOne({slug: analise, status: 'publicado'}, function(err, game){
                                if(game.release){
                                    var date = game.release;
                                    date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                                }
                                res.render('artigoAjax', { tipo: 'analise', article: docs, title: title, body: body, author: author[0], decimal: decimal, score: score, bad: bad, good: good });
                            });
                        } else {
                            Users.update({'_id': user._id}, {$inc: {'graph.visits': 1}}, function(err){
                                Games.findOne({slug: analise, status: 'publicado'}, function(err, game){
                                    if(game.release){
                                        var date = game.release;
                                        date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                                    }
                                    res.render('artigoAjax', { tipo: 'analise', article: docs, title: title, body: body, author: author[0], user: user, decimal: decimal, score: score, bad: bad, good: good, game: game, date: date });
                                });
                            });
                        }
                    });
                } else {
                    res.redirect('/?redirect=true');
                }
            });

        } else {
            if (!user) {
                Artigos.findOneAndUpdate({ slug: analise, type: 'analise' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
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
                        Users.find({ _id: docs.authors.main }, function (err, author) {
                            Games.findOne({slug: analise, status: 'publicado'}, function(err, game){
                                if(game.release){
                                    var date = game.release;
                                    date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                                }
                                res.render('artigo', { tipo: 'analise', article: docs, title: title, body: body, author: author[0], decimal: decimal, score: score, bad: bad, good: good, game: game, date: date });
                            });
                        });
                    } else {
                        res.redirect('/?redirect=true');
                    }
                });
            } else {
                if(user.deleted == true){
                    res.redirect('/users/restore');
                } else{
                    sessionReload(req, res, next);
                    Artigos.findOneAndUpdate({ slug: analise, type: 'analise' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
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

                            Users.find({ _id: docs.authors.main }, function (err, author) {
                                Users.update({'_id': user._id}, {$inc: {'graph.visits': 1}}, function(err){
                                    Games.findOne({slug: analise, status: 'publicado'}, function(err, game){
                                        if(game.release){
                                            var date = game.release;
                                            date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                                        }
                                        res.render('artigo', { tipo: 'analise', article: docs, title: title, body: body, user: user, author: author[0], decimal: decimal, score: score, bad: bad, good: good, game: game, date:date });
                                    });
                                });
                            });
                        } else {
                            res.redirect('/?redirect=true');
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
                if(docs.status == 'publicado'){
                    var title = docs.title,
                        body = decodeURIComponent(docs.text);
                    Users.find({ _id: docs.authors.main }, function (err, author) {
                        if(!user){
                            res.render('artigoAjax', { tipo: 'video', article: docs, title: title, body: body, author: author[0] });
                        } else {
                            Users.update({'_id': user._id}, {$inc: {'graph.visits': 1}}, function(err){
                                res.render('artigoAjax', { tipo: 'video', article: docs, title: title, body: body, author: author[0], user: user });
                            });
                        }
                    });
                } else {
                    res.redirect('/?redirect=true');
                }
            });

        } else {
            if (!user) {
                Artigos.findOneAndUpdate({ slug: video, type: 'video' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
                    if(docs.status == 'publicado'){
                        var title = docs.title,
                            body = decodeURIComponent(docs.text);
                        Users.find({ _id: docs.authors.main }, function (err, author) {
                            res.render('artigo', { tipo: 'video', article: docs, title: title, body: body, author: author[0] });
                        });
                    } else {
                        res.redirect('/?redirect=true');
                    }
                });
            } else {
                if(user.deleted == true){
                    res.redirect('/users/restore');
                } else{
                    sessionReload(req, res, next);
                    Artigos.findOneAndUpdate({ slug: video, type: 'video' }, { $inc: { 'graph.views': 1}}, {new: true}, function (err, docs) {
                        if(docs.status == 'publicado'){
                            var title = docs.title,
                                body = decodeURIComponent(docs.text);
                            Users.find({ _id: docs.authors.main }, function (err, author) {
                                Users.update({'_id': user._id}, {$inc: {'graph.visits': 1}}, function(err){
                                    res.render('artigo', { tipo: 'video', article: docs, title: title, body: body, user: user, author: author[0] });
                                });
                            });
                        } else {
                            res.redirect('/?redirect=true');
                        }
                    });
                }
            }
        }
    });


    // PÁGINA DE CRIAÇÃO DE NOVOS ARTIGOS
    app.get('/criar/:tipo', function (req, res, next) {
        var user = req.user;
        var tipo = req.params.tipo;
        
        if (!user) {
            res.redirect('/parceiros')
        } else if (user.status == 'admin' || user.status == 'parceiro' || user.status == 'editor') {
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                sessionReload(req, res, next); 
                new Artigos({
                    'authors.main': user._id,
                    'authors.name': user.name.first + ' ' + user.name.last,
                    type: tipo
                }).save(function (err, docs) {
                    if (err)
                        throw err
                    res.render('create', { user: user, title: "Gueime - Hora de criar um artigo sensacional!", id: docs._id, tipo: tipo, criar: true });

                });
            }
        } else {
            sessionReload(req, res, next);
            res.redirect('/parceiros');
        }
    });


    // EDIÇÃO DE TUDO
    app.get('/editar/:texto', function(req, res){
        var texto = req.params.texto;
        var user = req.user;
        if(!user){
            res.redirect('/parceiros');
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                Artigos.findOneAndUpdate({slug: texto}, {$set: {status: 'rascunho'}}, {new: false}, function(err, docs){
                    if (user.status == 'admin' && docs.authors.main == user.id || user.status == 'editor' && docs.authors.main == user.id || docs.authors.main == user.id) {
                        var title = docs.title,
                            body = decodeURIComponent(docs.text);

                        var points;
                        if(docs.type == 'video' && docs.status == 'publicado'){
                            if(docs.video.autoral == true){
                                points = 50;
                            } else {
                                points = 5;
                            }
                        } else if(docs.status == 'publicado'){
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
                                case 'video':
                                    points = 5;
                                    break;
                            }
                        } else {
                            points = 0;
                        }
                        
                        Users.update({ 'name.loginName': user.name.loginName }, { $inc: {'gamification.points': -points} }, function (err) {
                            res.render('editar', {user: user, article: docs, title: title, body: body, tipo: docs.type, id: docs._id});
                        });
                    } else if (user.status == 'admin') {
                        var title = docs.title,
                            body = decodeURIComponent(docs.text);

                        res.render('editar', {user: user, article: docs, title: title, body: body, tipo: docs.type, id: docs._id});
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
                        res.redirect('/?deletado=true');
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
        if (user.status == 'admin' || user.status == 'parceiro') {
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
                template_id: '7ecc48d0c00a11e3a4a6730cb0abb3d1'
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

        if (user.status == 'admin' || user.status == 'parceiro') {
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
                template_id: '430dcd60c00e11e38c7673670f8168f5'
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
                tags = b.tags,
                consoles = b.consoles,
                publicadoras = b.publicadoras,
                desenvolvedores = b.desenvolvedores,
                generos = b.generos,
                categoriaArtigo = b.categoriaArtigo,
                analiseBom = b.analiseBom,
                analiseRuim = b.analiseRuim,
                slug = func.string_to_slug(decodeURIComponent(b.docTitle.replace('<p>', '').replace('</p>', '')));

            var autoral = b.autoral;

            var facet = [];

            if (games != undefined) { games = func.string_to_slug(b.jogo); if (games.indexOf('-') > -1) { games = games.split(/[\s,-]+/); facet = facet.concat(games); } else { facet.push(games.split(' ')) } }

            if (tags != undefined) { tags = func.string_to_slug(b.tags); if (tags.indexOf('-') > -1) { tags = tags.split(/[\s,-]+/); facet = facet.concat(tags); } else { facet.push(tags.split(' ')) } }

            if (consoles != undefined) { consoles = func.string_to_slug(b.consoles); if (consoles.indexOf('-') > -1) { consoles = consoles.split(/[\s,-]+/); facet = facet.concat(consoles); } else { facet.push(consoles.split(' ')) } }

            if (publicadoras != undefined) { publicadoras = func.string_to_slug(b.publicadoras); if (publicadoras.indexOf('-') > -1) { publicadoras = publicadoras.split(/[\s,-]+/); facet = facet.concat(publicadoras); } else { facet.push(publicadoras.split(' ')) } }

            if (desenvolvedores != undefined) { desenvolvedores = func.string_to_slug(b.desenvolvedores); if (desenvolvedores.indexOf('-') > -1) { desenvolvedores = desenvolvedores.split(/[\s,-]+/); facet = facet.concat(desenvolvedores); } else { facet.push(desenvolvedores.split(' ')) } }

            if (generos != undefined) { generos = func.string_to_slug(b.generos); if (generos.indexOf('-') > -1) { generos = generos.split(/[\s,-]+/); facet = facet.concat(generos); } else { facet.push(generos.split(' ')) } }

            if (categoriaArtigo != undefined) { categoriaArtigo = func.string_to_slug(b.categoriaArtigo); if (categoriaArtigo.indexOf('-') > -1) { categoriaArtigo = categoriaArtigo.split(/[\s,]+/); facet = facet.concat(categoriaArtigo); } else { facet.push(categoriaArtigo.split(' ')) } }

            if (analiseBom != undefined) { if (analiseBom.indexOf(',') > -1) { analiseBom = analiseBom.split(','); } }
            if (analiseRuim != undefined) { if (analiseRuim.indexOf(',') > -1) { analiseRuim = analiseRuim.split(','); } }
            console.log(facet);
            facet.push(b.serieArtigo, b.tipoVideo, b.canalVideo);
            console.log(facet);
            
            var status;
            if(user.status == 'admin' || user.status == 'editor'){
                status = 'publicado';
            } else {
                status = 'revisao';
            }

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

            if (b.tipo == 'noticia') {
                Artigos.update({_id: id}, { $set: {

                    description: b.descricao,
                    status: status,
                    'cover.image': b.coverUrl,
                    'cover.position': b.position,
                    tags: b.tags,
                    'graph.games': b.jogo,
                    'graph.consoles': b.consoles,
                    'graph.genres': b.generos,
                    'graph.developers': b.desenvolvedores,
                    'graph.publishers': b.publicadoras,
                    'news.story': b.continuacaoHistoria,
                    slug: slug,
                    'authors.revision': user._id

                }, $addToSet: {
                    facet: { $each: sendFacet }
                }
                }, function (err) {
                    if (err)
                        throw err
                    if(user.status == 'admin' || user.status == 'editor'){
                        // Atribuição de pontuação
                        Users.update({_id: criador}, {$inc: {'graph.publications': 1, 'gamification.points': 10}}, function(err){
                            // Ganha pontos por revisão
                            if(criador != user._id){
                                Users.update({_id: user._id}, {$inc: {'gamification.points': 30}}, function(err){
                                    res.redirect('/' + b.tipo + 's/' + slug);
                                });
                            } else {
                                res.redirect('/' + b.tipo + 's/' + slug);
                            }
                        });
                    } else{
                        // Manda pra revisão
                        res.redirect('/?revision=true');
                    }
                });
            } else if (b.tipo == 'artigo') {
                Artigos.update({_id: id}, { $set: {

                    description: b.descricao,
                    status: status,
                    'cover.image': b.coverUrl,
                    'cover.position': b.position,
                    tags: b.tags,
                    'graph.games': b.jogo,
                    'graph.consoles': b.consoles,
                    'graph.genres': b.generos,
                    'graph.developers': b.desenvolvedores,
                    'graph.publishers': b.publicadoras,
                    'article.category': b.categoriaArtigo,
                    'article.serie': b.serieArtigo,
                    slug: slug,
                    'authors.revision': user._id

                }, $addToSet: {
                    facet: { $each: sendFacet }
                }
                }, function (err) {
                    if (err)
                        throw err
                    if(user.status == 'admin' || user.status == 'editor'){
                        // Atribuição de pontuação
                        Users.update({_id: criador}, {$inc: {'graph.publications': 1, 'gamification.points': 30}}, function(err){
                            // Ganha pontos por revisão
                            if(criador != user._id){
                                Users.update({_id: user._id}, {$inc: {'gamification.points': 30}}, function(err){
                                    res.redirect('/' + b.tipo + 's/' + slug);
                                });
                            } else {
                                res.redirect('/' + b.tipo + 's/' + slug);
                            }
                        });
                    } else{
                        // Manda pra revisão
                        res.redirect('/?revision=true');
                    }
                });
            } else if (b.tipo == 'analise') {
                Artigos.update({_id: id}, { $set: {

                    description: b.descricao,
                    status: status,
                    'cover.image': b.coverUrl,
                    'cover.position': b.position,
                    tags: b.tags,
                    'graph.games': b.jogo,
                    'review.score': b.nota,
                    'review.good': analiseBom,
                    'review.bad': analiseRuim,
                    'review.punchLine': b.analiseEfeito,
                    slug: slug,
                    'authors.revision': user._id


                }, $addToSet: {
                    facet: { $each: sendFacet }
                }
                }, function (err) {
                    if (err)
                        throw err
                    if(user.status == 'admin' || user.status == 'editor'){
                        // Atribuição de pontuação
                        Users.update({_id: criador}, {$inc: {'graph.publications': 1, 'gamification.points': 50}}, function(err){
                            // Ganha pontos por revisão
                            if(criador != user._id){
                                Users.update({_id: user._id}, {$inc: {'gamification.points': 30}}, function(err){
                                    res.redirect('/' + b.tipo + 's/' + slug);
                                });
                            } else {
                                res.redirect('/' + b.tipo + 's/' + slug);
                            }
                        });
                    } else{
                        // Manda pra revisão
                        res.redirect('/?revision=true');
                    }
                });
            } else {
                Artigos.update({_id: id}, { $set: {

                    description: b.descricao,
                    status: status,
                    'cover.image': b.coverUrl,
                    'cover.position': b.position,
                    tags: b.tags,
                    'graph.games': b.jogo,
                    'graph.consoles': b.consoles,
                    'graph.genres': b.generos,
                    'graph.developers': b.desenvolvedores,
                    'graph.publishers': b.publicadoras,
                    'video.tipo': b.tipoVideo,
                    'video.canal': b.canalVideo,
                    'video.url': b.urlVideo,
                    slug: slug,
                    'authors.revision': user._id,
                    'video.autoral': autoral

                }, $addToSet: {
                    facet: { $each: sendFacet }
                }
                }, function (err) {
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
                        Users.update({_id: criador}, {$inc: {'graph.publications': 1, 'gamification.points': videoPoints}}, function(err){
                            // Ganha pontos por revisão
                            if(criador != user._id){
                                Users.update({_id: user._id}, {$inc: {'gamification.points': 30}}, function(err){
                                    res.redirect('/' + b.tipo + 's/' + slug);
                                });
                            } else {
                                res.redirect('/' + b.tipo + 's/' + slug);
                            }
                        });
                    } else{
                        // Manda pra revisão
                        res.redirect('/?revision=true');
                    }
                });
            }
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
                sessionReload(req, res, next);
                Artigos.find({status: 'publicado', 'authors.main': user._id}, {description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1}).sort({'_id': -1}).limit(6).exec(function(err, docs){

                    if(user.birthDate){
                        var date = user.birthDate;
                        date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                    }
                    
                    Users.update({'_id': user._id}, {$inc: {'graph.visits': 1}}, function(err){
                        res.render('profile',{user: user, title: "Gueime - " + user.name.first + ' ' + user.name.last, docs: docs, profile: user, canonical: true, date: date, public: false});
                    });
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
                sessionReload(req, res, next);
                Artigos.find({status: 'publicado', 'authors.main': user._id}, {description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1}).sort({'_id': -1}).limit(6).exec(function(err, docs){

                    if(user.birthDate){
                        var date = user.birthDate;
                        date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                    }
                    
                    Users.update({'_id': user._id}, {$inc: {'graph.visits': 1}}, function(err){
                        res.render('profileEdit',{user: user, title: "Gueime - " + user.name.first + ' ' + user.name.last, docs: docs, profile: user, canonical: true, date: date, public: false});
                    });
                });
            }
        }
    });

    
    // UPLOAD DE NOVA COVER NA CRIAÇÃO DE PERFIL
    app.post('/newProfileCover', function (req, res, next) {
        var user = req.user;
        var sendImg = user.name.loginName + req.files.file.name;
        if (user.status == 'admin' || user.status == 'parceiro') {
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
                template_id: '7ecc48d0c00a11e3a4a6730cb0abb3d1'
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
                Artigos.find({status: 'publicado', 'authors.main': profileUser._id}, {description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1}).sort({'_id': -1}).limit(6).exec(function(err, docs){
                    if(profileUser.birthDate){
                        var date = profileUser.birthDate;
                        date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                    }
                    res.render('profile',{title: "Gueime - " + profileUser.name.first + ' ' + profileUser.name.last, docs: docs, profile: profileUser, public: true, date: date});
                });
            });
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                sessionReload(req, res, next);
                Users.findOne({'name.loginName': profile}, function(err, profileUser){
                    Artigos.find({status: 'publicado', 'authors.main': profileUser._id}, {description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1}).sort({'_id': -1}).limit(6).exec(function(err, docs){

                        if(profileUser.birthDate){
                            var date = profileUser.birthDate;
                            date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                        }
                        Users.update({'_id': user._id}, {$inc: {'graph.visits': 1}}, function(err){
                            res.render('profile',{user: user, title: "Gueime - " + profileUser.name.first + ' ' + profileUser.name.last, docs: docs, profile: profileUser, public: true, date: date});
                        });
                    });
                });
            }
        }
    });

    // PAGINAÇÃO PROFILE
    app.get('/paginationProfile', function(req, res){
        var userId = req.query.b;
        var n = req.query.n;

        Artigos.find({status: 'publicado', 'authors.main': userId}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ '_id': -1 }).limit(6).skip(n).exec(function (err, docs) {

            res.render('tags', { docs: docs });
        });
    });

    // =====================================
    // CONSOLE PAGE ========================
    // =====================================
    app.get('/consoles/:con', function(req, res, next){
        var user = req.user;
        var dev = req.params.con;

        if(!user){
            Console.findOneAndUpdate({slug: dev}, {$inc: { 'graph.views': 1}}, function(err, dev){
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

                        res.render('console', {user: user, title: "Gueime - " + dev.title, dev: dev, docs: artigo, games: games, date: date, pub: true })
                    });
                });
            });
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                sessionReload(req, res, next);
                Console.findOneAndUpdate({slug: dev}, {$inc: { 'graph.views': 1}}, function(err, dev){
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

                            Users.update({'_id': user._id}, {$inc: {'graph.visits': 1}}, function(err){
                                res.render('console', {user: user, title: "Gueime - " + dev.title, dev: dev, docs: artigo, games: games, date: date, pub: true })
                            }); 
                        });
                    });
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
                sessionReload(req, res, next);
                Console.findOne({status: 'publicado', slug: dev}).exec(function(err, docs){
                    var date;
                    if(docs.startDate){
                        date = docs.startDate;
                        date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                    }
                    res.render('consoleEdit',{user: user, title: "Gueime - " + docs.title, developer: docs, date: date, edit: true});
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
                sessionReload(req, res, next);
                res.render('consoleEdit',{user: user, title: "Gueime - Novo Jogo", edit: false});
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
                if(b.editing == 'yes'){
                    Console.update({slug: b.lastSlug}, {$set:{
                        title: b.nomeConsole,
                        about: b.sobre,
                        slug: slug,
                        startDate: lauchDate,
                        genCover: b.gameCover,
                        cover: b.position,
                        status: 'publicado'
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
                        status: 'publicado'
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
            res.render('tags', { docs: docs });
        });
    });

    // =====================================
    // GENERO PAGE =========================
    // =====================================
    app.get('/generos/:gen', function(req, res, next){
        var user = req.user;
        var dev = req.params.gen;

        if(!user){
            Genre.findOneAndUpdate({slug: dev}, {$inc: { 'graph.views': 1}}, function(err, dev){
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

                        res.render('genre', {user: user, title: "Gueime - " + dev.title, dev: dev, docs: artigo, games: games, pub: true })
                    });
                });
            });
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                sessionReload(req, res, next);
                Genre.findOneAndUpdate({slug: dev}, {$inc: { 'graph.views': 1}}, function(err, dev){
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

                            Users.update({'_id': user._id}, {$inc: {'graph.visits': 1}}, function(err){
                                res.render('genre', {user: user, title: "Gueime - " + dev.title, dev: dev, docs: artigo, games: games, pub: true })
                            }); 
                        });
                    });
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
                sessionReload(req, res, next);
                Genre.findOne({status: 'publicado', slug: dev}).exec(function(err, docs){
                    res.render('genreEdit',{user: user, title: "Gueime - " + docs.title, developer: docs, edit: true});
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
                sessionReload(req, res, next);
                res.render('genreEdit',{user: user, title: "Gueime - Novo Jogo", edit: false});
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
                if(b.editing == 'yes'){
                    Genre.update({slug: b.lastSlug}, {$set:{
                        title: b.nomeGenero,
                        about: b.sobre,
                        slug: slug,
                        genCover: b.gameCover,
                        cover: b.position,
                        status: 'publicado'
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
                        status: 'publicado'
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
            res.render('tags', { docs: docs });
        });
    });

    // =====================================
    // DISTRIBUIDORA PAGE ==================
    // =====================================
    app.get('/distribuidoras/:dev', function(req, res, next){
        var user = req.user;
        var dev = req.params.dev;

        if(!user){
            DevPub.findOneAndUpdate({slug: dev, type: 'publisher'}, {$inc: { 'graph.views': 1}}, function(err, dev){
                Artigos.find({status: 'publicado', 'graph.publisher': new RegExp(dev.title, 'i'), type: {$ne: 'analise'}}).sort({_id: -1}).limit(6).exec(function(err, articles){
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

                        res.render('devPub', {user: user, title: "Gueime - " + dev.title, dev: dev, docs: artigo, games: games, date: date, pub: true })
                    });
                });
            });
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                sessionReload(req, res, next);
                DevPub.findOneAndUpdate({slug: dev, type: 'publisher'}, {$inc: { 'graph.views': 1}}, function(err, dev){
                    Artigos.find({status: 'publicado', 'graph.publisher': new RegExp(dev.title, 'i'), type: {$ne: 'analise'}}).sort({_id: -1}).limit(6).exec(function(err, articles){
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

                            Users.update({'_id': user._id}, {$inc: {'graph.visits': 1}}, function(err){
                                res.render('devPub', {user: user, title: "Gueime - " + dev.title, dev: dev, docs: artigo, games: games, date: date, pub: true })
                            }); 
                        });
                    });
                });
            }
        }
    });

    

    // PAGINAÇÃO DISTRIBUIDORA
    app.get('/paginationPub', function(req, res){
        var pubTitle = req.query.b.toString();
        var n = req.query.n;

        Artigos.find({status: 'publicado', 'graph.publishers': new RegExp(pubTitle, 'i'), type: {$ne: 'analise'}}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ '_id': -1 }).limit(6).skip(n).exec(function (err, docs) {
            res.render('tags', { docs: docs });
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
                sessionReload(req, res, next);
                DevPub.findOne({status: 'publicado', type: 'publisher', slug: dev}).exec(function(err, docs){
                    var date;
                    if(docs.startDate){
                        date = docs.startDate;
                        date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                    }
                    res.render('devPubEdit',{user: user, title: "Gueime - " + docs.title, developer: docs, edit: true, date: date, pub: true});
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
                sessionReload(req, res, next);
                res.render('devPubEdit',{user: user, title: "Gueime - Novo Jogo", edit: false, pub: true});
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
            DevPub.findOneAndUpdate({slug: dev, type: 'developer'}, {$inc: { 'graph.views': 1}}, function(err, dev){
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

                        res.render('devPub', {user: user, title: "Gueime - " + dev.title, dev: dev, docs: artigo, games: games, date: date, pub: false })
                    });
                });
            });
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                sessionReload(req, res, next);
                DevPub.findOneAndUpdate({slug: dev, type: 'developer'}, {$inc: { 'graph.views': 1}}, function(err, dev){
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

                            Users.update({'_id': user._id}, {$inc: {'graph.visits': 1}}, function(err){
                                res.render('devPub', {user: user, title: "Gueime - " + dev.title, dev: dev, docs: artigo, games: games, date: date, pub: false })
                            }); 
                        });
                    });
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
                sessionReload(req, res, next);
                DevPub.findOne({status: 'publicado', type: 'developer', slug: dev}).exec(function(err, docs){
                    var date;
                    if(docs.startDate){
                        date = docs.startDate;
                        date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                    }
                    res.render('devPubEdit',{user: user, title: "Gueime - " + docs.title, developer: docs, edit: true, date: date, dev: true});
                });
            }
        }
    });

    // PAGINAÇÃO DEVELOPER
    app.get('/paginationDev', function(req, res){
        var devTitle = req.query.b.toString();
        var n = req.query.n;

        Artigos.find({status: 'publicado', 'graph.developers': new RegExp(devTitle, 'i'), type: {$ne: 'analise'}}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ '_id': -1 }).limit(6).skip(n).exec(function (err, docs) {
            res.render('tags', { docs: docs });
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
                sessionReload(req, res, next);
                res.render('devPubEdit',{user: user, title: "Gueime - Novo Jogo", edit: false, dev: true});
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
                            status: 'publicado'
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
                            status: 'publicado'
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
                            status: 'publicado'
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
                            status: 'publicado'
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
            Games.findOneAndUpdate({slug: jogo}, {$inc: { 'graph.views': 1}}, function(err, game){
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

                    res.render('game', {title: "Gueime - " + game.title, game: game, docs: artigo, analise: analise, date: date, score: score, decimal: decimal })
                });
            });
        } else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            } else{
                sessionReload(req, res, next);
                Games.findOneAndUpdate({slug: jogo}, {$inc: { 'graph.views': 1}}, function(err, game){
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

                        Users.update({'_id': user._id}, {$inc: {'graph.visits': 1}}, function(err){
                            res.render('game', {user: user, title: "Gueime - " + game.title, game: game, docs: artigo, analise: analise, date: date, score: score, decimal: decimal })
                        });
                    });
                });
            }
        }
    });


    // ADD GAME TO FAVORITES
    app.put('/addToFavorites', function(req, res){
        var user = req.user;
        var game = req.body.game;
        var operation = req.body.add;

        console.log(game);

        if(operation == 'true'){
            Users.update({_id: user._id}, {$addToSet: {'graph.gamesLike': game}}, function(err){
                res.send('OK');
            });
        } else {
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

        console.log(game);

        if(operation == 'true'){
            Users.update({_id: user._id}, {$addToSet: {'graph.gamesCol': game}}, function(){
                Games.update({title: game}, {$inc: {'graph.gamers': 1}}, function(err){
                    res.send('OK');
                });
            });
        } else {
           Users.update({_id: user._id}, {$pull: {'graph.gamesCol': game}}, function(){
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
            res.render('tags', { docs: docs });
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
                sessionReload(req, res, next);
                Games.findOne({status: 'publicado', slug: jogo}).exec(function(err, docs){
                    var date;
                    if(docs.release){
                        date = docs.release;
                        date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                    }
                    res.render('gameEdit',{user: user, title: "Gueime - " + docs.title, game: docs, edit: true, date: date});
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
                sessionReload(req, res, next);
                res.render('gameEdit',{user: user, title: "Gueime - Novo Jogo", edit: false});
            } else{
                res.redirect('/parceiros');
            }
        }
    });

    // UPLOAD DE NOVA COVER NA CRIAÇÃO DE GAME
    app.post('/newGameCapa', function (req, res, next) {
        var user = req.user;
        var sendImg = user.name.loginName + req.files.file.name;
        if (user.status == 'admin' || user.status == 'parceiro') {
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
                template_id: '7ecc48d0c00a11e3a4a6730cb0abb3d1'
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
        if (user.status == 'admin' || user.status == 'parceiro') {
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
                template_id: 'ab5cbfa0c74511e388575babe5776e3d'
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

            if (plataformas != undefined) { plataformas = func.string_to_slug(b.plataformas); if (plataformas.indexOf('-') > -1) { plataformas = plataformas.split(/[\s,-]+/); sendPlataformas = b.plataformas.toString().split(','); facet = facet.concat(plataformas); } else { facet.push(plataformas.split(' ')); sendPlataformas = b.plataformas}}

            if (esrb != undefined) { esrb = func.string_to_slug(b.esrb); if (esrb.indexOf('-') > -1) { esrb = esrb.split(/[\s,-]+/); sendEsrb = b.esrb.toString().split(','); facet = facet.concat(esrb); } else { facet.push(esrb.split(' ')); sendEsrb = b.esrb } }

            if (genero != undefined) { genero = func.string_to_slug(b.genero); if (genero.indexOf('-') > -1) { genero = genero.split(/[\s,-]+/); sendGenero = b.genero.toString().split(','); facet = facet.concat(genero); } else { facet.push(genero.split(' ')); sendGenero = b.genero } }

            if (desenvolvedor != undefined) { desenvolvedor = func.string_to_slug(b.desenvolvedor); if (desenvolvedor.indexOf('-') > -1) { desenvolvedor = desenvolvedor.split(/[\s,-]+/); sendDesenvolvedor = b.desenvolvedor.toString().split(','); facet = facet.concat(desenvolvedor); } else { facet.push(desenvolvedor.split(' ')); sendDesenvolvedor = b.desenvolvedor } }

            if (distribuidora != undefined) { distribuidora = func.string_to_slug(b.distribuidora); if (distribuidora.indexOf('-') > -1) { distribuidora = distribuidora.split(/[\s,-]+/); sendDistribuidora = b.distribuidora.toString().split(','); facet = facet.concat(distribuidora); } else { facet.push(distribuidora.split(' ')); sendDistribuidora = b.distribuidora }}

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
                        status: 'publicado'
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
                        status: 'publicado'

                    }).save(function(err, docs){
                        console.log(docs);
                        res.redirect('/jogos/' + docs.slug);
                    });
                }                
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
            }else if(user.status == 'admin'){
                switch(tipo){
                    case 'jogos':
                        Games.find({}).sort({_id: -1}).exec(function(err, docs){
                            for(i=0;i < docs.length;i++){
                                var timeStamp = docs[i]._id.toString().substring(0,8);
                                var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                                docs[i].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }
                            res.render('gerenciar', {title: "Gueime - Gerenciar Jogos", user: user, games: docs});
                        });
                        break

                    case 'artigos':
                        Artigos.find({}).sort({_id: -1}).exec(function(err, docs){
                            for(i=0;i < docs.length;i++){
                                var timeStamp = docs[i]._id.toString().substring(0,8);
                                var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                                docs[i].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }
                            res.render('gerenciar', {title: "Gueime - Gerenciar Artigos", user: user, articles: docs});
                        });
                        break

                    case 'desenvolvedores':
                        DevPub.find({type: 'developer'}).sort({_id: -1}).exec(function(err, docs){
                            for(i=0;i < docs.length;i++){
                                var timeStamp = docs[i]._id.toString().substring(0,8);
                                var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                                docs[i].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }
                            res.render('gerenciar', {title: "Gueime - Gerenciar Desenvolvedores", user: user, devs: docs});
                        });
                        break

                    case 'distribuidoras':
                        DevPub.find({type: 'publisher'}).sort({_id: -1}).exec(function(err, docs){
                            for(i=0;i < docs.length;i++){
                                var timeStamp = docs[i]._id.toString().substring(0,8);
                                var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                                docs[i].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }
                            res.render('gerenciar', {title: "Gueime - Gerenciar Distribuidoras", user: user, pubs: docs});
                        });
                        break

                    case 'generos':
                        Genre.find({}).sort({_id: -1}).exec(function(err, docs){
                            for(i=0;i < docs.length;i++){
                                var timeStamp = docs[i]._id.toString().substring(0,8);
                                var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                                docs[i].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }
                            res.render('gerenciar', {title: "Gueime - Gerenciar Gêneros", user: user, gens: docs});
                        });
                        break

                    case 'usuarios':
                        Users.find({}).sort({_id: -1}).exec(function(err, docs){
                            res.render('gerenciar', {title: "Gueime - Gerenciar Usuários", user: user, profile: docs});
                        });
                        break

                    case 'consoles':
                        Console.find({}).sort({_id: -1}).exec(function(err, docs){
                            for(i=0;i < docs.length;i++){
                                var timeStamp = docs[i]._id.toString().substring(0,8);
                                var date = new Date( parseInt( timeStamp, 16 ) * 1000 );
                                docs[i].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                            }
                            res.render('gerenciar', {title: "Gueime - Gerenciar Consoles", user: user, consoles: docs});
                        });
                        break

                }

            } else{
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
    app.put('/artigos/:artigo/deletar', function(req, res){
        var user = req.user;
        var artigo = req.params.artigo;
        var action = req.body.action;
        
        if(!user){
            res.redirect('/');
        }else{
            if(user.deleted == true){
                res.redirect('/users/restore');
            }else if(user.status == 'admin'){
                if(action == 'del'){
                    Artigos.remove({slug: artigo}, function(err){
                        if(err)
                            throw err
                        res.send('OK');
                    });
                } else if(action == 'des'){
                    Artigos.update({slug: artigo}, {$set: {status: 'deletado'}}, function(err){
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
            }else if(user.status == 'admin'){
                Artigos.findOneAndUpdate({slug: changeArt}, {$set: {status: status}}, function(err, docs){
                    if(status == 'publicado'){
                        if(docs.type == 'noticia'){
                            Users.update({_id: docs.authors.main}, {$inc: {'gamification.points': 10}}, function(err){
                                res.send('OK');
                            });
                        } else if(docs.type == 'artigo'){
                            Users.update({_id: docs.authors.main}, {$inc: {'gamification.points': 30}}, function(err){
                                res.send('OK');
                            });
                        } else if(docs.type == 'analise'){
                            Users.update({_id: docs.authors.main}, {$inc: {'gamification.points': 50}}, function(err){
                                res.send('OK');
                            });
                        } else if(docs.type == 'video'){
                            Users.update({_id: docs.authors.main}, {$inc: {'gamification.points': 5}}, function(err){
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

            res.send(JSON.stringify(sendArray));
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

            res.send(JSON.stringify(sendArray));
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

            res.send(JSON.stringify(sendArray));
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

            res.send(JSON.stringify(sendArray));
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

            res.send(JSON.stringify(sendArray));
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

            res.send(JSON.stringify(sendArray));
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

            res.send(JSON.stringify(sendArray));
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

            res.send(JSON.stringify(sendArray));
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

            res.send(JSON.stringify(sendArray));
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

            res.send(JSON.stringify(sendArray));
        });
    });

    // =====================================
    // TRIVIA ==============================
    // =====================================
    app.get('/trivia', function(req, res, next){
        var user = req.user;
        res.render('trivia', {user: user, title: "Gueime - Trivia"});
    });

    // =====================================
    // PÁGINAS ESPECIAIS ===================
    // ===================================== 

    // CONTATO
    app.get('/contato', function(req, res){
        var user = req.user;

        if(user && user.deleted == true){
            res.redirect('/users/restore');
        }else{

            res.render('contato', {title: "Gueime - Contato", user: user});
        }
    });

    // SEND EMAIL
    

    app.post('/contatoSend', function(req, res){
        var user = req.user;
        var b = req.body;

        var smtpTransport = nodemailer.createTransport("SMTP",{
            service: "Hotmail",
            auth: {
                user: "andre@gueime.com.br",
                pass: "Watashiwa1"
            }
        });

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: b.email, // sender address
            to: "André Lucas <andre@gueime.com.br>", // list of receivers
            subject: "Contato - Gueime (" + b.nome + ")", // Subject line
            text: b.mensagem, // plaintext body
            html: b.mensagem // html body
        }

        // send mail with defined transport object
        smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
                console.log(error);
            }else{
                console.log("Message sent: " + response.message);
            }


            smtpTransport.close(); // shut down the connection pool, no more messages
            res.send('OK');
        });

    });

    // PARCEIROS
    app.get('/parceiros', function(req, res){
        var user = req.user
        res.render('parceiros', {title: "Gueime - Parceiros", user: user})
    });

    // PARCEIROS
    app.get('/quem-somos', function(req, res){
        var user = req.user
        res.render('quem', {title: "Gueime - Quem Somos", user: user})
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


    function isLoggedIn(req, res, next) {

        // if user is authenticated in the session, carry on 
        if (req.isAuthenticated())
            return next();

        // if they aren't redirect them to the home page
        res.redirect('/');
    }
}