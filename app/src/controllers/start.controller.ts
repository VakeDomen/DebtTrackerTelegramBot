let isStarted: boolean = false;

export function onStart(ctx) {
    if (!isStarted) {
        console.log(ctx.from)
        ctx.reply(`Hello ${ctx.from.first_name}!`);
        ctx.reply(`If you want to know what i can do, type /help and I will give you a description of all the commands i know!`);
    } else {
        ctx.reply(`Already running...type /help`);
    }
}