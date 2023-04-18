import { LocalReference } from "./LocalReference";
import { SpiderData } from "./SpiderData";
import { SpiderElement } from "./SpiderElement";
import { SpiderExpression } from "./SpiderExpression";
import { SpiderFunction } from "./SpiderFunction";
import { SpiderGlobal } from "./SpiderGlobal";
import { SpiderMemory } from "./SpiderMemory";
import { SpiderTable } from "./SpiderTable";
import { SpiderTypeDefinition } from "./SpiderType";
import { SpiderModuleWriter } from "./SpiderModuleWriter";
import { SpiderReferenceType, SpiderValueType, WasmBlockOpcode } from "./enums";
import { WASM_RESULT_TYPE_VOID } from "./consts";
import { SpiderModuleReader } from "./SpiderModuleReader";

type OpcodeBinarySerializer<T extends any[] | []> = T extends [] ? undefined : readonly [write: (writer: SpiderModuleWriter, ...args: T) => void, read: (reader: SpiderModuleReader) => T];

export type SpiderOpcode<T extends any[] | [] = any[] | []> = {
    readonly primaryOpcode: number;
    readonly secondaryOpcode?: number;
    readonly binarySerializer: OpcodeBinarySerializer<T>
};

export const OPCODE_MAP: (SpiderOpcode | (SpiderOpcode | undefined)[] | undefined)[] = [];

function opcodeSimple(primaryOpcode: number): SpiderOpcode<[]> {
    return opcodeSimpleArgs<[]>(primaryOpcode, undefined);
}

function opcodeSimpleArgs<T extends any[]>(primaryOpcode: number, binarySerializer: OpcodeBinarySerializer<T>): SpiderOpcode<T> {
    if (OPCODE_MAP[primaryOpcode]) throw new Error("Duplicate primary opcode.");
    return OPCODE_MAP[primaryOpcode] = { primaryOpcode, binarySerializer };
}

function opcodeSecondary(primaryOpcode: number, secondaryOpcode: number): SpiderOpcode<[]> {
    return opcodeSecondaryArgs<[]>(primaryOpcode, secondaryOpcode, undefined);
}

function opcodeSecondaryArgs<T extends any[]>(primaryOpcode: number, secondaryOpcode: number, binarySerializer: OpcodeBinarySerializer<T>): SpiderOpcode<T> {
    let entry = OPCODE_MAP[primaryOpcode];
    if (!entry) entry = OPCODE_MAP[primaryOpcode] = [];
    else if (!Array.isArray(entry)) throw new Error("Duplicate primary opcode.");
    if (entry[secondaryOpcode]) throw new Error("Duplicate secondary opcode.");
    return entry[secondaryOpcode] = { primaryOpcode, secondaryOpcode, binarySerializer };
}

const serializeMemarg: OpcodeBinarySerializer<[align: number, offset: number]> = [
    (w: SpiderModuleWriter, align: number, offset: number) => {
        w.writeULEB128(align);
        w.writeULEB128(offset);
    },
    (r: SpiderModuleReader) => [r.readULEB128(), r.readULEB128()]
];

const serializeULEB128: OpcodeBinarySerializer<[number]> = [
    (w, n) => w.writeULEB128(n),
    (r) => [r.readULEB128()]
]

const serializeLocalIndex: OpcodeBinarySerializer<[localindex: LocalReference]> = [
    (w, localindex) => w.writeLocalIndex(localindex),
    r => [r.readULEB128()] // TODO Make this better
];

const serializeTable: OpcodeBinarySerializer<[table: SpiderTable]> = [
    (w, table) => w.writeTableIndex(table),
    r => [r.readTableIndex()]
];

const serializeMemory: OpcodeBinarySerializer<[mem: SpiderMemory]> = [
    (w, mem) => w.writeMemoryIndex(mem),
    r => [r.readMemoryIndex()]
];

const serializeMemargLane: OpcodeBinarySerializer<[align: number, offset: number, lane: number]> = [
    (w, align, offset, lane) => {
        w.writeULEB128(align);
        w.writeULEB128(offset);
        w.writeUint8(lane);
    }, r => [r.readULEB128(), r.readULEB128(), r.readUint8()]
];

const serializeByte: OpcodeBinarySerializer<[number]> = [
    (w, n) => w.writeUint8(n),
    r => [r.readUint8()]
]

