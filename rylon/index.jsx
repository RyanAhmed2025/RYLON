#!/usr/bin/env node
process.stdout.write('\x1b[?1049h\x1b[2J\x1b[H');
process.on('exit', () => process.stdout.write('\x1b[?1049l'));

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

function scanModules() {
  const dir = join(__dirname, 'modules');
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => {
        const meta = join(dir, d.name, 'module.json');
        if (existsSync(meta)) { try { return JSON.parse(readFileSync(meta,'utf8')); } catch {} }
        return { name:d.name, desc:`${d.name} module`, version:'1.0.0', status:'installed', commands:[] };
      });
  } catch { return []; }
}

const useStdoutDimensions = () => {
  const [dim, setDim] = useState({ columns:process.stdout.columns||80, rows:process.stdout.rows||24 });
  const prev = useRef({ columns:dim.columns, rows:dim.rows });
  useEffect(() => {
    const id = setInterval(() => {
      const c=process.stdout.columns, r=process.stdout.rows;
      if (c!==prev.current.columns||r!==prev.current.rows) {
        prev.current={columns:c,rows:r};
        process.stdout.write('\x1b[2J\x1b[H');
        setDim({columns:c,rows:r});
      }
    },120);
    return ()=>clearInterval(id);
  },[]);
  return dim;
};

// ─── palette ──────────────────────────────────────────────────────────────────
const C = {
  cyan:'#00f5ff', violet:'#bf5fff', pink:'#ff3daf',
  amber:'#ff9500', mint:'#00ffcc', err:'#ff3d6b',
  text:'#ccdaff', sub:'#4a5878', muted:'#22283c',
  border:'#121929', borderMid:'#1c2840', white:'#DDDDDD',
};
const LOGO_COLORS=['#00aaff','#5577ff','#8855ff','#aa44ff','#cc33ff','#ff3daf'];
const HDR_CHARS  =['►','R','Y','L','O','N'];
const HDR_COLORS =['#00aaff','#5577ff','#8855ff','#aa44ff','#cc33ff','#ff3daf'];
const LOGO=[
  '  ██████╗ ██╗   ██╗██╗      ██████╗ ███╗  ██╗',
  '  ██╔══██╗╚██╗ ██╔╝██║     ██╔═══██╗████╗ ██║',
  '  ██████╔╝ ╚████╔╝ ██║     ██║   ██║██╔██╗██║',
  '  ██╔══██╗  ╚██╔╝  ██║     ██║   ██║██║╚████║',
  '  ██║  ██║   ██║   ███████╗╚██████╔╝██║ ╚███║',
  '  ╚═╝  ╚═╝   ╚═╝   ╚══════╝ ╚═════╝ ╚═╝  ╚══╝',
];
const mk=(type,text,extra={})=>({type,text,...extra});
const Sym={step:'◆',pipe:'│',item:'■',ok:'✓',err:'✖',arrow:'▸',sel:'›',dot:'·',check:'▪',empty:'▫'};

