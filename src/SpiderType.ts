import { MutableLocalParameterReference, LocalParameterReference, LocalReferenceType } from "./LocalReference";
import { SpiderModule } from "./SpiderModule";
import { SpiderValueType } from "./enums";

export type SpiderType = SpiderTypeDefinition;

export class SpiderTypeDefinition {

    private readonly _parameters: SpiderValueType[];
    private _paramRefs: (MutableLocalParameterReference | undefined)[];

    public get parameters(): readonly SpiderValueType[] { return this._parameters; }
    public readonly results: readonly SpiderValueType[];
    public readonly module: SpiderModule;

    public constructor(module: SpiderModule, parameters: SpiderValueType[], results: SpiderValueType[]) {
        this.module = module;
        this.results = results;
        this._parameters = parameters;
        this._paramRefs = [];
    }

    public addParameter(type: SpiderValueType): LocalParameterReference {
        const index = this._parameters.push(type) - 1;
        const ref: MutableLocalParameterReference = { refType: LocalReferenceType.PARAM, type: this, index, value: type };
        this._paramRefs.push(ref);
        return ref;
    }

    public getParameter(index: number): LocalParameterReference {
        if (index < 0 || index > this._parameters.length)
            throw new RangeError("Index out of range of parameters.");
        let ref = this._paramRefs[index];
        if (!ref) ref = this._paramRefs[index] = { refType: LocalReferenceType.PARAM, type: this, index, value: this._parameters[index] }
        return ref;
    }

    public resolveParameterReference(ref: LocalParameterReference): number {
        if (ref.type !== this) throw new Error("Parameter reference was created for a different type.");
        if (ref.index === -1) throw new Error("Parameter reference refers to a parameter which has been deleted.");
        return ref.index;
    }

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