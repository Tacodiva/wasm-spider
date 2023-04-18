import { SpiderFunctionDefinition } from './SpiderFunction';
import { SpiderGlobalDefinition } from './SpiderGlobal';
import { SpiderMemoryDefinition } from './SpiderMemory';
import { SpiderTableDefinition } from './SpiderTable';
import { SpiderExportType } from './enums';

interface SpiderExportBase {
    type: SpiderExportType;
    name: string;
}

export interface SpiderExportFunction extends SpiderExportBase {
    type: SpiderExportType.func;
    value: SpiderFunctionDefinition
}

export interface SpiderExportGlobal extends SpiderExportBase {
    type: SpiderExportType.global;
    value: SpiderGlobalDefinition;
}

export interface SpiderExportMemory extends SpiderExportBase {
    type: SpiderExportType.mem;
    value: SpiderMemoryDefinition;
}

export interface SpiderExportTable extends SpiderExportBase {
    type: SpiderExportType.table;
    value: SpiderTableDefinition;
}

export type SpiderExport = SpiderExportFunction | SpiderExportGlobal | SpiderExportMemory | SpiderExportTable;