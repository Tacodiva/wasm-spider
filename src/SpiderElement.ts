import { SpiderExpression } from "./SpiderExpression";
import { SpiderFunction } from "./SpiderFunction";
import { SpiderTable } from "./SpiderTable";
import { SpiderReferenceType } from "./enums";

/** The type of entry stored in an {@link SpiderElement element}. */
export const enum SpiderElementContentType {
    /** This element uses element type and element expressions to represent its contents. */
    EXPR,
    /** This element uses element kind and element indices to represent its contents. */
    IDX
}

/** The mode of an {@link SpiderElement element}. */
export const enum SpiderElementMode {
    /** Active elements are copied to their target table on initalization.  */
    ACTIVE,
    /** Passive elements do nothing on initalization and can be loaded by instructions.  */
    PASSIVE,
    /** Declaritive element do nothing on initalization and cannot be loaded by instructions.  */
    DECLARATIVE
}

/** The type of indices stored in an {@link SpiderElement element}. */
export const enum SpiderElementKind {
    /** This element contains function indices.  */
    FUNCTIONS = 0x00
}

/** Properties shared by all elements. */
interface SpiderElementBase {
    /** How are the content of this element represented. */
    readonly contentType: SpiderElementContentType;
    /** When / how can this element be accessed. */
    readonly mode: SpiderElementMode;
    /** The content of the element */
    init: any[];
}

/** Properties shared by all expression content type {@link SpiderElement elements}. */
export interface SpiderElementExpr extends SpiderElementBase {
    readonly contentType: SpiderElementContentType.EXPR;
    /** The reference type returned by the expressions. */
    readonly expressionType: SpiderReferenceType;
    init: SpiderExpression[];
}

/** Properties shared by all index content type elements. */
interface SpiderElementIdx extends SpiderElementBase {
    readonly contentType: SpiderElementContentType.IDX;
    /** The type of index contained by this element. */
    readonly kind: SpiderElementKind;
}

/** Properties shared by all active elements. */
interface SpiderElementActive extends SpiderElementBase {
    readonly mode: SpiderElementMode.ACTIVE;
    /** The table to copy our contents into. */
    table: SpiderTable;
    /** The offset within the table to copy our contents into. */
    offset: SpiderExpression;
}

/** Properties shared by all inactive elements */
interface SpiderElementInactive extends SpiderElementBase {
    readonly mode: SpiderElementMode.PASSIVE | SpiderElementMode.DECLARATIVE;
}

interface SpiderElementFuncIdx extends SpiderElementIdx {
    readonly kind: SpiderElementKind.FUNCTIONS;
    init: SpiderFunction[];
}

/** An {@link SpiderElementMode active} element containing function indices. */
export type SpiderElementFuncIdxActive = SpiderElementFuncIdx & SpiderElementActive;
/** A {@link SpiderElementMode passive} or {@link SpiderElementMode declarative} element containing function indices. */
export type SpiderElementFuncIdxInactive = SpiderElementFuncIdx & SpiderElementInactive;

/** An {@link SpiderElementMode active} element containing expressions. */
export type SpiderElementExprActive = SpiderElementExpr & SpiderElementActive;
/** A {@link SpiderElementMode passive} or {@link SpiderElementMode declarative} element containing expressions. */
export type SpiderElementExprInactive = SpiderElementExpr & SpiderElementInactive;

/** A list of references which can be copied into a table. Elements are to tables what {@link SpiderData data} is to memory. */
export type SpiderElement = 
    SpiderElementFuncIdxActive |
    SpiderElementFuncIdxInactive | 
    SpiderElementExprActive | 
    SpiderElementExprInactive;