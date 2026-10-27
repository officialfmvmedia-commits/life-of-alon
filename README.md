# Life of Alon — chapter 0 (pump HQ)
Plain ES modules + vendored Three.js r169 (no build step). Serve `dist/` (or `game/`) with any static server.
- src/main.js – boot, renderer, state machine (title / play / computer), quality toggle, loop
- src/player.js – procedural Alon model + controller + walk/idle animation
- src/world.js – office geometry, lights, colliders, interactables (add new props/interactions here)
- src/interactions.js – E-to-use registry (register({id,prompt,pos,radius}) + on(id, fn))
- src/camera.js – third-person orbit camera + scripted shots
- src/post.js – GTAO, bloom, DOF, AgX output, grade/vignette, SMAA
- src/fx.js – dust motes + light shafts
- src/ui.js – DOM UI (title, HUD, prompt, toast, alonOS desktop)
- src/textures.js – every texture, drawn on canvas at runtime

## alonOS (Alon's computer)
Walk to the main desk, press **E**. ESC: blur input → close dialog → stand up. ⤢ in the menubar = fill screen (3D render pauses while full).
- **Chirpr** – parody microblog. Post as @alon; 7–20 replies stream in from fictional accounts with keyword/sentiment-aware templates, sentiment meter, ticking counts. Optional hook: `window.CHIRPR_LLM = async (text) => [{name, handle, text, sent}]`.
- **PumpFun HQ** – admin dashboard (Overview / Users / Tokens / Revenue / Traders). Traders → wallet → *Drain wallet* (hold to confirm) → SOL moves to Alon's Wallet. **Deliver the Airdrop** (hold to confirm) multiplies every trader 20x–200x, flips Chirpr into celebration mode, hypes DUVE and checks off the whiteboard.
- NPCs: DUVE (trader desk) and RASMR (lounge couch; rename via COUCH_NAME in src/npc_couch.js).
- **Alon's Wallet**, **pump terminal**, **notes.txt**, **Settings** (fill screen, wallpaper, reset everything incl. airdrop).
State lives in localStorage `loa-os-v1`. Everything is simulated: fictional numbers, accounts and addresses; no network calls.


## v5 — NPC actions & live earnings
- Near **DUVE** or **RASMR**: `E` talks, `F` opens the **Actions** menu. You can drive it with ↑/↓ or W/S, E/Enter/Space, the number keys, or the mouse. ESC or F closes it, and Alon stays still while it's open.
- Actions: **Talk**, **Take half of earnings**, **Check his bags** or **Peek at his phone**, and **Hype him up**. **Take half of earnings** needs a confirm: click or press it twice.
- Earnings are simulated, as before.
  - DUVE's run as a random walk with drift, spikes and dips. He fist-pumps on a spike and puts his hands on his head on a dip.
  - RASMR's accrue slowly, with occasional lucky bumps.
  - They're saved in localStorage, cleared by Settings → reset, and shared with the PumpFun dashboard: wallet balance = base + live PnL, and the drain takes it all.
- Floating `PnL ±X.XX SOL` labels sit above DUVE's monitors (large) and beside RASMR (small). They fade in from 5 m and are fully visible within 2.5 m.
- Taking half:
  - Coins fly to Alon and the amount goes to Alon's Wallet as a "Took half of X's earnings" tx.
  - The NPC's history in PumpFun shows "taken by alon".
  - There's a 20 s cooldown, and nothing happens if they're at 0.
- Tests: `check/v5.cjs`.


## v6 — ANSEM
- **Where he sits:** ANSEM, an affectionate in-game parody, is at the three-monitor desk next to DUVE. His monitors show animated candles.
- **Animations:** he types, uses the mouse, leans back with his arms crossed (his signature pose), nods and pounds his fist on the desk on pumps.
- **His lines** are original and written in his cadence. See `notes/ansem-voice.md` for the voice research and reference post links.
- **Talk and actions:** `E` talks. `F` opens the actions menu: Talk, Take half of earnings, Ask for a call and Check his bags.
- **Earnings:** his live PnL is bigger and more volatile than DUVE's, with a floating label above his monitors.
- **PumpFun:** he's listed as "ANSEM (parody)", with live PnL, drain, airdrop and take-half history.
- **Chirpr:** an @ansem_hq account, tagged "parody · in-game", posts in the feed and sometimes replies to Alon.
- **Tests:** `check/v6.cjs`.


## Sound (v6)
All sound is synthesized at runtime with Web Audio in `src/audio.js`; there are no audio files. It starts after the Start click.

**What you hear:**
- **Room tone:** brown-noise HVAC, a faint 60/120 Hz electrical hum, and a distant city band near the windows.
- **Positional sources (HRTF, distance rolloff):**
  - the server-rack fan and the fridge hum
  - keyboard and mouse bursts from DUVE's and ANSEM's desks, synced to their typing state
  - rare typing at the empty desks
  - RASMR's phone taps
- **Game and OS sounds:** Alon's footsteps on wood follow the walk cycle and get louder when running. OS click, open and close sounds, coin clinks for take-half and drain, and an airdrop swell.

**Mix and controls:**
- **Mix:** master 0.5 × volume, then a limiter. Ambience ducks while you're on the computer.
- **Controls:** **M** toggles mute. There's a speaker button at the top right of the HUD and a volume slider and mute switch in alonOS → Settings. Settings are saved in localStorage under `loa-audio-v1`.
- **URL flag:** `?audio=0` starts the game muted.

Tests: `check/audio.cjs`.
