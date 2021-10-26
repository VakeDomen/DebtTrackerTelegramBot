import { fetchAll } from '../db/database.handler';
import * as conf from '../db/database.config.json';
import { User } from '../models/user';
import { findUserById, findUserByTelegramId } from '../helpers/users.helper';
import { Transaction } from '../models/transaction';
import { executeTransactions } from '../helpers/transaction.helper';

export async function onLoan(ctx: any): Promise<void> {
    const recipientsTelegram = ctx.message.entities.filter((entity: any) => entity.type === 'text_mention');
    const textArray = ctx.message.text.split(' ');
    if (textArray.length < 3) {
        ctx.reply("Please specify who you want to lend the fee and the amount. For more help type /help.");
        return;
    }
    if ((!recipientsTelegram || recipientsTelegram.length == 0) && !(textArray.length == 3 && textArray[2] == 'all')) {
        ctx.reply("Please specify who you want to lend the fee. For more help type /help.");
        return;
    }
    if (isNaN(textArray[1])) {
        ctx.reply("Invalid fee! Please type a number. Decimals should be denoted with a dot ('.')!");
        return;
    }
    let recipientsTelegramIds: string[] = [];
    if (textArray[2] != 'all') {
        recipientsTelegramIds = recipientsTelegram.map((user: any) => user.user.id);
    } else {
        recipientsTelegramIds = (await fetchAll<User>(conf.tables.users)).map((user: User) => { return user.telegram_id });
    }
    const recipients: User[] = await Promise.all(recipientsTelegramIds.map(async (recipientId: any) => { return await findUserByTelegramId(recipientId) }));
    const description = extractDescription(ctx, recipientsTelegram);
    const sender = await findUserByTelegramId(ctx.from.id);
    const fee = extractFee(textArray[1], recipients);
    let payments: Transaction[] = await createLoans(sender, recipients, fee, description);
    payments.map(async (payment: Transaction) => {
        ctx.reply(`${sender.name} loaned ${(await findUserById(payment.komu)).name} ${payment.vsota}€!`);
    });
}

async function createLoans(sender: User, recipients: User[], fee: number, description: string): Promise<Transaction[]> {
    let transactions: Transaction[] = recipients.map((recipient: User) => {
        const transaction = new Transaction({
            tip: 'loan',
            kdo: sender.id,
            komu: recipient.id,
            vsota: fee,
            description: description,
            created: new Date().toISOString().slice(0, 19).replace('T', ' '),
        });
        transaction.generateId();
        return transaction;
    });
    await executeTransactions(transactions);
    return transactions;

}

function extractDescription(ctx: any, numOfMentions: number): string {
    const text: string[] =  ctx.message.text.split(' ');
    console.log(text.slice(numOfMentions + 1, text.length - 1));
    return encodeURI(text.slice(numOfMentions + 1, text.length).join(' '));
}

function extractFee(fee: string, recipients: User[]): number {
    return +(Number(fee) / recipients.length).toFixed(2);
}