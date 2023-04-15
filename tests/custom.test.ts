import { SpiderCustomSectionPosition, WasmOpcode, WasmValueType, spider } from "../src";

test('Custom Sections', async () => {
    const spiderModule = spider.createModule();

    const addFunction = spiderModule.createFunction({
        parameters: [WasmValueType.f64, WasmValueType.f64],
        results: [WasmValueType.f64]
    });

    addFunction.body.emit(WasmOpcode.local_get, 0);
    addFunction.body.emit(WasmOpcode.local_get, 1);
    addFunction.body.emit(WasmOpcode.f64_add);

    spiderModule.exportFunction("add", addFunction);

    for (let i = 0; i < SpiderCustomSectionPosition.AFTER_DATA; i++) {
        spiderModule.createCustomSection("test", [7, 7, 2, 9], i);
        spiderModule.createCustomSection("testAfter", [6, 9, 4, 2, 0], i);
    }

    const compiledModule = await spider.compileModule(spiderModule);

    const moduleInstance = await WebAssembly.instantiate(compiledModule);
    const compiledAdd = moduleInstance.exports.add as Function;

    expect(compiledAdd(1, 2)).toEqual(3);
});