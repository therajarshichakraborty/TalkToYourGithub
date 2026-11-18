import { z } from "zod";

interface Loosenable {
  loose?: () => unknown;
  passthrough?: () => unknown;
}

const objectProto = z.ZodObject.prototype as unknown as Loosenable;
if (typeof objectProto.loose !== "function") {
  objectProto.loose = function (this: Loosenable) {
    return this.passthrough?.();
  };
}

const typeProto = z.ZodType.prototype as unknown as Loosenable;
if (typeof typeProto.loose !== "function") {
  typeProto.loose = function (this: Loosenable) {
    return typeof this.passthrough === "function" ? this.passthrough() : this;
  };
}
