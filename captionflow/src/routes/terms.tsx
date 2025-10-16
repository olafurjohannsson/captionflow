import { createFileRoute } from '@tanstack/react-router'

const TermsPage = () => {
  return (
    <div className="min-h-screen px-6 py-16 bg-slate-950 text-slate-200">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-6">Terms of Service</h1>
        <p className="mb-6">Last updated: 2025-09-25</p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-3">Acceptance</h2>
        <p className="mb-4">By using Kjarni.ai, you agree to these Terms. If you do not agree, do not use the service.</p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-3">Use of service</h2>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>You are responsible for your content and compliance with applicable laws</li>
          <li>No unlawful, infringing, or abusive content</li>
          <li>We may modify or discontinue features as we iterate</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-3">Subscriptions</h2>
        <p className="mb-4">Pro subscriptions bill via a third‑party provider. Taxes may apply. Refunds follow provider policy and local law.</p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-3">Disclaimers</h2>
        <p className="mb-4">The service is provided "as is" without warranties. We are not liable for indirect or consequential damages to the extent permitted by law.</p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-3">Contact</h2>
        <p className="mb-4">Questions? Email legal@kjarni.ai</p>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/terms')({
  component: () => <TermsPage />,
})

