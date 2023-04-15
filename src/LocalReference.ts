import { SpiderFunctionDefinition } from "./SpiderFunction";
import { SpiderTypeDefinition } from "./SpiderType";
import { WasmValueType } from "./enums";

export const enum LocalReferenceType {
    PARAM,
    LOCAL
}

export interface MutableLocalParameterReference {
    refType: LocalReferenceType.PARAM;
    type: SpiderTypeDefinition;
    index: number;
    value: WasmValueType;
}

export type LocalParameterReference = Readonly<MutableLocalParameterReference>;

export interface MutableLocalVariableReference {
    refType: LocalReferenceType.LOCAL;
    func: SpiderFunctionDefinition;
    index: number;
    value: WasmValueType;
}

export type LocalVariableReference = Readonly<MutableLocalVariableReference>;

export type LocalReference = number | LocalParameterReference | LocalVariableReference;

