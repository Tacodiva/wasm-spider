import { SpiderFunction, SpiderFunctionDefinition, SpiderModule, SpiderNumberType, SpiderOpcodes } from "../src";

export function createAdd(spiderModule: SpiderModule): SpiderFunctionDefinition {
    const addFunction = spiderModule.createFunction({
        parameters: [SpiderNumberType.f64, SpiderNumberType.f64],
        results: [SpiderNumberType.f64]
    })

    addFunction.body.emit(SpiderOpcodes.local_get, 0);
    addFunction.body.emit(SpiderOpcodes.local_get, 1);
    addFunction.body.emit(SpiderOpcodes.f64_add);

    return addFunction;
}

export function createSub(spiderModule: SpiderModule): SpiderFunctionDefinition {
    const subtractFunction = spiderModule.createFunction({
        parameters: [SpiderNumberType.f64, SpiderNumberType.f64],
        results: [SpiderNumberType.f64]
    })

    subtractFunction.body.emit(SpiderOpcodes.local_get, 0);
    subtractFunction.body.emit(SpiderOpcodes.local_get, 1);
    subtractFunction.body.emit(SpiderOpcodes.f64_sub);

    return subtractFunction;
}