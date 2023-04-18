import { SpiderOpcodes, SpiderValueType, spider } from "../src";
import { SpiderNumberType } from "../src/enums";

describe("Memory", () => {
    function createModule() {
        const spiderModule = spider.createModule();

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

    test('Export', async () => {
        const spiderModule = createModule();
        spiderModule.exportMemory("memory", spiderModule.createMemory(1, 2));

        const compiledModule = await spider.compileModule(spiderModule);

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

    test('Import', async () => {
        const spiderModule = createModule();
        spiderModule.importMemory("test", "memory");

        const compiledModule = await spider.compileModule(spiderModule);

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