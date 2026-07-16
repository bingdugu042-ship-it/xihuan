import { CharacterStage } from '@/ui/components/character/CharacterStage'
import { ChatImmersiveShell } from '@/ui/components/chat/ChatImmersiveShell'
import { Sidebar } from '@/ui/components/sidebar/Sidebar'
import { NewSessionModal } from '@/ui/components/modals/NewSessionModal'
import { RelationshipPanel } from '@/ui/components/panels/RelationshipPanel'
import { SandOfTimeModal } from '@/ui/components/modals/SandOfTimeModal'
import { VoiceCallOverlay } from '@/ui/components/modals/VoiceCallOverlay'
import { ImagePickerModal } from '@/ui/components/modals/ImagePickerModal'
import { EmojiPickerModal } from '@/ui/components/modals/EmojiPickerModal'
import { TransferModal } from '@/ui/components/modals/TransferModal'
import { SaveNpcModal } from '@/ui/components/modals/SaveNpcModal'
import { StampOfferModal } from '@/ui/components/modals/StampOfferModal'
import { useSettingsStore } from '@/store/settingsStore'

export function ChatTab() {
  const isPreview = useSettingsStore((s) => s.settings.ui.characterMode) === 'preview'

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      {isPreview && <CharacterStage />}
      <ChatImmersiveShell isPreview={isPreview} />
      <Sidebar />
      <NewSessionModal />
      <RelationshipPanel />
      <SandOfTimeModal />
      <VoiceCallOverlay />
      <ImagePickerModal />
      <EmojiPickerModal />
      <TransferModal />
      <SaveNpcModal />
      <StampOfferModal />
    </div>
  )
}
