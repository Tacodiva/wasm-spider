import { SpiderInstruction } from "./SpiderInstruction";
import { SpiderImportType, SpiderNumberType, SpiderReferenceType, SpiderValueType } from "./enums";
import { SpiderOpcodes, SpiderOpcode } from "./SpiderOpcode";
import { SpiderGlobal, SpiderGlobalDefinition } from "./SpiderGlobal";
import { SpiderFunction, SpiderFunctionDefinition } from "./SpiderFunction";
import { SpiderImportFunction, SpiderImportGlobal } from "./SpiderImport";

/** A value which can be pushed onto the stack as a constant number. */
export type SpiderExprConstNumber = number | SpiderGlobal;
/** A value which can be pushed onto the stack as a constant. */
export type SpiderExprConstValue = SpiderExprConstNumber | SpiderFunction | null;

/** A series of instructions which can be executed at runtime. */
export class SpiderExpression {
    /** 
     * Creates a constant expression with the specified type and value.
     * @throws TypeError if type and value are incompatible.
     */
    public static createConst(type: SpiderValueType, value: SpiderExprConstValue) {
        const expr = new SpiderExpression();
        expr.setToConst(type, value);
        return expr;
    }

    /** The actual list of instructions. */
    public readonly instructions: SpiderInstruction[];

    public constructor(instructions: SpiderInstruction[] = []) {
        this.instructions = instructions;
    }

    /** Removes all instructions from this expression. */
    public clear() {
        this.instructions.length = 0;
    }

    /**
     * Appends an instruction at the end of this expression.
     * @param opcode The type of instruction to append.
     * @param args The arguments of this instruction. Changes depending upon the opcode.
     */
    public emit<T extends any[]>(opcode: SpiderOpcode<T>, ...args: T) {
        this.instructions.push({ opcode, args });
    }

    /**
     * Emits one of `i32_const`, `i64_const`, `f32_const` or `f64_const` with the value
     * depending on the type argument.
     * @param type The type of const instruction to be emitted.
     * @param value The argument of the const instruction to be emitted.
     * @see {@link emit}
     */
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

    /**
     * Emits a `block` instruction with a new expression as the body.
     * 
     * @example
     * ```ts
     * func.body.emitBlock(SpiderNumberType.f64, expr => {
     *  expr.emitConstant(SpiderNumberType.f64, 1);
     *  expr.emitConstant(SpiderNumberType.f64, 2);
     *  expr.emit(SpiderNumberType.f64_add);
     * });
     * ```
     * @param lambda A function invoked before this method returns which emits instructions to the expression inside
     * the block.
     * @param blocktype The type of value left on the stack after the emitted block has executed. Leave undefined
     * for blocks which leave no value on the stack.
     * @returns The expression executed inside this block. This is the same expression passed to the lambda function.
     */
    public emitBlock(lambda?: (block: SpiderExpression) => any, blocktype?: SpiderValueType): SpiderExpression {
        const inst = new SpiderExpression();
        this.emit(SpiderOpcodes.block, inst, blocktype);
        if (lambda) lambda(inst);
        return inst;
    }

    /**
     * Emits a `loop` instruction with a new expression as the body.
     * 
     * @example
     * A loop which runs 10 times.
     * ```ts
     * const loopCounter = func.addLocalVariable(SpiderNumberType.i32);
     * func.body.emitConstant(SpiderNumberType.i32, 0);
     * func.body.emit(SpiderOpcodes.local_set, loopCounter);
     * func.body.emitLoop(expr => {
     *     expr.emit(SpiderOpcodes.local_get, loopCounter);
     *     expr.emitConstant(SpiderNumberType.i32, 1);
     *     expr.emit(SpiderOpcodes.i32_add)
     *     expr.emit(SpiderOpcodes.local_tee, loopCounter);
     *     expr.emitConstant(SpiderNumberType.i32, 10);
     *     expr.emit(SpiderOpcodes.i32_ne);
     *     expr.emit(SpiderOpcodes.br_if, 0);
     * });
     * ```
     * @param lambda A function invoked before this method returns which emits instructions to the expression inside
     * the loop.
     * @param blocktype The type of value left on the stack after the emitted loop has executed. Leave undefined
     * for blocks which leave no value on the stack.
     * @returns The expression executed inside this block. This is the same expression passed to the lambda function.
     */
    public emitLoop(lambda?: (block: SpiderExpression) => any, blocktype?: SpiderValueType): SpiderExpression {
        const inst = new SpiderExpression();
        this.emit(SpiderOpcodes.loop, inst, blocktype);
        if (lambda) lambda(inst);
        return inst;
    }

