import { update, fetchAll } from '../db/database.handler';
import * as conf from '../db/database.config.json';
import { User } from '../models/user';
import { Ledger } from '../models/ledger';
import { findUserById, findUserByTelegramId } from '../helpers/users.helper';
import { findLedgersByDolznikiAndUpniki } from '../helpers/ledgers.helper';

export async function onLoan(ctx: any): Promise<void> {
    const recipientsTelegram = ctx.message.entities.filter((entity: any) => entity.type === 'text_mention');
    const textArray = ctx.message.text.split(' ');
    if (textArray.length > 3) {
        ctx.reply("Please specify who you want to lend the fee and the ammount. For more help type /help.");
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
    
    const sender = await findUserByTelegramId(ctx.from.id);
}