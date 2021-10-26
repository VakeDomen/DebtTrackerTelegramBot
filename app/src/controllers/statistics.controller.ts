import { agreagteTransactions } from '../helpers/transaction.helper';

export async function onStats(ctx: any): Promise<void> {
    let messages: string[] = [];

    messages.push('-------- TOTAL LOANS --------');
    const loans = await agreagteTransactions('loan');
    messages.push(...constructMessagesLoan(loans));

    messages.push('------- TOTAL BORROWS -------');
    const borrows = await agreagteTransactions('payment');
    messages.push(...constructMessagesBorrow(loans));

    if (messages.length > 0) {
        await ctx.replyWithMarkdown('\`\`\`\n' + messages.join('\n') + '\`\`\`');
    } else {
        await ctx.reply('No debt....very nice!');
    }
}

function constructMessagesLoan(loans:  [string, number][]): string[] {
    const messages: string[] = [];
    loans = loans.sort((t1: [string, number], t2: [string, number]) => t2[0] > t1[0] ? 1 : -1);
    for (const loan of loans) {
        if (loan[1] > 0) {
            messages.push(generateMessageLoan(loan));
        }
    }
    return messages;
}

function constructMessagesBorrow(loans:  [string, number][]): string[] {
    const messages: string[] = [];
    loans = loans.sort((t1: [string, number], t2: [string, number]) => t2[0] > t1[0] ? 1 : -1);
    for (const loan of loans) {
        if (loan[1] > 0) {
            messages.push(generateMessageBorrow(loan));
        }
    }
    return messages;
}

function generateMessageLoan(loan: [string, number]): string {
    const upnik = loan[0];
    const totalLoan = loan[1];
    return `${upnik} loaned ${totalLoan}€`;
}

function generateMessageBorrow(loan: [string, number]): string {
    const dolznik = loan[0];
    const totalLoan = loan[1];
    return `${dolznik} borrowed ${totalLoan}€`;
}