    /**
     * Emits an `if` instruction with a new expression as the body, without an else expression.
     * 
     * @example
     * An if statement which makes sure that 1 + 1 = 2.
     * ```ts
     * const loopCounter = func.addLocalVariable(SpiderNumberType.i32);
     * func.body.emitConstant(SpiderNumberType.i32, 1);
     * func.body.emitConstant(SpiderNumberType.i32, 1);
     * func.body.emit(SpiderNumberType.i32_add); // 1 + 1
     * func.body.emitConstant(SpiderNumberType.i32, 2);
     * func.body.emit(SpiderNumberType.i32_eq); // 1 + 1 === 2
     * func.body.emitIf(expr => {
     *     expr.emit(SpiderOpcodes.call, mathIsntBrokenYay);
     * });
     * ```
     * @param lambda A function invoked before this method returns which emits instructions to the expression
     *  which executes if the condition is true.
     * @param blocktype The type of value left on the stack if the condition is true.
     * Leave undefined for expressions which leave no value on the stack.
     * @returns The expression executed inside the if statement. This is the same expression passed to the lambda function.
     */
    public emitIf(lambda?: (block: SpiderExpression) => any, blocktype?: SpiderValueType): SpiderExpression {
        const inst = new SpiderExpression();
        this.emit(SpiderOpcodes.if, inst, undefined, blocktype);
        if (lambda) lambda(inst);
        return inst;
    }

    /**
     * Emits an `if` instruction with an else block using two new expressions as the bodys.
     * 
     * @example
     * An if-else statement which makes sure that 1 + 1 = 2.
     * ```ts
     * const loopCounter = func.addLocalVariable(SpiderNumberType.i32);
     * func.body.emitConstant(SpiderNumberType.i32, 1);
     * func.body.emitConstant(SpiderNumberType.i32, 1);
     * func.body.emit(SpiderNumberType.i32_add); // 1 + 1
     * func.body.emitConstant(SpiderNumberType.i32, 2);
     * func.body.emit(SpiderNumberType.i32_eq); // 1 + 1 === 2
     * func.body.emitIfElse(expr => { // if 
     *     expr.emit(SpiderOpcodes.call, mathIsntBrokenYay);
     * }, expr => { // else
     *     expr.emit(SpiderOpcodes.call, mathIsBrokenOmfg);
     * });
     * ```
     * @param lambdaTrue A function invoked before this method returns which emits instructions to the expression
     *  which executes if the condition is true.
     * @param lambdaFalse A function invoked before this method returns which emits instructions to the expression
     *  which executes if the condition is false.
     * @param blocktype The type of value left on the stack after the emitted if or else expressions have executed.
     * Leave undefined for expressions which leave no value on the stack.
     * @returns The two expressions the could be executed.
     */
    public emitIfElse(
        lambdaTrue?: (block: SpiderExpression) => any,
        lambdaFalse?: (block: SpiderExpression) => any,
        blocktype?: SpiderValueType): {
            /** The expression executed if the condition is true. */
            instrTrue: SpiderExpression,
            /** The expression executed if the condition is false. */
            instrFalse: SpiderExpression
        } {
        const instrTrue = new SpiderExpression();
        const instrFalse = new SpiderExpression();
        this.emit(SpiderOpcodes.if, instrTrue, instrFalse, blocktype);
        if (lambdaTrue) lambdaTrue(instrTrue);
        if (lambdaFalse) lambdaFalse(instrFalse);
        return { instrTrue, instrFalse };
    }

