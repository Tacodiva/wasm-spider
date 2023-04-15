import { InstrList } from "./InstrList";
import { SpiderFunction } from "./SpiderFunction";
import { SpiderImportFunction, SpiderImportTable } from "./SpiderImport";
import { SpiderModule } from "./SpiderModule";
import { SpiderTable } from "./SpiderTable";

export class SpiderElement {
    public readonly module: SpiderModule;

    public readonly offsetExpr: InstrList;
    public readonly functions: (SpiderFunction | SpiderImportFunction)[];
    public table: SpiderTable | SpiderImportTable;

    public constructor(module: SpiderModule, table: SpiderTable | SpiderImportTable, offsetExpr: InstrList = new InstrList(), functions: (SpiderFunction | SpiderImportFunction)[] = []) {
        this.module = module;
        this.table = table;
        this.offsetExpr = offsetExpr;
        this.functions = functions;

    }
}