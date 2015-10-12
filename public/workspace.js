$(function() {
	isDown = false;
	drawing = false;
	$( window ).resize(function() {
		$("canvas").each(function() {
			resizeCanvas($(this));
		});
		var height = window.innerHeight*2/3.0
        var width = height*16/9.0
        $("#player").width(width);
        $("#player").height(height);
	});
	function resizeCanvas(canvas) {
		var parent = canvas.parent();
		canvas[0].width = parent.width();
		canvas[0].height = parent.height();
	}
	$("canvas").each(function() {
		resizeCanvas($(this));
		ctx = $(this)[0].getContext("2d");
		$(this).mousedown(function(e) {
			if(!drawing) {
				isDown = true;
				mousePos = getMousePos($(this)[0], e);
				ctx.beginPath();
				ctx.moveTo(mousePos.x, mousePos.y);
				pos = {
					x: mousePos.x,
					y: mousePos.y,
					id: "sketchpad"
				}
				socket.emit("start", pos);
			}
		});
		$(this).mousemove(function(e) {
			if(isDown) {
				mousePos = getMousePos($(this)[0], e);
				ctx.lineTo(mousePos.x, mousePos.y);
				ctx.lineWidth = 5;
				ctx.lineCap = "round"
				ctx.stroke();
				ctx.moveTo(mousePos.x, mousePos.y);
				pos = {
					x: mousePos.x,
					y: mousePos.y,
					id: "sketchpad"
				}
				socket.emit("draw", pos);
			}
		});
		$(this).mouseup(function(e) {
			isDown = false;
			ctx.closePath();
			pos = {
				x: 0,
				y: 0,
				id: "sketchpad"
			}
			socket.emit("end", pos);
		});
	});
	function getMousePos(canvas, evt) {
	    var rect = canvas.getBoundingClientRect();
	    return {
	        x: evt.clientX - rect.left,
	        y: evt.clientY - rect.top
	    };
	}
	$("#clearSk").click(function() {
        canvas = $("#sketchpad")[0];
        ctx = canvas.getContext("2d");
        ctx.clearRect(0,0,5000, 5000);
    });
    socket.on('draw', function(pos) {
    	drawing = true;
        x = pos.x;
        y = pos.y;
        canvas = $("#"+pos.id)[0];
        ctx = canvas.getContext("2d");
        ctx.lineTo(x, y);
		ctx.lineWidth = 5;
		ctx.lineCap = "round"
		ctx.stroke();
		ctx.moveTo(x, y);
    });
    socket.on('start', function(pos) {
    	drawing = true;
        x = pos.x;
        y = pos.y;
        canvas = $("#"+pos.id)[0];
        ctx = canvas.getContext("2d");
        ctx.beginPath();
	    ctx.moveTo(x, y);
    });
    socket.on('end', function(pos) {
    	drawing = false;
        ctx.closePath();
    });
});