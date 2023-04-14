import { SpiderFunction } from './SpiderFunction';
import { WasmExportType } from './enums';

interface ISpiderExport {
    type: WasmExportType;
    name: string;
}

export interface SpiderExportFunction extends ISpiderExport {
    type: WasmExportType.func;
    value: SpiderFunction
}

export type SpiderExport = SpiderExportFunction;