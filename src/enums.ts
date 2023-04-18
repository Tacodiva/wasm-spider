export enum SpiderNumberType {
    i32 = 0x7F,
    i64 = 0x7E,
    f32 = 0x7D,
    f64 = 0x7C
}

export enum SpiderReferenceType {
    funcref = 0x70,
    externref = 0x6F
}

export enum SpiderVectorType {
    v128 = 0x7B
}

export type SpiderValueType = SpiderNumberType | SpiderReferenceType | SpiderVectorType;

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