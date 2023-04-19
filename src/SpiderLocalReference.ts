import { SpiderFunctionDefinition } from "./SpiderFunction";
import { SpiderTypeDefinition } from "./SpiderType";
import { SpiderValueType } from "./enums";

/** The type of local referred to by a {@link SpiderLocalReference local reference} */
export const enum SpiderLocalReferenceType {
    /** See {@link SpiderLocalParameterReference}. */
    PARAM,
    /** See {@link SpiderLocalVariableReference}. */
    LOCAL
}

/** A reference to a local variable. Can be either a direct index or a {@link SpiderLocalReference local reference}. */
export type SpiderLocal = number | SpiderLocalReference;

/**
 * A local reference points to a local variable or parameter without having to specify the index. They are handy
 * when doing something like adding a parameter to an existing function. Adding the new parameter will cause all
 * the indices the local variables to increase by one, meaning if the instructions used indexes they would all now
 * point to the wrong local variable. References get automatically updated when a new parameter is added so they
 * always refer to the same local variable.
 */
export type SpiderLocalReference = SpiderLocalParameterReference | SpiderLocalVariableReference;

/** A {@link SpiderLocalReference local reference} to a parameter of a {@link SpiderTypeDefinition type}. */
export interface SpiderLocalParameterReference {
    readonly refType: SpiderLocalReferenceType.PARAM;
    /** The type with the parameter we are referencing. */
    readonly type: SpiderTypeDefinition;
    /** The index of the parameter we are referencing. */
    readonly index: number;
    /** The type of the parameter we are referencing. */
    readonly value: SpiderValueType;
}

/** A {@link SpiderLocalReference local reference} to a local variable of a function. */
export interface SpiderLocalVariableReference {
    readonly refType: SpiderLocalReferenceType.LOCAL;
    /** The function with the local variable we are referencing. */
    readonly func: SpiderFunctionDefinition;
    /** The index of the local variable we are referencing. */
    readonly index: number;
    /** The type of the local variable we are referencing. */
    readonly value: SpiderValueType;
}

/** @hidden */
type Mutable<T> = {
    -readonly [P in keyof T]: T[P]
};

/** @hidden */
export type MutableLocalParameterReference = Mutable<SpiderLocalParameterReference>;
/** @hidden */
export type MutableLocalVariableReference = Mutable<SpiderLocalVariableReference>;
