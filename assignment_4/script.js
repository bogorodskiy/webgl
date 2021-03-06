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
var fovy = 45;
var aspect = 1.0;
var near = 0.1;
var far = 10.0;

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

window.onload = function init() 
{
	createFunctionByType[SHAPE_SPHERE] = createSphere;
	createFunctionByType[SHAPE_CONE] = createCone;
	createFunctionByType[SHAPE_CYLINDER] = createCylinder;
	
	canvas = document.getElementById("gl-canvas");
	canvasBounds = canvas.getBoundingClientRect();
	$("#addButton").on("click", onAddButtonClick);
	$("#deleteButton").on("click", onDeleteButtonClick);
	$("#colorPicker").on("change", onColorChange);
	
	$("#xSlider").on("slide", onXChange);
	$("#xSlider").on("slidechange", onXChange);
	onXChange();
	$("#ySlider").on("slide", onYChange);
	$("#ySlider").on("slidechange", onYChange);
	onYChange();
	$("#zSlider").on("slide", onZChange);
	$("#zSlider").on("slidechange", onZChange);
	onZChange();

	$("#shininessSlider").on("slide", onShininessChange);
	$("#shininessSlider").on("slidechange", onShininessChange);
	$("#shininessSlider").slider("option", "min", 0.0);
	$("#shininessSlider").slider("option", "max", 100.0);
	$("#shininessSlider").slider("option", 'step', 1);
	onShininessChange();
	
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

	aspect = canvas.width / canvas.height;
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1);
	gl.enable(gl.DEPTH_TEST);
	//gl.enable(gl.CULL_FACE);
	//
	//  Load shaders and initialize attribute buffers
	//
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	
	program.vPosition = gl.getAttribLocation(program, "vPosition");
	gl.enableVertexAttribArray(program.vPosition);
	
    program.vNormal = gl.getAttribLocation(program, "vNormal");
    gl.enableVertexAttribArray(program.vNormal);
		
	program.modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");
	program.projectionMatrix = gl.getUniformLocation(program, "projectionMatrix");
	
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
	
	var xmin = 0.0;
	var xmax = 0.5;
	var xstep = 0.05;

	var ymin = 0.0;
	var ymax = 0.5;
	var ystep = 0.05;

	var zmin = 0.0;
	var zmax = 1.0;
	var zstep = 0.1;
	
	var shininess = 0;
	
	if (selectedShape != null)
	{
		if (currentOperation == OPERATION_TRANSLATION)
		{
			xValue = selectedShape[SHAPE_TRANSLATION_X];
			yValue = selectedShape[SHAPE_TRANSLATION_Y];
			zValue = selectedShape[SHAPE_TRANSLATION_Z];
			
			xmin = -0.5;
			ymin = -0.5;
			zmin = -4;
			zmax = -0.2;
			zstep = 0.1;
		}
		else if (currentOperation == OPERATION_ROTATION)
		{
			xValue = selectedShape[SHAPE_ROTATION_X] * 180 / Math.PI;
			yValue = selectedShape[SHAPE_ROTATION_Y] * 180 / Math.PI;
			zValue = selectedShape[SHAPE_ROTATION_Z] * 180 / Math.PI;
			
			xmin = -180.0;
			xmax = 180.0;
			xstep = 1.0;
			
			ymin = -180.0;
			ymax = 180.0;
			ystep = 1.0;
			
			zmin = -180.0;
			zmax = 180.0;
			zstep = 1.0;
		}
		else if (currentOperation == OPERATION_SCALE)
		{
			xValue = selectedShape[SHAPE_SCALE_X];
			yValue = selectedShape[SHAPE_SCALE_Y];
			zValue = selectedShape[SHAPE_SCALE_Z];
			
			xmin = 0.1;
			ymin = 0.1;
			zmin = 0.1;
			xmax = 3.0;
			ymax = 3.0;
			zmax = 3.0;
		}
		
		shininess = selectedShape[MATERIAL_SHININESS];
	}
	
	$("#xSlider").slider("option", "min", xmin);
	$("#xSlider").slider("option", "max", xmax);
	$("#xSlider").slider("option", 'step', xstep);
	
	$("#ySlider").slider("option", "min", ymin);
	$("#ySlider").slider("option", "max", ymax);
	$("#ySlider").slider("option", 'step', ystep);
	
	$("#zSlider").slider("option", "min", zmin);
	$("#zSlider").slider("option", "max", zmax);
	$("#zSlider").slider("option", 'step', zstep);

	$("#xSlider").slider('value', xValue);
	$("#ySlider").slider('value', yValue);
	$("#zSlider").slider('value', zValue);
	onXChange();
	onYChange();
	onZChange();
	
	$("#shininessSlider").slider('value', shininess);
	onShininessChange();
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
	
	var shininess = Number( $("#shininessSlider").slider("option", "value") );
	selectedShape[MATERIAL_SHININESS] = Number( shininess );
	
	render();
}

