import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════
//  ✏️  CUSTOM ASCII GREETING
// ═══════════════════════════════════════════════════════════════════
const CUSTOM_ASCII = [
  "  ██████╗ ██╗   ██╗██╗      ██████╗ ███╗  ██╗",
  "  ██╔══██╗╚██╗ ██╔╝██║     ██╔═══██╗████╗ ██║",
  "  ██████╔╝ ╚████╔╝ ██║     ██║   ██║██╔██╗██║",
  "  ██╔══██╗  ╚██╔╝  ██║     ██║   ██║██║╚████║",
  "  ██║  ██║   ██║   ███████╗╚██████╔╝██║ ╚███║",
  "  ╚═╝  ╚═╝   ╚═╝   ╚══════╝ ╚═════╝ ╚═╝  ╚══╝",
];
const GREETING_SUBTITLE = "Astral Modular Development Framework";
const GREETING_VERSION  = "CLI v1.0.0";
const COMPACT_LABEL     = "astral modular runtime";

// ═══════════════════════════════════════════════════════════════════
//  PALETTE
// ═══════════════════════════════════════════════════════════════════
const C = {
  bg:"#05070f", bgPrompt:"#04060e", bgHeader:"rgba(4,6,14,0.98)",
  border:"#121929", borderMid:"#1c2840", borderGlow:"#00f5ff1a",
  text:"#ccdaff", textSub:"#4a5878", textMuted:"#22283c", textDone:"#2e3550",
  cyan:"#00f5ff", violet:"#bf5fff", mint:"#00ffaa", amber:"#ff9500", pink:"#ff3daf",
  ok:"#00ffaa", err:"#ff3d6b", warn:"#ffcc00", cursor:"#00f5ff",
};
const SYM = { step:"◆", pipe:"│", item:"■", ok:"✓", err:"✖", warn:"▲", arrow:"▸" };

// ═══════════════════════════════════════════════════════════════════
//  MODULES REGISTRY
// ═══════════════════════════════════════════════════════════════════
const MODULES = {
  builder:   { name:"builder",   version:"1.2.0", description:"Project scaffolding & build orchestration", commands:["init","build","clean","deploy"],       color:"#00f5ff" },
  agent:     { name:"agent",     version:"0.9.1", description:"AI-powered task automation agent",          commands:["start","stop","status","configure"],   color:"#bf5fff" },
  shell:     { name:"shell",     version:"1.0.3", description:"Enhanced shell command executor",           commands:["exec","pipe","watch","kill"],           color:"#00ffaa" },
  devops:    { name:"devops",    version:"0.4.0", description:"CI/CD pipeline manager",                   commands:["push","deploy","rollback","logs"],      color:"#ff9500" },
  procreate: { name:"procreate", version:"1.0.0", description:"Developer profile creator & manager",      commands:["create","call","edit","list","delete"], color:"#ff3daf" },
};

// ═══════════════════════════════════════════════════════════════════
//  PROCREATE WIZARD STEPS
// ═══════════════════════════════════════════════════════════════════
const PROCREATE_STEPS = [
  { id:"name",               label:"Profile name",           type:"input",  store:"name" },
  { id:"primaryLanguage",    label:"Primary language",       type:"single", store:"primaryLanguage",
    options:["TypeScript","Python","Rust","Go","JavaScript","C++","Kotlin","Swift"] },
  { id:"secondaryLanguages", label:"Secondary languages",    type:"multi",  store:"secondaryLanguages", max:3,
    options:["JavaScript","Python","Rust","Go","Bash","Java","C#","Dart","Elixir","Zig"] },
  { id:"frameworks",         label:"Frameworks",             type:"multi",  store:"frameworks", max:4,
    options:["React","Next.js","Express","FastAPI","Django","Svelte","Astro","Vue","Tauri","Electron"] },
  { id:"tools",              label:"Dev tools",              type:"multi",  store:"tools", max:4,
    options:["Git","Docker","Kubernetes","VSCode","Neovim","JetBrains IDE","Zsh","Tmux","Warp","Bun"] },
  { id:"philosophy",         label:"Coding philosophy",      type:"single", store:"philosophy",
    options:["Minimalist","Performance first","Readability matters","Ship fast break later","Architecture obsessed","Experimental hacker"] },
  { id:"workStyle",          label:"Work style",             type:"single", store:"workStyle",
    options:["Solo builder","Open source contributor","Startup engineer","Systems architect","AI tinkerer","Fullstack generalist"] },
  { id:"email",              label:"Email",                  type:"input",  store:"email" },
  { id:"github",             label:"GitHub username",        type:"input",  store:"github" },
  { id:"tagline",            label:"Personal tagline",       type:"input",  store:"tagline" },
  { id:"beverage",           label:"Favorite dev beverage",  type:"single", store:"beverage",
    options:["Coffee","Espresso","Tea","Energy drinks","Water","Yerba mate"] },
  { id:"codingTime",         label:"Coding time preference", type:"single", store:"codingTime",
    options:["Early morning","Afternoon","Night owl","Midnight hacker","Whenever the code calls"] },
  { id:"terminalTheme",      label:"Terminal theme vibe",    type:"single", store:"terminalTheme",
    options:["Cyberpunk","Minimal dark","Retro green","Solarized","Neon gradient","Monokai"] },
];

