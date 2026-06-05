import type { ZodError, ZodType } from "zod";

// Shape returned to the client on a validation failure (HTTP 400).
export interface ValidationErrorBody {
  error: "ValidationError";
  details: { path: string; message: string }[];
}

export function formatZodError(error: ZodError): ValidationErrorBody {
  return {
    error: "ValidationError",
    details: error.issues.map((issue) => ({
      path: issue.path.join(".") || "(root)",
      message: issue.message,
    })),
  };
}

// Parse `data` against `schema`. On success returns the typed value; on failure
// returns a 400 status with the structured error body. Controllers use this to
// keep validation-to-HTTP mapping in one place.
export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: 400; body: ValidationErrorBody };

export function parseBody<T>(schema: ZodType<T>, data: unknown): ParseResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return { ok: false, status: 400, body: formatZodError(result.error) };
}
