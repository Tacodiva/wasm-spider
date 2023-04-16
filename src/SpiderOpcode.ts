import { LocalReference } from "./LocalReference";
import { SpiderExpression } from "./SpiderExpression";
import { SpiderFunction } from "./SpiderFunction";
import { SpiderGlobal } from "./SpiderGlobal";
import { SpiderMemory } from "./SpiderMemory";
import { SpiderTable } from "./SpiderTable";
import { SpiderTypeDefinition } from "./SpiderType";
import { WASM_RESULT_TYPE_VOID, WasmBlockOpcode, WasmWriter } from "./WasmWriter";
import { WasmValueType } from "./enums";

type OpcodeBinarySerializer<T extends any[] | []> = (writer: WasmWriter, ...args: T) => void;

export type SpiderOpcode<T extends any[] | [] = []> = {
    readonly primaryOpcode: number;
} & (T extends [] ? {
    readonly binarySerializer?: undefined;
} : {
    readonly binarySerializer: OpcodeBinarySerializer<T>
});

const serializerMemarg = (w: WasmWriter, align: number, offset: number) => {
    w.writeULEB128(align);
    w.writeULEB128(offset);
}

function opcodeSimple(primaryOpcode: number): SpiderOpcode<[]> {
    return { primaryOpcode };
}

function opcodeSimpleArgs<T extends any[]>(primaryOpcode: number, binarySerializer: OpcodeBinarySerializer<T>) {
    return { primaryOpcode, binarySerializer }
}

