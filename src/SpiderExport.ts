import { SpiderFunctionDefinition } from './SpiderFunction';
import { SpiderGlobalDefinition } from './SpiderGlobal';
import { SpiderMemoryDefinition } from './SpiderMemory';
import { SpiderTableDefinition } from './SpiderTable';
import { WasmExportType } from './enums';

interface ISpiderExport {
    type: WasmExportType;
    name: string;
}

export interface SpiderExportFunction extends ISpiderExport {
    type: WasmExportType.func;
    value: SpiderFunctionDefinition
}

export interface SpiderExportGlobal extends ISpiderExport {
    type: WasmExportType.global;
    value: SpiderGlobalDefinition;
}

export interface SpiderExportMemory extends ISpiderExport {
    type: WasmExportType.mem;
    value: SpiderMemoryDefinition;
}

export interface SpiderExportTable extends ISpiderExport {
    type: WasmExportType.table;
    value: SpiderTableDefinition;
}

export type SpiderExport = SpiderExportFunction | SpiderExportGlobal | SpiderExportMemory | SpiderExportTable;