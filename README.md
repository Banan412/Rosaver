# RoSaver Tampermonkey script

`RoSaver.user.js` sends a selected Roblox item to a configured group experience, where Roblox displays its native confirmation prompt.

## Install

1. Open Tampermonkey's dashboard and choose **Utilities → Import from file**.
2. Select `RoSaver.user.js`, then install it.
3. On Roblox, open Tampermonkey and select **RoSaver: Settings**.
4. Save your group game's numeric place ID.

## Existing Studio scripts

Use the updated files in these locations:

- `server.lua` → `ServerScriptService`
- `local.lua` → the Studio test TextBox as a `LocalScript`
- `local2.lua` → the same existing location as before

Do not install `RobloxStudio/PurchasePrompt.server.lua` alongside `server.lua`; they perform the same launch handling and would cause duplicate prompts. The standalone file is retained only for projects that do not use the three existing scripts.

The Save button uses Roblox's `/games/start` direct-join URL, so it launches the configured place instead of stopping on the experience details page. The server waits for delayed launch data before prompting. It accepts the old comma-separated, `rosaver:v1`, `rosaver:v2`, and `rosaver:v3` formats as well as the current `rosaver:v4` format.

Current `rosaver:v4` links are launched in an invisible frame, leaving the Marketplace item page open. Each link has a one-time token recorded in Memory Store for five minutes, so reconnecting or rejoining with the same launch request cannot trigger another purchase prompt.

## Adaptive amount

The website reads the item's own Price row. For Roblox Plus, it keeps both the discounted amount the user pays and the crossed-out base price. Because Roblox subsidizes Plus discounts, the estimated experience-owner amount is calculated from the base price. Current `rosaver:v3` launch data carries both prices to the game.

- Eligible avatar Marketplace item: 40%
- Avatar bundle: 40%
- Original Limited sale: 40%; Limited resale availability and the final transaction are controlled by Roblox
- Cross-experience game pass: 0% affiliate saving

Roblox does not expose the current affiliate percentage through a public website or `MarketplaceService` API, so the script cannot discover policy changes automatically. The rules above match Roblox's published documentation as of July 2026. Roblox determines final eligibility, rounding, commissions, and pending-funds release dates.
