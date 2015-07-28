var SHAPE_TYPE = "type";
var SHAPE_VERTICES = "vertices";
var SHAPE_INDICES = "indices";
var SHAPE_NORMALS = "normals";
var SHAPE_TEXTURE_COORDINATES = "texture_coordinates";

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
			
			textureCoordinates[textureCoordinates.length] = u;
			textureCoordinates[textureCoordinates.length] = v;
		}
	}
}
	