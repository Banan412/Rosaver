# RoSaver

RoSaver is a Tampermonkey helper for eligible Roblox Marketplace avatar-item purchases. It sends the selected item to an experience you control, where Roblox displays its own native purchase prompt.

> RoSaver does not bypass Roblox checkout, create Robux, or guarantee a payout. Roblox determines whether a transaction is eligible and the final amount.

## What is supported

| Item type | RoSaver action | Estimated experience-owner share |
| --- | --- | --- |
| Avatar Marketplace item | Opens your configured experience | 40% |
| Avatar bundle | Opens your configured experience | 40% |
| Limited avatar item | Opens your configured experience when Roblox allows the sale | 40% on eligible sales |
| Game pass / developer product from another experience | Blocked | Not supported |

Roblox Plus discounts are handled separately: the buyer sees their discounted price, while Roblox subsidizes eligible Plus discounts. RoSaver shows the discounted and base prices when both are available.

## Install the userscript

1. Install the [Tampermonkey browser extension](https://www.tampermonkey.net/).
2. Download `RoSaver.user.js` from this repository and install it in Tampermonkey.
3. On Roblox, open the Tampermonkey menu and select **RoSaver: Settings**.
4. Enter the numeric **start place ID** for your own group-owned experience.
5. Open an eligible Marketplace item. The RoSaver card appears at the lower-right of the page.
6. Select **Save R$…**. Roblox joins the configured experience and shows its native purchase confirmation there.

RoSaver keeps the Marketplace page open while starting Roblox. Each launch request is one-use, so reconnecting after a kick or leaving does not show the same prompt again.

## Create your own place

Do not reuse somebody else's experience. Create and publish your own group-owned experience, then configure its start-place ID in RoSaver.

Follow the [place template guide](place-template/README.md) to set it up in Roblox Studio and publish it to your group.

## Download the place template

[Download `rosaver place.rbxl`](./rosaver%20place.rbxl), open it in Roblox Studio, then select **File → Publish to Roblox As…** and create a new experience owned by your own group. Do not publish over an existing experience you do not own.

The place-template source uses descriptive Studio-ready names such as `RoSaverPurchaseHandler.server.lua`. Follow the locations in the guide rather than copying files into Studio by their repository path.

## Publish a downloadable place template

The included [`rosaver place.rbxl`](./rosaver%20place.rbxl) is the current place template. For future releases, repository maintainers can also provide a one-file template download:

1. In Roblox Studio, select **File → Save to File** and export the finished place as `RoSaverPlaceTemplate.rbxl`.
2. Create a GitHub Release and attach that `.rbxl` file.
3. Add the release link to the [place template guide](place-template/README.md).

Users should always publish a downloaded template as a new experience owned by their own group before using it.

## Requirements and notes

- The configured place must be published, public, and accessible to the purchasing account.
- Enable **Allow Third Party Sales** in the experience settings when required for avatar-item sales.
- Game passes from another experience are intentionally disabled in RoSaver. Roblox discontinued cross-experience pass and developer-product sales in 2026.
- Roblox can change Marketplace eligibility, prices, fees, payout timing, or policy at any time.

## License

Add a license before publishing this repository if you want others to reuse or modify the project.
