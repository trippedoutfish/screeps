//-------------------------------------------------------------------------
// Room.prototype
//-------------------------------------------------------------------------

/***********************************************************************************************************************
 * functions
 */

/**
 * Insure all memory is setup for a room
 */
Room.prototype.init = function ()
{
	if(lib.isNull(this.memory.longDistanceHarvestTargets))
	{
		this.memory.longDistanceHarvestTargets = [];
	}
};

Room.prototype.initMemCache = function (forceRefresh = false)
{
	// insure the memory object exists
	if (lib.isNull(this.memory.cache) || forceRefresh)
	{
		this.memory.cache = {};
		forceRefresh = true;
	}

	this.updateStructureCache(forceRefresh);
	this.updateSourceCache(forceRefresh);
	this.updateDroppedCache(forceRefresh);
};

/**
 * Updates the memory structure cache to reduce the number of Room.find() calls for structures
 */
Room.prototype.updateStructureCache = function (forceRefresh = false)
{
	// insure the memory object exists
	if (lib.isNull(this.memory.cache.structures))
	{
		this.memory.cache.structures = {};
		forceRefresh = true;
	}

	if (Game.time % 10 === 0)
		forceRefresh = true;

	if (forceRefresh)
	{
		let structures = this.memory.cache.structures;
		let roomLevel = this.getControllerLevel();
		let room = this;

		_.forEach(STRUCTURES , function (s)
		{
			//console.log(`Type: ${s} Level: ${roomLevel}`);
			if (!lib.isNull(CONTROLLER_STRUCTURES[s]) && CONTROLLER_STRUCTURES[s][roomLevel] >= 0)
			{
				//console.log(`Checking ${s}...`);
				let foundStructures = room.find(FIND_STRUCTURES , { filter: function (st)
				{
					return st.structureType === s;
				}});
				//console.log(`Found ${foundStructures}...`);


				// map structure ids to the memory object
				structures[s] = _.map(foundStructures, function (st) {
					return st.id;
				});
			}
		});
	}
};

Room.prototype.updateSourceCache = function (forceRefresh = false)
{
	// insure the memory object exists
	if (lib.isNull(this.memory.cache.sources))
	{
		this.memory.cache.sources = {};
		forceRefresh = true;
	}

	if (Game.time % 100 === 0)
		forceRefresh = true;

	if (forceRefresh)
	{
		let foundSources = this.find(FIND_SOURCES);
		//console.log(`Found: ${foundSources}`);

		// map structure ids to the memory object
		this.memory.cache.sources = _.map(foundSources, function (s) {
			return s.id;
		});
		//console.log(`Result ${this.memory.cache.sources}`);
	}
};

Room.prototype.updateDroppedCache = function (forceRefresh)
{
	// don't require forceRefresh to be passed
	if (lib.isNull(forceRefresh)) forceRefresh = false;
	// insure the memory object exists
	if (lib.isNull(this.memory.cache.dropped))
	{
		this.memory.cache.dropped = {};
		forceRefresh = true;
	}

	if (Game.time % 2 === 0)
		forceRefresh = true;

	if (forceRefresh)
	{
		let foundDropped = this.find(FIND_DROPPED_RESOURCES);
		//console.log(`Found: ${foundDropped}`);

		// map structure ids to the memory object
		this.memory.cache.dropped = _.map(foundDropped, function (s) {
			return s.id;
		});
		//console.log(`Result ${this.memory.cache.sources}`);
	}
};





/**
 * This function updates the state of the energy pickup mode for this room. This is how creeps who need energy will go
 * about acquiring it.
 */
Room.prototype.updateEnergyPickupMode = function ()
{

	result = C.ROOM_ENERGYPICKUPMODE_NOENERGY;
	if (this.memory.cache.sources.length > 0)
	{
		result = C.ROOM_ENERGYPICKUPMODE_HARVEST;

		let numContainers = lib.nullProtect(this.memory.cache.structures[STRUCTURE_CONTAINER], []).length;
		let numStorage = lib.nullProtect(this.memory.cache.structures[STRUCTURE_STORAGE], []).length;
		let containers = _.map(this.memory.cache.structures[STRUCTURE_CONTAINER], function (cid) {
			return Game.getObjectById(cid);
		});
		let containerEnergy = _.sum(containers, function (c) {
			return c.store[RESOURCE_ENERGY];
		});

		if (numContainers >= this.memory.cache.sources.length && (containerEnergy > 0 || strategyManager.countRoomUnits(this.name, "harvester") > 0))
		{
			result = C.ROOM_ENERGYPICKUPMODE_CONTAINER;
		}

		if (numStorage > 0)
		{
			if (strategyManager.countRoomUnits(this.name, "harvester") > 0 && strategyManager.countRoomUnits(this.name, "hauler") > 0)
				result = C.ROOM_ENERGYPICKUPMODE_STORAGE;
			else
			{
				let storage = Game.getObjectById(this.memory.cache.structures[STRUCTURE_STORAGE][0]);
				if (storage.store[RESOURCE_ENERGY] > 0)
					result = C.ROOM_ENERGYPICKUPMODE_STORAGE;
			}
		}
	}

	this.memory.energyPickupMode = result;
	return result;
};

