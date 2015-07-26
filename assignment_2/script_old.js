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
var brushSize = 1;
var lastCanvasX = 0;
var lastCanvasY = 0;

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
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW) ;
	
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	
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
	
	if (linePoints.length > 2)
	{
		var oldPoint1 = linePoints[linePoints.length - 3];
		var oldPoint2 = linePoints[linePoints.length - 2];
		var oldVector = vec2(oldPoint2[0] - oldPoint1[0], oldPoint2[1] - oldPoint1[1]);
		var oldVectorLength = Math.sqrt(oldVector[0] * oldVector[0] + oldVector[1] * oldVector[1]);
		var oldVectorNormalized = vec2(oldVector[0] / oldVectorLength, oldVector[1] / oldVectorLength);
		var newVectorNormalized = vec2(vector[0] / vectorLength, vector[1] / vectorLength);
		var dotProduct = oldVectorNormalized[0] * newVectorNormalized[0] + oldVectorNormalized[1] * newVectorNormalized[1];
		var acos = Math.acos(dotProduct);
		var theta = acos * 180 / Math.PI;
		console.log(theta);
	}
	
	// connect start points with end points
	if (vertices.length != 0 && theta < 90 && theta != 0 && false)
	{
		var line1Start = v4;
		var line1End = v1;
		var line2Start = vec2(vertices[vertices.length - 2][0] - point1[0], 
							  vertices[vertices.length - 2][1] - point1[1]); // old v1
		var line2End = vec2(vertices[vertices.length - 1][0] - point1[0], 
							vertices[vertices.length - 1][1] - point1[1]); // old v4
		var middlePoint1 = getIntersection(line1Start, line1End, line2Start, line2End);

		v1 = middlePoint1;

		line1Start = v3;
		line1End = v2;
		line2Start = vec2(vertices[vertices.length - 5][0] - point1[0], 
						  vertices[vertices.length - 5][1] - point1[1]); // old v2
		line2End = vec2(vertices[vertices.length - 3][0] - point1[0], 
						vertices[vertices.length - 3][1] - point1[1]); // old v3
		var middlePoint2 = getIntersection(line1Start, line1End, line2Start, line2End);

		v2 = middlePoint2;
		
		vertices[vertices.length - 1] = vec2(middlePoint1[0] + point1[0], middlePoint1[1] + point1[1]);
		vertices[vertices.length - 3] = vec2(middlePoint2[0] + point1[0], middlePoint2[1] + point1[1]);
		vertices[vertices.length - 4] = vec2(middlePoint2[0] + point1[0], middlePoint2[1] + point1[1]);
	}
	
	vertices[vertices.length] = vec2(point1[0] + v1[0], point1[1] + v1[1]);
	vertices[vertices.length] = vec2(point1[0] + v2[0], point1[1] + v2[1]);
	vertices[vertices.length] = vec2(point1[0] + v3[0], point1[1] + v3[1]);
	
	vertices[vertices.length] = vec2(point1[0] + v3[0], point1[1] + v3[1]);
	vertices[vertices.length] = vec2(point1[0] + v1[0], point1[1] + v1[1]);
	vertices[vertices.length] = vec2(point1[0] + v4[0], point1[1] + v4[1]);
	
	console.log("vertices length:" + vertices.length);
	
	
	gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
	
	render();
}

function getIntersection(line1Start, line1End, line2Start, line2End)
{
	var dx = line1End[0] - line1Start[0];
	var dy = line1End[1] - line1Start[1];
	
	var m1 = dy / dx;
	var c1 = line1Start[1] - m1 * line1Start[0];
	
	dx = line2End[0] - line2Start[0];
	dy = line2End[1] - line2Start[1];
	
	var m2 = dy / dx;
	var c2 = line2End[1] - m2 * line2End[0];
	
	var intersectionX = (c2 - c1) / (m1 - m2);
	var intersectionY = m1 * intersectionX + c1;
	
	return vec2(intersectionX, intersectionY);
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

	canvas.addEventListener("mousemove", onMouseMove);
	canvas.addEventListener("mouseup", onMouseUp);
	canvas.addEventListener("mouseout", onMouseOut);
	
	// TODO remove test
	//canvas.addEventListener("click", onClick);
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
	
	// TODO remove test
	//return;
	
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

function onClick(event)
{
	var canvasX = event.clientX - canvasBounds.left;
	var canvasY = event.clientY - canvasBounds.top;
	
	if (canvasX != lastCanvasX && canvasY != lastCanvasY)
	{
		lastCanvasX = canvasX;
		lastCanvasY = canvasY;
		var glX = 2 * (canvasX / canvas.width) - 1;
		var glY = -1 + 2 * (canvas.height - canvasY) / canvas.height;
		
		linePoints[linePoints.length] = vec2(glX, glY);
		addTriangles();
	}
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
	
	//gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length);
	gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
	//gl.drawArrays(gl.LINES, 0, vertices.length);
	//gl.drawArrays(gl.POINTS, 0, vertices.length);
}