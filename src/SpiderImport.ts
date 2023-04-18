import { SpiderGlobalDefinition } from "./SpiderGlobal";
import { SpiderTypeDefinition } from "./SpiderType";
import { SpiderImportType, SpiderReferenceType, SpiderValueType } from "./enums";

interface SpiderImportBase {
    importType: SpiderImportType;
    name: string;
    module: string;
}

export interface SpiderImportFunction extends SpiderImportBase {
    importType: SpiderImportType.func,
    type: SpiderTypeDefinition
}

export interface SpiderImportGlobal extends SpiderImportBase {
    importType: SpiderImportType.global,
    type: SpiderValueType,
    mutable: boolean
}

export interface SpiderImportMemory extends SpiderImportBase {
    importType: SpiderImportType.mem,
    minSize: number,
    maxSize: number | undefined
}

export interface SpiderImportTable extends SpiderImportBase {
    importType: SpiderImportType.table,
    type: SpiderReferenceType,
    minSize: number,
    maxSize: number | undefined
}

export type SpiderImport = SpiderImportFunction | SpiderImportGlobal | SpiderImportMemory | SpiderImportTable;