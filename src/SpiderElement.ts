import { SpiderConstExpression } from "./SpiderConstExpression";
import { SpiderExpression } from "./SpiderExpression";
import { SpiderFunction } from "./SpiderFunction";
import { SpiderTable } from "./SpiderTable";
import { SpiderReferenceType } from "./enums";

export const enum SpiderElementContentType {
    /** This element uses element type and element expressions to represent its contents. */
    EXPR,
    /** This element uses element kind and element indices to represent its contents. */
    IDX
}

export const enum SpiderElementMode {
    /** This element is loaded on initalization.  */
    ACTIVE,
    /** This element does nothing on initalization and can be loaded by instructions.  */
    PASSIVE,
    /** This element does nothing on initalization and cannot be loaded by instructions.  */
    DECLARATIVE
}

export const enum SpiderElementKind {
    /** This element with content type SpiderElementContentType.IDX contains function indices.  */
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

/** Properties shared by all expression content type elements. */
export interface SpiderElementExpr extends SpiderElementBase {
    readonly contentType: SpiderElementContentType.EXPR;
    /** What type do the expressions return? */
    readonly expressionType: SpiderReferenceType;
    init: SpiderExpression[];
}

/** Properties shared by all index content type elements */
interface SpiderElementIdx extends SpiderElementBase {
    readonly contentType: SpiderElementContentType.IDX;
    /** The kind of indice contained by this element. */
    readonly kind: SpiderElementKind;
}

/** Properties shared by all active elements. */
interface SpiderElementActive extends SpiderElementBase {
    readonly mode: SpiderElementMode.ACTIVE;
    /** What table will our contents be loaded into on initalization */
    table: SpiderTable;
    /** Where in the table will our contents be loaded into on initalization */
    offset: SpiderConstExpression;
}

/** Properties shared by all inactive elements */
interface SpiderElementInactive extends SpiderElementBase {
    readonly mode: SpiderElementMode.PASSIVE | SpiderElementMode.DECLARATIVE;
}

interface SpiderElementFuncIdx extends SpiderElementIdx {
    readonly kind: SpiderElementKind.FUNCTIONS;
    init: SpiderFunction[];
}

export type SpiderElementFuncIdxActive = SpiderElementFuncIdx & SpiderElementActive;
export type SpiderElementFuncIdxInactive = SpiderElementFuncIdx & SpiderElementInactive;

export type SpiderElementExprActive = SpiderElementExpr & SpiderElementActive;
export type SpiderElementExprInactive = SpiderElementExpr & SpiderElementInactive;

export type SpiderElement = 
    SpiderElementFuncIdxActive |
    SpiderElementFuncIdxInactive | 
    SpiderElementExprActive | 
    SpiderElementExprInactive;