
export class BinaryReader {
    public readonly buffer: Uint8Array;
    public readonly bufferView: DataView;

    public position: number;

    public constructor(buffer: Uint8Array) {
        this.buffer = buffer;
        this.bufferView = new DataView(buffer.buffer);
        this.position = 0;
    }

    public reset() {
        this.position = 0;
    }

    public read(length: number) {
        return this.buffer.slice(this.position, this.position += length);
    }

    public readUint8() {
        return this.buffer[this.position++];
    }

    public readSint8() {
        return this.bufferView.getInt8(this.position++);
    }

    public readUint32() {
        const val = this.bufferView.getUint32(this.position);
        this.position += 4;
        return val;
    }

    public readSint32() {
        const val = this.bufferView.getInt32(this.position);
        this.position += 4;
        return val;
    }

    public readUint64() {
        const val = this.bufferView.getBigUint64(this.position);
        this.position += 8;
        return val;
    }

    public readSint64() {
        const val = this.bufferView.getBigInt64(this.position);
        this.position += 8;
        return val;
    }

    public readFloat32() {
        const val = this.bufferView.getFloat32(this.position, true);
        this.position += 4;
        return val;
    }

    public readFloat64() {
        const val = this.bufferView.getFloat64(this.position, true);
        this.position += 8;
        return val;
    }

    public readULEB128() {
        let result = 0;
        let shift = 0;
        let byte;

        do {
            byte = this.buffer[this.position++];;
            result |= (byte & 0x7f) << shift;
            shift += 7;
        } while (byte & 0x80);

        return result;
    }

    public readSLEB128(): number {
        let result = 0;
        let shift = 0;
        let byte;

        do {
            byte = this.buffer[this.position++];;
            result |= (byte & 0x7f) << shift;
            shift += 7;
        } while (byte & 0x80);

        if ((byte & 0x40) && (shift < 32)) {
            result |= - (1 << shift);
        }

        return result;
    }

    public readBoolean() {
        return this.readUint8() !== 0;
    }

}