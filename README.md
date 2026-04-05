# ResearchPulse

A high-fidelity, editorial-style research intelligence application designed to aggregate AI/ML papers, community discussions, and corporate releases into a frictionless, Tinder-style swipe interface.

## Highlights 

- **Tinder-Style Swipe Mechanics**: Interactive card stack with physics-based drag-and-drop. Swipe right to save, left to skip. Focus on frictionless triaging.
- **Deep-Dive Summaries**: Long-form structured briefs extracting "What Matters" (Key Contributions) and "Full Context" from complex research papers.
- **Multi-Source Intelligence**:
  - **Research Papers**: Live feeds from arXiv spanning AI, ML, CV, NLP, and Robotics.
  - **Hot Topics**: Trend crawling from top-tier community discussions (`r/MachineLearning`, `r/LocalLLaMA`, etc.).
  - **New Releases**: Timeline feeds tracking AI lab announcements (OpenAI, Anthropic, Google DeepMind, Mistral, Meta, and more).
  - **Data Engineering**: Focused updates on system design, observability, tools, and ML infrastructure scaling.
- **Terminal Editorial Design System**: A strict monochromatic palette with a single cyan accent (`#00D9FF`) to provide a premium, distraction-free reading environment. Complete with Light and Dark modes.
- **Local Persistence**: Favorited papers are kept intelligently in your browser's local storage.

## Architecture
- **Vanilla HTML/CSS/JS**: Zero-build-step architecture for absolute speed and immediate deployment.
- **Custom Swipe Engine**: Custom pointer-events physics matrix for rotation and spring animations.
- **Client-Side Parsing**: Real-time DOMParser manipulation for XML research feed translations and JSON ingestion.

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/DhanushAnegondi/research_updates.git
   ```
2. Navigate to the project folder:
   ```bash
   cd research_updates
   ```
3. Serve the directory locally:
   ```bash
   python -m http.server 8080
   # or
   npx serve .
   ```
4. Open your browser and navigate to `http://localhost:8080` to experience the app.

## License
MIT
