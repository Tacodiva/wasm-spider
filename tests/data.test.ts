import { SpiderOpcodes, WasmValueType, spider } from "../src";

test('Data', async () => {
    const spiderModule = spider.createModule();

    const memory = spiderModule.importMemory("test", "mem", 1);
    spiderModule.createData(memory, 0, [69]);

    const compiledModule = await spider.compileModule(spiderModule);

    const memoryInstance = new WebAssembly.Memory({ initial: 1 });
    await WebAssembly.instantiate(compiledModule, {
        test: { mem: memoryInstance }
    });

    expect(new DataView(memoryInstance.buffer).getUint8(0)).toEqual(69);
});