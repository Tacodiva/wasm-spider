# 🕷️ WASM Spider 

**WASM Spider** is a fluent Typescript / Javascript library for creating and manipulating WebAssembly modules. It can be used to modify or analyze existing modules or create new ones from the ground up. It fully impliments WASM 1.0 and bulk memory operations, reference types, fixed-width SIMD, mutable globals, non-trapping float-to-int conversions and sign-extension operations. Take a look at the [docs](https://emberj.sh/wasm-spider/classes/SpiderModule.html) to get started, or take a look at the example usages below.

*((do you get the name? because it makes web assemblies like a spider??))*

## Example usage

```typescript
    // Create a blank WebAssembly module
    const module = createModule();

    // Create a function in our module
    const fibonacci = module.createFunction({
        // It should return an i32
        results: [SpiderNumberType.i32]
    });

    // Add an i32 parameter to our function.
    const paramN = fibonacci.addParameter(SpiderNumberType.i32);

    fibonacci.body.emit(SpiderOpcodes.local_get, paramN); // Push n onto the stack
    fibonacci.body.emit(SpiderOpcodes.i32_const, 1); // Push 1 onto the stack
    fibonacci.body.emit(SpiderOpcodes.i32_gt_u); // n > 1

    fibonacci.body.emitIfElse(body => { // if (n > 1)
        body.emit(SpiderOpcodes.local_get, paramN);
        body.emit(SpiderOpcodes.i32_const, 1);
        body.emit(SpiderOpcodes.i32_sub); // n - 1
        // Notice there's no need to deal with indices, just pass the object.
        body.emit(SpiderOpcodes.call, fibonacci); // fibonacci(n - 1)

        body.emit(SpiderOpcodes.local_get, paramN);
        body.emit(SpiderOpcodes.i32_const, 2);
        body.emit(SpiderOpcodes.i32_sub); // n - 2
        body.emit(SpiderOpcodes.call, fibonacci); // fibonacci(n - 2)

        body.emit(SpiderOpcodes.i32_add); // fibonacci(n - 1) + fibonacci(n - 2)
    }, body => {
        body.emit(SpiderOpcodes.local_get, paramN); // n
    },
        // The 'if-else' block returns an i32.
        SpiderNumberType.i32
    );

    // We still need to export our function.
    module.exportFunction("fibonacci", fibonacci);

    // Finally, compile our virtual module into a real life WebAssembly.Module
    const moduleCompiled = await compileModule(module);

    // Just like normal from here on out...
    const moduleInstance = await WebAssembly.instantiate(moduleCompiled);
    const fibonacciInstance = moduleInstance.exports.fibonacci as Function;
    console.log(fibonacciInstance(10)); // 55! Yay!
```
