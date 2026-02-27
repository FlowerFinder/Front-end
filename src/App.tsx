import { TenantProvider, useTenant } from '@/contexts/TenantContext'
import { LandingPage } from '@/sections/LandingPage'
import { ModeSelection } from '@/sections/ModeSelection'
import { ChatBot } from '@/sections/ChatBot'
import { QuizWizard } from '@/sections/QuizWizard'
import { ResultsPage } from '@/sections/ResultsPage'

function AppContent() {
  const { appState, isLoading } = useTenant()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary text-xl">Carregando...</div>
      </div>
    )
  }

  const { currentView } = appState

  if (currentView === 'landing') return <LandingPage />
  if (currentView === 'mode-selection') return <ModeSelection />
  if (currentView === 'chat') return <ChatBot />
  if (
    currentView === 'quiz' ||
    currentView === 'quiz-step-1' ||
    currentView === 'quiz-step-2' ||
    currentView === 'quiz-step-3' ||
    currentView === 'quiz-step-4'
  ) return <QuizWizard />
  if (
    currentView === 'results' ||
    currentView === 'plant-detail' ||
    currentView === 'favorites' ||
    currentView === 'cart'
  ) return <ResultsPage />

  return <LandingPage />
}

export default function App() {
  return (
    <TenantProvider>
      <AppContent />
    </TenantProvider>
  )
}
