//-------------------------------------------------------------------------
// StructureTower.prototype
//-------------------------------------------------------------------------


module.exports = function()
{
	StructureTower.prototype.autoAttack = function ()
	{
		var target = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
		if (!lib.isNull(target))
		{
			this.attack(target);
		}
	};
};
