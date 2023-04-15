import { SpiderFunction } from './SpiderFunction';
import { SpiderGlobal } from './SpiderGlobal';
import { WasmExportType } from './enums';

interface ISpiderExport {
    type: WasmExportType;
    name: string;
}

export interface SpiderExportFunction extends ISpiderExport {
    type: WasmExportType.func;
    value: SpiderFunction
}

export interface SpiderExportGlobal extends ISpiderExport {
    type: WasmExportType.global;
    value: SpiderGlobal;
}

export type SpiderExport = SpiderExportFunction | SpiderExportGlobal;