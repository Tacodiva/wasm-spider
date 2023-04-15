import { SpiderGlobalDefinition } from "./SpiderGlobal";
import { SpiderTypeDefinition } from "./SpiderType";
import { WasmImportType, WasmValueType } from "./enums";

interface SpiderImportBase {
    importType: WasmImportType;
    name: string;
    module: string;
}

export interface SpiderImportFunction extends SpiderImportBase {
    importType: WasmImportType.func,
    type: SpiderTypeDefinition
}

export interface SpiderImportGlobal extends SpiderImportBase {
    importType: WasmImportType.global,
    type: WasmValueType,
    mutable: boolean
}

export interface SpiderImportMemory extends SpiderImportBase {
    importType: WasmImportType.mem,
    minSize: number,
    maxSize: number | undefined
}

export interface SpiderImportTable extends SpiderImportBase {
    importType: WasmImportType.table,
    minSize: number,
    maxSize: number | undefined
}

export type SpiderImport = SpiderImportFunction | SpiderImportGlobal | SpiderImportMemory | SpiderImportTable;