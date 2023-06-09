import { SpiderOpcodes, createModule, writeModule } from "../../src";
import fs from 'fs';

describe('Spider', () => {
    describe('Write', () => {
        test('start', async () => {
            const spiderModule = createModule();

            const callbackFunction = spiderModule.importFunction("test", "callback", {});

            const startFunction = spiderModule.start = spiderModule.createFunction();
            startFunction.body.emit(SpiderOpcodes.call, callbackFunction);

            const moduleBuffer = writeModule(spiderModule);
            fs.writeFileSync("tests/bin/start.wasm", moduleBuffer);
            const compiledModule = await WebAssembly.compile(moduleBuffer);

            let callbackCalled = false;
            const moduleInstance = await WebAssembly.instantiate(compiledModule, {
                test: {
                    callback: () => callbackCalled = true
                }
            });

            expect(callbackCalled).toBe(true);
        });
    });
});