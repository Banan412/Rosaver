# RoSaver place template

This folder documents the Roblox Studio setup for a place that users publish to **their own group**. It is not a shared public experience and it should not be published over somebody else's game.

## Set up the place

1. Open Roblox Studio and create a new **Baseplate** experience.
2. Publish it to the group that should receive eligible experience-owner revenue.
3. In **Game Settings → Security**, enable **Allow Third Party Sales** when Roblox requires it for avatar-item sales.
4. In Explorer, create a Script under `ServerScriptService` named `RoSaverPurchaseHandler`.
5. Open [RoSaverPurchaseHandler.server.lua](RoSaverPurchaseHandler.server.lua), then paste its contents into that Script.
6. Publish the experience again.
7. In Creator Dashboard, copy the numeric ID of the experience's **start place**. Paste that ID into RoSaver’s Tampermonkey settings.

The Script reads the item information from Roblox launch data, waits for the player to join, and then calls Roblox's native purchase prompt. It also uses a short-lived one-time token, preventing the same launch request from prompting repeatedly after a disconnect or kick.

## Optional Studio test UI

`StudioTestInput.client.lua` and `StudioTestVisibility.client.lua` are optional Studio test helpers. They are not required for normal RoSaver use. Do not add them to a new place unless you are specifically building your own Studio-only test interface.

## Downloadable `.rbxl` template

[Download `rosaver place.rbxl`](../rosaver%20place.rbxl), open it in Studio, and select **File → Publish to Roblox As…**. Choose your own group and create a new experience.

Never overwrite an experience you do not own.
