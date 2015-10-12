var express = require('express');
var app = express();
var fs = require('fs');
var functions = require('./functions');

//Front-end
var Handlebars = require('handlebars');

//Database
var mongoose = require('mongoose');
mongoose.connect('mongodb://'+process.env.IP+'/yed');
var db = require('./database');
db(mongoose, function(user, post, video, workspace) {
    var User = user;
    var Post = post;
    var Video = video;
    var Workspace = workspace;
    
    //Authentication
    var auth = require('./authentication');
    auth(app, User);
    
    var studygroup = require('./studygroup');
    
    var http = require('http').Server(app);
    var chat = require('./chat')(http);
     studygroup(app, Handlebars, User, Workspace, http);
    //Functions
    var VideoTemplate;
    functions.updateTemplates(function(temp, temp2) {
        VideoTemplate = temp;
        
    });
    var ensureAuthenticated = functions.ensureAuthenticated;
    var forEachNext = functions.forEachNext;
    
    function saveUser(user){
           user.save(function(err) {
            if(err) {
                return console.log(err);
            }
            else{
                console.log("user added or changed")
            }
        })
    }
    
    function savePost(post){
        post.save(function(err) {
            if(err) {
                return console.log(err);
            }
            else{
                 User.findById(post.creator.userId, function(err, user) {
                    if(err) {
                       console.log("savepost Error!");
                    } 
                    else {
                        if(!user){
                            console.log("User not found!");
                        }
                        else{
                            user.posts.push(post.id);
                            saveUser(user);
                        }
                    }
                });
                console.log("post added or changed");
            }
        });
    }
    
    function dummyVideo(callback) {
        var u1 = new User({
            google: {
                userId: "0512",
                accessToken: "",
            },
            reputation: 5,
            username: "Dorian",
            eduEmail: "dc@berkeley.edu",
            posts: [],
            workspaces: []
        })
        saveUser(u1);
        
        var u2 = new User({
            google: {
                userId: "1233",
                accessToken: "",
                refreshToken: ""
            },
            reputation: 10,
            username: "Mike",
            eduEmail: "",
            posts: [],
            workspaces: []
        })
        saveUser(u2);
    
        var p1 =  new Post({
                superPost: "",
        	    creator: {
        	        userId: u1.id,
        	        name: u1.username
        	    },
        	    subposts: [],
        	    content: "A function takes an input and returns an output.",
        	    time: "14:56 on 09/13/13",
        	    voted: [{userId: u1.id, dir:-1}, {userId: u2.id, dir: -1}]
            })
        savePost(p1);
        console.log(p1.id)
        var p2 =  new Post({
            superPost: "",
    	    creator: {
    	        userId: u2.id,
    	        name: u2.username
    	    },
    	    subposts: [p1.id],
    	    content: "Hi, could someone explain what a function is?",
    	    time: "04:56 on 09/21/13",
    	    voted: [{userId: u1.id, dir: 1}]
        })
        savePost(p2);
        var p3 = new Post({
            superPost: "",
            creator: {
                userId: u1.id,
                name: u1.username
            },
            subposts: [],
            content: "How do I get to office hours?",
            time: "dinner",
            voted: []
        })
        savePost(p3)
        var v2 = new Video({
            adder: {
                userId: u2.id,
                name: u2.username
            },
            reputation: "10",
            title: "Best Plays",
            URL: "tpPwWeNg-mg",
            posts: [p1.id],
            time: "to sleep",
            voted: []
        })
        v2.save(function(err) {
            if (err) {
                return console.log(err);
            }
            else {
                console.log("video added")
            }
            chat(v2.URL);
        });
        var video = new Video({
            adder: {
                userId: u1.id,
                name: u1.username
            },
            reputation: "10",
            title: "CS Lecture 1",
            URL: "RL8l78CO4rQ",
            posts: [p2.id, p3.id],
            time: "21:15 on 10/10/15",
            voted: [{userId: u1.id, dir: -1}]
        })
        video.save(function(err) {
                if(err) {
                   return console.log(err);
                }
                else {
                   console.log("video added")
                    console.log("Dummy:" + video.id);
                    chat(video.URL);
                    callback(video.id);
                }
            }
        );
    }
    
    function postScore(pId, callback) {
        Post.findById(pId, function(err, post) {
            if(err) {
               console.log("Error!");
            } 
            else {
                if(!post){
                    console.log("Can't find user for nonexistent post!");
                }
                else{
                    var score = (post.subposts).length/2
                    User.findById(post.creator.userId, function(err, poster){
                        if(err) {
                            console.log("Error!");
                        }
                        else {
                            if(!poster){
                                console.log("Poster not found!")
                            }
                            else {
                                score += poster.reputation/5
                            }
                        }
                    })
                    forEachNext(post.voted, 0, function getVote(vote, ind, next){
                        User.findById(vote.userId, function(err, user) {
                            if(err) {
                                console.log("finding ID Error!");
                             } 
                            else {
                                if(!user){
                                    console.log("User not found!");
                                }
                                else{
                                    //score += user.reputation * vote.dir;
                                    score += vote.dir;
                                }
                                next();
                            }
                        });   
                    }, function useScore(){
                        callback(parseInt(score, 10))
                    });
                }
            }
         });
    }
    
    app.get('/video', function(req, res) {
        var vID = req.query.vid;
        if(!vID) {
            /*dummyVideo(function(id) {
                Video.findById(id, function(err, video) {
                    if(err) {
                        res.send("Error!");
                        return console.log(err);
                    }
                    else {
                        console.log("here");
                        if(!video) {
                            res.send("Video not found!");
                        }
                        else {
                            getData(video)
                        }
                    }
                });  
            });*/
            res.redirect("/video?vid=RL8l78CO4rQ");
        }
        else {
            Video.findOne({URL:vID}, function(err, video) {
                if(err) {
                    res.send("Error!");
                    return console.log(err);
                }
                else {
                    if(!video) {
                        console.log(vID)
                        res.send("Video not found in database!");
                    }
                    else {
                        getData(video)
                    }
                }
            });
        }
        function getData(vid) {
            vid.markModified("posts");
            var obj = {
                reputation: vid.reputation,
                title: vid.title,
                youtubeURL: vid.URL,
                adder: vid.adder.name,
                time: vid.time,
                youtubeid: vid.id,
                posts: [],
                logged: 0,
                notlogged: 1
            }
            if(req.user) {
                obj.logged = 1;
                obj.notlogged = 0
            }
            var unsorted = []
            forEachNext(vid.posts, 0, function getPost(post, ind, next){
                Post.findById(post, function(err, post) {
                    if(err) {
                        res.send("Error!");
                        return console.log(err);
                    } 
                    else {
                        if(!post){
                            res.send("Post not found!");
                        }
                        else{
                            postScore(post.id, function assignScore(score){
                                var p = {
                                    creator: post.creator.name,
                                    score: 0,
                                    time: post.time,
                                    content: post.content,
                                    subposts: [],
                                    id: post.id
                                }
                                p.score = score
                                var subUnsorted = []
                                forEachNext(post.subposts, 0, function getSubPost(subpost, ind, next2){
                                    Post.findById(post.subposts[ind], function(err, subpost) {
                                        if(err){
                                            res.send("Error!");
                                            return console.log(err);
                                        } 
                                        else {
                                            if(!subpost){
                                                res.send("Subpost not found!")
                                            }
                                            else{
                                                postScore(subpost.id, function subAssignScore(score){
                                                    var sp = {
                                                        creator: subpost.creator.name,
                                                        score: 0,
                                                        time: subpost.time,
                                                        content: subpost.content,
                                                        replyTo: post.creator.name,
                                                        subpost: [],
                                                        id: subpost.id
                                                    }
                                                    sp.score = score;
                                                    subUnsorted.push(sp);
                                                    next2();
                                                })
                                            }
                                        }
                                    });
                                }, function(){
                                         p.subposts = subUnsorted.sort(function sorter(a,b){
                                            return parseFloat(b.score) - parseFloat(a.score); 
                                         });
                                         unsorted.push(p);
                                         next();
                                         console.log("done");
                                    });
                                });
                            }
                        }
                    });
            }, function(){
                obj.posts = unsorted.sort(function sorter(a,b){
                    return parseFloat(b.score) - parseFloat(a.score);
                });
                console.log("done");
                /*if(!chatRooms.indexOf(obj.youtubeURL)) {
                   chatRooms.push(obj.youtubeURL);
                   chat(obj.youtubeURL);
                }*/
                res.send(VideoTemplate(obj))
            })
        }
    });
    var chatRooms = [];
    app.post('/confirmEdu', ensureAuthenticated, function(req, res) {
        /*var user = req.user;
        */
    });
    
    app.post('/makePost', ensureAuthenticated, function(req, res){
       console.log("got here")
       var text = req.body.text;
       console.log("and here")
       var videoId = req.body.vid;
       var user = req.user;
       var newPost = new Post({
           superPost: "",
           creator: {
               userId: user.id,
               name: user.username
           },
           subposts: [],
           content: text,
           time: Date(),
           voted: []
       });
       newPost.save(function(err) {
            if(err) {
                return console.log(err);
            }
            else{
                user.posts.push(newPost.id);
                user.markModified("posts")
                console.log("post added or changed");
                user.save(function(err) {
                    if(err) {
                        return console.log(err);
                    }
                    else{
                        Video.findById(videoId, function(err, video) {
                            if(err){
                                res.send("Error!");
                                return console.log(err);
                            } 
                            else {
                                if(!video){
                                    res.send("Subpost not found!")
                                }
                                else{
                                    video.posts.push(newPost.id);
                                    video.markModified("posts");
                                    video.save(function(err) {
                                        if (err){
                                            return console.log(err);
                                        }
                                        else {
                                            console.log("video changed");
                                            res.send("reloadpls");
                                        }
                                    });
                                }
                            }
                        }); 
                    }
                });
            }
        });
    });
    
    app.post('/makeComment', ensureAuthenticated, function(req, res){
        var text = req.body.text;
        var superId = req.body.superPostID;
        var user = req.user;
        Post.findById(superId, function(err, superP) {
            if(err) {
               console.log("Error!");
            } 
            else {
                if(!superP){
                    console.log("Can't find superpost!");
                }
                else{
                    console.log("Printing super id")
                    console.log(superP.id)
                    var newPost =  new Post({
                        superPost: superP.id,
                	    creator: {
                	        userId: user.id,
                	        name: user.username
                	    },
                	    subposts: [],
                	    content: text,
                	    time: Date(),
                	    voted: []
                    });
                    newPost.save(function(err) {
                        if(err) {
                            return console.log(err);
                        }
                        else{
                            user.posts.push(newPost.id);
                            user.markModified("posts")
                            console.log("post added or changed");
                            user.save(function(err) {
                                if(err) {
                                    return console.log(err);
                                }
                                else{
                                    superP.subposts.push(newPost.id);
                                    superP.markModified("subposts");
                                    superP.save(function(err) {
                                        if (err){
                                            return console.log(err);
                                        }
                                        else {
                                            console.log("superpost changed");
                                            res.send("reloadpls");
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }
        });
    });
    
    app.post('/votePost', ensureAuthenticated, function(req, res) {
       var user = req.user;
       var amount = 1;
       if(user.eduEmail) {
           amount = 2;
       }
       var postId = req.body.postId;
       var dir = req.body.dir;
       console.log(postId);
       Post.findById(postId, function(err, post) {
           if(err) {
               res.send("Error!");
               return console.log(err);
           }
           if(!post) {
               res.send("No note found.");
               return console.log("nope vote");
           }
           var vote = post.voted.filter(function(obj) {
               return obj.userId==user.id
           })[0];
           if(vote&&vote.dir==dir) {
               res.send("")
               return console.log("nope");
           }
           else if(vote) {
               vote.dir = dir;
           }
           else {
                post.voted.push({userId:user.id,dir:dir})
           }
           post.markModified("votes");
           post.save(function(err) {
                User.findById(post.creator.userId, function(err, creator) {
                   if(err) {
                       res.send("Error!");
                       return console.log(err);
                   }
                   console.log("2");
                   if(dir>0) {
                       creator.reputation += amount;
                   }
                   else {
                       creator.reputation -= amount;
                   }
                   postScore(post.id, function(score) {
                      res.send(score+""); 
                      creator.save();
                   });
                }) 
           });
       })
    });
    
    app.post('/createVideo', ensureAuthenticated, function(req, res) {
        var user = req.user;
        if(!user.eduEmail&&user.reputation<50) {
            res.send("Not authenticated to add videos! Get an edu email address, or get more reputation!");
            return;
        }
        Video.findOne({URL:req.body.videoURL}, function(err, video) {
            var video = new Video({
                adder: user.id,
                reputation: 10,
                title: req.body.title,
                URL: req.body.videoURL,
                posts: [],
                time: date()
            });
            video.save(function(err) {
                if(err) {
                   res.send("Error!");
                   return console.log(err);
                }
                else {
                   res.send("Added!")
                }
            }); 
        });
    });
    
    app.post('/createPost', ensureAuthenticated, function(req, res) {
        var user = req.user;
        var parentPost = req.body.parentPost;
        var content = req.body.content;
        Post.findById(parentPost, function(err, parent) {
            if(err) {
                res.send("Error!");
                return console.log(err);
            }
            if(!parent) {
                res.send("No note found!");
                return console.log("nope");
            }
            var post = new Post({
                superPost: parentPost,
                creator: user.id,
                upvotes: 0,
                downvotes: 0,
                subposts: [],
                content: content,
                time: date()
            });
            post.save(function(err) {
                if(err) {
                    res.send("Error!");
                    return console.log(err);
                }
                else {
                    user.posts.push(post.id);
                    user.markModified("posts");
                    user.save(function(err) {
                        if(err) {
                            res.send("Error!");
                            return console.log(err);
                        }
                        else {
                            parent.subposts.push(post.id);
                            parent.markModified("subposts")
                            parent.save(function(err) {
                                if(err) {
                                    res.send("Error!");
                                    return console.log(err);
                                }
                                else {
                                    res.send("Saved post");
                                }
                            });
                        }
                    })   
                }
            });
        });
    });
    var changenameHtml = "";
    fs.readFile("static/username.html", function(err, html){
        changenameHtml = html + ""
    })
    app.get('/updateAccount', ensureAuthenticated, function(req, res) {
        res.send(changenameHtml);
    });
    app.post('/updateAccount', ensureAuthenticated, function(req, res) {
        var user = req.user;
        var newusername = req.body.newname;
        user.username = newusername;
        user.save(function(err) {
            if(err) {
                res.send("Error!");
                return console.log(err);
            }
            else {
                res.redirect('/');
            }
        });
    });
    app.get('/testauth', ensureAuthenticated, function(req, res) {
        res.send("You reached a secret place"); 
    });
    var homeHtml = "";
    fs.readFile("static/Home.html", function(err, html) {
        homeHtml = html + "";
    });
    app.get('/', function(req, res) {
        res.send(homeHtml);
    });
    app.use(express.static(__dirname+'/public'));
    
    http.listen(process.env.PORT, function(){
    	console.log('listening on *:3000');
    });
});