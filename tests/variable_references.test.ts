import { WasmOpcode, WasmValueType, spider } from "../src";
import { SpiderExpression } from "../src/SpiderExpression";
import fs from 'fs';

test('Simple Variable Refs + ifelse', async () => {
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
        parameters: [WasmValueType.i32, WasmValueType.i32, WasmValueType.f64],
        results: [WasmValueType.f64]
    });

    const initalParam = addFunction.getParameter(2);
    const initalFirstParam = addFunction.getParameter(0);

    addFunction.body.emit(WasmOpcode.local_get, initalParam);
    addFunction.body.emit(WasmOpcode.f64_const, 0);
    addFunction.body.emit(WasmOpcode.f64_eq);

    const ifelse = addFunction.body.emitIfElse(WasmValueType.f64);

    ifelse.instrTrue.emit(WasmOpcode.f64_const, 7729);
    ifelse.instrTrue.emit(WasmOpcode.f64_const, 70);
    ifelse.instrTrue.emit(WasmOpcode.call, runCallbackFunc);

    expect(addFunction.type.spliceParameters(0, 2, WasmValueType.i64)).toEqual([WasmValueType.i32, WasmValueType.i32]);
    expect(initalFirstParam.index).toEqual(-1);
    expect(initalParam.index).toEqual(1);
    expect(addFunction.parameters).toEqual([WasmValueType.i64, WasmValueType.f64]);
    expect(addFunction.type.spliceParameters(0, 1)).toEqual([WasmValueType.i64]);
    expect(initalParam.index).toEqual(0);
    const newParam = addFunction.addParameter(WasmValueType.f64);
    expect(initalParam.index).toEqual(0);
    expect(newParam.index).toEqual(1);

    ifelse.instrFalse.emit(WasmOpcode.local_get, newParam);
    ifelse.instrFalse.emit(WasmOpcode.local_get, initalParam);
    ifelse.instrFalse.emit(WasmOpcode.f64_add);

    // We need to make our function visible to the outside world.
    spiderModule.exportFunction("add", addFunction);

    // Compile the module into a WebAssembly.Module
    const moduleBuffer = spider.writeModule(spiderModule);
    // fs.writeFileSync("tests/out/test4.wasm", new DataView(moduleBuffer));
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