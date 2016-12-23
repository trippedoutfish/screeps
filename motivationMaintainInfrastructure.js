//-------------------------------------------------------------------------
// MotivationMaintainInfrastructure
//-------------------------------------------------------------------------

//-------------------------------------------------------------------------
// modules
//-------------------------------------------------------------------------
var lib = require('lib');
var C = require('C');
var resourceManager = require("resourceManager");
var needBuild = require("needBuild");
var needRepair = require("needRepair");

// script prototypes
var Motivation = require('prototype.motivation')();

//-------------------------------------------------------------------------
// Declarations
//-------------------------------------------------------------------------

//-------------------------------------------------------------------------
// constructor
//-------------------------------------------------------------------------
var MotivationMaintainInfrastructure = function ()
{
	Motivation.call(this);
	this.name = "motivationMaintainInfrastructure";
	this.needs = {};
	this.needs["needBuild"] = needBuild;
	this.needs["needRepair"] = needRepair;

	this.wallHP = [0, 50000, 100000, 300000, 500000, 1000000, 5000000, 10000000, 10000000];
};

MotivationMaintainInfrastructure.prototype = Object.create(Motivation.prototype);
MotivationMaintainInfrastructure.prototype.constructor = MotivationMaintainInfrastructure;

//-------------------------------------------------------------------------
// implementation
//-------------------------------------------------------------------------
MotivationMaintainInfrastructure.prototype.getDemands = function (roomName, resources)
{
	var result = {};

	var constructionSites = Game.rooms[roomName].find(FIND_CONSTRUCTION_SITES);
	var repairSites = Game.rooms[roomName].find(FIND_STRUCTURES, {
		filter: function (s) {
			return s.hits < s.hitsMax;
		}
	});
	var progress = _.sum(constructionSites, "progress");
	var progressTotal = _.sum(constructionSites, "progressTotal");

	result.energy = progressTotal - progress + Object.keys(repairSites).length;
	result.units = this.getUnitDemands(roomName);
	result.spawn = this.getDesireSpawn(roomName, result);
	console.log('  Maintain Infrastructure Demands: Workers: ' + result.units["worker"] + ' Spawn: ' + result.spawn);
	return result;
};

MotivationMaintainInfrastructure.prototype.getDesiredSpawnUnit = function ()
{
	// repairing and building require WORK and CARRY, so always workers
	return "worker";
};

MotivationMaintainInfrastructure.prototype.getDesireSpawn = function (roomName, demands)
{
	var result = true;
	var memory = Game.rooms[roomName].memory.motivations[this.name];
	if (memory.active)
	{
		if (!lib.isNull(demands.units["worker"]) && demands.units["worker"] < resourceManager.countRoomUnits(roomName, "worker"))
			result = false;
	} else {
		result = false;
	}

	return result;
};

MotivationMaintainInfrastructure.prototype.updateActive = function (roomName, demands)
{
	var memory = Game.rooms[roomName].memory.motivations[this.name];
	if (Object.keys(demands.units).length > 0)
	{
		memory.active = true;
	} else {
		memory.active = false;
	}
};

