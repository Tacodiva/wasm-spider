import { SpiderExpression, SpiderElement, SpiderModule, SpiderNumberType, SpiderOpcodes, SpiderReferenceType, SpiderTable, createModule, writeModule } from "../../src";
import { createAdd, createSub } from "./common";
import fs from 'fs';

describe('Spider', () => {
    describe('Write', () => {
        describe("Element", () => {

            function createInitTable(spiderModule: SpiderModule, element: SpiderElement, table: SpiderTable) {
                const initTable = spiderModule.createFunction();
                initTable.body.emitConstant(SpiderNumberType.i32, 1);
                initTable.body.emitConstant(SpiderNumberType.i32, 0);
                initTable.body.emitConstant(SpiderNumberType.i32, 2);
                initTable.body.emit(SpiderOpcodes.table_init, element, table);

                spiderModule.exportFunction("initTable", initTable);
            }

            test("element_passive_func_idx", async () => {
                const spiderModule = createModule();
                const addFunction = createAdd(spiderModule);
                const subtractFunction = createSub(spiderModule);

                spiderModule.importTable("test", "table", SpiderReferenceType.externref, 0);
                const table = spiderModule.createTable(SpiderReferenceType.funcref, 3);
                spiderModule.exportTable("table", table);

                const element = spiderModule.createElementFuncIdxInactive([addFunction, subtractFunction]);
                createInitTable(spiderModule, element, table);

                const moduleBuffer = writeModule(spiderModule);
                fs.writeFileSync("tests/bin/element_passive_func_idx.wasm", moduleBuffer);
                const compiledModule = await WebAssembly.compile(moduleBuffer);
                const moduleInstance = await WebAssembly.instantiate(compiledModule, { test: { table: new WebAssembly.Table({ element: "externref", initial: 1 }, [{}]) } });

                const tableInst = moduleInstance.exports.table as WebAssembly.Table;
                const initTableInst = moduleInstance.exports.initTable as Function;

                expect(tableInst.get(2)).toBeNull();

                initTableInst();

                expect(tableInst.get(0)).toBeNull();
                expect(tableInst.get(1)(1, 2)).toBe(3);
                expect(tableInst.get(2)(1, 2)).toBe(-1);
            });

            function createShuffle(spiderModule: SpiderModule, table: SpiderTable) {
                const shuffle = spiderModule.createFunction();

                shuffle.body.emitConstant(SpiderNumberType.i32, 2);
                shuffle.body.emitConstant(SpiderNumberType.i32, 1);
                shuffle.body.emit(SpiderOpcodes.table_get, table);

                shuffle.body.emitConstant(SpiderNumberType.i32, 0);
                shuffle.body.emitConstant(SpiderNumberType.i32, 2);
                shuffle.body.emit(SpiderOpcodes.table_get, table);

                shuffle.body.emit(SpiderOpcodes.table_set, table);
                shuffle.body.emit(SpiderOpcodes.table_set, table);

                shuffle.body.emitConstant(SpiderNumberType.i32, 1);
                shuffle.body.emit(SpiderOpcodes.ref_null, SpiderReferenceType.funcref);
                shuffle.body.emit(SpiderOpcodes.table_set, table);

                spiderModule.exportFunction("shuffle", shuffle);
            }

            function testShuffle(moduleInstance: WebAssembly.Instance, tableInst: WebAssembly.Table) {
                const shuffleInst = moduleInstance.exports.shuffle as Function;
                expect(tableInst.get(0)).toBeNull();
                expect(tableInst.get(1)(1, 2)).toBe(3);
                expect(tableInst.get(2)(1, 2)).toBe(-1);
                shuffleInst();
                expect(tableInst.get(0)(1, 2)).toBe(-1);
                expect(tableInst.get(1)).toBeNull();
                expect(tableInst.get(2)(1, 2)).toBe(3);
            }

            test("element_active_func_expr", async () => {
                const spiderModule = createModule();
                const addFunction = createAdd(spiderModule);
                const subtractFunction = createSub(spiderModule);

                const table = spiderModule.createTable(SpiderReferenceType.funcref, 3);
                spiderModule.exportTable("table", table);

                const element = spiderModule.createElementExprActive(table, 0, SpiderReferenceType.funcref, [
                    SpiderExpression.createConst(SpiderReferenceType.funcref, null),
                    SpiderExpression.createConst(SpiderReferenceType.funcref, addFunction),
                    SpiderExpression.createConst(SpiderReferenceType.funcref, subtractFunction),
                ]);
                createShuffle(spiderModule, table);

                const moduleBuffer = writeModule(spiderModule);
                fs.writeFileSync("tests/bin/element_active_func_expr.wasm", moduleBuffer);
                const compiledModule = await WebAssembly.compile(moduleBuffer);
                const moduleInstance = await WebAssembly.instantiate(compiledModule);

                testShuffle(moduleInstance, moduleInstance.exports.table as WebAssembly.Table);
            });

            test("element_passive_func_expr", async () => {
                const spiderModule = createModule();
                const addFunction = createAdd(spiderModule);
                const subtractFunction = createSub(spiderModule);

                const table = spiderModule.importTable("test", "table", SpiderReferenceType.funcref, 3);

                const element = spiderModule.createElementExprInactive(SpiderReferenceType.funcref, [
                    SpiderExpression.createConst(SpiderReferenceType.funcref, addFunction),
                    SpiderExpression.createConst(SpiderReferenceType.funcref, subtractFunction),
                ]);
                createInitTable(spiderModule, element, table);
                createShuffle(spiderModule, table);


                const moduleBuffer = writeModule(spiderModule);
                fs.writeFileSync("tests/bin/element_passive_func_expr.wasm", moduleBuffer);
                const compiledModule = await WebAssembly.compile(moduleBuffer);
                const tableInst = new WebAssembly.Table({ element: "anyfunc", initial: 3 });
                const moduleInstance = await WebAssembly.instantiate(compiledModule, {
                    test: {
                        table: tableInst
                    }
                });
                const initTableInst = moduleInstance.exports.initTable as Function;

                expect(tableInst.get(2)).toBeNull();
                initTableInst();
                testShuffle(moduleInstance, tableInst);
            });
        });
    });
});