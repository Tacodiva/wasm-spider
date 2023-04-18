import { SpiderExpression } from "./SpiderExpression";
import { LocalParameterReference, LocalVariableReference, MutableLocalVariableReference, LocalReferenceType } from "./LocalReference";
import { SpiderImportFunction } from "./SpiderImport";
import { SpiderModule } from "./SpiderModule";
import { SpiderTypeDefinition } from "./SpiderType";
import { SpiderValueType } from "./enums";

export type SpiderFunction = SpiderFunctionDefinition | SpiderImportFunction;

export class SpiderFunctionDefinition {
    public readonly module: SpiderModule;

    public readonly body: SpiderExpression;

    private readonly _localVariables: SpiderValueType[];
    public get localVariables(): readonly SpiderValueType[] { return this._localVariables; }
    private _localVariableRefs: (MutableLocalVariableReference | undefined)[];

    public readonly type: SpiderTypeDefinition;
    public get parameters(): readonly SpiderValueType[] { return this.type.parameters; }
    public get results(): readonly SpiderValueType[] { return this.type.results; }

    public constructor(module: SpiderModule, type: SpiderTypeDefinition, vars: SpiderValueType[] = [], body: SpiderExpression = new SpiderExpression()) {
        this.module = module;
        this.type = type;
        this._localVariables = vars;
        this.body = body;
        this._localVariableRefs = [];
    }

    public addParameter(type: SpiderValueType): LocalParameterReference {
        return this.type.addParameter(type);
    }

    public getParameter(index: number): LocalParameterReference {
        return this.type.getParameter(index);
    }

    public addLocalVariable(type: SpiderValueType): LocalVariableReference {
        const index = this._localVariables.push(type) - 1;
        const ref: MutableLocalVariableReference = { refType: LocalReferenceType.LOCAL, func: this, index, value: type };
        this._localVariableRefs.push(ref);
        return ref;
    }

    public getLocalVariable(index: number): LocalVariableReference {
        if (index < 0 || index > this._localVariables.length)
            throw new RangeError("Index out of range of local variables.");
        let ref = this._localVariableRefs[index];
        if (!ref) ref = this._localVariableRefs[index] = { refType: LocalReferenceType.LOCAL, func: this, index, value: this._localVariables[index] }
        return ref;
    }

    public resolveLocalVariableReference(ref: LocalVariableReference): number {
        if (ref.func !== this) throw new Error("Local variable reference was created for a different function.");
        if (ref.index === -1) throw new Error("Local variable reference refers to a local variable which has been deleted.");
        return ref.index;
    }

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