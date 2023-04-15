import { InstrList } from "./InstrList";
import { SpiderFunction } from "./SpiderFunction";
import { SpiderImportFunction } from "./SpiderImport";
import { WasmOpcode, WasmValueType } from "./enums";

export type OpcodeInstArgMapValues = {
    [WasmOpcode.block]: [instr: InstrList, blocktype?: WasmValueType],
    [WasmOpcode.loop]: [instr: InstrList, blocktype?: WasmValueType],
    [WasmOpcode.if]: [instrTrue: InstrList, instrFalse?: InstrList, blocktype?: WasmValueType],
    [WasmOpcode.call]: [func: SpiderFunction | SpiderImportFunction],

    [WasmOpcode.local_get]: [localidx: number],
    [WasmOpcode.local_set]: [localidx: number],
    [WasmOpcode.local_tee]: [localidx: number],

    [WasmOpcode.i32_const]: [n: number],
    [WasmOpcode.i64_const]: [n: number],
    [WasmOpcode.f32_const]: [z: number],
    [WasmOpcode.f64_const]: [z: number],
};

export type OpcodeInstArgMap = {
    [T in WasmOpcode]: T extends keyof OpcodeInstArgMapValues ? OpcodeInstArgMapValues[T] : [];
};

export interface ISpiderInstr<T extends WasmOpcode = WasmOpcode> {
    readonly opcode: T;
    readonly args: OpcodeInstArgMap[T];
}