# Nectar backend (Google Apps Script)

Turns on family sync, AI recipe/Magic Add, and Google Calendar sync in the installed Nectar app.

1. Go to script.google.com → **New project**, paste `Code.gs`.
2. **Project Settings → Script properties**:
   - `FAMILY_KEY` — a secret phrase your family types into Nectar
   - `ANTHROPIC_API_KEY` — your Claude API key from console.anthropic.com
   - `CALENDAR_IDS` — optional, comma-separated; blank = all your calendars
3. **Deploy → New deployment → Web app** · Execute as **Me** · Who has access **Anyone** → copy the `/exec` URL.
4. Open Nectar → ⚙ Settings → paste the URL and family key → Save.

State is stored in a `nectar-state.json` file in your Drive. Calendar events come from the account that deployed the script.
