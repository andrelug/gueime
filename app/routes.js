var Users = require('./models/user');
var Artigos = require('./models/article');
var func = require('../config/functions');
var facebook = require('../config/facebook.js');
var ip = require('ip');
var async = require('async');
var fs = require("fs");

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
        if (!user) {
            Artigos.find({}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ '_id': -1 }).limit(10).exec(function (err, docs) {
                for (i = 0; i < docs.length; i++) {
                    docs[i].title = decodeURIComponent(docs[i].title).replace('<p>', '').replace('</p>', '')
                }
                res.render('index', { title: "Gueime - O melhor site de games do Brasil!", docs: docs });
            });
        } else {

            sessionReload(req, res, next);
            Artigos.find({}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ '_id': -1 }).limit(10).exec(function (err, docs) {
                for (i = 0; i < docs.length; i++) {
                    docs[i].title = decodeURIComponent(docs[i].title).replace('<p>', '').replace('</p>', '')
                }
                res.render('index', { user: user, title: "Gueime - O melhor site de games do Brasil!", docs: docs });
            });


        }
    });




    // BUSCA TAGS

    app.get('/tags', function (req, res) {
        var searchStr = [];
        
        if(!req.query.str){
            Artigos.find({}, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).sort({ '_id': -1 }).limit(10).exec(function (err, docs) {
                for (i = 0; i < docs.length; i++) {
                    docs[i].title = decodeURIComponent(docs[i].title).replace('<p>', '').replace('</p>', '')
                }
                res.render('tags', { docs: docs });
            });
        }else{
            for (i = 0; i < req.query.str.length; i++) {
                searchStr.push(func.string_to_slug(req.query.str[i]));
                if (searchStr[i].indexOf('-') > -1) {
                    searchStr[i] = searchStr[i].split(/[\s,-]+/);
                }
            }
            searchStr = searchStr.toString().split(',');

            Artigos.find({ facet: { $all: searchStr} }, { description: 1, 'authors.name': 1, title: 1, type: 1, 'cover.image': 1, slug: 1, 'graph.views': 1 }).limit(10).exec(function (err, docs) {
                for (i = 0; i < docs.length; i++) {
                    docs[i].title = decodeURIComponent(docs[i].title).replace('<p>', '').replace('</p>', '')
                }
                res.render('tags', { docs: docs });
            });
        }
        
    });

    // AJAX E FALLBACK PARA NOTICIAS
    app.get('/noticias/:noticia', function (req, res, next) {
        var user = req.user;
        var noticia = req.params.noticia;
        if (req.xhr === true) {

            Artigos.find({ slug: noticia }, function (err, docs) {
                var title = decodeURIComponent(docs[0].title).replace('<p>', '').replace('</p>', ''),
                    body = decodeURIComponent(docs[0].text);
                Users.find({ _id: docs[0].authors.main }, function (err, author) {
                    res.render('artigoAjax', { tipo: 'noticia', article: docs[0], title: title, body: body, author: author[0] });
                });
            });


        } else {
            if (!user) {
                Artigos.find({ slug: noticia }, function (err, docs) {
                    var title = decodeURIComponent(docs[0].title).replace('<p>', '').replace('</p>', ''),
                        body = decodeURIComponent(docs[0].text);
                    Users.find({ _id: docs[0].authors.main }, function (err, author) {
                        res.render('artigo', { tipo: 'noticia', article: docs[0], title: title, body: body, author: author[0] });
                    });
                });
            } else {
                sessionReload(req, res, next);
                Artigos.find({ slug: noticia }, function (err, docs) {

                    var title = decodeURIComponent(docs[0].title).replace('<p>', '').replace('</p>', ''),
                        body = decodeURIComponent(docs[0].text);
                    Users.find({ _id: docs[0].authors.main }, function (err, author) {
                        res.render('artigo', { tipo: 'noticia', article: docs[0], title: title, body: body, user: user, author: author[0] });
                    });
                });
            }
        }
    });

    // AJAX E FALLBACK PARA ARTIGOS
    app.get('/artigos/:artigo', function (req, res, next) {
        var user = req.user;
        var artigo = req.params.artigo;
        if (req.xhr === true) {

            Artigos.find({ slug: artigo }, function (err, docs) {
                var title = decodeURIComponent(docs[0].title),
                    body = decodeURIComponent(docs[0].text);

                Users.find({ _id: docs[0].authors.main }, function (err, author) {
                    res.render('artigoAjax', { tipo: 'artigo', article: docs[0], title: title, body: body, author: author[0] });
                });
            });

        } else {
            if (!user) {
                Artigos.find({ slug: artigo }, function (err, docs) {
                    var title = decodeURIComponent(docs[0].title),
                        body = decodeURIComponent(docs[0].text);
                    Users.find({ _id: docs[0].authors.main }, function (err, author) {
                        res.render('artigo', { tipo: 'artigo', article: docs[0], title: title, body: body, author: author[0] });
                    });
                });
            } else {
                sessionReload(req, res, next);
                Artigos.find({ slug: artigo }, function (err, docs) {
                    var title = decodeURIComponent(docs[0].title),
                        body = decodeURIComponent(docs[0].text);

                    Users.find({ _id: docs[0].authors.main }, function (err, author) {
                        res.render('artigo', { tipo: 'artigo', article: docs[0], title: title, body: body, user: user, author: author[0] });
                    });





                });
            }
        }
    });

    // AJAX E FALLBACK PARA ANALISES
    app.get('/analises/:analise', function (req, res, next) {
        var user = req.user;
        var analise = req.params.analise;
        if (req.xhr === true) {

            Artigos.find({ slug: artigo }, function (err, docs) {
                var title = decodeURIComponent(docs[0].title),
                    body = decodeURIComponent(docs[0].text);
                Users.find({ _id: docs[0].authors.main }, function (err, author) {
                    res.render('artigoAjax', { tipo: 'analise', article: docs[0], title: title, body: body, author: author[0] });
                });
            });

        } else {
            if (!user) {
                Artigos.find({ slug: analise }, function (err, docs) {
                    var title = decodeURIComponent(docs[0].title),
                        body = decodeURIComponent(docs[0].text);
                    Users.find({ _id: docs[0].authors.main }, function (err, author) {
                        res.render('artigo', { tipo: 'analise', article: docs[0], title: title, body: body, author: author[0] });
                    });
                });
            } else {
                sessionReload(req, res, next);
                Artigos.find({ slug: analise }, function (err, docs) {
                    var title = decodeURIComponent(docs[0].title),
                        body = decodeURIComponent(docs[0].text);

                    Users.find({ _id: docs[0].authors.main }, function (err, author) {
                        res.render('artigo', { tipo: 'analise', article: docs[0], title: title, body: body, user: user, author: author[0] });
                    });
                });
            }
        }
    });

    // AJAX E FALLBACK PARA VIDEOS
    app.get('/videos/:video', function (req, res, next) {
        var user = req.user;
        var video = req.params.video;
        if (req.xhr === true) {

            Artigos.find({ slug: video }, function (err, docs) {
                var title = decodeURIComponent(docs[0].title),
                    body = decodeURIComponent(docs[0].text);
                Users.find({ _id: docs[0].authors.main }, function (err, author) {
                    res.render('artigoAjax', { tipo: 'video', article: docs[0], title: title, body: body, author: author[0] });
                });
            });

        } else {
            if (!user) {
                Artigos.find({ slug: video }, function (err, docs) {
                    var title = decodeURIComponent(docs[0].title),
                        body = decodeURIComponent(docs[0].text);
                    Users.find({ _id: docs[0].authors.main }, function (err, author) {
                        res.render('artigo', { tipo: 'video', article: docs[0], title: title, body: body, author: author[0] });
                    });
                });
            } else {
                sessionReload(req, res, next);
                Artigos.find({ slug: video }, function (err, docs) {
                    var title = decodeURIComponent(docs[0].title),
                        body = decodeURIComponent(docs[0].text);
                    Users.find({ _id: docs[0].authors.main }, function (err, author) {
                        res.render('artigo', { tipo: 'video', article: docs[0], title: title, body: body, user: user, author: author[0] });
                    });
                });
            }
        }
    });


    // PÁGINA DE CRIAÇÃO DE NOVOS ARTIGOS
    app.get('/criar/:tipo', function (req, res, next) {
        var user = req.user;
        var tipo = req.params.tipo;

        if (!user) {
            res.redirect('/parceiros')
        } else if (user.status == 'admin' || user.status == 'parceiro') {
            sessionReload(req, res, next);
            res.render('create', { user: user, title: "Gueime - Hora de criar um artigo sensacional!", tipo: tipo });
        } else {
            sessionReload(req, res, next);
            res.redirect('/parceiros');
        }

    });


    // AJAX DA PÁGINA DO ARTIGO PARA BUSCAR ALGO NOVO
    app.get('/busca', function (req, res) {
        res.render('busca');

    });


    // UPLOAD DE NOVA COVER NA CRIAÇÃO DE ARTIGOS
    app.post('/newCover', function (req, res, next) {
        var user = req.user;

        if (user.status == 'admin' || user.status == 'parceiro') {
            // get the temporary location of the file
            var tmp_path = req.files.file.path;
            // set where the file should actually exists - in this case it is in the "images" directory
            var target_path = './public/uploads/' + req.files.file.name;
            // move the file from the temporary location to the intended location
            fs.rename(tmp_path, target_path, function (err) {
                if (err) throw err;
                // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
                fs.unlink(tmp_path, function () {
                    if (err) throw err;
                    res.send('/uploads/' + req.files.file.name);
                });
            });
        } else {
            res.redirect('/parceiros');
        }


    });


    // UPLOAD DE IMAGENS DURANTE A CRIAÇÃO DE ARTIGOS
    app.post('/artigoImage', function (req, res, next) {
        var user = req.user;
        if (user.status == 'admin' || user.status == 'parceiro') {
            // get the temporary location of the file
            var tmp_path = req.files.file.path;
            // set where the file should actually exists - in this case it is in the "images" directory
            var target_path = './public/uploads/' + req.files.file.name;
            // move the file from the temporary location to the intended location
            fs.rename(tmp_path, target_path, function (err) {
                if (err) throw err;
                // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
                fs.unlink(tmp_path, function () {
                    if (err) throw err;
                    res.send({ "filelink": '/uploads/' + req.files.file.name });
                });
            });
        }

    });





    // SALVAR NOVO ARTIGO
    app.post('/novoArtigo', function (req, res) {
        var user = req.user;


        if (user.status == 'admin' || user.status == 'parceiro') {
            if (user.creating == false) {
                Users.update({ 'name.loginName': user.name.loginName }, { $set: { creating: true} }, function (err) {
                    if (err)
                        throw err
                    new Artigos({
                        'authors.main': user._id,
                        text: req.body.content,
                        creating: true,
                        'authors.name': user.name.first + ' ' + user.name.last
                    }).save(function (err, docs) {
                        if (err)
                            throw err
                        res.send(JSON.stringify(req.body));
                    });
                });
            } else {
                Artigos.update({ $and: [{ creating: true }, { 'authors.main': user._id}] }, { $set: { text: req.body.content} }, function (err) {
                    if (err)
                        throw err
                    res.send(JSON.stringify(req.body));
                });
            }
        } else {
            res.redirect('/parceiros');
        }
    });

    // SALVAR NOVO TITULO
    app.post('/novoTitulo', function (req, res) {
        var user = req.user;

        if (user.status == 'admin' || user.status == 'parceiro') {
            if (user.creating == false) {
                Users.update({ 'name.loginName': user.name.loginName }, { $set: { creating: true} }, function (err) {
                    if (err)
                        throw err
                    new Artigos({
                        'authors.main': user._id,
                        title: decodeURIComponent(req.body.content).replace('<p>', '').replace('</p>', ''),
                        creating: true,
                        'authors.name': user.name.first + ' ' + user.name.last
                    }).save(function (err, docs) {
                        if (err)
                            throw err
                        res.send(JSON.stringify(req.body));
                    });
                });
            } else {
                Artigos.update({ $and: [{ creating: true }, { 'authors.main': user._id}] }, { $set: { title: decodeURIComponent(req.body.content).replace('<p>', '').replace('</p>', '')} }, function (err) {
                    if (err)
                        throw err
                    res.send(JSON.stringify(req.body));
                });
            }
        } else {
            res.redirect('/parceiros');
        }
    });

    // GRAPH NOVO ARTIGO
    app.post('/graph', function (req, res) {
        var user = req.user;
        var b = req.body;

        if (user.status == 'admin' || user.status == 'parceiro') {
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

            var facet = [];

            if (games != undefined) { games = func.string_to_slug(b.jogo); if (games.indexOf('-') > -1) { games = games.split(/[\s,-]+/); facet = facet.concat(games); } else { facet.push(games.split(' ')) } }

            if (tags != undefined) { tags = func.string_to_slug(b.tags); if (tags.indexOf('-') > -1) { tags = tags.split(/[\s,-]+/); facet = facet.concat(tags); } else { facet.push(tags.split(' ')) } }

            if (consoles != undefined) { consoles = func.string_to_slug(b.consoles); if (consoles.indexOf('-') > -1) { consoles = consoles.split(/[\s,-]+/); facet = facet.concat(consoles); } else { facet.push(consoles.split(' ')) } }

            if (publicadoras != undefined) { publicadoras = func.string_to_slug(b.publicadoras); if (publicadoras.indexOf('-') > -1) { publicadoras = publicadoras.split(/[\s,-]+/); facet = facet.concat(publicadoras); } else { facet.push(publicadoras.split(' ')) } }

            if (desenvolvedores != undefined) { desenvolvedores = func.string_to_slug(b.desenvolvedores); if (desenvolvedores.indexOf('-') > -1) { desenvolvedores = desenvolvedores.split(/[\s,-]+/); facet = facet.concat(desenvolvedores); } else { facet.push(desenvolvedores.split(' ')) } }

            if (generos != undefined) { if (generos.indexOf('-') > -1) { generos = generos.split(/[\s,-]+/); facet = facet.concat(generos); } else { facet.push(generos.split(' ')) } }

            if (categoriaArtigo != undefined) { categoriaArtigo = func.string_to_slug(b.categoriaArtigo); if (categoriaArtigo.indexOf('-') > -1) { categoriaArtigo = categoriaArtigo.split(/[\s,]+/); facet = facet.concat(categoriaArtigo); } else { facet.push(categoriaArtigo.split(' ')) } }

            if (analiseBom != undefined) { if (analiseBom.indexOf(',') > -1) { analiseBom = analiseBom.split(','); } }
            if (analiseRuim != undefined) { if (analiseRuim.indexOf(',') > -1) { analiseRuim = analiseRuim.split(','); } }
            console.log(facet);
            facet.push(b.serieArtigo, b.tipoVideo, b.canalVideo);
            facet = func.cleanArray(facet);
            console.log(facet);



            if (b.tipo == 'noticia') {
                Artigos.update({ $and: [{ creating: true }, { 'authors.main': user._id}] }, { $set: {

                    type: b.tipo,
                    description: b.descricao,
                    creating: false,
                    'cover.image': b.coverUrl,
                    'cover.position': b.position,
                    tags: b.tags,
                    'graph.games': b.jogo,
                    'graph.consoles': b.consoles,
                    'graph.genres': b.generos,
                    'graph.developers': b.desenvolvedores,
                    'graph.publishers': b.publicadoras,
                    'news.story': b.continuacaoHistoria,
                    slug: slug

                }, $addToSet: {
                    facet: { $each: facet }
                }
                }, function (err) {
                    if (err)
                        throw err
                    Users.update({ 'name.loginName': user.name.loginName }, { $set: { creating: false} }, function (err) {
                        if (err)
                            throw err
                        res.redirect('/' + b.tipo + 's/' + slug);
                    });

                });
            } else if (b.tipo == 'artigo') {
                Artigos.update({ $and: [{ creating: true }, { 'authors.main': user._id}] }, { $set: {

                    type: b.tipo,
                    description: b.descricao,
                    creating: false,
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
                    slug: slug

                }, $addToSet: {
                    facet: { $each: facet }
                }
                }, function (err) {
                    if (err)
                        throw err
                    Users.update({ 'name.loginName': user.name.loginName }, { $set: { creating: false} }, function (err) {
                        if (err)
                            throw err
                        res.redirect('/' + b.tipo + 's/' + slug);
                    });
                });
            } else if (b.tipo == 'analise') {
                Artigos.update({ $and: [{ creating: true }, { 'authors.main': user._id}] }, { $set: {

                    type: b.tipo,
                    description: b.descricao,
                    creating: false,
                    'cover.image': b.coverUrl,
                    'cover.position': b.position,
                    tags: b.tags,
                    'graph.games': b.jogo,
                    'review.score': b.nota,
                    'review.good': analiseBom,
                    'review.bad': analiseRuim,
                    'review.punchLine': b.analiseEfeito,
                    slug: slug


                }, $addToSet: {
                    facet: { $each: facet }
                }
                }, function (err) {
                    if (err)
                        throw err
                    Users.update({ 'name.loginName': user.name.loginName }, { $set: { creating: false} }, function (err) {
                        if (err)
                            throw err
                        res.redirect('/' + b.tipo + 's/' + slug);
                    });
                });
            } else {
                Artigos.update({ $and: [{ creating: true }, { 'authors.main': user._id}] }, { $set: {

                    type: b.tipo,
                    description: b.descricao,
                    creating: false,
                    'cover.image': b.coverUrl,
                    'cover.position': b.position,
                    tags: b.tags,
                    'graph.games': b.jogo,
                    'graph.consoles': b.consoles,
                    'graph.genres': b.generos,
                    'graph.developers': b.desenvolvedores,
                    'graph.publishers': b.publicadoras,
                    'video.type': b.tipoVideo,
                    'video.canal': b.canalVideo,
                    'video.url': b.urlVideo,
                    slug: slug

                }, $addToSet: {
                    facet: { $each: facet }
                }
                }, function (err) {
                    if (err)
                        throw err
                    Users.update({ 'name.loginName': user.name.loginName }, { $set: { creating: false} }, function (err) {
                        if (err)
                            throw err
                        res.redirect('/' + b.tipo + 's/' + slug);
                    });
                });
            }
        } else {
            res.redirect('/parceiros');
        }


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
		    successRedirect: '/',
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
            successRedirect: '/',
            failureRedirect: '/'
        })
    );


    // =============================================================================
    // AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
    // =============================================================================

    // locally --------------------------------
    app.get('/profile/edit', isLoggedIn, function (req, res) {
        var user = req.user;
        res.render('profile/edit', { message: req.flash('loginMessage'), user: user });
    });
    app.post('/profile/edit', passport.authenticate('local-signup', {
        successRedirect: '/', // redirect to the secure profile section
        failureRedirect: '/profile/edit', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/connect/facebook', passport.authorize('facebook', { scope: ['email', 'user_about_me',
    'user_birthday ', 'user_hometown', 'user_website']
    }));

    // handle the callback after facebook has authorized the user
    app.get('/connect/facebook/callback',
			passport.authorize('facebook', {
			    successRedirect: '/',
			    failureRedirect: '/'
			})
        );

    // twitter --------------------------------

    // send to twitter to do the authentication
    app.get('/connect/twitter', passport.authorize('twitter', { scope: 'email' }));

    // handle the callback after twitter has authorized the user
    app.get('/connect/twitter/callback',
			passport.authorize('twitter', {
			    successRedirect: '/',
			    failureRedirect: '/'
			})
        );


    // google ---------------------------------

    // send to google to do the authentication
    app.get('/connect/google', passport.authorize('google', { scope: ['profile', 'email', 'openid'] }));

    // the callback after google has authorized the user
    app.get('/connect/google/callback',
		passport.authorize('google', {
		    successRedirect: '/',
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