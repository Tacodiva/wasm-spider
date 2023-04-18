export { SpiderValueType, SpiderNumberType, SpiderReferenceType, SpiderCustomSectionPosition, type SpiderExportType, type SpiderImportType } from './enums';
export { SpiderOpcodes, type SpiderOpcode } from './SpiderOpcode';
export { SpiderExpression } from './SpiderExpression';
export { type SpiderModule } from './SpiderModule';
export { type SpiderInstruction } from './SpiderInstruction'
export { type SpiderFunctionDefinition, type SpiderFunction } from './SpiderFunction';
export { type SpiderTypeDefinition, type SpiderType } from './SpiderType'
export { type SpiderGlobalDefinition, type SpiderGlobal } from './SpiderGlobal';
export { type SpiderMemoryDefinition, type SpiderMemory } from './SpiderMemory';
export { type SpiderTableDefinition, type SpiderTable } from './SpiderTable';
export { type SpiderElementFuncIdxActive, type SpiderElementFuncIdxInactive, type SpiderElementExprActive, type SpiderElementExprInactive, type SpiderElement } from './SpiderElement';
export { type SpiderDataActive, type SpiderDataPassive, type SpiderData } from './SpiderData';
export { type SpiderCustomSectionDefinition, type SpiderCustomSection } from './SpiderCustomSection';
export { type SpiderExport, type SpiderExportFunction, type SpiderExportGlobal, type SpiderExportMemory, type SpiderExportTable } from './SpiderExport';
export { type SpiderImport, type SpiderImportFunction, type SpiderImportGlobal, type SpiderImportMemory, type SpiderImportTable } from './SpiderImport'
export { type LocalReference, type LocalParameterReference, type LocalVariableReference } from './LocalReference';
export { type SpiderConfig } from './SpiderModuleWriter';

import { SpiderModule } from './SpiderModule';
import { SpiderModuleReader } from './SpiderModuleReader';
import { SpiderConfig, SpiderModuleWriter } from './SpiderModuleWriter';

export namespace spider {
    export const createModule = function (): SpiderModule {
        return new SpiderModule();
    }

    export const readModule = function (module: Uint8Array) {
        return new SpiderModuleReader(module).readModule();
    }

    export const writeModule = function (module: SpiderModule, cfg: Partial<SpiderConfig> = {}): Uint8Array {
        const writer = new SpiderModuleWriter(cfg);
        writer.writeModule(module);
        return writer.toBuffer();
    }

    export const compileModule = function (module: SpiderModule): Promise<WebAssembly.Module> {
        return WebAssembly.compile(writeModule(module));
    }
}
