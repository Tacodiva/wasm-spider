import { InstrList } from "./InstrList";
import { SpiderFunction } from "./SpiderFunction";
import { SpiderImportFunction, SpiderImportGlobal } from "./SpiderImport";
import { LocalReference } from "./LocalReference";
import { WasmOpcode, WasmValueType } from "./enums";
import { SpiderGlobal } from "./SpiderGlobal";

export type OpcodeInstArgMapValues = {
    [WasmOpcode.block]: [instr: InstrList, blocktype?: WasmValueType],
    [WasmOpcode.loop]: [instr: InstrList, blocktype?: WasmValueType],
    [WasmOpcode.if]: [instrTrue: InstrList, instrFalse?: InstrList, blocktype?: WasmValueType],
    [WasmOpcode.call]: [func: SpiderFunction | SpiderImportFunction],

    [WasmOpcode.local_get]: [localidx: LocalReference],
    [WasmOpcode.local_set]: [localidx: LocalReference],
    [WasmOpcode.local_tee]: [localidx: LocalReference],
    [WasmOpcode.global_get]: [globalidx: SpiderGlobal | SpiderImportGlobal],
    [WasmOpcode.global_set]: [globalidx: SpiderGlobal | SpiderImportGlobal],

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