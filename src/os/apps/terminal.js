// pump terminal: a tiny fake shell with fun commands.
import { h, esc, fmtSOL, shortAddr } from '../util.js';
import { ALON_ADDR, M, TRADERS, traderState, TOKENS } from '../sim.js';

const HELP = `commands:
  help         this list            whoami     who are you
  balance      Alon's wallet         traders    top wallets (sim)
  tokens       top tokens (sim)      neofetch   system info
  open <app>   chirpr|pumpfun|wallet|notes|settings
  airdrop      check eligibility     gm         gm
  fortune      wisdom               clear      clear screen
  exit         stand up`;
export default {
  id: 'terminal', title: 'pump terminal', width: 640, height: 400,
  create(ctx) {
    const el = h(`<div class="tm"><div class="tm-out"></div><div class="tm-line"><span class="tm-ps">alon@hq:~$</span><input class="tm-in" spellcheck="false" autocomplete="off"></div></div>`);
    const out = el.querySelector('.tm-out'), inp = el.querySelector('.tm-in');
    const hist = []; let hi = 0;
    const print = (t, cls = '') => { out.appendChild(h(`<pre class="${cls}">${esc(t)}</pre>`)); el.scrollTop = el.scrollHeight; };
    print('alonOS 4.20 (pump-hq tty1)\n[ok] coffee level ........ critical\n[ok] pizza reserves ...... 2 slices (cold)\ntype "help" for commands', 'dim');
    const C = {
      help: () => print(HELP),
      whoami: () => print('alon — resident of the HQ. stop being poor.'),
      balance: () => { const b = ctx.store.get().wallet.balance; print(`${fmtSOL(b)}  (~$${(b * M.solPrice).toFixed(2)} simulated)\naddr ${ALON_ADDR}`); },
      traders: () => print(TRADERS.map(t => { const s = traderState(t); return `${t.name.padEnd(16)} ${shortAddr(t.addr)}  ${s.drained ? 'DRAINED' : fmtSOL(s.balance)}`; }).join('\n')),
      tokens: () => print([...TOKENS].sort((a, b) => b.mc - a.mc).slice(0, 8).map(t => `$${t.t.padEnd(10)} mc $${Math.round(t.mc).toLocaleString()}`).join('\n')),
      neofetch: () => print(`   ▄▄▄▄▄       alon@hq\n  ██▓▓░░█      -------\n ██▓▓▓░░░█     OS: alonOS 4.20 (pill edition)\n ██▓▓▓░░░█     Host: pump HQ desk #1\n  ██▓▓░░█      Shell: copium 2.1\n   ▀▀▀▀▀       Uptime: since it was early\n               Memory: 2 slices of pizza / 3`, 'green'),
      airdrop: () => { if (ctx.store.get().airdropDelivered) { const a = ctx.store.get().airdrop; return print(`🪂 AIRDROP DELIVERED. ${a.total.toFixed(2)} SOL to ${a.wallets} wallets (simulated). we are so back.`, 'green'); } print('checking eligibility', 'dim'); let n = 0; const iv = setInterval(() => { out.lastChild.textContent += '.'; if (++n > 5) { clearInterval(iv); print('result: still crossed out on the whiteboard. (psst: PumpFun HQ has a button.)', 'warn'); } }, 260); },
      gm: () => print('gm ☀'),
      fortune: () => print(['the bonding curve giveth.', 'every red candle is a lesson. you have learned nothing.', 'pass the BATON.', 'the fridge knows.', 'touch grass, then buy the dip.'][Math.floor(Math.random() * 5)]),
      clear: () => { out.innerHTML = ''; },
      exit: () => ctx.os.opts.onStandUp?.(),
      sudo: () => print('nice try.', 'warn'),
    };
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const v = inp.value.trim(); inp.value = ''; print('alon@hq:~$ ' + v, 'cmd'); if (!v) return; hist.push(v); hi = hist.length;
        const [c, ...a] = v.split(/\s+/);
        if (c === 'open') { a[0] && ctx.open(a[0]); return; }
        (C[c] || (() => print(`command not found: ${c}`, 'warn')))(a);
      } else if (e.key === 'ArrowUp') { hi = Math.max(0, hi - 1); inp.value = hist[hi] || ''; e.preventDefault(); }
      else if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; e.preventDefault(); }
    });
    el.addEventListener('click', () => inp.focus());
    return { el, onShow: () => setTimeout(() => inp.focus(), 50) };
  },
};
