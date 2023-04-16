import { SpiderOpcodes, WasmValueType, spider } from "../src";
import { SpiderExpression } from "../src/SpiderExpression";
import fs from 'fs';

test('Simple If', async () => {
    // Create a blank WebAssembly module
    const spiderModule = spider.createModule();

    // Create a function
    const addFunction = spiderModule.createFunction({
        // Our function has two parameters, both 64-bit floats
        parameters: [WasmValueType.f64, WasmValueType.f64],
        // And it returns a 64-bit float
        results: [WasmValueType.f64]
    });

    const ret7729 = new SpiderExpression();

    addFunction.body.emit(SpiderOpcodes.local_get, 0); // Push the first param onto the stack
    addFunction.body.emit(SpiderOpcodes.f64_const, 0);
    addFunction.body.emit(SpiderOpcodes.f64_eq);

    addFunction.body.emit(SpiderOpcodes.if, ret7729);
    ret7729.emit(SpiderOpcodes.f64_const, 7729);
    ret7729.emit(SpiderOpcodes.return);

    addFunction.body.emit(SpiderOpcodes.local_get, 0); // Push the first param onto the stack
    addFunction.body.emit(SpiderOpcodes.local_get, 1); // Push the second param onto the stack
    addFunction.body.emit(SpiderOpcodes.f64_add); // Add the two topmost stack items together

    // We need to make our function visible to the outside world.
    spiderModule.exportFunction("add", addFunction);

    // Compile the module into a WebAssembly.Module
    const moduleBuffer = spider.writeModule(spiderModule);
    // fs.writeFileSync("tests/out/test2.wasm", new DataView(moduleBuffer));
    const compiledModule = await WebAssembly.compile(moduleBuffer);

    // Instansiate the module like normal. It's just like every other WASM module now!
    const moduleInstance = await WebAssembly.instantiate(compiledModule);
    const compiledAdd = moduleInstance.exports.add as Function;

    expect(compiledAdd(1, 2)).toEqual(3);
    expect(compiledAdd(0, 2)).toEqual(7729);
});