import { fetch } from '../db/database.handler';
import * as conf from '../db/database.config.json';
import { User } from '../models/user';
import { Ledger } from '../models/ledger';

export async function findLedgersByDolznikiAndUpniki(dolzniki: User[], upniki: User[]): Promise<Ledger[]> {
    const dolznikiLedgers = await Promise.all( 
        dolzniki.map((dolznik: User) => { return fetch<Ledger>(conf.tables.ledger, new Ledger({dolznik: dolznik.id})); })
    );
    const upnikiIds = upniki.map((upnik: User) => { return upnik.id });
    return ([] as Ledger[]).concat(...dolznikiLedgers).filter((ledger: Ledger) => {
        return upnikiIds.indexOf(ledger.upnik) != -1;
    });
}
