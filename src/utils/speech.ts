export function speakAnswer(text: string, language: string): boolean {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return false

  try {
    const utterance = new SpeechSynthesisUtterance(text)
    const normalizedLanguage = language.trim().toLowerCase()
    if (normalizedLanguage) {
      utterance.lang = language
      const voices = window.speechSynthesis.getVoices()
      utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === normalizedLanguage)
        ?? voices.find((voice) => voice.lang.toLowerCase().split('-')[0] === normalizedLanguage.split('-')[0])
        ?? null
    }
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    return true
  } catch {
    return false
  }
}

export function stopAnswerSpeech() {
  if (!('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
  } catch {
    // Speech support is optional and must never interrupt practice.
  }
}
