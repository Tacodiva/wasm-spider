import { SpiderType } from "./SpiderType";
import { WasmImportType } from "./enums";

interface SpiderImportBase {
    importType: WasmImportType;
    name: string;
    module: string;
}

export interface SpiderImportFunction extends SpiderImportBase {
    importType: WasmImportType.func,
    functionType: SpiderType
}

export type SpiderImport = SpiderImportFunction;