import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import { onStart } from './controllers/start.controller';
import { onHelp } from './controllers/help.controller';
import { onPay } from './controllers/payment.controller';
import { onBalance } from './controllers/balance.controller';

let bot: Telegraf;

function checkEnv(): void {
    console.log("Checking credentials...");
    dotenv.config();
    if (!process.env.BOT_TOKEN) {
        console.log("Bot token not specified!");
        process.exit(1);
    }
    console.log("Crednetials checked!");
}

function start(): void {
    checkEnv();
    initBot();
    console.log("Launching bot...");
    bot.launch();
    console.log("Done!");
}

function initBot(): void {
    console.log("Setting up bot...");
    bot = new Telegraf(process.env.BOT_TOKEN || '');
    bot.start(onStart);
    bot.command('help', onHelp);
    bot.command('pay', onPay);
    bot.command('balance', onBalance);
    console.log("Bot set up!");
}

start();
