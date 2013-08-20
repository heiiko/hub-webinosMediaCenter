try{
	var walk = require('walk');
}catch(e){
	console.log("First, please run: npm install walk");
	process.exit();
}
var files = [];
var fs = require('fs');

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};


// Walker options
var walker  = walk.walk('.', { followLinks: false });

walker.on('file', function(root, stat, next) {
    // Add this file to the list of files
    files.push(root + '/' + stat.name);
    next();
});

walker.on('end', function() {
	files =files.filter(function(el){return el.toLowerCase().endsWith(".svg") ||  el.toLowerCase().endsWith(".png") ||  el.toLowerCase().endsWith(".jpg") });
	var html = "<html><head></head><body style='background-color:#000; color:#fff'>";
	html += "<h2>"+files.length+" Images.</h2>";
	files = files.map(function(el){return el+"<br/><img src='"+el+"' style='border:1px solid red;'/><hr/>"})
	html += files.join("")+"</body>";
	fs.writeFile("createdImageList.html", html, function(err) {
	    if(err) {
	        console.log(err);
	    } else {
	        console.log("The file was saved!");
	    }
	});
});