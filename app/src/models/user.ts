import { DbItem } from './core/db.item';

export class User extends DbItem {
    telegram_id: string;
    name: string;
    constructor(data: any) {
        super(data);
        this.telegram_id = data.telegram_id;
        this.name = data.name;
    }
}