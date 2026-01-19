import { assert } from "@std/assert";

function hasDuplicates<T extends readonly any[]>(arr: T): T {
  const set = new Set(arr);

  assert(set.size !== arr.length, "Duplicated values found");

  return arr;
}

type PropertyType = "string" | "number" | "integer" | "boolean" | "array" | "object" | "null";
type StringPropertyFormat = "email" | "url" | "uuid" | "date-time";
type EnumValue = string | null | number | boolean;

export interface IGeneralProperties {
  /**
   * The human readable title of the property.
   */
  title?: string;
  /**
   * The human readable description of the property.
   */
  description?: string;
}

export interface IBooleanProperty extends IGeneralProperties {
  type: "boolean";
  default?: boolean;
}

export interface INullProperty extends IGeneralProperties {
  type: "null";
  default?: null;
}

export interface IIntegerProperty extends IGeneralProperties {
  type: "integer";
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  default?: number;
}

export interface IEnumIntegerProperty extends IGeneralProperties {
  type: "integer";
  enum: number[];
  default?: number;
}

export interface IMultipleOfIntegerProperty extends IGeneralProperties {
  type: "integer";
  multipleOf: number;
  default?: number;
}

export interface INumberProperty extends IGeneralProperties {
  type: "number";
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  default?: number;
}

export interface IEnumNumberProperty extends IGeneralProperties {
  type: "number";
  enum: number[];
  default?: number;
}

export interface IStringProperty extends IGeneralProperties {
  type: "string";
  format?: StringPropertyFormat;
  minLength?: number;
  maxLength?: number;
  default?: string;
}

export interface IPatternStringProperty extends IGeneralProperties {
  type: "string";
  pattern: string;
}

export interface IEnumStringProperty extends IGeneralProperties {
  type: "string";
  enum: string[];
  default?: string;
}

export interface IArrayProperty extends IGeneralProperties {
  type: "array";
  items: ToolProperty;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  default?: (EnumValue & object)[];
}

export type ToolProperty = IObjectProperty | IEnumStringProperty | IEnumNumberProperty | IPatternObjectProperty | IStringProperty | IPatternStringProperty | IIntegerProperty | INumberProperty | IMultipleOfIntegerProperty;

export interface IObjectProperty extends IGeneralProperties {
  type: "object";
  properties: Record<string, ToolProperty>;
  required?: string[];
  minProperties?: number;
  maxProperties?: number;
  /**
   * `false` to disable the object to receive any additional properties.
   * `true` or `undefined` to allow any additional properties.
   * An object to specify the type of all additional properties.
   */
  additionalProperties?: boolean | { type: PropertyType; };
  propertyNames?: { pattern: string; };
  default?: object;
}

export interface IPatternObjectProperty extends Omit<IObjectProperty, 'properties'> {
  patternProperties: Record<string, ToolProperty>;
}

const a: ToolProperty = {
  type: "object",
  patternProperties: {
    "qweqweqwe": {
      type: "string",
      enum: ["qwdqwdqwd"],
    },
    "t": {
      type: "number",
      enum: [1, 2, 3, 5],
      default: 1
    }
  },
  default: {}
};

export function prop(type: PropertyType) {

}