// ─── OutputLine — handles all line types including new profile types ───────────
const OutputLine = ({ line }) => {
  switch(line.type) {
    case 'header':   return <Box marginTop={1}><Text color={C.mint} bold>{line.text}</Text></Box>;
    case '_section': return (
      <Box marginTop={1}>
        <Text color={C.cyan} bold>{'◈  '}</Text>
        <Text color={C.cyan} bold>{line.text}</Text>
      </Box>
    );
    case '_bar':  return <Text color={C.borderMid}>{'─'.repeat(36)}</Text>;
    case '_bar2': return <Text color={C.border}>{'━'.repeat(36)}</Text>;
    case '_prow': return (
      <Box>
        <Box width={14}><Text color={C.sub}>{line.k}</Text></Box>
        <Text color={C.white}>{line.v}</Text>
      </Box>
    );
    case 'step':  return <Box gap={1}><Text color={C.cyan}>{'◆'}</Text><Text color={C.cyan}>{line.text}</Text></Box>;
    case 'pipe':  return <Text color={C.border}>{'│'}</Text>;
    case 'item':  return (
      <Box gap={1}>
        <Text color={line.color??C.violet}>{'■'}</Text>
        <Text color={C.text}>{line.text}</Text>
        {line.suffix&&<Text color={C.sub}>{'  '}{line.suffix}</Text>}
      </Box>
    );
    case 'ok':    return <Box gap={1}><Text color={C.mint}>{'✓'}</Text><Text color={C.mint}>{line.text}</Text></Box>;
    case 'err':   return <Box gap={1}><Text color={C.err}>{'✖'}</Text><Text color={C.err}>{line.text}</Text></Box>;
    case 'kv':    return (
      <Box>
        <Box width={line.kw??16}><Text color={line.kc??C.sub}>{line.k}</Text></Box>
        <Text color={C.text}>{line.v}</Text>
      </Box>
    );
    case 'hr': return <Text color={C.border}>{'─'.repeat(44)}</Text>;
    default:   return <Text color={C.sub}>{line.text??''}</Text>;
  }
};

