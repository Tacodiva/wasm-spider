import { WasmOpcode, WasmValueType, spider } from "../src";

test('br_table', async () => {
    const spiderModule = spider.createModule();

    const testFunction = spiderModule.createFunction({
        parameters: [WasmValueType.i32],
        results: [WasmValueType.i32]
    });

    let defaultCase = testFunction.body.emitBlock(WasmValueType.i32);
    let case1 = defaultCase.emitBlock();
    let case0 = case1.emitBlock();
    let outerBlock = case0.emitBlock();

    outerBlock.emit(WasmOpcode.local_get, 0);
    outerBlock.emit(WasmOpcode.br_table, [0, 1], 2);

    case0.emit(WasmOpcode.i32_const, 69);
    case0.emit(WasmOpcode.br, 2);

    case1.emit(WasmOpcode.i32_const, 420);
    case1.emit(WasmOpcode.br, 1);

    defaultCase.emit(WasmOpcode.i32_const, -1);

    spiderModule.exportFunction("test", testFunction);

    const moduleBuffer = spider.writeModule(spiderModule);
    // fs.writeFileSync("tests/out/br_table.wasm", new DataView(moduleBuffer));
    const compiledModule = await WebAssembly.compile(moduleBuffer);

    const moduleInstance = await WebAssembly.instantiate(compiledModule);
    const compiledAdd = moduleInstance.exports.test as Function;

    expect(compiledAdd(0)).toEqual(69);
    expect(compiledAdd(1)).toEqual(420);
    expect(compiledAdd(2)).toEqual(-1);
});