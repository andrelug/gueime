var Users = require('./models/user');
var func = require('../config/functions');
var facebook = require('../config/facebook.js');
var ip = require('ip');
var async = require('async');

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
            Users.find({ deleted: false }, function (err, docs) {
                sessionReload(req, res, next);
                res.render('users/index', { users: docs, user: user });
            });
        }
    });

    app.get('/artigos/:artigo', function (req, res) {
        var artigo = req.params.artigo;

        res.render('artigo');
    });
}