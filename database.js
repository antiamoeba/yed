module.exports = function(mongoose, callback) {
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));  
    db.once('open', function () {
    	console.log("opened!");
    	var userSchema = mongoose.Schema({
    		google: {
    			userId: String,
    			accessToken: String,
    			refreshToken: String
    		},
    		reputation: Number,
    		username: String,
    		eduEmail: String, //Edit --> send email verification
    		posts: [String],
    		workspaces: [String]
    	});
    	var workspaceSchema = mongoose.Schema({
    	    creator: String,
    	    users: [{userId:String, name:String}],
    	    video: String,
    	    chat: [{userId:String,name: String, text:String}],
    	    sketchPad: [{x:Number, y:Number, color:String}],
    	    videoPad: [{x:Number, y:Number, color:String}] 
    	});
    	var postSchema = mongoose.Schema({
    	    superPost: String,
    	    creator: {
    	        userId: String,
    	        name: String
    	    },
    	    subposts: [String],
    	    content: String,
    	    time: String,
    	    voted: [{
    	        userId: String, 
    	        dir: Number}]
    	});
    	var videoSchema = mongoose.Schema({
    	    adder:{
    	        userId: String,
    	        name: String
    	    },
    	    reputation: Number,
    	    title: String,
    	    URL: String,
    	    posts: [String],
    	    time: String,
    	    voted: [{
    	        userId: String, 
    	        dir: Number}]
    	});
    	var User = mongoose.model('User', userSchema);
    	var Post = mongoose.model('Post', postSchema);
    	var Video = mongoose.model('Video', videoSchema);
    	var Workspace = mongoose.model('Workspace', workspaceSchema);
    	callback(User, Post, Video, Workspace)
    });
}