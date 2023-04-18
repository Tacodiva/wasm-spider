import { SpiderOpcodes, SpiderValueType, spider } from "../src";
import { SpiderNumberType } from "../src/enums";

test('Simple Add', async () => {
    const spiderModule = spider.createModule();

    const addFunction = spiderModule.createFunction({
        parameters: [SpiderNumberType.f64, SpiderNumberType.f64],
        results: [SpiderNumberType.f64]
    });

    addFunction.body.emit(SpiderOpcodes.local_get, 0);
    addFunction.body.emit(SpiderOpcodes.local_get, 1);
    addFunction.body.emit(SpiderOpcodes.f64_add);

    spiderModule.exportFunction("add", addFunction);

    const compiledModule = await spider.compileModule(spiderModule);

    const moduleInstance = await WebAssembly.instantiate(compiledModule);
    const compiledAdd = moduleInstance.exports.add as Function;

    expect(compiledAdd(1, 2)).toEqual(3);
});