Room.prototype.getControllerLevel = function ()
{
	let result = 0;
	if (!lib.isNull(this.controller))
	{
		result = this.controller.level;
	}
	return result;
};

/***********************************************************************************************************************
 * Resource related functions
 *
 */

Room.prototype.updateResources = function ()
{
	let debug = false;
	// determine room resources ----------------------------------------------------------------------------
	// energy
	this.memory.resources = {};
	this.memory.resources.spawnEnergy = this.getSpawnEnergy();

	// get room collector status
	this.memory.resources.controllerStatus = this.updateControllerStatus();

	// output info
	lib.log("---- Room Resources: " + this.name, debug);
	lib.log('  Spawn Energy: ' + this.memory.resources.spawnEnergy.energy + '/'
		+ this.memory.resources.spawnEnergy.energyCapacity
		+ ' Controller Level: ' + this.memory.resources.controllerStatus.level + ' '
		+ this.memory.resources.controllerStatus.progress + '/' + this.memory.resources.controllerStatus.progressTotal
		+ ' Downgrade: ' + this.memory.resources.controllerStatus.ticksToDowngrade, debug);

	// get unit resources
	this.memory.resources.units = {};
	for (let unitName in units)
	{

		this.memory.resources.units[unitName] = {};
		this.memory.resources.units[unitName].total = strategyManager.countRoomUnits(this.name, unitName);
		this.memory.resources.units[unitName].allocated = 0;
		this.memory.resources.units[unitName].unallocated = this.memory.resources.units[unitName].total;
		this.memory.resources.units[unitName].unassigned = strategyManager.countRoomUnassignedUnits(this.name, unitName);
		this.memory.resources.units[unitName].assigned = strategyManager.countRoomAssignedUnits(this.name, unitName);
		lib.log("  " + unitName + " total: " + this.memory.resources.units[unitName].total
			+ " Assigned/UnAssigned: " + this.memory.resources.units[unitName].assigned
			+ "/" + this.memory.resources.units[unitName].unassigned, debug);
	}

	return this.memory.resources;
};

Room.prototype.getSpawnEnergy = function ()
{
	let result = {};
	result.energy = 0;
	result.energyCapacity = 0;

	// Enumerate over spawns
	for (let spawnName in Game.spawns)
	{
		let spawn = Game.spawns[spawnName];
		if (spawn.room.name === this.name)
		{
			result.energy += spawn.energy;
			result.energyCapacity += spawn.energyCapacity;
		}
	}

	let extenderEnergy = this.getExtenderEnergy();
	result.energy += extenderEnergy.energy;
	result.energyCapacity += extenderEnergy.energyCapacity;

	return result;
};

Room.prototype.getExtenderEnergy = function ()
{
	let result = {};
	result.energy = 0;
	result.energyCapacity = 0;

	let extenders = this.find(FIND_MY_STRUCTURES , {filter: {structureType: STRUCTURE_EXTENSION}});
	extenders.forEach(function (ex)
	{
		result.energy += ex.energy;
		result.energyCapacity += ex.energyCapacity;
	} , this);

	return result;
};

Room.prototype.updateControllerStatus = function ()
{
	this.memory.controllerStatus = {};
	// Enumerate over spawns
	let controller = this.controller;

	if (!lib.isNull(controller) && controller.my)
	{
		this.memory.controllerStatus.progress = controller.progress;
		this.memory.controllerStatus.progressTotal = controller.progressTotal;
		this.memory.controllerStatus.ticksToDowngrade = controller.ticksToDowngrade;
		this.memory.controllerStatus.level = controller.level;
	} else {
		this.memory.controllerStatus.progress = 0;
		this.memory.controllerStatus.progressTotal = 0;
		this.memory.controllerStatus.ticksToDowngrade = 0;
		this.memory.controllerStatus.level = 0;
	}

	return this.memory.controllerStatus;
};

/***********************************************************************************************************************
 * Creep finding functions
 *
 */

/**
 * count creeps present in a room
 */
Room.prototype.countCreeps = function ()
{
	let result = this.getCreeps().length;

	return result;
};

/**
 * returns creeps present in a room
 */
Room.prototype.getCreeps = function ()
{
	let roomName = this.name;
	let result = _.filter(Game.creeps , function (creep)
	{
		return creep.room.name === roomName;
	});
	return result;
};

/**
 * returns number of creeps in room of a unit type
 * @param unitName
 */
Room.prototype.countUnits = function (unitName)
{
	let result = this.getUnits(unitName).length;
	return result;
};

/**
 * returns creeps in room of unit type
 * @param unitName
 */
