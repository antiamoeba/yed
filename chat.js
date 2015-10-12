module.exports = function(http) {
    var io = require('socket.io')(http);
    return function(name) {
        io.on('connection', function(socket){
            console.log('a user connected');
            socket.on('disconnect', function(){
                console.log('user disconnected');
            });
            socket.on('chat message', function(msg){
                console.log(msg);
                io.emit('chat message', msg);
            });
        });
    }
}