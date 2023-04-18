import { SpiderOpcodes, SpiderValueType, spider } from "../src";

test('Start', async () => {
    const spiderModule = spider.createModule();

    const callbackFunction = spiderModule.importFunction("test", "callback", {});

    const startFunction = spiderModule.start = spiderModule.createFunction();
    startFunction.body.emit(SpiderOpcodes.call, callbackFunction);

    const compiledModule = await spider.compileModule(spiderModule);

    let callbackCalled = false;
    const moduleInstance = await WebAssembly.instantiate(compiledModule, {
        test: {
            callback: () => callbackCalled = true
        }
    });

    expect(callbackCalled).toBe(true);
});