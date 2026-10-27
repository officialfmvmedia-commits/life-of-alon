// Chirpr content engine: fictional accounts, procedural feed, and a local
// keyword + sentiment aware reply generator. No network. Optional hook: window.CHIRPR_LLM.
import { mulberry, pick, rnd } from '../util.js';

export const ACCOUNTS = [
  ['gm gary', 'gm_gary'], ['degen mom', 'degenmom'], ['Big Wally 🐋', 'solwhale9000'], ['Chart Chad', 'chartchad'], ['Nana Bags', 'nanabags'],
  ['Mike (not the dev)', 'notthedev'], ['Exit Liquidity', 'exitliq'], ['BATON intern', 'baton_intern'], ['zen trader', 'zenmode'], ['lambo or ramen', 'lamboramen'],
  ['DUVE', 'duve_trades'], ['block0 sniper', 'block0'], ['Ponzi Pam', 'ponzipam'], ['Rug Ronnie', 'rugpull_ronnie'], ['ser vibes', 'servibes'],
  ['cope dealer', 'copedealer'], ['the bottom caller', 'bottomcaller'], ['anon accountant', 'anonaccountant'], ['pill enjoyer', 'pillenjoyer'], ['reply guy 3000', 'replyguy3000'],
  ['BATON Corporation', 'batoncorp'], ['HQ Pizza Guy', 'hqpizza'], ['fridge watcher', 'fridgewatch'], ['meme archivist', 'memearchive'], ['quiet whale', 'quietwhale'],
  ['bear market barry', 'bearbarry'], ['bullish brenda', 'bullishbrenda'], ['the intern\'s intern', 'internsintern'], ['sol sommelier', 'solsommelier'], ['candle whisperer', 'candlewhisper'],
].map(([name, handle]) => ({ name, handle, verified: ['batoncorp', 'solwhale9000', 'duve_trades'].includes(handle) }));
const H = () => pick(ACCOUNTS).handle;
// ANSEM: clearly-labeled in-game parody account. Lines are original, written in his cadence (notes/ansem-voice.md).
export const ANSEM_ACC = { name: 'ANSEM', handle: 'ansem_hq', verified: false, parody: true };
const ANSEM_FEED = [
  'coins look good',
  "never seen sentiment this bad in the HQ group chat. that's usually when it gets interesting",
  'look how ugly my charts were last week LMFAOOOOOO',
  'darkest before dawn. job not finished.',
  "attention is the leading indicator. watch what the HQ is talking about, not what it says it's buying",
  "compressed range on {coin}. quiet charts don't stay quiet forever",
  'how are the engineers at pump HQ doing this week',
  'DUVE really fist pumped at a 2% candle. love that guy',
  'prayer circle assemble',
  'we back on that unc energy',
  'solangeles 🌒 night shift at the HQ',
  "post the idea. be right or be wrong. post the next idea. that's the whole job",
  'never giving up on my birds 🦅',
  "traders as celebrities makes sense to me. RASMR is a celebrity now and he hasn't stood up in 3 days",
  'send the flood 🌊',
  'complacency.',
  'not financial advice. barely even advice. vibes 🫡',
];
const ANSEM_REPLY = {
  pos: ['massive', 'coins look good', "we're cooking", 'send the flood', 'alon been shipping at an insane pace fr', 'MASSIVE. job not finished tho'],
  neg: ['absolutely frigid take', 'LMFAOOOO', 'complacency.', 'darkest before dawn brother', 'gross pa'],
  neu: ['interesting. watching this', 'say more', 'thoughts on the chart?', "attention is the indicator. we'll see"],
};
const ANSEM_CELEB = ['ALON DELIVERED. WE ARE SO BACK', 'MASSIVE', "told y'all. darkest before dawn", 'send the flood 🌊🌊🌊', 'i was the loudest bull at the bottom', 'solangeles is LIT tonight 🌒🐂'];
export const ansemReply = (sent, r = Math.random) => pick(ANSEM_REPLY[sent === 'meme' ? 'pos' : sent] || ANSEM_REPLY.neu, r);
const COINS = ['$PILL', '$BATON', '$DUVE', '$HQ', '$COPIUM', '$SENDIT', '$PIZZA', '$AIRDROP', '$NOODLE', '$STOPPOOR'];

