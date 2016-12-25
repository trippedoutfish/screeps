//-------------------------------------------------------------------------
// needTransferEnergy
//-------------------------------------------------------------------------

//-------------------------------------------------------------------------
// modules
//-------------------------------------------------------------------------
var lib = require('lib');
var C = require('C');
var resourceManager = require("resourceManager");

// script prototypes
var Need = require('prototype.need')();

//-------------------------------------------------------------------------
// Declarations
//-------------------------------------------------------------------------

//-------------------------------------------------------------------------
// function
//-------------------------------------------------------------------------
var NeedTransferEnergy = function ()
{
	Need.call(this);
	this.name = "needTransferEnergy";
};

NeedTransferEnergy.prototype = Object.create(Need.prototype);
NeedTransferEnergy.prototype.constructor = NeedTransferEnergy;

NeedTransferEnergy.prototype.getUnitDemands = function(roomName, memory, motivationName)
{
	var result = {};
	var target = Game.getObjectById(memory.targetId);
	var energy, energyCapacity, neededEnergy;
	var worker = lib.nullProtect(resourceManager.getRoomUnits(roomName, "worker")[0], {});
	var workerCapacity = lib.nullProtect(worker.carryCapacity, 50);

	if (!lib.isNull(target.energy))
	{
		energyCapacity = target.energyCapacity;
		energy = target.energy;
	} else {
		energyCapacity = target.progressTotal;
		energy = target.progress;
	}

	neededEnergy = energyCapacity - energy;
	result["worker"] = Math.ceil(neededEnergy / workerCapacity);

	//console.log(JSON.stringify(memory));
	//console.log("getUnitDemands: " + energy + "/" + energyCapacity + "/" + neededEnergy);
	//console.log("   workers: carry: " + workerCapacity + " demanded workers: " + result["worker"]);

	return result;
};


module.exports = new NeedTransferEnergy();