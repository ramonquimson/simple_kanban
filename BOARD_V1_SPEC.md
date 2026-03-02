

# BOARD_V1_SPEC.md

Version: 1.2
Philosophy: Navigation layer, not storage. Cognitive traffic control, not productivity theatre.

---

## 1. Purpose

This board exists to:

* Capture fast-moving ideas safely
* Separate thinking mode from execution mode
* Protect Build focus from idea contamination
* Validate monetization before effort
* Provide a lightweight control panel across phone and laptop
* Remain fast on old hardware (iPhone 8 class device)

It is NOT a knowledge base.
It is NOT a note-taking system.
It is NOT a project management suite.

All thinking lives in linked environments. The board only points.

---

## 2. Operating Modes

### Phone Mode (Capture Mode)

Used for:

* Flash ideas
* Light research
* Monetization checks
* Stage movement
* Caption updates
* JSON export

Default column:

* Flash
* If Oxygen contains cards → Oxygen first

---

### Laptop Mode (Execution Mode)

Used for:

* Build stage
* Deep work from card link
* Caption evolution
* Shipping

Default column:

* Build

---

### Device Logic

* Screen width < 768px → Phone Mode default
* Screen width ≥ 768px → Laptop Mode default

---

## 3. Columns (Stages)

Ordered left to right:

1. Oxygen (max 2 cards)
2. Flash
3. Qualify
4. Monetization Check
5. Research
6. Design
7. Build (max 3 cards)
8. Ship
9. Archive

---

## 4. Stage Intent

### Oxygen

Cash / survival critical only.

### Flash

Raw instinct. No editing. No nesting.

### Qualify

Alignment check. Worth attention?

### Monetization Check

Presell and demand validation.
Willingness to pay is tested here.

### Research

Light validation. No rabbit holes.

### Design

Clear outcome. Clear scope. Clear constraint.

### Build

Execution only. No redesign.

### Ship

Delivered / published.

### Archive

Closed and done.

---

## 5. Monetization Rule (Critical)

No card may enter **Build** without passing Monetization Check
Unless explicitly tagged: `Non-Monetary`

Examples of Non-Monetary:

* NQ doctrine
* Personal growth
* Family matters

---

### Monetization Check Outcomes

Inside this stage, one of three outcomes must occur:

1. **No Signal**

   * Move to Archive
   * Or return to Research

2. **Soft Signal (interest expressed)**

   * Move to Design

3. **Hard Signal (commitment/payment)**

   * Move directly to Build

Presell lives inside Monetization Check.
There is no separate Presell column.

---

## 6. Flash Rule (Critical)

Flash ideas are ALWAYS standalone.

If Flash relates to existing project:

* Create independent Flash card
* Later merge during Qualify or Design
* Log “merged into Y”
* Delete Flash card

Never attach Flash directly to Build card.
Never pollute execution lane.

---

## 7. Card Structure

Each card contains:

* id
* title (single clear action line)
* domain (QO / NQ / Personal / Family / Oxygen)
* energy (Low / Med / Deep)
* stage
* primaryLink (required)
* repoLink (nullable; allowed only if stage ≥ Design)
* caption (short current state)
* log (array, max 10 entries)
* createdAt

---

### Link Rules

* Flash / Qualify / Monetization Check → repoLink disabled
* Design / Build / Ship → repoLink allowed
* Only ONE repo link ever
* No multiple primary links

If a card requires more context → it belongs in the linked system.

---

## 8. Card UI Rules

Board View:

* One column per full screen
* Horizontal swipe between columns
* Cards displayed as single row
* Show: Title + color strip + small energy indicator

Tap Card:

* Opens modal
* Shows:

  * Primary link button
  * Repo link button (if available)
  * Current caption
  * Move Stage button
  * History toggle (collapsed by default)

---

## 9. Logging System (Mini Commit Model)

Every stage move:

* Auto-append log entry with timestamp

Every caption edit:

* Auto-append log entry

Log rules:

* Max 10 entries
* Oldest auto-trimmed
* No editing history
* Append only

Board shows no history unless modal opened.

---

## 10. WIP Limits

Oxygen: max 2
Build: max 3

Hard limit enforced.

No due dates.
No priorities.
Energy label replaces urgency anxiety.

---

## 11. Backup & Sync

Storage:

* localStorage only

Manual Sync:

* Export JSON button
* Import JSON button

No auto sync.
No accounts.
No backend.

Phone and laptop manually sync via JSON file.

---

## 12. Non-Goals (To Prevent Drift)

This system will NOT include:

* Notifications
* Reminders
* Collaboration
* Cloud sync
* AI features
* Metrics
* Progress bars
* Subtasks
* Nested boards

If feature increases complexity → reject.

---

## 13. Sunday Kill Sweep Ritual

Once per week:

* Flash older than 14 days → move or delete
* Research older than 14 days → move or delete
* Archive aggressively

Board must stay light.

---

## 14. Core Identity

This is not productivity optimization.

This is:

* A cognitive boundary system
* A monetization gatekeeper
* A mode-switching bridge
* A focus protection device

Phone = Discovery brain
Laptop = Execution brain

Build lane must remain sterile.
Monetization lane must remain honest.

---
