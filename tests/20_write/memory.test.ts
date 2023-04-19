import { SpiderNumberType, SpiderOpcodes, SpiderValueType, createModule, writeModule } from "../../src";
import fs from 'fs';

describe('Spider', () => {
    describe('Write', () => {
        describe("Memory", () => {
            function makeModule() {
                const spiderModule = createModule();

                const addFunction = spiderModule.createFunction();
                addFunction.body.emitConstant(SpiderNumberType.i32, 0);

                addFunction.body.emitConstant(SpiderNumberType.i32, 0);
                addFunction.body.emit(SpiderOpcodes.f64_load, 3, 0);

                addFunction.body.emitConstant(SpiderNumberType.i32, 0);
                addFunction.body.emit(SpiderOpcodes.f64_load, 3, 8);

                addFunction.body.emit(SpiderOpcodes.f64_add);

                addFunction.body.emit(SpiderOpcodes.f64_store, 3, 0);

                spiderModule.exportFunction("add", addFunction);

                return spiderModule;
            }

            test('memory_export', async () => {
                const spiderModule = makeModule();
                spiderModule.exportMemory("memory", spiderModule.createMemory(1, 2));

                const moduleBuffer = writeModule(spiderModule);
                fs.writeFileSync("tests/bin/memory_export.wasm", moduleBuffer);
                const compiledModule = await WebAssembly.compile(moduleBuffer);

                const moduleInstance = await WebAssembly.instantiate(compiledModule);
                const compiledAdd = moduleInstance.exports.add as Function;
                const compiledMemory = moduleInstance.exports.memory as WebAssembly.Memory;

                const compiledMemoryView = new DataView(compiledMemory.buffer);

                compiledMemoryView.setFloat64(0, 1, true);
                compiledMemoryView.setFloat64(8, 2, true);
                compiledAdd();

                expect(compiledMemoryView.getFloat64(0, true)).toEqual(3);
                expect(compiledMemory.grow(1)).toEqual(1);
                expect(() => compiledMemory.grow(1)).toThrowError();

            });

            test('memory_import', async () => {
                const spiderModule = makeModule();
                spiderModule.importMemory("test", "memory");

                const moduleBuffer = writeModule(spiderModule);
                fs.writeFileSync("tests/bin/memory_import.wasm", moduleBuffer);
                const compiledModule = await WebAssembly.compile(moduleBuffer);

                const compiledMemory = new WebAssembly.Memory({ initial: 1 });
                const moduleInstance = await WebAssembly.instantiate(compiledModule, {
                    test: {
                        memory: compiledMemory
                    }
                });
                const compiledAdd = moduleInstance.exports.add as Function;

                const compiledMemoryView = new DataView(compiledMemory.buffer);

                compiledMemoryView.setFloat64(0, 1, true);
                compiledMemoryView.setFloat64(8, 2, true);
                compiledAdd();

                expect(compiledMemoryView.getFloat64(0, true)).toEqual(3);
            });
        });
    });
});