"use strict";
var canvas = null;
var canvasBounds = null;
var gl;
var vertexBufferId = 0;
var colorBufferId = 0;
var currentColor = null;

window.onload = function init() 
{
	canvas = document.getElementById("gl-canvas");
	canvasBounds = canvas.getBoundingClientRect();
	currentColor = getColor();

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) 
	{ 
		console.log("WebGL isn't available"); 
	}

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.2, 0.2, 0.2, 1);
	//
	//  Load shaders and initialize attribute buffers
	//
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	vertexBufferId = gl.createBuffer();
	//gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferId);
	//gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
	
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	
	render();
}

function getColor()
{
	var colorStr = $("#colorPicker").val().toString();
	var red = parseInt(colorStr.substr(0, 2), 16);
	var green = parseInt(colorStr.substr(2, 2), 16);
	var blue = parseInt(colorStr.substr(4, 2), 16);
	var result = vec4(red / 255, green / 255, blue / 255);
	return result;
}

function render() 
{
    gl.clear(gl.COLOR_BUFFER_BIT);
}