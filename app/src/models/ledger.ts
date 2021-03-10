import { DbItem } from './core/db.item';

export class Ledger extends DbItem {
    dolznik: string;
    upnik: string;
    vsota: number;
    constructor(data: any) {
        super(data);
        this.dolznik = data.dolznik;
        this.upnik = data.upnik;
        this.vsota = data.vsota;
    }
}