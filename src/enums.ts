/** The type of a number. */
export enum SpiderNumberType {
    /** A 32-bit integer. */
    i32 = 0x7F,
    /** A 64-bit integer. */
    i64 = 0x7E,
    /** A 32-bit floating-point. */
    f32 = 0x7D,
    /** A 64-bit floating-point. */
    f64 = 0x7C
}

/** The type of a reference. */
export enum SpiderReferenceType {
    /** A reference to a function. */
    funcref = 0x70,
    /** A reference to an external object. */
    externref = 0x6F
}

/** The type of a vector. Used for SIMD instructions. */
export enum SpiderVectorType {
    /** A 128-bit vector of packed integer or floating-point data. */
    v128 = 0x7B
}

/** The type of any value (like a parameter or variable). */
export type SpiderValueType = SpiderNumberType | SpiderReferenceType | SpiderVectorType;

/** The position of a custom section within the module. */
export enum SpiderCustomSectionPosition {
    AFTER_HEADER,
    AFTER_TYPE,
    AFTER_IMPORT,
    AFTER_FUNCTION,
    AFTER_TABLE,
    AFTER_MEMORY,
    AFTER_GLOBAL,
    AFTER_EXPORT,
    AFTER_START,
    AFTER_ELEMENT,
    AFTER_DATA_COUNT,
    AFTER_CODE,
    AFTER_DATA
}

export const enum SpiderExportType {
    func = 0x00,
    table = 0x01,
    mem = 0x02,
    global = 0x03
}

export const enum SpiderImportType {
    func = 0x00,
    table = 0x01,
    mem = 0x02,
    global = 0x03
}

export const enum WasmSectionType {
    custom = 0,
    type = 1,
    import = 2,
    function = 3,
    table = 4,
    memory = 5,
    global = 6,
    export = 7,
    start = 8,
    element = 9,
    code = 10,
    data = 11,
    dataCount = 12
}

export const enum WasmBlockOpcode {
    else = 0x05,
    end = 0x0b
}