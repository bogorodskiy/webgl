var SHAPE_SPHERE = "sphere";
var SHAPE_CONE = "cone";
var SHAPE_CYLINDER = "sphere";

var SHAPE_TYPE = "type";
var SHAPE_VERTICES = "vertices";
var SHAPE_INDICES = "indices";
var SHAPE_NORMALS = "normals";
var SHAPE_TEXTURE_COORDINATES = "texture_coordinates";

var SHAPE_VERTEX_BUFFER = "vertex_buffer";
var SHAPE_NORMAL_BUFFER = "normal_buffer";
var SHAPE_TEXTURE_COORD_BUFFER = "v_buffer";
var SHAPE_INDEX_BUFFER = "index_buffer";

function createSphere(radius = 2)
{
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
			
			vertices[vertices.length] = x * radius;
			vertices[vertices.length] = y * radius;
			vertices[vertices.length] = z * radius;
			
			normals[normals.length] = x;
			normals[normals.length] = y;
			normals[normals.length] = z;
			
			//console.log("x", x);
			//console.log("y", y);
			//console.log("z", z);
			//console.log('');
			
			textureCoordinates[textureCoordinates.length] = u;
			textureCoordinates[textureCoordinates.length] = v;
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
	
	var result = {};
	result[SHAPE_TYPE] = SHAPE_SPHERE;
	result[SHAPE_VERTICES] = vertices;
	result[SHAPE_INDICES] = indices;
	result[SHAPE_NORMALS] = normals;
	result[SHAPE_TEXTURE_COORDINATES] = textureCoordinates;
	return result;
}
	