export enum WasmValueType {
    i32 = 0x7F,
    i64 = 0x7E,
    f32 = 0x7D,
    f64 = 0x7C
}

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
    AFTER_CODE,
    AFTER_DATA
}

export const enum WasmExportType {
    func = 0x00,
    table = 0x01,
    mem = 0x02,
    global = 0x03
}

export const enum WasmImportType {
    func = 0x00,
    table = 0x01,
    mem = 0x02,
    global = 0x03
}