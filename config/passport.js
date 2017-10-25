var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;
var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;

var User       = require('../app/models/user');

var configAuth = require('./auth'); 

module.exports = function(passport) {

      passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use('local-login', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true 
    },
    function(req, email, password, done) {
        if (email)
            email = email.toLowerCase(); 

        process.nextTick(function() {
            User.findOne({ 'local.email' :  email }, function(err, user) {
                if (err)
                    return done(err);

                if (!user)
                    return done(null, false, req.flash('loginMessage', 'Datos incorrectos'));

                if (!user.validPassword(password))
                    return done(null, false, req.flash('loginMessage', 'Datos incorrectos'));

                else{
                    console.log(user);
                    return done(null, user);
                }
            });
        });

    }));

    passport.use('local-signup', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true 
    },
    function(req, email, password, done) {
        if (email)
            email = email.toLowerCase(); 
        process.nextTick(function() {
            if (!req.user) {
                User.findOne({ 'local.email' :  email }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'Coloque otra información porfavor'));
                    } else {

                            if (password.length < 10 || password.length > 120)
                                return done(null, false, req.flash('signupMessage', 'Contraseña muy corta, mínimo 10.'));
                            var countMAY = false;
                            var countMIN = false;
                            var countCHA = false;
                            var countNUM = false;
                            for (i = 0; i < password.length; i++) {
                                console.log(password.charCodeAt(i));

                                if (password.charCodeAt(i) >= 33 && password.charCodeAt(i) <= 47) {
                                    countCHA = true;
                                    continue;
                                }
                                if (password.charCodeAt(i) >= 48 && password.charCodeAt(i) <= 57) {
                                    countNUM = true;
                                    continue;
                                }
                                if (password.charCodeAt(i) >= 65 && password.charCodeAt(i) <= 90) {
                                    countMAY = true;
                                    continue;
                                }
                                if (password.charCodeAt(i) >= 97 && password.charCodeAt(i) <= 122) {
                                    countMIN = true;
                                    continue;
                                }

                            }
                            if (countMIN, countNUM, countMAY == true) {
                        var newUser            = new User();
                        newUser.local.email    = email;
                        newUser.local.password = newUser.generateHash(password);

                        newUser.save(function(err) {
                            if (err)
                                return done(err);

                            return done(null, newUser);
                        });
                    }
                     else {
                                console.log(countMIN, countNUM, countMAY);
                                return done(null, false, req.flash('signupMessage', 'Mejora tu contraseña, usando letras, numeros y mayusculas.'));
                            }
                    }

                });
            } else if ( !req.user.local.email ) {
                User.findOne({ 'local.email' :  email }, function(err, user) {
                    if (err)
                        return done(err);
                    
                    if (user) {
                        return done(null, false, req.flash('loginMessage', 'Ponga la información correcta.'));
                    } else {
                        var user = req.user;
                        user.local.email = email;
                        user.local.password = user.generateHash(password);
                        user.save(function (err) {
                            if (err)
                                return done(err);
                            
                            return done(null,user);
                        });
                    }
                });
            } else {
                return done(null, req.user);
            }

        });

    }));





    passport.use('local-pswchange', new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true 
        },
        function (req, email, password, done) {
            if (email)
                email = email.toLowerCase(); 

            process.nextTick(function () {
                User.findOne({'local.email': email}, function (err, user) {
                    if (err)
                        return done(err);

                    if (!user)
                        return done(null, false, req.flash('loginMessage', 'información incorrecta.'));
                    else {
                        user.local.password = user.generateHash(password);

                        user.save(function (err) {
                            if (err)
                                return done(err);

                            return done(null, user);
                        });
                    }


                });
            });

        }));


    var fbStrategy = configAuth.facebookAuth;
    fbStrategy.passReqToCallback = true;  
    passport.use(new FacebookStrategy({
            clientID: '832282320285641',
            clientSecret: 'f59ee167764aa4ef2ed14bde1f5ec3b9',
            callbackURL: 'http://localhost:8080/auth/facebook/callback',
            profileURL: 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email',
            profileFields: ['id, name, email,gender,birthday,location']
    },
    function(req, token, refreshToken, profile, done) {

        process.nextTick(function() {

            if (!req.user) {

                User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    console.log(profile);
                    if (user) {

                        if (!user.facebook.token) {
                            user.facebook.token = token;
                            user.facebook.name  = profile.displayName;
                            user.facebook.email = (profile.emails[0].value || '').toLowerCase();

                            user.save(function(err) {
                                if (err)
                                    return done(err);
                                    
                                return done(null, user);
                            });
                        }

                        return done(null, user); 
                    } else {
                        var newUser            = new User();

                        newUser.facebook.id    = profile.id;
                        newUser.facebook.token = token;
                        newUser.facebook.name  = profile.displayName;
                        newUser.facebook.email = (profile.emails[0].value || '').toLowerCase();

                        newUser.save(function(err) {
                            if (err)
                                return done(err);
                                
                            return done(null, newUser);
                        });
                    }
                });

            } else {
                var user            = req.user;
                user.facebook.id    = profile.id;
                user.facebook.token = token;
                user.facebook.name  = profile.displayName;
                user.facebook.email = (profile.emails[0].value || '').toLowerCase();

                user.save(function(err) {
                    if (err)
                        return done(err);
                        
                    return done(null, user);
                });

            }
        });

    }));

   
    passport.use(new GoogleStrategy({

        clientID        : '694374735549-telf0cjtdbqtf3gn3atb6utofv6mh251.apps.googleusercontent.com',
        clientSecret    : 'uNlTNdrSW2pO9Wfsj5s3Tvs9',
        callbackURL     : 'http://localhost:8080/auth/google/callback',
        passReqToCallback : true 

    },
    function(req, token, refreshToken, profile, done) {

        process.nextTick(function() {

            if (!req.user) {

                User.findOne({ 'google.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {

                        if (!user.google.token) {
                            user.google.token = token;
                            user.google.name  = profile.displayName;
                            user.google.email = (profile.emails[0].value || '').toLowerCase(); 

                            user.save(function(err) {
                                if (err)
                                    return done(err);
                                    
                                return done(null, user);
                            });
                        }

                        return done(null, user);
                    } else {
                        var newUser          = new User();

                        newUser.google.id    = profile.id;
                        newUser.google.token = token;
                        newUser.google.name  = profile.displayName;
                        newUser.google.email = (profile.emails[0].value || '').toLowerCase(); 

                        newUser.save(function(err) {
                            if (err)
                                return done(err);
                                
                            return done(null, newUser);
                        });
                    }
                });

            } else {
                var user               = req.user; 

                user.google.id    = profile.id;
                user.google.token = token;
                user.google.name  = profile.displayName;
                user.google.email = (profile.emails[0].value || '').toLowerCase(); 

                user.save(function(err) {
                    if (err)
                        return done(err);
                        
                    return done(null, user);
                });

            }

        });

    }));

};
