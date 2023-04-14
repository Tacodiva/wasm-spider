import { SpiderModule } from './SpiderModule';
import { WasmWriter } from './WasmWriter';
export { WasmOpcode, WasmValueType } from './enums';
export { type SpiderModule } from './SpiderModule';
export { type ISpiderInstr } from './SpiderInstruction'
export { type SpiderFunction } from './SpiderFunction';
export { type SpiderType } from './SpiderType'
export { type SpiderExport, type SpiderExportFunction} from './SpiderExport';


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