const FEED = [
  'gm. charts are green, coffee is black, conviction is unhinged',
  'bought the top again. at this point I am the top',
  'just saw @alon walk past the HQ fridge 4 times in 10 minutes. something big is coming',
  'airdrop when? asking for me',
  'my portfolio is a horror movie and I keep buying tickets',
  '{coin} chart looking like a staircase to heaven (or a cliff, hard to tell)',
  'BATON Corporation sent another poster to the HQ. we live in their world now',
  'DUVE has been "about to sell" since 6am',
  'every red candle is a discount if you believe hard enough',
  'pump HQ at 3am: 4 pizzas, 1 ping pong ball, 0 sleep',
  'if you are reading this you are early. to what? unclear',
  'stop being poor (said the tank top)',
  'launched a coin about my chair. it has more holders than my family group chat',
  'the bonding curve is my love language',
  'not financial advice but have you considered buying more',
  'just one more trade then I touch grass. trade #47',
  'who keeps eating the HQ pizza. show yourself',
  'my stop loss was a suggestion',
  'took profits. immediately regret. bought back higher. classic',
  'rate my strategy: buy high, sell low, cry in the middle',
  'the whiteboard says "AIRDROP" but someone crossed it out. what does it MEAN',
  'fees paid today could buy a small island. I bought a sandwich',
  '{coin} holders when the dev says "soon": 👁️👄👁️',
  'every time I check the chart it gets worse. so I check more often to fix it',
  'gm to everyone except the guy who sold at the bottom (me)',
  'BATON says pass it on. I passed on selling. now I pass out',
  'alon posted a single emoji and my bags pumped 12%. correlation? causation? vibes',
  'ser the pill is a lifestyle',
];

