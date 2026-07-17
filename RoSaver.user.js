// ==UserScript==
// @name         RoSaver – purchase eligibility helper
// @namespace    https://www.roblox.com/
// @version      1.7.0
// @description  Sends a selected Roblox item to your game, where Roblox can show its native purchase prompt.
// @author       @Banan412 on github, @banana_2137 on discord
// @match        https://www.roblox.com/*
// @match        https://web.roblox.com/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// @grant        GM.openInTab
// ==/UserScript==

(async () => {
  'use strict';

  const PLACE_ID_KEY = 'rosaver-place-id';
  const styleId = 'rosaver-styles';
  const panelId = 'rosaver-panel';
  const badgeClass = 'rosaver-cashback-badge';
  const saveClass = 'rosaver-save-action';
  const cardId = 'rosaver-purchase-card';
  const launcherId = 'rosaver-hidden-launcher';
  const detailsCache = new Map();
  let renderRevision = 0;
  let launchInProgress = false;
  const COMMISSION_RULES = Object.freeze({
    // Roblox does not expose an API that returns the affiliate percentage.
    // These values mirror its published rules as of July 2026.
    asset: { rate: 0.40, supported: true },
    gamepass: { rate: 0, supported: false },
    bundle: { rate: 0.40, supported: true },
  });

  const getPlaceId = () => GM.getValue(PLACE_ID_KEY, '');
  const setPlaceId = (placeId) => GM.setValue(PLACE_ID_KEY, placeId);

  function injectStyles() {
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .rosaver-cashback-badge { margin-left: 6px; font-size: .95em; vertical-align: middle; }
      .${saveClass} { display:inline-flex; align-items:center; gap:7px; margin:10px 0; padding:9px 12px; border:0; border-radius:7px; color:#fff; background:#1f8b4c; cursor:pointer; font:700 14px Arial,sans-serif; }
      .${saveClass}:hover { background:#18763f; } .${saveClass}:disabled { cursor:not-allowed; background:#52606f; }
      .${saveClass}.rs-no-saving { background:#52606f; }
      #${cardId} { position:fixed; z-index:2147483646; right:20px; bottom:20px; width:min(330px,calc(100vw - 32px)); padding:15px;
        color:#f7f9fc; background:#151a22; border:1px solid #3b4656; border-radius:12px; box-shadow:0 12px 36px rgba(0,0,0,.4); font:14px/1.4 Arial,sans-serif; }
      #${cardId} .rs-card-title { margin:0 0 4px; font-size:16px; font-weight:700; }
      #${cardId} .rs-card-detail { margin:0; color:#bac4d1; }
      #${cardId} .${saveClass} { width:100%; justify-content:center; margin:12px 0 0; }
      #${launcherId} { display:none !important; width:0; height:0; border:0; visibility:hidden; }
      #${panelId} { position: fixed; z-index: 2147483647; top: 20px; right: 20px; width: min(390px, calc(100vw - 32px));
        color: #f7f9fc; background: #151a22; border: 1px solid #3b4656; border-radius: 12px;
        box-shadow: 0 16px 48px rgba(0,0,0,.42); font: 14px/1.45 Arial, sans-serif; }
      #${panelId} * { box-sizing: border-box; }
      #${panelId} .rs-head { display:flex; align-items:center; justify-content:space-between; padding:16px 18px 12px; }
      #${panelId} h2 { margin:0; font-size:17px; } #${panelId} .rs-close { border:0; background:none; color:#aeb8c6; cursor:pointer; font-size:24px; }
      #${panelId} .rs-body { padding: 0 18px 18px; } #${panelId} label { display:block; margin:0 0 6px; font-weight:700; }
      #${panelId} input { width:100%; padding:10px 11px; color:#f7f9fc; background:#0d1117; border:1px solid #4a5668; border-radius:7px; font:inherit; }
      #${panelId} .rs-actions { display:flex; gap:8px; margin-top:12px; } #${panelId} button.rs-primary, #${panelId} button.rs-secondary { padding:9px 12px; border-radius:7px; cursor:pointer; font-weight:700; }
      #${panelId} button.rs-primary { border:0; color:white; background:#1f8b4c; } #${panelId} button.rs-secondary { color:#e8edf4; background:#283342; border:1px solid #4a5668; }
      #${panelId} .rs-status { min-height:20px; margin:10px 0 0; color:#b8f5ce; } #${panelId} .rs-note { margin:16px 0 0; padding-top:13px; border-top:1px solid #303b49; color:#bac4d1; font-size:12px; }
      #${panelId} a { color:#7ebcff; }
    `;
    document.head.append(style);
  }

  async function openSettings() {
    injectStyles();
    document.getElementById(panelId)?.remove();
    const currentPlaceId = await getPlaceId();
    const panel = document.createElement('aside');
    panel.id = panelId;
    panel.innerHTML = `
      <div class="rs-head"><h2>RoSaver settings</h2><button class="rs-close" aria-label="Close">×</button></div>
      <div class="rs-body">
        <label for="rs-place-id">Your group game place ID</label>
        <input id="rs-place-id" inputmode="numeric" autocomplete="off" placeholder="e.g. 123456789" value="${escapeHtml(currentPlaceId)}">
        <div class="rs-actions"><button class="rs-primary">Save</button><button class="rs-secondary" ${currentPlaceId ? '' : 'disabled'}>Open game</button></div>
        <div class="rs-status" role="status">${currentPlaceId ? `Saved place ID: ${escapeHtml(currentPlaceId)}` : 'No place ID saved yet.'}</div>
        <p class="rs-note">The Save button opens this game with the item ID. The updated server.lua shows Roblox's purchase prompt after joining. Any commission, eligibility, holding period, or payout is controlled by Roblox.</p>
      </div>`;
    document.body.append(panel);
    const input = panel.querySelector('#rs-place-id');
    const status = panel.querySelector('.rs-status');
    const open = panel.querySelector('.rs-secondary');
    panel.querySelector('.rs-close').addEventListener('click', () => panel.remove());
    panel.querySelector('.rs-primary').addEventListener('click', async () => {
      const value = input.value.trim();
      if (!/^\d{3,20}$/.test(value)) { status.textContent = 'Enter a valid numeric Roblox place ID.'; status.style.color = '#ffb5b5'; return; }
      await setPlaceId(value);
      status.textContent = `Saved place ID: ${value}`; status.style.color = '#b8f5ce'; open.disabled = false;
      markPrices();
    });
    open.addEventListener('click', async () => {
      const value = (await getPlaceId()).trim();
      if (value) GM.openInTab(`https://www.roblox.com/games/${encodeURIComponent(value)}`, { active: true, insert: true });
    });
  }

  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]); }

  function getItem() {
    const path = location.pathname;
    const gamePass = path.match(/\/game-pass\/(\d+)/i);
    if (gamePass) return { id: gamePass[1], type: 'gamepass' };
    const bundle = path.match(/\/bundles?\/(\d+)/i);
    if (bundle) return { id: bundle[1], type: 'bundle' };
    const asset = path.match(/\/(?:catalog|library|marketplace\/(?:asset|item))\/(\d+)/i)?.[1]
      || new URLSearchParams(location.search).get('assetId')
      || new URLSearchParams(location.search).get('productId');
    return asset && /^\d+$/.test(asset) ? { id: asset, type: 'asset' } : null;
  }

  function getPagePricing() {
    // Roblox puts the active Plus price first and the crossed-out base price
    // second in the item's own Price row. Never scan the navbar/global page for
    // loose numbers, since that can pick up the user's Robux balance.
    const labels = [...document.querySelectorAll('span, div, p')].filter(node =>
      !node.children.length && /^price\s*:?$/i.test((node.textContent || '').trim())
    );

    for (const label of labels) {
      let row = label.parentElement;
      for (let level = 0; row && level < 4; level += 1, row = row.parentElement) {
        if (row.closest(`#${panelId}, #${cardId}`)) break;
        const text = row.innerText || row.textContent || '';
        const afterPrice = text.split(/price\s*:?/i)[1] || '';
        const values = [...afterPrice.matchAll(/\b([\d][\d,]*)\b/g)]
          .map(match => Number(match[1].replaceAll(',', '')))
          .filter(Number.isFinite);
        if (values.length) {
          const payPrice = values[0];
          const basePrice = values.length > 1 ? Math.max(payPrice, values[1]) : payPrice;
          return { payPrice, basePrice, discounted: basePrice > payPrice };
        }
        if (/\bfree\b/i.test(afterPrice)) return { payPrice: 0, basePrice: 0, discounted: false };
      }
    }
    return null;
  }

  async function getCatalogDetails(item) {
    const key = `${item.type}:${item.id}`;
    if (detailsCache.has(key)) return detailsCache.get(key);
    const request = (async () => {
      try {
        if (item.type === 'bundle') {
          const response = await fetch(`https://catalog.roblox.com/v1/bundles/${encodeURIComponent(item.id)}/details`, { credentials: 'include' });
          if (!response.ok) return null;
          const result = await response.json();
          return String(result?.id) === String(item.id) ? result : null;
        }
        if (item.type !== 'asset') return null;
        const response = await fetch('https://catalog.roblox.com/v1/catalog/items/details', {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [{ itemType: 'Asset', id: Number(item.id) }] }),
        });
        if (!response.ok) return null;
        const result = await response.json();
        const detail = result.data?.[0] || null;
        return String(detail?.id) === String(item.id) ? detail : null;
      } catch {
        return null;
      }
    })();
    detailsCache.set(key, request);
    return request;
  }

  function priceFromDetails(details) {
    const values = [details?.price, details?.lowestPrice, details?.lowestResalePrice, details?.product?.priceInRobux];
    return values.find(value => Number.isFinite(value) && value >= 0) ?? null;
  }

  function isLimited(details) {
    const restrictions = details?.itemRestrictions || details?.itemStatus || [];
    return Array.isArray(restrictions) && restrictions.some(value => /limited/i.test(String(value)));
  }

  function makeLaunchToken() {
    if (globalThis.crypto?.getRandomValues) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return [...bytes].map(value => value.toString(36).padStart(2, '0')).join('');
    }
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  }

  async function sendItemToGame(item, payPrice, basePrice) {
    if (launchInProgress) return;
    const placeId = (await getPlaceId()).trim();
    if (!placeId) { openSettings(); return; }
    launchInProgress = true;
    markPrices();
    // The token allows the game to accept this launch once only, even if the
    // client tries to reconnect after leaving or being kicked.
    const launchData = `rosaver:v4:${item.type}:${item.id}:${Math.max(0, Math.floor(payPrice || 0))}:${Math.max(0, Math.floor(basePrice || payPrice || 0))}:${makeLaunchToken()}`;
    const directJoinUrl = `https://www.roblox.com/games/start?placeId=${encodeURIComponent(placeId)}&launchData=${encodeURIComponent(launchData)}`;
    document.getElementById(launcherId)?.remove();
    // Start Roblox in an invisible frame so the Marketplace tab stays on the
    // item page instead of navigating to the game's landing page.
    const launcher = document.createElement('iframe');
    launcher.id = launcherId;
    launcher.name = launcherId;
    launcher.setAttribute('aria-hidden', 'true');
    launcher.src = directJoinUrl;
    document.body.append(launcher);
    window.setTimeout(() => {
      launcher.remove();
      launchInProgress = false;
      markPrices();
    }, 15000);
  }

  async function markPrices() {
    const revision = ++renderRevision;
    const placeId = await getPlaceId();
    document.querySelectorAll(`.${badgeClass}, .${saveClass}, #${cardId}`).forEach(element => element.remove());
    const item = getItem();
    if (!item || !isItemPage()) return;
    const pagePricing = getPagePricing();
    const details = await getCatalogDetails(item);
    if (revision !== renderRevision || item.id !== getItem()?.id) return;
    const catalogPrice = priceFromDetails(details);
    const payPrice = pagePricing?.payPrice ?? catalogPrice;
    const basePrice = pagePricing?.basePrice ?? catalogPrice;
    const rule = COMMISSION_RULES[item.type];
    const amount = basePrice === null ? null : Math.floor(basePrice * rule.rate);
    const card = document.createElement('aside');
    card.id = cardId;
    const title = document.createElement('p');
    title.className = 'rs-card-title';
    title.textContent = rule.supported ? '💰 RoSaver purchase' : '⚠️ RoSaver purchase';
    const detail = document.createElement('p');
    detail.className = 'rs-card-detail';
    if (!placeId) detail.textContent = 'Set your group game place ID to use Save.';
    else if (!rule.supported) detail.textContent = item.type === 'gamepass'
      ? 'Game passes cannot be cross-sold and do not have an affiliate return.'
      : 'This item type has no current cross-experience affiliate saving.';
    else if (amount === null) detail.textContent = `${isLimited(details) ? 'Limited item. ' : ''}Eligible type; Roblox will show the final price in game.`;
    else if (pagePricing?.discounted) detail.textContent = `Plus price: R$${payPrice.toLocaleString()} · base: R$${basePrice.toLocaleString()} · estimated affiliate: R$${amount.toLocaleString()}.`;
    else detail.textContent = `${isLimited(details) ? 'Limited item · ' : ''}price R$${payPrice.toLocaleString()} · estimated ${(rule.rate * 100).toFixed(0)}% affiliate: R$${amount.toLocaleString()}.`;
    const save = document.createElement('button');
    save.className = saveClass;
    save.type = 'button';
    save.textContent = launchInProgress ? 'Launching Roblox…' : !rule.supported
      ? 'Not supported'
      : !placeId ? 'Configure RoSaver'
      : (amount === null ? 'Buy in game' : `Save R$${amount.toLocaleString()}`);
    save.classList.toggle('rs-no-saving', !rule.supported);
    save.disabled = launchInProgress || !rule.supported;
    if (!launchInProgress && rule.supported) {
      save.addEventListener('click', () => placeId ? sendItemToGame(item, payPrice ?? 0, basePrice ?? payPrice ?? 0) : openSettings());
    }
    card.append(title, detail, save);
    document.body.append(card);
  }

  function isItemPage() {
    return /\/(catalog|marketplace|game-pass|library|bundles?)\//i.test(location.pathname) || /\b(assetId|productId)=\d+/i.test(location.search);
  }

  GM.registerMenuCommand('RoSaver: Settings', openSettings);
  GM.registerMenuCommand('RoSaver: Open saved game', async () => {
    const placeId = (await getPlaceId()).trim();
    if (placeId) GM.openInTab(`https://www.roblox.com/games/${encodeURIComponent(placeId)}`, { active: true, insert: true });
    else openSettings();
  });

  injectStyles();
  markPrices();
  let refreshQueued = false;
  new MutationObserver(records => {
    const hasRobloxChange = records.some(record => [...record.addedNodes].some(node => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent.trim().length > 0;
      if (node.nodeType !== Node.ELEMENT_NODE) return false;
      const ownUi = `#${panelId}, #${cardId}, #${launcherId}, .${badgeClass}, .${saveClass}`;
      return !node.matches(ownUi) && !node.closest(ownUi);
    }));
    if (!hasRobloxChange) return;
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(() => { refreshQueued = false; markPrices(); });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
