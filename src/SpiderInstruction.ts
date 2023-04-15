import { SpiderExpression } from "./SpiderExpression";
import { SpiderFunction } from "./SpiderFunction";
import { LocalReference } from "./LocalReference";
import { WasmOpcode, WasmValueType } from "./enums";
import { SpiderGlobal } from "./SpiderGlobal";
import { SpiderMemory } from "./SpiderMemory";
import { SpiderTypeDefinition } from "./SpiderType";
import { SpiderTable } from "./SpiderTable";

export type OpcodeInstArgMapValues = {
    [WasmOpcode.block]: [instr: SpiderExpression, blocktype?: WasmValueType],
    [WasmOpcode.loop]: [instr: SpiderExpression, blocktype?: WasmValueType],
    [WasmOpcode.if]: [instrTrue: SpiderExpression, instrFalse?: SpiderExpression, blocktype?: WasmValueType],
    [WasmOpcode.br]: [labelidx: number],
    [WasmOpcode.br_if]: [labelidx: number],
    [WasmOpcode.br_table]: [labels: number[], defaultLabel: number],
    [WasmOpcode.call]: [func: SpiderFunction],
    [WasmOpcode.call_indirect]: [type: SpiderTypeDefinition, table: SpiderTable],

    [WasmOpcode.local_get]: [localidx: LocalReference],
    [WasmOpcode.local_set]: [localidx: LocalReference],
    [WasmOpcode.local_tee]: [localidx: LocalReference],
    [WasmOpcode.global_get]: [globalidx: SpiderGlobal],
    [WasmOpcode.global_set]: [globalidx: SpiderGlobal],

    [WasmOpcode.i32_load]: [align: number, offset: number],
    [WasmOpcode.i64_load]: [align: number, offset: number],
    [WasmOpcode.f32_load]: [align: number, offset: number],
    [WasmOpcode.f64_load]: [align: number, offset: number],
    [WasmOpcode.i32_load8_s]: [align: number, offset: number],
    [WasmOpcode.i32_load8_u]: [align: number, offset: number],
    [WasmOpcode.i32_load16_s]: [align: number, offset: number],
    [WasmOpcode.i32_load16_u]: [align: number, offset: number],
    [WasmOpcode.i64_load8_s]: [align: number, offset: number],
    [WasmOpcode.i64_load8_u]: [align: number, offset: number],
    [WasmOpcode.i64_load16_s]: [align: number, offset: number],
    [WasmOpcode.i64_load16_u]: [align: number, offset: number],
    [WasmOpcode.i64_load32_s]: [align: number, offset: number],
    [WasmOpcode.i64_load32_u]: [align: number, offset: number],
    [WasmOpcode.i32_store]: [align: number, offset: number],
    [WasmOpcode.i64_store]: [align: number, offset: number],
    [WasmOpcode.f32_store]: [align: number, offset: number],
    [WasmOpcode.f64_store]: [align: number, offset: number],
    [WasmOpcode.i32_store8]: [align: number, offset: number],
    [WasmOpcode.i32_store16]: [align: number, offset: number],
    [WasmOpcode.i64_store8]: [align: number, offset: number],
    [WasmOpcode.i64_store16]: [align: number, offset: number],
    [WasmOpcode.i64_store32]: [align: number, offset: number],
    [WasmOpcode.memory_size]: [memidx?: SpiderMemory]
    [WasmOpcode.memory_grow]: [memidx?: SpiderMemory]

    [WasmOpcode.i32_const]: [n: number],
    [WasmOpcode.i64_const]: [n: number],
    [WasmOpcode.f32_const]: [z: number],
    [WasmOpcode.f64_const]: [z: number],
};

export type OpcodeInstArgMap = {
    [T in WasmOpcode]: T extends keyof OpcodeInstArgMapValues ? OpcodeInstArgMapValues[T] : [];
};

export interface SpiderInstruction<T extends WasmOpcode = WasmOpcode> {
    readonly opcode: T;
    readonly args: OpcodeInstArgMap[T];
}