    /** 
     * Clears this expression and emits the instruction to push a constant with the specified
     *  type and value onto the stack.
     * @example
     * ```ts
     * global.value.setToConst(SpiderNumberType.i64, 69420);
     * ```
     * @throws TypeError if type and value are incompatible.
     */
    public setToConst(type: SpiderValueType, value: SpiderExprConstValue) {
        if (typeof value === 'number') {
            if (type < SpiderNumberType.f64 || type > SpiderNumberType.i32)
                throw new TypeError(`Cannot set type ${type} to a number.`);
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
                    throw new TypeError(`Global is of wrong type. Expected ${type} but got ${cast.type}.`);
                this.setToConstGlobal(value as SpiderGlobal);
            } else {
                if (type !== SpiderReferenceType.funcref)
                    throw new TypeError(`Wrong type. Expected ${type} but got a function. `);
                this.setToConstFunction(value as SpiderFunction | null);
            }
        }
    }

    /**
     * Clears this expression and emits the instruction to push a number with the specified
     *  type and value onto the stack.
     */
    public setToConstNumber(type: SpiderNumberType, value: number) {
        this.clear();
        this.emitConstant(type, value);
    }

    /**
     * Clears this expression and emits the instruction to push the value of a global onto
     * the stack.
     */
    public setToConstGlobal(global: SpiderGlobal) {
        this.clear();
        this.emit(SpiderOpcodes.global_get, global);
    }

    /**
     * Clears this expression and emits the instruction to push a reference to the function or
     * a null function reference onto the stack.
     */
    public setToConstFunction(func: SpiderFunction | null) {
        this.clear();
        if (func) this.emit(SpiderOpcodes.ref_func, func);
        else this.emit(SpiderOpcodes.ref_null, SpiderReferenceType.funcref);
    }

    private _getConstOpcode(): SpiderOpcode {
        if (this.instructions.length > 1)
            throw new Error("Cannot get the value of this expression as it contains multiple instructions.");
        if (this.instructions.length === 0)
            throw new Error("Cannot get the value of this expression as it is empty.");
        const firstOpcode = this.instructions[0].opcode;
        return firstOpcode;
    }

    /**
     * If this expression has one instruction which pushes a constant number onto the stack, returns that
     * number.
     * @example
     * Gets the number the global is being set to on module initialization.
     * ```ts
     * const globalValue = global.value.getAsConstNumber();
     * ```
     * @throws If this expression doesn't have exactly one instruction, or that one instruction's opcode
     * isn't a constant number.  
     */
    public getAsConstNumber() {
        const firstOpcode = this._getConstOpcode().primaryOpcode;
        if (firstOpcode < SpiderOpcodes.i32_const.primaryOpcode || firstOpcode > SpiderOpcodes.f64_const.primaryOpcode)
            throw new Error("Cannot get the neumeric value of this expression as its first instruction is not a constant number.");
        return this.instructions[0].args[0] as number;
    }

    /**
     * If this expression has one instruction which pushes the value of a global onto the stack, returns that
     * global.
     * @throws If this expression doesn't have exactly one instruction, or that one instruction's opcode
     * isn't `global_get`.
     */
    public getAsConstGlobal(): SpiderGlobal {
        const firstOpcode = this._getConstOpcode();
        if (firstOpcode !== SpiderOpcodes.global_get)
            throw new Error("Cannot get the global variable value of this constant expression. Its initalizer's first instruction is not a global variable.");
        return this.instructions[0].args[0] as SpiderGlobal;
    }

    /**
     * If this expression has one instruction which pushes a funcref onto the stack, returns the function
     * referred to by the constant funcref or null if the constant funcref is null.
     * @throws If this expression doesn't have exactly one instruction, or that one instruction's opcode
     * isn't `global_get`.
     */
    public getAsConstFunction(): SpiderFunction | null {
        const firstOpcode = this._getConstOpcode();
        if (firstOpcode === SpiderOpcodes.ref_func)
            return this.instructions[0].args[0] as SpiderFunction;
        if (firstOpcode === SpiderOpcodes.ref_null)
            return null;
        throw new Error("Cannot get the global variable value of this constant expression. Its initalizer's first instruction is not a const reference.");
    }
}