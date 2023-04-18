import { SpiderExpression, SpiderExprConstValue } from "./SpiderExpression";
import { SpiderImportGlobal } from "./SpiderImport";
import { SpiderModule } from "./SpiderModule";
import { SpiderValueType } from "./enums";

export type SpiderGlobal = SpiderGlobalDefinition | SpiderImportGlobal;

export class SpiderGlobalDefinition {
    public readonly module: SpiderModule;

    public type: SpiderValueType;
    public mutable: boolean;
    public value: SpiderExpression;

    public constructor(module: SpiderModule, type: SpiderValueType, mutable: boolean, value: SpiderExpression) {
        this.module = module;
        this.type = type;
        this.mutable = mutable;
        this.value = value
    }
}