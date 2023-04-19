export { SpiderValueType, SpiderNumberType, SpiderReferenceType, SpiderVectorType, SpiderCustomSectionPosition, type SpiderExportType, type SpiderImportType } from './enums';
export { SpiderOpcodes, type SpiderOpcode } from './SpiderOpcode';
export { SpiderExpression, type SpiderExprConstNumber, type SpiderExprConstValue } from './SpiderExpression';
export { type SpiderModule, type SpiderTypeDesc } from './SpiderModule';
export { type SpiderInstruction } from './SpiderInstruction'
export { type SpiderFunctionDefinition, type SpiderFunction } from './SpiderFunction';
export { type SpiderTypeDefinition, type SpiderType } from './SpiderType'
export { type SpiderGlobalDefinition, type SpiderGlobal } from './SpiderGlobal';
export { type SpiderMemoryDefinition, type SpiderMemory } from './SpiderMemory';
export { type SpiderTableDefinition, type SpiderTable } from './SpiderTable';
export { type SpiderElementMode, type SpiderElementKind, type SpiderElementFuncIdxActive, type SpiderElementFuncIdxInactive, type SpiderElementExprActive, type SpiderElementExprInactive, type SpiderElement } from './SpiderElement';
export { type SpiderDataType, type SpiderDataActive, type SpiderDataPassive, type SpiderData } from './SpiderData';
export { type SpiderCustomSectionDefinition, type SpiderCustomSection } from './SpiderCustomSection';
export { type SpiderExport, type SpiderExportFunction, type SpiderExportGlobal, type SpiderExportMemory, type SpiderExportTable } from './SpiderExport';
export { type SpiderImport, type SpiderImportFunction, type SpiderImportGlobal, type SpiderImportMemory, type SpiderImportTable } from './SpiderImport'
export { type SpiderLocalReferenceType, type SpiderLocal, type SpiderLocalParameterReference, type SpiderLocalVariableReference, type SpiderLocalReference } from './SpiderLocalReference';
export { type SpiderWriteConfig } from './SpiderModuleWriter';
export { type SpiderReadConfig } from './SpiderModuleReader';

import { SpiderModule } from './SpiderModule';
import { SpiderModuleReader, SpiderReadConfig } from './SpiderModuleReader';
import { SpiderWriteConfig, SpiderModuleWriter } from './SpiderModuleWriter';

/**
 * Creates a new, empty {@link SpiderModule} for you to fill with all your awesome WASM.
 */
export const createModule = function (): SpiderModule {
    return new SpiderModule();
}

/**
 * Reads a binary WASM file into a {@link SpiderModule}. 
 * @param buffer The WASM binary.
 * @param cfg See {@link SpiderReadConfig}
 */
export const readModule = function (buffer: Uint8Array, cfg: Partial<SpiderReadConfig> = {}) {
    return new SpiderModuleReader(buffer, cfg).readModule();
}

/**
 * Writes a {@link SpiderModule} in the binary WASM format.
 * @param module The module to write
 * @param cfg See {@link SpiderWriteConfig}
 * @returns A buffer of the bytes which represent the module in WASM binary format.
 */
export const writeModule = function (module: SpiderModule, cfg: Partial<SpiderWriteConfig> = {}): Uint8Array {
    const writer = new SpiderModuleWriter(cfg);
    writer.writeModule(module);
    return writer.toBuffer();
}

/**
 * Compiles a {@link SpiderModule} into a {@link WebAssembly.Module}.
 * @param module 
 * @returns 
 */
export const compileModule = function (module: SpiderModule): Promise<WebAssembly.Module> {
    return WebAssembly.compile(writeModule(module, {
        mergeTypes: false
    }));
}
