
const ALLOC_SIZE = 1024;

export class BinaryWriter {
    public static readonly TEXT_ENCODER = new TextEncoder();

    private _buffer: Uint8Array;
    private _bufferView: DataView;

    public position: number;

    public constructor() {
        this._buffer = new Uint8Array(ALLOC_SIZE);
        this._bufferView = new DataView(this._buffer.buffer);
        this.position = 0;
    }

    public reset() {
        this.position = 0;
    }

    public toBuffer(): Uint8Array {
        return this._buffer.slice(0, this.position);
    }

    private _checkBuffer(request: number) {
        if (this.position + request > this._bufferView.byteLength) {
            const newBuffer = new Uint8Array(Math.max(this._bufferView.byteLength * 2, this.position + request));
            const newBufferView = new DataView(newBuffer.buffer);
            newBuffer.set(this._buffer, 0);
            this._buffer = newBuffer;
            this._bufferView = newBufferView;
        }
    }

    public write(buf: ArrayLike<number>) {
        this._checkBuffer(buf.length);
        this._buffer.set(buf, this.position);
        this.position += buf.length;
    }

    public writeUint8(int: number) {
        this._checkBuffer(1);
        this._buffer[this.position++] = int;
    }

    public writeSint8(int: number) {
        this._checkBuffer(1);
        this._bufferView.setInt8(this.position++, int);
    }

    public writeUint32(int: number) {
        this._checkBuffer(4);
        this._bufferView.setUint32(this.position, int);
        this.position += 4;
    }

    public writeSint32(int: number) {
        this._checkBuffer(4);
        this._bufferView.setInt32(this.position, int);
        this.position += 4;
    }

    public writeUint64(int: bigint) {
        this._checkBuffer(8);
        this._bufferView.setBigUint64(this.position, int);
        this.position += 8;
    }

    public writeSint64(int: bigint) {
        this._checkBuffer(8);
        this._bufferView.setBigInt64(this.position, int);
        this.position += 8;
    }

    public writeF64(float: number) {
        this._checkBuffer(8);
        this._bufferView.setFloat64(this.position, float, true);
        this.position += 8;
    }

    public writeF32(float: number) {
        this._checkBuffer(4);
        this._bufferView.setFloat32(this.position, float, true);
        this.position += 4;
    }

    public writeULEB128(value: number) {
        do {
            let byte = value & 0x7f;
            value >>>= 7;
            if (value !== 0) byte |= 0x80;
            this.writeUint8(byte);
        } while (value !== 0);
    }

    public writeSLEB128(value: number) {
        let more = true;

        while (more) {
            let byte = value & 0x7f;
            value >>= 7;

            if ((value === 0 && (byte & 0x40) === 0) || (value === -1 && (byte & 0x40) !== 0)) {
                more = false;
            } else {
                byte |= 0x80;
            }

            this.writeUint8(byte);
        }
    }

    public writeBoolean(bool: boolean) {
        this.writeUint8(bool ? 0x01 : 0x00);
    }
}