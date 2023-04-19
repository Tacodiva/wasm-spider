import { SpiderOpcode } from "./SpiderOpcode";

/** A single WASM instruction */
export interface SpiderInstruction<T extends any[] | [] = any[]> {
    /** The opcode of this instruction */
    readonly opcode: SpiderOpcode<T>;
    /** A list of arguments for this function. Types change depnding upon the opcode. */
    readonly args: T;
}