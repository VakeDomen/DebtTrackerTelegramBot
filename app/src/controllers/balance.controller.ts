import { fetchAll } from '../db/database.handler';
import * as conf from '../db/database.config.json';
import { Ledger } from '../models/ledger';
import { findUserById } from '../helpers/users.helper';
import { optimiseLedgers } from '../helpers/optimizer.helper';

export async function onBalance(ctx: any): Promise<void> {
    await optimiseLedgers(ctx);
    const ledgers = await fetchAll<Ledger>(conf.tables.ledger);
    const messages = await constructMessages(ledgers);
    if (messages.length > 0) {
        await ctx.replyWithMarkdown('\`\`\`\n' + messages.join('\n') + '\`\`\`');
    } else {
        await ctx.reply('No debt....very nice!');
    }
}

async function constructMessages(ledgers: Ledger[]): Promise<string[]> {
    const messages: string[] = [];
    ledgers = ledgers.sort((l1: Ledger, l2: Ledger) => l2.dolznik > l1.dolznik ? 1 : -1);
    for (const ledger of ledgers) {
        if (ledger.vsota > 0) {
            messages.push(await generateMessage(ledger));
        }
    }
    return messages;
}

async function generateMessage(ledger: Ledger): Promise<string> {
    const dolznik = await findUserById(ledger.dolznik);
    const upnik = await findUserById(ledger.upnik);
    return `${dolznik.name} owes ${upnik.name} ${ledger.vsota}€`;
}