export const SpiderOpcodes = {

    // Control Instructions

    unreachable: opcodeSimple(0x00),
    nop: opcodeSimple(0x01),
    block: opcodeSimpleArgs<[instr: SpiderExpression, blocktype?: SpiderValueType]>(0x02, [
        (w, instr, blocktype) => w.writeExpression(instr, blocktype ?? WASM_RESULT_TYPE_VOID),
        r => {
            const exp = r.readExpression(true);
            return [exp.expr, exp.type];
        }
    ]),
    loop: opcodeSimpleArgs<[instr: SpiderExpression, blocktype?: SpiderValueType]>(0x03, [
        (w, instr, blocktype) => w.writeExpression(instr, blocktype ?? WASM_RESULT_TYPE_VOID),
        r => {
            const exp = r.readExpression(true);
            return [exp.expr, exp.type];
        }
    ]),
    if: opcodeSimpleArgs<[instrTrue: SpiderExpression, instrFalse?: SpiderExpression, blocktype?: SpiderValueType]>(0x04, [(w, instrTrue, instrFalse, blocktype) => {
        if (instrFalse) {
            w.writeExpression(instrTrue, blocktype ?? WASM_RESULT_TYPE_VOID, WasmBlockOpcode.else);
            w.writeExpression(instrFalse);
        } else {
            w.writeExpression(instrTrue, blocktype ?? WASM_RESULT_TYPE_VOID);
        }
    }, r => {
        const exprTrue = r.readExpression(true);
        let instrFalse = undefined;
        if (exprTrue.end === WasmBlockOpcode.else)
            instrFalse = r.readExpression(false).expr;
        return [exprTrue.expr, instrFalse, exprTrue.type];
    }
    ]),
    br: opcodeSimpleArgs<[labelidx: number]>(0x0C, serializeULEB128),
    br_if: opcodeSimpleArgs<[labelidx: number]>(0x0D, serializeULEB128),
    br_table: opcodeSimpleArgs<[labels: number[], defaultLabel: number]>(0x0E, [(w, labels, defaultLabel) => {
        w.writeULEB128(labels.length);
        for (const label of labels) w.writeULEB128(label);
        w.writeULEB128(defaultLabel);
    }, r => {
        const length = r.readULEB128();
        const labels = new Array(length);
        for (let i = 0; i < length; i++)
            labels[i] = r.readULEB128();
        return [labels, r.readULEB128()];
    }]),
    return: opcodeSimple(0x0f),
    call: opcodeSimpleArgs<[func: SpiderFunction]>(0x10, [(w, func) => w.writeFunctionIndex(func), r => [r.readFunctionIndex()]]),
    call_indirect: opcodeSimpleArgs<[type: SpiderTypeDefinition, table: SpiderTable]>(0x11, [(w, type, table) => {
        w.writeTypeIndex(type);
        w.writeTableIndex(table);
    }, r => [r.readTypeIndex(), r.readTableIndex()]
    ]),

    // Reference Instructions

    ref_null: opcodeSimpleArgs<[reftype: SpiderReferenceType]>(0xd0, [(w, t) => w.writeUint8(t), r => [r.readUint8()]]),
    ref_is_null: opcodeSimple(0xd1),
    ref_func: opcodeSimpleArgs<[func: SpiderFunction]>(0xd2, [(w, func) => w.writeFunctionIndex(func), r => [r.readFunctionIndex()]]),

    // Parametric Instructions

    drop: opcodeSimple(0x1a),
    select: opcodeSimple(0x1b),
    select_t: opcodeSimpleArgs<[types: SpiderValueType[]]>(0x1c, [(w, types) => {
        w.writeULEB128(types.length);
        for (const type of types) w.writeUint8(type);
    }, r => {
        const length = r.readULEB128();
        const types = new Array(length);
        for (let i = 0; i < length; i++) types.push(r.readUint8());
        return [types];
    }]),

    // Variable Instructions

    local_get: opcodeSimpleArgs<[localidx: LocalReference]>(0x20, serializeLocalIndex),
    local_set: opcodeSimpleArgs<[localidx: LocalReference]>(0x21, serializeLocalIndex),
    local_tee: opcodeSimpleArgs<[localidx: LocalReference]>(0x22, serializeLocalIndex),
    global_get: opcodeSimpleArgs<[globalidx: SpiderGlobal]>(0x23, [(w, globalidx) => w.writeGlobalIndex(globalidx), r => [r.readGlobalIndex()]]),
    global_set: opcodeSimpleArgs<[globalidx: SpiderGlobal]>(0x24, [(w, globalidx) => w.writeGlobalIndex(globalidx), r => [r.readGlobalIndex()]]),

    // Table Instructions

    table_get: opcodeSimpleArgs<[table: SpiderTable]>(0x25, serializeTable),
    table_set: opcodeSimpleArgs<[table: SpiderTable]>(0x26, serializeTable),
    table_init: opcodeSecondaryArgs<[elem: SpiderElement, table: SpiderTable]>(0xfc, 12, [(w, elem, tbl) => {
        w.writeElementIndex(elem);
        w.writeTableIndex(tbl);
    }, r => [r.readElementIndex(), r.readTableIndex()]]),
    elem_drop: opcodeSecondaryArgs<[elem: SpiderElement]>(0xfc, 13, [(w, elem) => w.writeElementIndex(elem), r => [r.readElementIndex()]]),
    table_copy: opcodeSecondaryArgs<[destTable: SpiderTable, srcTable: SpiderTable]>(0xfc, 14, [(w, destTable, srcTable) => {
        w.writeTableIndex(destTable);
        w.writeTableIndex(srcTable);
    }, r => [r.readTableIndex(), r.readTableIndex()]]),
    table_grow: opcodeSecondaryArgs<[table: SpiderTable]>(0xfc, 15, serializeTable),
    table_size: opcodeSecondaryArgs<[table: SpiderTable]>(0xfc, 16, serializeTable),
    table_fill: opcodeSecondaryArgs<[table: SpiderTable]>(0xfc, 17, serializeTable),

    // Memory Instructions

    i32_load: opcodeSimpleArgs<[align: number, offset: number]>(0x28, serializeMemarg),
    i64_load: opcodeSimpleArgs<[align: number, offset: number]>(0x29, serializeMemarg),
    f32_load: opcodeSimpleArgs<[align: number, offset: number]>(0x2a, serializeMemarg),
    f64_load: opcodeSimpleArgs<[align: number, offset: number]>(0x2b, serializeMemarg),
    i32_load8_s: opcodeSimpleArgs<[align: number, offset: number]>(0x2c, serializeMemarg),
    i32_load8_u: opcodeSimpleArgs<[align: number, offset: number]>(0x2d, serializeMemarg),
    i32_load16_s: opcodeSimpleArgs<[align: number, offset: number]>(0x2e, serializeMemarg),
    i32_load16_u: opcodeSimpleArgs<[align: number, offset: number]>(0x2f, serializeMemarg),
    i64_load8_s: opcodeSimpleArgs<[align: number, offset: number]>(0x30, serializeMemarg),
    i64_load8_u: opcodeSimpleArgs<[align: number, offset: number]>(0x31, serializeMemarg),
    i64_load16_s: opcodeSimpleArgs<[align: number, offset: number]>(0x32, serializeMemarg),
    i64_load16_u: opcodeSimpleArgs<[align: number, offset: number]>(0x33, serializeMemarg),
    i64_load32_s: opcodeSimpleArgs<[align: number, offset: number]>(0x34, serializeMemarg),
    i64_load32_u: opcodeSimpleArgs<[align: number, offset: number]>(0x35, serializeMemarg),
    i32_store: opcodeSimpleArgs<[align: number, offset: number]>(0x36, serializeMemarg),
    i64_store: opcodeSimpleArgs<[align: number, offset: number]>(0x37, serializeMemarg),
    f32_store: opcodeSimpleArgs<[align: number, offset: number]>(0x38, serializeMemarg),
    f64_store: opcodeSimpleArgs<[align: number, offset: number]>(0x39, serializeMemarg),
    i32_store8: opcodeSimpleArgs<[align: number, offset: number]>(0x3a, serializeMemarg),
    i32_store16: opcodeSimpleArgs<[align: number, offset: number]>(0x3b, serializeMemarg),
    i64_store8: opcodeSimpleArgs<[align: number, offset: number]>(0x3c, serializeMemarg),
    i64_store16: opcodeSimpleArgs<[align: number, offset: number]>(0x3d, serializeMemarg),
    i64_store32: opcodeSimpleArgs<[align: number, offset: number]>(0x3e, serializeMemarg),
    memory_size: opcodeSimpleArgs<[mem: SpiderMemory]>(0x3F, serializeMemory),
    memory_grow: opcodeSimpleArgs<[mem: SpiderMemory]>(0x40, serializeMemory),
    memory_init: opcodeSecondaryArgs<[data: SpiderData, mem: SpiderMemory]>(0xfc, 8, [(w, data, mem) => {
        w.writeDataIndex(data);
        w.writeMemoryIndex(mem);
    }, r => [r.readDataIndex(), r.readMemoryIndex()]]),
    data_drop: opcodeSecondaryArgs<[data: SpiderData]>(0xfc, 9, [
        (w, data) => w.writeDataIndex(data),
        r => [r.readDataIndex()]
    ]),
    memory_copy: opcodeSecondaryArgs<[destMem: SpiderMemory, srcMem: SpiderMemory]>(0xfc, 10, [(w, destMem, srcMem) => {
        w.writeMemoryIndex(destMem);
        w.writeMemoryIndex(srcMem);
    }, r => [r.readMemoryIndex(), r.readMemoryIndex()]]),
    memory_fill: opcodeSecondaryArgs<[mem: SpiderMemory]>(0xfc, 11, serializeMemory),

    // Numeric Instructions
    i32_const: opcodeSimpleArgs<[n: number]>(0x41, [(w, n) => w.writeSLEB128(n), r => [r.readSLEB128()]]),
    i64_const: opcodeSimpleArgs<[n: number]>(0x42, [(w, n) => w.writeSLEB128(n), r => [r.readSLEB128()]]),
    f32_const: opcodeSimpleArgs<[z: number]>(0x43, [(w, z) => w.writeFloat32(z), r => [r.readFloat32()]]),
    f64_const: opcodeSimpleArgs<[z: number]>(0x44, [(w, z) => w.writeFloat64(z), r => [r.readFloat64()]]),

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
    f64_reinterpret_i64: opcodeSimple(0xbf),

    i32_extend8_s: opcodeSimple(0xc0),
    i32_extend16_s: opcodeSimple(0xc1),
    i64_extend8_s: opcodeSimple(0xc2),
    i64_extend16_s: opcodeSimple(0xc3),
    i64_extend32_s: opcodeSimple(0xc4),

    i32_trunc_sat_f32_s: opcodeSecondary(0xfc, 0),
    i32_trunc_sat_f32_u: opcodeSecondary(0xfc, 1),
    i32_trunc_sat_f64_s: opcodeSecondary(0xfc, 2),
    i32_trunc_sat_f64_u: opcodeSecondary(0xfc, 3),
    i64_trunc_sat_f32_s: opcodeSecondary(0xfc, 4),
    i64_trunc_sat_f32_u: opcodeSecondary(0xfc, 5),
    i64_trunc_sat_f64_s: opcodeSecondary(0xfc, 6),
    i64_trunc_sat_f64_u: opcodeSecondary(0xfc, 7),

    // Vector Instructions

    v128_load: opcodeSecondaryArgs<[align: number, offset: number]>(0xfd, 0, serializeMemarg),
    v128_load8x8_s: opcodeSecondaryArgs<[align: number, offset: number]>(0xfd, 1, serializeMemarg),
    v128_load8x8_u: opcodeSecondaryArgs<[align: number, offset: number]>(0xfd, 2, serializeMemarg),
    v128_load16x4_s: opcodeSecondaryArgs<[align: number, offset: number]>(0xfd, 3, serializeMemarg),
    v128_load16x4_u: opcodeSecondaryArgs<[align: number, offset: number]>(0xfd, 4, serializeMemarg),
    v128_load32x2_s: opcodeSecondaryArgs<[align: number, offset: number]>(0xfd, 5, serializeMemarg),
    v128_load32x2_u: opcodeSecondaryArgs<[align: number, offset: number]>(0xfd, 6, serializeMemarg),
    v128_load8_splat: opcodeSecondaryArgs<[align: number, offset: number]>(0xfd, 7, serializeMemarg),
    v128_load16_splat: opcodeSecondaryArgs<[align: number, offset: number]>(0xfd, 8, serializeMemarg),
    v128_load32_splat: opcodeSecondaryArgs<[align: number, offset: number]>(0xfd, 9, serializeMemarg),
    v128_load64_splat: opcodeSecondaryArgs<[align: number, offset: number]>(0xfd, 10, serializeMemarg),
    v128_load32_zero: opcodeSecondaryArgs<[align: number, offset: number]>(0xfd, 92, serializeMemarg),
    v128_load64_zero: opcodeSecondaryArgs<[align: number, offset: number]>(0xfd, 93, serializeMemarg),
    v128_store: opcodeSecondaryArgs<[align: number, offset: number]>(0xfd, 11, serializeMemarg),
    v128_load8_lane: opcodeSecondaryArgs<[align: number, offset: number, lane: number]>(0xfd, 84, serializeMemargLane),
    v128_load16_lane: opcodeSecondaryArgs<[align: number, offset: number, lane: number]>(0xfd, 85, serializeMemargLane),
    v128_load32_lane: opcodeSecondaryArgs<[align: number, offset: number, lane: number]>(0xfd, 86, serializeMemargLane),
    v128_load64_lane: opcodeSecondaryArgs<[align: number, offset: number, lane: number]>(0xfd, 87, serializeMemargLane),
    v128_store8_lane: opcodeSecondaryArgs<[align: number, offset: number, lane: number]>(0xfd, 88, serializeMemargLane),
    v128_store16_lane: opcodeSecondaryArgs<[align: number, offset: number, lane: number]>(0xfd, 89, serializeMemargLane),
    v128_store32_lane: opcodeSecondaryArgs<[align: number, offset: number, lane: number]>(0xfd, 90, serializeMemargLane),
    v128_store64_lane: opcodeSecondaryArgs<[align: number, offset: number, lane: number]>(0xfd, 91, serializeMemargLane),

    v128_const: opcodeSecondaryArgs<[data: ArrayLike<number>]>(0xfd, 12, [(w, data) => {
        if (data.length !== 16) throw new Error("v128_const data array must contain 16 bytes.");
        w.write(data);
    }, r => [r.read(16)]]),

    v128_shuffle: opcodeSecondaryArgs<[lanes: ArrayLike<number>]>(0xfd, 13, [(w, data) => {
        if (data.length !== 16) throw new Error("v128_const data array must contain 16 lanes.");
        w.write(data);
    }, r => [r.read(16)]]),

    i8x16_extract_lane_s: opcodeSecondaryArgs<[lane: number]>(0xfd, 21, serializeByte),
    i8x16_extract_lane_u: opcodeSecondaryArgs<[lane: number]>(0xfd, 22, serializeByte),
    i8x16_replace_lane: opcodeSecondaryArgs<[lane: number]>(0xfd, 23, serializeByte),
    i16x8_extract_lane_s: opcodeSecondaryArgs<[lane: number]>(0xfd, 24, serializeByte),
    i16x8_extract_lane_u: opcodeSecondaryArgs<[lane: number]>(0xfd, 25, serializeByte),
    i16x8_replace_lane: opcodeSecondaryArgs<[lane: number]>(0xfd, 26, serializeByte),
    i32x4_extract_lane: opcodeSecondaryArgs<[lane: number]>(0xfd, 27, serializeByte),
    i32x4_replace_lane: opcodeSecondaryArgs<[lane: number]>(0xfd, 28, serializeByte),
    i64x2_extract_lane: opcodeSecondaryArgs<[lane: number]>(0xfd, 29, serializeByte),
    i64x2_replace_lane: opcodeSecondaryArgs<[lane: number]>(0xfd, 30, serializeByte),
    f32x4_extract_lane: opcodeSecondaryArgs<[lane: number]>(0xfd, 31, serializeByte),
    f32x4_replace_lane: opcodeSecondaryArgs<[lane: number]>(0xfd, 32, serializeByte),
    f64x2_extract_lane: opcodeSecondaryArgs<[lane: number]>(0xfd, 33, serializeByte),
    f64x2_replace_lane: opcodeSecondaryArgs<[lane: number]>(0xfd, 34, serializeByte),

    i8x16_swizzle: opcodeSecondary(0xFD, 14),
    i8x16_splat: opcodeSecondary(0xFD, 15),
    i16x8_splat: opcodeSecondary(0xFD, 16),
    i32x4_splat: opcodeSecondary(0xFD, 17),
    i64x2_splat: opcodeSecondary(0xFD, 18),
    f32x4_splat: opcodeSecondary(0xFD, 19),
    f64x2_splat: opcodeSecondary(0xFD, 20),
    i8x16_eq: opcodeSecondary(0xFD, 35),
    i8x16_ne: opcodeSecondary(0xFD, 36),
    i8x16_lt_s: opcodeSecondary(0xFD, 37),
    i8x16_lt_u: opcodeSecondary(0xFD, 38),
    i8x16_gt_s: opcodeSecondary(0xFD, 39),
    i8x16_gt_u: opcodeSecondary(0xFD, 40),
    i8x16_le_s: opcodeSecondary(0xFD, 41),
    i8x16_le_u: opcodeSecondary(0xFD, 42),
    i8x16_ge_s: opcodeSecondary(0xFD, 43),
    i8x16_ge_u: opcodeSecondary(0xFD, 44),
    i16x8_eq: opcodeSecondary(0xFD, 45),
    i16x8_ne: opcodeSecondary(0xFD, 46),
    i16x8_lt_s: opcodeSecondary(0xFD, 47),
    i16x8_lt_u: opcodeSecondary(0xFD, 48),
    i16x8_gt_s: opcodeSecondary(0xFD, 49),
    i16x8_gt_u: opcodeSecondary(0xFD, 50),
    i16x8_le_s: opcodeSecondary(0xFD, 51),
    i16x8_le_u: opcodeSecondary(0xFD, 52),
    i16x8_ge_s: opcodeSecondary(0xFD, 53),
    i16x8_ge_u: opcodeSecondary(0xFD, 54),
    i32x4_eq: opcodeSecondary(0xFD, 55),
    i32x4_ne: opcodeSecondary(0xFD, 56),
    i32x4_lt_s: opcodeSecondary(0xFD, 57),
    i32x4_lt_u: opcodeSecondary(0xFD, 58),
    i32x4_gt_s: opcodeSecondary(0xFD, 59),
    i32x4_gt_u: opcodeSecondary(0xFD, 60),
    i32x4_le_s: opcodeSecondary(0xFD, 61),
    i32x4_le_u: opcodeSecondary(0xFD, 62),
    i32x4_ge_s: opcodeSecondary(0xFD, 63),
    i32x4_ge_u: opcodeSecondary(0xFD, 64),
    i64x2_eq: opcodeSecondary(0xFD, 214),
    i64x2_ne: opcodeSecondary(0xFD, 215),
    i64x2_lt_s: opcodeSecondary(0xFD, 216),
    i64x2_gt_s: opcodeSecondary(0xFD, 217),
    i64x2_le_s: opcodeSecondary(0xFD, 218),
    i64x2_ge_s: opcodeSecondary(0xFD, 219),
    f32x4_eq: opcodeSecondary(0xFD, 65),
    f32x4_ne: opcodeSecondary(0xFD, 66),
    f32x4_lt: opcodeSecondary(0xFD, 67),
    f32x4_gt: opcodeSecondary(0xFD, 68),
    f32x4_le: opcodeSecondary(0xFD, 69),
    f32x4_ge: opcodeSecondary(0xFD, 70),
    f64x2_eq: opcodeSecondary(0xFD, 71),
    f64x2_ne: opcodeSecondary(0xFD, 72),
    f64x2_lt: opcodeSecondary(0xFD, 73),
    f64x2_gt: opcodeSecondary(0xFD, 74),
    f64x2_le: opcodeSecondary(0xFD, 75),
    f64x2_ge: opcodeSecondary(0xFD, 76),
    v128_not: opcodeSecondary(0xFD, 77),
    v128_and: opcodeSecondary(0xFD, 78),
    v128_andnot: opcodeSecondary(0xFD, 79),
    v128_or: opcodeSecondary(0xFD, 80),
    v128_xor: opcodeSecondary(0xFD, 81),
    v128_bitselect: opcodeSecondary(0xFD, 82),
    v128_any_true: opcodeSecondary(0xFD, 83),
    i8x16_abs: opcodeSecondary(0xFD, 96),
    i8x16_neg: opcodeSecondary(0xFD, 97),
    i8x16_popcnt: opcodeSecondary(0xFD, 98),
    i8x16_all_true: opcodeSecondary(0xFD, 99),
    i8x16_bitmask: opcodeSecondary(0xFD, 100),
    i8x16_narrow_i16x8_s: opcodeSecondary(0xFD, 101),
    i8x16_narrow_i16x8_u: opcodeSecondary(0xFD, 102),
    i8x16_shl: opcodeSecondary(0xFD, 107),
    i8x16_shr_s: opcodeSecondary(0xFD, 108),
    i8x16_shr_u: opcodeSecondary(0xFD, 109),
    i8x16_add: opcodeSecondary(0xFD, 110),
    i8x16_add_sat_s: opcodeSecondary(0xFD, 111),
    i8x16_add_sat_u: opcodeSecondary(0xFD, 112),
    i8x16_sub: opcodeSecondary(0xFD, 113),
    i8x16_sub_sat_s: opcodeSecondary(0xFD, 114),
    i8x16_sub_sat_u: opcodeSecondary(0xFD, 115),
    i8x16_min_s: opcodeSecondary(0xFD, 118),
    i8x16_min_u: opcodeSecondary(0xFD, 119),
    i8x16_max_s: opcodeSecondary(0xFD, 120),
    i8x16_max_u: opcodeSecondary(0xFD, 121),
    i8x16_avgr_u: opcodeSecondary(0xFD, 123),
    i16x8_extadd_pairwise_i8x16_s: opcodeSecondary(0xFD, 124),
    i16x8_extadd_pairwise_i8x16_u: opcodeSecondary(0xFD, 125),
    i16x8_abs: opcodeSecondary(0xFD, 128),
    i16x8_neg: opcodeSecondary(0xFD, 129),
    i16x8_q15mulr_sat_s: opcodeSecondary(0xFD, 130),
    i16x8_all_true: opcodeSecondary(0xFD, 131),
    i16x8_bitmask: opcodeSecondary(0xFD, 132),
    i16x8_narrow_i32x4_s: opcodeSecondary(0xFD, 133),
    i16x8_narrow_i32x4_u: opcodeSecondary(0xFD, 134),
    i16x8_extend_low_i8x16_s: opcodeSecondary(0xFD, 135),
    i16x8_extend_high_i8x16_s: opcodeSecondary(0xFD, 136),
    i16x8_extend_low_i8x16_u: opcodeSecondary(0xFD, 137),
    i16x8_extend_high_i8x16_u: opcodeSecondary(0xFD, 138),
    i16x8_shl: opcodeSecondary(0xFD, 139),
    i16x8_shr_s: opcodeSecondary(0xFD, 140),
    i16x8_shr_u: opcodeSecondary(0xFD, 141),
    i16x8_add: opcodeSecondary(0xFD, 142),
    i16x8_add_sat_s: opcodeSecondary(0xFD, 143),
    i16x8_add_sat_u: opcodeSecondary(0xFD, 144),
    i16x8_sub: opcodeSecondary(0xFD, 145),
    i16x8_sub_sat_s: opcodeSecondary(0xFD, 146),
    i16x8_sub_sat_u: opcodeSecondary(0xFD, 147),
    i16x8_mul: opcodeSecondary(0xFD, 149),
    i16x8_min_s: opcodeSecondary(0xFD, 150),
    i16x8_min_u: opcodeSecondary(0xFD, 151),
    i16x8_max_s: opcodeSecondary(0xFD, 152),
    i16x8_max_u: opcodeSecondary(0xFD, 153),
    i16x8_avgr_u: opcodeSecondary(0xFD, 155),
    i16x8_extmul_low_i8x16_s: opcodeSecondary(0xFD, 156),
    i16x8_extmul_high_i8x16_s: opcodeSecondary(0xFD, 157),
    i16x8_extmul_low_i8x16_u: opcodeSecondary(0xFD, 158),
    i16x8_extmul_high_i8x16_u: opcodeSecondary(0xFD, 159),
    i32x4_extadd_pairwise_i16x8_s: opcodeSecondary(0xFD, 126),
    i32x4_extadd_pairwise_i16x8_u: opcodeSecondary(0xFD, 127),
    i32x4_abs: opcodeSecondary(0xFD, 160),
    i32x4_neg: opcodeSecondary(0xFD, 161),
    i32x4_all_true: opcodeSecondary(0xFD, 163),
    i32x4_bitmask: opcodeSecondary(0xFD, 164),
    i32x4_extend_low_i16x8_s: opcodeSecondary(0xFD, 167),
    i32x4_extend_high_i16x8_s: opcodeSecondary(0xFD, 168),
    i32x4_extend_low_i16x8_u: opcodeSecondary(0xFD, 169),
    i32x4_extend_high_i16x8_u: opcodeSecondary(0xFD, 170),
    i32x4_shl: opcodeSecondary(0xFD, 171),
    i32x4_shr_s: opcodeSecondary(0xFD, 172),
    i32x4_shr_u: opcodeSecondary(0xFD, 173),
    i32x4_add: opcodeSecondary(0xFD, 174),
    i32x4_sub: opcodeSecondary(0xFD, 177),
    i32x4_mul: opcodeSecondary(0xFD, 181),
    i32x4_min_s: opcodeSecondary(0xFD, 182),
    i32x4_min_u: opcodeSecondary(0xFD, 183),
    i32x4_max_s: opcodeSecondary(0xFD, 184),
    i32x4_max_u: opcodeSecondary(0xFD, 185),
    i32x4_dot_i16x8_s: opcodeSecondary(0xFD, 186),
    i32x4_extmul_low_i16x8_s: opcodeSecondary(0xFD, 188),
    i32x4_extmul_high_i16x8_s: opcodeSecondary(0xFD, 189),
    i32x4_extmul_low_i16x8_u: opcodeSecondary(0xFD, 190),
    i32x4_extmul_high_i16x8_u: opcodeSecondary(0xFD, 191),
    i64x2_abs: opcodeSecondary(0xFD, 192),
    i64x2_neg: opcodeSecondary(0xFD, 193),
    i64x2_all_true: opcodeSecondary(0xFD, 195),
    i64x2_bitmask: opcodeSecondary(0xFD, 196),
    i64x2_extend_low_i32x4_s: opcodeSecondary(0xFD, 199),
    i64x2_extend_high_i32x4_s: opcodeSecondary(0xFD, 200),
    i64x2_extend_low_i32x4_u: opcodeSecondary(0xFD, 201),
    i64x2_extend_high_i32x4_u: opcodeSecondary(0xFD, 202),
    i64x2_shl: opcodeSecondary(0xFD, 203),
    i64x2_shr_s: opcodeSecondary(0xFD, 204),
    i64x2_shr_u: opcodeSecondary(0xFD, 205),
    i64x2_add: opcodeSecondary(0xFD, 206),
    i64x2_sub: opcodeSecondary(0xFD, 209),
    i64x2_mul: opcodeSecondary(0xFD, 213),
    i64x2_extmul_low_i32x4_s: opcodeSecondary(0xFD, 220),
    i64x2_extmul_high_i32x4_s: opcodeSecondary(0xFD, 221),
    i64x2_extmul_low_i32x4_u: opcodeSecondary(0xFD, 222),
    i64x2_extmul_high_i32x4_u: opcodeSecondary(0xFD, 223),
    f32x4_ceil: opcodeSecondary(0xFD, 103),
    f32x4_floor: opcodeSecondary(0xFD, 104),
    f32x4_trunc: opcodeSecondary(0xFD, 105),
    f32x4_nearest: opcodeSecondary(0xFD, 106),
    f32x4_abs: opcodeSecondary(0xFD, 224),
    f32x4_neg: opcodeSecondary(0xFD, 225),
    f32x4_sqrt: opcodeSecondary(0xFD, 227),
    f32x4_add: opcodeSecondary(0xFD, 228),
    f32x4_sub: opcodeSecondary(0xFD, 229),
    f32x4_mul: opcodeSecondary(0xFD, 230),
    f32x4_div: opcodeSecondary(0xFD, 231),
    f32x4_min: opcodeSecondary(0xFD, 232),
    f32x4_max: opcodeSecondary(0xFD, 233),
    f32x4_pmin: opcodeSecondary(0xFD, 234),
    f32x4_pmax: opcodeSecondary(0xFD, 235),
    f64x2_ceil: opcodeSecondary(0xFD, 116),
    f64x2_floor: opcodeSecondary(0xFD, 117),
    f64x2_trunc: opcodeSecondary(0xFD, 122),
    f64x2_nearest: opcodeSecondary(0xFD, 148),
    f64x2_abs: opcodeSecondary(0xFD, 236),
    f64x2_neg: opcodeSecondary(0xFD, 237),
    f64x2_sqrt: opcodeSecondary(0xFD, 239),
    f64x2_add: opcodeSecondary(0xFD, 240),
    f64x2_sub: opcodeSecondary(0xFD, 241),
    f64x2_mul: opcodeSecondary(0xFD, 242),
    f64x2_div: opcodeSecondary(0xFD, 243),
    f64x2_min: opcodeSecondary(0xFD, 244),
    f64x2_max: opcodeSecondary(0xFD, 245),
    f64x2_pmin: opcodeSecondary(0xFD, 246),
    f64x2_pmax: opcodeSecondary(0xFD, 247),
    i32x4_trunc_sat_f32x4_s: opcodeSecondary(0xFD, 248),
    i32x4_trunc_sat_f32x4_u: opcodeSecondary(0xFD, 249),
    f32x4_convert_i32x4_s: opcodeSecondary(0xFD, 250),
    f32x4_convert_i32x4_u: opcodeSecondary(0xFD, 251),
    i32x4_trunc_sat_f64x2_s_zero: opcodeSecondary(0xFD, 252),
    i32x4_trunc_sat_f64x2_u_zero: opcodeSecondary(0xFD, 253),
    f64x2_convert_low_i32x4_s: opcodeSecondary(0xFD, 254),
    f64x2_convert_low_i32x4_u: opcodeSecondary(0xFD, 255),
    f32x4_demote_f64x2_zero: opcodeSecondary(0xFD, 94),
    f64x2_promote_low_f32x4: opcodeSecondary(0xFD, 95),
}
