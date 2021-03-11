export async function onHelp(ctx) {
    await ctx.reply(`All commands:`);
    await ctx.reply(`/loan <amount> <@people>\nThe command loans money to the specified people. The action is constructed from 3 parts (<command> <amount> <poeple>). Amount is a numeric value where the decimal point may be specified with y dot '.' and not comma ','. You may list as many people as you wish as long as they are tagged with a mention (@name). The fee will bi equaly split among the target people.`);
    await ctx.reply(`/balance\nThe command will display the current state of debt.`);
    await ctx.reply(`/pay <amount> <@people>\nThe command will repay the full amount specified to all mentioned people (as long as they are mentioned with @name). If you pay more than you own, the reviever will own you the difference after the transaction completes.`);
}
