var LIGHT_DIFFUSE = "light_diffuse";
var LIGHT_SPECULAR = "light_specular";
var LIGHT_DISTANCE = "light_distance";
var LIGHT_ATTENUATION = "light_attenuation";

function createLight()
{
	var result = {};
	result[LIGHT_DIFFUSE] = vec4(1.0, 1.0, 1.0, 1.0);
	result[LIGHT_SPECULAR] = vec4(1.0, 1.0, 1.0, 1.0);
	result[LIGHT_DISTANCE] = 1.0;
	result[LIGHT_ATTENUATION] = 0.0;
	
	result.getPosition = function()
	{
		var position = vec4(0.0, 0.0, 0.0, 1.0);
		return position;
	}
	
	return result;
}