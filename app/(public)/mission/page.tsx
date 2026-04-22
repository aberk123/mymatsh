import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Our Mission' }

const features = [
  { title: 'Broader Network', description: 'Connect singles with the full community of qualified Shadchanim.', emoji: '🌐' },
  { title: 'Smart Search', description: 'Advanced filters help Shadchanim find compatible matches faster.', emoji: '🔍' },
  { title: 'Clear Visibility', description: 'Every single has a complete, accurate, up-to-date profile.', emoji: '✨' },
  { title: 'Faster Connections', description: 'Streamlined workflows reduce time from introduction to decision.', emoji: '⚡' },
  { title: 'Secure & Private', description: 'Bank-level security and granular privacy controls protect sensitive data.', emoji: '🛡️' },
]

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-brand-maroon text-white pt-32 pb-16 px-6 text-center">
        <h1 className="text-4xl font-bold mb-4">MyMatSH Mission</h1>
        <p className="text-white/80 max-w-2xl mx-auto text-lg leading-relaxed">
          Our mission is to support the sacred work of making Shidduchim by providing the most
          professional, efficient, and respectful platform for the Orthodox Jewish community. We
          believe every single deserves the best possible representation, and every Shadchan
          deserves tools worthy of their important work.
        </p>
      </section>

      <section className="py-16 px-6 bg-app-bg">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card text-center hover:shadow-card-hover transition-shadow">
              <div className="text-4xl mb-4">{f.emoji}</div>
              <h3 className="text-base font-semibold text-brand-maroon mb-2">{f.title}</h3>
              <p className="text-[#555555] text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
