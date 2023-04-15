export { WasmOpcode, WasmValueType } from './enums';
export { type SpiderModule } from './SpiderModule';
export { type ISpiderInstr } from './SpiderInstruction'
export { type SpiderFunctionDefinition, type SpiderFunction } from './SpiderFunction';
export { type SpiderTypeDefinition, type SpiderType } from './SpiderType'
export { type SpiderGlobalDefinition, type SpiderGlobal } from './SpiderGlobal';
export { type SpiderMemoryDefinition, type SpiderMemory } from './SpiderMemory';
export { type SpiderTableDefinition, type SpiderTable } from './SpiderTable';
export { type SpiderElementDefinition, type SpiderElement } from './SpiderElement';
export { type SpiderExport, type SpiderExportFunction, type SpiderExportGlobal, type SpiderExportMemory, type SpiderExportTable } from './SpiderExport';
export { type SpiderImport, type SpiderImportFunction, type SpiderImportGlobal, type SpiderImportMemory, type SpiderImportTable } from './SpiderImport'
export { type LocalReference as VariableReference, type LocalParameterReference as ParameterVarReference, type LocalVariableReference as LocalVarReference } from './LocalReference';

import { SpiderModule } from './SpiderModule';
import { WasmWriter } from './WasmWriter';

export namespace spider {
    export const createModule = function (): SpiderModule {
        return new SpiderModule();
    }

    export const writeModule = function (module: SpiderModule): ArrayBuffer {
        const writer = new WasmWriter();
        writer.writeModule(module);
        return writer.toBuffer().buffer;
    }

    export const compileModule = function (module: SpiderModule): Promise<WebAssembly.Module> {
        return WebAssembly.compile(writeModule(module));
    }
}
