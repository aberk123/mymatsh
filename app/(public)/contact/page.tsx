'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@/lib/zod-resolver'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  message: z.string().min(10, 'Please write at least 10 characters'),
})

type FormData = z.infer<typeof schema>

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to send')
      toast.success('Message sent! We\'ll be in touch soon.')
      setSubmitted(true)
      reset()
    } catch {
      toast.error('Failed to send message. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <section className="bg-brand-maroon text-white pt-32 pb-16 px-6 text-center">
        <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-white/80 max-w-lg mx-auto">
          Have a question or need support? We would love to hear from you.
        </p>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-lg mx-auto card">
          {submitted ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✉️</div>
              <h3 className="text-lg font-semibold text-brand-maroon mb-2">Message Received!</h3>
              <p className="text-[#555555] text-sm mb-6">Thank you for reaching out. We will respond within 24&#8211;48 hours.</p>
              <Button onClick={() => setSubmitted(false)}>Send Another</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-6">Send a Message</h2>

              <div>
                <Label htmlFor="name" required>Your Name</Label>
                <Input id="name" placeholder="Full name" error={errors.name?.message} {...register('name')} />
              </div>

              <div>
                <Label htmlFor="email" required>Email Address</Label>
                <Input id="email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
              </div>

              <div>
                <Label htmlFor="message" required>Message</Label>
                <Textarea id="message" placeholder="How can we help?" rows={5} error={errors.message?.message} {...register('message')} />
              </div>

              <Button type="submit" className="w-full mt-2" loading={isSubmitting} loadingText="Sending...">
                Send Message
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
