"use strict";

var MIN_MOVE_TIME_DELTA = 0; // ms

var canvas = null;
var canvasBounds = null;
var gl = null;
var linePoints = [];
var date = new Date();
var lastTime = 0;
var lineWidth = 2;
var vertices = [];
var bufferId = 0;
var colorBufferId = 0;
var brushSize = 1;
var lastCanvasX = 0;
var lastCanvasY = 0;
var index = 0;

window.onload = function init() 
{
	canvas = document.getElementById("gl-canvas");
	canvasBounds = canvas.getBoundingClientRect();
	canvas.addEventListener("mousedown", onMouseDown);
	
	$("#sizeSlider").change(onBrushSizeChange);
	onBrushSizeChange(null);
	$("#clearButton").click(onClearButtonClick);

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) 
	{ 
		console.log("WebGL isn't available"); 
	}

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0, 0, 0, 1.0);

	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);	
	
	bufferId = gl.createBuffer();
	
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW) ;
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	/*colorBufferId = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor); */
	
	render();
}

function addTriangles()
{
	if (linePoints.length < 2)
	{
		return;
	}
	
	var point1 = linePoints[linePoints.length - 2];
	var point2 = linePoints[linePoints.length - 1];
	
	var vector = vec2(point2[0] - point1[0], point2[1] - point1[1]);
	var vectorLength = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
	
	var v1 = vec2(-vector[1] / vectorLength, vector[0] / vectorLength);
	toBrushSizeVector(v1);	
	var v2 = vec2(-v1[0], -v1[1]);
	var v3 = vec2(-v1[0] + vector[0], -v1[1] + vector[1]);
	var v4 = vec2(v1[0] + vector[0], v1[1] + vector[1]);

	// connect with previous rectangle
	if (linePoints.length < 3)
	{
		addVertex(vec2(point1[0] + v1[0], point1[1] + v1[1]));
		addVertex(vec2(point1[0] + v2[0], point1[1] + v2[1]));
	}

	addVertex(vec2(point1[0] + v3[0], point1[1] + v3[1]));
	addVertex(vec2(point1[0] + v4[0], point1[1] + v4[1]));
	
	render();
}

function addVertex(vertex)
{
	gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
	gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] * index, flatten(vertex));
	index++;
}

// open gl coordinates to pixels
function toBrushSizeVector(unitVector)
{
	unitVector[0] = unitVector[0] * brushSize * 2 / (canvas.width - 1);
	unitVector[1] = unitVector[1] * brushSize * 2 / (canvas.height - 1);
}

function onMouseDown(event)
{
	var canvasX = event.clientX - canvasBounds.left;
	var canvasY = event.clientY - canvasBounds.top;
	var glX = 2 * (canvasX / canvas.width) - 1;
	var glY = -1 + 2 * (canvas.height - canvasY) / canvas.height;

	//gl.bindBuffer( gl.ARRAY_BUFFER, colorBufferId );
	
	//linePoints[linePoints.length] = vec2(glX, glY);
	//addTriangles();	
	
	canvas.addEventListener("mousemove", onMouseMove);
	canvas.addEventListener("mouseup", onMouseUp);
	canvas.addEventListener("mouseout", onMouseOut);
}

function onMouseMove(event)
{
	var time = new Date().getTime();
	var timeDelta = time - lastTime;
	if (timeDelta < MIN_MOVE_TIME_DELTA)
	{
		return;
	}
	
	lastTime = time;
	
	var canvasX = event.clientX - canvasBounds.left;
	var canvasY = event.clientY - canvasBounds.top;
	var deltaX = Math.abs(canvasX - lastCanvasX);
	var deltaY = Math.abs(canvasY - lastCanvasY);
	
	if (deltaX > 0 || deltaY > 0)
	{
		lastCanvasX = canvasX;
		lastCanvasY = canvasY;
		var glX = 2 * (canvasX / canvas.width) - 1;
		var glY = -1 + 2 * (canvas.height - canvasY) / canvas.height;
		
		linePoints[linePoints.length] = vec2(glX, glY);
		addTriangles();
	}
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
	//console.log("onMouseUp");
}

function onBrushSizeChange(event)
{
	var value = $("#sizeSlider").val();
	brushSize = Number($("#sizeSlider").val());
	$("#brushSizeField").text($("#sizeSlider").val());
}

function onClearButtonClick(event)
{
	gl.clear(gl.COLOR_BUFFER_BIT);
	vertices.length = 0;
	linePoints.length = 0;
}

function render() 
{
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, index);
	//gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
	//gl.drawArrays(gl.LINES, 0, vertices.length);
	//gl.drawArrays(gl.POINTS, 0, vertices.length);
}