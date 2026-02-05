/**
 * ZUN Protocol Decoder for Zetrafi Client
 */

import { ZunType, ZunValue, ZunArray, ZunObject, ZunResponse } from './types';

// Buffer type declaration for Node.js environments
declare const Buffer: {
  from(arr: Uint8Array): { toString(encoding: string): string };
} | undefined;

export class ZunDecoder {
  private buffer: Uint8Array;
  private offset: number;
  private view: DataView;

  constructor(buffer: Uint8Array) {
    this.buffer = buffer;
    this.offset = 0;
    this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  }

  static decode(buffer: Uint8Array): ZunValue {
    const decoder = new ZunDecoder(buffer);
    return decoder.decodeValue();
  }

  static decodeResponse(buffer: Uint8Array): ZunResponse {
    const decoder = new ZunDecoder(buffer);
    const value = decoder.decodeValue();
    
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {}; // Empty response (failure)
    }
    
    const obj = value as ZunObject;
    const response: ZunResponse = {};
    
    if ('data' in obj && Array.isArray(obj.data)) {
      response.data = obj.data as ZunArray;
    }
    
    if ('traceback' in obj && Array.isArray(obj.traceback)) {
      response.traceback = obj.traceback as ZunArray;
    }
    
    return response;
  }

  private decodeValue(): ZunValue {
    if (this.offset >= this.buffer.length) {
      throw new Error('Unexpected end of buffer');
    }

    const type = this.buffer[this.offset++];

    switch (type) {
      case ZunType.ARRAY:
        return this.decodeArray();
      case ZunType.OBJECT:
        return this.decodeObject();
      case 0x00:
        return null;
      case 0x01:
        return this.decodeBoolean();
      case 0x02:
        return this.decodeInt32();
      case 0x03:
        return this.decodeDouble();
      case 0x04:
        return this.decodeString();
      default:
        throw new Error(`Unknown type byte: 0x${type.toString(16)}`);
    }
  }

  private decodeArray(): ZunArray {
    const length = this.readUInt32BE();
    const arr: ZunArray = [];
    arr.__zunType = 'array';

    for (let i = 0; i < length; i++) {
      arr.push(this.decodeValue());
    }

    return arr;
  }

  private decodeObject(): ZunObject {
    const keyCount = this.readUInt32BE();
    const obj: ZunObject = {};
    obj.__zunType = 'object';

    for (let i = 0; i < keyCount; i++) {
      const keyLength = this.readUInt16BE();
      const keyBytes = this.buffer.slice(this.offset, this.offset + keyLength);
      // Use TextDecoder if available (Node.js 11+ or browser), otherwise fallback
      let decoder: { decode: (arr: Uint8Array) => string };
      if (typeof TextDecoder !== 'undefined') {
        decoder = new TextDecoder();
      } else if (typeof Buffer !== 'undefined' && Buffer) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const BufferClass = (globalThis as any).Buffer;
        decoder = { decode: (arr: Uint8Array) => BufferClass.from(arr).toString('utf-8') };
      } else {
        // Fallback for very old environments
        decoder = { decode: (arr: Uint8Array) => String.fromCharCode(...arr) };
      }
      const key = decoder.decode(keyBytes);
      this.offset += keyLength;
      
      const value = this.decodeValue();
      obj[key] = value;
    }

    return obj;
  }

  private decodeBoolean(): boolean {
    if (this.offset >= this.buffer.length) {
      throw new Error('Unexpected end of buffer');
    }
    return this.buffer[this.offset++] === 0x01;
  }

  private decodeInt32(): number {
    if (this.offset + 4 > this.buffer.length) {
      throw new Error('Unexpected end of buffer');
    }
    const value = this.view.getInt32(this.offset, false);
    this.offset += 4;
    return value;
  }

  private decodeDouble(): number {
    if (this.offset + 8 > this.buffer.length) {
      throw new Error('Unexpected end of buffer');
    }
    const value = this.view.getFloat64(this.offset, false);
    this.offset += 8;
    return value;
  }

  private decodeString(): string {
    const length = this.readUInt32BE();
    if (this.offset + length > this.buffer.length) {
      throw new Error('Unexpected end of buffer');
    }
    const bytes = this.buffer.slice(this.offset, this.offset + length);
    // Use TextDecoder if available (Node.js 11+ or browser), otherwise fallback
    let decoder: { decode: (arr: Uint8Array) => string };
    if (typeof TextDecoder !== 'undefined') {
      decoder = new TextDecoder();
    } else if (typeof Buffer !== 'undefined' && Buffer) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const BufferClass = (globalThis as any).Buffer;
      decoder = { decode: (arr: Uint8Array) => BufferClass.from(arr).toString('utf-8') };
    } else {
      // Fallback for very old environments
      decoder = { decode: (arr: Uint8Array) => String.fromCharCode(...arr) };
    }
    const value = decoder.decode(bytes);
    this.offset += length;
    return value;
  }

  private readUInt32BE(): number {
    if (this.offset + 4 > this.buffer.length) {
      throw new Error('Unexpected end of buffer');
    }
    const value = this.view.getUint32(this.offset, false);
    this.offset += 4;
    return value;
  }

  private readUInt16BE(): number {
    if (this.offset + 2 > this.buffer.length) {
      throw new Error('Unexpected end of buffer');
    }
    const value = this.view.getUint16(this.offset, false);
    this.offset += 2;
    return value;
  }
}

