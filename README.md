# 🌿 Zestiquee — Your Voice-First AI Kitchen Assistant
> **Tagline:** Your kitchen. Your voice. Everything organized.  
> Inspired by the natural conversational experience of Alexa, with its own distinctive culinary identity, real inventory tools, persistent multi-timers, dual-option recipe architecture, and full Model Context Protocol (MCP) server support.

---

## 📖 Table of Contents
1. [Product Overview](#-product-overview)
2. [Key Architectural Highlights](#-key-architectural-highlights)
3. [Core Feature Breakdown](#-core-feature-breakdown)
   - [1. International Language Catalog (First Screen)](#1-international-language-catalog-first-screen)
   - [2. Alexa-Inspired Voice Orb & Speech Engine](#2-alexa-inspired-voice-orb--speech-engine)
   - [3. Dual-Option Recipe Architecture](#3-dual-option-recipe-architecture)
   - [4. Guided Step-by-Step Cooking Mode](#4-guided-step-by-step-cooking-mode)
   - [5. My Kitchen Pantry Management](#5-my-kitchen-pantry-management)
   - [6. Separate Smart Shopping List](#6-separate-smart-shopping-list)
   - [7. Persistent Multi-Timers with Audible Chimes](#7-persistent-multi-timers-with-audible-chimes)
   - [8. Household Meal Planner](#8-household-meal-planner)
   - [9. Model Context Protocol (MCP) Server](#9-model-context-protocol-mcp-server)
4. [Tech Stack](#-tech-stack)
5. [Model Context Protocol (MCP) 20 Tools Reference](#-model-context-protocol-mcp-20-tools-reference)
6. [API Endpoints Reference](#-api-endpoints-reference)
7. [Installation & Setup](#-installation--setup)
8. [High Availability & Fallback Reliability](#-high-availability--fallback-reliability)

---

## 🌟 Product Overview
Zestiquee is designed for busy households, home cooks, beginners, students, and multilingual families worldwide. It bridges the gap between natural human speech and practical everyday household inventory management. 

Instead of demanding perfect English or forcing users into rigid forms, Zestiquee understands natural conversational requests like:
- *"What can I cook with the ingredients I have?"*
- *"I bought one kilo of carrots, half a kilo of rice, and a litre of milk."*
- *"How do I make soft chapatis?"*
- *"Start a 10-minute timer for pasta."*
- *"Add missing ingredients to my shopping list."*

---

## 🏛 Key Architectural Highlights
- **Full-Stack Express + React 19:** Serves live REST endpoints, Gemini AI streaming, speech synthesis, and MCP JSON-RPC 2.0.
- **Resilient AI Pipeline:** Automatic model fallback chain (`gemini-3.8-flash` ➔ `gemini-flash-latest` ➔ `gemini-3.1-flash-lite` ➔ Smart Culinary Engine) ensuring zero downtime even during Google Cloud 503 traffic spikes.
- **Strict Allergen Safety Constraints:** Allergens (Peanuts, Gluten, Dairy, Tree Nuts, Eggs, Shellfish, etc.) are treated as strict safety rules; recipes and substitutions never violate user constraints.
- **Persistent Timestamp Countdown:** Cooking timers are stored with exact start and end timestamps so countdowns remain accurate through page reloads, tab switches, and device suspensions.
- **Complete Decoupling of Pantry & Shopping List:** The pantry tracks what is actually at home; the shopping list tracks what you plan to buy. When items are purchased, a one-click transfer updates the pantry while preventing duplicates.

---

## 🚀 Core Feature Breakdown

### 1. International Language Catalog (First Screen)
- **Mandatory First Screen:** Before sign-in, users choose their language from 30+ international languages.
- **Languages Included:**
  - English, Telugu (తెలుగు), Hindi (हिन्दी), Tamil (தமிழ்), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), Bengali (বাংলা), Marathi (मराठी), Gujarati (ગુજરાતી), Punjabi (ਪੰਜਾਬੀ), Urdu (اردو), Odia (ଓଡ଼ିଆ), Assamese (অসমীয়া), Spanish (Español), French (Français), German (Deutsch), Portuguese (Português), Italian (Italiano), Dutch (Nederlands), Arabic (العربية), Mandarin (中文), Japanese (日本語), Korean (한국어), Russian (Русский), Indonesian (Bahasa Indonesia), Thai (ไทย), Vietnamese (Tiếng Việt), Turkish (Türkçe), Swahili (Kiswahili), and more.
- **Granular Preferences:** Users can independently select:
  1. *Display Language* (UI menus & buttons)
  2. *Speech Input Language* (what the microphone listens for)
  3. *Assistant Response Language* (how the assistant speaks and answers)
  4. *Speech Rate & Voice Persona* (Kore, Puck, Charon, Fenrir, Zephyr)

### 2. Alexa-Inspired Voice Orb & Speech Engine
- **Voice-First Orb:** Tap-to-talk microphone with real-time waveform glow, live speech recognition, editable transcription, and text input fallback.
- **High-Fidelity Spoken Output:** Server-side Gemini TTS (`gemini-3.8-flash-lite-tts`) produces WAV audio, complemented by native browser Web Speech API fallback.
- **Immediate Controls:** Stop audio immediately, repeat spoken answer, or clear conversation with a single tap.

### 3. Dual-Option Recipe Architecture
Whenever a dish is requested, Zestiquee formulates two distinct, complete options:
- **Option 1: Original / Traditional Recipe**
  - Complete authentic formulation for the household size.
  - Side-by-side comparison with the user's real pantry items.
  - Marks ingredients as *In Pantry* (with available quantity) or *Needs Purchase* (with missing quantity).
  - **One-Click Missing Ingredients:** Calculates required quantities and adds them directly to the shopping list without creating duplicates.
- **Option 2: Pantry-Adapted Recipe**
  - Pragmatic alternative crafted using only ingredients currently available at home.
  - Explicitly documents substitutions made, omitted items, and expected flavor/texture differences.
- **Watch & Learn (Verified YouTube Links):** Verified search queries tailored to the dish, cuisine, user's language, and cooking skill level.
- **Chef Tips & Safety Precautions:** Practical storage guidance, food safety alerts, and common cooking mistakes to avoid.

### 4. Guided Step-by-Step Cooking Mode
- Distraction-free, large-typography interface.
- One step at a time with relevant ingredient measurements.
- Embedded step timers that launch with a single tap.
- Voice read-aloud and repeat controls.

### 5. My Kitchen Pantry Management
- 16 culinary categories (Vegetables, Grains, Pulses, Dairy, Spices, Oils, Bakery, etc.).
- Attributes: Item name, quantity, unit, storage location (Fridge, Freezer, Pantry, Countertop, Spice Rack), purchase date, expiry date, notes, and low-stock threshold.
- Visual alerts for expiring ingredients (within 3 days or expired) and low-stock warnings.
- Consumption workflow to log usage and deduct quantities.

### 6. Separate Smart Shopping List
- Decoupled from pantry inventory.
- Real-time estimated budget tracker.
- Check-off purchased items.
- One-click **Transfer Bought Items to Pantry** with automatic duplicate quantity merging.

### 7. Persistent Multi-Timers with Audible Chimes
- Multi-timer system running on persistent Unix timestamps.
- Built-in synthesizer Web Audio chime that rings reliably without external audio asset dependencies.
- Presets for Chai/Tea (3m), Boiling Eggs (7m), Rice (12m), Dal (18m), and Baking (25m).
- Pause, resume, and cancel capabilities.

### 8. Household Meal Planner
- Weekly planner covering Breakfast, Lunch, Dinner, and Snacks.
- **Generate Shopping List from Meal Plan:** Compares scheduled meals against pantry items and automatically adds only missing items to the shopping list.

### 9. Model Context Protocol (MCP) Server
- Live HTTP Streamable endpoint at `/api/mcp` and `/mcp` supporting JSON-RPC 2.0.
- Exposes 20 kitchen tools for third-party AI agents (Cursor, Claude Desktop, custom Alexa developer skills).
- Built-in MCP Inspector Modal to test and inspect all 20 tools interactively.

---

## 🛠 Tech Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend:** Node.js, Express, tsx.
- **AI & Speech SDK:** `@google/genai` (Gemini 3.8 Flash, Gemini TTS `gemini-3.8-flash-lite-tts`).
- **Protocols:** REST, JSON-RPC 2.0 (Model Context Protocol), Web Speech API, Web Audio API.

---

## 🔌 Model Context Protocol (MCP) 20 Tools Reference

| Tool Name | Description |
| :--- | :--- |
| `get_pantry` | Retrieve full pantry inventory items, quantities, and expiry dates. |
| `search_pantry` | Search pantry inventory by item keyword or category. |
| `add_pantry_item` | Add a food item or increase quantity in the pantry. |
| `update_pantry_item` | Update item quantity, storage location, or notes. |
| `remove_pantry_item` | Delete an item from the pantry inventory. |
| `get_shopping_list` | Retrieve the separate shopping list of items to buy. |
| `add_shopping_item` | Add a grocery item to the shopping list. |
| `update_shopping_item` | Update shopping item details or status. |
| `remove_shopping_item` | Delete an item from the shopping list. |
| `mark_item_purchased` | Mark a shopping item as bought and transfer to pantry. |
| `generate_recipe` | Generate both Original and Pantry-Adapted recipe options. |
| `compare_recipe_with_pantry`| Cross-reference recipe ingredients against real pantry stock. |
| `add_missing_ingredients` | Add missing recipe ingredients to shopping list. |
| `get_meal_plan` | Retrieve current household weekly meal plans. |
| `create_meal_plan` | Create or update weekly meal plan entries. |
| `create_timer` | Start an accurate persistent cooking countdown timer. |
| `list_timers` | List all active and running cooking timers. |
| `cancel_timer` | Cancel or remove an active cooking timer. |
| `get_user_preferences` | Get user language, allergens, and dietary constraints. |
| `get_conversation_history` | Retrieve past kitchen chat logs and recipe references. |

---

## 📡 API Endpoints Reference
- `POST /api/assistant/chat` — Central AI voice and text intelligence with tool execution.
- `POST /api/assistant/tts` — Gemini Text-to-Speech audio synthesis (`audio/wav`).
- `GET /api/pantry`, `POST /api/pantry`, `PUT /api/pantry/:id`, `DELETE /api/pantry/:id` — Pantry CRUD.
- `POST /api/pantry/consume` — Deduct consumed ingredient amounts.
- `GET /api/shopping`, `POST /api/shopping`, `PUT /api/shopping/:id`, `DELETE /api/shopping/:id` — Shopping List CRUD.
- `POST /api/shopping/transfer-to-pantry` — Transfer purchased items to pantry inventory.
- `GET /api/timers`, `POST /api/timers`, `PUT /api/timers/:id`, `DELETE /api/timers/:id` — Timers management.
- `GET /api/recipes/saved`, `POST /api/recipes/save`, `DELETE /api/recipes/saved/:id` — Saved recipe bookmarks.
- `GET /api/meal-plans`, `POST /api/meal-plans` — Meal plans.
- `POST /api/meal-plans/generate-shopping-list` — Cross-reference meal plans with pantry for shopping list.
- `GET /api/user`, `POST /api/user` — User profile, language, and allergen configuration.
- `GET /api/youtube/search` — Verified YouTube cooking queries matching language and skill level.
- `GET /api/mcp` and `POST /api/mcp` — Model Context Protocol endpoint (JSON-RPC 2.0).
- `GET /api/download-zip` — Direct download of full project zip file.

---

## 💻 Installation & Setup

1. **Clone or Extract Archive:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Copy `.env.example` to `.env`:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   PORT=3000
   ```

3. **Start Full-Stack Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Production Build:**
   ```bash
   npm run build
   npm start
   ```

---

## 🛡 High Availability & Fallback Reliability
Zestiquee includes automatic retry and model fallback logic. If Google's `gemini-3.8-flash` experiences transient high demand (HTTP 503) or rate limits (HTTP 429), Zestiquee seamlessly switches models and employs an intelligent culinary rules engine so your kitchen assistant remains responsive 100% of the time.
