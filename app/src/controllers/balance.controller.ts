import { fetchAll } from '../db/database.handler';
import * as conf from '../db/database.config.json';
import { User } from '../models/user';
import { Ledger } from '../models/ledger';
import { findUserById } from '../helpers/users.helper';

export async function onBalance(ctx: any): Promise<void> {
    const ledgers = await fetchAll<Ledger>(conf.tables.ledger);
    const messages = await constructMessages(ledgers);
    if (messages.length > 0) {
        for (const message of messages) {
            ctx.reply(message);
        }
    } else {
        ctx.reply('No debt....very nice!');
    }
}

async function constructMessages(ledgers: Ledger[]): Promise<string[]> {
    const messages: string[] = [];
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