import { SpiderNumberType, SpiderOpcodes, SpiderValueType, createModule, writeModule } from "../../src";
import fs from 'fs';

describe('Spider', () => {
    describe('Write', () => {
        describe('Consts', () => {
            test('i64 small negitive', async () => {
                const spiderModule = createModule();

                const fn = spiderModule.createFunction({
                    parameters: [],
                    results: [SpiderNumberType.i64]
                });

                fn.body.emitConstant(SpiderNumberType.i64, -7729);

                spiderModule.exportFunction("const", fn);

                const moduleBuffer = writeModule(spiderModule);
                fs.writeFileSync("tests/bin/const_i64_small_neg.wasm", moduleBuffer);
                const compiledModule = await WebAssembly.compile(moduleBuffer);

                const moduleInstance = await WebAssembly.instantiate(compiledModule);
                const compiledConst = moduleInstance.exports.const as Function;

                expect(compiledConst()).toEqual(-7729n);
            });
            test('i64 big negitive', async () => {
                const spiderModule = createModule();

                const fn = spiderModule.createFunction({
                    parameters: [],
                    results: [SpiderNumberType.i64]
                });

                fn.body.emitConstant(SpiderNumberType.i64, -794812831324971932n);

                spiderModule.exportFunction("const", fn);

                const moduleBuffer = writeModule(spiderModule);
                fs.writeFileSync("tests/bin/const_i64_big_neg.wasm", moduleBuffer);
                const compiledModule = await WebAssembly.compile(moduleBuffer);

                const moduleInstance = await WebAssembly.instantiate(compiledModule);
                const compiledConst = moduleInstance.exports.const as Function;

                expect(compiledConst()).toEqual(-794812831324971932n);
            });
            test('i64 big positive', async () => {
                const spiderModule = createModule();

                const fn = spiderModule.createFunction({
                    parameters: [],
                    results: [SpiderNumberType.i64]
                });

                fn.body.emitConstant(SpiderNumberType.i64, 794812831324971932n);

                spiderModule.exportFunction("const", fn);

                const moduleBuffer = writeModule(spiderModule);
                fs.writeFileSync("tests/bin/const_i64_big_neg.wasm", moduleBuffer);
                const compiledModule = await WebAssembly.compile(moduleBuffer);

                const moduleInstance = await WebAssembly.instantiate(compiledModule);
                const compiledConst = moduleInstance.exports.const as Function;

                expect(compiledConst()).toEqual(794812831324971932n);
            });
        });
    });
});
