import { fetchAll } from '../db/database.handler';
import * as conf from '../db/database.config.json';
import { User } from '../models/user';
import { Ledger } from '../models/ledger';

export async function onBalance(ctx: any): Promise<void> {
    const ledgers = await fetchAll<Ledger>(conf.tables.ledger);
    const users = await fetchAll<User>(conf.tables.users);
    const messages = constructMessages(ledgers, users);
    if (messages.length > 0) {
        for (const message of messages) {
            ctx.reply(message);
        }
    } else {
        ctx.reply('No debt....very nice!');
    }
}

function constructMessages(ledgers: Ledger[], users: User[]): string[] {
    const messages: string[] = [];
    for (const ledger of ledgers) {
        if (ledger.vsota > 0) {
            messages.push(generateMessage(ledger, users));
        }
    }
    return messages;
}

function generateMessage(ledger: Ledger, users: User[]): string {
    const dolznik = findUserById(ledger.dolznik, users);
    const upnik = findUserById(ledger.upnik, users);
    return `${dolznik.name} owes ${upnik.name} ${ledger.vsota}€`;
}

function findUserById(id: string, users: User[]): User {
    for (const user of users) {
        if (user.id === id) {
            return user;
        }
    }
    return new User({});
}