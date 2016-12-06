//-------------------------------------------------------------------------
// jobGuard
//-------------------------------------------------------------------------

//-------------------------------------------------------------------------
// modules
//-------------------------------------------------------------------------

//-------------------------------------------------------------------------
// Declarations
//-------------------------------------------------------------------------

//-------------------------------------------------------------------------
// function
//-------------------------------------------------------------------------
module.exports = 
{
	//-------------------------------------------------------------------------

	"work": function (creep)
	{
		var targets = creep.room.find(Game.HOSTILE_CREEPS);

		if (targets.length)
		{
			var target = creep.pos.findNearest(Game.HOSTILE_CREEPS);
			if (target)
			{
				creep.moveTo(target);
				creep.attack(target);
			}
		}
		else
		{
			creep.rendezvous(creep, 5);
		}
	}
};