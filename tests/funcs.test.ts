import { WasmOpcode, WasmValueType, spider } from "../src";
import { SpiderExpression } from "../src/SpiderExpression";
import fs from 'fs';

test('Simple Functions', async () => {
    // Create a blank WebAssembly module
    const spiderModule = spider.createModule();

    const callbackFunc = spiderModule.importFunction("test", "callback", { parameters: [WasmValueType.f64] });

    const runCallbackFunc = spiderModule.createFunction({
        parameters: [WasmValueType.f64]
    });

    runCallbackFunc.body.emit(WasmOpcode.local_get, 0);
    runCallbackFunc.body.emit(WasmOpcode.f64_const, 1);
    runCallbackFunc.body.emit(WasmOpcode.f64_sub);
    runCallbackFunc.body.emit(WasmOpcode.call, callbackFunc);

    const addFunction = spiderModule.createFunction({
        parameters: [WasmValueType.f64, WasmValueType.f64],
        results: [WasmValueType.f64]
    });

    const ret7729 = new SpiderExpression();

    addFunction.body.emit(WasmOpcode.local_get, 0);
    addFunction.body.emit(WasmOpcode.f64_const, 0);
    addFunction.body.emit(WasmOpcode.f64_eq);

    addFunction.body.emit(WasmOpcode.if, ret7729);
    ret7729.emit(WasmOpcode.f64_const, 7729);
    ret7729.emit(WasmOpcode.f64_const, 70);
    ret7729.emit(WasmOpcode.call, runCallbackFunc);
    ret7729.emit(WasmOpcode.return);

    addFunction.body.emit(WasmOpcode.local_get, 0);
    addFunction.body.emit(WasmOpcode.local_get, 1);
    addFunction.body.emit(WasmOpcode.f64_add);

    // We need to make our function visible to the outside world.
    spiderModule.exportFunction("add", addFunction);

    // Compile the module into a WebAssembly.Module
    const moduleBuffer = spider.writeModule(spiderModule);
    fs.writeFileSync("tests/out/test3.wasm", new DataView(moduleBuffer));
    const compiledModule = await WebAssembly.compile(moduleBuffer);

    let lastReturn: null | number = null;
    const moduleInstance = await WebAssembly.instantiate(compiledModule, {
        test: {
            callback: (n: number) => lastReturn = n
        }
    });
    const compiledAdd = moduleInstance.exports.add as Function;

    expect(compiledAdd(1, 2)).toEqual(3);
    expect(lastReturn).toEqual(null);

    expect(compiledAdd(0, 2)).toEqual(7729);
    expect(lastReturn).toEqual(69);
});