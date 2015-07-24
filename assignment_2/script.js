"use strict";

var canvas;
var canvasBounds;
var gl;

window.onload = function init() 
{
	canvas = document.getElementById("gl-canvas");
	canvasBounds = canvas.getBoundingClientRect();
	canvas.addEventListener("mousedown", onMouseDown);

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) 
	{ 
		alert("WebGL isn't available"); 
	}

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0, 0, 0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	render();
}

function onMouseDown(event)
{
	var canvasX = event.clientX - canvasBounds.left;
	var canvasY = event.clientY - canvasBounds.top;
	var glX = 2 * (canvasX / canvas.width) - 1;
	var glY = -1 + 2 * (canvas.height - canvasY) / canvas.height;
	console.log("Mouse down " , glX, glY);
	
	canvas.addEventListener("mousemove", onMouseMove);
	canvas.addEventListener("mouseup", onMouseUp);
	canvas.addEventListener("mouseout", onMouseOut);
}

function onMouseMove(event)
{
	console.log("Mouse move");
}

function onMouseOut(event)
{
	console.log("onMouseOut");
	canvas.removeEventListener("mousemove", onMouseMove);
	canvas.removeEventListener("mouseout", onMouseOut);
	canvas.removeEventListener("mouseup", onMouseUp);
}

function onMouseUp(event)
{
	canvas.removeEventListener("mousemove", onMouseMove);
	canvas.removeEventListener("mouseout", onMouseOut);
	canvas.removeEventListener("mouseup", onMouseUp);
	console.log("onMouseUp");
}

function render() 
{

	gl.clear(gl.COLOR_BUFFER_BIT);

}