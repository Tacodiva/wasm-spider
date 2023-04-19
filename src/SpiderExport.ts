import { SpiderFunctionDefinition } from './SpiderFunction';
import { SpiderGlobalDefinition } from './SpiderGlobal';
import { SpiderMemoryDefinition } from './SpiderMemory';
import { SpiderTableDefinition } from './SpiderTable';
import { SpiderExportType } from './enums';

interface SpiderExportBase {
    type: SpiderExportType;
    /** The name of the value being exported. */
    name: string;
}

/** An export which exports a function. */
export interface SpiderExportFunction extends SpiderExportBase {
    type: SpiderExportType.func;
    /** The exported function. */
    value: SpiderFunctionDefinition
}

/** An export which exports a global. */
export interface SpiderExportGlobal extends SpiderExportBase {
    type: SpiderExportType.global;
    /** The exported global. */
    value: SpiderGlobalDefinition;
}

/** An export which exports a memory. */
export interface SpiderExportMemory extends SpiderExportBase {
    type: SpiderExportType.mem;
     /** The exported memory. */
     value: SpiderMemoryDefinition;
}

/** An export which exports a table. */
export interface SpiderExportTable extends SpiderExportBase {
    type: SpiderExportType.table;
    /** The exported table. */
    value: SpiderTableDefinition;
}

/** Any value exported to another module. */
export type SpiderExport = SpiderExportFunction | SpiderExportGlobal | SpiderExportMemory | SpiderExportTable;