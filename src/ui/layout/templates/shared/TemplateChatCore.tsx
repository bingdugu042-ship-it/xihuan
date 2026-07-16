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

/** 模板布局共用的对话核心（复用沉浸三栏壳） */
export function TemplateChatCore() {
  return (
    <>
      <ChatImmersiveShell embedded />
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
    </>
  )
}
