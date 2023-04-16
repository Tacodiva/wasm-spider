import { SpiderOpcodes, WasmValueType, spider } from "../src";

test('Globals', async () => {
    // Create a blank WebAssembly module
    const spiderModule = spider.createModule();

    // Create a function
    const addFunction = spiderModule.createFunction({
        parameters: [],
        results: [WasmValueType.f64]
    });

    const moduleGlobal = spiderModule.createGlobal(WasmValueType.f64, true, 60);
    spiderModule.exportGlobal("global", moduleGlobal);

    const importedGlobal = spiderModule.importGlobal("test", "global", WasmValueType.f64, true);

    expect(moduleGlobal.value.getAsNumber()).toEqual(60);

    addFunction.body.emit(SpiderOpcodes.global_get, importedGlobal);
    addFunction.body.emit(SpiderOpcodes.global_get, moduleGlobal);
    addFunction.body.emit(SpiderOpcodes.f64_add);
    addFunction.body.emit(SpiderOpcodes.global_get, importedGlobal);
    addFunction.body.emit(SpiderOpcodes.global_set, moduleGlobal);

    spiderModule.exportFunction("add", addFunction);

    const compiledModule = await spider.compileModule(spiderModule);

    const runtimeImportedGlobal = new WebAssembly.Global({ value: "f64", mutable: true }, 0);
    const moduleInstance = await WebAssembly.instantiate(compiledModule, {
        test: {
            global: runtimeImportedGlobal
        }
    });
    const compiledAdd = moduleInstance.exports.add as Function;
    const compiledGlobal = moduleInstance.exports.global as WebAssembly.Global;

    expect(compiledGlobal.value).toEqual(60);
    runtimeImportedGlobal.value = 9;
    expect(compiledAdd()).toEqual(69);
    expect(compiledGlobal.value).toEqual(9);
});