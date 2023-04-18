import { SpiderConstExpression, SpiderConstExprValue } from "./SpiderConstExpression";
import { SpiderGlobal } from "./SpiderGlobal";
import { SpiderMemory } from "./SpiderMemory";
import { SpiderModule } from "./SpiderModule";
import { SpiderNumberType } from "./enums";

export type SpiderData = SpiderDataActiveDef | SpiderDataPassiveDef;

export class SpiderDataActiveDef {
    public readonly module: SpiderModule;

    public memory: SpiderMemory;
    public buffer: ArrayLike<number>;
    public offset: SpiderConstExpression;
    public active: true;

    public constructor(module: SpiderModule, memory: SpiderMemory, offset: SpiderConstExpression | SpiderConstExprValue, buffer: ArrayLike<number>) {
        this.module = module;
        this.memory = memory;
        this.buffer = buffer;
        this.active = true;
        if (offset instanceof SpiderConstExpression) {
            this.offset = offset;
        } else {
            this.offset = new SpiderConstExpression();
            this.offset.setTo(SpiderNumberType.i32, offset);
        }
    }
}

export class SpiderDataPassiveDef {
    public readonly module: SpiderModule;

    public buffer: ArrayLike<number>;
    public active: false;

    public constructor(module: SpiderModule, buffer: ArrayLike<number>) {
        this.module = module;
        this.buffer = buffer;
        this.active = false;
    }
}