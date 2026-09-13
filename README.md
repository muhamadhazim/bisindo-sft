# BISINDO Learning Platform

An interactive, mobile-first learning platform designed to help beginners learn the foundations of **BISINDO (Bahasa Isyarat Indonesia)** through structured lessons, camera-based practice, and experimental gesture recognition.

This project is currently being developed for the **Samsung Solve for Tomorrow semifinal stage**.

> BISINDO Learning Platform is designed as a learning tool, not a universal sign-language translator and not a replacement for human interpreters.

---

## About the Project

Learning sign language independently can be difficult when learners can watch examples but have limited opportunities to actively practice and receive feedback.

BISINDO Learning Platform explores a more interactive learning experience where learners can gradually move through:

```text
Learn → Observe → Practice → Camera Feedback → Challenge → Reward → Review
```

The alphabet is used as a starting foundation rather than the entire scope of the product.

The long-term goal is to expand the learning experience toward vocabulary and simple communication practice.

---

## Core Features

### Structured Learning Path

Learning content is divided into smaller lessons instead of presenting everything at once.

The learning experience is designed around:

- micro-learning,
- guided observation,
- camera-based practice,
- gesture challenges,
- interactive feedback,
- gamification,
- mastery progression,
- adaptive review.

---

### Camera-Based Practice

Learners can practice BISINDO gestures directly using their camera.

Hand tracking runs locally in the browser using **MediaPipe Tasks Vision**.

The camera experience includes:

- camera permission handling,
- hand landmark detection,
- mirrored camera preview,
- hand tracking visualization,
- frame processing,
- model failure handling,
- camera cleanup when leaving the practice page.

Raw webcam frames are **not uploaded to a backend**.

---

## Experimental Alphabet Recognition

The current prototype includes an experimental **A–Z alphabet recognition system** that runs directly in the browser.

The recognition pipeline combines:

- MediaPipe hand landmarks,
- feature extraction,
- an MLP classification model,
- ONNX WASM browser inference,
- BISINDO reference material.

The training and runtime pipeline use the same feature representation to reduce inconsistencies between model development and actual browser inference.

The recognition system is still experimental and requires broader testing with different users.

A model prediction should not be interpreted as proof that a gesture is linguistically correct.

---

## Privacy by Design

Privacy is an important part of the camera experience.

The system is designed around several principles:

- webcam processing happens locally in the browser,
- raw webcam frames are not sent to a backend,
- camera tracks are stopped after leaving practice,
- camera mirroring only changes what the learner sees,
- recognition coordinates remain consistent internally,
- video frames are not intentionally stored.

This allows learners to use camera-based practice without having to upload recordings of themselves.

---

## Responsible Recognition

BISINDO is a real language used by real communities, so the project avoids making claims that have not been properly validated.

The recognition system follows several principles:

- model confidence is not treated as gesture correctness,
- recognition and learning feedback are separate concepts,
- static and dynamic gestures may require different approaches,
- BISINDO rules should not be invented from developer assumptions,
- reference materials should come from traceable sources,
- recognition accuracy should not be claimed without sufficient testing,
- one variation of BISINDO should not automatically be treated as universal.

The goal is to use computer vision to support learning rather than position AI as an authority on whether someone is signing correctly.

---

## Current Development Status

The project is actively being developed.

### Currently Implemented

- responsive mobile-first interface,
- structured alphabet lessons,
- camera-based practice,
- MediaPipe hand tracking,
- hand landmark visualization,
- experimental A–Z recognition,
- browser-based ONNX inference,
- reference gesture display,
- model loading and failure handling,
- camera lifecycle handling,
- responsive interface testing,
- browser-based recognition testing.

### In Development

- corrective learning feedback,
- challenge mechanics,
- scoring,
- mastery progression,
- learning progress persistence,
- adaptive review,
- expanded user validation.

### Future Exploration

After the core learning experience becomes stable, future possibilities include:

- vocabulary learning,
- dynamic gestures,
- adaptive lesson recommendations,
- additional gamification,
- 3D hand visualization,
- broader BISINDO learning material.

---

## Learning Experience

The platform is designed around a repeated learning loop:

### 1. Learn

Learners are introduced to a BISINDO sign and its reference.

### 2. Observe

The learner studies how the hand gesture should be formed.

