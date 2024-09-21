import { z } from "zod";

export const ApiResponseSchema = <T extends z.ZodSchema>(schema: T) =>
  z.object({
    data: schema,
  });
