var Users = require('./models/user');
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
            res.render("index", { title: "Gueime - O melhor site de games do Brasil!" });
        } else {

            sessionReload(req, res, next);
            res.render('index', { user: user, title: "Gueime - O melhor site de games do Brasil!" });

        }
    });
    
    // AJAX E FALLBACK PARA NOTICIAS
    app.get('/noticias/:noticia', function (req, res, next) {
        var user = req.user;
        var artigo = req.params.noticia;
        if (req.xhr === true) {
            res.render('articleAjax');
        } else {
            if (!user) {
                res.render("artigo", { title: "Gueime - O melhor site de games do Brasil!", tipo: 'noticia' });
            } else {
                sessionReload(req, res, next);
                res.render('artigo', { user: user, title: "Gueime - O melhor site de games do Brasil!", tipo: 'noticia' });
            }
        }
    });

    // AJAX E FALLBACK PARA ARTIGOS
    app.get('/artigos/:artigo', function (req, res, next) {
        var user = req.user;
        var artigo = req.params.artigo;
        if (req.xhr === true) {
            res.render('articleAjax');
        } else {
            if (!user) {
                res.render("artigo", { title: "Gueime - O melhor site de games do Brasil!", tipo: 'artigo' });
            } else {
                sessionReload(req, res, next);
                res.render('artigo', { user: user, title: "Gueime - O melhor site de games do Brasil!", tipo: 'artigo' });
            }
        }
    });

    // AJAX E FALLBACK PARA ANALISES
    app.get('/analises/:analise', function (req, res, next) {
        var user = req.user;
        var artigo = req.params.analise;
        if (req.xhr === true) {
            res.render('articleAjax');
        } else {
            if (!user) {
                res.render("artigo", { title: "Gueime - O melhor site de games do Brasil!", tipo: 'analise' });
            } else {
                sessionReload(req, res, next);
                res.render('artigo', { user: user, title: "Gueime - O melhor site de games do Brasil!", tipo: 'analise' });
            }
        }
    });


    // PÁGINA DE CRIAÇÃO DE NOVOS ARTIGOS
    app.get('/criar/:tipo', function (req, res, next) {
        var user = req.user;
        var tipo = req.params.tipo;

        if (!user) {
            res.render('/', { title: 'Gueime - O melhor site de games do Brasil!' })
        } else {
            sessionReload(req, res, next);
            res.render('create', { user: user, title: "Gueime - Hora de criar um artigo sensacional!", tipo: tipo });
        }

    });


    // AJAX DA PÁGINA DO ARTIGO PARA BUSCAR ALGO NOVO
    app.get('/busca', function (req, res) {
        res.render('busca');

    });


    // UPLOAD DE NOVA COVER NA CRIAÇÃO DE ARTIGOS
    app.post('/newCover', function (req, res, next) {
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
    });


    // UPLOAD DE IMAGENS DURANTE A CRIAÇÃO DE ARTIGOS
    app.post('/artigoImage', function (req, res, next) {

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
    });

    // SALVAR NOVO ARTIGO
    app.post('/novoArtigo', function (req, res) {

        res.send(JSON.stringify(req.body));

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

    app.get('/artigo', function (req, res) {
        res.render('artigo');
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