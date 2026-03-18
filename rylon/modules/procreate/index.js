// modules/procreate/index.js
// ESM module — no 'use strict' (implicit in ESM)

// ─── session store ────────────────────────────────────────────────────────────
const store = {};

// ─── wizard steps ─────────────────────────────────────────────────────────────
export const STEPS = [
  { id:'name',       label:'Profile name',           type:'input',  store:'name' },
  { id:'primary',    label:'Primary language',        type:'single', store:'primaryLanguage',
    options:['TypeScript','Python','Rust','Go','JavaScript','C++','Kotlin','Swift'] },
  { id:'secondary',  label:'Secondary languages',     type:'multi',  store:'secondaryLanguages', max:3,
    options:['JavaScript','Python','Rust','Go','Bash','Java','C#','Dart','Elixir','Zig'] },
  { id:'frameworks', label:'Frameworks',              type:'multi',  store:'frameworks', max:4,
    options:['React','Next.js','Express','FastAPI','Django','Svelte','Astro','Vue','Tauri','Electron'] },
  { id:'tools',      label:'Dev tools',               type:'multi',  store:'tools', max:4,
    options:['Git','Docker','Kubernetes','VSCode','Neovim','JetBrains','Zsh','Tmux','Warp','Bun'] },
  { id:'philosophy', label:'Coding philosophy',       type:'single', store:'philosophy',
    options:['Minimalist','Performance first','Readability matters','Ship fast','Architecture obsessed','Experimental hacker'] },
  { id:'workStyle',  label:'Work style',              type:'single', store:'workStyle',
    options:['Solo builder','Open source contributor','Startup engineer','Systems architect','AI tinkerer','Fullstack generalist'] },
  { id:'email',      label:'Email',                   type:'input',  store:'email' },
  { id:'github',     label:'GitHub username',         type:'input',  store:'github' },
  { id:'tagline',    label:'Personal tagline',        type:'input',  store:'tagline' },
  { id:'beverage',   label:'Favorite dev beverage',   type:'single', store:'beverage',
    options:['Coffee','Espresso','Tea','Energy drinks','Water','Yerba mate'] },
  { id:'codingTime', label:'Coding time preference',  type:'single', store:'codingTime',
    options:['Early morning','Afternoon','Night owl','Midnight hacker','Whenever the code calls'] },
  { id:'terminal',   label:'Terminal theme vibe',     type:'single', store:'terminalTheme',
    options:['Cyberpunk','Minimal dark','Retro green','Solarized','Neon gradient','Monokai'] },
];

const FIELD_PICKER_STEP = {
  id:'__fieldpick__', label:'Which field to edit?',
  type:'single', store:'__fieldpick__',
  options: STEPS.map(s => s.label),
};

// ─── helpers ──────────────────────────────────────────────────────────────────
const ln = (type, text, extra = {}) => ({ type, text, ...extra });

const BAR  = '─'.repeat(36);
const BAR2 = '━'.repeat(36);

function sectionHead(label, C) {
  return ln('_section', label, { C });
}

function profileLines(p, C) {
  const arr = v => Array.isArray(v) && v.length ? v.join(', ') : (v || '—');
  return [
    ln('_bar2',''),
    sectionHead('IDENTITY', C),
    ln('_prow','',{ k:'Name',      v: p.name                            }),
    ln('_prow','',{ k:'Email',     v: p.email      || '—'               }),
    ln('_prow','',{ k:'GitHub',    v: p.github ? `@${p.github}` : '—'   }),
    ln('_prow','',{ k:'Tagline',   v: p.tagline    || '—'               }),
    ln('_bar',''),
    sectionHead('LANGUAGES', C),
    ln('_prow','',{ k:'Primary',   v: p.primaryLanguage        || '—'   }),
    ln('_prow','',{ k:'Secondary', v: arr(p.secondaryLanguages)          }),
    ln('_prow','',{ k:'Frameworks',v: arr(p.frameworks)                  }),
    ln('_bar',''),
    sectionHead('ENVIRONMENT', C),
    ln('_prow','',{ k:'Tools',     v: arr(p.tools)                      }),
    ln('_prow','',{ k:'Terminal',  v: p.terminalTheme          || '—'   }),
    ln('_prow','',{ k:'Hours',     v: p.codingTime             || '—'   }),
    ln('_bar',''),
    sectionHead('PERSONA', C),
    ln('_prow','',{ k:'Philosophy',v: p.philosophy             || '—'   }),
    ln('_prow','',{ k:'Work style',v: p.workStyle              || '—'   }),
    ln('_prow','',{ k:'Beverage',  v: p.beverage               || '—'   }),
    ln('_bar2',''),
  ];
}

function makeWizard(steps, seedAnswers = {}, onComplete) {
  return {
    steps,
    stepIdx:  0,
    answers:  { ...seedAnswers },
    selIdx:   0,
    onComplete,
  };
}