// ---------- sentiment ----------
const POS = ['gm', 'love', 'great', 'huge', 'moon', 'pump', 'bull', 'bullish', 'win', 'thanks', 'thank', 'excited', 'launch', 'live', 'ship', 'shipped', 'build', 'up', 'green', 'happy', 'lfg', 'free', 'gift', 'reward', 'airdrop', 'proud', 'best', 'new', 'soon', 'wagmi', 'send'];
const NEG = ['sorry', 'down', 'rug', 'scam', 'dump', 'bear', 'bearish', 'sad', 'hate', 'bad', 'red', 'loss', 'lost', 'fail', 'broke', 'delay', 'delayed', 'hack', 'exploit', 'paused', 'fee', 'fees', 'tax', 'cancel', 'never', 'no', 'not', 'rip', 'over', 'ngmi', 'sell', 'selling'];
export function sentiment(text) {
  const w = text.toLowerCase().match(/[a-z']+/g) || [];
  let s = 0; for (const x of w) { if (POS.includes(x)) s += 1; if (NEG.includes(x)) s -= 1; }
  if (/!{2,}|🚀|🔥|💚|lfg/i.test(text)) s += 1;
  if (/😭|💀|😡|🤡/.test(text)) s -= 1;
  return Math.max(-1, Math.min(1, s / 3));
}

// ---------- topics ----------
const TOPICS = {
  airdrop: { re: /air ?drop|claim|snapshot|eligib/i, pos: ['FINALLY. airdrop szn 🪂', 'I have never been more eligible in my life', 'snapshot already taken? I was born ready', 'airdrop me, I am begging (with dignity)', 'my wallet is open and so is my heart'], neg: ['let me guess, I missed the snapshot by 4 seconds', 'airdrop to farmers again? the real users get dust', 'if this is another points program I am logging off', 'airdrop when?? oh wait, it\'s here. still says ineligible 🤡'], neu: ['what are the criteria?', 'how do we check eligibility?', 'is there a claim link? (not clicking random links lol)', 'timeline?'] },
  fees: { re: /fee|fees|tax|charge|revenue|cost/i, pos: ['lower fees = more degen per degen. based', 'fees going where? if it\'s the pizza fund I support it', 'fair tbh, servers aren\'t free'], neg: ['fees on fees on fees. I pay rent to the bonding curve', 'raising fees in this economy??', 'my wallet just flinched', 'so THAT\'S where my money went'], neu: ['what\'s the new fee split?', 'do creators get a cut?', 'is this per trade or per launch?'] },
  launch: { re: /launch|live|ship|shipped|release|new feature|v2|update|out now|introduc/i, pos: ['shipped. absolute machine 🚀', 'HQ never sleeps. respect', 'the team cooked again', 'LFG, testing it now', 'this is the way'], neg: ['did anyone test this or', 'cool but can you fix the old stuff first', 'launching features while my bags are down 80%', 'another feature, still no airdrop'], neu: ['where can I try it?', 'docs?', 'is it on mobile too?', 'any changelog?'] },
  token: { re: /\$[a-z]+|token|coin|memecoin|ticker|ca\b|contract/i, pos: ['aped. no questions asked', 'chart is clean, vibes are cleaner', 'early to this one, screenshot it', 'bullish on whatever this is'], neg: ['ticker sounds like a rug but I\'m listening', 'dev wallet holds 40%. ok cool cool', 'I\'ll wait for the dip (it\'s me, I\'m the dip)'], neu: ['CA?', 'what chain', 'liquidity locked?', 'who is the dev'] },
  sorry: { re: /sorry|apolog|mistake|my bad|downtime|outage|issue|bug|we messed/i, pos: ['respect for owning it', 'mistakes happen, the vibes are still immaculate', 'apology accepted. airdrop also accepted'], neg: ['sorry doesn\'t refund my losses', 'this is the third "sorry" this month', 'we need a postmortem AND a pizza'], neu: ['what happened exactly?', 'is it fixed now?', 'any compensation?'] },
  gm: { re: /\bgm\b|good morning|gn\b|good night/i, pos: ['gm king', 'gm gm gm', 'gm, it\'s a beautiful day to be early', 'gm alon 🫡', 'gm. charts green. coffee strong.'], neg: ['gm is not a strategy', 'it\'s 3pm', 'gm to everyone but my portfolio'], neu: ['gm', 'gm 🌅', 'gm. what are we building today'] },
  rug: { re: /rug|scam|exit|honeypot|drain/i, pos: ['scammers fear the HQ', 'good, expose them'], neg: ['not again 😭', 'I was the exit liquidity wasn\'t I', 'every cycle, same story'], neu: ['receipts?', 'which wallet?', 'is it confirmed?'] },
  moon: { re: /moon|pump|ath|100x|1000x|send it|green/i, pos: ['🚀🚀🚀', 'we are SO back', 'ATH or nothing', 'up only (emotionally)', 'send it to the moon and keep the receipt'], neg: ['top signal', 'someone check if this is the top', 'every time alon says moon it dumps lol'], neu: ['how high we going', 'targets?'] },
  baton: { re: /baton/i, pos: ['BATON posters are honestly fire', 'pass it on 🏃‍♂️', 'BATON x pump HQ collab when'], neg: ['who even is BATON', 'BATON is a psyop', 'BATON keeps calling the HQ at 3am'], neu: ['what does BATON actually do?', 'BATON corporation? never heard of it (I have the poster)'] },
  duve: { re: /duve/i, pos: ['DUVE is the people\'s trader', 'free DUVE', 'DUVE has diamond hands (sweaty)'], neg: ['DUVE lost it all again didn\'t he', 'DUVE please log off'], neu: ['is DUVE ok', 'what did DUVE buy now'] },
  hiring: { re: /hiring|job|join|intern|team|career/i, pos: ['dream job', 'how do I apply, I can carry pizza boxes', 'join the HQ and never sleep again 😍'], neg: ['unpaid like the BATON intern?', 'do you offer dental or just ping pong'], neu: ['remote?', 'what roles?'] },
  poor: { re: /poor|broke|rich|money/i, pos: ['stop being poor 🫡', 'the tank top speaks the truth'], neg: ['easy for you to say', 'I tried, didn\'t work'], neu: ['how', 'step 1?'] },
};
const GEN = {
  pos: ['this is huge', 'based', 'W post', 'love to see it', 'wagmi', 'big if true', 'certified banger', 'facts', 'say less', 'alon never misses', 'goated'],
  neg: ['ratio', 'L take', 'nobody asked', 'touch grass alon', 'this ain\'t it', 'mid', 'you\'re cooked', 'unfollowing (I will not unfollow)', 'ngmi'],
  neu: ['interesting', 'thoughts?', 'context?', 'hmm', 'source?', 'bookmarked', 'explain like I\'m a degen', 'wait what'],
  meme: ['🫡', '👀', 'few understand', 'ser', 'this is the way', '📈📈📈', '💀', 'I\'m in this post and I don\'t like it', 'mom come pick me up', 'sir this is a wendy\'s', 'pill pilled', 'when lambo'],
};

export function detectTopics(text) { return Object.entries(TOPICS).filter(([, t]) => t.re.test(text)).map(([k]) => k); }

// Generate replies for a post. Returns [{name, handle, text, sent: 'pos'|'neg'|'neu'|'meme', delay}]
export function generateReplies(text, n = 10, seed = Date.now()) {
  const r = mulberry(seed);
  const s = sentiment(text), topics = detectTopics(text);
  const pPos = 0.38 + s * 0.28, pNeg = 0.22 - s * 0.14, pMeme = 0.16;
  const used = new Set(); const out = [];
  for (let i = 0; i < n; i++) {
    const x = r(); const sent = x < pPos ? 'pos' : x < pPos + pNeg ? 'neg' : x < pPos + pNeg + pMeme ? 'meme' : 'neu';
    let pool = [];
    if (sent !== 'meme' && topics.length && r() < 0.75) { const tp = TOPICS[pick(topics, r)]; pool = tp[sent] || []; }
    if (!pool.length) pool = GEN[sent];
    let txt = pick(pool, r), guard = 0;
    while (used.has(txt) && guard++ < 8) txt = pick(r() < 0.5 ? pool : GEN[sent], r);
    used.add(txt);
    if (r() < 0.15) txt = '@alon ' + txt;
    if (r() < 0.12 && sent === 'pos') txt += ' ' + pick(['🔥', '🚀', '💚', '🫡', '💯'], r);
    const acc = pick(ACCOUNTS.filter(a => a.handle !== 'alon'), r);
    out.push({ name: acc.name, handle: acc.handle, verified: acc.verified, text: txt, sent, delay: 600 + i * rnd(500, 1500, r) + r() * 800 });
  }
  // ANSEM drops in sometimes
  if (r() < 0.45 && out.length > 2) { const sent = s > 0.15 ? 'pos' : s < -0.15 ? 'neg' : (r() < 0.5 ? 'pos' : 'neu'); out.splice(1 + Math.floor(r() * 2), 0, { ...ANSEM_ACC, text: ansemReply(sent, r), sent, delay: 900 + r() * 2200 }); out.sort((a, b) => a.delay - b.delay); }
  return { replies: out, sentiment: s, topics };
}

// optional LLM hook: window.CHIRPR_LLM = async (postText) => [{ handle, name, text, sent }]
export async function maybeLLM(text) {
  if (typeof window.CHIRPR_LLM === 'function') { try { const res = await window.CHIRPR_LLM(text); if (Array.isArray(res) && res.length) return res; } catch { /* fall back */ } }
  return null;
}

export function feedPost(seed) {
  const r = mulberry('feed' + seed);
  const isA = seed % 4 === 1;
  const acc = isA ? ANSEM_ACC : pick(ACCOUNTS, r);
  const txt = pick(isA ? ANSEM_FEED : FEED, r).replace('{coin}', pick(COINS, r));
  const chart = r() < 0.18;
  return { id: 'f' + seed, name: acc.name, handle: acc.handle, verified: acc.verified, parody: !!acc.parody, text: txt, ts: Date.now() - (seed + 1) * rnd(60e3, 900e3, r), likes: Math.round(rnd(0, 4000, r) * r()), reposts: Math.round(rnd(0, 600, r) * r()), replies: Math.round(rnd(0, 300, r) * r()), views: Math.round(rnd(200, 90000, r)), chart, chartSeed: Math.floor(r() * 1e6) };
}
export const TRENDS = [['#AirdropWhen', '41.2K chirps'], ['$PILL', '18.9K chirps'], ['BATON Corporation', '9,412 chirps'], ['#StopBeingPoor', '7,110 chirps'], ['DUVE', '3,302 chirps'], ['HQ Pizza', '1,204 chirps']];

// ---------- celebration mode (after the airdrop is delivered) ----------
const CELEB_FEED = [
  "IT'S REAL. THE AIRDROP IS REAL. I'M SHAKING",
  'YEARS. I waited YEARS for this. we are SO back',
  'ALON DELIVERED. never doubted him (I doubted him every day)',
  'screenshot of my wallet before and after. I am crying in the HQ parking lot',
  'to everyone who said "airdrop never": I accept your apology in SOL',
  "I was a hater. I was wrong. I'm sorry alon. I love you alon",
  'woke up, checked wallet, screamed, woke up the neighbors, they also got the airdrop',
  'the whiteboard said AIRDROP crossed out. NOT ANYMORE 🟢',
  'my mom just asked what a bonding curve is. WE ARE SO BACK',
  "{n} years of 'airdrop when' and the answer was NOW",
  'DUVE is fist pumping so hard the HQ floor is shaking',
  'I replied "airdrop when?" 4,812 times. it worked. persistence pays',
  "not selling. framing the transaction and hanging it next to the BATON poster",
  'BATON Corporation called. they want to know how we did it',
  'gm to everyone. especially alon. ESPECIALLY alon',
  "they said it was a myth. they said it was cope. IT'S IN MY WALLET",
  'ordered 40 pizzas to the HQ. paid with airdrop money. no regrets',
  "I've been refreshing my wallet for 20 minutes. number keeps being big",
  "I'd like to formally apologize for my 2,000 reply guy posts. ALON DELIVERED",
  'airdrop szn is not a season. it is a lifestyle now',
  'just saw a grown man hug the HQ fridge. understandable',
  "this is the greatest day in chirpr history and I will not be taking questions",
];
const CELEB_REPLIES = [
  "IT'S REAL 😭😭😭", 'ALON DELIVERED', "WE'RE SO BACK", 'years of waiting. YEARS.', 'I am literally screaming', 'GOAT. no debate.',
  'I take back everything I ever said', 'never doubted you (I doubted you every day, I\'m sorry)', 'checking my wallet every 3 seconds',
  'my hands are shaking typing this', 'LFGGGGGGG 🚀🚀🚀', 'history. we are witnessing history', 'framing this post',
  'mom come look', 'the airdrop was real all along', 'I owe you a pizza. I owe you 40 pizzas', 'king behavior', 'number go up confirmed 📈',
  'retired at the HQ. see you never, day job', 'apology from a former hater: I was wrong. you were right.', 'this man said he would and he DID',
  'grown adults crying in the replies and I am one of them', 'I can finally afford the tank top', 'stop being poor achieved ✅',
  'airdrop when? AIRDROP NOW', 'my wallet looks like a phone number', 'ok who has the screenshot of the 2 years of "soon" tweets', '🪂🪂🪂🪂',
];
const CELEB_MEME = ['🫡', '📈📈📈📈', '😭🙏', 'we made it', 'pill pilled forever', 'few understood. now everyone understands', '🪂', 'ser.', 'WAGMI (we actually did)'];
export const CELEB_TRENDS = [['#AirdropDelivered', '2.1M chirps'], ['ALON DELIVERED', '988K chirps'], ['#WeAreSoBack', '612K chirps'], ['$PILL', '410K chirps'], ['DUVE fist pump', '88K chirps'], ['Former haters', '41K chirps']];

export function celebFeedPost(seed) {
  const r = mulberry('celeb' + seed);
  const isA = seed % 5 === 2;
  const acc = isA ? ANSEM_ACC : pick(ACCOUNTS, r);
  const txt = isA ? pick(ANSEM_CELEB, r) : pick(CELEB_FEED, r).replace('{n}', 2 + Math.floor(r() * 3));
  const shot = r() < 0.32; const from = +(rnd(0.3, 40, r)).toFixed(2), mult = Math.round(rnd(20, 200, r));
  return { id: 'c' + seed, name: acc.name, handle: acc.handle, verified: acc.verified, parody: !!acc.parody, text: txt, ts: Date.now() - (seed + 1) * rnd(8e3, 120e3, r), likes: Math.round(rnd(800, 90000, r)), reposts: Math.round(rnd(200, 22000, r)), replies: Math.round(rnd(60, 6000, r)), views: Math.round(rnd(20000, 2.4e6, r)), balShot: shot ? { from, to: +(from * mult).toFixed(2), mult } : null };
}
export function generateCelebReplies(text, n = 14, seed = Date.now()) {
  const r = mulberry(seed); const out = []; const used = new Set();
  for (let i = 0; i < n; i++) {
    const x = r(); const sent = x < 0.8 ? 'pos' : x < 0.95 ? 'meme' : 'neu';
    const pool = sent === 'pos' ? CELEB_REPLIES : sent === 'meme' ? CELEB_MEME : ['wait is this real?? checking… IT IS', 'ok I checked. it\'s real. WE\'RE SO BACK'];
    let txt = pick(pool, r), g = 0; while (used.has(txt) && g++ < 10) txt = pick(pool, r); used.add(txt);
    if (r() < 0.25) txt = txt.toUpperCase();
    if (r() < 0.2) txt = '@alon ' + txt;
    const acc = pick(ACCOUNTS, r);
    out.push({ name: acc.name, handle: acc.handle, verified: acc.verified, text: txt, sent, delay: 350 + i * rnd(250, 750, r) });
  }
  if (r() < 0.5) out.splice(2, 0, { ...ANSEM_ACC, text: pick(ANSEM_CELEB, r), sent: 'pos', delay: 700 + r() * 1500 });
  return { replies: out, sentiment: 1, topics: ['airdrop', 'delivered', ...detectTopics(text).filter(t => t !== 'airdrop')] };
}
