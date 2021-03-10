import { fetch, insert } from '../db/database.handler';
import * as conf from '../db/database.config.json';
import { User } from '../models/user';
import { Ledger } from '../models/ledger';
import { DbItem } from '../models/core/db.item';

let isStarted: boolean = false;

export async function onStart(ctx: any): Promise<void> {
    if (!isStarted) {
        ctx.reply(`Hello ${ctx.message.chat.title}!`);
        ctx.reply(`I'm setting things up, gimme a sec...`);
        await insertUsers(await ctx.getChatAdministrators());
        await createLedger();
        ctx.reply(`All done setting up!`);
        ctx.reply(`If you want to know what i can do, type /help and I will give you a description of all the commands i know!`);
        isStarted = true;
    } else {
        ctx.reply(`Already running...type /help`);
    }
}

async function createLedger(): Promise<void> {
    const existingLedgers = await fetch<Ledger>(conf.tables.ledger, new DbItem({}));
    const existingUsers = await fetch<User>(conf.tables.users, new DbItem({}));
    const ledgers = createEmptyLedgers(existingUsers);
    const toInsert: any[] = []
    if (existingLedgers) {
        for (const ledger of ledgers) {
            let found = false;
            for (const existingLedger of existingLedgers) {
                if (ledger.dolznik === existingLedger.dolznik && ledger.upnik === existingLedger.upnik) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                toInsert.push(ledger);
            }
        }
    } else {
        toInsert.push(...ledgers);
    }
    await Promise.all(toInsert.map(async (ledger: Ledger) => await insert(conf.tables.ledger, ledger)));
}

async function insertUsers(users: any): Promise<void> {
    const existingUsers = await fetch<User>(conf.tables.users, new DbItem({}));
    const toIsert: any[] = [];
    if (existingUsers) {
        for (const user of users) {
            let found = false;
            for (const existingUser of existingUsers) {
                if (user.user.id == existingUser.telegram_id) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                toIsert.push(user);
            }
        }
    } else {
        toIsert.push(...users);
    }
    let insertable: User[] = toIsert.map((telegramUser: any) => { return telegramUserToInsertableUser(telegramUser) });
    await Promise.all(insertable.map(async (user: User) => await insert(conf.tables.users, user)));
}

function createEmptyLedgers(existingUsers: User[]): Ledger[] {
    const ledgers: Ledger[] = [];
    for (const user1 of existingUsers) {
        for (const user2 of existingUsers) {
            if (user1.id !== user2.id) {
                const ledger = new Ledger({
                    dolznik: user1.id,
                    upnik: user2.id,
                    vsota: 0,
                });
                ledger.generateId();
                ledgers.push(ledger);
            }
        }
    }
    return ledgers;
}

function telegramUserToInsertableUser(telegramUser: any): User {
    const user = new User({
        telegram_id: telegramUser.user.id,
        name: telegramUser.user.first_name,
    });
    user.generateId();
    return user;
}