// ─── exported handle ──────────────────────────────────────────────────────────
export function handle(args, ctx) {
  const { C } = ctx;
  const sub        = (args[0] ?? '').toLowerCase();
  const profileArg = args.slice(1).join(' ').replace(/['"]/g, '').trim();
  const key        = profileArg.toLowerCase();

  if (sub === 'create') {
    return {
      action: 'WIZARD',
      lines: [
        ln('step', 'Initializing profile wizard'),
        ln('pipe', ''),
        ln('plain', 'input steps: type + ↵   ·   single: ↑↓ + ↵   ·   multi: ↑↓ + space + ↵'),
        ln('pipe', ''),
      ],
      wizard: makeWizard(STEPS, {}, 'save_create'),
    };
  }

  if (sub === 'list') {
    const keys = Object.keys(store);
    if (!keys.length) return { action:'PUSH', lines:[
      ln('plain', 'No profiles saved yet — use: procreate create'),
    ]};
    // Return special list-view action so main app can render scrollable list
    return {
      action: 'LIST',
      listType: 'profiles',
      items: keys.map(k => ({
        key: k,
        label: store[k].name,
        sub: `${store[k].primaryLanguage || '?'}  ·  ${store[k].philosophy || '?'}`,
      })),
    };
  }

  if (sub === 'call') {
    if (!profileArg) return { action:'PUSH', lines:[ ln('err','Usage: procreate call <name>') ]};
    const p = store[key];
    if (!p) return { action:'PUSH', lines:[
      ln('err', `Profile "${profileArg}" not found`),
      ln('plain', 'Use: procreate list'),
    ]};
    return { action:'PUSH', lines:[
      ln('step', `Profile · ${p.name}`), ln('pipe',''),
      ...profileLines(p, C),
    ]};
  }

  if (sub === 'delete') {
    if (!profileArg) return { action:'PUSH', lines:[ ln('err','Usage: procreate delete <name>') ]};
    if (!store[key])  return { action:'PUSH', lines:[ ln('err', `Profile "${profileArg}" not found`) ]};
    const name = store[key].name;
    delete store[key];
    return { action:'PUSH', lines:[ ln('ok', `Profile "${name}" removed`) ]};
  }

  if (sub === 'edit') {
    if (!profileArg) return { action:'PUSH', lines:[ ln('err','Usage: procreate edit <name>') ]};
    const p = store[key];
    if (!p) return { action:'PUSH', lines:[
      ln('err', `Profile "${profileArg}" not found`),
      ln('plain', 'Use: procreate list'),
    ]};
    return {
      action: 'WIZARD',
      lines: [
        ln('step', `Editing · ${p.name}`), ln('pipe',''),
        ln('plain', 'Select a field to update'), ln('pipe',''),
      ],
      wizard: makeWizard([FIELD_PICKER_STEP], { ...p }, `edit_pick:${key}`),
    };
  }

  if (!sub) return { action:'PUSH', lines:[
    ln('header','PROCREATE  v1.0.0'),
    ln('item','create', { suffix:'start profile wizard',     color:C.pink }),
    ln('item','list',   { suffix:'browse saved profiles',    color:C.pink }),
    ln('item','call',   { suffix:'display a profile',        color:C.pink }),
    ln('item','edit',   { suffix:'edit a saved profile',     color:C.pink }),
    ln('item','delete', { suffix:'remove a profile',         color:C.pink }),
  ]};

  return { action:'PUSH', lines:[
    ln('err', `Unknown procreate command: "${sub}"`),
    ln('plain','Commands: create · list · call <n> · edit <n> · delete <n>'),
  ]};
}

// ─── getProfile — called by main app for list-view profile display ─────────────
export function getProfile(key, C) {
  const p = store[key];
  if (!p) return null;
  return profileLines(p, C);
}

// ─── wizard completion ────────────────────────────────────────────────────────
export function onWizardComplete(answers, completionKey, C) {
  if (completionKey === 'save_create') {
    const name = (answers.name || 'unnamed').trim();
    store[name.toLowerCase()] = { ...answers };
    return { lines:[
      ln('ok', `Profile "${name}" saved`),
      ...profileLines(answers, C),
    ]};
  }

  if (completionKey?.startsWith('save_edit:')) {
    const k    = completionKey.slice('save_edit:'.length);
    const name = store[k]?.name ?? k;
    store[k]   = { ...answers };
    return { lines:[
      ln('ok', `Profile "${name}" updated`),
      ...profileLines(answers, C),
    ]};
  }

  if (completionKey?.startsWith('edit_pick:')) {
    const profileKey = completionKey.slice('edit_pick:'.length);
    const fieldLabel = answers.__fieldpick__;
    const targetStep = STEPS.find(s => s.label === fieldLabel);
    if (!targetStep) return { lines:[ ln('err','Field not found') ]};
    const profile = { ...answers };
    delete profile.__fieldpick__;
    return {
      followUpWizard: makeWizard([targetStep], profile, `save_edit:${profileKey}`),
      lines: [ ln('plain', `Editing: ${targetStep.label}`), ln('pipe','') ],
    };
  }

  return null;
}