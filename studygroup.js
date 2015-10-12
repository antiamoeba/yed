var functions = require('./functions');
var ensureAuthenticated = functions.ensureAuthenticated;
var fs = require('fs');
module.exports = function(app, Handlebars, User, Workspace, http) {
    var io = require('socket.io')(http);
    fs.readFile('static/workspace.html', function(err, html) {
        if(err) {
            return console.log("Error! Couldn't read workspace.html!");
        }
        else {
            WorkspaceTemplate = Handlebars.compile(html+"");
        }
    });
    app.get('/createDummyWorkspace', ensureAuthenticated, function(req, res) {
        var user = req.user;
        var workspace = new Workspace({
            creator: user.id,
            users:[{userId:user.id, name:user.username}],
            video: "1gvqjr0xLbQ",
            chat: [],
            sketchPad: [],
            videoPad: []
        });
        workspace.save(function(err) {
           if(err) {
               res.send("Error!");
               return console.log(err);
           } 
           else {
               user.workspaces.push(workspace.id);
               user.markModified("workspaces");
               user.save(function(err) {
                   if(err) {
                       res.send("Error!");
                       return console.log(err);
                   }
                   else {
                       res.send("Created dummy workspace! - " + workspace.id);
                   }
               });
           }
        });
    });
    var WorkspaceTemplate;
    app.get('/workspace/:id', ensureAuthenticated, function(req, res) {
        var workspaceId = req.params.id;
        handleWorkspace(workspaceId, req, res);
    });
    function handleWorkspace(workspaceId, req, res) {
        var user = req.user;
        Workspace.findById(workspaceId, function(err, workspace) {
           if(err) {
               res.send("Error!");
               return console.log(err);
           } 
           else {
               if(!workspace) {
                   res.send("Workspace not found!");
                   return console.log(err);
               }
               else {
                   var tuple = workspace.users.filter(function(obj) {
                      return obj.userId==user.id; 
                   })[0];
                   /*if(!tuple) {
                       res.send("Not authorized!");
                       return console.log("NA");
                   }
                   else {*/
                       res.send(WorkspaceTemplate(workspace));
                   //}
               }
           }
        });
    }
    io.on('connection', function(socket){
        console.log('a user connected');
        socket.on('disconnect', function(){
            console.log('user disconnected');
        });
        socket.on('play', function(time) {
            socket.broadcast.emit('play', time);
        });
        socket.on('pause', function(time) {
            socket.broadcast.emit('pause', time); 
        });
        socket.on('draw', function(pos) {
            socket.broadcast.emit('draw', pos);
        });
        socket.on('start', function(pos) {
            socket.broadcast.emit('start', pos); 
        });
        socket.on('end', function(pos) {
            socket.broadcast.emit('end', pos); 
        });
    });
}