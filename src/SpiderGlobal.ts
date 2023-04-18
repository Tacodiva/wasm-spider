import { SpiderConstExpression, SpiderConstExprValue } from "./SpiderConstExpression";
import { SpiderExpression } from "./SpiderExpression";
import { SpiderImportGlobal } from "./SpiderImport";
import { SpiderModule } from "./SpiderModule";
import { SpiderValueType } from "./enums";
import { SpiderOpcodes } from "./SpiderOpcode";

export type SpiderGlobal = SpiderGlobalDefinition | SpiderImportGlobal;

export class SpiderGlobalDefinition {
    public readonly module: SpiderModule;

    public type: SpiderValueType;
    public mutable: boolean;
    public value: SpiderConstExpression;

    public constructor(module: SpiderModule, type: SpiderValueType, mutable: boolean, value: SpiderConstExpression | SpiderConstExprValue) {
        this.module = module;
        this.type = type;
        this.mutable = mutable;
        if (value instanceof SpiderConstExpression) {
            this.value = value
        } else {
            this.value = new SpiderConstExpression();
            this.value.setTo(type, value);
        }
    }
}