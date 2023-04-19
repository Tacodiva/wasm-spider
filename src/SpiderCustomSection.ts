import { SpiderModule } from "./SpiderModule";

/** A section of custom binary data within a module. */
export type SpiderCustomSection = SpiderCustomSectionDefinition;

/** A section of custom binary data within a module. */
export class SpiderCustomSectionDefinition {
    public readonly module: SpiderModule;

    /** The name of this custom section. */
    public name: string;
    /** The buffer of bytes contained in this custom section. */
    public buffer: ArrayLike<number>;

    /** @hidden */
    public constructor(module: SpiderModule, name: string, buffer: ArrayLike<number>) {
        this.module = module;
        this.name = name;
        this.buffer = buffer;
    }
}