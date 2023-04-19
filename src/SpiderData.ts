import { SpiderExpression, SpiderExprConstValue } from "./SpiderExpression";
import { SpiderGlobal } from "./SpiderGlobal";
import { SpiderMemory } from "./SpiderMemory";
import { SpiderModule } from "./SpiderModule";
import { SpiderNumberType } from "./enums";

/** A data buffer which can be copied into {@link SpiderMemory memory}, defined within a module. */
export type SpiderData = SpiderDataActive | SpiderDataPassive;

/** The mode of operation of {@link SpiderData data}. */
export const enum SpiderDataType {
    /** Active data is copied to it's target memory on initalization.  */
    ACTIVE,
    /** Passive data is not copied to it's target memory on initalization but can be loaded using instructions.  */
    PASSIVE
}

/** An {@link SpiderData active} data buffer. */
export interface SpiderDataActive {
    readonly type: SpiderDataType.ACTIVE;
    /** The memory to copy the contents of the buffer into. */
    memory: SpiderMemory;
    /** The buffer of bytes to be copied into memory. */
    buffer: ArrayLike<number>;
    /** The offset within memory to copy the contents of the buffer into. */
    offset: SpiderExpression;
}

/** A {@link SpiderData passive} data buffer. */
export interface SpiderDataPassive {
    readonly type: SpiderDataType.PASSIVE;
    /** The buffer of bytes to be copied into memory. */
    buffer: ArrayLike<number>;
}