// thanks to http://learningwebgl.com/blog/

var SHAPE_SPHERE = "sphere";
var SHAPE_CONE = "cone";
var SHAPE_CYLINDER = "cylinder";

var SHAPE_TYPE = "type";
var SHAPE_VERTICES = "vertices";
var SHAPE_INDICES = "indices";
var SHAPE_NORMALS = "normals";
var SHAPE_TEXTURE_COORDINATES = "texture_coordinates";
var SHAPE_COLORS = "colors";
var SHAPE_FRAME_COLORS = "frame_colors";

var SHAPE_VERTEX_BUFFER = "vertex_buffer";
var SHAPE_COLOR_BUFFER = "color_buffer";
var SHAPE_FRAME_COLOR_BUFFER = "frame_color_buffer";
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

function createSphere(color)
{
	var radius = 1;
	var vertices = [];
	var normals = [];
	var textureCoordinates = [];
	var indices = [];
	var colors = [];
	var frameColors = [];
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
			
			colors = colors.concat(color);
			frameColors = frameColors.concat([1.0 - color[0], 1.0- color[1], 1.0- color[2], 1.0]);
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
	
	var result = createShape();
	result[SHAPE_TYPE] = SHAPE_SPHERE;
	result[SHAPE_VERTICES] = vertices;
	result[SHAPE_INDICES] = indices;
	result[SHAPE_NORMALS] = normals;
	result[SHAPE_TEXTURE_COORDINATES] = textureCoordinates;
	result[SHAPE_COLORS] = colors;
	result[SHAPE_FRAME_COLORS] = frameColors;
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
	
	return result;
}