// thanks to http://learningwebgl.com/blog/

var SHAPE_SPHERE = "sphere";
var SHAPE_CONE = "cone";
var SHAPE_CYLINDER = "cylinder";

var SHAPE_ID = "shape_id";
var SHAPE_TYPE = "type";
var SHAPE_VERTICES = "vertices";
var SHAPE_INDICES = "indices";
var SHAPE_NORMALS = "normals";
var SHAPE_TEXTURE_COORDINATES = "texture_coordinates";
var SHAPE_COLORS = "colors";

var SHAPE_VERTEX_BUFFER = "vertex_buffer";
var SHAPE_COLOR_BUFFER = "color_buffer";
var SHAPE_NORMAL_BUFFER = "normal_buffer";
var SHAPE_TEXTURE_COORD_BUFFER = "v_buffer";
var SHAPE_INDEX_BUFFER = "index_buffer";

var SHAPE_TRANSLATION_X = "shape_translation_x";
var SHAPE_TRANSLATION_Y = "shape_translation_y";
var SHAPE_TRANSLATION_Z = "shape_translation_z";

var SHAPE_ROTATION_X = "shape_rotation_x";
var SHAPE_ROTATION_Y = "shape_rotation_y";
var SHAPE_ROTATION_Z = "shape_rotation_z";

var SHAPE_SCALE_X = "shape_scale_x";
var SHAPE_SCALE_Y = "shape_scale_y";
var SHAPE_SCALE_Z = "shape_scale_z";

var MATERIAL_COLOR = "material_color";
var MATERIAL_SHININESS = "material_shininess";

var spheresCount = 0;
var conesCount = 0;
var cylindersCount = 0;

function createSphere(color)
{
	var radius = 0.1;
	var vertices = [];
	var normals = [];
	var textureCoordinates = [];
	var indices = [];
	var latitudeBands = 30;
	var longitudeBands = 30;
	
	for (var latNumber = 0; latNumber <= latitudeBands; latNumber++)
	{
		var theta = latNumber * Math.PI / latitudeBands;
		var sinTheta = Math.sin(theta);
		var cosTheta = Math.cos(theta);
		
		for (var longNumber = 0; longNumber <= longitudeBands; longNumber++)
		{
			var phi = longNumber * 2 * Math.PI / longitudeBands;
			var sinPhi = Math.sin(phi);
			var cosPhi = Math.cos(phi);
			
			var x = cosPhi * sinTheta;
			var y = cosTheta;
			var z = sinPhi * sinTheta;
			var u = 1 - (longNumber / longitudeBands);
			var v = 1 - (latNumber / latitudeBands);
			
			addNormal(normals, x, y, z);
			
			//textureCoordinates[textureCoordinates.length] = u;
			//textureCoordinates[textureCoordinates.length] = v;
			addVertex(vertices, x * radius, y * radius, z * radius);
		}
	}
	
	for (latNumber = 0; latNumber < latitudeBands; latNumber++)
	{
		for (longNumber = 0; longNumber < longitudeBands; longNumber++)
		{
			var first = (latNumber * (longitudeBands + 1)) + longNumber;
			var second = first + longitudeBands + 1;
			indices[indices.length] = first;
			indices[indices.length] = second;
			indices[indices.length] = first + 1;
			
			indices[indices.length] = second;
			indices[indices.length] = second + 1;
			indices[indices.length] = first + 1;
		}
	}
	
	spheresCount++;
	
	var result = createShape();
	result[SHAPE_ID] = SHAPE_SPHERE + "_" + spheresCount.toString();
	result[SHAPE_TYPE] = SHAPE_SPHERE;
	result[SHAPE_VERTICES] = vertices;
	result[SHAPE_INDICES] = indices;
	result[SHAPE_NORMALS] = normals;
	result[SHAPE_TEXTURE_COORDINATES] = textureCoordinates;
	result.setColor(color);

	return result;
}

