/**
 * ZUN Protocol Encoder for Zetrafi Client
 */

import { ZunType, ZunValue, ZunArray, ZunObject } from './types';

export class ZunEncoder {
  static encode(value: ZunValue): Uint8Array {
    if (Array.isArray(value)) {
      return this.encodeArray(value);
    } else if (value !== null && typeof value === 'object') {
      return this.encodeObject(value as ZunObject);
    } else {
      throw new Error('Root value must be ZunArray or ZunObject');
    }
  }

  static encodeArray(arr: ZunArray): Uint8Array {
    const buffers: Uint8Array[] = [];
    
    buffers.push(new Uint8Array([ZunType.ARRAY]));
    
    const lengthBuffer = new Uint8Array(4);
    const view = new DataView(lengthBuffer.buffer);
    view.setUint32(0, arr.length, false); // big-endian
    buffers.push(lengthBuffer);
    
    for (const item of arr) {
      buffers.push(this.encodeValue(item));
    }
    
    return this.concatBuffers(buffers);
  }

  static encodeObject(obj: ZunObject): Uint8Array {
    const buffers: Uint8Array[] = [];
    
    buffers.push(new Uint8Array([ZunType.OBJECT]));
    
    const keys = Object.keys(obj).filter(k => k !== '__zunType');
    const keyCountBuffer = new Uint8Array(4);
    const keyCountView = new DataView(keyCountBuffer.buffer);
    keyCountView.setUint32(0, keys.length, false);
    buffers.push(keyCountBuffer);
    
    for (const key of keys) {
      const value = obj[key];
      
      const keyBuffer = new TextEncoder().encode(key);
      const keyLengthBuffer = new Uint8Array(2);
      const keyLengthView = new DataView(keyLengthBuffer.buffer);
      keyLengthView.setUint16(0, keyBuffer.length, false);
      buffers.push(keyLengthBuffer);
      buffers.push(keyBuffer);
      
      buffers.push(this.encodeValue(value));
    }
    
    return this.concatBuffers(buffers);
  }

  private static encodeValue(value: ZunValue): Uint8Array {
    if (value === null) {
      return new Uint8Array([0x00]);
    } else if (typeof value === 'boolean') {
      return new Uint8Array([0x01, value ? 0x01 : 0x00]);
    } else if (typeof value === 'number') {
      if (Number.isInteger(value) && value >= -2147483648 && value <= 2147483647) {
        const buffer = new Uint8Array(5);
        buffer[0] = 0x02;
        const view = new DataView(buffer.buffer);
        view.setInt32(1, value, false);
        return buffer;
      } else {
        const buffer = new Uint8Array(9);
        buffer[0] = 0x03;
        const view = new DataView(buffer.buffer);
        view.setFloat64(1, value, false);
        return buffer;
      }
    } else if (typeof value === 'string') {
      const strBuffer = new TextEncoder().encode(value);
      const buffers: Uint8Array[] = [];
      buffers.push(new Uint8Array([0x04]));
      const strLengthBuffer = new Uint8Array(4);
      const strLengthView = new DataView(strLengthBuffer.buffer);
      strLengthView.setUint32(0, strBuffer.length, false);
      buffers.push(strLengthBuffer);
      buffers.push(strBuffer);
      return this.concatBuffers(buffers);
    } else if (Array.isArray(value)) {
      return this.encodeArray(value);
    } else if (typeof value === 'object') {
      return this.encodeObject(value as ZunObject);
    } else {
      throw new Error(`Unsupported value type: ${typeof value}`);
    }
  }

  static encodeResponse(data?: ZunArray, traceback?: ZunArray): Uint8Array {
    const obj: ZunObject = {};
    if (data) {
      obj.data = data;
    }
    if (traceback) {
      obj.traceback = traceback;
    }
    return this.encodeObject(obj);
  }

  private static concatBuffers(buffers: Uint8Array[]): Uint8Array {
    const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of buffers) {
      result.set(buf, offset);
      offset += buf.length;
    }
    return result;
  }
}

