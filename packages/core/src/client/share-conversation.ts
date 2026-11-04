/** Copy a chat transcript; returns whether the clipboard write started. */
export function copyTranscript(
  transcript: string,
  onOk: () => void,
  onFail: (reason: 'unavailable' | 'denied') => void,
): void {
  const write = globalThis.navigator?.clipboard?.writeText(transcript)
  if (write === undefined) {
    onFail('unavailable')
    return
  }
  void write.then(onOk, () => onFail('denied'))
}
