function zt(t,e){t.indexOf(e)===-1&&t.push(e)}const Tt=(t,e,n)=>Math.min(Math.max(n,t),e),w={duration:.3,delay:0,endDelay:0,repeat:0,easing:"ease"},U=t=>typeof t=="number",x=t=>Array.isArray(t)&&!U(t[0]),Kt=(t,e,n)=>{const r=e-t;return((n-t)%r+r)%r+t};function Gt(t,e){return x(t)?t[Kt(0,t.length,e)]:t}const Et=(t,e,n)=>-n*t+n*e+t,At=()=>{},S=t=>t,tt=(t,e,n)=>e-t===0?1:(n-t)/(e-t);function St(t,e){const n=t[t.length-1];for(let r=1;r<=e;r++){const i=tt(0,e,r);t.push(Et(n,1,i))}}function Zt(t){const e=[0];return St(e,t-1),e}function Jt(t,e=Zt(t.length),n=S){const r=t.length,i=r-e.length;return i>0&&St(e,i),s=>{let o=0;for(;o<r-2&&!(s<e[o+1]);o++);let c=Tt(0,1,tt(e[o],e[o+1],s));return c=Gt(n,o)(c),Et(t[o],t[o+1],c)}}const Lt=t=>Array.isArray(t)&&U(t[0]),G=t=>typeof t=="object"&&!!t.createAnimation,O=t=>typeof t=="function",Qt=t=>typeof t=="string",_={ms:t=>t*1e3,s:t=>t/1e3},Dt=(t,e,n)=>(((1-3*n+3*e)*t+(3*n-6*e))*t+3*e)*t,te=1e-7,ee=12;function ne(t,e,n,r,i){let s,o,c=0;do o=e+(n-e)/2,s=Dt(o,r,i)-t,s>0?n=o:e=o;while(Math.abs(s)>te&&++c<ee);return o}function k(t,e,n,r){if(t===e&&n===r)return S;const i=s=>ne(s,0,1,t,n);return s=>s===0||s===1?s:Dt(i(s),e,r)}const re=(t,e="end")=>n=>{n=e==="end"?Math.min(n,.999):Math.max(n,.001);const r=n*t,i=e==="end"?Math.floor(r):Math.ceil(r);return Tt(0,1,i/t)},ct={ease:k(.25,.1,.25,1),"ease-in":k(.42,0,1,1),"ease-in-out":k(.42,0,.58,1),"ease-out":k(0,0,.58,1)},ie=/\((.*?)\)/;function lt(t){if(O(t))return t;if(Lt(t))return k(...t);if(ct[t])return ct[t];if(t.startsWith("steps")){const e=ie.exec(t);if(e){const n=e[1].split(",");return re(parseFloat(n[0]),n[1].trim())}}return S}class Pt{constructor(e,n=[0,1],{easing:r,duration:i=w.duration,delay:s=w.delay,endDelay:o=w.endDelay,repeat:c=w.repeat,offset:a,direction:f="normal"}={}){if(this.startTime=null,this.rate=1,this.t=0,this.cancelTimestamp=null,this.easing=S,this.duration=0,this.totalDuration=0,this.repeat=0,this.playState="idle",this.finished=new Promise((d,u)=>{this.resolve=d,this.reject=u}),r=r||w.easing,G(r)){const d=r.createAnimation(n);r=d.easing,n=d.keyframes||n,i=d.duration||i}this.repeat=c,this.easing=x(r)?S:lt(r),this.updateDuration(i);const l=Jt(n,a,x(r)?r.map(lt):S);this.tick=d=>{var u;s=s;let p=0;this.pauseTime!==void 0?p=this.pauseTime:p=(d-this.startTime)*this.rate,this.t=p,p/=1e3,p=Math.max(p-s,0),this.playState==="finished"&&this.pauseTime===void 0&&(p=this.totalDuration);const v=p/this.duration;let h=Math.floor(v),m=v%1;!m&&v>=1&&(m=1),m===1&&h--;const T=h%2;(f==="reverse"||f==="alternate"&&T||f==="alternate-reverse"&&!T)&&(m=1-m);const I=p>=this.totalDuration?1:Math.min(m,1),D=l(this.easing(I));e(D),this.pauseTime===void 0&&(this.playState==="finished"||p>=this.totalDuration+o)?(this.playState="finished",(u=this.resolve)===null||u===void 0||u.call(this,D)):this.playState!=="idle"&&(this.frameRequestId=requestAnimationFrame(this.tick))},this.play()}play(){const e=performance.now();this.playState="running",this.pauseTime!==void 0?this.startTime=e-this.pauseTime:this.startTime||(this.startTime=e),this.cancelTimestamp=this.startTime,this.pauseTime=void 0,this.frameRequestId=requestAnimationFrame(this.tick)}pause(){this.playState="paused",this.pauseTime=this.t}finish(){this.playState="finished",this.tick(0)}stop(){var e;this.playState="idle",this.frameRequestId!==void 0&&cancelAnimationFrame(this.frameRequestId),(e=this.reject)===null||e===void 0||e.call(this,!1)}cancel(){this.stop(),this.tick(this.cancelTimestamp)}reverse(){this.rate*=-1}commitStyles(){}updateDuration(e){this.duration=e,this.totalDuration=e*(this.repeat+1)}get currentTime(){return this.t}set currentTime(e){this.pauseTime!==void 0||this.rate===0?this.pauseTime=e:this.startTime=performance.now()-e/this.rate}get playbackRate(){return this.rate}set playbackRate(e){this.rate=e}}class se{setAnimation(e){this.animation=e,e?.finished.then(()=>this.clearAnimation()).catch(()=>{})}clearAnimation(){this.animation=this.generator=void 0}}const Y=new WeakMap;function Rt(t){return Y.has(t)||Y.set(t,{transforms:[],values:new Map}),Y.get(t)}function oe(t,e){return t.has(e)||t.set(e,new se),t.get(e)}const ae=["","X","Y","Z"],ce=["translate","scale","rotate","skew"],V={x:"translateX",y:"translateY",z:"translateZ"},ut={syntax:"<angle>",initialValue:"0deg",toDefaultUnit:t=>t+"deg"},le={translate:{syntax:"<length-percentage>",initialValue:"0px",toDefaultUnit:t=>t+"px"},rotate:ut,scale:{syntax:"<number>",initialValue:1,toDefaultUnit:S},skew:ut},C=new Map,et=t=>`--motion-${t}`,B=["x","y","z"];ce.forEach(t=>{ae.forEach(e=>{B.push(t+e),C.set(et(t+e),le[t])})});const ue=(t,e)=>B.indexOf(t)-B.indexOf(e),de=new Set(B),xt=t=>de.has(t),fe=(t,e)=>{V[e]&&(e=V[e]);const{transforms:n}=Rt(t);zt(n,e),t.style.transform=he(n)},he=t=>t.sort(ue).reduce(me,"").trim(),me=(t,e)=>`${t} ${e}(var(${et(e)}))`,Z=t=>t.startsWith("--"),dt=new Set;function pe(t){if(!dt.has(t)){dt.add(t);try{const{syntax:e,initialValue:n}=C.has(t)?C.get(t):{};CSS.registerProperty({name:t,inherits:!1,syntax:e,initialValue:n})}catch{}}}const z=(t,e)=>document.createElement("div").animate(t,e),ft={cssRegisterProperty:()=>typeof CSS<"u"&&Object.hasOwnProperty.call(CSS,"registerProperty"),waapi:()=>Object.hasOwnProperty.call(Element.prototype,"animate"),partialKeyframes:()=>{try{z({opacity:[1]})}catch{return!1}return!0},finished:()=>!!z({opacity:[0,1]},{duration:.001}).finished,linearEasing:()=>{try{z({opacity:0},{easing:"linear(0, 1)"})}catch{return!1}return!0}},K={},R={};for(const t in ft)R[t]=()=>(K[t]===void 0&&(K[t]=ft[t]()),K[t]);const ge=.015,ye=(t,e)=>{let n="";const r=Math.round(e/ge);for(let i=0;i<r;i++)n+=t(tt(0,r-1,i))+", ";return n.substring(0,n.length-2)},ht=(t,e)=>O(t)?R.linearEasing()?`linear(${ye(t,e)})`:w.easing:Lt(t)?we(t):t,we=([t,e,n,r])=>`cubic-bezier(${t}, ${e}, ${n}, ${r})`;function ve(t,e){for(let n=0;n<t.length;n++)t[n]===null&&(t[n]=n?t[n-1]:e());return t}const be=t=>Array.isArray(t)?t:[t];function J(t){return V[t]&&(t=V[t]),xt(t)?et(t):t}const N={get:(t,e)=>{e=J(e);let n=Z(e)?t.style.getPropertyValue(e):getComputedStyle(t)[e];if(!n&&n!==0){const r=C.get(e);r&&(n=r.initialValue)}return n},set:(t,e,n)=>{e=J(e),Z(e)?t.style.setProperty(e,n):t.style[e]=n}};function Ot(t,e=!0){if(!(!t||t.playState==="finished"))try{t.stop?t.stop():(e&&t.commitStyles(),t.cancel())}catch{}}function Te(t,e){var n;let r=e?.toDefaultUnit||S;const i=t[t.length-1];if(Qt(i)){const s=((n=i.match(/(-?[\d.]+)([a-z%]*)/))===null||n===void 0?void 0:n[2])||"";s&&(r=o=>o+s)}return r}function Ee(){return window.__MOTION_DEV_TOOLS_RECORD}function Ae(t,e,n,r={},i){const s=Ee(),o=r.record!==!1&&s;let c,{duration:a=w.duration,delay:f=w.delay,endDelay:l=w.endDelay,repeat:d=w.repeat,easing:u=w.easing,persist:p=!1,direction:v,offset:h,allowWebkitAcceleration:m=!1}=r;const T=Rt(t),I=xt(e);let D=R.waapi();I&&fe(t,e);const b=J(e),q=oe(T.values,b),E=C.get(b);return Ot(q.animation,!(G(u)&&q.generator)&&r.record!==!1),()=>{const $=()=>{var g,M;return(M=(g=N.get(t,b))!==null&&g!==void 0?g:E?.initialValue)!==null&&M!==void 0?M:0};let y=ve(be(n),$);const at=Te(y,E);if(G(u)){const g=u.createAnimation(y,e!=="opacity",$,b,q);u=g.easing,y=g.keyframes||y,a=g.duration||a}if(Z(b)&&(R.cssRegisterProperty()?pe(b):D=!1),I&&!R.linearEasing()&&(O(u)||x(u)&&u.some(O))&&(D=!1),D){E&&(y=y.map(L=>U(L)?E.toDefaultUnit(L):L)),y.length===1&&(!R.partialKeyframes()||o)&&y.unshift($());const g={delay:_.ms(f),duration:_.ms(a),endDelay:_.ms(l),easing:x(u)?void 0:ht(u,a),direction:v,iterations:d+1,fill:"both"};c=t.animate({[b]:y,offset:h,easing:x(u)?u.map(L=>ht(L,a)):void 0},g),c.finished||(c.finished=new Promise((L,Yt)=>{c.onfinish=L,c.oncancel=Yt}));const M=y[y.length-1];c.finished.then(()=>{p||(N.set(t,b,M),c.cancel())}).catch(At),m||(c.playbackRate=1.000001)}else if(i&&I)y=y.map(g=>typeof g=="string"?parseFloat(g):g),y.length===1&&y.unshift(parseFloat($())),c=new i(g=>{N.set(t,b,at?at(g):g)},y,Object.assign(Object.assign({},r),{duration:a,easing:u}));else{const g=y[y.length-1];N.set(t,b,E&&U(g)?E.toDefaultUnit(g):g)}return o&&s(t,e,y,{duration:a,delay:f,easing:u,repeat:d,offset:h},"motion-one"),q.setAnimation(c),c}}const Se=(t,e)=>t[e]?Object.assign(Object.assign({},t),t[e]):Object.assign({},t);function Le(t,e){var n;return typeof t=="string"?e?((n=e[t])!==null&&n!==void 0||(e[t]=document.querySelectorAll(t)),t=e[t]):t=document.querySelectorAll(t):t instanceof Element&&(t=[t]),Array.from(t||[])}const De=t=>t(),It=(t,e,n=w.duration)=>new Proxy({animations:t.map(De).filter(Boolean),duration:n,options:e},Re),Pe=t=>t.animations[0],Re={get:(t,e)=>{const n=Pe(t);switch(e){case"duration":return t.duration;case"currentTime":return _.s(n?.[e]||0);case"playbackRate":case"playState":return n?.[e];case"finished":return t.finished||(t.finished=Promise.all(t.animations.map(xe)).catch(At)),t.finished;case"stop":return()=>{t.animations.forEach(r=>Ot(r))};case"forEachNative":return r=>{t.animations.forEach(i=>r(i,t))};default:return typeof n?.[e]>"u"?void 0:()=>t.animations.forEach(r=>r[e]())}},set:(t,e,n)=>{switch(e){case"currentTime":n=_.ms(n);case"playbackRate":for(let r=0;r<t.animations.length;r++)t.animations[r][e]=n;return!0}return!1}},xe=t=>t.finished;function Oe(t,e,n){return O(t)?t(e,n):t}function Ie(t){return function(n,r,i={}){n=Le(n);const s=n.length,o=[];for(let c=0;c<s;c++){const a=n[c];for(const f in r){const l=Se(i,f);l.delay=Oe(l.delay,c,s);const d=Ae(a,f,r[f],l,t);o.push(d)}}return It(o,i,i.duration)}}const Me=Ie(Pt);function ke(t,e={}){return It([()=>{const n=new Pt(t,[0,1],e);return n.finished.catch(()=>{}),n}],e,e.duration)}function _e(t,e,n){return(O(t)?ke:Me)(t,e,n)}const Ce=window.location.hostname;Ce!=="agalera.eu"&&(console.log("Disabling analytics..."),window["ga-disable-G-S8VGYBN25C"]=!0);window.dataLayer=window.dataLayer||[];function Mt(){dataLayer.push(arguments)}Mt("js",new Date);Mt("config","G-S8VGYBN25C");document.addEventListener("click",t=>{const e=document.getElementById("astro-header-drawer"),n=document.getElementById("astro-header-drawer-button");e?.contains(t.target)||n?.contains(t.target)?e?.classList.toggle("translate-x-96"):e?.classList.add("translate-x-96")});const Fe="astro:before-preparation",qe="astro:after-preparation",$e="astro:before-swap",Ne="astro:after-swap",Ue=t=>document.dispatchEvent(new Event(t));class kt extends Event{from;to;direction;navigationType;sourceElement;info;newDocument;constructor(e,n,r,i,s,o,c,a,f){super(e,n),this.from=r,this.to=i,this.direction=s,this.navigationType=o,this.sourceElement=c,this.info=a,this.newDocument=f,Object.defineProperties(this,{from:{enumerable:!0},to:{enumerable:!0,writable:!0},direction:{enumerable:!0,writable:!0},navigationType:{enumerable:!0},sourceElement:{enumerable:!0},info:{enumerable:!0},newDocument:{enumerable:!0,writable:!0}})}}class Ve extends kt{formData;loader;constructor(e,n,r,i,s,o,c,a,f){super(Fe,{cancelable:!0},e,n,r,i,s,o,c),this.formData=a,this.loader=f.bind(this,this),Object.defineProperties(this,{formData:{enumerable:!0},loader:{enumerable:!0,writable:!0}})}}class Be extends kt{direction;viewTransition;swap;constructor(e,n,r){super($e,void 0,e.from,e.to,e.direction,e.navigationType,e.sourceElement,e.info,e.newDocument),this.direction=e.direction,this.viewTransition=n,this.swap=r.bind(this,this),Object.defineProperties(this,{direction:{enumerable:!0},viewTransition:{enumerable:!0},swap:{enumerable:!0,writable:!0}})}}async function He(t,e,n,r,i,s,o,c){const a=new Ve(t,e,n,r,i,s,window.document,o,c);return document.dispatchEvent(a)&&(await a.loader(),a.defaultPrevented||(Ue(qe),a.navigationType!=="traverse"&&rt({scrollX,scrollY}))),a}async function je(t,e,n){const r=new Be(t,e,n);return document.dispatchEvent(r),r.swap(),r}const We=history.pushState.bind(history),nt=history.replaceState.bind(history),rt=t=>{history.state&&(history.scrollRestoration="manual",nt({...history.state,...t},""))},it=!!document.startViewTransition,st=()=>!!document.querySelector('[name="astro-view-transitions-enabled"]'),_t=(t,e)=>t.pathname===e.pathname&&t.search===e.search;let X,P,H=!1,Ct;const Ft=t=>document.dispatchEvent(new Event(t)),qt=()=>Ft("astro:page-load"),Xe=()=>{let t=document.createElement("div");t.setAttribute("aria-live","assertive"),t.setAttribute("aria-atomic","true"),t.className="astro-route-announcer",document.body.append(t),setTimeout(()=>{let e=document.title||document.querySelector("h1")?.textContent||location.pathname;t.textContent=e},60)},A="data-astro-transition-persist",$t="data-astro-transition",Nt="data-astro-transition-fallback";let mt,F=0;history.state?(F=history.state.index,scrollTo({left:history.state.scrollX,top:history.state.scrollY})):st()&&(nt({index:F,scrollX,scrollY},""),history.scrollRestoration="manual");const Ye=(t,e)=>{let n=!1,r=!1;return(...i)=>{if(n){r=!0;return}t(...i),n=!0,setTimeout(()=>{r&&(r=!1,t(...i)),n=!1},e)}};async function ze(t,e){try{const n=await fetch(t,e),i=(n.headers.get("content-type")??"").split(";",1)[0].trim();return i!=="text/html"&&i!=="application/xhtml+xml"?null:{html:await n.text(),redirected:n.redirected?n.url:void 0,mediaType:i}}catch{return null}}function Ut(){const t=document.querySelector('[name="astro-view-transitions-fallback"]');return t?t.getAttribute("content"):"animate"}function Ke(){let t=Promise.resolve();for(const e of Array.from(document.scripts)){if(e.dataset.astroExec==="")continue;const n=document.createElement("script");n.innerHTML=e.innerHTML;for(const r of e.attributes){if(r.name==="src"){const i=new Promise(s=>{n.onload=s});t=t.then(()=>i)}n.setAttribute(r.name,r.value)}n.dataset.astroExec="",e.replaceWith(n)}return t}const Vt=(t,e,n,r)=>{const i=_t(e,t);let s=!1;if(t.href!==location.href&&!r)if(n.history==="replace"){const o=history.state;nt({...n.state,index:o.index,scrollX:o.scrollX,scrollY:o.scrollY},"",t.href)}else We({...n.state,index:++F,scrollX:0,scrollY:0},"",t.href);X=t,i||(scrollTo({left:0,top:0,behavior:"instant"}),s=!0),r?scrollTo(r.scrollX,r.scrollY):(t.hash?(history.scrollRestoration="auto",location.href=t.href):s||scrollTo({left:0,top:0,behavior:"instant"}),history.scrollRestoration="manual")};function Ge(t){const e=[];for(const n of t.querySelectorAll("head link[rel=stylesheet]"))if(!document.querySelector(`[${A}="${n.getAttribute(A)}"], link[rel=stylesheet][href="${n.getAttribute("href")}"]`)){const r=document.createElement("link");r.setAttribute("rel","preload"),r.setAttribute("as","style"),r.setAttribute("href",n.getAttribute("href")),e.push(new Promise(i=>{["load","error"].forEach(s=>r.addEventListener(s,i)),document.head.append(r)}))}return e}async function pt(t,e,n,r){const i=(l,d)=>{const u=l.getAttribute(A),p=u&&d.head.querySelector(`[${A}="${u}"]`);if(p)return p;if(l.matches("link[rel=stylesheet]")){const v=l.getAttribute("href");return d.head.querySelector(`link[rel=stylesheet][href="${v}"]`)}return null},s=()=>{const l=document.activeElement;if(l?.closest(`[${A}]`)){if(l instanceof HTMLInputElement||l instanceof HTMLTextAreaElement){const d=l.selectionStart,u=l.selectionEnd;return{activeElement:l,start:d,end:u}}return{activeElement:l}}else return{activeElement:null}},o=({activeElement:l,start:d,end:u})=>{l&&(l.focus(),(l instanceof HTMLInputElement||l instanceof HTMLTextAreaElement)&&(l.selectionStart=d,l.selectionEnd=u))},c=l=>{const d=document.documentElement,u=[...d.attributes].filter(({name:h})=>(d.removeAttribute(h),h.startsWith("data-astro-")));[...l.newDocument.documentElement.attributes,...u].forEach(({name:h,value:m})=>d.setAttribute(h,m));for(const h of document.scripts)for(const m of l.newDocument.scripts)if(!h.src&&h.textContent===m.textContent||h.src&&h.type===m.type&&h.src===m.src){m.dataset.astroExec="";break}for(const h of Array.from(document.head.children)){const m=i(h,l.newDocument);m?m.remove():h.remove()}document.head.append(...l.newDocument.head.children);const p=document.body,v=s();document.body.replaceWith(l.newDocument.body);for(const h of p.querySelectorAll(`[${A}]`)){const m=h.getAttribute(A),T=document.querySelector(`[${A}="${m}"]`);T&&T.replaceWith(h)}o(v)};async function a(l){function d(h){const m=h.effect;return!m||!(m instanceof KeyframeEffect)||!m.target?!1:window.getComputedStyle(m.target,m.pseudoElement).animationIterationCount==="infinite"}const u=document.getAnimations();document.documentElement.setAttribute(Nt,l);const v=document.getAnimations().filter(h=>!u.includes(h)&&!d(h));return Promise.all(v.map(h=>h.finished))}if(!H)document.documentElement.setAttribute($t,t.direction),r==="animate"&&await a("old");else throw new DOMException("Transition was skipped");const f=await je(t,P,c);Vt(f.to,f.from,e,n),Ft(Ne),r==="animate"&&!H&&a("new").then(()=>Ct())}async function Bt(t,e,n,r,i){if(!st()||location.origin!==n.origin){location.href=n.href;return}const s=i?"traverse":r.history==="replace"?"replace":"push";if(s!=="traverse"&&rt({scrollX,scrollY}),_t(e,n)&&n.hash){Vt(n,e,r,i);return}const o=await He(e,n,t,s,r.sourceElement,r.info,r.formData,c);if(o.defaultPrevented){location.href=n.href;return}async function c(a){const f=a.to.href,l={};if(a.formData){l.method="POST";const p=a.sourceElement instanceof HTMLFormElement?a.sourceElement:a.sourceElement instanceof HTMLElement&&"form"in a.sourceElement?a.sourceElement.form:a.sourceElement?.closest("form");l.body=p?.attributes.getNamedItem("enctype")?.value==="application/x-www-form-urlencoded"?new URLSearchParams(a.formData):a.formData}const d=await ze(f,l);if(d===null){a.preventDefault();return}if(d.redirected&&(a.to=new URL(d.redirected)),mt??=new DOMParser,a.newDocument=mt.parseFromString(d.html,d.mediaType),a.newDocument.querySelectorAll("noscript").forEach(p=>p.remove()),!a.newDocument.querySelector('[name="astro-view-transitions-enabled"]')&&!a.formData){a.preventDefault();return}const u=Ge(a.newDocument);u.length&&await Promise.all(u)}if(H=!1,it)P=document.startViewTransition(async()=>await pt(o,r,i));else{const a=(async()=>{await new Promise(f=>setTimeout(f)),await pt(o,r,i,Ut())})();P={updateCallbackDone:a,ready:a,finished:new Promise(f=>Ct=f),skipTransition:()=>{H=!0}}}P.ready.then(async()=>{await Ke(),qt(),Xe()}),P.finished.then(()=>{document.documentElement.removeAttribute($t),document.documentElement.removeAttribute(Nt)}),await P.ready}async function gt(t,e){await Bt("forward",X,new URL(t,location.href),e??{})}function Ze(t){if(!st()&&t.state){location.reload();return}if(t.state===null)return;const e=history.state,n=e.index,r=n>F?"forward":"back";F=n,Bt(r,X,new URL(location.href),{},e)}const yt=()=>{rt({scrollX,scrollY})};{(it||Ut()!=="none")&&(X=new URL(location.href),addEventListener("popstate",Ze),addEventListener("load",qt),"onscrollend"in window?addEventListener("scrollend",yt):addEventListener("scroll",Ye(yt,350),{passive:!0}));for(const t of document.scripts)t.dataset.astroExec=""}const Ht=new Set,j=new WeakSet;let Q,jt,wt=!1;function Je(t){wt||(wt=!0,Q??=t?.prefetchAll??!1,jt??=t?.defaultStrategy??"hover",Qe(),tn(),en())}function Qe(){for(const t of["touchstart","mousedown"])document.body.addEventListener(t,e=>{W(e.target,"tap")&&ot(e.target.href,{with:"fetch",ignoreSlowConnection:!0})},{passive:!0})}function tn(){let t;document.body.addEventListener("focusin",r=>{W(r.target,"hover")&&e(r)},{passive:!0}),document.body.addEventListener("focusout",n,{passive:!0}),Xt(()=>{for(const r of document.getElementsByTagName("a"))j.has(r)||W(r,"hover")&&(j.add(r),r.addEventListener("mouseenter",e,{passive:!0}),r.addEventListener("mouseleave",n,{passive:!0}))});function e(r){const i=r.target.href;t&&clearTimeout(t),t=setTimeout(()=>{ot(i,{with:"fetch"})},80)}function n(){t&&(clearTimeout(t),t=0)}}function en(){let t;Xt(()=>{for(const e of document.getElementsByTagName("a"))j.has(e)||W(e,"viewport")&&(j.add(e),t??=nn(),t.observe(e))})}function nn(){const t=new WeakMap;return new IntersectionObserver((e,n)=>{for(const r of e){const i=r.target,s=t.get(i);r.isIntersecting?(s&&clearTimeout(s),t.set(i,setTimeout(()=>{n.unobserve(i),t.delete(i),ot(i.href,{with:"link"})},300))):s&&(clearTimeout(s),t.delete(i))}})}function ot(t,e){const n=e?.ignoreSlowConnection??!1;if(!rn(t,n))return;if(Ht.add(t),(e?.with??"link")==="link"){const i=document.createElement("link");i.rel="prefetch",i.setAttribute("href",t),document.head.append(i)}else fetch(t).catch(i=>{console.log(`[astro] Failed to prefetch ${t}`),console.error(i)})}function rn(t,e){if(!navigator.onLine||!e&&Wt())return!1;try{const n=new URL(t,location.href);return location.origin===n.origin&&(location.pathname!==n.pathname||location.search!==n.search)&&!Ht.has(t)}catch{}return!1}function W(t,e){if(t?.tagName!=="A")return!1;const n=t.dataset.astroPrefetch;return n==="false"?!1:e==="tap"&&(n!=null||Q)&&Wt()?!0:n==null&&Q||n===""?e===jt:n===e}function Wt(){if("connection"in navigator){const t=navigator.connection;return t.saveData||/(2|3)g/.test(t.effectiveType)}return!1}function Xt(t){t();let e=!1;document.addEventListener("astro:page-load",()=>{if(!e){e=!0;return}t()})}function sn(){const t=document.querySelector('[name="astro-view-transitions-fallback"]');return t?t.getAttribute("content"):"animate"}function vt(t){return t.dataset.astroReload!==void 0}(it||sn()!=="none")&&(document.addEventListener("click",t=>{let e=t.target;if(e instanceof Element&&(e=e.closest("a, area")),!(e instanceof HTMLAnchorElement)&&!(e instanceof SVGAElement)&&!(e instanceof HTMLAreaElement))return;const n=e instanceof HTMLElement?e.target:e.target.baseVal,r=e instanceof HTMLElement?e.href:e.href.baseVal,i=new URL(r,location.href).origin;vt(e)||e.hasAttribute("download")||!e.href||n&&n!=="_self"||i!==location.origin||t.button!==0||t.metaKey||t.ctrlKey||t.altKey||t.shiftKey||t.defaultPrevented||(t.preventDefault(),gt(r,{history:e.dataset.astroHistory==="replace"?"replace":"auto",sourceElement:e}))}),document.addEventListener("submit",t=>{let e=t.target;if(e.tagName!=="FORM"||t.defaultPrevented||vt(e))return;const n=e,r=t.submitter,i=new FormData(n,r);let s=r?.getAttribute("formaction")??n.action??location.pathname;const o=r?.getAttribute("formmethod")??n.method;if(o==="dialog")return;const c={sourceElement:r??n};if(o==="get"){const a=new URLSearchParams(i),f=new URL(s);f.search=a.toString(),s=f.toString()}else c.formData=i;t.preventDefault(),gt(s,c)}),Je({prefetchAll:!0}));class on extends HTMLElement{constructor(){super();const e=this.querySelector("button");e&&e.addEventListener("click",n=>{if(n.currentTarget instanceof HTMLButtonElement){let r=n.currentTarget.getAttribute("aria-pressed")==="true",i=new CustomEvent("theme-change",{detail:{theme:r?"light":"dark"}});document.dispatchEvent(i),e.setAttribute("aria-pressed",String(!r))}})}}"customElements"in window&&customElements.define("theme-toggle",on);const an="modulepreload",cn=function(t){return"/"+t},bt={},ln=function(e,n,r){let i=Promise.resolve();if(n&&n.length>0){const s=document.getElementsByTagName("link");i=Promise.all(n.map(o=>{if(o=cn(o),o in bt)return;bt[o]=!0;const c=o.endsWith(".css"),a=c?'[rel="stylesheet"]':"";if(!!r)for(let d=s.length-1;d>=0;d--){const u=s[d];if(u.href===o&&(!c||u.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${o}"]${a}`))return;const l=document.createElement("link");if(l.rel=c?"stylesheet":an,c||(l.as="script",l.crossOrigin=""),l.href=o,document.head.appendChild(l),c)return new Promise((d,u)=>{l.addEventListener("load",d),l.addEventListener("error",()=>u(new Error(`Unable to preload CSS for ${o}`)))})}))}return i.then(()=>e()).catch(s=>{const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=s,window.dispatchEvent(o),!o.defaultPrevented)throw s})};class un extends HTMLElement{constructor(){super();const e=this.querySelector("button[data-open-modal]"),n=this.querySelector("button[data-close-modal]"),r=this.querySelector("dialog"),i=this.querySelector(".dialog-frame"),s=a=>{document.body.contains(a.target)&&!i.contains(a.target)&&c()},o=a=>{r.showModal(),_e("dialog",{clipPath:["polygon(0 0, 100% 0, 100% -200%, -200% -200%)","polygon(0 0, 100% 0, 100% 100%, 0% 100%)"],opacity:[0,1]},{duration:.2}),document.body.classList.add("overflow-hidden"),this.querySelector("input")?.focus(),a?.stopPropagation(),window.addEventListener("click",s)},c=()=>{r.close(),document.body.classList.remove("overflow-hidden"),window.removeEventListener("click",s)};e.addEventListener("click",o),e.disabled=!1,n.addEventListener("click",c),document.addEventListener("astro:after-swap",c),window.addEventListener("keydown",a=>{a.key==="/"&&!r.open&&(o(),a.preventDefault())}),window.addEventListener("DOMContentLoaded",()=>{(window.requestIdleCallback||(f=>setTimeout(f,1)))(async()=>{const{PagefindUI:f}=await ln(()=>import("./ui-core.CmflySsl.js"),__vite__mapDeps([]));new f({element:"#pagefind__search",baseUrl:"/",bundlePath:"/".replace(/\/$/,"")+"/pagefind/",showImages:!1})})})}}customElements.define("site-search",un);export{ln as _,_e as a};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = []
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}