function degreeToRadians(value)
{
	return value * Math.PI / 180.0;
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
	
	var normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(shape[SHAPE_NORMALS]), gl.STATIC_DRAW);
	
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
	
	shape[SHAPE_VERTEX_BUFFER] = vertexBuffer;
	shape[SHAPE_INDEX_BUFFER] = indexBuffer;
	shape[SHAPE_COLOR_BUFFER] = colorBuffer;
	shape[SHAPE_NORMAL_BUFFER] = normalBuffer;
	
	shapes[shapes.length] = shape;
	shapeById[shape[SHAPE_ID]] = shape;
	selectedShape = shape;

	$('#selectedShapeList').append("<option value='" + selectedShape[SHAPE_ID] + "'>" + selectedShape[SHAPE_ID] + "</option");
	$('#selectedShapeList').val(selectedShape[SHAPE_ID]);
	$("#selectedShapeList").selectmenu("refresh");
	
	updateSliders();
	render();
}

function onColorChange(event)
{
	if (selectedShape)
	{
		selectedShape.setColor(getColor());
		var colorBuffer = selectedShape[SHAPE_COLOR_BUFFER];
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(selectedShape[SHAPE_COLORS]), gl.STATIC_DRAW);
		render();
	}
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

function onShininessChange(event, ui)
{
	var userInteraction = (event != null && event.view != null);
	
	var shininess = ui ? ui.value : $("#shininessSlider").slider("option", "value");
	$("#shininessCaption").text("Shininess: " + shininess);
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
		
		var ambientSelected = document.getElementById("ambientSelector").checked;
		var diffuseSelected = document.getElementById("diffuseSelector").checked;
		var specularSelected = document.getElementById("specularSelector").checked;
		
		var ambientProduct = ambientSelected ? mult(lightAmbient, shape[MATERIAL_COLOR]) : [0.0, 0.0, 0.0, 1.0];
		var diffuseProduct = diffuseSelected ? mult(lightDiffuse, shape[MATERIAL_COLOR]) : [0.0, 0.0, 0.0, 1.0];
		var specularProduct = specularSelected ? mult(lightSpecular, shape[MATERIAL_COLOR]) : [0.0, 0.0, 0.0, 1.0];
		
		gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
		gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
		gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );	
		gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition) );
		gl.uniform1f(gl.getUniformLocation(program, "shininess"), shape[MATERIAL_SHININESS]);
		
		var vertexBuffer = shape[SHAPE_VERTEX_BUFFER];
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.vertexAttribPointer(program.vPosition, vertexBuffer.vertexSize, gl.FLOAT, false, 0, 0);

		var normalBuffer = shape[SHAPE_NORMAL_BUFFER];
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(program.vNormal, 3, gl.FLOAT, false, 0, 0);
		
		var indexBuffer = shape[SHAPE_INDEX_BUFFER];
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		
		var modelViewMatrix = mat4();

		modelViewMatrix = mult(modelViewMatrix, shape.translation);
		modelViewMatrix = mult(modelViewMatrix, shape.rotationX);
		modelViewMatrix = mult(modelViewMatrix, shape.rotationY);
		modelViewMatrix = mult(modelViewMatrix, shape.rotationZ);
		modelViewMatrix = mult(modelViewMatrix, shape.scale);

		gl.uniformMatrix4fv(program.modelViewMatrix, false, flatten(modelViewMatrix));
		
		var projectionMatrix = perspective(fovy, aspect, near, far);
		gl.uniformMatrix4fv(program.projectionMatrix, false, flatten(projectionMatrix));
		
        gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	}
}