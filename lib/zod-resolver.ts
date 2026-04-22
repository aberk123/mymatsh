import { type FieldValues, type Resolver, type ResolverResult } from 'react-hook-form'
import { z } from 'zod'

export function zodResolver<T extends FieldValues>(
  schema: z.ZodType<T>
): Resolver<T> {
  return async (values): Promise<ResolverResult<T>> => {
    const result = schema.safeParse(values)
    if (result.success) {
      return { values: result.data, errors: {} }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors: any = {}
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.')
      if (path) {
        errors[path] = { type: 'validation', message: issue.message }
      }
    })
    return { values: {} as T, errors }
  }
}
