"use strict";
var canvas = null;
var canvasBounds = null;
var gl;
var shapes = [];
var program = null;
var currentShapeType = null;
var currentShape = null;
var createFunctionByType = {};

window.onload = function init() 
{
	createFunctionByType[SHAPE_SPHERE] = createSphere;
	createFunctionByType[SHAPE_CONE] = null;
	createFunctionByType[SHAPE_CYLINDER] = null;
	
	canvas = document.getElementById("gl-canvas");
	canvasBounds = canvas.getBoundingClientRect();
	$("#addButton").on("click", onAddButtonClick);
	
	$("#xSlider").on("slidechange", onXChange);
	onXChange();
	$("#ySlider").on("slidechange", onYChange);
	onYChange();
	$("#zSlider").on("slidechange", onZChange);
	onZChange();
	
	$("#translationSelector").click(onOperationTypeChange);
	$("#rotationSelector").click(onOperationTypeChange);
	$("#scaleSelector").click(onOperationTypeChange);
	onOperationTypeChange();

	$("#sphereSelector").click(onShapeTypeChange);
	$("#coneSelector").click(onShapeTypeChange);
	$("#cylinderSelector").click(onShapeTypeChange);
	onShapeTypeChange();

	
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) 
	{ 
		console.log("WebGL isn't available"); 
	}

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.2, 0.2, 0.2, 1);
	gl.enable(gl.DEPTH_TEST);
	//
	//  Load shaders and initialize attribute buffers
	//
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	
	program.vPosition = gl.getAttribLocation(program, "vPosition");
	gl.enableVertexAttribArray(program.vPosition);
	
	program.vColor = gl.getAttribLocation(program, "vColor");
	gl.enableVertexAttribArray(program.vColor);
	
	program.pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
	program.mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
	
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

function onAddButtonClick(event)
{
	var createFunction = createFunctionByType[currentShapeType];
	if (createFunction == null)
	{
		console.log("No function for shape type", currentShapeType);
		return;
	}
	
	var shape = createFunction(getColor());
	
	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape[SHAPE_VERTICES]), gl.STATIC_DRAW);
	vertexBuffer.vertexSize = 3;
	vertexBuffer.numItems = shape[SHAPE_VERTICES].length / 3;
	
	var indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shape[SHAPE_INDICES]), gl.STATIC_DRAW);
	indexBuffer.indexSize = 1;
	indexBuffer.numItems = shape[SHAPE_INDICES].length;

	var colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape[SHAPE_COLORS]), gl.STATIC_DRAW);
	colorBuffer.colorSize = 4;
	colorBuffer.numItems = shape[SHAPE_COLORS].length;

	var frameColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, frameColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape[SHAPE_FRAME_COLORS]), gl.STATIC_DRAW);
	frameColorBuffer.colorSize = 4;
	frameColorBuffer.numItems = shape[SHAPE_FRAME_COLORS].length;
	
	shape[SHAPE_VERTEX_BUFFER] = vertexBuffer;
	shape[SHAPE_INDEX_BUFFER] = indexBuffer;
	shape[SHAPE_COLOR_BUFFER] = colorBuffer;
	shape[SHAPE_FRAME_COLOR_BUFFER] = frameColorBuffer;
	
	shapes[shapes.length] = shape;
	currentShape = shape;
	
	render();
}

function onOperationTypeChange(event)
{
	var checkedId = $("#operationSelector :radio:checked").attr('id');
	
	if (checkedId == "translationSelector")
	{

	}
	else if(checkedId == "rotationSelector")
	{

	}
	else if(checkedId == "scaleSelector")
	{

	}
}

function onShapeTypeChange(event)
{
	var checkedId = $("#shapeSelector :radio:checked").attr('id');
	
	if (checkedId == "sphereSelector")
	{
		currentShapeType = SHAPE_SPHERE;
	}
	else if(checkedId == "coneSelector")
	{
		currentShapeType = SHAPE_CONE;
	}
	else if(checkedId == "cylinderSelector")
	{
		currentShapeType = SHAPE_CYLINDER;
	}
}

function onXChange(event, ui)
{
	var x = $("#xSlider").slider("option", "value");
	$("#xCaption").text("X = " + x);
}
function onYChange(event, ui)
{
	var y = $("#ySlider").slider("option", "value");
	$("#yCaption").text("Y = " + y);
}
function onZChange(event, ui)
{
	var z = $("#zSlider").slider("option", "value");
	$("#zCaption").text("Z = " + z);	
}

function render() 
{
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	var n = shapes.length;
	for (var i = 0; i < n; i++)
	{
		var shape = shapes[i];
		
		var vertexBuffer = shape[SHAPE_VERTEX_BUFFER];
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.vertexAttribPointer(program.vPosition, vertexBuffer.vertexSize, gl.FLOAT, false, 0, 0);

		var indexBuffer = shape[SHAPE_INDEX_BUFFER];
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		
		var colorBuffer = shape[SHAPE_COLOR_BUFFER];
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
		gl.vertexAttribPointer(program.vColor, colorBuffer.colorSize, gl.FLOAT, false, 0, 0);
        gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		
		var frameColorBuffer = shape[SHAPE_FRAME_COLOR_BUFFER];
		gl.bindBuffer(gl.ARRAY_BUFFER, frameColorBuffer);
		gl.vertexAttribPointer(program.vColor, frameColorBuffer.colorSize, gl.FLOAT, false, 0, 0);
		gl.drawElements(gl.LINE_LOOP, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	}
}