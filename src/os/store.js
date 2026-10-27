// Persistent in-game state (localStorage). Pure simulation; nothing leaves the browser.
const KEY = 'loa-os-v1';
const defaults = () => ({ wallet: { balance: 0.42, txs: [] }, traders: {}, chirpr: { posts: [] }, notes: null, airdropDelivered: false, airdrop: null, earnings: null, prefs: { full: false, wallpaper: 0 } });
let state;
try { state = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { state = defaults(); }
export const store = {
  get: () => state,
  save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota */ } },
  reset() { state = defaults(); this.save(); },
};
