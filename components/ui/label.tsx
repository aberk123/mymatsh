import { forwardRef } from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

const Label = forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { required?: boolean }
>(({ className, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('field-label', className)}
    {...props}
  >
    {children}
    {required && <span className="text-red-500 ms-0.5">*</span>}
  </LabelPrimitive.Root>
))
Label.displayName = 'Label'

export { Label }
