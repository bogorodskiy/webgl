"use strict";

var SHAPE_TYPE_TRIANGLE = "triangle";
var SHAPE_TYPE_SQUARE = "square";

var canvas = null;
var gl = null;
var points = [];
var numTimesToSubdivide = 0;
var theta = 0.0;
var thetaLocation = null;
var bufferId = 0;
// distance from the center of a shape to a vertex 
var shapeSize = 0.5;
var shapesCount = 0;
var shapeType = SHAPE_TYPE_TRIANGLE;

window.onload = function init()
{
document.getElementById("shapeSelector").onchange = onShapeSelectorChange;
document.getElementById("thetaSlider").onchange = onThetaSliderChange;
document.getElementById("borderCheckbox").onchange = onBorderCheckboxChange;
document.getElementById("numTimesInput").onchange = onNumTimesInputChange;
document.getElementById("sizeSlider").onchange = onSizeSliderChange;
	
	canvas = document.getElementById("gl-canvas");

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl)
	{
		console.log("WebGL is not available");
	}

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	bufferId = gl.createBuffer();
	
	resetShape();

	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	thetaLocation = gl.getUniformLocation(program, "theta");

	theta = 0.0;
	
	render();
};

function triangle(a, b, c)
{
	// a - bottom left, b - bottom right, c - middle top
	if (document.getElementById("borderCheckbox").checked)
	{
		points.push(a, b,
					b, c,
					c, a);
	}
	else
	{
		points.push(a, b, c);
	}
}

function square(a, b, c, d)
{
	// a - bottom left, b - top left, c - top right, d - bottom right
	
	if (document.getElementById("borderCheckbox").checked)
	{
		points.push(a, b,
					b, c,
					c, d,
					d, a);
	}
	else
	{
		points.push(a, b, c, 
					c, a, d);
	}
}

function divideTriangle(a, b, c, count)
{
	if (count === 0) 
	{
		triangle(a, b, c);
		
		shapesCount++;
		document.getElementById("shapesCountText").value = shapesCount.toString();
	}
	else
	{

		//bisect the sides

		var ab = mix(a, b, 0.5);
		var ac = mix(a, c, 0.5);
		var bc = mix(b, c, 0.5);

		--count;

		// four new triangles

		divideTriangle(a, ab, ac, count);
		divideTriangle(c, ac, bc, count);
		divideTriangle(b, bc, ab, count);
		divideTriangle(ac, ab, bc, count);
	}
}

function divideSquare(a, b, c, d, count)
{
	if (count === 0) 
	{
		square(a, b, c, d);
		
		shapesCount++;
		document.getElementById("shapesCountText").value = shapesCount.toString();
	}
	else
	{

		//bisect the sides

		var ab = mix(a, b, 0.5);
		var bc = mix(b, c, 0.5);
		var cd = mix(c, d, 0.5);
		var da = mix(d, a, 0.5);
		var ac = mix(a, c, 0.5);
		
		--count;

		// four new squares

		divideSquare(a, ab, ac, da, count);
		divideSquare(ab, b, bc, ac, count);
		divideSquare(ac, bc, c, cd, count);
		divideSquare(da, ac, cd, d, count);
	}
}

function resetShape()
{
	shapesCount = 0;
	points.length = 0;
	
	var vertices = [];
	if (shapeType == SHAPE_TYPE_TRIANGLE)
	{
		vertices = getTriangleVertices();
		divideTriangle(vertices[0], vertices[1], vertices[2], numTimesToSubdivide);
	}
	else if (shapeType == SHAPE_TYPE_SQUARE)
	{
		vertices = getSquareVertices();
		divideSquare(vertices[0], vertices[1], vertices[2], vertices[3], numTimesToSubdivide);
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
}

function render()
{
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.uniform1f(thetaLocation, theta);
	if (document.getElementById("borderCheckbox").checked)
	{
		gl.drawArrays(gl.LINES, 0, points.length);
	}
	else
	{
		gl.drawArrays(gl.TRIANGLES, 0, points.length);
	}
}

function getTriangleVertices()
{
	var sin60 = Math.sin(60 * Math.PI / 180);
	var cos60 = Math.cos(60 * Math.PI / 180);

	var vertices = [
		vec2(-shapeSize * sin60, -shapeSize * cos60),
		vec2( 0, shapeSize),
		vec2( shapeSize * sin60, -shapeSize * cos60)
	];
	return vertices;
}

function getSquareVertices()
{
	var vertices = [
		vec2(-shapeSize, -shapeSize),
		vec2(-shapeSize, shapeSize),
		vec2(shapeSize, shapeSize),
		vec2(shapeSize, -shapeSize)
	];
	return vertices;
}

function onShapeSelectorChange() 
{
	shapeType = document.getElementById("shapeSelector").value;
	resetShape();
	render();
};

function onThetaSliderChange() 
{
	theta = document.getElementById("thetaSlider").value;
	render();
};

function onBorderCheckboxChange() 
{
	resetShape();
	render();
};

function onNumTimesInputChange() 
{
	numTimesToSubdivide = Number(document.getElementById("numTimesInput").value);
	resetShape();
	render();
};

function onSizeSliderChange() 
{
	shapeSize = document.getElementById("sizeSlider").value;
	resetShape();
	render();
};