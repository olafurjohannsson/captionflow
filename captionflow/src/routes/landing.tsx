import { type FC } from 'react';
import { Play, Zap, Shield, Box, Github, Film, ArrowRight } from 'lucide-react';

const LandingPage: FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Film className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">CaptionFlow</span>
          </a>
          <nav className="flex items-center space-x-6">
            <a href="https://github.com/olafurjohannsson/caption-editor" target="_blank" rel="noopener noreferrer" className="text-foreground-muted hover:text-foreground transition-colors">
              GitHub
            </a>
            <a href="/editor" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity font-semibold">
              Launch Editor
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent -z-10"></div>
          <div className="container mx-auto px-6">
            <div className="inline-flex items-center space-x-2 bg-secondary border border-border rounded-full px-3 py-1 mb-6">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-foreground text-sm">100% Private & In-Browser</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tighter">
              Your Private, In-Browser <br />
              <span className="text-primary">Captioning Studio.</span>
            </h1>
            <p className="max-w-2xl mx-auto mt-6 text-lg text-foreground-muted">
              A powerful, open-source editor that respects your privacy. Generate transcripts
              and burn subtitles using AI and high-performance tools that run entirely on your device.
            </p>
            <a
              href="/editor"
              className="inline-flex items-center justify-center gap-2 mt-10 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity"
            >
              <span>Launch Editor for Free</span>
              <ArrowRight className="w-5 h-5" />
            </a>
            <p className="mt-4 text-sm text-foreground-muted">No sign-up required. Your files never leave your computer.</p>

            {/* Editor Mockup */}
            <div className="relative mt-16 max-w-4xl mx-auto">
              <div className="relative bg-card border border-border rounded-xl shadow-2xl shadow-primary/10 p-2">
                <div className="aspect-video bg-background rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="absolute top-4 left-4 h-2 w-1/4 bg-border rounded-full opacity-50"></div>
                  <div className="absolute top-4 right-4 h-2 w-1/5 bg-border rounded-full opacity-50"></div>
                  <Play className="w-16 h-16 text-foreground-muted opacity-30" />
                  <div className="absolute bottom-6 left-6 right-6 bg-black/50 backdrop-blur-sm rounded-md p-3 text-sm text-center">
                    ...and burn subtitles using AI and high-performance tools...
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-tr from-primary to-accent rounded-full -z-10 blur-2xl opacity-50"></div>
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full -z-10 blur-2xl opacity-50"></div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl font-bold">A Professional Toolset, For Free.</h2>
              <p className="mt-4 text-lg text-foreground-muted">
                CaptionFlow combines powerful technologies into a seamless workflow,
                giving you everything you need to create perfect captions.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: "In-Browser AI Transcription",
                  description: "Generate accurate transcripts with Whisper AI. Your files are never uploaded.",
                },
                {
                  icon: Shield,
                  title: "100% Private & Secure",
                  description: "All processing happens on your device thanks to WebAssembly. Your data is your own.",
                },
                {
                  icon: Box,
                  title: "No Installation Required",
                  description: "Use high-performance tools like FFmpeg and Rust directly in your browser, instantly.",
                },
                {
                  icon: Play,
                  title: "High-Performance Timeline",
                  description: "A buttery-smooth timeline powered by WebGL for precise, frame-by-frame editing.",
                },
                {
                  icon: Film,
                  title: "Burn & Export",
                  description: "Burn subtitles directly into your video or export standard SRT files for any platform.",
                },
                {
                  icon: Github,
                  title: "Free & Open Source",
                  description: "Built for the community. Use it, learn from it, and contribute on GitHub.",
                },
              ].map((feature) => (
                <div key={feature.title} className="bg-card border border-border rounded-lg p-6">
                  <feature.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-foreground-muted">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Source CTA Section */}
        <section className="py-20">
            <div className="container mx-auto px-6">
                <div className="max-w-4xl mx-auto text-center bg-card border border-border rounded-xl p-10">
                    <Github className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                    <h2 className="text-3xl font-bold">Built for the Community</h2>
                    <p className="mt-4 text-lg text-foreground-muted">
                        CaptionFlow is a free and open-source project. You can explore the
                        code, learn from the techniques, or even contribute to its development.
                    </p>
                    <a href="https://github.com/olafurjohannsson/caption-editor" target="_blank" rel="noopener noreferrer" className="inline-block mt-8 bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                        View Source on GitHub
                    </a>
                </div>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-6 py-8 text-center text-foreground-muted">
          <p>&copy; {new Date().getFullYear()} CaptionFlow. A passion project by{' '}
            <a href="https://olafuraron.is" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Ólafur Áron.
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;