function createCone(color)
{
	var radius = 0.1;
	var height = 0.2;
	var vertices = [];
	var normals = [];
	var textureCoordinates = [];
	var indices = [];
	var edgesCount = 30;
	var yOffset = -0.1;

	// bottom center
	addVertex(vertices, 0, yOffset, 0);
	addNormal(normals, 0, yOffset, 0);
	
	var topVertex = vec3(0, height + yOffset, 0);
	
	// bottom circle
	for (var i = 0; i < edgesCount; i++)
	{
		var phi = i * 2 * Math.PI / edgesCount;
		var sinPhi = Math.sin(phi);
		var cosPhi = Math.cos(phi);
		addVertex(vertices, cosPhi * radius, yOffset, sinPhi * radius);
		
		var prevVertex = vec3();
		if (i > 0)
		{
			prevVertex = vec3(vertices[vertices.length - 6], vertices[vertices.length - 5], vertices[vertices.length - 4]);
		}
		else
		{
			phi = (edgesCount - 1) * 2 * Math.PI / edgesCount;
			sinPhi = Math.sin(phi);
			cosPhi = Math.cos(phi);
			prevVertex = vec3(cosPhi * radius, yOffset, sinPhi * radius);
		}
		var currentVertex = vec3(vertices[vertices.length - 3], vertices[vertices.length - 2], vertices[vertices.length - 1]);
		var v1 = subtract(prevVertex, topVertex);
		var v2 = subtract(topVertex, currentVertex);
		var crossProduct = cross(v1, v2);
		addNormal(normals, crossProduct[0], crossProduct[1], crossProduct[2]);
	}

	// top point
	addVertex(vertices, 0, height + yOffset, 0);
	addNormal(normals, 0, height + yOffset, 0);
	
	var topVertexIndex = (vertices.length / 3) - 1;

	for (i = 2; i <= edgesCount; i++)
	{
		indices[indices.length] = i;
		indices[indices.length] = i - 1;
		indices[indices.length] = 0;
		
		indices[indices.length] = i - 1;
		indices[indices.length] = i;
		indices[indices.length] = topVertexIndex;
	}
	indices[indices.length] = 1;
	indices[indices.length] = edgesCount;
	indices[indices.length] = 0;
	
	indices[indices.length] = edgesCount;
	indices[indices.length] = 1;
	indices[indices.length] = topVertexIndex;
	
	conesCount++;
	
	var result = createShape();
	result[SHAPE_ID] = SHAPE_CONE + "_" + conesCount.toString();
	result[SHAPE_TYPE] = SHAPE_CONE;
	result[SHAPE_VERTICES] = vertices;
	result[SHAPE_INDICES] = indices;
	result[SHAPE_NORMALS] = normals;
	result[SHAPE_TEXTURE_COORDINATES] = textureCoordinates;
	result.setColor(color);

	return result;
}

function createCylinder(color)
{
	var radius = 0.1;
	var height = 0.2;
	var vertices = [];
	var normals = [];
	var textureCoordinates = [];
	var indices = [];
	var edgesCount = 30;
	var yOffset = -0.1;

	// bottom center
	addVertex(vertices, 0, yOffset, 0);
	normals(normals, 0, yOffset, 0);
	
	for (var i = 0; i < edgesCount; i++)
	{
		var phi = i * 2 * Math.PI / edgesCount;
		var sinPhi = Math.sin(phi);
		var cosPhi = Math.cos(phi);
		
		var x = cosPhi * radius;
		var y = yOffset;
		var z = sinPhi * radius;
		
		addVertex(vertices, x, y, z);
		addVertex(vertices, x, y + height, z);
		addNormal(normals, x, 0, z);
		addNormal(normals, x, 0, z);
	}

	// top center
	addVertex(vertices, 0, height + yOffset, 0);
	addNormal(normals, 0, height + yOffset, 0);
	
	var topVertexIndex = (vertices.length / 3) - 1;

	for (i = 3; i <= edgesCount * 2; i++)
	{
		if (i % 2 != 0)
		{
			indices[indices.length] = i;
			indices[indices.length] = i - 2;
			indices[indices.length] = 0;
		}
		else
		{
			indices[indices.length] = i - 2;
			indices[indices.length] = i - 3;
			indices[indices.length] = i - 1;

			indices[indices.length] = i - 2;
			indices[indices.length] = i - 1;
			indices[indices.length] = i;

			indices[indices.length] = topVertexIndex;
			indices[indices.length] = i - 2;
			indices[indices.length] = i;
		}
	}

	indices[indices.length] = i - 1;
	indices[indices.length] = 1;
	indices[indices.length] = 2;
	
	indices[indices.length] = 1;
	indices[indices.length] = i - 1;
	indices[indices.length] = i - 2;
	
	indices[indices.length] = 1;
	indices[indices.length] = edgesCount * 2 - 1;
	indices[indices.length] = 0;
	
	indices[indices.length] = edgesCount * 2;
	indices[indices.length] = 2;
	indices[indices.length] = topVertexIndex;
	
	conesCount++;
	
	var result = createShape();
	result[SHAPE_ID] = SHAPE_CYLINDER + "_" + cylindersCount.toString();
	result[SHAPE_TYPE] = SHAPE_CYLINDER;
	result[SHAPE_VERTICES] = vertices;
	result[SHAPE_INDICES] = indices;
	result[SHAPE_NORMALS] = normals;
	result[SHAPE_TEXTURE_COORDINATES] = textureCoordinates;
	result.setColor(color);

	return result;
}

