import { DbItem } from './core/db.item';

export class Transaction extends DbItem {
    kdo: string;
    komu: string;
    vsota: number;
    description: string;

    constructor(data: any) {
        super(data);
        this.kdo = data.kdo;
        this.komu = data.komu;
        this.vsota = data.vsota;
        this.description = data.description;
    }
}