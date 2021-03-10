import { DbItem } from './core/db.item';

export class Ledger extends DbItem {
    kdo: string;
    komu: string;
    vsota: number;

    constructor(data: any) {
        super(data);
        this.kdo = data.kdo;
        this.komu = data.komu;
        this.vsota = data.vsota;
    }
}