import { SpiderInstruction } from "./SpiderInstruction";
import { SpiderImportType, SpiderNumberType, SpiderReferenceType, SpiderValueType } from "./enums";
import { SpiderOpcodes, SpiderOpcode } from "./SpiderOpcode";
import { SpiderGlobal, SpiderGlobalDefinition } from "./SpiderGlobal";
import { SpiderFunction, SpiderFunctionDefinition } from "./SpiderFunction";
import { SpiderImportFunction, SpiderImportGlobal } from "./SpiderImport";

export type SpiderExprConstNumber = number | SpiderGlobal;
export type SpiderExprConstValue = SpiderExprConstNumber | SpiderFunction | null;

export class SpiderExpression {
    public static createConst(type: SpiderValueType, value: SpiderExprConstValue) {
        const expr = new SpiderExpression();
        expr.setToConst(type, value);
        return expr;
    }

    public readonly instructions: SpiderInstruction[];

    public constructor(instructions: SpiderInstruction[] = []) {
        this.instructions = instructions;
    }

    public clear() {
        this.instructions.length = 0;
    }

    public emit<T extends any[]>(opcode: SpiderOpcode<T>, ...args: T) {
        this.instructions.push({ opcode, args });
    }

    public emitConstant(type: SpiderNumberType, value: number) {
        switch (type) {
            case SpiderNumberType.i32:
                this.emit(SpiderOpcodes.i32_const, value);
                break;
            case SpiderNumberType.i64:
                this.emit(SpiderOpcodes.i64_const, value);
                break;
            case SpiderNumberType.f32:
                this.emit(SpiderOpcodes.f32_const, value);
                break;
            case SpiderNumberType.f64:
                this.emit(SpiderOpcodes.f64_const, value);
                break;
            default: throw new TypeError();
        }
    }

    public emitBlock(blocktype?: SpiderValueType): SpiderExpression {
        const inst = new SpiderExpression();
        this.emit(SpiderOpcodes.block, inst, blocktype);
        return inst;
    }

    public emitLoop(blocktype?: SpiderValueType): SpiderExpression {
        const inst = new SpiderExpression();
        this.emit(SpiderOpcodes.loop, inst, blocktype);
        return inst;
    }

    public emitIf(blocktype?: SpiderValueType): SpiderExpression {
        const inst = new SpiderExpression();
        this.emit(SpiderOpcodes.if, inst, undefined, blocktype);
        return inst;
    }

    public emitIfElse(blocktype?: SpiderValueType): { instrTrue: SpiderExpression, instrFalse: SpiderExpression } {
        const instrTrue = new SpiderExpression();
        const instrFalse = new SpiderExpression();
        this.emit(SpiderOpcodes.if, instrTrue, instrFalse, blocktype);
        return { instrTrue, instrFalse };
    }


    public setToConst(type: SpiderValueType, value: SpiderExprConstValue) {
        if (typeof value === 'number') {
            if (type < SpiderNumberType.f64 || type > SpiderNumberType.i32)
                throw new Error(`Cannot set type ${type} to a number.`);
            this.setToConstNumber(type as SpiderNumberType, value);
        } else {
            let isGlobal = value instanceof SpiderGlobalDefinition;
            let isFunc = value instanceof SpiderFunctionDefinition || value === null;
            if (!isGlobal && !isFunc) {
                const cast = value as SpiderImportGlobal | SpiderImportFunction;
                if (cast.importType === SpiderImportType.global) isGlobal = true;
                else isFunc = true;
            }
            if (isGlobal) {
                const cast = value as SpiderGlobal;
                if (cast.type !== type)
                    throw new Error(`Global is of wrong type. Expected ${type} but got ${cast.type}.`);
                this.setToConstGlobal(value as SpiderGlobal);
            } else {
                if (type !== SpiderReferenceType.funcref)
                    throw new Error(`Wrong type. Expected ${type} but got a function. `);
                this.setToConstFunction(value as SpiderFunction | null);
            }
        }
    }

    public setToConstNumber(type: SpiderNumberType, value: number) {
        this.clear();
        this.emitConstant(type, value);
    }

    public setToConstGlobal(global: SpiderGlobal) {
        this.clear();
        this.emit(SpiderOpcodes.global_get, global);
    }

    public setToConstFunction(func: SpiderFunction | null) {
        this.clear();
        if (func) this.emit(SpiderOpcodes.ref_func, func);
        else this.emit(SpiderOpcodes.ref_null, SpiderReferenceType.funcref);
    }

    private _getFirstOpcode(): SpiderOpcode {
        const firstOpcode = this.instructions[0]?.opcode;
        if (!firstOpcode)
            throw new Error("Constant expression has no value.");
        return firstOpcode;
    }

    public getAsConstNumber() {
        const firstOpcode = this._getFirstOpcode().primaryOpcode;
        if (firstOpcode < SpiderOpcodes.i32_const.primaryOpcode || firstOpcode > SpiderOpcodes.f64_const.primaryOpcode)
            throw new Error("Cannot get the neumeric value of this constant expression. Its initalizer's first instruction is not a constant number.");
        return this.instructions[0].args[0] as number;
    }

    public getAsConstGlobal(): SpiderGlobal {
        const firstOpcode = this._getFirstOpcode();
        if (firstOpcode !== SpiderOpcodes.global_get)
            throw new Error("Cannot get the global variable value of this constant expression. Its initalizer's first instruction is not a global variable.");
        return this.instructions[0].args[0] as SpiderGlobal;
    }

    public getAsConstFunction(): SpiderFunction | null {
        const firstOpcode = this._getFirstOpcode();
        if (firstOpcode === SpiderOpcodes.ref_func)
            return this.instructions[0].args[0] as SpiderFunction;
        if (firstOpcode === SpiderOpcodes.ref_null)
            return null;
        throw new Error("Cannot get the global variable value of this constant expression. Its initalizer's first instruction is not a const reference.");
    }
}