var fs = require('fs');
var Handlebars = require('handlebars');
module.exports = {
    updateTemplates: function(callback) {
        fs.readFile('static/index.html', function(err, html) {
            if(err) {
                return console.log("Error! Couldn't read index.html!");
            }
            else {
                VideoTemplate = Handlebars.compile(html+"")
                callback(VideoTemplate);
            }
        });
    },
    ensureAuthenticated: function(req, res, next) {
    	if (req.isAuthenticated()) { return next(); }
    	res.redirect('/auth/google');
    },
    forEachNext: function(arr, index, callback, finalCall) {
    	if(index<arr.length) {
    		function next() {
    			return module.exports.forEachNext(arr, index+1,callback, finalCall);
    		}
    		callback(arr[index], index, next);
    	}
    	else {
    		finalCall();
    	}
    }
}