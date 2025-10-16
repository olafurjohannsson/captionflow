
import { ThemeProvider } from '@/context/theme-provider'
import { FontProvider } from '@/context/font-provider'
import { DirectionProvider } from '@/context/direction-provider'
import { Header } from '@/components/layout/header'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

export function CaptionEditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <FontProvider>
        <DirectionProvider>
          <div className="min-h-screen bg-background">
            {/* <Header className="border-b">
              kjarni.ai
              <div className="ml-auto flex items-center space-x-4">
                
                <ProfileDropdown />
              </div>
            </Header> */}
            <main className="h-[calc(100vh-4rem)]">
              {children}
            </main>
          </div>
        </DirectionProvider>
      </FontProvider>
    </ThemeProvider>
  )
}