import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'About Us' }

const features = [
  {
    title: 'Increased Visibility',
    description:
      'Your singles get seen by a wider network of dedicated Shadchanim, increasing the chances of finding the right match.',
    emoji: '👁️',
  },
  {
    title: 'Maintain One Profile',
    description:
      'Singles maintain a single, comprehensive profile that all authorized Shadchanim can access — no more duplicate paperwork.',
    emoji: '📋',
  },
  {
    title: 'Efficient Matching',
    description:
      'Smart filters and organized data help Shadchanim quickly identify compatible singles and make more successful matches.',
    emoji: '🔗',
  },
  {
    title: 'Secure Collaboration',
    description:
      'Role-based access ensures that sensitive information is only shared with authorized parties, maintaining trust and privacy.',
    emoji: '🔒',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-brand-maroon text-white pt-32 pb-16 px-6 text-center">
        <h1 className="text-4xl font-bold mb-4">About MyMatSH</h1>
        <p className="text-white/80 max-w-2xl mx-auto text-lg leading-relaxed">
          MyMatSH is a professional shidduch platform built specifically for the Orthodox Jewish
          community. We bring together Shadchanim, singles, and their families in one organized,
          secure, and respectful digital environment.
        </p>
      </section>

      {/* Feature cards */}
      <section className="py-16 px-6 bg-app-bg">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card hover:shadow-card-hover transition-shadow">
              <div className="text-4xl mb-4">{f.emoji}</div>
              <h3 className="text-lg font-semibold text-brand-maroon mb-2">{f.title}</h3>
              <p className="text-[#555555] text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
