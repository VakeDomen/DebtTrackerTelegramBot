import { fetch, insert, update } from '../db/database.handler';
import * as conf from '../db/database.config.json';
import { Ledger } from '../models/ledger';
import { Transaction } from '../models/transaction';
import { findLedgersByDolznikiAndUpniki } from './ledgers.helper';
import { findUserById } from './users.helper';


export async function executeTransactions(transactions: Transaction[]): Promise<void> {
    transactions.map(async (transaction: Transaction) => await executeTransaction(transaction));
}

export async function executeTransaction(transaction: Transaction): Promise<boolean> {
    switch (transaction.tip) {
        case 'loan':
            return await executeLoan(transaction);
        case 'payment':
            return await executePayment(transaction);
    }
}

export async function agreagteTransactions(tip: 'loan' | 'borrow'): Promise<[string, number, number][]> {
    const transactions = await fetch<Transaction>(conf.tables.transactions, new Transaction({ tip: 'loan' }));
    const agreg: [string, number, number][] = [];
    const target = tip == 'loan' ? 'kdo' : 'komu';
    console.log(transactions);
    for (const transaction of transactions) {
        if (!agreg[transaction[target]]) {
            agreg[transaction[target]] = [transaction[target], transaction.vsota, 0];
        } else {
            agreg[transaction[target]][1] += transaction.vsota;
            agreg[transaction[target]][2]++;
        }
    }
    const out: [string, number, number][] = [];
    for (const index in agreg) {
        out.push(agreg[index]);
    }
    return out;
}

async function executeLoan(transaction: Transaction): Promise<boolean> {
    const ledger = (await findLedgersByDolznikiAndUpniki(
        [await findUserById(transaction.komu)],
        [await findUserById(transaction.kdo)], 
    )).pop();
    if (ledger) {
        console.log(`Executing transaction ${transaction.id}...`);
        ledger.vsota += transaction.vsota;
        await update(conf.tables.ledger, new Ledger(ledger));
        await insert(conf.tables.transactions, transaction);
        console.log(`Successfully executed transaction ${transaction.id}!`);
        return true;
    }
    return false;
}

async function executePayment(transaction: Transaction): Promise<boolean> {
    const ledger = (await findLedgersByDolznikiAndUpniki(
        [await findUserById(transaction.kdo)], 
        [await findUserById(transaction.komu)],
    )).pop();
    const reverseLedger = (await findLedgersByDolznikiAndUpniki(
        [await findUserById(transaction.komu)], 
        [await findUserById(transaction.kdo)],
    )).pop();
    if (ledger && reverseLedger) {
        console.log(`Executing transaction ${transaction.id}...`);
        const overpay = ledger.vsota < transaction.vsota ? transaction.vsota - ledger.vsota : 0;
        ledger.vsota = ledger.vsota < transaction.vsota ? 0 : ledger.vsota - transaction.vsota;
        reverseLedger.vsota += overpay;
        await update(conf.tables.ledger, new Ledger(ledger));
        await update(conf.tables.ledger, new Ledger(reverseLedger));
        await insert(conf.tables.transactions, transaction);
        console.log(`Successfully executed transaction ${transaction.id}!`);
        return true;
    }
    return false;
}