// ═══════════════════════════════════════════════════════════════════
//  PROFILE STORE  (session memory — plain object outside React)
// ═══════════════════════════════════════════════════════════════════
const profileStore = {};

// ═══════════════════════════════════════════════════════════════════
//  COMPACT HEADER LOGO
// ═══════════════════════════════════════════════════════════════════
function CompactLogo() {
  const pairs = [["▸","#00aaff"],["R","#5577ff"],["Y","#8855ff"],["L","#aa44ff"],["O","#cc33ff"],["N","#ff3daf"]];
  return (
    <div style={{display:"flex",alignItems:"center",gap:"1px"}}>
      {pairs.map(([ch,col],i)=>(
        <span key={i} style={{color:col,fontFamily:"'Courier New',monospace",fontWeight:"bold",
          fontSize:"14px",letterSpacing:"1px",textShadow:`0 0 10px ${col}70`}}>{ch}</span>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  GREETING SCREEN
// ═══════════════════════════════════════════════════════════════════
function GreetingScreen({ visible }) {
  const gc = ["#00aaff","#5577ff","#8855ff","#aa44ff","#cc33ff","#ff3daf"];
  return (
    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",gap:"18px",
      opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(-10px)",
      transition:"opacity 0.5s ease, transform 0.5s ease",pointerEvents:"none",zIndex:10}}>
      <div style={{display:"flex",flexDirection:"column",gap:"1px",alignItems:"center"}}>
        {CUSTOM_ASCII.map((row,i)=>(
          <div key={i} style={{fontFamily:"'Courier New',monospace",fontSize:"clamp(7px,1.05vw,12px)",
            color:gc[i%gc.length],textShadow:`0 0 20px ${gc[i%gc.length]}45`,
            whiteSpace:"pre",lineHeight:"1.3",
            opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(5px)",
            transition:`opacity 0.55s ease ${i*0.06}s, transform 0.55s ease ${i*0.06}s`}}>{row}</div>
        ))}
      </div>
      <div style={{fontFamily:"'Courier New',monospace",fontSize:"10px",letterSpacing:"4px",
        color:C.textSub,textTransform:"uppercase",opacity:visible?1:0,transition:"opacity 0.6s ease 0.38s"}}>
        {GREETING_SUBTITLE}
      </div>
      <div style={{display:"flex",gap:"8px",flexWrap:"wrap",justifyContent:"center",
        opacity:visible?1:0,transition:"opacity 0.5s ease 0.52s"}}>
        {Object.entries(MODULES).map(([,m])=>(
          <div key={m.name} style={{border:`1px solid ${m.color}28`,borderRadius:"3px",
            padding:"2px 9px",fontFamily:"monospace",fontSize:"10px",color:m.color,
            letterSpacing:"1px",background:`${m.color}07`,textShadow:`0 0 8px ${m.color}40`}}>
            ■ {m.name}
          </div>
        ))}
      </div>
      <div style={{fontFamily:"monospace",fontSize:"10px",color:C.textMuted,letterSpacing:"2px",
        opacity:visible?1:0,transition:"opacity 0.5s ease 0.65s"}}>
        {GREETING_VERSION} · type a command to begin
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  PROFILE CARD
// ═══════════════════════════════════════════════════════════════════
function ProfileCard({ profile, done }) {
  const accentCol  = done ? C.textDone  : C.pink;
  const textCol    = done ? C.textDone  : C.text;
  const subCol     = done ? C.textMuted : C.textSub;
  const borderBase = done ? C.border    : `${C.pink}40`;

  const Section = ({ title, rows }) => (
    <div style={{border:`1px solid ${borderBase}`,borderRadius:"4px",padding:"8px 12px",
      marginBottom:"6px",background:done?"transparent":`${C.pink}04`,position:"relative"}}>
      <div style={{position:"absolute",top:-1,left:-1,width:8,height:8,
        borderTop:`2px solid ${accentCol}`,borderLeft:`2px solid ${accentCol}`,borderRadius:"3px 0 0 0"}}/>
      <div style={{position:"absolute",bottom:-1,right:-1,width:8,height:8,
        borderBottom:`2px solid ${accentCol}`,borderRight:`2px solid ${accentCol}`,borderRadius:"0 0 3px 0"}}/>
      <div style={{fontFamily:"'Courier New',monospace",fontSize:"9px",letterSpacing:"3px",
        textTransform:"uppercase",color:accentCol,marginBottom:"6px",
        textShadow:done?"none":`0 0 8px ${C.pink}50`}}>{title}</div>
      {rows.map(([label,val],i)=>(
        <div key={i} style={{display:"flex",fontFamily:"'Courier New',monospace",fontSize:"11px",lineHeight:"1.8"}}>
          <span style={{color:subCol,minWidth:"130px",flexShrink:0}}>{label}</span>
          <span style={{color:subCol,marginRight:"6px"}}>:</span>
          <span style={{color:val ? textCol : C.textMuted,fontStyle:val?"normal":"italic"}}>
            {val || "—"}
          </span>
        </div>
      ))}
    </div>
  );

  const arr = v => Array.isArray(v) ? v.join(", ") : (v || "");

  return (
    <div style={{marginTop:"6px"}}>
      <Section title="Identity" rows={[
        ["Name",    profile.name],
        ["Email",   profile.email],
        ["GitHub",  profile.github ? `@${profile.github}` : ""],
        ["Tagline", profile.tagline],
      ]}/>
      <Section title="Languages" rows={[
        ["Primary",    profile.primaryLanguage],
        ["Secondary",  arr(profile.secondaryLanguages)],
        ["Frameworks", arr(profile.frameworks)],
      ]}/>
      <Section title="Environment" rows={[
        ["Tools",    arr(profile.tools)],
        ["Terminal", profile.terminalTheme],
        ["Hours",    profile.codingTime],
      ]}/>
      <Section title="Persona" rows={[
        ["Philosophy", profile.philosophy],
        ["Work style", profile.workStyle],
        ["Beverage",   profile.beverage],
      ]}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  LOG LINE
// ═══════════════════════════════════════════════════════════════════
function LogLine({ entry, delay=0, done=false }) {
  const [vis,setVis] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setVis(true),delay); return()=>clearTimeout(t); },[delay]);

  if (entry.type === "profile") {
    return vis ? <ProfileCard profile={entry.profile} done={done}/> : <div style={{height:100}}/>;
  }

  const scheme = (()=>{
    switch(entry.type){
      case "step":   return {sym:SYM.step, col:done?C.textDone:C.cyan};
      case "pipe":   return {sym:SYM.pipe, col:done?C.textMuted:C.textSub};
      case "item":   return {sym:SYM.item, col:done?C.textDone:(entry.color||C.violet)};
      case "ok":     return {sym:SYM.ok,   col:done?C.textDone:C.ok};
      case "err":    return {sym:SYM.err,  col:C.err};
      case "warn":   return {sym:SYM.warn, col:C.warn};
      case "input":  return {sym:SYM.arrow,col:done?C.textSub:C.cyan};
      case "header": return {sym:null,     col:done?C.textDone:C.mint};
      case "module": return {sym:SYM.item, col:done?C.textDone:(entry.color||C.mint)};
      default:       return {sym:"·",      col:done?C.textDone:C.textSub};
    }
  })();

  const anim = {opacity:vis?1:0,transform:vis?"translateY(0)":"translateY(4px)",transition:"opacity 0.2s, transform 0.2s"};

  if (entry.type==="header") return (
    <div style={{...anim,fontFamily:"'Courier New',monospace",fontSize:"10px",fontWeight:"bold",
      letterSpacing:"3px",textTransform:"uppercase",color:scheme.col,margin:"4px 0 2px"}}>{entry.text}</div>
  );
  if (entry.type==="input") return (
    <div style={{...anim,display:"flex",alignItems:"center",gap:"8px",marginBottom:"5px"}}>
      <span style={{color:done?C.textSub:C.cyan,fontSize:"12px",
        textShadow:done?"none":`0 0 8px ${C.cyan}70`,flexShrink:0}}>▸</span>
      <span style={{color:done?C.textSub:C.text,fontFamily:"'Courier New',monospace",fontSize:"12px"}}>{entry.text}</span>
    </div>
  );

  return (
    <div style={{...anim,display:"flex",alignItems:"flex-start",gap:"8px",minHeight:"17px"}}>
      {scheme.sym && (
        <span style={{color:scheme.col,fontSize:"11px",minWidth:"13px",flexShrink:0,marginTop:"1px",
          textShadow:(!done&&(entry.type==="ok"||entry.type==="step"))?`0 0 8px ${scheme.col}70`:"none"}}>
          {scheme.sym}
        </span>
      )}
      <span style={{color:entry.dim?C.textSub:scheme.col,fontFamily:"'Courier New',monospace",
        fontSize:"12px",lineHeight:"1.5",wordBreak:"break-all"}}>
        {entry.text}
        {entry.suffix&&<span style={{color:done?C.textMuted:C.textSub,marginLeft:"10px",fontSize:"11px"}}>{entry.suffix}</span>}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  WIZARD UI — NO local state for selections (passed via props)
//  single → auto-advances immediately on click
//  multi  → confirm with Enter key or "done ✓" button
//  input  → confirm with Enter key
// ═══════════════════════════════════════════════════════════════════
function WizardUI({ step, stepIndex, totalSteps, multiSelected, textValue,
                    onSingle, onToggleMulti, onTextChange, onTextSubmit, onMultiConfirm }) {

  const inputRef = useRef(null);
  useEffect(()=>{ if(step?.type==="input") setTimeout(()=>inputRef.current?.focus(),60); },[step?.id]);

  // arrow key navigation for single-select
  const handleKeyDown = useCallback((e) => {
    if (!step) return;
    if (step.type === "input") {
      if (e.key === "Enter") { e.preventDefault(); onTextSubmit(); }
      return;
    }
    if (step.type === "single") {
      const opts = step.options;
      // find currently "focused" option by arrow
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const cur = opts.indexOf(multiSelected[0]||"");
        const next = (cur+1) % opts.length;
        onSingle(opts[next]);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const cur = opts.indexOf(multiSelected[0]||"");
        const prev = (cur-1+opts.length) % opts.length;
        onSingle(opts[prev]);
      }
    }
    if (step.type === "multi") {
      if (e.key === "Enter") { e.preventDefault(); onMultiConfirm(); }
    }
  }, [step, multiSelected, onSingle, onTextSubmit, onMultiConfirm]);

  // attach global keydown when wizard is active so arrow keys work even if
  // focus is on the bottom prompt input
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!step) return null;

  const optBtn = (label, active, onClick) => (
    <button key={label} onClick={onClick} style={{
      display:"inline-flex",alignItems:"center",gap:"6px",
      background:active?`${C.pink}18`:"transparent",
      border:`1px solid ${active?C.pink:C.borderMid}`,
      borderRadius:"3px",padding:"3px 10px",margin:"3px 4px 3px 0",
      fontFamily:"'Courier New',monospace",fontSize:"11px",
      color:active?C.pink:C.textSub,cursor:"pointer",
      textShadow:active?`0 0 8px ${C.pink}50`:"none",
      transition:"all 0.12s",
    }}>
      <span style={{fontSize:"9px",lineHeight:1}}>{active?(step.type==="multi"?"■":"●"):(step.type==="multi"?"□":"○")}</span>
      {label}
    </button>
  );

  return (
    <div style={{marginTop:"10px",borderTop:`1px solid ${C.border}`,paddingTop:"10px"}}>
      {/* step header */}
      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
        <span style={{color:C.pink,fontSize:"11px",textShadow:`0 0 8px ${C.pink}70`}}>{SYM.step}</span>
        <span style={{color:C.pink,fontFamily:"'Courier New',monospace",fontSize:"11px",letterSpacing:"1px"}}>{step.label}</span>
        {step.type==="multi"&&step.max&&(
          <span style={{color:C.textMuted,fontSize:"10px"}}>· select up to {step.max}</span>
        )}
        {step.type==="single"&&(
          <span style={{color:C.textMuted,fontSize:"10px"}}>· ↑↓ arrow keys or click</span>
        )}
        {step.type==="input"&&(
          <span style={{color:C.textMuted,fontSize:"10px"}}>· press Enter to confirm</span>
        )}
        <span style={{color:C.textMuted,fontSize:"10px",marginLeft:"auto",fontFamily:"monospace"}}>
          {stepIndex+1} / {totalSteps}
        </span>
      </div>

      {/* single select — click auto-advances */}
      {step.type==="single" && (
        <div style={{display:"flex",flexWrap:"wrap"}}>
          {step.options.map(opt => optBtn(opt, multiSelected[0]===opt, ()=>onSingle(opt)))}
        </div>
      )}

      {/* multi select — Enter or button confirms */}
      {step.type==="multi" && (
        <>
          <div style={{display:"flex",flexWrap:"wrap"}}>
            {step.options.map(opt => optBtn(opt, multiSelected.includes(opt), ()=>onToggleMulti(opt)))}
          </div>
          <div style={{marginTop:"8px",display:"flex",alignItems:"center",gap:"10px"}}>
            <button onClick={onMultiConfirm} style={{
              background:`${C.pink}15`,border:`1px solid ${C.pink}`,borderRadius:"3px",
              padding:"4px 14px",fontFamily:"'Courier New',monospace",fontSize:"11px",
              color:C.pink,cursor:"pointer",letterSpacing:"1px",
              textShadow:`0 0 8px ${C.pink}50`,boxShadow:`0 0 12px ${C.pink}15`,
            }}>confirm ✓</button>
            <span style={{color:C.textMuted,fontSize:"10px",fontFamily:"monospace"}}>
              {multiSelected.length} selected{step.max?` / max ${step.max}`:""}  · or press Enter
            </span>
          </div>
        </>
      )}

      {/* text input — Enter confirms */}
      {step.type==="input" && (
        <div style={{display:"flex",alignItems:"center",gap:"8px",
          background:`${C.pink}08`,border:`1px solid ${C.borderMid}`,
          borderRadius:"3px",padding:"5px 10px"}}>
          <span style={{color:C.pink,fontSize:"12px"}}>▸</span>
          <input
            ref={inputRef}
            value={textValue}
            onChange={e=>onTextChange(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"){e.preventDefault();onTextSubmit();} }}
            placeholder={`Enter ${step.label.toLowerCase()}…`}
            style={{background:"transparent",border:"none",outline:"none",
              color:C.text,fontFamily:"'Courier New',monospace",fontSize:"12px",
              flex:1,caretColor:C.pink}}
          />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  EDIT FIELD PICKER
// ═══════════════════════════════════════════════════════════════════
function EditFieldPicker({ onPickField }) {
  return (
    <div style={{marginTop:"10px",borderTop:`1px solid ${C.border}`,paddingTop:"10px"}}>
      <div style={{color:C.pink,fontFamily:"'Courier New',monospace",fontSize:"11px",
        letterSpacing:"1px",marginBottom:"8px"}}>{SYM.step} Select field to edit</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>
        {PROCREATE_STEPS.map(s=>(
          <button key={s.id} onClick={()=>onPickField(s.id)} style={{
            background:`${C.pink}0a`,border:`1px solid ${C.borderMid}`,borderRadius:"3px",
            padding:"3px 10px",fontFamily:"'Courier New',monospace",fontSize:"10px",
            color:C.textSub,cursor:"pointer",letterSpacing:"0.5px",transition:"all 0.12s",
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pink;e.currentTarget.style.color=C.pink;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.borderMid;e.currentTarget.style.color=C.textSub;}}
          >{s.label}</button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  COMMAND PROCESSORS
// ═══════════════════════════════════════════════════════════════════
function mkId() { return Math.random(); }
function mkLog(type, text, extra={}) { return {type,text,id:mkId(),...extra}; }

function* genModules() {
  yield mkLog("header","Loaded Modules");
  for(const[,m]of Object.entries(MODULES)) yield mkLog("module",m.name,{color:m.color,suffix:`v${m.version} · ${m.description}`});
  yield mkLog("pipe","");
  yield mkLog("ok",`${Object.keys(MODULES).length} modules active`);
}

function* genBuilder(mName,mCmd) {
  const P = {
    "builder:init": [["step","Scaffolding project"],["pipe",""],["item","src/app.tsx"],["item","src/components/"],["item","package.json"],["pipe",""],["step","Installing deps"],["pipe",""],["item","ink@4.4.1"],["item","chalk@5.3.0"],["pipe",""],["ok","Project initialized"]],
    "builder:build":[["step","Compiling TypeScript"],["pipe",""],["item","app.tsx → dist/app.js"],["item","runtime/ → dist/"],["pipe",""],["ok","Build complete · 42 kb"]],
    "agent:start":  [["step","Starting agent runtime"],["pipe",""],["item","Loading model context"],["item","Binding tool interfaces"],["pipe",""],["ok","Agent running"]],
    "shell:exec":   [["step","Shell exec mode"],["pipe",""],["item","stdin/stdout bound"],["ok","Ready"]],
  };
  const seq = P[`${mName}:${mCmd}`] || [["step",`Executing ${mName} ${mCmd}`],["pipe",""],["ok","Done"]];
  for(const[type,text]of seq) yield mkLog(type,text);
}

function* genChain() {
  const steps=["Fetch repository","Install dependencies","Run tests","Build project","Deploy to staging"];
  for(let i=0;i<steps.length;i++){
    yield mkLog("step",steps[i]);
    if(i<steps.length-1) yield mkLog("pipe","");
  }
  yield mkLog("pipe",""); yield mkLog("ok","Pipeline complete · 5 stages passed");
}

function procreateCall(profileName) {
  const logs=[];
  if(!profileName){logs.push(mkLog("err","Usage: procreate call 'profile-name'")); return{logs};}
  const p=profileStore[profileName.toLowerCase()];
  if(!p){logs.push(mkLog("err",`Profile '${profileName}' not found`)); logs.push(mkLog("item","Use: procreate create",{dim:true})); return{logs};}
  logs.push(mkLog("step","Loading profile"));
  logs.push(mkLog("pipe",""));
  logs.push(mkLog("ok",`Found · ${p.name}`));
  logs.push({type:"profile",profile:{...p},id:mkId()});
  return{logs};
}

function procreateList() {
  const logs=[];
  const keys=Object.keys(profileStore);
  if(keys.length===0){
    logs.push(mkLog("info","No profiles saved yet",{dim:true}));
    logs.push(mkLog("item","Use: procreate create",{dim:true}));
    return{logs};
  }
  logs.push(mkLog("header","Saved Profiles"));
  keys.forEach(k=>{ const p=profileStore[k]; logs.push(mkLog("module",p.name,{color:C.pink,suffix:`${p.primaryLanguage||"?"} · ${p.philosophy||"?"}`})); });
  logs.push(mkLog("pipe",""));
  logs.push(mkLog("ok",`${keys.length} profile${keys.length>1?"s":""} in session`));
  return{logs};
}

function procreateDelete(profileName) {
  const logs=[];
  if(!profileName){logs.push(mkLog("err","Usage: procreate delete 'profile-name'")); return{logs};}
  const key=profileName.toLowerCase();
  if(!profileStore[key]){logs.push(mkLog("err",`Profile '${profileName}' not found`)); return{logs};}
  delete profileStore[key];
  logs.push(mkLog("ok",`Profile '${profileName}' removed from session`));
  return{logs};
}

function processCommand(raw) {
  const parts=raw.trim().split(/\s+/);
  const cmd=parts[0]; const args=parts.slice(1);
  const logs=[]; const a=e=>logs.push(e);

  // ── procreate top-level shorthand ──
  if(cmd==="procreate") {
    const sub=args[0];
    const profileArg=args.slice(1).join(" ").replace(/['"]/g,"").trim();
    if(sub==="create")  return{action:"WIZARD",wizardMode:"create",logs};
    if(sub==="call")    return{action:"PUSH",...procreateCall(profileArg),logs:procreateCall(profileArg).logs};
    if(sub==="list")    return{action:"PUSH",...procreateList()};
    if(sub==="delete")  return{action:"PUSH",...procreateDelete(profileArg)};
    if(sub==="edit")    return{action:"WIZARD",wizardMode:"edit",profileArg,logs};
    a(mkLog("err","Unknown procreate command"));
    a(mkLog("item","Commands: create · call 'name' · edit 'name' · list · delete 'name'",{dim:true}));
    return{action:"PUSH",logs};
  }

  switch(cmd){
    case "modules": case "ls":
      for(const e of genModules())a(e); break;
    case "run":{
      const[mName,mCmd="start"]=args;
      if(!mName){a(mkLog("err","Usage: run <module> <command>")); break;}
      // procreate via run procreate <sub> [name]
      if(mName==="procreate"){
        const sub=mCmd;
        const profileArg=args.slice(2).join(" ").replace(/['"]/g,"").trim();
        if(sub==="create")  return{action:"WIZARD",wizardMode:"create",logs};
        if(sub==="call")    return{action:"PUSH",...procreateCall(profileArg)};
        if(sub==="list")    return{action:"PUSH",...procreateList()};
        if(sub==="delete")  return{action:"PUSH",...procreateDelete(profileArg)};
        if(sub==="edit")    return{action:"WIZARD",wizardMode:"edit",profileArg,logs};
      }
      const mod=MODULES[mName];
      if(!mod){a(mkLog("err",`Module '${mName}' not found`)); a(mkLog("item",`Available: ${Object.keys(MODULES).join(", ")}`,{dim:true})); break;}
      if(!mod.commands.includes(mCmd)){a(mkLog("err",`Unknown command '${mCmd}'`)); a(mkLog("item",`Commands: ${mod.commands.join(", ")}`,{dim:true})); break;}
      for(const e of genBuilder(mName,mCmd))a(e);
      break;
    }
    case "chain": for(const e of genChain())a(e); break;
    case "help":
      a(mkLog("header","Commands"));
      [
        ["modules / ls","List loaded modules"],
        ["run <mod> <cmd>","Execute a module command"],
        ["procreate create","Start profile wizard"],
        ["procreate call 'name'","Display a saved profile"],
        ["procreate edit 'name'","Edit a saved profile"],
        ["procreate list","List all saved profiles"],
        ["procreate delete 'name'","Delete a profile"],
        ["chain","Run demo task pipeline"],
        ["clear","Clear interaction area"],
        ["help","Show this help"],
      ].forEach(([c,d])=>a(mkLog("item",c,{suffix:d})));
      break;
    case "clear": return{action:"CLEAR",logs:[]};
    default:
      a(mkLog("err",`Unknown command: ${cmd}`));
      a(mkLog("item","Type 'help' for commands",{dim:true}));
  }
  return{action:"PUSH",logs};
}

// ═══════════════════════════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════════════════════════
export default function RylonCLI() {
  const [started,setStarted]   = useState(false);
  const [blocks,setBlocks]     = useState([]);   // [{entries:[], wizard:null|{...}}]
  const [input,setInput]       = useState("");
  const [cmdHist,setCmdHist]   = useState([]);
  const [histIdx,setHistIdx]   = useState(-1);
  const [blink,setBlink]       = useState(true);

  // ── wizard state (single source of truth, lifted out of blocks) ──
  // null = no active wizard
  const [activeWizard,setActiveWizard] = useState(null);
  // {mode:"create"|"edit"|"editPick", stepIndex, draft, steps,
  //  editStepIdx (for editPick→editField), profileKey}
  const [wizardMultiSel,setWizardMultiSel] = useState([]);
  const [wizardText,setWizardText]         = useState("");

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(()=>{const t=setInterval(()=>setBlink(b=>!b),530); return()=>clearInterval(t);},[]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[blocks,activeWizard]);

  // ── helper: append entries to last block ──
  const appendToLast = useCallback((entries) => {
    setBlocks(prev=>{
      const arr=[...prev];
      const last={...arr[arr.length-1], entries:[...arr[arr.length-1].entries,...entries]};
      arr[arr.length-1]=last;
      return arr;
    });
  },[]);

  // ── advance wizard step ──
  const advanceWizard = useCallback((value) => {
    setActiveWizard(wiz=>{
      if(!wiz) return null;

      // editPick mode — user chose a field
      if(wiz.mode==="editPick"){
        const stepIdx=PROCREATE_STEPS.findIndex(s=>s.id===value);
        const step=PROCREATE_STEPS[stepIdx];
        const currentVal=wiz.draft[step.store];
        // seed selection state
        if(step.type==="multi")  setWizardMultiSel(Array.isArray(currentVal)?[...currentVal]:[]);
        else if(step.type==="single") setWizardMultiSel(currentVal?[currentVal]:[]);
        else setWizardText(currentVal||"");
        appendToLast([mkLog("info",`Editing: ${step.label}`,{dim:true})]);
        return{...wiz,mode:"editField",editStepIdx:stepIdx};
      }

      // editField — one step, then done
      if(wiz.mode==="editField"){
        const step=PROCREATE_STEPS[wiz.editStepIdx];
        const newDraft={...wiz.draft,[step.store]:value};
        profileStore[wiz.profileKey]=newDraft;
        appendToLast([
          mkLog("ok",`${step.label} updated · profile saved`),
          {type:"profile",profile:{...newDraft},id:mkId()},
        ]);
        setWizardMultiSel([]); setWizardText("");
        return null; // close wizard
      }

      // create mode
      const step=wiz.steps[wiz.stepIndex];
      const newDraft={...wiz.draft,[step.store]:value};
      const label=Array.isArray(value)?value.join(", "):value;
      appendToLast([
        mkLog("item",`${step.label}: ${label}`,{color:C.pink}),
        mkLog("pipe",""),
      ]);

      const nextIdx=wiz.stepIndex+1;
      if(nextIdx>=wiz.steps.length){
        // done — save
        const profileName=(newDraft.name||"unnamed").trim();
        profileStore[profileName.toLowerCase()]=newDraft;
        appendToLast([
          mkLog("ok",`Profile '${profileName}' saved to session`),
          {type:"profile",profile:{...newDraft},id:mkId()},
        ]);
        setWizardMultiSel([]); setWizardText("");
        return null;
      }

      // seed next step
      const nextStep=wiz.steps[nextIdx];
      if(nextStep.type==="multi")  setWizardMultiSel([]);
      else if(nextStep.type==="single") setWizardMultiSel([]);
      else setWizardText("");
      return{...wiz,stepIndex:nextIdx,draft:newDraft};
    });
  },[appendToLast]);

  // ── single select — auto-advance ──
  const handleSingle = useCallback((opt)=>{
    setWizardMultiSel([opt]);
    // small delay so the highlight renders before advancing
    setTimeout(()=>advanceWizard(opt), 160);
  },[advanceWizard]);

  // ── multi toggle ──
  const handleToggleMulti = useCallback((opt)=>{
    setWizardMultiSel(prev=>{
      if(!Array.isArray(prev)) return [opt];
      if(prev.includes(opt)) return prev.filter(x=>x!==opt);
      const step=activeWizard?.mode==="editField"
        ? PROCREATE_STEPS[activeWizard.editStepIdx]
        : activeWizard?.steps[activeWizard.stepIndex];
      if(step?.max && prev.length>=step.max) return prev;
      return [...prev,opt];
    });
  },[activeWizard]);

  // ── multi confirm ──
  const handleMultiConfirm = useCallback(()=>{
    if(wizardMultiSel.length===0) return;
    advanceWizard([...wizardMultiSel]);
  },[wizardMultiSel,advanceWizard]);

  // ── text submit ──
  const handleTextSubmit = useCallback(()=>{
    const val=wizardText.trim();
    if(!val) return;
    advanceWizard(val);
    setWizardText("");
  },[wizardText,advanceWizard]);

  // ── editPick field chosen ──
  const handleEditFieldPick = useCallback((fieldId)=>{
    advanceWizard(fieldId);
  },[advanceWizard]);

  // ── command submit ──
  const submit = useCallback(()=>{
    const raw=input.trim();
    if(!raw) return;
    setCmdHist(h=>[raw,...h.slice(0,49)]);
    setHistIdx(-1);
    setInput("");
    if(!started) setStarted(true);

    const result=processCommand(raw);
    if(result.action==="CLEAR"){setBlocks([]); setActiveWizard(null); return;}

    const inputEntry=mkLog("input",raw);

    if(result.action==="WIZARD"){
      const initLogs=[inputEntry,...(result.logs||[])];
      if(result.wizardMode==="create"){
        initLogs.push(mkLog("step","Initializing dev profile wizard"));
        initLogs.push(mkLog("pipe",""));
        initLogs.push(mkLog("info","Complete each step to build your profile",{dim:true}));
        initLogs.push(mkLog("pipe",""));
        setBlocks(prev=>[...prev,{entries:initLogs}]);
        setWizardMultiSel([]); setWizardText("");
        setActiveWizard({mode:"create",steps:PROCREATE_STEPS,stepIndex:0,draft:{}});
      } else if(result.wizardMode==="edit"){
        const profileArg=result.profileArg||"";
        const p=profileStore[profileArg.toLowerCase()];
        if(!p){
          initLogs.push(mkLog("err",`Profile '${profileArg}' not found`));
          initLogs.push(mkLog("item","Use: procreate create",{dim:true}));
          setBlocks(prev=>[...prev,{entries:initLogs}]);
          return;
        }
        initLogs.push(mkLog("step",`Editing · ${p.name}`));
        initLogs.push(mkLog("pipe",""));
        initLogs.push(mkLog("info","Choose a field to edit",{dim:true}));
        setBlocks(prev=>[...prev,{entries:initLogs}]);
        setWizardMultiSel([]); setWizardText("");
        setActiveWizard({mode:"editPick",steps:PROCREATE_STEPS,draft:{...p},profileKey:profileArg.toLowerCase()});
      }
    } else {
      setBlocks(prev=>[...prev,{entries:[inputEntry,...(result.logs||[])]}]);
    }
  },[input,started]);

  const onKey=useCallback((e)=>{
    if(e.key==="Enter"){ submit(); }
    else if(e.key==="ArrowUp"){
      // only hijack if wizard NOT handling arrows AND no text
      if(!activeWizard){
        e.preventDefault();
        const n=Math.min(histIdx+1,cmdHist.length-1);
        setHistIdx(n); setInput(cmdHist[n]||"");
      }
    } else if(e.key==="ArrowDown"){
      if(!activeWizard){
        e.preventDefault();
        const n=Math.max(histIdx-1,-1);
        setHistIdx(n); setInput(n===-1?"":cmdHist[n]||"");
      }
    }
  },[submit,cmdHist,histIdx,activeWizard]);

  // current wizard step
  const currentStep = activeWizard
    ? (activeWizard.mode==="editField"
        ? PROCREATE_STEPS[activeWizard.editStepIdx]
        : activeWizard.mode==="editPick"
          ? null
          : activeWizard.steps[activeWizard.stepIndex])
    : null;

  const currentStepIndex = activeWizard?.mode==="editField"
    ? 0
    : activeWizard?.stepIndex ?? 0;

  return (
    <div onClick={()=>inputRef.current?.focus()} style={{
      width:"100%",height:"100vh",background:C.bg,
      display:"flex",flexDirection:"column",
      fontFamily:"'Courier New',monospace",overflow:"hidden",cursor:"text",
    }}>
      {/* ── HEADER ── */}
      <div style={{background:C.bgHeader,borderBottom:`1px solid ${C.border}`,
        padding:"7px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",
        flexShrink:0,position:"relative",boxShadow:`0 1px 0 ${C.borderGlow}`}}>
        <CompactLogo/>
        <div style={{position:"absolute",left:"50%",transform:"translateX(-50%)",
          opacity:started?1:0,transition:"opacity 0.55s ease",fontFamily:"monospace",
          fontSize:"11px",letterSpacing:"2.5px",color:C.textSub,whiteSpace:"nowrap",textTransform:"uppercase"}}>
          {COMPACT_LABEL}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
          <span style={{color:C.violet,fontSize:"10px",letterSpacing:"1px",
            opacity:started?1:0.25,transition:"opacity 0.5s"}}>■ {Object.keys(MODULES).length} modules</span>
          <span style={{color:C.textMuted,fontSize:"10px",letterSpacing:"1.5px"}}>{GREETING_VERSION}</span>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{flex:1,position:"relative",overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <GreetingScreen visible={!started}/>
        <div style={{flex:1,overflowY:"auto",padding:"12px 14px 4px",
          opacity:started?1:0,transition:"opacity 0.5s ease 0.15s",
          scrollbarWidth:"thin",scrollbarColor:`${C.borderMid} transparent`}}>

          {blocks.map((block,bi)=>{
            const isLatest = bi===blocks.length-1;
            const showWizard = isLatest && activeWizard;
            return (
              <div key={bi} style={{position:"relative",
                border:`1px solid ${isLatest?C.borderMid:C.border}`,borderRadius:"4px",
                padding:"10px 14px 8px",marginBottom:"8px",
                background:isLatest?`${C.cyan}03`:"transparent",
                transition:"border-color 0.5s, background 0.5s"}}>
                {/* corners */}
                <div style={{position:"absolute",top:-1,left:-1,width:10,height:10,
                  borderTop:`2px solid ${isLatest?C.cyan:C.borderMid}`,
                  borderLeft:`2px solid ${isLatest?C.cyan:C.borderMid}`,borderRadius:"3px 0 0 0"}}/>
                <div style={{position:"absolute",bottom:-1,right:-1,width:10,height:10,
                  borderBottom:`2px solid ${isLatest?C.cyan:C.border}`,
                  borderRight:`2px solid ${isLatest?C.cyan:C.border}`,borderRadius:"0 0 3px 0"}}/>

                {block.entries.map((entry,i)=>(
                  <LogLine key={entry.id} entry={entry} delay={i*40} done={!isLatest}/>
                ))}

                {/* wizard renders inside latest block only */}
                {showWizard && activeWizard.mode==="editPick" && (
                  <EditFieldPicker onPickField={handleEditFieldPick}/>
                )}
                {showWizard && (activeWizard.mode==="create"||activeWizard.mode==="editField") && currentStep && (
                  <WizardUI
                    step={currentStep}
                    stepIndex={currentStepIndex}
                    totalSteps={activeWizard.mode==="editField"?1:PROCREATE_STEPS.length}
                    multiSelected={wizardMultiSel}
                    textValue={wizardText}
                    onSingle={handleSingle}
                    onToggleMulti={handleToggleMulti}
                    onTextChange={setWizardText}
                    onTextSubmit={handleTextSubmit}
                    onMultiConfirm={handleMultiConfirm}
                  />
                )}
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>
      </div>

      {/* ── PROMPT ── */}
      <div onClick={e=>{e.stopPropagation();inputRef.current?.focus();}}
        style={{background:C.bgPrompt,borderTop:`1px solid ${C.border}`,
          padding:"9px 16px",display:"flex",alignItems:"center",gap:"10px",
          flexShrink:0,boxShadow:`0 -1px 24px ${C.cyan}07`}}>
        <span style={{color:C.cyan,fontSize:"13px",textShadow:`0 0 10px ${C.cyan}80`,flexShrink:0}}>▸</span>
        <div style={{position:"relative",flex:1,display:"flex",alignItems:"center"}}>
          <input ref={inputRef} value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={onKey}
            autoFocus spellCheck={false}
            style={{background:"transparent",border:"none",outline:"none",
              color:C.text,fontFamily:"'Courier New',monospace",fontSize:"13px",
              width:"100%",caretColor:C.cursor,letterSpacing:"0.3px"}}/>
          {input===""&&(
            <span style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",
              width:"7px",height:"14px",
              background:blink?C.cursor:"transparent",
              boxShadow:blink?`0 0 8px ${C.cursor}`:"none",
              transition:"background 0.08s",pointerEvents:"none"}}/>
          )}
        </div>
        <span style={{color:C.textMuted,fontSize:"10px",flexShrink:0}}>↵</span>
      </div>
    </div>
  );
}
