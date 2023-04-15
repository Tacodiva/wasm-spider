import { SpiderConstExpression } from "./SpiderConstExpression";
import { SpiderFunction } from "./SpiderFunction";
import { SpiderGlobal } from "./SpiderGlobal";
import { SpiderModule } from "./SpiderModule";
import { SpiderTable } from "./SpiderTable";
import { WasmValueType } from "./enums";

export type SpiderElement = SpiderElementDefinition;

export class SpiderElementDefinition {
    public readonly module: SpiderModule;

    public offset: SpiderConstExpression;
    public readonly functions: SpiderFunction[];
    public table: SpiderTable;

    public constructor(module: SpiderModule, table: SpiderTable, offset: SpiderConstExpression | number | SpiderGlobal, functions: SpiderFunction[] = []) {
        this.module = module;
        this.table = table;
        if (offset instanceof SpiderConstExpression) {
            this.offset = offset;
        } else {
            this.offset = new SpiderConstExpression();
            this.offset.setTo(WasmValueType.i32, offset);
        }
        this.functions = functions;
    }
}