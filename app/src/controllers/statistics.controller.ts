import { agreagteTransactions } from '../helpers/transaction.helper';
import { findUserById } from '../helpers/users.helper';

export async function onStats(ctx: any): Promise<void> {
    let messages: string[] = [];

    messages.push('-------- TOTAL LOANS --------');
    const loans = await agreagteTransactions('loan');
    messages.push(...(await constructMessagesLoan(loans)));

    messages.push('------- TOTAL BORROWS -------');
    const borrows = await agreagteTransactions('borrow');
    messages.push(...(await constructMessagesBorrow(borrows)));

    if (messages.length > 0) {
        await ctx.replyWithMarkdown('\`\`\`\n' + messages.join('\n') + '\`\`\`');
    } else {
        await ctx.reply('No debt....very nice!');
    }
}

async function constructMessagesLoan(loans:  [string, number, number][]): Promise<string[]> {
    const messages: string[] = [];
    loans = loans.sort((t1: [string, number, number], t2: [string, number, number]) => t2[0] > t1[0] ? 1 : -1);
    for (const loan of loans) {
        if (loan[1] > 0) {
            messages.push(await generateMessageLoan(loan));
        }
    }
    return messages;
}

async function constructMessagesBorrow(loans:  [string, number, number][]): Promise<string[]> {
    const messages: string[] = [];
    loans = loans.sort((t1: [string, number, number], t2: [string, number, number]) => t2[0] > t1[0] ? 1 : -1);
    for (const loan of loans) {
        if (loan[1] > 0) {
            messages.push(await generateMessageBorrow(loan));
        }
    }
    return messages;
}

async function generateMessageLoan(loan: [string, number, number]): Promise<string> {
    const upnik = await findUserById(loan[0]);
    const totalLoan = loan[1];
    const loanTimes = loan[2];
    return `${upnik} loaned ${totalLoan.toFixed(2)}€ (${loanTimes}x)`;
}

async function generateMessageBorrow(loan: [string, number, number]): Promise<string> {
    const dolznik = await findUserById(loan[0]);
    const totalLoan = loan[1];
    const loanTimes = loan[2];
    return `${dolznik} borrowed ${totalLoan.toFixed(2)}€ (${loanTimes}x)`;
}