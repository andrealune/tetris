# PRD: In-Game Instructions & Help (Berry issue L42-245)

## Problem
New players land on the Tetris board with no explanation of controls, rules, scoring,
or how to pause/mute. This causes early confusion and drop-off, especially for touch
users who have no on-screen cue for gestures. There is currently no Help entry point,
so returning players who forget a control have no way to look it up without leaving
the game.

## Measurable outcome
- 0 first-time sessions show unexplained controls: a Quick-Start appears automatically
  on a player's first visit, before or immediately as the board loads.
- 100% of sessions (first-time and returning) can reach full instructions within one
  tap/click via a persistent Help control, from both the start screen and mid-game.
- Support/feedback mentions of "how do I ___" (pause, mute, rotate, score) trend to
  zero post-release — tracked qualitatively by the team, no new instrumentation
  required for v1.

## Non-goals
- No in-game tutorial/interactive walkthrough (this is a static overlay/modal only).
- No localization — copy ships in English for v1.
- No changes to actual game mechanics, scoring formula, or key bindings — this issue
  documents the existing behavior, it does not change it. If the copy below and the
  real implementation disagree, the implementation is correct and the copy must be
  corrected to match it (engineering must verify against the actual code).

## Two surfaces required

### 1. Quick-Start overlay (first load only)
Shown automatically the first time a browser has never opened the game (tracked via a
`localStorage` flag, e.g. `tetris:seenInstructions=true`). Dismissing it (button, close
icon, or Escape) sets the flag so it never auto-shows again on that device/browser.
It must not block the ability to start playing — a single primary action, e.g.
**"Got it — let's play"**, closes it.

Suggested copy (≤ 100 words):

> **Welcome to Tetris!**
> Move the falling blocks to fill up rows — completed rows clear and score you points.
>
> - **Move:** ← → arrow keys, or swipe left/right
> - **Rotate:** ↑ arrow key, or tap the piece
> - **Drop faster:** ↓ arrow key, or swipe down
> - **Drop instantly:** Space bar, or swipe down fast
> - **Pause:** P key, or tap ⏸
> - **Mute sound:** M key, or tap 🔊
>
> Tap **Help (?)** any time for the full guide. Good luck!

### 2. Full Instructions modal (Help button, always available)
A **Help** control (a "?" icon or the word "Help") is visible at all times in the game
UI — on the start screen and during play — and opens this modal. Opening it during
active play **pauses the game** (reuse the existing pause behaviour) so the board,
timer and score freeze; closing the modal resumes exactly where the player left off,
with no reset.

Suggested sections and copy:

1. **Goal** — "Move and rotate the falling block shapes to completely fill a
   horizontal row across the board. Full rows disappear and earn you points. The
   game ends if the blocks stack all the way to the top."
2. **Controls** — a two-column table, Keyboard vs. Touch:
   | Action | Keyboard | Touch |
   |---|---|---|
   | Move left / right | ← → | Swipe left / right |
   | Rotate | ↑ (or Z / X) | Tap the falling piece |
   | Move down faster (soft drop) | ↓ | Swipe down |
   | Drop instantly (hard drop) | Space | Swipe down quickly / double-tap |
   | Hold piece *(if implemented)* | C | Tap the "Hold" button |
   | Pause / Resume | P or Esc | Tap the ⏸ button |
   | Mute / unmute sound | M | Tap the 🔊 button |
   | Restart after game over | Enter | Tap "Restart" |

   > Engineering: replace the bindings above with whatever the codebase actually
   > implements (check the keydown handler and touch/gesture handler) before
   > shipping — the table must match real behaviour exactly.
3. **Scoring** — "You score points every time you clear a row. Clearing several
   rows at once is worth more: 1 row, 2 rows, 3 rows, or 4 rows at once (a
   'Tetris') all pay out increasing bonus points, and the bonus grows with your
   level. [Confirm exact point values against the scoring code and state them
   here instead of the placeholder if they differ.]"
4. **Levels & speed** — "Clearing rows raises your level. Each level makes the
   blocks fall a little faster."
5. **Next piece & Hold** *(only if implemented)* — "The preview box shows the next
   shape coming up, so you can plan ahead. Hold lets you save a shape for later."
6. **Ghost piece** *(only if implemented)* — "The faint outline shows exactly where
   your piece will land if you drop it now."
7. **Sound & Pause** — "Tap the speaker icon, or press M, to mute or unmute sound
   at any time. Tap the pause icon, or press P or Esc, to pause; do it again to
   resume."
8. **High score** — "Your best score is saved automatically on this device, so you
   can try to beat it next time."

## UX / accessibility requirements
- Modal is dismissible via a visible close (×) button, clicking/tapping outside it,
  and the Escape key.
- Modal traps focus while open and returns focus to the control that opened it when
  closed; it uses `role="dialog"` / `aria-modal="true"` and is labelled by its heading.
- Help control is reachable by Tab and activatable with Enter/Space.
- Responsive: no horizontal scrolling at 360px width; text stays legible (contrast
  ratio ≥ 4.5:1) on both mobile and desktop; long content scrolls inside the modal
  rather than overflowing the page.
- Tone: short sentences, everyday words. Avoid unexplained jargon (e.g. don't use
  "tetromino" without immediately saying "falling block shape"; avoid "hard/soft
  drop" as headings without the plain-language explanation next to them).

## Acceptance criteria (QA-verifiable)
1. On a first-ever page load (no prior visit recorded for that browser), the
   Quick-Start overlay appears automatically, without requiring any click, and
   summarizes move / rotate / drop / pause / mute and the goal in ≤ 100 words.
2. Dismissing the Quick-Start overlay (primary button, close icon, or Escape) hides
   it and it does not reappear automatically on a subsequent reload/visit in the
   same browser (persisted via `localStorage` or equivalent).
3. A visible Help control is present at all times in the UI, including during active
   play, and opens the full Instructions modal when activated.
4. The Instructions modal content matches the real implementation exactly for:
   keyboard bindings, touch gestures, pause/resume, and mute/unmute — no
   discrepancies between documented and actual controls.
5. Opening the Instructions modal during active gameplay pauses the game (board,
   timer and score stop changing); closing it resumes from the exact same state
   (no reset of score, board, or level).
6. The modal can be closed via the close button, a click/tap outside it, and Escape.
7. All instructional copy uses plain, non-technical language with no unexplained
   jargon (spot-checked against the copy above).
8. Both surfaces are responsive: readable with no horizontal scroll at 360px width
   and at common desktop widths; text contrast ratio ≥ 4.5:1.
9. Help control and modal are keyboard-operable: Tab reaches the Help control,
   Enter/Space activates it, focus moves into the modal on open and returns to the
   Help control on close.
10. No regression: movement, rotation, drop, scoring, sound toggle, and pause/resume
    all continue to work after this change (manual smoke test of a full game
    round).

## Rollout
No flag needed — ship directly, it's additive UI. No analytics dependency for v1
(see Non-goals); if the team later wants to measure Help engagement, that's a
follow-up growth/analytics task, not part of this issue.
