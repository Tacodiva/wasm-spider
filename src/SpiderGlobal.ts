import { SpiderExpression, SpiderExprConstValue } from "./SpiderExpression";
import { SpiderImportGlobal } from "./SpiderImport";
import { SpiderModule } from "./SpiderModule";
import { SpiderValueType } from "./enums";

/** A global variable. It may be defined within this module or imported from another. */
export type SpiderGlobal = SpiderGlobalDefinition | SpiderImportGlobal;

/** A global defined within this module. */
export class SpiderGlobalDefinition {
    public readonly module: SpiderModule;

    /** Type type of value held by this global. */
    public type: SpiderValueType;
    /** True if this global is mutable */
    public mutable: boolean;
    /** An expression which returns the value initially held by this global. Executes on module initialization. */
    public value: SpiderExpression;

    /** @hidden */
    public constructor(module: SpiderModule, type: SpiderValueType, mutable: boolean, value: SpiderExpression) {
        this.module = module;
        this.type = type;
        this.mutable = mutable;
        this.value = value
    }
}