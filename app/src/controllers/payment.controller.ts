import { update, fetchAll } from '../db/database.handler';
import * as conf from '../db/database.config.json';
import { User } from '../models/user';
import { findUserById, findUserByTelegramId } from '../helpers/users.helper';
import { findLedgersByDolznikiAndUpniki } from '../helpers/ledgers.helper';
import { Ledger } from '../models/ledger';

interface Payment {
    recipient: string;
    ammount: number;
    overpay: number;
}

export async function onPay(ctx: any): Promise<void> {
    const sender = await findUserByTelegramId(ctx.from.id);
    const recipientsTelegram = ctx.message.entities.filter((entity: any) => entity.type === 'text_mention');
    const textArray = ctx.message.text.split(' ');
    if ((!recipientsTelegram || recipientsTelegram.length == 0) && !(textArray.length == 3 && textArray[2] == 'all')) {
        ctx.reply("Please specify who you want to pay the fee. For more help type /help.");
    }
    if (textArray.length > 3) {
        ctx.reply("Please specify who you want to pay and the fee. For more help type /help.");
    }
    if (isNaN(textArray[1]) && textArray[1] != 'debt') {
        ctx.reply("Invalid fee! Please type a number. Decimals should be denoted with a dot ('.')!");
    }
    let recipientsTelegramIds: string[] = [];
    if (textArray[2] != 'all') {
        recipientsTelegramIds = recipientsTelegram.map((user: any) => user.user.id);
    } else {
        recipientsTelegramIds = (await fetchAll<User>(conf.tables.users)).map((user: User) => { return user.telegram_id });
    }
    const recipients: User[] = await Promise.all(recipientsTelegramIds.map(async (recipientId: any) => { return await findUserByTelegramId(recipientId) }));
    let payments: Payment[] = [];
    if (textArray[1] == 'debt') {
        payments = await repayDebtFull(sender, recipients);
    } else {
        payments = await repayDebt(sender, recipients, textArray[1]);
    }
    if (payments && payments.length > 0) {
        payments.map(async (payment: Payment) => {
            ctx.reply(`${sender.name} repayed ${(await findUserById(payment.recipient)).name} ${payment.ammount}€! (overpay: ${payment.overpay})`);
        })
    } else {
        ctx.reply('No debt was repayed...');
    }
}

async function repayDebtFull(sender: User, recipients: User[]): Promise<Payment[]> {
    const ledgersToRepay = (await findLedgersByDolznikiAndUpniki([sender], recipients)).filter((ledger: Ledger) => {
        return ledger.vsota != 0;
    });
    const payments = ledgersToRepay.map((ledger: Ledger) => {
        const payment: Payment = {
            recipient: ledger.upnik,
            ammount: ledger.vsota,
            overpay: 0,
        };
        ledger.vsota = 0;
        return payment;
    });
    await Promise.all(ledgersToRepay.map(async (ledger: Ledger) => await update(conf.tables.ledger, new Ledger(ledger))));
    return payments;
}

async function repayDebt(sender: User, recipients: User[], fee: number): Promise<Payment[]> {
    const ledgersToRepay = (await findLedgersByDolznikiAndUpniki([sender], recipients)).filter((ledger: Ledger) => {
        return ledger.vsota != 0;
    });
    const payments = ledgersToRepay.map((ledger: Ledger) => {
        const payment: Payment = {
            recipient: ledger.upnik,
            ammount: ledger.vsota,
            overpay: ledger.vsota < fee ? fee - ledger.vsota : 0
        };
        ledger.vsota = ledger.vsota < fee ? ledger.vsota - fee : 0;
        return payment;
    });
    // TODO: create debt on overpay 

    await Promise.all(ledgersToRepay.map(async (ledger: Ledger) => await update(conf.tables.ledger, new Ledger(ledger))));
    return payments;
}

