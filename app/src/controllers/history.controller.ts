import { query } from '../db/database.handler';
import * as conf from '../db/database.config.json';
import { findUserById } from '../helpers/users.helper';
import { Transaction } from '../models/transaction';

export async function onHistory(ctx: any): Promise<void> {
    const textArray = ctx.message.text.split(' ');
    let limit = 10;
    if (!isNaN(textArray[1])) {
        limit = Number(textArray[1]);
    }
    let transactions: Transaction[] = await fetchHistory(limit);
    ctx.replyWithMarkdown('\`\`\`\n' + (await constructMessages(transactions)).join('\n') + '\`\`\`');
}

async function fetchHistory(limit: number): Promise<Transaction[]> {
    return await query<Transaction>(`SELECT * FROM ${conf.tables.transactions} ORDER BY created DESC LIMIT 0, ${limit}`);
}

async function constructMessages(transactions: Transaction[]): Promise<any[]> {
    const messages: string[] = [];
    for (const transaction of transactions) {
        messages.push(await generateMessage(transaction));
    }
    return messages;
}

async function generateMessage(transaction: Transaction): Promise<any> {
    const kdo = await findUserById(transaction.kdo);
    const komu = await findUserById(transaction.komu);
    return `----- ${transaction.created.toDateString()} ${transaction.created.toLocaleTimeString()} -----\n\t${transaction.tip.toUpperCase()}\n\t${kdo.name}\t->\t${komu.name} (${transaction.vsota}€)\n\tDESCRIPTION: \t${decodeURI(transaction.description)}\n\n`;
    //return ledger;
}