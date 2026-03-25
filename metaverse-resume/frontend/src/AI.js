export class AIManager {
  constructor() {
    this.memory = [];
    this.chatHistory = document.getElementById('chat-history');
    this.chatInput = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('btn-send');
    this.voiceBtn = document.getElementById('btn-voice');
    
    // Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    } else {
      console.warn("Speech Recognition not supported in this browser.");
      this.voiceBtn.style.display = 'none';
    }

    this.synth = window.speechSynthesis;
    this.isRecording = false;
    this.isProcessing = false;
    
    this.initEvents();
  }

  initEvents() {
    this.sendBtn.addEventListener('click', () => this.handleSend());
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSend();
    });

    if (this.recognition) {
      this.voiceBtn.addEventListener('click', () => this.toggleVoice());
      
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.chatInput.value = transcript;
        this.handleSend();
        this.toggleVoice(false);
      };

      this.recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        this.toggleVoice(false);
      };
      
      this.recognition.onend = () => {
        this.toggleVoice(false);
      };
    }
  }

  toggleVoice(forceState = null) {
    if (forceState !== null) {
      this.isRecording = forceState;
    } else {
      this.isRecording = !this.isRecording;
    }

    if (this.isRecording) {
      this.voiceBtn.classList.add('voice-active');
      this.recognition.start();
    } else {
      this.voiceBtn.classList.remove('voice-active');
      this.recognition.stop();
    }
  }

  addMessageToUI(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(sender === 'user' ? 'user-msg' : 'ai-msg');
    msgDiv.innerText = text;
    this.chatHistory.appendChild(msgDiv);
    this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
  }

  speak(text) {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    // Find a good voice
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google") || v.lang === "en-US");
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    this.synth.speak(utterance);
  }

  async handleSend(textOverride = null) {
    if (this.isProcessing) {
      console.warn("AI is already processing a request. Skipping.");
      return;
    }

    const text = textOverride || this.chatInput.value.trim();
    if (!text) return;

    this.isProcessing = true;

    // Add to UI
    this.addMessageToUI('user', text);
    this.chatInput.value = '';

    // Add to Memory
    this.memory.push({ role: 'user', content: text });

    // Show typing
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('typing-indicator');
    typingDiv.innerText = "Processing neural response...";
    typingDiv.id = "typing-indicator";
    this.chatHistory.appendChild(typingDiv);
    this.chatHistory.scrollTop = this.chatHistory.scrollHeight;

    try {
      // LIMIT CONTEXT: Only send the last 6 messages (3 turns)
      const recentMemory = this.memory.slice(-6);

      // SAFETY TIMEOUT: Force reset isProcessing if request hangs
      const safetyTimeout = setTimeout(() => {
        if (this.isProcessing) {
          this.isProcessing = false;
          const indicator = document.getElementById('typing-indicator');
          if (indicator) indicator.remove();
          console.warn("AI Request timed out - forcefully resetting state.");
        }
      }, 30000);

      const res = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: recentMemory })
      });

      clearTimeout(safetyTimeout);

      const data = await res.json();
      
      const indicator = document.getElementById('typing-indicator');
      if (indicator) indicator.remove();
      
      let aiResponseText = data.response || "Communication error with neural network.";
      
      this.addMessageToUI('ai', aiResponseText);
      this.memory.push({ role: 'assistant', content: aiResponseText });
      
      // Voice synthesis
      this.speak(aiResponseText);

    } catch (err) {
      console.error(err);
      const indicator = document.getElementById('typing-indicator');
      if (indicator) indicator.remove();
      this.addMessageToUI('ai', "[System] Offline mode - Connection to AI core severed.");
    } finally {
      this.isProcessing = false;
    }
  }

  triggerRecruiterModeintro() {
    this.handleSend("Why should we hire you?");
  }
}
