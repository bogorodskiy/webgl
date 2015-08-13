"use strict";

var OPERATION_TRANSLATION = 0;
var OPERATION_ROTATION = 1;
var OPERATION_SCALE = 2;

var canvas = null;
var canvasBounds = null;
var gl;
var shapes = [];
var program = null;
var currentOperation = OPERATION_TRANSLATION;
var currentShapeType = null;
var selectedShape = null;
var createFunctionByType = {};
var shapeById = {};

window.onload = function init() 
{
	createFunctionByType[SHAPE_SPHERE] = createSphere;
	createFunctionByType[SHAPE_CONE] = createCone;
	createFunctionByType[SHAPE_CYLINDER] = createCylinder;
	
	canvas = document.getElementById("gl-canvas");
	canvasBounds = canvas.getBoundingClientRect();
	$("#addButton").on("click", onAddButtonClick);
	$("#deleteButton").on("click", onDeleteButtonClick);
	
	$("#xSlider").on("slide", onXChange);
	onXChange();
	$("#ySlider").on("slide", onYChange);
	onYChange();
	$("#zSlider").on("slide", onZChange);
	onZChange();
	
	$("#translationSelector").click(onOperationTypeChange);
	$("#rotationSelector").click(onOperationTypeChange);
	$("#scaleSelector").click(onOperationTypeChange);
	onOperationTypeChange();

	$("#sphereSelector").click(onShapeTypeChange);
	$("#coneSelector").click(onShapeTypeChange);
	$("#cylinderSelector").click(onShapeTypeChange);
	onShapeTypeChange();
	
	$("#selectedShapeList").selectmenu({ width : 'auto'});
	$("#selectedShapeList").on("selectmenuselect", onShapeSelected);

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) 
	{ 
		console.log("WebGL isn't available"); 
	}

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.2, 0.2, 0.2, 1);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	//
	//  Load shaders and initialize attribute buffers
	//
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	
	program.vPosition = gl.getAttribLocation(program, "vPosition");
	gl.enableVertexAttribArray(program.vPosition);
	
	program.vColor = gl.getAttribLocation(program, "vColor");
	gl.enableVertexAttribArray(program.vColor);
	
	program.vTranslationMatrix = gl.getUniformLocation(program, "vTranslationMatrix");
	program.vRotationXMatrix = gl.getUniformLocation(program, "vRotationXMatrix");
	program.vRotationYMatrix = gl.getUniformLocation(program, "vRotationYMatrix");
	program.vRotationZMatrix = gl.getUniformLocation(program, "vRotationZMatrix");
	program.vScaleMatrix = gl.getUniformLocation(program, "vScaleMatrix");
	
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

function updateSliders()
{
	var xValue = 0.0;
	var yValue = 0.0;
	var zValue = 0.0;
	var min = 0.0;
	var max = 1.0;
	var step = 0.1;
	
	if (selectedShape != null)
	{
		if (currentOperation == OPERATION_TRANSLATION)
		{
			xValue = selectedShape[SHAPE_TRANSLATION_X];
			yValue = selectedShape[SHAPE_TRANSLATION_Y];
			zValue = selectedShape[SHAPE_TRANSLATION_Z];
			
			min = -1;
		}
		else if (currentOperation == OPERATION_ROTATION)
		{
			xValue = selectedShape[SHAPE_ROTATION_X] * 180 / Math.PI;
			yValue = selectedShape[SHAPE_ROTATION_Y] * 180 / Math.PI;
			zValue = selectedShape[SHAPE_ROTATION_Z] * 180 / Math.PI;
			
			min = 0.0;
			max = 360.0;
			step = 1.0;
		}
		else if (currentOperation == OPERATION_SCALE)
		{
			xValue = selectedShape[SHAPE_SCALE_X];
			yValue = selectedShape[SHAPE_SCALE_Y];
			zValue = selectedShape[SHAPE_SCALE_Z];
			
			min = 0.1;
			max = 3.0;
		}
	}
	
	$("#xSlider").slider("option", "min", min);
	$("#xSlider").slider("option", "max", max);
	$("#xSlider").slider("option", 'step', step);
	
	$("#ySlider").slider("option", "min", min);
	$("#ySlider").slider("option", "max", max);
	$("#ySlider").slider("option", 'step', step);
	
	$("#zSlider").slider("option", "min", min);
	$("#zSlider").slider("option", "max", max);
	$("#zSlider").slider("option", 'step', step);

	$("#xSlider").slider('value', xValue);
	$("#ySlider").slider('value', yValue);
	$("#zSlider").slider('value', zValue);
	onXChange();
	onYChange();
	onZChange();
}

