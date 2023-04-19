import { SpiderTypeDefinition } from "./SpiderType";
import { SpiderImportType, SpiderReferenceType, SpiderValueType } from "./enums";

interface SpiderImportBase {
    importType: SpiderImportType;
    /** The name of the value being imported. */
    name: string;
    /** The name of the module the value is being imported from. */
    module: string;
}

/** A function imported from another module. */
export interface SpiderImportFunction extends SpiderImportBase {
    importType: SpiderImportType.func,
    /** The signature of the imported function. */
    type: SpiderTypeDefinition
}

/** A global imported from another module. */
export interface SpiderImportGlobal extends SpiderImportBase {
    importType: SpiderImportType.global,
    /** The type of the value held by the imported global. */
    type: SpiderValueType,
    /** True if the imported global is mutable. */
    mutable: boolean
}

/** Memory imported from another module. */
export interface SpiderImportMemory extends SpiderImportBase {
    importType: SpiderImportType.mem,
    /** The minimum number of pages the imported memory can have. */
    minSize: number,
    /** The larged number of pages the imported memory can be grown to. */
    maxSize: number | undefined
}
/** A table imported from another module. */
export interface SpiderImportTable extends SpiderImportBase {
    importType: SpiderImportType.table,
    /** The type of reference the imported table holds. */
    type: SpiderReferenceType,
    /** The minimum number of entries the imported table can have. */
    minSize: number,
    /** The maximum number of entries the imported table can be grown to. */
    maxSize: number | undefined
}

/**
 * A value imported from another module. 
 */
export type SpiderImport = SpiderImportFunction | SpiderImportGlobal | SpiderImportMemory | SpiderImportTable;