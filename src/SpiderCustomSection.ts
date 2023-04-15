import { SpiderModule } from "./SpiderModule";

export type SpiderCustomSection = SpiderCustomSectionDefinition;

export class SpiderCustomSectionDefinition {

    public readonly module: SpiderModule;

    public name: string;
    public buffer: ArrayLike<number>;

    public constructor(module: SpiderModule, name: string, buffer: ArrayLike<number>) {
        this.module = module;
        this.name = name;
        this.buffer = buffer;
    }
}