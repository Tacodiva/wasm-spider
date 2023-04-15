import { WasmOpcode, WasmValueType, spider } from "../src";

test('Simple Add', async () => {
    // Create a blank WebAssembly module
    const spiderModule = spider.createModule();

    // Create a function
    const addFunction = spiderModule.createFunction({
        parameters: [WasmValueType.f64],
        results: [WasmValueType.f64]
    });

    const global = spiderModule.createGlobal(WasmValueType.f64, true, 60);
    spiderModule.exportGlobal("global", global);

    addFunction.body.emit(WasmOpcode.local_get, 0);
    addFunction.body.emit(WasmOpcode.global_get, global);
    addFunction.body.emit(WasmOpcode.f64_add);
    addFunction.body.emit(WasmOpcode.local_get, 0);
    addFunction.body.emit(WasmOpcode.global_set, global);

    spiderModule.exportFunction("add", addFunction);

    const compiledModule = await spider.compileModule(spiderModule);

    const moduleInstance = await WebAssembly.instantiate(compiledModule);
    const compiledAdd = moduleInstance.exports.add as Function;
    const compiledGlobal = moduleInstance.exports.global as WebAssembly.Global;

    expect(compiledGlobal.value).toEqual(60);
    expect(compiledAdd(9)).toEqual(69);
    expect(compiledGlobal.value).toEqual(9);
});