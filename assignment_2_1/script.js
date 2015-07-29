"use strict";
var MIN_MOVE_TIME_DELTA = 10; // ms
var date = new Date();
var lastTime = 0;

var canvas = null;
var canvasBounds = null;
var gl;
var maxNumVertices  = 1000;
var index = 0;
var vertexBufferId = 0;
var colorBufferId = 0;
var numCurves = 0;
var curveLengthByIndex = [];
var curveStartIndex = [];
var curvePointsByIndex = [];
var curveIndex = -1;
var vertices = [];
var verticesColors = [];
var brushSize = 5;
var triangleStrip = true;
var currentColor = null;

window.onload = function init() 
{
	addCurve();
	
	canvas = document.getElementById("gl-canvas");
	canvasBounds = canvas.getBoundingClientRect();
	
	currentColor = getColor();
	
	$('#gl-canvas').on('mousedown', onMouseDown);
	$('#gl-canvas').on('click', onClick);
	$("#sizeSlider").change(onBrushSizeChange);
	onBrushSizeChange(null);
	$("#clearButton").click(onClearButtonClick);
	
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) 
	{ 
		alert("WebGL isn't available"); 
	}

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	//
	//  Load shaders and initialize attribute buffers
	//
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	vertexBufferId = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferId);
	gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumVertices, gl.STATIC_DRAW);
	
	var vPos = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPos, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPos);

	colorBufferId = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
	gl.bufferData(gl.ARRAY_BUFFER, 16 * maxNumVertices, gl.STATIC_DRAW);
	
	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);
}

function addSegment()
{
	var curvePoints = curvePointsByIndex[curvePointsByIndex.length - 1];
	currentColor = getColor();
	
	if (curvePoints.length < 2)
	{
		return;
	}

	var point1 = curvePoints[curvePoints.length - 2];
	var point2 = curvePoints[curvePoints.length - 1];

	var vector = vec2(point2[0] - point1[0], point2[1] - point1[1]);
	var vectorLength = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
	
	//   1------------4
	//   |            |
	//   |            |
	//   2------------3
	
	var v1 = vec2(-vector[1] / vectorLength, vector[0] / vectorLength);
	toBrushSizeVector(v1);	
	var v2 = vec2(-v1[0], -v1[1]);
	var v3 = vec2(-v1[0] + vector[0], -v1[1] + vector[1]);
	var v4 = vec2(v1[0] + vector[0], v1[1] + vector[1]);

	if (triangleStrip)
	{
		if (curvePoints.length == 2)
		{
			addVertex(vec2(point1[0] + v1[0], point1[1] + v1[1]), currentColor);
			addVertex(vec2(point1[0] + v2[0], point1[1] + v2[1]), currentColor);
		}
		addVertex(vec2(point1[0] + v4[0], point1[1] + v4[1]), currentColor);
		addVertex(vec2(point1[0] + v3[0], point1[1] + v3[1]), currentColor);
	}
	else
	{
		addVertex(vec2(point1[0] + v1[0], point1[1] + v1[1]), currentColor);
		addVertex(vec2(point1[0] + v2[0], point1[1] + v2[1]), currentColor);
		addVertex(vec2(point1[0] + v3[0], point1[1] + v3[1]), currentColor);
	
		addVertex(vec2(point1[0] + v3[0], point1[1] + v3[1]), currentColor);
		addVertex(vec2(point1[0] + v1[0], point1[1] + v1[1]), currentColor);
		addVertex(vec2(point1[0] + v4[0], point1[1] + v4[1]), currentColor);
	}

	render();
}

function addVertex(vertex, color, store)
{
	if (store == null)
	{
		store = true;
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferId);
	gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] * index, flatten(vertex));

	gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
	gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec4'] * index, flatten(color));

	index++;
	
	if (store)
	{
		curveLengthByIndex[curveIndex]++;
		vertices[vertices.length] = vertex;
		verticesColors[verticesColors.length] = color;		
	}
	
	if (index >= maxNumVertices - 1)
	{
		increaseBuffer();
	}
}

function addCurve()
{
	numCurves++;
	curveIndex++;
	curveLengthByIndex[curveIndex] = 0;
	curveStartIndex[curveIndex] = index;
	curvePointsByIndex[curveIndex] = [];
}

function increaseBuffer()
{
	maxNumVertices = maxNumVertices * 2;

	gl.clear(gl.COLOR_BUFFER_BIT);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferId);
	gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumVertices, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
	gl.bufferData(gl.ARRAY_BUFFER, 16 * maxNumVertices, gl.STATIC_DRAW);
	
	index = 0;

	var n = vertices.length;
	for (var i = 0; i < vertices.length; i++)
	{
		addVertex(vertices[i], verticesColors[i], false);
	}
}

// open gl coordinates to pixels
function toBrushSizeVector(unitVector)
{
	unitVector[0] = unitVector[0] * brushSize * 2 / (canvas.width - 1);
	unitVector[1] = unitVector[1] * brushSize * 2 / (canvas.height - 1);
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

function onMouseDown(event)
{
	$(document).on('mouseup', onMouseUp);
	$('#gl-canvas').on('mousemove', onMouseMove);
	
	addCurve();
	//render();
	
	var canvasX = event.clientX - canvasBounds.left;
	var canvasY = event.clientY - canvasBounds.top;
	var glX = 2 * (canvasX / canvas.width) - 1;
	var glY = -1 + 2 * (canvas.height - canvasY) / canvas.height;
}

function onMouseUp(event)
{
	$('#gl-canvas').off('mousemove', onMouseMove);
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
	
	var glX = 2 * ((event.clientX - canvasBounds.left) / canvas.width) - 1;
	var glY = -1 + 2 * (canvas.height - (event.clientY - canvasBounds.top)) / canvas.height;
	var curvePoints = curvePointsByIndex[curvePointsByIndex.length - 1];
	curvePoints[curvePoints.length] = vec2(glX, glY);
	addSegment();
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
	maxNumVertices  = 1000;
	index = 0;
	numCurves = 0;
	curveLengthByIndex.length = 0;
	curveStartIndex.length = 0;
	curvePointsByIndex.length = 0;
	curveIndex = -1;
	vertices.length = 0;
	verticesColors.length = 0;

	gl.clear(gl.COLOR_BUFFER_BIT);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferId);
	gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumVertices, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
	gl.bufferData(gl.ARRAY_BUFFER, 16 * maxNumVertices, gl.STATIC_DRAW);
	
	addCurve();
}

function onClick(event)
{
	var canvasX = event.clientX - canvasBounds.left;
	var canvasY = event.clientY - canvasBounds.top;
	var glX = 2 * (canvasX / canvas.width) - 1;
	var glY = -1 + 2 * (canvas.height - canvasY) / canvas.height;
	var curvePoints = curvePointsByIndex[curvePointsByIndex.length - 1];
	curvePoints[curvePoints.length] = vec2(glX, glY);
	addSegment();
}

function render() 
{

    gl.clear(gl.COLOR_BUFFER_BIT);
	var drawType = triangleStrip ? gl.TRIANGLE_STRIP : gl.TRIANGLES;
	
    for (var i = 0; i < numCurves; i++) 
	{
		gl.drawArrays(drawType, curveStartIndex[i], curveLengthByIndex[i]);
    }
}