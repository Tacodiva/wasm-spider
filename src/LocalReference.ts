import { SpiderFunction } from "./SpiderFunction";
import { SpiderType } from "./SpiderType";
import { WasmValueType } from "./enums";

export const enum LocalReferenceType {
    PARAM,
    LOCAL
}

export interface MutableLocalParameterReference {
    refType: LocalReferenceType.PARAM;
    type: SpiderType;
    index: number;
    value: WasmValueType;
}

export type LocalParameterReference = Readonly<MutableLocalParameterReference>;

export interface MutableLocalVariableReference {
    refType: LocalReferenceType.LOCAL;
    func: SpiderFunction;
    index: number;
    value: WasmValueType;
}

export type LocalVariableReference = Readonly<MutableLocalVariableReference>;

export type LocalReference = number | LocalParameterReference | LocalVariableReference;

