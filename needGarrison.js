//-------------------------------------------------------------------------
// needGarrison
//-------------------------------------------------------------------------

//-------------------------------------------------------------------------
// modules
//-------------------------------------------------------------------------
// script prototypes
let Need = require('Need.prototype')();

//-------------------------------------------------------------------------
// Declarations
//-------------------------------------------------------------------------

//-------------------------------------------------------------------------
// function
//-------------------------------------------------------------------------
let NeedGarrison = function ()
{
	Need.call(this);
	this.name = "needGarrison";
};

NeedGarrison.prototype = Object.create(Need.prototype);
NeedGarrison.prototype.constructor = NeedGarrison;

NeedGarrison.prototype.getUnitDemands = function(roomName, memory, motivationName)
{
	let room = Game.rooms[roomName];
	let unitCount = room.memory.threat.count;
	let result = {};
	result["guard"] = unitCount * 2;
	result["rangedGuard"] = unitCount * 2;
	result["healer"] = unitCount * 2;
	return result;
};


module.exports = new NeedGarrison();
