import { SpiderExpression } from "./SpiderExpression";
import { SpiderLocalParameterReference, SpiderLocalVariableReference, MutableLocalVariableReference, SpiderLocalReferenceType } from "./SpiderLocalReference";
import { SpiderImportFunction } from "./SpiderImport";
import { SpiderModule } from "./SpiderModule";
import { SpiderTypeDefinition } from "./SpiderType";
import { SpiderValueType } from "./enums";

/** A function. It may be defined within this module or imported from another. */
export type SpiderFunction = SpiderFunctionDefinition | SpiderImportFunction;

/** A function defined within this module. */
export class SpiderFunctionDefinition {
    public readonly module: SpiderModule;

    /** The instructions executed when this function is invoked. */
    public body: SpiderExpression;

    private readonly _localVariables: SpiderValueType[];
    /** A list containing the types of the local variables defined within this functions body. Does not include parameters. */
    public get localVariables(): readonly SpiderValueType[] { return this._localVariables; }
    private _localVariableRefs: (MutableLocalVariableReference | undefined)[];

    /** The signature type of this function. */
    public readonly type: SpiderTypeDefinition;
    /** A list of the parameters of this function. */
    public get parameters(): readonly SpiderValueType[] { return this.type.parameters; }
    /** A list of the results of this function. Empty for functions which return nothing. */
    public get results(): readonly SpiderValueType[] { return this.type.results; }

    public constructor(module: SpiderModule, type: SpiderTypeDefinition, vars: SpiderValueType[] = [], body: SpiderExpression = new SpiderExpression()) {
        this.module = module;
        this.type = type;
        this._localVariables = vars;
        this.body = body;
        this._localVariableRefs = [];
    }

    /**
     * Adds a new parameter to this function.
     * @param type The type of the new parameter.
     * @returns A reference to the new parameter.
     */
    public addParameter(type: SpiderValueType): SpiderLocalParameterReference {
        return this.type.addParameter(type);
    }

    /**
     * Gets a reference to an existing parameter of this function. 
     * @param index The index of the parameter.
     * @returns A reference to the parameter.
     */
    public getParameter(index: number): SpiderLocalParameterReference {
        return this.type.getParameter(index);
    }

    /**
     * Adds a new local variable to this function.
     * @param type The type of the new local variable.
     * @returns A reference to the new local variable.
     */
    public addLocalVariable(type: SpiderValueType): SpiderLocalVariableReference {
        const index = this._localVariables.push(type) - 1;
        const ref: MutableLocalVariableReference = { refType: SpiderLocalReferenceType.LOCAL, func: this, index, value: type };
        this._localVariableRefs.push(ref);
        return ref;
    }

    /**
     * Gets a reference to an existing local variable of this function. Use {@link getParameter} for parameters. 
     * @param index Ths index of the local variable. **Does not include parameters**. Local variable 0 is the first non-parameter local.
     * @returns A reference to the local variable.
     */
    public getLocalVariable(index: number): SpiderLocalVariableReference {
        if (index < 0 || index > this._localVariables.length)
            throw new RangeError(`Index ${index} out of range of ${this._localVariables.length} local variables.`);
        let ref = this._localVariableRefs[index];
        if (!ref) ref = this._localVariableRefs[index] = { refType: SpiderLocalReferenceType.LOCAL, func: this, index, value: this._localVariables[index] }
        return ref;
    }

    /** @hidden */
    public resolveLocalVariableReference(ref: SpiderLocalVariableReference): number {
        if (ref.func !== this) throw new Error("Local variable reference was created for a different function.");
        if (ref.index === -1) throw new Error("Local variable reference refers to a local variable which has been deleted.");
        return ref.index;
    }

    /**
     * Removes local variables from this function and inserts new ones in their place.
     * Parameters and return values are the same as Javascript's Array.splice method.
     */
    public spliceLocalVariables(start: number, deleteCount: number, ...items: SpiderValueType[]): SpiderValueType[] {
        const spliced = this._localVariables.splice(start, deleteCount, ...items);
        for (const ref of this._localVariableRefs.splice(start, deleteCount, ...new Array(items.length)))
            if (ref) ref.index = -1;
        for (let i = start + items.length; i < this._localVariables.length; i++) {
            const ref = this._localVariableRefs[i];
            if (ref) ref.index += items.length - deleteCount;
        }
        return spliced;
    }
}