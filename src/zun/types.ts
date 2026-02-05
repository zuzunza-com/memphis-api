/**
 * ZUN Protocol Type Definitions for Zetrafi Client
 */

export enum ZunType {
  ARRAY = 0x01,
  OBJECT = 0x02,
  STREAM_ARRAY = 0x03,
  STREAM_OBJECT = 0x04,
}

export type ZunValue = 
  | string 
  | number 
  | boolean 
  | null 
  | ZunArray 
  | ZunObject;

export interface ZunArray extends Array<ZunValue> {
  __zunType?: 'array';
}

export interface ZunObject {
  __zunType?: 'object';
  [key: string]: ZunValue | 'object' | undefined;
}

export interface ZunStream {
  type: 'array' | 'object';
  items: ZunArray | ZunObject[];
}

export interface ZunResponse {
  data?: ZunArray;
  traceback?: ZunArray;
}

