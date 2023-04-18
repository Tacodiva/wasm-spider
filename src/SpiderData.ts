import { SpiderExpression, SpiderExprConstValue } from "./SpiderExpression";
import { SpiderGlobal } from "./SpiderGlobal";
import { SpiderMemory } from "./SpiderMemory";
import { SpiderModule } from "./SpiderModule";
import { SpiderNumberType } from "./enums";

export type SpiderData = SpiderDataActive | SpiderDataPassive;

export interface SpiderDataActive {
    readonly active: true;
    memory: SpiderMemory;
    buffer: ArrayLike<number>;
    offset: SpiderExpression;
}

export interface SpiderDataPassive {
    readonly active: false;
    buffer: ArrayLike<number>;
}