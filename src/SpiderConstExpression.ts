import { SpiderExpression } from "./SpiderExpression";
import { SpiderGlobal, SpiderGlobalDefinition } from "./SpiderGlobal";
import { SpiderInstruction } from "./SpiderInstruction";
import { SpiderImportType, SpiderNumberType, SpiderReferenceType, SpiderValueType } from "./enums";
import { SpiderOpcode, SpiderOpcodes } from "./SpiderOpcode";
import { SpiderFunction, SpiderFunctionDefinition } from "./SpiderFunction";
import { SpiderImportFunction, SpiderImportGlobal } from ".";

export type SpiderConstExprNumber = number | SpiderGlobal;
export type SpiderConstExprValue = SpiderConstExprNumber | SpiderFunction | null;

export class SpiderConstExpression extends SpiderExpression {

    public static create(type: SpiderValueType, value: SpiderConstExprValue) {
        const expr = new SpiderConstExpression();
        expr.setTo(type, value);
        return expr;
    }

    public constructor(instructions: SpiderInstruction[] = []) {
        super(instructions);
    }

    public setTo(type: SpiderValueType, value: SpiderConstExprValue) {
        if (typeof value === 'number') {
            if (type < SpiderNumberType.f64 || type > SpiderNumberType.i32)
                throw new Error(`Cannot set type ${type} to a number.`);
            this.setToNumber(type as SpiderNumberType, value);
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
                this.setToGlobal(value as SpiderGlobal);
            } else {
                if (type !== SpiderReferenceType.funcref)
                    throw new Error(`Wrong type. Expected ${type} but got a function. `);
                this.setToFunction(value as SpiderFunction | null);
            }
        }
    }

    public setToNumber(type: SpiderNumberType, value: number) {
        this.clear();
        this.emitConstant(type, value);
    }

    public setToGlobal(global: SpiderGlobal) {
        this.clear();
        this.emit(SpiderOpcodes.global_get, global);
    }

    public setToFunction(func: SpiderFunction | null) {
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

    public getAsNumber() {
        const firstOpcode = this._getFirstOpcode().primaryOpcode;
        if (firstOpcode < SpiderOpcodes.i32_const.primaryOpcode || firstOpcode > SpiderOpcodes.f64_const.primaryOpcode)
            throw new Error("Cannot get the neumeric value of this constant expression. Its initalizer's first instruction is not a constant number.");
        return this.instructions[0].args[0] as number;
    }

    public getAsGlobal(): SpiderGlobal {
        const firstOpcode = this._getFirstOpcode();
        if (firstOpcode !== SpiderOpcodes.global_get)
            throw new Error("Cannot get the global variable value of this constant expression. Its initalizer's first instruction is not a global variable.");
        return this.instructions[0].args[0] as SpiderGlobal;
    }

    public getAsFunction(): SpiderFunction | null {
        const firstOpcode = this._getFirstOpcode();
        if (firstOpcode === SpiderOpcodes.ref_func)
            return this.instructions[0].args[0] as SpiderFunction;
        if (firstOpcode === SpiderOpcodes.ref_null)
            return null;
        throw new Error("Cannot get the global variable value of this constant expression. Its initalizer's first instruction is not a const reference.");
    }
}