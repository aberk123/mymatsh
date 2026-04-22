interface WelcomeBannerStep {
  number: number
  label: string
}

interface WelcomeBannerProps {
  greeting: string
  subtitle: string
  steps: WelcomeBannerStep[]
}

export function WelcomeBanner({ greeting, subtitle, steps }: WelcomeBannerProps) {
  return (
    <div className="welcome-banner">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A]">
            {greeting} <span>👋</span>
          </h2>
          <p className="text-sm text-[#555555] mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {steps.map((step) => (
            <div key={step.number} className="flex items-center gap-2">
              <div className="flex-shrink-0 w-7 h-7 rounded bg-brand-maroon text-white text-xs font-bold flex items-center justify-center">
                {step.number}
              </div>
              <span className="text-sm text-[#555555] max-w-[140px] leading-tight">{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