Room.prototype.getUnits = function (unitName)
{
	let roomName = this.name;
	let result = _.filter(Game.creeps , function (creep)
	{
		return creep.room.name === roomName
		&& creep.memory.unit === unitName;
	});
	return result;
};

Room.prototype.getLostCreeps = function ()
{
	let roomName = this.name;

	let result = _.filter(Game.creeps , function (creep)
	{
		return creep.room.name === roomName
			&& creep.memory.motive.room != roomName;
	});

	return result;
};

Room.prototype.handleLostCreeps = function()
{
	let lostCreeps = this.getLostCreeps();
	lostCreeps.forEach(function (creep)
	{
		let room = Game.rooms[creep.memory.motive.room];

		if (!lib.isNull(room) && !lib.isNull(room.controller))
		{
			creep.moveTo(room.controller);
			creep.say("Exit!");
		} else {
			let exit = creep.room.findExitTo(creep.memory.motive.room);
			// and move to exit
			creep.moveTo(creep.pos.findClosestByPath(exit, { ignoreCreeps: true }));
			creep.say("Leave!");
		}
	}, this);
};

Room.prototype.safeModeFailsafe = function ()
{
	let debug = false;
	let room = Game.rooms[this.name];
	if (room.controller.my)
	{
		let controller = room.controller;
		let hostiles = this.getAgressivesPresent(this.name);
		//safeMode	number	How many ticks of safe mode remaining, or undefined.
		let safeMode = lib.nullProtect(controller.safeMode , 0);
		//safeModeAvailable	number	Safe mode activations available to use.
		let safeModeAvailable = lib.nullProtect(controller.safeModeAvailable , 0);
		//safeModeCooldown	number	During this period in ticks new safe mode activations will be blocked, undefined if cooldown is inactive.
		let safeModeCooldown = lib.nullProtect(controller.safeModeCooldown , 0);

		if (hostiles.length && !safeMode && safeModeAvailable && !safeModeCooldown && controller.level < 4)
		{
			lib.log("!!!!!!!!!!!!!!! ACTIVATING SAFE MODE !!!!!!!!!!!!!!!", debug);
			controller.activateSafeMode();
		}
		lib.log(">>>> Safe Mode Status: Hostiles: " + hostiles.length
			+ " SafeMode: " + safeMode
			+ " SafeModeAvailable: " + safeModeAvailable
			+ " SafeModeCooldown: " + safeModeCooldown, debug);
	}
};

Room.prototype.getAgressivesPresent = function ()
{
	let room = Game.rooms[this.name];
	let hostileCreeps = room.find(FIND_HOSTILE_CREEPS , {
		filter: function (creep)
		{
			//console.log(JSON.stringify(creep.body));
			return _.find(creep.body , function (p)
			{
				return p.type === ATTACK || p.type === RANGED_ATTACK || p.type === CLAIM;
			});
		}
	});
	return hostileCreeps;
};

Room.prototype.motivateTowers = function ()
{
	if (this.controller.my)
	{
		// find all towers
		let towers = this.find(FIND_STRUCTURES , {
			filter: function (s)
			{
				return s.structureType === STRUCTURE_TOWER
			}
		});
		// for each tower
		towers.forEach(function (tower)
		{
			tower.autoAttack();
			tower.autoCreepHeal();
			tower.autoRepair();
		} , this);
	}
};

Room.prototype.updateThreat = function ()
{
	let numAggressives = this.getAgressivesPresent().length;
	let timeSinceSeen;

	if (lib.isNull(this.memory.threat))
	{
		this.memory.threat = {};
		this.memory.threat.lastSeen = 0;
		this.memory.threat.count
	}

	timeSinceSeen = Game.time - this.memory.threat.lastSeen;

	// update enemy count
	if (numAggressives > this.memory.threat.count)
		this.memory.threat.count = numAggressives;

	// update based on time
	if (numAggressives > 0)
		this.memory.threat.lastSeen = Game.time;
	else if (timeSinceSeen > config.garrisonTime)
	{
		this.memory.threat.count = 0;
	}

};

Room.prototype.getMaxHarvesters = function ()
{
	let sources = this.find(FIND_SOURCES);
	let result = 0;
	_.forEach(sources, function (s) {
		result += s.getMaxHarvesters();
	});

	//console.log("MAX: " + result);
	return result;
};

/*
 * NOTES: sentences are broken down using | to separate pieces
 *        public will default to true
 * Room.prototype.sing(sentence, public)
 *   all creeps in the room will sing parts of the sentence
 *     from top left to bottom right. the sentence will repeat
 *     if there are more creeps than parts in the sentence
 */
Room.prototype.sing = function(sentence, public){
	if(public === undefined)public = true;
	let words = sentence.split(" ");
	let creeps = _.filter(Game.creeps, (c) => c.room.name === this.name);
	creeps = _.sortBy(creeps, function(c){return (c.pos.x + (c.pos.y*50))});

	for(let i in creeps){
		creeps[i].say(words[i % words.length], public);
	}
};

module.exports = function() {};