'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

function DialogOverlay({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showClose = true,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { showClose?: boolean }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          // Desktop: centered modal
          'fixed z-50 bg-white shadow-xl w-full overflow-y-auto',
          'md:left-[50%] md:top-[50%] md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-2xl md:max-h-[90vh]',
          // Mobile: bottom sheet
          'max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:translate-x-0 max-md:translate-y-0',
          'max-md:rounded-t-2xl max-md:rounded-b-none max-md:max-h-[92dvh]',
          // Animations
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95',
          'md:data-[state=closed]:slide-out-to-left-1/2 md:data-[state=closed]:slide-out-to-top-[48%]',
          'md:data-[state=open]:slide-in-from-left-1/2 md:data-[state=open]:slide-in-from-top-[48%]',
          'max-md:data-[state=open]:slide-in-from-bottom max-md:data-[state=closed]:slide-out-to-bottom',
          className
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close className="absolute top-4 end-4 rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 pt-6 pb-4', className)} {...props} />
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100', className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-semibold text-[#1A1A1A]', className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-[#555555] mt-1', className)}
      {...props}
    />
  )
}

/* Multi-step wizard progress bar */
interface WizardStep {
  label: string
  index: number
}

interface WizardProgressProps {
  steps: WizardStep[]
  currentStep: number
}

function WizardProgress({ steps, currentStep }: WizardProgressProps) {
  return (
    <div className="flex items-center border-b border-gray-100 px-6 pt-4">
      {steps.map((step, i) => (
        <div key={step.index} className="flex items-center flex-1 last:flex-none">
          <button
            className={cn(
              'text-xs font-medium py-2 px-1 border-b-2 transition-colors whitespace-nowrap',
              currentStep === step.index
                ? 'border-brand-pink text-brand-pink'
                : currentStep > step.index
                ? 'border-brand-maroon text-brand-maroon'
                : 'border-transparent text-[#888888]'
            )}
          >
            {step.label}
          </button>
          {i < steps.length - 1 && (
            <div className="flex-1 h-px bg-gray-200 mx-1" />
          )}
        </div>
      ))}
    </div>
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  WizardProgress,
}
