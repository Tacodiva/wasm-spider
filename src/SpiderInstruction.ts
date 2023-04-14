import { WasmOpcode } from "./enums";

export type OpcodeInstArgMapValues = {
    [WasmOpcode.i32_const]: [number],
    [WasmOpcode.local_get]: [localidx: number],
};

export type OpcodeInstArgMap = {
    [T in WasmOpcode]: T extends keyof OpcodeInstArgMapValues ? OpcodeInstArgMapValues[T] : [];
};

export interface ISpiderInstr<T extends WasmOpcode = WasmOpcode> {
    readonly opcode: T;
    readonly args: OpcodeInstArgMap[T];
}