### 3. Practice

The camera is activated so the learner can try the gesture directly.

### 4. Camera Feedback

Computer vision analyzes the detected hand landmarks and produces an experimental recognition result.

### 5. Challenge

Learners practice previously introduced gestures without relying entirely on the reference.

### 6. Reward

Progress and gamification elements help encourage continued practice.

### 7. Review

Previously learned signs can return through review activities to reinforce learning.

---

## Technology Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Motion

### Computer Vision & Machine Learning

- MediaPipe Tasks Vision
- hand landmark extraction
- MLP classifier
- ONNX
- ONNX WASM
- local browser inference

### Platform

- Supabase
- Vercel

### Testing

- Playwright
- responsive testing
- camera lifecycle testing
- browser recognition testing
- linting
- type checking
- production build verification

---

## Getting Started

### Requirements

```text
Node.js 24.21.0
npm 10.9.4
```

### Install Dependencies

```bash
npm ci
```

### Start Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Verification

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Install Playwright Chromium:

```bash
npx playwright install chromium
```

Then run:

```bash
npm test
```

On Linux, Playwright dependencies may require:

```bash
npx playwright install --with-deps chromium
```

---

## Production Build

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

---

## Optional Camera Test

A local camera test is available to verify camera initialization and cleanup.

After starting the production server:

```bash
npm run test:camera:local
```

The test briefly activates the webcam to verify that live video is available and camera tracks are correctly released afterward.

Camera frames are not intentionally persisted by this test.

---

## Machine Learning Approach

The current recognition system uses hand landmarks instead of sending raw camera images directly into the recognition model.

The simplified pipeline is:

```text
Camera
   ↓
MediaPipe Hand Tracking
   ↓
Hand Landmarks
   ↓
Feature Extraction
   ↓
MLP Classifier
   ↓
ONNX WASM
   ↓
Recognition Result
```

This allows the recognition model to run locally inside the browser.

The system intentionally separates:

```text
Hand Tracking
      ↓
Recognition
      ↓
Learning Feedback
      ↓
Mastery
```

A successful recognition result does not automatically mean that the learner has mastered the gesture.

---

## Known Limitations

The project is still an experimental learning prototype.

Current limitations include:

- recognition has not yet been validated across a large population of new users,
- recognition output should not be interpreted as authoritative BISINDO correctness,
- mastery scoring is still under development,
- persistent learning progress is not yet complete,
- dynamic gestures require additional recognition approaches,
- broader mobile-device performance testing is still required,
- BISINDO variations and regional differences require careful consideration.

These limitations are documented intentionally instead of presenting experimental machine-learning results as established accuracy.

---

## Product Principles

### Learning First

Computer vision exists to support the learning experience, not to become the entire product.

### Problem Before Technology

Technology is selected based on the learning problem rather than adding features only because they are technically interesting.

### Privacy First

Camera processing should remain on the user's device whenever possible.

### Do Not Overclaim AI

Recognition confidence is not equivalent to correctness.

### Validate Before Expanding

The core learning and camera experience should work reliably before introducing more complex features.

### Mobile First

The platform is designed with mobile learners as a primary use case.

---

## Roadmap

The current priority is completing the core learning loop:

```text
Structured Lessons
        ↓
Observation
        ↓
Camera Practice
        ↓
Gesture Recognition
        ↓
Corrective Feedback
        ↓
Challenge
        ↓
Progression
        ↓
Review
```

Once this experience becomes reliable, the platform can gradually expand toward:

- vocabulary,
- dynamic gestures,
- communication exercises,
- adaptive learning,
- additional gamification,
- richer visual learning experiences.

---

## Samsung Solve for Tomorrow

BISINDO Learning Platform is currently being developed for the **Samsung Solve for Tomorrow semifinal stage**.

The project explores how software, computer vision, and interactive learning experiences can be combined to make introductory BISINDO learning more engaging and accessible.

---

## Disclaimer

BISINDO Learning Platform is an educational prototype.

It is not:

- a universal BISINDO translator,
- a replacement for human interpreters,
- a BISINDO certification system,
- or an authoritative system for determining whether someone's sign is linguistically correct.

Gesture recognition remains experimental and should be interpreted as part of the learning experience rather than a definitive assessment of a learner's signing ability.
