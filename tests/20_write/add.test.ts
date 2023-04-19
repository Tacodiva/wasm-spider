import { SpiderNumberType, SpiderOpcodes, SpiderValueType, createModule, writeModule } from "../../src";
import fs from 'fs';

describe('Spider', () => {
    describe('Write', () => {
        test('add', async () => {
            const spiderModule = createModule();

            const addFunction = spiderModule.createFunction({
                parameters: [SpiderNumberType.f64, SpiderNumberType.f64],
                results: [SpiderNumberType.f64]
            });

            addFunction.body.emit(SpiderOpcodes.local_get, 0);
            addFunction.body.emit(SpiderOpcodes.local_get, 1);
            addFunction.body.emit(SpiderOpcodes.f64_add);

            spiderModule.exportFunction("add", addFunction);

            const moduleBuffer = writeModule(spiderModule);
            fs.writeFileSync("tests/bin/add.wasm", moduleBuffer);
            const compiledModule = await WebAssembly.compile(moduleBuffer);

            const moduleInstance = await WebAssembly.instantiate(compiledModule);
            const compiledAdd = moduleInstance.exports.add as Function;

            expect(compiledAdd(1, 2)).toEqual(3);
        });
    });
});
