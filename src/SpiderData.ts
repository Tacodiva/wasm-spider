import { SpiderConstExpression } from "./SpiderConstExpression";
import { SpiderGlobal } from "./SpiderGlobal";
import { SpiderMemory } from "./SpiderMemory";
import { SpiderModule } from "./SpiderModule";
import { WasmValueType } from "./enums";

export type SpiderData = SpiderDataDefinition;

export class SpiderDataDefinition {

    public readonly module: SpiderModule;

    public memory: SpiderMemory;
    public buffer: ArrayLike<number>;
    public offset: SpiderConstExpression;

    public constructor(module: SpiderModule, memory: SpiderMemory, offset: SpiderConstExpression | number | SpiderGlobal, buffer: ArrayLike<number>) {
        this.module = module;
        this.memory = memory;
        this.buffer = buffer;
        if (offset instanceof SpiderConstExpression) {
            this.offset = offset;
        } else {
            this.offset = new SpiderConstExpression();
            this.offset.setTo(WasmValueType.i32, offset);
        }
    }
}