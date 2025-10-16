// src/routes/caption-editor/route.tsx
import { createFileRoute } from '@tanstack/react-router'
import { CaptionEditorLayout } from '@/components/layout/caption-editor-layout'
import { CaptionEditorUI } from '@/components/caption-editor-ui'

export const Route = createFileRoute('/app')({
  component: () => (
    <CaptionEditorLayout>
      <CaptionEditorUI />
    </CaptionEditorLayout>
  )
})