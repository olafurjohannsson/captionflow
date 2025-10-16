import { createFileRoute } from '@tanstack/react-router'

const PrivacyPage = () => {
  return (
    <div className="min-h-screen px-6 py-16 bg-slate-950 text-slate-200">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-6">Privacy Policy</h1>
        <p className="mb-6">Last updated: 2025-09-25</p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-3">Overview</h2>
        <p className="mb-4">Kjarni.ai processes media client‑side by default. Your videos are not uploaded to our servers for transcription. Some Pro features (e.g., account, billing) require minimal server-side data.</p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-3">What we process locally</h2>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Transcription using Whisper runs in your browser (WASM)</li>
          <li>Waveform generation and caption editing run locally</li>
          <li>Exported files (SRT/VTT/JSON, burned video) are produced client-side</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-3">What we may collect</h2>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Account info (email, name)</li>
          <li>Subscription and billing details (via our payment provider)</li>
          <li>Product analytics (aggregated, cookie‑consented)</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-3">Data retention</h2>
        <p className="mb-4">We retain account and billing data as required for service and legal compliance. We do not store your media unless explicitly uploaded to a cloud feature (none by default).</p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-3">Contact</h2>
        <p className="mb-4">Questions? Email privacy@kjarni.ai</p>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/privacy')({
  component: () => <PrivacyPage />,
})

