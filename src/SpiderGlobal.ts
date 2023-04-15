import { InstrList } from "./InstrList";
import { SpiderImportGlobal } from "./SpiderImport";
import { SpiderModule } from "./SpiderModule";
import { WasmOpcode, WasmValueType } from "./enums";

export type SpiderGlobal = SpiderGlobalDefinition | SpiderImportGlobal;

export class SpiderGlobalDefinition {
    public readonly module: SpiderModule;

    public type: WasmValueType;
    public mutable: boolean;
    public readonly initalizer: InstrList;

    public constructor(module: SpiderModule, type: WasmValueType, mutable: boolean, value?: number) {
        this.module = module;
        this.type = type;
        this.mutable = mutable;
        this.initalizer = new InstrList();
        if (value)
            this.setValue(value);
    }

    public setValue(value: number) {
        this.initalizer.instructions.length = 0;
        this.initalizer.emitConstant(this.type, value);
    }

    public getValue(): number {
        if ((this.initalizer.instructions[0]?.opcode - (this.type & 0x3)) !== WasmOpcode.f64_const)
            throw new Error("Cannot get the value of the global. Its initalizer's first instruction is not a const.");
        return this.initalizer.instructions[0].args[0] as number;
    }
}