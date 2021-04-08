import * as conf from '../db/database.config.json';
import { fetchAll, update } from "../db/database.handler";
import { Ledger } from "../models/ledger";
import { User } from "../models/user";

export async function optimiseLedgers(ctx: any): Promise<void> {
    await resolveBiDirectionalDebts();
    await resolveCyclicDebts();
}

async function resolveBiDirectionalDebts(): Promise<void> {
    console.log("Resolving bi-directional loans...");
    const users = await fetchAll<User>(conf.tables.users);
    const ledgers = await fetchAll<Ledger>(conf.tables.ledger);
    const graph = new Graph(users, ledgers);
    await graph.resolveBiDirectionalLoans();
    console.log("Resolved bi-directional loans!")
}

async function resolveCyclicDebts(): Promise<void> {
    console.log("Resolving cyclic loans...");
    const users = await fetchAll<User>(conf.tables.users);
    const ledgers = await fetchAll<Ledger>(conf.tables.ledger);
    const graph = new Graph(users, ledgers);
    await graph.resolveCyclicDebts();
    console.log("Resolved cyclic loans!");
}

class Graph {
    
    nodes: Node[];

    constructor(users: User[], ledgers: Ledger[]) {
        this.nodes = users.map((user: User) => {
            return new Node(user, ledgers);
        });
        this.nodes.forEach((node: Node) => {
            node.connectNodes(this.nodes);
        });
    }

    async resolveCyclicDebts(): Promise<void> {
        for (const start of this.nodes) {
            const result: Node[] = [];
            const stack: Node[] = [start];
            const visited: any = {};
            visited[start.user.id as string] = true;
            let current: Node;
            let found = false;
            while (stack.length) {
                found = false;
                current = stack.pop() as Node;
                result.push(current);
                for (const neighbourId of current.connections.keys()) {
                    const neighbor = current.connections.get(neighbourId) as Node;
                    if (current.connections.has(start.user.id as string)) {
                        current.connections.forEach((node: Node) => console.log(node.user.name));
                        result.push(neighbor);
                        found = true;
                        break;
                    }
                    if (!visited[neighbor.user.id as string]) {
                        visited[neighbor.user.id as string] = true;
                        stack.push(neighbor);
                    }
                };
                if (found) {
                    break;
                }
            }
            if (found && result.length > 2) {
                console.log(result);
                await this.reduceDebtCyclic(result);
            }
        }
    }
    async resolveBiDirectionalLoans(): Promise<void> {
        for (const node of this.nodes) {
            await node.resolveBiDirectionalLoans();
        }
    }

    private async reduceDebtCyclic(nodes: Node[]): Promise<void> {
        const debts: number[] = [];
        for (let index = 0 ; index < nodes.length - 1 ; index++) {
            debts.push((nodes[index].ledgers.get(nodes[index + 1].user.id as string) as Ledger).vsota);
        }
        console.log('debts', debts);
        const minDebt = Math.min(...debts);
        console.log('min debt', minDebt);
        for (let index = 0 ; index < nodes.length - 1 ; index++) {
            const ledger = nodes[index].ledgers.get(nodes[index + 1].user.id as string) as Ledger;
            ledger.vsota -= minDebt;
            ledger.vsota = Number(ledger.vsota.toFixed(2));
            if (ledger.vsota == 0) {
                nodes[index].disconnect(nodes[index + 1].user.id as string);
            }
            await update(conf.tables.ledger, new Ledger(ledger));
        }
    }
}

class Node {

    user: User;
    ledgers: Map<string, Ledger>; // string -> user.id
    connections: Map<string, Node>; // string -> user.id
    visited: boolean;

    constructor(user: User, ledgers: Ledger[]) {
        this.user = user;
        this.ledgers = new Map();
        this.connections = new Map();
        this.visited = false;
        ledgers.filter((ledger: Ledger) => ledger.dolznik == user.id).forEach((ledger: Ledger) => {
            this.ledgers.set(ledger.upnik, ledger);
        });
    }

    private connect(id: string, node: Node): void {
        this.connections.set(id, node);
    }

    async resolveBiDirectionalLoans(): Promise<void> {
        for (const connectionId of this.connections.keys()) {
            const me = this.user.id as string;
            const connection = this.connections.get(connectionId) as Node;
            const forwardDebt = this.ledgers.get(connectionId)?.vsota;
            const backwardsDebt = connection?.ledgers.get(me)?.vsota
            if (forwardDebt && backwardsDebt && forwardDebt > 0 && backwardsDebt > 0) {
                const diff = Math.min(forwardDebt, backwardsDebt);
		console.log(`Resolving bi-directional debt between connections ${me} and ${connection.user.id as string}`);
		console.log(`Diff: ${diff}`);
                await this.reduceDeptBiDirectional(connectionId, diff);
            }
        }
    }

    connectNodes(nodes: Node[]): void {
        for (const node of nodes) {
            const nodeId = node.user.id;
            if (nodeId && nodeId != this.user.id) {
                const ledger = this.ledgers.get(nodeId) as Ledger;
                if (ledger.vsota > 0) {
                    this.connect(ledger.upnik, node);
                }
            }
        }
    }

    disconnect(id: string): void {
        this.connections.delete(id);
    }

    private async reduceDeptBiDirectional(connectionId: string, reduction: number): Promise<void> {
        const forwardLedger = this.ledgers.get(connectionId);
        const connection = this.connections.get(connectionId);
        const backwadsLedger = connection?.ledgers.get(this.user.id as string);
        if (forwardLedger && backwadsLedger) {
            forwardLedger.vsota = Number((forwardLedger.vsota - reduction).toFixed(2));
            backwadsLedger.vsota = Number((backwadsLedger.vsota - reduction).toFixed(2));
            await update(conf.tables.ledger, new Ledger(forwardLedger));
            await update(conf.tables.ledger, new Ledger(backwadsLedger));
            if (backwadsLedger.vsota == 0) {
                connection?.disconnect(this.user.id as string);
            }
            if (forwardLedger.vsota == 0) {
                this.disconnect(connection?.user.id as string);
            }
        }
    }

    async resolveCyclicDebts(): Promise<void> {

    }
}