MotivationMaintainInfrastructure.prototype.updateNeeds = function (roomName)
{
	var room = Game.rooms[roomName];
	var memory = room.memory.motivations[this.name];
	var sortedNeedsByDistance, x;

	// insure memory is initialized for needs
	if (lib.isNull(memory.needs))
	{
		memory.needs = {};
	}

	// Handle Build Needs -------------------------------------------------------------------------------------
	// look up sources and find out how many needs we should have for each one
	var constructionSites = room.find(FIND_CONSTRUCTION_SITES);
	constructionSites.forEach(function (cs) {
		if (!lib.isNull(cs))
		{
			var needName = "build." + cs.id;

			//console.log('Site: ' + cs.id);

			// create new need if one doesn't exist
			if (lib.isNull(memory.needs[needName]))
			{
				memory.needs[needName] = {};
				memory.needs[needName].type = "needBuild";
				memory.needs[needName].name = needName;
				memory.needs[needName].targetId = cs.id;
				memory.needs[needName].priority = C.PRIORITY_5;
			}
		}
	}, this);

	// Handle Repair Needs -------------------------------------------------------------------------------------
	// look up sources and find out how many needs we should have for each one
	var repairSites = room.find(FIND_STRUCTURES, {
		filter: function (s) {
			return s.hits < s.hitsMax && s.structureType != STRUCTURE_WALL;
		}
	});
	repairSites.forEach(function (rs) {
		var needName = "repair." + rs.id;

		//console.log('Source: ' + s.id + ' Available Working Spots: ' + availableHarvesters + "/" + maxHarvesters);

		// create new need if one doesn't exist
		if (lib.isNull(memory.needs[needName]))
		{
			memory.needs[needName] = {};
			memory.needs[needName].type = "needRepair";
			memory.needs[needName].name = needName;
			memory.needs[needName].targetId = rs.id;
			memory.needs[needName].priority = C.PRIORITY_1;
		}
	}, this);

	// Handle WALLRepair Needs -------------------------------------------------------------------------------------
	// look up sources and find out how many needs we should have for each one
	var wallHP = this.wallHP[room.controller.level];
	var wallRepairSites = room.find(FIND_STRUCTURES, {
		filter: function (s) {
			return s.hits < wallHP && s.structureType == STRUCTURE_WALL;
		}
	});
	wallRepairSites.forEach(function (rs) {
		var needName = "repairWall." + rs.id;

		//console.log('Source: ' + s.id + ' Available Working Spots: ' + availableHarvesters + "/" + maxHarvesters);

		// create new need if one doesn't exist
		if (lib.isNull(memory.needs[needName]))
		{
			memory.needs[needName] = {};
			memory.needs[needName].type = "needRepair";
			memory.needs[needName].name = needName;
			memory.needs[needName].targetId = rs.id;
			memory.needs[needName].priority = C.PRIORITY_1;
		}
	}, this);

	for (var needName in memory.needs)
	{
		//console.log("Need: " + needName);

		if (lib.isNull(memory.needs[needName]))
		{
			console.log("-------------- CULLING NULL maintain infrastructure need -------------");
			delete memory.needs[needName];
		}
		else
		{
			//console.log("Need.type: " + memory.needs[needName].type);
			if (lib.isNull(memory.needs[needName].type))
			{
				console.log("-------------- CULLING untyped maintain infrastructure need -------------");
				delete memory.needs[needName];

			} else if (memory.needs[needName].type == "needBuild") {
				// cull build needs
				if (lib.isNull(memory.needs[needName].targetId))
				{
					console.log("-------------- CULLING INCOMPLETE CONSTRUCTION SITE -------------");
					delete memory.needs[needName];
				}
				else
				{
					var siteId = memory.needs[needName].targetId;
					var result = _.filter(constructionSites , {"id": siteId});

					// if there are no sites, then cull it
					if (result.length == 0)
					{
						console.log("-------------- CULLING CONSTRUCTION SITE -------------");
						delete memory.needs[needName];
					}
				}

			} else if (memory.needs[needName].type == "needRepair") {
				// cull repair needs
				if (lib.isNull(memory.needs[needName].targetId))
				{
					console.log("-------------- CULLING INCOMPLETE REPAIR SITE -------------");
					delete memory.needs[needName];
				}
				else
				{

					var siteId = memory.needs[needName].targetId;
					var result = _.filter(repairSites , {"id": siteId});
					var resultWall = _.filter(wallRepairSites , {"id": siteId});

					// if there are no sites, then cull it
					if (result.length == 0 && resultWall.length == 0)
					{
						console.log("-------------- CULLING REPAIR SITE: " + siteId);
						delete memory.needs[needName];
					}
				}
			}
		}
	}

	// prioritize needs
	for (var needName in memory.needs)
	{
		var need = memory.needs[needName];
		var site = Game.getObjectById(need.targetId);

		switch (site.structureType)
		{
			case STRUCTURE_EXTENSION:
				need.priority = C.PRIORITY_3;
				break;
			case STRUCTURE_CONTAINER:
				need.priority = C.PRIORITY_2;
				break;
			default:
				need.priority = C.PRIORITY_5;
				break;
		}

		if (need.type == "needRepair" && site.structureType != STRUCTURE_WALL)
		{
			var percent = (site.hits / site.hitsMax) * 10000 / 100;

			if (percent < 25)
			{
				need.priority = C.PRIORITY_1;
			}
			else if (percent < 50)
			{
				need.priority = C.PRIORITY_3;
			}
			else if (percent < 75)
			{
				need.priority = C.PRIORITY_4;
			}
			else if (percent < 90)
			{
				need.priority = C.PRIORITY_6;
			}
			else
			{
				need.priority = C.PRIORITY_7;
			}

		} else if (need.type == "needRepair" && site.structureType == STRUCTURE_WALL)
		{
			var wallHP = this.wallHP[room.controller.level];
			var percent = (site.hits / wallHP) * 10000 / 100;

			if (percent < 25)
			{
				need.priority = C.PRIORITY_1;
			}
			else if (percent < 50)
			{
				need.priority = C.PRIORITY_2;
			}
			else if (percent < 75)
			{
				need.priority = C.PRIORITY_3;
			}
			else if (percent < 90)
			{
				need.priority = C.PRIORITY_4;
			}
			else
			{
				need.priority = C.PRIORITY_5;
			}

		}

	}
};

//-------------------------------------------------------------------------
// export
//-------------------------------------------------------------------------
module.exports = new MotivationMaintainInfrastructure();