function updateShapeProperties()
{
	if (selectedShape == null)
	{
		return;
	}
	
	if (currentOperation == OPERATION_TRANSLATION)
	{
		selectedShape.setTranslation( Number( $("#xSlider").slider("option", "value") ),
							  Number( $("#ySlider").slider("option", "value") ),
							  Number( $("#zSlider").slider("option", "value") ));
	}
	else if (currentOperation == OPERATION_ROTATION)
	{
		var rotationX = Number( $("#xSlider").slider("option", "value") );
		var rotationY = Number( $("#ySlider").slider("option", "value") );
		var rotationZ = Number( $("#zSlider").slider("option", "value") );

		selectedShape.setRotationX( rotationX * Math.PI / 180 );
		selectedShape.setRotationY( rotationY * Math.PI / 180 );
		selectedShape.setRotationZ( rotationZ * Math.PI / 180 );
	}
	else if (currentOperation == OPERATION_SCALE)
	{
		selectedShape.setScale( Number( $("#xSlider").slider("option", "value") ),
							  Number( $("#ySlider").slider("option", "value") ),
							  Number( $("#zSlider").slider("option", "value") ) );
	}
	
	render();
}

function degreeToRadians(value)
{
	return value * Math.PI / 180.0;
}

function transposeMat4(value)
{
	var result = [];
	for (var i = 0; i < 4; i++)
	{
		for (var j = 0; j < 4; j++)
		{
			var index = i + j * 4;
			result[result.length] = value[index];
		}
	}
	return new Float32Array(result);
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
	shapeById[shape[SHAPE_ID]] = shape;
	selectedShape = shape;

	$('#selectedShapeList').append("<option value='" + selectedShape[SHAPE_ID] + "'>" + selectedShape[SHAPE_ID] + "</option");
	$('#selectedShapeList').val(selectedShape[SHAPE_ID]);
	$("#selectedShapeList").selectmenu("refresh");
	
	updateSliders();
	render();
}

function onOperationTypeChange(event)
{
	var checkedId = $("#operationSelector :radio:checked").attr('id');
	
	if (checkedId == "translationSelector")
	{
		currentOperation = OPERATION_TRANSLATION;
	}
	else if(checkedId == "rotationSelector")
	{
		currentOperation = OPERATION_ROTATION;
	}
	else if(checkedId == "scaleSelector")
	{
		currentOperation = OPERATION_SCALE;
	}
	
	updateSliders();
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
	var userInteraction = (event != null && event.view != null);

	var x = ui ? ui.value : $("#xSlider").slider("option", "value");
	$("#xCaption").text("X = " + x);
	if (userInteraction)
	{
		updateShapeProperties();
	}
}
function onYChange(event, ui)
{
	var userInteraction = (event != null && event.view != null);
	
	var y =  ui ? ui.value : $("#ySlider").slider("option", "value");
	$("#yCaption").text("Y = " + y);
	if (userInteraction)
	{
		updateShapeProperties();
	}
}
function onZChange(event, ui)
{
	var userInteraction = (event != null && event.view != null);
	
	var z = ui ? ui.value : $("#zSlider").slider("option", "value");
	$("#zCaption").text("Z = " + z);
	if (userInteraction)
	{
		updateShapeProperties();
	}
}

function onShapeSelected(event, ui)
{
	var shapeId = $('#selectedShapeList').val();
	selectedShape = shapeById[shapeId];
	updateSliders();
}

function onDeleteButtonClick(event)
{
	if (selectedShape != null)
	{
		var shapeId = selectedShape[SHAPE_ID];
		delete shapeById[shapeId];
		var n = shapes.length;
		for (var i = 0; i < n; i++)
		{
			if (shapes[i][SHAPE_ID] == shapeId)
			{
				shapes.splice(i, 1);
				break;
			}
		}
		
		$('#selectedShapeList :selected').remove();
		$("#selectedShapeList").selectmenu("refresh");
		
		selectedShape = null;
		updateSliders();
		render();
	}
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
		
		var translationMatrix = transposeMat4(shape.translation);
		gl.uniformMatrix4fv(program.vTranslationMatrix, false, translationMatrix);

		var rotationXMatrix = transposeMat4(shape.rotationX);
		gl.uniformMatrix4fv(program.vRotationXMatrix, false, rotationXMatrix);

		var rotationYMatrix = transposeMat4(shape.rotationY);
		gl.uniformMatrix4fv(program.vRotationYMatrix, false, rotationYMatrix);
		
		var rotationZMatrix = transposeMat4(shape.rotationZ);
		gl.uniformMatrix4fv(program.vRotationZMatrix, false, rotationZMatrix);
		
		var scaleMatrix = transposeMat4(shape.scale);
		gl.uniformMatrix4fv(program.vScaleMatrix, false, scaleMatrix);
		
        gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		
		var frameColorBuffer = shape[SHAPE_FRAME_COLOR_BUFFER];
		gl.bindBuffer(gl.ARRAY_BUFFER, frameColorBuffer);
		gl.vertexAttribPointer(program.vColor, frameColorBuffer.colorSize, gl.FLOAT, false, 0, 0);
		gl.drawElements(gl.LINE_LOOP, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	}
}