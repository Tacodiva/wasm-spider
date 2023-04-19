import { SpiderNumberType, SpiderOpcodes, createModule, writeModule } from "../../src";
import fs from 'fs';


describe('Spider', () => {
    describe('Write', () => {
        describe("Data", () => {
            test('data_active', async () => {
                const spiderModule = createModule();

                const memory = spiderModule.importMemory("test", "mem", 1);
                spiderModule.createDataActive(memory, 4, [0, 0, 0, 0, 69]);

                const moduleBuffer = writeModule(spiderModule);
                fs.writeFileSync("tests/bin/data_active.wasm", moduleBuffer);
                const compiledModule = await WebAssembly.compile(moduleBuffer);

                const memoryInstance = new WebAssembly.Memory({ initial: 1 });
                await WebAssembly.instantiate(compiledModule, {
                    test: { mem: memoryInstance }
                });

                expect(new DataView(memoryInstance.buffer).getUint8(8)).toEqual(69);
            });

            test('data_passive', async () => {
                const spiderModule = createModule();

                const memory = spiderModule.importMemory("test", "mem", 1);
                const data = spiderModule.createDataPassive([0, 0, 0, 0, 69]);

                const init = spiderModule.createFunction();
                init.body.emitConstant(SpiderNumberType.i32, 4);
                init.body.emitConstant(SpiderNumberType.i32, 0);
                init.body.emitConstant(SpiderNumberType.i32, 5);
                init.body.emit(SpiderOpcodes.memory_init, data, memory);
                spiderModule.exportFunction("init", init);

                const moduleBuffer = writeModule(spiderModule);
                fs.writeFileSync("tests/bin/data_passive.wasm", moduleBuffer);
                const compiledModule = await WebAssembly.compile(moduleBuffer);

                const memoryInstance = new WebAssembly.Memory({ initial: 1 });
                const moduleInstance = await WebAssembly.instantiate(compiledModule, {
                    test: { mem: memoryInstance }
                });
                const compiledInit = moduleInstance.exports.init as Function;

                expect(new DataView(memoryInstance.buffer).getUint8(8)).toEqual(0);
                compiledInit();
                expect(new DataView(memoryInstance.buffer).getUint8(8)).toEqual(69);
            });
        });
    });
});