function createShape()
{
	var result = {};
	
	result[SHAPE_TRANSLATION_X] = 0.0;
	result[SHAPE_TRANSLATION_Y] = 0.0;
	result[SHAPE_TRANSLATION_Z] = 0.0;

	result[SHAPE_ROTATION_X] = 0.0;
	result[SHAPE_ROTATION_Y] = 0.0;
	result[SHAPE_ROTATION_Z] = 0.0;

	result[SHAPE_SCALE_X] = 1.0;
	result[SHAPE_SCALE_Y] = 1.0;
	result[SHAPE_SCALE_Z] = 1.0;
	
	result[MATERIAL_COLOR] = vec4(1.0, 1.0, 1.0, 1.0);
	result[MATERIAL_SHININESS] = 100.0;
	
	result.translation = mat4();				
	result.rotationX = mat4();
	result.rotationY = mat4();	
	result.rotationZ = mat4();	
	result.scale = mat4();
	
	result.setTranslation = function(x, y, z)
	{
		result.translation[0][3] = x;
		result.translation[1][3] = y;
		result.translation[2][3] = z;
		
		result[SHAPE_TRANSLATION_X] = x;
		result[SHAPE_TRANSLATION_Y] = y;
		result[SHAPE_TRANSLATION_Z] = z;
	}
	
	result.setRotationX = function(value)
	{
		var cosv = Math.cos(value);
		var sinv = Math.sin(value);
		
		result.rotationX[0][0] = 1;
		result.rotationX[1][1] = cosv;
		result.rotationX[1][2] = -sinv;
		result.rotationX[2][1] = sinv;
		result.rotationX[2][2] = cosv;
		
		result[SHAPE_ROTATION_X] = value;
	}

	result.setRotationY = function(value)
	{
		var cosv = Math.cos(value);
		var sinv = Math.sin(value);
		
		result.rotationY[0][0] = cosv;
		result.rotationY[0][2] = sinv;
		result.rotationY[1][1] = 1;
		result.rotationY[2][0] = -sinv;
		result.rotationY[2][2] = cosv;
		
		result[SHAPE_ROTATION_Y] = value;
	}

	result.setRotationZ = function(value)
	{
		var cosv = Math.cos(value);
		var sinv = Math.sin(value);
		
		result.rotationZ[0][0] = cosv;
		result.rotationZ[0][1] = -sinv;
		result.rotationZ[1][0] = sinv;
		result.rotationZ[1][1] = cosv;
		result.rotationZ[2][2] = 1;
		
		result[SHAPE_ROTATION_Z] = value;
	}
	
	result.setScale = function(x, y, z)
	{
		result.scale[0][0] = x;
		result.scale[1][1] = y;
		result.scale[2][2] = z;
		
		result[SHAPE_SCALE_X] = x;
		result[SHAPE_SCALE_Y] = y;
		result[SHAPE_SCALE_Z] = z;
	}
	
	result.setColor = function(color)
	{
		var colors = result[SHAPE_COLORS];
		if (!colors)
		{
			colors = [];
			result[SHAPE_COLORS] = colors;
		}
		colors.length = 0;
		var numVerices = result[SHAPE_VERTICES].length / 3;
		for (var i = 0; i < numVerices; i++)
		{
			var numChannels = color.length;
			for (var j = 0; j < numChannels; j++)
			{
				colors[colors.length] = color[j];
			}
		}
		
		var materialColor = result[MATERIAL_COLOR];
		if (materialColor)
		{
			var numChannels = color.length;
			for (var i = 0; i < numChannels; i++)
			{
				materialColor[i] = color[i];
			}
		}
	}
	
	// NOTE transpose matrices for webgl
	
	result.setTranslation(0, 0, -0.5);
	
	return result;
}

function addVertex(vertices, x, y, z)
{
	vertices[vertices.length] = x;
	vertices[vertices.length] = y;
	vertices[vertices.length] = z;
}

function addNormal(normals, x, y, z)
{
	normals[normals.length] = x;
	normals[normals.length] = y;
	normals[normals.length] = z;
}