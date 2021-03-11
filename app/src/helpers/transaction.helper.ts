import { insert, update } from '../db/database.handler';
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

async function executeLoan(transaction: Transaction): Promise<boolean> {
    console.log(`Fetching ledger for transaction ${transaction.id}...`);
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
    console.log(`Fetching ledger for transaction ${transaction.id}...`);
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
