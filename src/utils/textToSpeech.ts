// Global state for tracking speech and buffer
let isSpeaking = false;
let speechEndTime = 0;
const BUFFER_TIME_MS = 1000; // 1 second buffer after speech

export const speak = (text: string, rate: number = 1.0) => {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';
    
    // Track speech state
    utterance.onstart = () => {
      isSpeaking = true;
      console.log('Speech started');
    };
    
    utterance.onend = () => {
      isSpeaking = false;
      speechEndTime = Date.now();
      console.log('Speech ended, buffer active for 1 second');
    };
    
    utterance.onerror = () => {
      isSpeaking = false;
      speechEndTime = Date.now();
    };
    
    window.speechSynthesis.speak(utterance);
  } else {
    console.error('Text-to-speech not supported');
  }
};

export const isSpeechActive = (): boolean => {
  // Check if currently speaking
  if (isSpeaking) return true;
  
  // Check if within buffer period after speech ended
  const timeSinceEnd = Date.now() - speechEndTime;
  if (timeSinceEnd < BUFFER_TIME_MS) {
    return true;
  }
  
  return false;
};

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    speechEndTime = Date.now();
  }
};
