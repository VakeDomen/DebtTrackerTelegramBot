import { fetch } from '../db/database.handler';
import * as conf from '../db/database.config.json';
import { User } from '../models/user';

export async function findUserById(id: string): Promise<User> {
    const user = (await fetch<User>(conf.tables.users, new User({id: id}))).pop();
    if (user) {
        return user;
    } else {
        return new User({});
    }
}

export async function findUserByTelegramId(id: string): Promise<User> {
    const user = (await fetch<User>(conf.tables.users, new User({telegram_id: id}))).pop();
    if (user) {
        return user;
    } else {
        return new User({});
    }
}