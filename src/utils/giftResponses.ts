/** 收到礼物后的 mock 回话 */
const GENERIC_REPLIES = (item: string) => [
  `……${item}？谢谢，我会收好的。`,
  `（接过${item}）你的心意我收到了。`,
  `这份${item}……挺有意思的。`,
]

export function getGiftReply(_characterId: string, itemName: string): string {
  const lines = GENERIC_REPLIES(itemName)
  return lines[Math.floor(Math.random() * lines.length)]
}
