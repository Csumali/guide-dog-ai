# 🧭 Guide Dog AI
### Multimodal Navigation Assistant for the Visually Impaired

**Guide Dog AI** is a cross-platform mobile app (Android + iOS) that helps visually impaired users navigate safely using **real-time camera input** and **multimodal AI (Gemini)**.  
It provides **voice and haptic feedback** to describe surroundings, warn about obstacles, and guide users interactively along safe walking routes.

![Alt text](assets/img.png)

---

## 🌟 Features

### 👁️ AI Scene Understanding
- Uses the phone’s camera and a **multimodal LLM** to interpret the environment in real-time.
- Describes scenes conversationally:
  > “You’re approaching a crosswalk with cars moving left to right.”
- Detects obstacles (poles, walls, benches, pedestrians, etc.) and advises avoidance:
  > “Obstacle ahead, move slightly left.”

### 🔊 Audio + Haptic Feedback
- Text-to-Speech (TTS) for natural voice guidance.
- Optional **vibration cues** for left/right turns or obstacle alerts.
- Configurable feedback sensitivity.

### 🔒 Privacy by Design
- No video is stored — all camera data is processed transiently for inference.
---

## 🧱 Architecture Overview

```text
Camera Feed ─▶ Frame Sampler (1–2 FPS)
               │
               ▼
        Multimodal LLM API
            (Gemini)
               │
     ┌─────────┴─────────┐
     ▼                   ▼
 Scene Description   Obstacle Warnings
     │                   │
     └─────────┬─────────┘
               ▼
   Voice + Haptic Feedback
