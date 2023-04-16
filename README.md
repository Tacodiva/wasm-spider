
# WIP NOT READY FOR USE

# wasm-spider  

**wasm-spider** is a blazingly fast Typescript / Javascript library for creating and manipulating the bytecode of web assembly modules.

*((do you get the name? because it makes web assemblies like a spider??))*

## Example usage

```typescript
    // Create a blank WebAssembly module
    const spiderModule = spider.createModule();

    // Create a function
    const addition = spiderModule.createFunction({
        // Our function has two parameters, both 64-bit floats
        parameters: [WasmValueType.f64, WasmValueType.f64],
        // And it returns a 64-bit float
        results: [WasmValueType.f64]
    });

    addition.body.emit(SpiderOpcodes.local_get, 0); // Push the first param onto the stack
    addition.body.emit(SpiderOpcodes.local_get, 1); // Push the second param onto the stack
    addition.body.emit(SpiderOpcodes.f64_add); // Add the two topmost stack items together

    // We need to make our function visible to the outside world.
    spiderModule.exportFunction("add", addition);

    // Compile the virtual into a real WebAssembly.Module
    const compiledModule = await spider.compileModule(spiderModule);

    // Instansiate the module like normal. It's just like every other WASM module now!
    const moduleInstance = await WebAssembly.instantiate(compiledModule);
    const compiledAdd = moduleInstance.exports.add as Function;

    console.log(compiledAdd(1, 2)); // 3!
```