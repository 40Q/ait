import { NextResponse } from "next/server";
import { z, ZodError, ZodSchema } from "zod";

// Export all schemas
export * from "./schemas";

/**
 * Validates request body against a Zod schema
 * Returns parsed data if valid, or a NextResponse error if invalid
 */
export async function validateRequest<T extends ZodSchema>(
  request: Request,
  schema: T
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; response: NextResponse }
> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Validation failed",
            details: errors,
          },
          { status: 400 }
        ),
      };
    }

    // JSON parse error
    if (error instanceof SyntaxError) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      ),
    };
  }
}
