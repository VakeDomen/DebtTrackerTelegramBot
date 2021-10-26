import { fetchAll } from '../db/database.handler';
import * as conf from '../db/database.config.json';
import { User } from '../models/user';
import { findUserById, findUserByTelegramId } from '../helpers/users.helper';
import { findLedgersByDolznikiAndUpniki } from '../helpers/ledgers.helper';
import { Transaction } from '../models/transaction';
import { executeTransactions } from '../helpers/transaction.helper';

export async function onPay(ctx: any): Promise<void> {
    const sender = await findUserByTelegramId(ctx.from.id);
    const recipientsTelegram = ctx.message.entities.filter((entity: any) => entity.type === 'text_mention');
    const textArray = ctx.message.text.split(' ');
    if (textArray.length < 3) {
        ctx.reply("Please specify who you want to pay and the fee. For more help type /help.");
        return;
    }
    if ((!recipientsTelegram || recipientsTelegram.length == 0) && !(textArray.length == 3 && textArray[2] == 'all')) {
        ctx.reply("Please specify who you want to pay the fee. For more help type /help.");
        return;
    }
    if (isNaN(textArray[1]) && textArray[1] != 'debt') {
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
    let payments: Transaction[] = [];
    if (textArray[1] == 'debt') {
        payments = await repayDebtFull(sender, recipients, description);
    } else {
        payments = await repayDebt(sender, recipients, description, textArray[1]);
    }
    if (payments && payments.length > 0) {
        payments.map(async (payment: Transaction) => {
            ctx.reply(`${sender.name} repaid ${(await findUserById(payment.komu)).name} ${payment.vsota}€!`);
        })
    } else {
        ctx.reply('No debt was repaid...');
    }
}

function extractDescription(ctx: any, numOfMentions: number): string {
    const text: string[] =  ctx.message.text.split(' ');
    console.log(text.slice(numOfMentions + 1, text.length - 1));
    return encodeURI(text.slice(numOfMentions + 1, text.length).join(' '));
}

async function repayDebtFull(sender: User, recipients: User[], description: string): Promise<Transaction[]> {
    const transactions: Transaction[] = await Promise.all(recipients.map(async (recipient: User) => {
        const ledger = await findLedgersByDolznikiAndUpniki([recipient], [sender]);
        const transaction = new Transaction({
            tip: 'payment',
            kdo: sender.id,
            komu: recipient.id,
            vsota: ledger[0].vsota,
            description: description,
            created: new Date().toISOString().slice(0, 19).replace('T', ' '),
        });
        transaction.generateId();
        return transaction;
    }));
    await executeTransactions(transactions);
    return transactions;
}

async function repayDebt(sender: User, recipients: User[],description: string, fee: number): Promise<Transaction[]> {
    const transactions: Transaction[] = recipients.map((recipient: User) => {
        const transaction = new Transaction({
            tip: 'payment',
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

