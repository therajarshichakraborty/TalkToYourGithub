import { z } from "zod";

// Polyfill ZodObject.prototype.loose for compatibility with @corsair-dev/github (which expects Zod v4 .loose())
if (typeof (z.ZodObject.prototype as any).loose !== "function") {
  (z.ZodObject.prototype as any).loose = function () {
    return this.passthrough();
  };
}
