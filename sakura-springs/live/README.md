# Sakura Springs live art

Every copy of the game (itch.io and the full-screen app) checks `art.json` when it opens and about once a minute while it's open.

## Replace art for everyone
1. Upload your image (PNG/WebP/JPG with transparency where needed) into this `live/` folder on GitHub: **Add file → Upload files**.
2. Edit `art.json` and point a scene part or a decoration at the file name, then change `version` to anything new (e.g. today's date + a number).

```json
{
  "version": "2026-11-28-1",
  "scenes": {
    "sakura": { "bg": "sakura-garden-v2.webp", "stall": "new-stall.png" }
  },
  "decorations": { "torii": "torii-red-v2.png" }
}
```

Scene parts: `bg` (full background), `stall` (food/tea stall), `bath` (hot spring), `tree`, `table`.
Decoration keys are the item ids from the Garden Decor Pack file names (e.g. `stoneLamp`, `teaPavilion`, `koiPond`).

Remove a line to go back to the built-in art. Players see changes within about a minute (GitHub publish time + next check).

Admin tools inside the game: open it once with `?admin=hikari` at the end of the address; `?admin=off` hides them again. Those in-game uploads only affect your own device.
