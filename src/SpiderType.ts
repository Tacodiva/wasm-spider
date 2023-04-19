import { MutableLocalParameterReference, SpiderLocalParameterReference, SpiderLocalReferenceType } from "./SpiderLocalReference";
import { SpiderModule } from "./SpiderModule";
import { SpiderValueType } from "./enums";

/** A function signature. */
export type SpiderType = SpiderTypeDefinition;

/** A function signature. */
export class SpiderTypeDefinition {
    public readonly module: SpiderModule;

    private readonly _parameters: SpiderValueType[];
    private _paramRefs: (MutableLocalParameterReference | undefined)[];

    /** A list of the parameters of this type. */
    public get parameters(): readonly SpiderValueType[] { return this._parameters; }
    /** A list of the results of this type. Empty for types which return nothing. */
    public readonly results: readonly SpiderValueType[];

    /** @hidden */
    public constructor(module: SpiderModule, parameters: SpiderValueType[], results: SpiderValueType[]) {
        this.module = module;
        this.results = results;
        this._parameters = parameters;
        this._paramRefs = [];
    }

    /**
     * Adds a new parameter to this type.
     * @param type The type of the new parameter.
     * @returns A reference to the new parameter.
     */
    public addParameter(type: SpiderValueType): SpiderLocalParameterReference {
        const index = this._parameters.push(type) - 1;
        const ref: MutableLocalParameterReference = { refType: SpiderLocalReferenceType.PARAM, type: this, index, value: type };
        this._paramRefs.push(ref);
        return ref;
    }

    /**
     * Gets a reference to an existing parameter of this function. 
     * @param index The index of the parameter.
     * @returns A reference to the parameter.
     */
    public getParameter(index: number): SpiderLocalParameterReference {
        if (index < 0 || index > this._parameters.length)
            throw new RangeError("Index out of range of parameters.");
        let ref = this._paramRefs[index];
        if (!ref) ref = this._paramRefs[index] = { refType: SpiderLocalReferenceType.PARAM, type: this, index, value: this._parameters[index] }
        return ref;
    }

    /** @hidden */
    public resolveParameterReference(ref: SpiderLocalParameterReference): number {
        if (ref.type !== this) throw new Error("Parameter reference was created for a different type.");
        if (ref.index === -1) throw new Error("Parameter reference refers to a parameter which has been deleted.");
        return ref.index;
    }

    /**
     * Removes parameters from this type and inserts new ones in their place.
     * Parameters and return values are the same as Javascript's Array.splice method.
     */
    public spliceParameters(start: number, deleteCount: number, ...items: SpiderValueType[]): SpiderValueType[] {
        const spliced = this._parameters.splice(start, deleteCount, ...items);
        for (const ref of this._paramRefs.splice(start, deleteCount, ...new Array(items.length)))
            if (ref) ref.index = -1;
        for (let i = start + items.length; i < this._parameters.length; i++) {
            const ref = this._paramRefs[i];
            if (ref) ref.index += items.length - deleteCount;
        }
        return spliced;
    }
}