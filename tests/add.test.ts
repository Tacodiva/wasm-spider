import { WasmOpcode, WasmValueType, spider } from "../src";

test('Simple Add', async () => {
    // Create a blank WebAssembly module
    const spiderModule = spider.createModule();

    // Create a function
    const addFunction = spiderModule.createFunction({
        // Our function has two parameters, both 64-bit floats
        parameters: [WasmValueType.f64, WasmValueType.f64],
        // And it returns a 64-bit float
        results: [WasmValueType.f64]
    });

    addFunction.body.emit(WasmOpcode.local_get, 0); // Push the first param onto the stack
    addFunction.body.emit(WasmOpcode.local_get, 1); // Push the second param onto the stack
    addFunction.body.emit(WasmOpcode.f64_add); // Add the two topmost stack items together

    // We need to make our function visible to the outside world.
    spiderModule.exportFunction("add", addFunction);

    // Compile the module into a WebAssembly.Module
    const compiledModule = await spider.compileModule(spiderModule);

    // Instansiate the module like normal. It's just like every other WASM module now!
    const moduleInstance = await WebAssembly.instantiate(compiledModule);
    const compiledAdd = moduleInstance.exports.add as Function;

    expect(compiledAdd(1, 2)).toEqual(3);
});