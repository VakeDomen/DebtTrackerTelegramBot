import { DbItem } from './core/db.item';

export class Transaction extends DbItem {
    tip: 'loan' | 'payment';
    kdo: string;
    komu: string;
    vsota: number;
    description: string;
    created: Date;

    constructor(data: any) {
        super(data);
        this.tip = data.tip;
        this.kdo = data.kdo;
        this.komu = data.komu;
        this.vsota = data.vsota;
        this.description = data.description;
        this.created = data.created;;
    }
}