// notes.txt — editable, persisted.
import { h } from '../util.js';
const DEF = '- clean desk (lol)\n- return BATON\'s call\n- stop being poor\n- buy more energy drinks\n- ship the thing\n- ask DUVE what he bought now\n- AIRDROP (crossed out. why.)';
export default {
  id: 'notes', title: 'notes.txt', width: 420, height: 360,
  create(ctx) {
    const el = h(`<div class="nt"><textarea spellcheck="false"></textarea><small class="nt-s">saved</small></div>`);
    const ta = el.querySelector('textarea'), s = el.querySelector('.nt-s');
    ta.value = ctx.store.get().notes ?? DEF;
    let t; ta.addEventListener('input', () => { s.textContent = 'editing…'; clearTimeout(t); t = setTimeout(() => { ctx.store.get().notes = ta.value; ctx.store.save(); s.textContent = 'saved'; }, 400); });
    return { el };
  },
};