// ─── WizardStep ───────────────────────────────────────────────────────────────
const WizardStep = ({ step, answered, active, answer, selIdx }) => {
  const labelCol = answered ? C.sub : (active ? C.pink : C.muted);
  const dot      = active ? '◆' : (answered ? '·' : ' ');
  const multiSel = (active||answered) && step.type==='multi'
    ? (Array.isArray(answer) ? answer : []) : [];

  return (
    <Box flexDirection="column">
      <Box gap={1}>
        <Text color={labelCol}>{dot}</Text>
        <Text color={labelCol} bold={active}>{step.label}</Text>
        {answered && step.type!=='multi' && (
          <Text color={C.cyan}>{'  '}{String(answer)}</Text>
        )}
        {answered && step.type==='multi' && (
          <Text color={C.cyan}>{'  '}{multiSel.join(', ')}</Text>
        )}
        {active && step.type==='input' && (
          <Text color={C.sub}>{'  ← type below, then ↵'}</Text>
        )}
      </Box>

      {/* options for active single/multi */}
      {active && step.options && (
        <Box flexDirection="column" marginLeft={3} marginTop={0}>
          {step.options.map((opt,i) => {
            const isCursor  = i===selIdx;
            const isChecked = step.type==='multi' ? multiSel.includes(opt) : isCursor;
            return (
              <Box key={opt} gap={1}>
                <Text color={isCursor ? C.cyan : C.sub}>{isCursor ? '›' : ' '}</Text>
                <Text color={isChecked ? C.pink : C.sub}>
                  {step.type==='multi' ? (isChecked ? '▪' : '▫') : (isCursor ? '●' : '○')}
                </Text>
                <Text color={isChecked ? C.white : C.sub}>{opt}</Text>
              </Box>
            );
          })}
          <Box marginTop={1}>
            <Text color={C.muted}>
              {step.type==='single'
                ? '↑↓ navigate  ·  ↵ confirm'
                : `↑↓ navigate  ·  space toggle  ·  ↵ confirm${step.max?`  (max ${step.max})`:''}`}
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

// ─── OutputBlock ──────────────────────────────────────────────────────────────
const OutputBlock = ({ block, isLatest }) => (
  <Box borderStyle="round" borderColor={isLatest?C.cyan:C.border}
       flexDirection="column" paddingX={1} width="100%" marginBottom={1}>
    <Box gap={1}>
      <Text color={C.cyan}>{'▸'}</Text>
      <Text color={isLatest?C.text:C.sub}>{block.cmd}</Text>
    </Box>
    <Text color={isLatest?C.borderMid:C.border}>{'─'.repeat(44)}</Text>
    {block.lines.map((ln,i)=><OutputLine key={i} line={ln}/>)}

    {isLatest && block.wizard && (
      <Box flexDirection="column" marginTop={1}>
        <Text color={C.borderMid}>{'─'.repeat(44)}</Text>
        {block.wizard.steps.map((step,i)=>{
          const done   = i <  block.wizard.stepIdx;
          const active = i === block.wizard.stepIdx;
          if(!done && !active) return null;
          return (
            <WizardStep key={step.id} step={step}
              answered={done} active={active}
              answer={block.wizard.answers[step.store]}
              selIdx={block.wizard.selIdx}/>
          );
        })}
        <Box marginTop={1}>
          <Text color={C.muted}>
            {'step '}{block.wizard.stepIdx+1}{'/'}{block.wizard.steps.length}
            {'  ·  '}{block.wizard._modName}
          </Text>
        </Box>
      </Box>
    )}
  </Box>
);

// ─── ListView — scrollable list with enter-to-view + back ──────────────────────
const ListView = ({ listData, onSelect, onBack }) => {
  const { items, selIdx, mode, profileLines: pLines } = listData;
  if (mode === 'profile') {
    return (
      <Box flexDirection="column" paddingX={2} paddingTop={1} overflow="hidden">
        <Box borderStyle="round" borderColor={C.pink} flexDirection="column" paddingX={1} width="100%">
          {pLines.map((ln,i) => <OutputLine key={i} line={ln}/>)}
        </Box>
        <Box marginTop={1} paddingX={1}>
          <Text color={C.muted}>press </Text>
          <Text color={C.cyan}>b</Text>
          <Text color={C.muted}> or </Text>
          <Text color={C.cyan}>backspace</Text>
          <Text color={C.muted}> to return to list</Text>
        </Box>
      </Box>
    );
  }
  return (
    <Box flexDirection="column" paddingX={2} paddingTop={1} overflow="hidden">
      <Box borderStyle="round" borderColor={C.violet} flexDirection="column" paddingX={1} width="100%">
        <Text color={C.violet} bold>{'◈  SAVED PROFILES'}</Text>
        <Text color={C.border}>{'─'.repeat(36)}</Text>
        {items.map((item,i) => {
          const active = i===selIdx;
          return (
            <Box key={item.key} gap={1}>
              <Text color={active?C.cyan:C.muted}>{active?'›':' '}</Text>
              <Box width={20}><Text color={active?C.white:C.sub} bold={active}>{item.label}</Text></Box>
              <Text color={C.sub}>{item.sub}</Text>
            </Box>
          );
        })}
        <Box marginTop={1}>
          <Text color={C.muted}>{'↑↓ navigate  ·  ↵ view profile  ·  b / backspace  back'}</Text>
        </Box>
      </Box>
    </Box>
  );
};

// ─── GreetingView ─────────────────────────────────────────────────────────────
const GreetingView = ({ modules, selIdx }) => {
  const count   = modules.length;
  const catalog = [...modules,{name:'commands',desc:'All commands and usage reference',isBuiltin:true}];
  return (
    <Box flexDirection="column" alignItems="center" width="100%">
      <Box height={1}/>
      <Box flexDirection="column" alignItems="center" marginBottom={1}>
        {LOGO.map((line,i)=><Text key={i} color={LOGO_COLORS[i]} bold>{line}</Text>)}
      </Box>
      <Text color={C.sub} bold>{'A S T R A L   M O D U L A R   D E V E L O P M E N T   F R A M E W O R K'}</Text>
      <Box marginBottom={1}/>
      <Box flexDirection="row" gap={2} marginBottom={1}>
        {count===0
          ? <Text color={C.muted}>no modules installed</Text>
          : modules.map(m=>(
              <Box key={m.name} borderStyle="round" borderColor={m.color??C.borderMid} paddingX={1}>
                <Text color={m.color??C.pink}>{'■ '}</Text>
                <Text color={C.white}>{m.name}</Text>
              </Box>
            ))
        }
      </Box>
      <Box marginBottom={1}>
        <Text color={C.sub}>CLI v1.0.0  </Text>
        <Text color={C.muted}>{'·  '}</Text>
        <Text color={C.sub}>{count} module{count!==1?'s':''}</Text>
        <Text color={C.muted}>{'  ·  type '}</Text>
        <Text color={C.cyan}>help</Text>
        <Text color={C.muted}>{' to explore'}</Text>
      </Box>
      <Box width="86%">
        <Box borderStyle="round" borderColor={C.borderMid} flexDirection="column" paddingX={1} width="100%">
          {catalog.map((m,i)=>{
            const active=i===selIdx;
            return (
              <Box key={m.name} gap={1}>
                <Text color={active?C.cyan:C.muted}>{active?'›':' '}</Text>
                <Box width={14}>
                  <Text color={active?C.cyan:(m.isBuiltin?C.violet:(m.color??C.pink))} bold={active}>
                    {m.name}
                  </Text>
                </Box>
                <Text color={C.sub}>{m.desc}</Text>
              </Box>
            );
          })}
          <Box>
            <Text color={C.muted}>{'  ↑↓ navigate  ·  ↵ open  ·  or type below'}</Text>
          </Box>
        </Box>
      </Box>
      <Box height={1}/>
    </Box>
  );
};

function buildHelpLines(modules) {
  return [
    mk('header','CORE COMMANDS'),
    mk('item','help',        {suffix:'show this reference',         color:C.cyan}),
    mk('item','run',         {suffix:'list loaded modules',         color:C.cyan}),
    mk('item','module <n>',  {suffix:'enter module context',        color:C.cyan}),
    mk('item','rylon greet', {suffix:'print greeting once',         color:C.violet}),
    mk('item','rylon clear', {suffix:'reset to greeting',           color:C.violet}),
    mk('item','back',        {suffix:'exit context / list',         color:C.sub}),
    mk('item','exit',        {suffix:'quit rylon',                  color:C.sub}),
    mk('header','ADDING A MODULE'),
    mk('item','1.',{suffix:'create folder  modules/<n>/',           color:C.cyan}),
    mk('item','2.',{suffix:'add module.json  { name, desc, version, color, commands }',color:C.cyan}),
    mk('item','3.',{suffix:'optional: index.js  export function handle(args,ctx){}',   color:C.cyan}),
    mk('item','4.',{suffix:'restart rylon — auto-scanned on boot',  color:C.cyan}),
    mk('header','COMPATIBILITY'),
    mk('kv','',{k:'Node',  v:'>= 18.0.0',                  kw:10,kc:C.sub}),
    mk('kv','',{k:'OS',    v:'Windows / macOS / Linux',     kw:10,kc:C.sub}),
    mk('kv','',{k:'Global',v:'npm link  or  npm install -g rylon',kw:10,kc:C.sub}),
    ...(modules.length?[
      mk('header','LOADED MODULES'),
      ...modules.map(m=>mk('item',m.name,{suffix:m.desc,color:m.color??C.pink})),
    ]:[]),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════════════════════════════════
const App = () => {
  const {exit}            = useApp();
  const {columns,rows}    = useStdoutDimensions();
  const [input,setInput]  = useState('');
  const modules           = useRef(scanModules()).current;
  const handlers          = useRef({});

  const [view,setView]          = useState('greet');
  const [blocks,setBlocks]      = useState([]);
  const [activeMod,setActiveMod]= useState(null);
  const [selIdx,setSelIdx]      = useState(0);
  const [wizard,setWizard]      = useState(null);
  // listData: { items, selIdx, mode:'list'|'profile', profileLines? }
  const [listData,setListData]  = useState(null);

  const catalogEntries = [...modules,{name:'commands',isBuiltin:true}];

  // ── handler loader ────────────────────────────────────────────────────
  const getHandler = useCallback(async (modName) => {
    if (handlers.current[modName]) return handlers.current[modName];
    const base = join(__dirname,'modules',modName);
    for (const fname of ['index.js','index.jsx']) {
      const p = join(base,fname);
      if (!existsSync(p)) continue;
      try {
        const mod = await import(pathToFileURL(p).href);
        handlers.current[modName] = mod;
        return mod;
      } catch(e) {
        handlers.current[modName] = {__importError: e.message??String(e)};
        return handlers.current[modName];
      }
    }
    return null;
  },[]);

  // ── block helpers ─────────────────────────────────────────────────────
  const syncWizardToBlock = useCallback((wiz) => {
    setBlocks(prev => {
      if(!prev.length) return prev;
      const arr=[...prev];
      arr[arr.length-1]={...arr[arr.length-1],wizard:wiz};
      return arr;
    });
  },[]);

  const pushBlock = useCallback((cmd,lines,wiz=null) => {
    setBlocks(prev=>[...prev,{cmd,lines,wizard:wiz}]);
    setWizard(wiz);
    setView('output');
  },[]);

  const wizardCompleteRef = useRef(null);

  // ── wizard advance ────────────────────────────────────────────────────
  const advanceWizard = useCallback((value) => {
    setWizard(prev => {
      if(!prev) return null;
      const step   = prev.steps[prev.stepIdx];
      const newAns = {...prev.answers,[step.store]:value};
      const nextIdx= prev.stepIdx+1;
      if(nextIdx>=prev.steps.length) {
        wizardCompleteRef.current={answers:newAns,onComplete:prev.onComplete,modName:prev._modName};
        return null;
      }
      const updated={...prev,stepIdx:nextIdx,answers:newAns,selIdx:0};
      syncWizardToBlock(updated);
      return updated;
    });
  },[syncWizardToBlock]);

  // ── wizard completion via useEffect (allows async) ────────────────────
  useEffect(()=>{
    if(!wizardCompleteRef.current) return;
    const {answers,onComplete,modName}=wizardCompleteRef.current;
    wizardCompleteRef.current=null;
    (async()=>{
      const handler = modName ? await getHandler(modName) : null;
      let result = null;
      if(handler?.onWizardComplete) result=handler.onWizardComplete(answers,onComplete,C);
      if(result?.followUpWizard) {
        const fw={...result.followUpWizard,_modName:modName};
        const initLines=result.lines??[];
        setBlocks(prev=>{
          const arr=[...prev];
          const last=arr[arr.length-1];
          arr[arr.length-1]={...last,wizard:fw,
            lines:initLines.length?[...last.lines,...initLines]:last.lines};
          return arr;
        });
        setWizard(fw);
      } else {
        const finalLines=result?.lines??[];
        setBlocks(prev=>{
          const arr=[...prev];
          const last=arr[arr.length-1];
          arr[arr.length-1]={...last,wizard:null,
            lines:finalLines.length?[...last.lines,...finalLines]:last.lines};
          return arr;
        });
        setWizard(null);
      }
    })();
  });

  // ── useInput ──────────────────────────────────────────────────────────
  useInput((ch,key)=>{
    if(key.escape){exit();return;}

    // list view navigation
    if(view==='list' && listData) {
      if(listData.mode==='profile') {
        if(ch==='b'||key.backspace||key.delete) {
          setListData(d=>({...d,mode:'list'})); return;
        }
        return;
      }
      // mode === 'list'
      if(key.upArrow){
        setListData(d=>({...d,selIdx:Math.max(0,d.selIdx-1)})); return;
      }
      if(key.downArrow){
        setListData(d=>({...d,selIdx:Math.min(d.items.length-1,d.selIdx+1)})); return;
      }
      if(key.return) {
        const item=listData.items[listData.selIdx];
        // load profile lines via handler
        (async()=>{
          const handler=await getHandler(listData.modName);
          const pLines=handler?.getProfile?.(item.key,C)??[];
          setListData(d=>({...d,mode:'profile',profileLines:pLines}));
        })();
        return;
      }
      if(ch==='b'||key.backspace||key.delete) {
        setView('output'); setListData(null); return;
      }
      return;
    }

    // wizard key handling
    if(wizard) {
      const step=wizard.steps[wizard.stepIdx];
      if(step.type==='single') {
        if(key.upArrow){
          const ni=Math.max(0,wizard.selIdx-1);
          const w={...wizard,selIdx:ni};
          setWizard(w);syncWizardToBlock(w);return;
        }
        if(key.downArrow){
          const ni=Math.min(step.options.length-1,wizard.selIdx+1);
          const w={...wizard,selIdx:ni};
          setWizard(w);syncWizardToBlock(w);return;
        }
        if(key.return){advanceWizard(step.options[wizard.selIdx]);return;}
        return;
      }
      if(step.type==='multi') {
        if(key.upArrow){
          const ni=Math.max(0,wizard.selIdx-1);
          const w={...wizard,selIdx:ni};
          setWizard(w);syncWizardToBlock(w);return;
        }
        if(key.downArrow){
          const ni=Math.min(step.options.length-1,wizard.selIdx+1);
          const w={...wizard,selIdx:ni};
          setWizard(w);syncWizardToBlock(w);return;
        }
        if(ch===' ') {
          const opt=step.options[wizard.selIdx];
          const cur=Array.isArray(wizard.answers[step.store])?wizard.answers[step.store]:[];
          let next;
          if(cur.includes(opt))                    next=cur.filter(x=>x!==opt);
          else if(step.max&&cur.length>=step.max)  next=cur;
          else                                     next=[...cur,opt];
          const w={...wizard,answers:{...wizard.answers,[step.store]:next}};
          setWizard(w);syncWizardToBlock(w);return;
        }
        if(key.return) {
          // ── KEY FIX: read directly from wizard.answers, not a derived var ──
          const cur=Array.isArray(wizard.answers[step.store])?[...wizard.answers[step.store]]:[];
          if(cur.length===0) return; // need at least one
          advanceWizard(cur);return;
        }
        return; // swallow all other keys during multi
      }
      // input type falls through to TextInput
    }

    // greeting catalog nav
    if(view==='greet'&&!input) {
      if(key.upArrow){setSelIdx(i=>Math.max(0,i-1));return;}
      if(key.downArrow){setSelIdx(i=>Math.min(catalogEntries.length-1,i+1));return;}
      if(key.return){
        const entry=catalogEntries[selIdx];
        if(entry?.isBuiltin){pushBlock('commands',buildHelpLines(modules));}
        else if(entry){setActiveMod(entry);setView('context');}
        return;
      }
    }
  });

  // ── handleSubmit ───────────────────────────────────────────────────────
  const handleSubmit=useCallback(async(raw)=>{
    const val=raw.trim(),lower=val.toLowerCase();
    setInput('');
    if(!val) return;
    if(wizard){
      const step=wizard.steps[wizard.stepIdx];
      if(step?.type==='input'){advanceWizard(val);}
      return;
    }
    if(lower==='exit'||lower==='quit'){exit();return;}
    if(lower==='rylon clear'||lower==='clear'){
      setView('greet');setActiveMod(null);setBlocks([]);setWizard(null);setListData(null);return;
    }
    if(lower==='back'){
      if(view==='list'){setView('output');setListData(null);}
      else{setView('greet');setActiveMod(null);}
      return;
    }
    if(lower==='help'){pushBlock('help',buildHelpLines(modules));return;}
    if(lower==='run'||lower==='modules'||lower==='ls'){
      pushBlock(val,modules.length?[
        mk('header','INSTALLED MODULES'),
        ...modules.flatMap((m,i)=>[
          ...(i>0?[mk('hr','')]:[]),
          mk('item',m.name,{suffix:m.desc,color:m.color??C.pink}),
          mk('kv','',{k:'version', v:m.version,                          kw:12,kc:C.sub}),
          mk('kv','',{k:'status',  v:m.status??'installed',              kw:12,kc:C.sub}),
          ...(m.commands?.length?[mk('kv','',{k:'commands',v:m.commands.join('  '),kw:12,kc:C.sub})]:[]),
        ]),
        mk('ok',`${modules.length} module${modules.length!==1?'s':''} loaded`),
      ]:[mk('plain','no modules found in ./modules')]);
      return;
    }
    if(lower==='rylon greet'){
      pushBlock('rylon greet',[
        mk('header','RYLON  v1.0.0'),
        mk('kv','',{k:'Framework',v:'Astral Modular Development',kw:14,kc:C.sub}),
        mk('kv','',{k:'Modules',  v:String(modules.length),      kw:14,kc:C.sub}),
        mk('ok','ready'),
      ]);return;
    }
    if(lower.startsWith('module ')||lower==='module'){
      const name=val.split(/\s+/)[1];
      const found=name?modules.find(m=>m.name.toLowerCase()===name.toLowerCase()):modules[0];
      if(!found){
        pushBlock(val,[mk('err',`module "${name??'?'}" not found`),mk('plain','type  run  to see modules')]);
        return;
      }
      setActiveMod(found);setView('context');return;
    }

    // ── module dispatch ───────────────────────────────────────────────
    const parts=val.split(/\s+/);
    const modName=parts[0].toLowerCase();
    const modMeta=modules.find(m=>m.name.toLowerCase()===modName);
    if(modMeta){
      const handler=await getHandler(modMeta.name);
      if(handler?.__importError){
        pushBlock(val,[mk('err',`failed to load ${modMeta.name}/index.js`),mk('plain',handler.__importError)]);
        return;
      }
      if(handler?.handle){
        const result=handler.handle(parts.slice(1),{C,Sym});
        if(result?.action==='WIZARD'&&result.wizard){
          const wiz={...result.wizard,_modName:modMeta.name};
          pushBlock(val,result.lines??[],wiz);
          return;
        }
        if(result?.action==='LIST') {
          // render scrollable list view
          pushBlock(val,[mk('plain',`Showing ${result.items.length} profiles — switching to list view…`)]);
          setListData({
            items:    result.items,
            selIdx:   0,
            mode:     'list',
            modName:  modMeta.name,
          });
          setView('list');
          return;
        }
        pushBlock(val,result?.lines??[]);
        return;
      }
      pushBlock(val,[
        mk('header',modMeta.name.toUpperCase()),
        mk('kv','',{k:'Desc',    v:modMeta.desc,   kw:12,kc:C.sub}),
        mk('kv','',{k:'Version', v:modMeta.version,kw:12,kc:C.sub}),
        mk('kv','',{k:'Commands',v:(modMeta.commands??[]).join('  ')||'—',kw:12,kc:C.sub}),
        mk('plain','add index.js to modules/'+modMeta.name+'/ to enable commands'),
      ]);return;
    }
    pushBlock(val,[mk('err',`unknown command: "${val}"`),mk('plain','type  help  for reference')]);
  },[wizard,modules,advanceWizard,getHandler,pushBlock,exit,view]);

  // ── ContextView ────────────────────────────────────────────────────────
  const ContextView=()=>{
    const m=activeMod||{};
    return (
      <Box flexGrow={1} flexDirection="column" paddingX={2} paddingTop={1} overflow="hidden">
        <Box borderStyle="round" borderColor={m.color??C.pink} flexDirection="column" paddingX={1} width="100%">
          <Text color={m.color??C.pink} bold>{'◈  '}{(m.name??'').toUpperCase()}{'  —  MODULE'}</Text>
          <Text color={C.border}>{'─'.repeat(44)}</Text>
          <Box><Box width={12}><Text color={C.sub}>Desc</Text></Box><Text color={C.text}>{m.desc??'—'}</Text></Box>
          <Box><Box width={12}><Text color={C.sub}>Version</Text></Box><Text color={C.text}>{m.version??'—'}</Text></Box>
          {m.commands?.length>0&&(
            <Box><Box width={12}><Text color={C.sub}>Commands</Text></Box>
              <Text color={C.cyan}>{m.commands.join('  ')}</Text></Box>
          )}
          <Box marginTop={1}>
            <Text color={C.muted}>type </Text><Text color={C.cyan}>back</Text>
            <Text color={C.muted}> to exit  ·  </Text>
            <Text color={m.color??C.pink}>{m.name}{' <cmd>'}</Text>
            <Text color={C.muted}> to run</Text>
          </Box>
        </Box>
      </Box>
    );
  };

  const inCtx=view==='context';
  const hCenter=inCtx?`► ${activeMod?.name??'module'}  —  active context`:'► Astral Dev Interface';
  const statusColor={greet:C.cyan,output:C.violet,context:C.pink,list:C.violet}[view]??C.sub;
  const promptPfx=wizard
    ?`► ${wizard._modName??'wizard'} | `
    :(view==='list'?'► list | ':(inCtx?`► ${activeMod?.name??'module'} | `:'► '));

  return (
    <Box flexDirection="column" width={columns} height={rows-1}>
      {/* TOP BAR */}
      <Box borderStyle="round" borderColor={C.border} paddingX={1}
           flexShrink={0} width="100%" justifyContent="space-between">
        <Box>{HDR_CHARS.map((ch,i)=><Text key={i} color={HDR_COLORS[i]} bold>{ch}</Text>)}</Box>
        <Text color={C.sub}>{hCenter}</Text>
        <Text color={C.muted}>{'R  Y  A  N'}</Text>
      </Box>

      {/* VIEWPORT */}
      <Box flexGrow={1} overflow="hidden" flexDirection="column"
           paddingX={view==='output'||view==='list'?1:0}
           paddingTop={view==='output'||view==='list'?1:0}>
        {view==='greet'  && <GreetingView modules={modules} selIdx={selIdx}/>}
        {view==='output' && (
          <Box flexDirection="column" overflow="hidden">
            {blocks.map((b,i)=><OutputBlock key={i} block={b} isLatest={i===blocks.length-1}/>)}
          </Box>
        )}
        {view==='context' && <ContextView/>}
        {view==='list'   && listData && (
          <ListView listData={listData} onSelect={()=>{}} onBack={()=>{setView('output');setListData(null);}}/>
        )}
      </Box>

      {/* BOTTOM BAR */}
      <Box flexDirection="column" flexShrink={0} width="100%">
        <Box justifyContent="space-between" paddingX={2}>
          <Box gap={1}>
            <Text color={C.border}>{'●'}</Text>
            <Text color={statusColor}>{view}</Text>
            {wizard&&<Text color={C.pink}>{'  wizard  ·  '}{wizard._modName}{'  ·  step '}{wizard.stepIdx+1}{'/'}{wizard.steps.length}</Text>}
            {view==='list'&&!wizard&&<Text color={C.sub}>{'  ↑↓ navigate  ·  ↵ view  ·  b back'}</Text>}
          </Box>
          <Text color={C.muted}>{'esc / ctrl+c  exit'}</Text>
        </Box>
        <Box borderStyle="round" borderColor={wizard?C.pink:C.border} paddingX={1} width="100%">
          <Text color={C.cyan}>{promptPfx}</Text>
          <TextInput value={input} onChange={setInput} onSubmit={handleSubmit}/>
        </Box>
      </Box>
    </Box>
  );
};

render(<App/>,{exitOnCtrlC:true});