export const SpiderOpcodes = {
    unreachable: opcodeSimple(0x00),
    nop: opcodeSimple(0x01),
    block: opcodeSimpleArgs<[instr: SpiderExpression, blocktype?: WasmValueType]>(0x02, (w, instr, blocktype) => w.writeExpression(instr, blocktype ?? WASM_RESULT_TYPE_VOID)),
    loop: opcodeSimpleArgs<[instr: SpiderExpression, blocktype?: WasmValueType]>(0x03, (w, instr, blocktype) => w.writeExpression(instr, blocktype ?? WASM_RESULT_TYPE_VOID)),
    if: opcodeSimpleArgs<[instrTrue: SpiderExpression, instrFalse?: SpiderExpression, blocktype?: WasmValueType]>(0x04, (w, instrTrue, instrFalse, blocktype) => {
        if (instrFalse) {
            w.writeExpression(instrTrue, blocktype ?? WASM_RESULT_TYPE_VOID, WasmBlockOpcode.else);
            w.writeExpression(instrFalse);
        } else {
            w.writeExpression(instrTrue, blocktype ?? WASM_RESULT_TYPE_VOID);
        }
    }),
    br: opcodeSimpleArgs<[labelidx: number]>(0x0C, (w, labelidx) => w.writeULEB128(labelidx)),
    br_if: opcodeSimpleArgs<[labelidx: number]>(0x0D, (w, labelidx) => w.writeULEB128(labelidx)),
    br_table: opcodeSimpleArgs<[labels: number[], defaultLabel: number]>(0x0E, (w, labels, defaultLabel) => {
        w.writeULEB128(labels.length);
        for (const label of labels) w.writeULEB128(label);
        w.writeULEB128(defaultLabel);
    }),
    return: opcodeSimple(0x0f),
    call: opcodeSimpleArgs<[func: SpiderFunction]>(0x10, (w, func) => w.writeFunctionIndex(func)),
    call_indirect: opcodeSimpleArgs<[type: SpiderTypeDefinition, table: SpiderTable]>(0x11, (w, type, table) => {
        w.writeTypeIndex(type);
        w.writeTableIndex(table);
    }),
    drop: opcodeSimple(0x1a),
    select: opcodeSimple(0x1b),
    local_get: opcodeSimpleArgs<[localidx: LocalReference]>(0x20, (w, localidx) => w.writeLocalIndex(localidx)),
    local_set: opcodeSimpleArgs<[localidx: LocalReference]>(0x21, (w, localidx) => w.writeLocalIndex(localidx)),
    local_tee: opcodeSimpleArgs<[localidx: LocalReference]>(0x22, (w, localidx) => w.writeLocalIndex(localidx)),
    global_get: opcodeSimpleArgs<[globalidx: SpiderGlobal]>(0x23, (w, globalidx) => w.writeGlobalIndex(globalidx)),
    global_set: opcodeSimpleArgs<[globalidx: SpiderGlobal]>(0x24, (w, globalidx) => w.writeGlobalIndex(globalidx)),
    i32_load: opcodeSimpleArgs<[align: number, offset: number]>(0x28, serializerMemarg),
    i64_load: opcodeSimpleArgs<[align: number, offset: number]>(0x29, serializerMemarg),
    f32_load: opcodeSimpleArgs<[align: number, offset: number]>(0x2a, serializerMemarg),
    f64_load: opcodeSimpleArgs<[align: number, offset: number]>(0x2b, serializerMemarg),
    i32_load8_s: opcodeSimpleArgs<[align: number, offset: number]>(0x2c, serializerMemarg),
    i32_load8_u: opcodeSimpleArgs<[align: number, offset: number]>(0x2d, serializerMemarg),
    i32_load16_s: opcodeSimpleArgs<[align: number, offset: number]>(0x2e, serializerMemarg),
    i32_load16_u: opcodeSimpleArgs<[align: number, offset: number]>(0x2f, serializerMemarg),
    i64_load8_s: opcodeSimpleArgs<[align: number, offset: number]>(0x30, serializerMemarg),
    i64_load8_u: opcodeSimpleArgs<[align: number, offset: number]>(0x31, serializerMemarg),
    i64_load16_s: opcodeSimpleArgs<[align: number, offset: number]>(0x32, serializerMemarg),
    i64_load16_u: opcodeSimpleArgs<[align: number, offset: number]>(0x33, serializerMemarg),
    i64_load32_s: opcodeSimpleArgs<[align: number, offset: number]>(0x34, serializerMemarg),
    i64_load32_u: opcodeSimpleArgs<[align: number, offset: number]>(0x35, serializerMemarg),
    i32_store: opcodeSimpleArgs<[align: number, offset: number]>(0x36, serializerMemarg),
    i64_store: opcodeSimpleArgs<[align: number, offset: number]>(0x37, serializerMemarg),
    f32_store: opcodeSimpleArgs<[align: number, offset: number]>(0x38, serializerMemarg),
    f64_store: opcodeSimpleArgs<[align: number, offset: number]>(0x39, serializerMemarg),
    i32_store8: opcodeSimpleArgs<[align: number, offset: number]>(0x3a, serializerMemarg),
    i32_store16: opcodeSimpleArgs<[align: number, offset: number]>(0x3b, serializerMemarg),
    i64_store8: opcodeSimpleArgs<[align: number, offset: number]>(0x3c, serializerMemarg),
    i64_store16: opcodeSimpleArgs<[align: number, offset: number]>(0x3d, serializerMemarg),
    i64_store32: opcodeSimpleArgs<[align: number, offset: number]>(0x3e, serializerMemarg),
    memory_size: opcodeSimpleArgs<[memidx: SpiderMemory]>(0x3F, (w, memidx) => w.writeMemoryIndex(memidx)),
    memory_grow: opcodeSimpleArgs<[memidx: SpiderMemory]>(0x40, (w, memidx) => w.writeMemoryIndex(memidx)),
    i32_const: opcodeSimpleArgs<[n: number]>(0x41, (w, n) => w.writeSLEB128(n)),
    i64_const: opcodeSimpleArgs<[n: number]>(0x42, (w, n) => w.writeSLEB128(n)),
    f32_const: opcodeSimpleArgs<[z: number]>(0x43, (w, z) => w.writeF32(z)),
    f64_const: opcodeSimpleArgs<[z: number]>(0x44, (w, z) => w.writeF64(z)),
    i32_eqz: opcodeSimple(0x45),
    i32_eq: opcodeSimple(0x46),
    i32_ne: opcodeSimple(0x47),
    i32_lt_s: opcodeSimple(0x48),
    i32_lt_u: opcodeSimple(0x49),
    i32_gt_s: opcodeSimple(0x4a),
    i32_gt_u: opcodeSimple(0x4b),
    i32_le_s: opcodeSimple(0x4c),
    i32_le_u: opcodeSimple(0x4d),
    i32_ge_s: opcodeSimple(0x4e),
    i32_ge_u: opcodeSimple(0x4f),
    i64_eqz: opcodeSimple(0x50),
    i64_eq: opcodeSimple(0x51),
    i64_ne: opcodeSimple(0x52),
    i64_lt_s: opcodeSimple(0x53),
    i64_lt_u: opcodeSimple(0x54),
    i64_gt_s: opcodeSimple(0x55),
    i64_gt_u: opcodeSimple(0x56),
    i64_le_s: opcodeSimple(0x57),
    i64_le_u: opcodeSimple(0x58),
    i64_ge_s: opcodeSimple(0x59),
    i64_ge_u: opcodeSimple(0x5a),
    f32_eq: opcodeSimple(0x5b),
    f32_ne: opcodeSimple(0x5c),
    f32_lt: opcodeSimple(0x5d),
    f32_gt: opcodeSimple(0x5e),
    f32_le: opcodeSimple(0x5f),
    f32_ge: opcodeSimple(0x60),
    f64_eq: opcodeSimple(0x61),
    f64_ne: opcodeSimple(0x62),
    f64_lt: opcodeSimple(0x63),
    f64_gt: opcodeSimple(0x64),
    f64_le: opcodeSimple(0x65),
    f64_ge: opcodeSimple(0x66),
    i32_clz: opcodeSimple(0x67),
    i32_ctz: opcodeSimple(0x68),
    i32_popcnt: opcodeSimple(0x69),
    i32_add: opcodeSimple(0x6a),
    i32_sub: opcodeSimple(0x6b),
    i32_mul: opcodeSimple(0x6c),
    i32_div_s: opcodeSimple(0x6d),
    i32_div_u: opcodeSimple(0x6e),
    i32_rem_s: opcodeSimple(0x6f),
    i32_rem_u: opcodeSimple(0x70),
    i32_and: opcodeSimple(0x71),
    i32_or: opcodeSimple(0x72),
    i32_xor: opcodeSimple(0x73),
    i32_shl: opcodeSimple(0x74),
    i32_shr_s: opcodeSimple(0x75),
    i32_shr_u: opcodeSimple(0x76),
    i32_rotl: opcodeSimple(0x77),
    i32_rotr: opcodeSimple(0x78),
    i64_clz: opcodeSimple(0x79),
    i64_ctz: opcodeSimple(0x7a),
    i64_popcnt: opcodeSimple(0x7b),
    i64_add: opcodeSimple(0x7c),
    i64_sub: opcodeSimple(0x7d),
    i64_mul: opcodeSimple(0x7e),
    i64_div_s: opcodeSimple(0x7f),
    i64_div_u: opcodeSimple(0x80),
    i64_rem_s: opcodeSimple(0x81),
    i64_rem_u: opcodeSimple(0x82),
    i64_and: opcodeSimple(0x83),
    i64_or: opcodeSimple(0x84),
    i64_xor: opcodeSimple(0x85),
    i64_shl: opcodeSimple(0x86),
    i64_shr_s: opcodeSimple(0x87),
    i64_shr_u: opcodeSimple(0x88),
    i64_rotl: opcodeSimple(0x89),
    i64_rotr: opcodeSimple(0x8a),
    f32_abs: opcodeSimple(0x8b),
    f32_neg: opcodeSimple(0x8c),
    f32_ceil: opcodeSimple(0x8d),
    f32_floor: opcodeSimple(0x8e),
    f32_trunc: opcodeSimple(0x8f),
    f32_nearest: opcodeSimple(0x90),
    f32_sqrt: opcodeSimple(0x91),
    f32_add: opcodeSimple(0x92),
    f32_sub: opcodeSimple(0x93),
    f32_mul: opcodeSimple(0x94),
    f32_div: opcodeSimple(0x95),
    f32_min: opcodeSimple(0x96),
    f32_max: opcodeSimple(0x97),
    f32_copysign: opcodeSimple(0x98),
    f64_abs: opcodeSimple(0x99),
    f64_neg: opcodeSimple(0x9a),
    f64_ceil: opcodeSimple(0x9b),
    f64_floor: opcodeSimple(0x9c),
    f64_trunc: opcodeSimple(0x9d),
    f64_nearest: opcodeSimple(0x9e),
    f64_sqrt: opcodeSimple(0x9f),
    f64_add: opcodeSimple(0xa0),
    f64_sub: opcodeSimple(0xa1),
    f64_mul: opcodeSimple(0xa2),
    f64_div: opcodeSimple(0xa3),
    f64_min: opcodeSimple(0xa4),
    f64_max: opcodeSimple(0xa5),
    f64_copysign: opcodeSimple(0xa6),
    i32_wrap_i64: opcodeSimple(0xa7),
    i32_trunc_f32_s: opcodeSimple(0xa8),
    i32_trunc_f32_u: opcodeSimple(0xa9),
    i32_trunc_f64_s: opcodeSimple(0xaa),
    i32_trunc_f64_u: opcodeSimple(0xab),
    i64_extend_i32_s: opcodeSimple(0xac),
    i64_extend_i32_u: opcodeSimple(0xad),
    i64_trunc_f32_s: opcodeSimple(0xae),
    i64_trunc_f32_u: opcodeSimple(0xaf),
    i64_trunc_f64_s: opcodeSimple(0xb0),
    i64_trunc_f64_u: opcodeSimple(0xb1),
    f32_convert_i32_s: opcodeSimple(0xb2),
    f32_convert_i32_u: opcodeSimple(0xb3),
    f32_convert_i64_s: opcodeSimple(0xb4),
    f32_convert_i64_u: opcodeSimple(0xb5),
    f32_demote_f64: opcodeSimple(0xb6),
    f64_convert_i32_s: opcodeSimple(0xb7),
    f64_convert_i32_u: opcodeSimple(0xb8),
    f64_convert_i64_s: opcodeSimple(0xb9),
    f64_convert_i64_u: opcodeSimple(0xba),
    f64_promote_f32: opcodeSimple(0xbb),
    i32_reinterpret_f32: opcodeSimple(0xbc),
    i64_reinterpret_f64: opcodeSimple(0xbd),
    f32_reinterpret_i32: opcodeSimple(0xbe),
    f64_reinterpret_i64: opcodeSimple(0xbf)
}
