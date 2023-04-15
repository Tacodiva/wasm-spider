import { SpiderGlobal } from "./SpiderGlobal";
import { SpiderType } from "./SpiderType";
import { WasmImportType, WasmValueType } from "./enums";

interface SpiderImportBase {
    importType: WasmImportType;
    name: string;
    module: string;
}

export interface SpiderImportFunction extends SpiderImportBase {
    importType: WasmImportType.func,
    functionType: SpiderType
}

export interface SpiderImportGlobal extends SpiderImportBase {
    importType: WasmImportType.global,
    globalType: WasmValueType,
    globalMutable: boolean
}

export type SpiderImport = SpiderImportFunction | SpiderImportGlobal;