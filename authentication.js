module.exports = function(app, User) {
    var bodyParser = require('body-parser');
    var cookieParser = require('cookie-parser');
    var session = require('express-session');
    var passport = require('passport');
    var creds = require('./credentials');
    var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(cookieParser());
    app.use(session({secret: "dogfish", resave:false}));
    app.use(passport.initialize());
    app.use(passport.session());
    
    passport.serializeUser(function(user, done) {
    	done(null, user.id);
    });
    
    passport.deserializeUser(function(id, done) {
    	User.findById(id, function(err, user) {
    		done(err, user);
    	})
    });
    
    passport.use(new GoogleStrategy({
    		clientID: creds.google_client_id,
    		clientSecret: creds.google_client_secret,
    		callbackURL: "https://yed-antiamoeba.c9.io/auth/google/callback",
    		passReqToCallback : true
    	},
    	function(req, accessToken, refreshToken, profile, done) {
    		process.nextTick(function() {
    		    if(!req.user) {
    				User.findOne({"google.userId": profile.id}, function(err, user) {
    					if(err) return done(err);
    					if(user) {
    						user.google.accessToken = accessToken;
    						user.google.refreshToken = refreshToken;
    						user.save(function(err) {
    							if (err) return done(err);
    							return done(null,user);
    						});
    					}
    					else {
    						createNewUser(profile.id, accessToken, refreshToken, function(){});
    					}
    				});
    			}
    			else {
    				var user = req.user;
    				if(user.google.userId == profile.id) {
    					user.google.accessToken = accessToken;
    					user.google.refreshToken = refreshToken;
    					user.save(function(err) {
    						if(err) return done(err);
    						return done(null, user);
    					});
    				}
    				else {
    					User.findOne({"google.userId": profile.id}, function(err, wuser) {
    						if(err) return done(err);
    						if(wuser) return done(null, wuser);
    						createNewUser(profile.id, accessToken, refreshToken, function(){});
    					});
    				}
    			}
    		});
    	}
    ));
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }), function(req, res){});
    app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
    	res.redirect('/video');
    });
    function createNewUser(userID, accessT, refreshT, callback) {
        var user = new User({
            google: {
                userId: userID,
                accessToken: accessT,
                refreshToken: refreshT
            },
            username: "anon",
            reputation: 10,
            eduEmail: "",
            posts: []
        });
        user.save(function(err) {
            if (err) {
                return console.log(err);
            }
            else {
                callback() 
            }
        });
    }
}