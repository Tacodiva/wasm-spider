import { InstrList } from "./InstrList";
import { SpiderFunction } from "./SpiderFunction";
import { SpiderImportTable } from "./SpiderImport";
import { SpiderModule } from "./SpiderModule";
import { SpiderTable, SpiderTableDefinition } from "./SpiderTable";

export type SpiderElement = SpiderElementDefinition;

export class SpiderElementDefinition {
    public readonly module: SpiderModule;

    public readonly offsetExpr: InstrList;
    public readonly functions: SpiderFunction[];
    public table: SpiderTable;

    public constructor(module: SpiderModule, table: SpiderTable, offsetExpr: InstrList = new InstrList(), functions: SpiderFunction[] = []) {
        this.module = module;
        this.table = table;
        this.offsetExpr = offsetExpr;
        this.functions = functions;

    }
}