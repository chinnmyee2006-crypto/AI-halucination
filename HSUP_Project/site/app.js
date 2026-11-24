(() => {
  const $ = (sel) => document.querySelector(sel);
  const els = {form:$("#chatForm"), input:$("#promptInput"), conversation:$("#conversation"), welcome:$("#welcome"), scroll:$("#chatScroll"), send:$("#sendButton"), sourcePanel:$("#sourcePanel"), sourceList:$("#sourceList"), sourceToggle:$("#sourceToggle"), status:$("#connection"), statusText:$("#connectionText"), sidebar:$("#sidebar")};
  let history = [], busy = false;
  function element(tag, className, text) { const n=document.createElement(tag); if(className)n.className=className; if(text!==undefined)n.textContent=text; return n; }
  function fitInput() { els.input.style.height="auto"; els.input.style.height=Math.min(els.input.scrollHeight,180)+"px"; }
  function scrollEnd() { requestAnimationFrame(()=>{els.scroll.scrollTop=els.scroll.scrollHeight;}); }
  function addMessage(role, text, extra={}) {
    els.welcome.hidden=true;
    const wrap=element("article",`message ${role}${extra.error?" error":""}`), avatar=element("div","avatar",role==="assistant"?"H":"Y");
    avatar.setAttribute("aria-hidden","true"); const body=element("div","message-content");
    body.append(element("div","message-label",role==="assistant"?"HSUP":"YOU"));
    body.append(element("p","message-text",text));
    if(extra.sources?.length){const note=element("div","answer-sources",`Evidence supplied: ${extra.sources.map((s,i)=>`[S${i+1}] ${s.source||"Source"}`).join(" · ")}`);body.append(note);}
    if(extra.model) body.append(element("div","response-model",extra.model));
    wrap.append(avatar,body);els.conversation.append(wrap);scrollEnd();return wrap;
  }
  function addTyping() { const wrap=element("article","message assistant"), avatar=element("div","avatar","H"), body=element("div","message-content");body.append(element("div","message-label","HSUP"));const dots=element("div","typing");dots.setAttribute("aria-label","Generating response");for(let i=0;i<3;i++)dots.append(element("span"));body.append(dots);wrap.append(avatar,body);els.conversation.append(wrap);scrollEnd();return wrap; }
  function addSource(source={source:"",text:""}) {
    const item=element("div","source-entry"), head=element("div","source-entry-head"), tag=element("span","",`S${els.sourceList.children.length+1}`), name=element("input"), remove=element("button","remove-source","×"), excerpt=element("textarea");
    name.placeholder="Source title or URL";name.setAttribute("aria-label",`Source ${els.sourceList.children.length+1} title`);name.value=source.source||"";
    remove.type="button";remove.setAttribute("aria-label","Remove source");remove.title="Remove source";excerpt.placeholder="Paste a relevant passage (up to 5,000 characters)…";excerpt.setAttribute("aria-label",`Source ${els.sourceList.children.length+1} text`);excerpt.value=source.text||"";
    remove.addEventListener("click",()=>{item.remove();renumber();});head.append(tag,name,remove);item.append(head,excerpt);els.sourceList.append(item);renumber();name.focus();
  }
  function renumber(){[...els.sourceList.children].forEach((item,i)=>{item.querySelector("span").textContent=`S${i+1}`;item.querySelector("input").setAttribute("aria-label",`Source ${i+1} title`);item.querySelector("textarea").setAttribute("aria-label",`Source ${i+1} text`);});}
  function getSources(){return [...els.sourceList.children].map((item,i)=>({id:`S${i+1}`,source:item.querySelector("input").value.trim(),text:item.querySelector("textarea").value.trim()})).filter(x=>x.text);}
  function setStatus(kind,text){els.status.className=`connection ${kind}`;els.statusText.textContent=text;}
  async function checkHealth(){try{const r=await fetch("/api/health",{cache:"no-store"});const d=await r.json();if(d.configured)setStatus("ready","AI ready");else setStatus("error","AI setup needed");}catch{setStatus("error","Server unavailable");}}
  async function submit(prompt) {
    if(busy)return; const message=prompt.trim();if(!message)return;
    const sources=getSources();addMessage("user",message,{sources});els.input.value="";fitInput();busy=true;els.send.disabled=true;els.input.disabled=true;
    const typing=addTyping(); scrollEnd();
    try {
      const response=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:message,history,evidence:sources})});
      const data=await response.json();typing.remove();
      if(!response.ok){addMessage("assistant",data.error||"The request could not be completed.",{error:true});if(response.status===503)setStatus("error","AI setup needed");}
      else {addMessage("assistant",data.answer||"The AI returned an empty response.",{model:data.model?`MODEL · ${data.model}`:""});history.push({role:"user",content:message},{role:"assistant",content:data.answer||""});setStatus("ready","AI ready");}
    } catch {typing.remove();addMessage("assistant","I couldn't reach the HSUP server. Check your connection and try again.");setStatus("error","Server unavailable");}
    finally {busy=false;els.send.disabled=false;els.input.disabled=false;els.input.focus();scrollEnd();}
  }
  els.form.addEventListener("submit",e=>{e.preventDefault();submit(els.input.value);});
  els.input.addEventListener("input",fitInput);
  els.input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();els.form.requestSubmit();}});
  $("#sourceToggle").addEventListener("click",()=>{const open=els.sourcePanel.hidden;els.sourcePanel.hidden=!open;els.sourceToggle.setAttribute("aria-expanded",String(open));if(open&&!els.sourceList.children.length)addSource();});
  $("#closeSources").addEventListener("click",()=>{els.sourcePanel.hidden=true;els.sourceToggle.setAttribute("aria-expanded","false");});
  $("#addSource").addEventListener("click",()=>{if(els.sourceList.children.length>=8)return;addSource();});
  document.querySelectorAll(".suggestion").forEach(btn=>btn.addEventListener("click",()=>{els.input.value=btn.dataset.prompt||"";fitInput();els.input.focus();}));
  $("#newChat").addEventListener("click",()=>{if(busy)return;history=[];els.conversation.replaceChildren(els.welcome);els.welcome.hidden=false;els.input.value="";els.sourceList.replaceChildren();els.sourcePanel.hidden=true;els.sourceToggle.setAttribute("aria-expanded","false");fitInput();els.sidebar.classList.remove("open");els.input.focus();});
  $("#menuToggle").addEventListener("click",()=>els.sidebar.classList.toggle("open"));
  checkHealth();
})();

