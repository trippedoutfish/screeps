//-------------------------------------------------------------------------
// prototype.creep
//-------------------------------------------------------------------------
// memory
// ------------------------------------------------------------------------
// motive: {}
//      room: string room name, the home room of the creep
//      motivation: string motivation name, the motivation the creep is assigned to
//      need:  string need name, the need the creep is assigned to
// unit: string - unit type
//-------------------------------------------------------------------------
// modules
//-------------------------------------------------------------------------
module.exports = function()
{
    Creep.prototype.moveToRange = function (target, range)
	{
		if (target.pos.inRangeTo(this.pos, range - 1))
		{
			this.moveTo(this.pos.x + this.pos.x - target.pos.x, creep.pos.y + creep.pos.y - target.pos.y);
			return true;
		}
		else if (target.pos.inRangeTo(this.pos, range))
		{
			return true;
		}
		else
		{
			this.moveTo(target);
			return true;
		}
	};

	Creep.prototype.avoidHostile = function (range)
	{
		if (typeof(range) === 'undefined')
		{
			range = 3;
		}
		var inRange = this.pos.findInRange(Game.HOSTILE_CREEPS, range);
		if (inRange && inRange.length)
		{
			var target = this.pos.findNearest(Game.HOSTILE_CREEPS);
			if (target)
			{
				this.moveAwayFromTarget(target);
				return true;
			}
		}
		return false;
	};

	Creep.prototype.moveAwayFromTarget = function (target)
	{
		var avoid = this.pos.getDirectionTo(target);
		this.move((avoid + 4) % 8);
	};

	Creep.prototype.rendezvous = function (range)
	{
		var flags = this.room.find(FIND_FLAGS, {'name': 'Flag1'});

		//console.log(JSON.stringify(flags));
		if (this.memory.rendezvous)
		{
			this.moveToRange(this.memory.rendezvous, range);
		}
		else if (flags && flags.length)
		{
			var flag = flags[0];
			this.moveToRange(flag, range);
		}
		else
		{
			this.moveToRange(this.getSpawn(), range);
		}
	};
    
    Creep.prototype.carrying = function()
    {
        var result = 0;

        if (this.carryCapacity > 0)
        {
            result = _.sum(this.carry);
        }
        
        return result;
    };
    
    Creep.prototype.percentFull = function()
    {
        var percent = 0;

        if (this.carryCapacity > 0)
        {
            percent = (this.carrying / this.carryCapacity) * 10000 / 100
        }
        
        return percent;
    };

	Creep.prototype.getSpawn = function()
	{
		var creepSpawn = lib.nullProtect(Game.spawns[this.memory.spawn], this.pos.findClosestByPath(FIND_MY_SPAWNS, { ignoreCreeps: true }));
		return creepSpawn;		
	};

	Creep.prototype.getHasPart = function (part)
	{
		var result = false;
		this.body.forEach(function (i) {
			if (i.type == part)
			{
				result = true;
			}
		}, this);
		return result;
	};

	Creep.prototype.initMotive = function()
	{
		if (lib.isNull(this.memory.motive))
		{
			this.memory.motive = {};
			this.memory.motive.room = this.room.name;
			this.memory.motive.motivation = "";
			this.memory.motive.need = "";
		}
	};

	Creep.prototype.assignMotive = function (roomName, motivationName, needName)
	{
		this.say(needName);
		this.memory.motive.motivation = motivationName;
		this.memory.motive.need = needName;
	};

	Creep.prototype.deassignMotive = function ()
	{
		this.say("Done!");
		this.memory.motive.motivation = "";
		this.memory.motive.need = "";
	};

	Creep.prototype.assignToLongDistanceHarvest = function ()
	{
		var room = roomManager.getLongDistanceHarvestTarget();
		if (!lib.isNull(room))
		{
			this.memory.motive.room = room;
			this.memory.motive.motivation = "";
			this.memory.motive.need = "";
			this.memory.sourceId = "";
			this.memory.sourceType = 0;
		}
	};

};