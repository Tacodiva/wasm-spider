import { SpiderOpcode } from "./SpiderOpcode";

export interface SpiderInstruction<T extends any[] | [] = any[]> {
    readonly opcode: SpiderOpcode<T>;
    readonly args: T;
}