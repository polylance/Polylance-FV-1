const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./add-CLuVHoSf.js","./lit-Cbk7b9dC.js","./all-wallets-wIhatMe6.js","./arrow-bottom-circle-Dswj_waw.js","./app-store-hGcQuXuw.js","./apple-C0VxC4k3.js","./arrow-bottom-2yP1BMUN.js","./arrow-left-DltQmZr2.js","./arrow-right-DsgEpDae.js","./arrow-top-CXtd4YgM.js","./bank-BqcdhrTp.js","./browser-DEu0oHfK.js","./card-DHRZlOa5.js","./checkmark-B3r8pfRE.js","./checkmark-bold-BHm4dkJp.js","./chevron-bottom-D41j6X80.js","./chevron-left-C34capWw.js","./chevron-right-DpTVDfRV.js","./chevron-top-CVAMxc1r.js","./chrome-store-DQgkO4BA.js","./clock-CdXh9RYd.js","./close-Dm2h5qaI.js","./compass-5YJSTtgI.js","./coinPlaceholder-D7Yb0aqx.js","./copy-B5ZKbSF6.js","./cursor-CIi3Tc5J.js","./cursor-transparent-5vo-Nqx6.js","./desktop-BUt2Y06Q.js","./disconnect-71ekTa-J.js","./discord-BgKtlYD7.js","./etherscan-DYFuRh1l.js","./extension-Bb_5luaK.js","./external-link-U3SedUT1.js","./facebook-B3h2X5vK.js","./farcaster-CoKCGXxH.js","./filters-DNELJvKj.js","./github-B9ZQALLz.js","./google-CV40Rrfe.js","./help-circle-BPhIX3_i.js","./image-CVfuS7Wj.js","./id-CnPwqYaU.js","./info-circle-CtTz1QAM.js","./lightbulb-71jSqfK8.js","./mail-DX8xmDqm.js","./mobile-BcKYu_z6.js","./more-DjXmcrlt.js","./network-placeholder-EPpztwyW.js","./nftPlaceholder-vHh0rzYT.js","./off-Lk9YPPjs.js","./play-store-C1QTaN0X.js","./plus-GqQpFucy.js","./qr-code-Cg99VPAy.js","./recycle-horizontal-DzGaaNzj.js","./refresh-DHnjnHZF.js","./search-BTOQpQWn.js","./send-Hj1hKNfu.js","./swapHorizontal-DkowK7wL.js","./swapHorizontalMedium-CnRrXFzs.js","./swapHorizontalBold-C3tqwr65.js","./swapHorizontalRoundedBold-DdBR8alE.js","./swapVertical-k_aglWkg.js","./telegram-DYRcKwK0.js","./three-dots-CjKMbRFK.js","./twitch-CzM2naON.js","./x-BK49ThEl.js","./twitterIcon-C5lnnxem.js","./verify-RqU1ENDG.js","./verify-filled-Dt6RuObi.js","./wallet-DNI_KDHi.js","./walletconnect-yTQc7b5S.js","./wallet-placeholder-CP8pqzGZ.js","./warning-circle-BhjJDK4N.js","./info-BC5-WzYM.js","./exclamation-triangle-pRrlpli2.js","./reown-logo-D0jYegE-.js"])))=>i.map(i=>d[i]);
import{t as e}from"./preload-helper-HclGiUj8.js";import{a as t,c as n,i as r,l as i,n as a,r as o,s,t as c}from"./lit-Cbk7b9dC.js";import{a as l,n as u,r as d}from"./ConstantsUtil-BQ-sc-2m.js";var ee={attribute:!0,type:String,converter:n,reflect:!1,hasChanged:s},f=(e=ee,t,n)=>{let{kind:r,metadata:i}=n,a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=new Map),r===`setter`&&((e=Object.create(e)).wrapped=!0),a.set(n.name,e),r===`accessor`){let{name:r}=n;return{set(n){let i=t.get.call(this);t.set.call(this,n),this.requestUpdate(r,i,e,!0,n)},init(t){return t!==void 0&&this.C(r,void 0,e,t),t}}}if(r===`setter`){let{name:r}=n;return function(n){let i=this[r];t.call(this,n),this.requestUpdate(r,i,e,!0,n)}}throw Error(`Unsupported decorator location: `+r)};function p(e){return(t,n)=>typeof n==`object`?f(e,t,n):((e,t,n)=>{let r=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),r?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}function m(e){return p({...e,state:!0,attribute:!1})}var h={getSpacingStyles(e,t){if(Array.isArray(e))return e[t]?`var(--wui-spacing-${e[t]})`:void 0;if(typeof e==`string`)return`var(--wui-spacing-${e})`},getFormattedDate(e){return new Intl.DateTimeFormat(`en-US`,{month:`short`,day:`numeric`}).format(e)},getHostName(e){try{return new URL(e).hostname}catch{return``}},getTruncateString({string:e,charsStart:t,charsEnd:n,truncate:r}){return e.length<=t+n?e:r===`end`?`${e.substring(0,t)}...`:r===`start`?`...${e.substring(e.length-n)}`:`${e.substring(0,Math.floor(t))}...${e.substring(e.length-Math.floor(n))}`},generateAvatarColors(e){let t=e.toLowerCase().replace(/^0x/iu,``).replace(/[^a-f0-9]/gu,``).substring(0,6).padEnd(6,`0`),n=this.hexToRgb(t),r=getComputedStyle(document.documentElement).getPropertyValue(`--w3m-border-radius-master`),i=100-3*Number(r?.replace(`px`,``)),a=`${i}% ${i}% at 65% 40%`,o=[];for(let e=0;e<5;e+=1){let t=this.tintColor(n,.15*e);o.push(`rgb(${t[0]}, ${t[1]}, ${t[2]})`)}return`
    --local-color-1: ${o[0]};
    --local-color-2: ${o[1]};
    --local-color-3: ${o[2]};
    --local-color-4: ${o[3]};
    --local-color-5: ${o[4]};
    --local-radial-circle: ${a}
   `},hexToRgb(e){let t=parseInt(e,16);return[t>>16&255,t>>8&255,t&255]},tintColor(e,t){let[n,r,i]=e;return[Math.round(n+(255-n)*t),Math.round(r+(255-r)*t),Math.round(i+(255-i)*t)]},isNumber(e){return{number:/^[0-9]+$/u}.number.test(e)},getColorTheme(e){return e||(typeof window<`u`&&window.matchMedia?window.matchMedia(`(prefers-color-scheme: dark)`)?.matches?`dark`:`light`:`dark`)},splitBalance(e){let t=e.split(`.`);return t.length===2?[t[0],t[1]]:[`0`,`00`]},roundNumber(e,t,n){return e.toString().length>=t?Number(e).toFixed(n):e},formatNumberToLocalString(e,t=2){return e===void 0?`0.00`:typeof e==`number`?e.toLocaleString(`en-US`,{maximumFractionDigits:t,minimumFractionDigits:t}):parseFloat(e).toLocaleString(`en-US`,{maximumFractionDigits:t,minimumFractionDigits:t})}};function g(e,t){let{kind:n,elements:r}=t;return{kind:n,elements:r,finisher(t){customElements.get(e)||customElements.define(e,t)}}}function _(e,t){return customElements.get(e)||customElements.define(e,t),t}function v(e){return function(t){return typeof t==`function`?_(e,t):g(e,t)}}var te=i`
  :host {
    display: flex;
    width: inherit;
    height: inherit;
  }
`,y=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},b=class extends c{render(){return this.style.cssText=`
      flex-direction: ${this.flexDirection};
      flex-wrap: ${this.flexWrap};
      flex-basis: ${this.flexBasis};
      flex-grow: ${this.flexGrow};
      flex-shrink: ${this.flexShrink};
      align-items: ${this.alignItems};
      justify-content: ${this.justifyContent};
      column-gap: ${this.columnGap&&`var(--wui-spacing-${this.columnGap})`};
      row-gap: ${this.rowGap&&`var(--wui-spacing-${this.rowGap})`};
      gap: ${this.gap&&`var(--wui-spacing-${this.gap})`};
      padding-top: ${this.padding&&h.getSpacingStyles(this.padding,0)};
      padding-right: ${this.padding&&h.getSpacingStyles(this.padding,1)};
      padding-bottom: ${this.padding&&h.getSpacingStyles(this.padding,2)};
      padding-left: ${this.padding&&h.getSpacingStyles(this.padding,3)};
      margin-top: ${this.margin&&h.getSpacingStyles(this.margin,0)};
      margin-right: ${this.margin&&h.getSpacingStyles(this.margin,1)};
      margin-bottom: ${this.margin&&h.getSpacingStyles(this.margin,2)};
      margin-left: ${this.margin&&h.getSpacingStyles(this.margin,3)};
    `,r`<slot></slot>`}};b.styles=[l,te],y([p()],b.prototype,`flexDirection`,void 0),y([p()],b.prototype,`flexWrap`,void 0),y([p()],b.prototype,`flexBasis`,void 0),y([p()],b.prototype,`flexGrow`,void 0),y([p()],b.prototype,`flexShrink`,void 0),y([p()],b.prototype,`alignItems`,void 0),y([p()],b.prototype,`justifyContent`,void 0),y([p()],b.prototype,`columnGap`,void 0),y([p()],b.prototype,`rowGap`,void 0),y([p()],b.prototype,`gap`,void 0),y([p()],b.prototype,`padding`,void 0),y([p()],b.prototype,`margin`,void 0),b=y([v(`wui-flex`)],b);var ne=e=>e??a,{I:re}=t,x=e=>e===null||typeof e!=`object`&&typeof e!=`function`,ie=e=>e.strings===void 0,S={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},C=e=>(...t)=>({_$litDirective$:e,values:t}),w=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,n){this._$Ct=e,this._$AM=t,this._$Ci=n}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}},T=(e,t)=>{let n=e._$AN;if(n===void 0)return!1;for(let e of n)e._$AO?.(t,!1),T(e,t);return!0},E=e=>{let t,n;do{if((t=e._$AM)===void 0)break;n=t._$AN,n.delete(e),e=t}while(n?.size===0)},D=e=>{for(let t;t=e._$AM;e=t){let n=t._$AN;if(n===void 0)t._$AN=n=new Set;else if(n.has(e))break;n.add(e),A(t)}};function O(e){this._$AN===void 0?this._$AM=e:(E(this),this._$AM=e,D(this))}function k(e,t=!1,n=0){let r=this._$AH,i=this._$AN;if(i!==void 0&&i.size!==0)if(t)if(Array.isArray(r))for(let e=n;e<r.length;e++)T(r[e],!1),E(r[e]);else r!=null&&(T(r,!1),E(r));else T(this,e)}var A=e=>{e.type==S.CHILD&&(e._$AP??=k,e._$AQ??=O)},j=class extends w{constructor(){super(...arguments),this._$AN=void 0}_$AT(e,t,n){super._$AT(e,t,n),D(this),this.isConnected=e._$AU}_$AO(e,t=!0){e!==this.isConnected&&(this.isConnected=e,e?this.reconnected?.():this.disconnected?.()),t&&(T(this,e),E(this))}setValue(e){if(ie(this._$Ct))this._$Ct._$AI(e,this);else{let t=[...this._$Ct._$AH];t[this._$Ci]=e,this._$Ct._$AI(t,this,0)}}disconnected(){}reconnected(){}},ae=class{constructor(e){this.G=e}disconnect(){this.G=void 0}reconnect(e){this.G=e}deref(){return this.G}},oe=class{constructor(){this.Y=void 0,this.Z=void 0}get(){return this.Y}pause(){this.Y??=new Promise(e=>this.Z=e)}resume(){this.Z?.(),this.Y=this.Z=void 0}},M=e=>!x(e)&&typeof e.then==`function`,N=1073741823,P=C(class extends j{constructor(){super(...arguments),this._$Cwt=N,this._$Cbt=[],this._$CK=new ae(this),this._$CX=new oe}render(...e){return e.find(e=>!M(e))??o}update(e,t){let n=this._$Cbt,r=n.length;this._$Cbt=t;let i=this._$CK,a=this._$CX;this.isConnected||this.disconnected();for(let e=0;e<t.length&&!(e>this._$Cwt);e++){let o=t[e];if(!M(o))return this._$Cwt=e,o;e<r&&o===n[e]||(this._$Cwt=N,r=0,Promise.resolve(o).then(async e=>{for(;a.get();)await a.get();let t=i.deref();if(t!==void 0){let n=t._$Cbt.indexOf(o);n>-1&&n<t._$Cwt&&(t._$Cwt=n,t.setValue(e))}}))}return o}disconnected(){this._$CK.disconnect(),this._$CX.pause()}reconnected(){this._$CK.reconnect(this),this._$CX.resume()}}),F=new class{constructor(){this.cache=new Map}set(e,t){this.cache.set(e,t)}get(e){return this.cache.get(e)}has(e){return this.cache.has(e)}delete(e){this.cache.delete(e)}clear(){this.cache.clear()}},I=i`
  :host {
    display: flex;
    aspect-ratio: var(--local-aspect-ratio);
    color: var(--local-color);
    width: var(--local-width);
  }

  svg {
    width: inherit;
    height: inherit;
    object-fit: contain;
    object-position: center;
  }

  .fallback {
    width: var(--local-width);
    height: var(--local-height);
  }
`,L=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},R={add:async()=>(await e(async()=>{let{addSvg:e}=await import(`./add-CLuVHoSf.js`);return{addSvg:e}},__vite__mapDeps([0,1]),import.meta.url)).addSvg,allWallets:async()=>(await e(async()=>{let{allWalletsSvg:e}=await import(`./all-wallets-wIhatMe6.js`);return{allWalletsSvg:e}},__vite__mapDeps([2,1]),import.meta.url)).allWalletsSvg,arrowBottomCircle:async()=>(await e(async()=>{let{arrowBottomCircleSvg:e}=await import(`./arrow-bottom-circle-Dswj_waw.js`);return{arrowBottomCircleSvg:e}},__vite__mapDeps([3,1]),import.meta.url)).arrowBottomCircleSvg,appStore:async()=>(await e(async()=>{let{appStoreSvg:e}=await import(`./app-store-hGcQuXuw.js`);return{appStoreSvg:e}},__vite__mapDeps([4,1]),import.meta.url)).appStoreSvg,apple:async()=>(await e(async()=>{let{appleSvg:e}=await import(`./apple-C0VxC4k3.js`);return{appleSvg:e}},__vite__mapDeps([5,1]),import.meta.url)).appleSvg,arrowBottom:async()=>(await e(async()=>{let{arrowBottomSvg:e}=await import(`./arrow-bottom-2yP1BMUN.js`);return{arrowBottomSvg:e}},__vite__mapDeps([6,1]),import.meta.url)).arrowBottomSvg,arrowLeft:async()=>(await e(async()=>{let{arrowLeftSvg:e}=await import(`./arrow-left-DltQmZr2.js`);return{arrowLeftSvg:e}},__vite__mapDeps([7,1]),import.meta.url)).arrowLeftSvg,arrowRight:async()=>(await e(async()=>{let{arrowRightSvg:e}=await import(`./arrow-right-DsgEpDae.js`);return{arrowRightSvg:e}},__vite__mapDeps([8,1]),import.meta.url)).arrowRightSvg,arrowTop:async()=>(await e(async()=>{let{arrowTopSvg:e}=await import(`./arrow-top-CXtd4YgM.js`);return{arrowTopSvg:e}},__vite__mapDeps([9,1]),import.meta.url)).arrowTopSvg,bank:async()=>(await e(async()=>{let{bankSvg:e}=await import(`./bank-BqcdhrTp.js`);return{bankSvg:e}},__vite__mapDeps([10,1]),import.meta.url)).bankSvg,browser:async()=>(await e(async()=>{let{browserSvg:e}=await import(`./browser-DEu0oHfK.js`);return{browserSvg:e}},__vite__mapDeps([11,1]),import.meta.url)).browserSvg,card:async()=>(await e(async()=>{let{cardSvg:e}=await import(`./card-DHRZlOa5.js`);return{cardSvg:e}},__vite__mapDeps([12,1]),import.meta.url)).cardSvg,checkmark:async()=>(await e(async()=>{let{checkmarkSvg:e}=await import(`./checkmark-B3r8pfRE.js`);return{checkmarkSvg:e}},__vite__mapDeps([13,1]),import.meta.url)).checkmarkSvg,checkmarkBold:async()=>(await e(async()=>{let{checkmarkBoldSvg:e}=await import(`./checkmark-bold-BHm4dkJp.js`);return{checkmarkBoldSvg:e}},__vite__mapDeps([14,1]),import.meta.url)).checkmarkBoldSvg,chevronBottom:async()=>(await e(async()=>{let{chevronBottomSvg:e}=await import(`./chevron-bottom-D41j6X80.js`);return{chevronBottomSvg:e}},__vite__mapDeps([15,1]),import.meta.url)).chevronBottomSvg,chevronLeft:async()=>(await e(async()=>{let{chevronLeftSvg:e}=await import(`./chevron-left-C34capWw.js`);return{chevronLeftSvg:e}},__vite__mapDeps([16,1]),import.meta.url)).chevronLeftSvg,chevronRight:async()=>(await e(async()=>{let{chevronRightSvg:e}=await import(`./chevron-right-DpTVDfRV.js`);return{chevronRightSvg:e}},__vite__mapDeps([17,1]),import.meta.url)).chevronRightSvg,chevronTop:async()=>(await e(async()=>{let{chevronTopSvg:e}=await import(`./chevron-top-CVAMxc1r.js`);return{chevronTopSvg:e}},__vite__mapDeps([18,1]),import.meta.url)).chevronTopSvg,chromeStore:async()=>(await e(async()=>{let{chromeStoreSvg:e}=await import(`./chrome-store-DQgkO4BA.js`);return{chromeStoreSvg:e}},__vite__mapDeps([19,1]),import.meta.url)).chromeStoreSvg,clock:async()=>(await e(async()=>{let{clockSvg:e}=await import(`./clock-CdXh9RYd.js`);return{clockSvg:e}},__vite__mapDeps([20,1]),import.meta.url)).clockSvg,close:async()=>(await e(async()=>{let{closeSvg:e}=await import(`./close-Dm2h5qaI.js`);return{closeSvg:e}},__vite__mapDeps([21,1]),import.meta.url)).closeSvg,compass:async()=>(await e(async()=>{let{compassSvg:e}=await import(`./compass-5YJSTtgI.js`);return{compassSvg:e}},__vite__mapDeps([22,1]),import.meta.url)).compassSvg,coinPlaceholder:async()=>(await e(async()=>{let{coinPlaceholderSvg:e}=await import(`./coinPlaceholder-D7Yb0aqx.js`);return{coinPlaceholderSvg:e}},__vite__mapDeps([23,1]),import.meta.url)).coinPlaceholderSvg,copy:async()=>(await e(async()=>{let{copySvg:e}=await import(`./copy-B5ZKbSF6.js`);return{copySvg:e}},__vite__mapDeps([24,1]),import.meta.url)).copySvg,cursor:async()=>(await e(async()=>{let{cursorSvg:e}=await import(`./cursor-CIi3Tc5J.js`);return{cursorSvg:e}},__vite__mapDeps([25,1]),import.meta.url)).cursorSvg,cursorTransparent:async()=>(await e(async()=>{let{cursorTransparentSvg:e}=await import(`./cursor-transparent-5vo-Nqx6.js`);return{cursorTransparentSvg:e}},__vite__mapDeps([26,1]),import.meta.url)).cursorTransparentSvg,desktop:async()=>(await e(async()=>{let{desktopSvg:e}=await import(`./desktop-BUt2Y06Q.js`);return{desktopSvg:e}},__vite__mapDeps([27,1]),import.meta.url)).desktopSvg,disconnect:async()=>(await e(async()=>{let{disconnectSvg:e}=await import(`./disconnect-71ekTa-J.js`);return{disconnectSvg:e}},__vite__mapDeps([28,1]),import.meta.url)).disconnectSvg,discord:async()=>(await e(async()=>{let{discordSvg:e}=await import(`./discord-BgKtlYD7.js`);return{discordSvg:e}},__vite__mapDeps([29,1]),import.meta.url)).discordSvg,etherscan:async()=>(await e(async()=>{let{etherscanSvg:e}=await import(`./etherscan-DYFuRh1l.js`);return{etherscanSvg:e}},__vite__mapDeps([30,1]),import.meta.url)).etherscanSvg,extension:async()=>(await e(async()=>{let{extensionSvg:e}=await import(`./extension-Bb_5luaK.js`);return{extensionSvg:e}},__vite__mapDeps([31,1]),import.meta.url)).extensionSvg,externalLink:async()=>(await e(async()=>{let{externalLinkSvg:e}=await import(`./external-link-U3SedUT1.js`);return{externalLinkSvg:e}},__vite__mapDeps([32,1]),import.meta.url)).externalLinkSvg,facebook:async()=>(await e(async()=>{let{facebookSvg:e}=await import(`./facebook-B3h2X5vK.js`);return{facebookSvg:e}},__vite__mapDeps([33,1]),import.meta.url)).facebookSvg,farcaster:async()=>(await e(async()=>{let{farcasterSvg:e}=await import(`./farcaster-CoKCGXxH.js`);return{farcasterSvg:e}},__vite__mapDeps([34,1]),import.meta.url)).farcasterSvg,filters:async()=>(await e(async()=>{let{filtersSvg:e}=await import(`./filters-DNELJvKj.js`);return{filtersSvg:e}},__vite__mapDeps([35,1]),import.meta.url)).filtersSvg,github:async()=>(await e(async()=>{let{githubSvg:e}=await import(`./github-B9ZQALLz.js`);return{githubSvg:e}},__vite__mapDeps([36,1]),import.meta.url)).githubSvg,google:async()=>(await e(async()=>{let{googleSvg:e}=await import(`./google-CV40Rrfe.js`);return{googleSvg:e}},__vite__mapDeps([37,1]),import.meta.url)).googleSvg,helpCircle:async()=>(await e(async()=>{let{helpCircleSvg:e}=await import(`./help-circle-BPhIX3_i.js`);return{helpCircleSvg:e}},__vite__mapDeps([38,1]),import.meta.url)).helpCircleSvg,image:async()=>(await e(async()=>{let{imageSvg:e}=await import(`./image-CVfuS7Wj.js`);return{imageSvg:e}},__vite__mapDeps([39,1]),import.meta.url)).imageSvg,id:async()=>(await e(async()=>{let{idSvg:e}=await import(`./id-CnPwqYaU.js`);return{idSvg:e}},__vite__mapDeps([40,1]),import.meta.url)).idSvg,infoCircle:async()=>(await e(async()=>{let{infoCircleSvg:e}=await import(`./info-circle-CtTz1QAM.js`);return{infoCircleSvg:e}},__vite__mapDeps([41,1]),import.meta.url)).infoCircleSvg,lightbulb:async()=>(await e(async()=>{let{lightbulbSvg:e}=await import(`./lightbulb-71jSqfK8.js`);return{lightbulbSvg:e}},__vite__mapDeps([42,1]),import.meta.url)).lightbulbSvg,mail:async()=>(await e(async()=>{let{mailSvg:e}=await import(`./mail-DX8xmDqm.js`);return{mailSvg:e}},__vite__mapDeps([43,1]),import.meta.url)).mailSvg,mobile:async()=>(await e(async()=>{let{mobileSvg:e}=await import(`./mobile-BcKYu_z6.js`);return{mobileSvg:e}},__vite__mapDeps([44,1]),import.meta.url)).mobileSvg,more:async()=>(await e(async()=>{let{moreSvg:e}=await import(`./more-DjXmcrlt.js`);return{moreSvg:e}},__vite__mapDeps([45,1]),import.meta.url)).moreSvg,networkPlaceholder:async()=>(await e(async()=>{let{networkPlaceholderSvg:e}=await import(`./network-placeholder-EPpztwyW.js`);return{networkPlaceholderSvg:e}},__vite__mapDeps([46,1]),import.meta.url)).networkPlaceholderSvg,nftPlaceholder:async()=>(await e(async()=>{let{nftPlaceholderSvg:e}=await import(`./nftPlaceholder-vHh0rzYT.js`);return{nftPlaceholderSvg:e}},__vite__mapDeps([47,1]),import.meta.url)).nftPlaceholderSvg,off:async()=>(await e(async()=>{let{offSvg:e}=await import(`./off-Lk9YPPjs.js`);return{offSvg:e}},__vite__mapDeps([48,1]),import.meta.url)).offSvg,playStore:async()=>(await e(async()=>{let{playStoreSvg:e}=await import(`./play-store-C1QTaN0X.js`);return{playStoreSvg:e}},__vite__mapDeps([49,1]),import.meta.url)).playStoreSvg,plus:async()=>(await e(async()=>{let{plusSvg:e}=await import(`./plus-GqQpFucy.js`);return{plusSvg:e}},__vite__mapDeps([50,1]),import.meta.url)).plusSvg,qrCode:async()=>(await e(async()=>{let{qrCodeIcon:e}=await import(`./qr-code-Cg99VPAy.js`);return{qrCodeIcon:e}},__vite__mapDeps([51,1]),import.meta.url)).qrCodeIcon,recycleHorizontal:async()=>(await e(async()=>{let{recycleHorizontalSvg:e}=await import(`./recycle-horizontal-DzGaaNzj.js`);return{recycleHorizontalSvg:e}},__vite__mapDeps([52,1]),import.meta.url)).recycleHorizontalSvg,refresh:async()=>(await e(async()=>{let{refreshSvg:e}=await import(`./refresh-DHnjnHZF.js`);return{refreshSvg:e}},__vite__mapDeps([53,1]),import.meta.url)).refreshSvg,search:async()=>(await e(async()=>{let{searchSvg:e}=await import(`./search-BTOQpQWn.js`);return{searchSvg:e}},__vite__mapDeps([54,1]),import.meta.url)).searchSvg,send:async()=>(await e(async()=>{let{sendSvg:e}=await import(`./send-Hj1hKNfu.js`);return{sendSvg:e}},__vite__mapDeps([55,1]),import.meta.url)).sendSvg,swapHorizontal:async()=>(await e(async()=>{let{swapHorizontalSvg:e}=await import(`./swapHorizontal-DkowK7wL.js`);return{swapHorizontalSvg:e}},__vite__mapDeps([56,1]),import.meta.url)).swapHorizontalSvg,swapHorizontalMedium:async()=>(await e(async()=>{let{swapHorizontalMediumSvg:e}=await import(`./swapHorizontalMedium-CnRrXFzs.js`);return{swapHorizontalMediumSvg:e}},__vite__mapDeps([57,1]),import.meta.url)).swapHorizontalMediumSvg,swapHorizontalBold:async()=>(await e(async()=>{let{swapHorizontalBoldSvg:e}=await import(`./swapHorizontalBold-C3tqwr65.js`);return{swapHorizontalBoldSvg:e}},__vite__mapDeps([58,1]),import.meta.url)).swapHorizontalBoldSvg,swapHorizontalRoundedBold:async()=>(await e(async()=>{let{swapHorizontalRoundedBoldSvg:e}=await import(`./swapHorizontalRoundedBold-DdBR8alE.js`);return{swapHorizontalRoundedBoldSvg:e}},__vite__mapDeps([59,1]),import.meta.url)).swapHorizontalRoundedBoldSvg,swapVertical:async()=>(await e(async()=>{let{swapVerticalSvg:e}=await import(`./swapVertical-k_aglWkg.js`);return{swapVerticalSvg:e}},__vite__mapDeps([60,1]),import.meta.url)).swapVerticalSvg,telegram:async()=>(await e(async()=>{let{telegramSvg:e}=await import(`./telegram-DYRcKwK0.js`);return{telegramSvg:e}},__vite__mapDeps([61,1]),import.meta.url)).telegramSvg,threeDots:async()=>(await e(async()=>{let{threeDotsSvg:e}=await import(`./three-dots-CjKMbRFK.js`);return{threeDotsSvg:e}},__vite__mapDeps([62,1]),import.meta.url)).threeDotsSvg,twitch:async()=>(await e(async()=>{let{twitchSvg:e}=await import(`./twitch-CzM2naON.js`);return{twitchSvg:e}},__vite__mapDeps([63,1]),import.meta.url)).twitchSvg,twitter:async()=>(await e(async()=>{let{xSvg:e}=await import(`./x-BK49ThEl.js`);return{xSvg:e}},__vite__mapDeps([64,1]),import.meta.url)).xSvg,twitterIcon:async()=>(await e(async()=>{let{twitterIconSvg:e}=await import(`./twitterIcon-C5lnnxem.js`);return{twitterIconSvg:e}},__vite__mapDeps([65,1]),import.meta.url)).twitterIconSvg,verify:async()=>(await e(async()=>{let{verifySvg:e}=await import(`./verify-RqU1ENDG.js`);return{verifySvg:e}},__vite__mapDeps([66,1]),import.meta.url)).verifySvg,verifyFilled:async()=>(await e(async()=>{let{verifyFilledSvg:e}=await import(`./verify-filled-Dt6RuObi.js`);return{verifyFilledSvg:e}},__vite__mapDeps([67,1]),import.meta.url)).verifyFilledSvg,wallet:async()=>(await e(async()=>{let{walletSvg:e}=await import(`./wallet-DNI_KDHi.js`);return{walletSvg:e}},__vite__mapDeps([68,1]),import.meta.url)).walletSvg,walletConnect:async()=>(await e(async()=>{let{walletConnectSvg:e}=await import(`./walletconnect-yTQc7b5S.js`);return{walletConnectSvg:e}},__vite__mapDeps([69,1]),import.meta.url)).walletConnectSvg,walletConnectLightBrown:async()=>(await e(async()=>{let{walletConnectLightBrownSvg:e}=await import(`./walletconnect-yTQc7b5S.js`);return{walletConnectLightBrownSvg:e}},__vite__mapDeps([69,1]),import.meta.url)).walletConnectLightBrownSvg,walletConnectBrown:async()=>(await e(async()=>{let{walletConnectBrownSvg:e}=await import(`./walletconnect-yTQc7b5S.js`);return{walletConnectBrownSvg:e}},__vite__mapDeps([69,1]),import.meta.url)).walletConnectBrownSvg,walletPlaceholder:async()=>(await e(async()=>{let{walletPlaceholderSvg:e}=await import(`./wallet-placeholder-CP8pqzGZ.js`);return{walletPlaceholderSvg:e}},__vite__mapDeps([70,1]),import.meta.url)).walletPlaceholderSvg,warningCircle:async()=>(await e(async()=>{let{warningCircleSvg:e}=await import(`./warning-circle-BhjJDK4N.js`);return{warningCircleSvg:e}},__vite__mapDeps([71,1]),import.meta.url)).warningCircleSvg,x:async()=>(await e(async()=>{let{xSvg:e}=await import(`./x-BK49ThEl.js`);return{xSvg:e}},__vite__mapDeps([64,1]),import.meta.url)).xSvg,info:async()=>(await e(async()=>{let{infoSvg:e}=await import(`./info-BC5-WzYM.js`);return{infoSvg:e}},__vite__mapDeps([72,1]),import.meta.url)).infoSvg,exclamationTriangle:async()=>(await e(async()=>{let{exclamationTriangleSvg:e}=await import(`./exclamation-triangle-pRrlpli2.js`);return{exclamationTriangleSvg:e}},__vite__mapDeps([73,1]),import.meta.url)).exclamationTriangleSvg,reown:async()=>(await e(async()=>{let{reownSvg:e}=await import(`./reown-logo-D0jYegE-.js`);return{reownSvg:e}},__vite__mapDeps([74,1]),import.meta.url)).reownSvg};async function z(e){if(F.has(e))return F.get(e);let t=(R[e]??R.copy)();return F.set(e,t),t}var B=class extends c{constructor(){super(...arguments),this.size=`md`,this.name=`copy`,this.color=`fg-300`,this.aspectRatio=`1 / 1`}render(){return this.style.cssText=`
      --local-color: ${`var(--wui-color-${this.color});`}
      --local-width: ${`var(--wui-icon-size-${this.size});`}
      --local-aspect-ratio: ${this.aspectRatio}
    `,r`${P(z(this.name),r`<div class="fallback"></div>`)}`}};B.styles=[l,u,I],L([p()],B.prototype,`size`,void 0),L([p()],B.prototype,`name`,void 0),L([p()],B.prototype,`color`,void 0),L([p()],B.prototype,`aspectRatio`,void 0),B=L([v(`wui-icon`)],B);var V=C(class extends w{constructor(e){if(super(e),e.type!==S.ATTRIBUTE||e.name!==`class`||e.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(e){return` `+Object.keys(e).filter(t=>e[t]).join(` `)+` `}update(e,[t]){if(this.st===void 0){this.st=new Set,e.strings!==void 0&&(this.nt=new Set(e.strings.join(` `).split(/\s/).filter(e=>e!==``)));for(let e in t)t[e]&&!this.nt?.has(e)&&this.st.add(e);return this.render(t)}let n=e.element.classList;for(let e of this.st)e in t||(n.remove(e),this.st.delete(e));for(let e in t){let r=!!t[e];r===this.st.has(e)||this.nt?.has(e)||(r?(n.add(e),this.st.add(e)):(n.remove(e),this.st.delete(e)))}return o}}),H=i`
  :host {
    display: inline-flex !important;
  }

  slot {
    width: 100%;
    display: inline-block;
    font-style: normal;
    font-family: var(--wui-font-family);
    font-feature-settings:
      'tnum' on,
      'lnum' on,
      'case' on;
    line-height: 130%;
    font-weight: var(--wui-font-weight-regular);
    overflow: inherit;
    text-overflow: inherit;
    text-align: var(--local-align);
    color: var(--local-color);
  }

  .wui-line-clamp-1 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }

  .wui-line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .wui-font-medium-400 {
    font-size: var(--wui-font-size-medium);
    font-weight: var(--wui-font-weight-light);
    letter-spacing: var(--wui-letter-spacing-medium);
  }

  .wui-font-medium-600 {
    font-size: var(--wui-font-size-medium);
    letter-spacing: var(--wui-letter-spacing-medium);
  }

  .wui-font-title-600 {
    font-size: var(--wui-font-size-title);
    letter-spacing: var(--wui-letter-spacing-title);
  }

  .wui-font-title-6-600 {
    font-size: var(--wui-font-size-title-6);
    letter-spacing: var(--wui-letter-spacing-title-6);
  }

  .wui-font-mini-700 {
    font-size: var(--wui-font-size-mini);
    letter-spacing: var(--wui-letter-spacing-mini);
    text-transform: uppercase;
  }

  .wui-font-large-500,
  .wui-font-large-600,
  .wui-font-large-700 {
    font-size: var(--wui-font-size-large);
    letter-spacing: var(--wui-letter-spacing-large);
  }

  .wui-font-2xl-500,
  .wui-font-2xl-600,
  .wui-font-2xl-700 {
    font-size: var(--wui-font-size-2xl);
    letter-spacing: var(--wui-letter-spacing-2xl);
  }

  .wui-font-paragraph-400,
  .wui-font-paragraph-500,
  .wui-font-paragraph-600,
  .wui-font-paragraph-700 {
    font-size: var(--wui-font-size-paragraph);
    letter-spacing: var(--wui-letter-spacing-paragraph);
  }

  .wui-font-small-400,
  .wui-font-small-500,
  .wui-font-small-600 {
    font-size: var(--wui-font-size-small);
    letter-spacing: var(--wui-letter-spacing-small);
  }

  .wui-font-tiny-400,
  .wui-font-tiny-500,
  .wui-font-tiny-600 {
    font-size: var(--wui-font-size-tiny);
    letter-spacing: var(--wui-letter-spacing-tiny);
  }

  .wui-font-micro-700,
  .wui-font-micro-600 {
    font-size: var(--wui-font-size-micro);
    letter-spacing: var(--wui-letter-spacing-micro);
    text-transform: uppercase;
  }

  .wui-font-tiny-400,
  .wui-font-small-400,
  .wui-font-medium-400,
  .wui-font-paragraph-400 {
    font-weight: var(--wui-font-weight-light);
  }

  .wui-font-large-700,
  .wui-font-paragraph-700,
  .wui-font-micro-700,
  .wui-font-mini-700 {
    font-weight: var(--wui-font-weight-bold);
  }

  .wui-font-medium-600,
  .wui-font-medium-title-600,
  .wui-font-title-6-600,
  .wui-font-large-600,
  .wui-font-paragraph-600,
  .wui-font-small-600,
  .wui-font-tiny-600,
  .wui-font-micro-600 {
    font-weight: var(--wui-font-weight-medium);
  }

  :host([disabled]) {
    opacity: 0.4;
  }
`,U=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},W=class extends c{constructor(){super(...arguments),this.variant=`paragraph-500`,this.color=`fg-300`,this.align=`left`,this.lineClamp=void 0}render(){let e={[`wui-font-${this.variant}`]:!0,[`wui-color-${this.color}`]:!0,[`wui-line-clamp-${this.lineClamp}`]:!!this.lineClamp};return this.style.cssText=`
      --local-align: ${this.align};
      --local-color: var(--wui-color-${this.color});
    `,r`<slot class=${V(e)}></slot>`}};W.styles=[l,H],U([p()],W.prototype,`variant`,void 0),U([p()],W.prototype,`color`,void 0),U([p()],W.prototype,`align`,void 0),U([p()],W.prototype,`lineClamp`,void 0),W=U([v(`wui-text`)],W);var G=i`
  :host {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
    background-color: var(--wui-color-gray-glass-020);
    border-radius: var(--local-border-radius);
    border: var(--local-border);
    box-sizing: content-box;
    width: var(--local-size);
    height: var(--local-size);
    min-height: var(--local-size);
    min-width: var(--local-size);
  }

  @supports (background: color-mix(in srgb, white 50%, black)) {
    :host {
      background-color: color-mix(in srgb, var(--local-bg-value) var(--local-bg-mix), transparent);
    }
  }
`,K=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},q=class extends c{constructor(){super(...arguments),this.size=`md`,this.backgroundColor=`accent-100`,this.iconColor=`accent-100`,this.background=`transparent`,this.border=!1,this.borderColor=`wui-color-bg-125`,this.icon=`copy`}render(){let e=this.iconSize||this.size,t=this.size===`lg`,n=this.size===`xl`,i=t?`12%`:`16%`,a=t?`xxs`:n?`s`:`3xl`,o=this.background===`gray`,s=this.background===`opaque`,c=this.backgroundColor===`accent-100`&&s||this.backgroundColor===`success-100`&&s||this.backgroundColor===`error-100`&&s||this.backgroundColor===`inverse-100`&&s,l=`var(--wui-color-${this.backgroundColor})`;return c?l=`var(--wui-icon-box-bg-${this.backgroundColor})`:o&&(l=`var(--wui-color-gray-${this.backgroundColor})`),this.style.cssText=`
       --local-bg-value: ${l};
       --local-bg-mix: ${c||o?`100%`:i};
       --local-border-radius: var(--wui-border-radius-${a});
       --local-size: var(--wui-icon-box-size-${this.size});
       --local-border: ${this.borderColor===`wui-color-bg-125`?`2px`:`1px`} solid ${this.border?`var(--${this.borderColor})`:`transparent`}
   `,r` <wui-icon color=${this.iconColor} size=${e} name=${this.icon}></wui-icon> `}};q.styles=[l,d,G],K([p()],q.prototype,`size`,void 0),K([p()],q.prototype,`backgroundColor`,void 0),K([p()],q.prototype,`iconColor`,void 0),K([p()],q.prototype,`iconSize`,void 0),K([p()],q.prototype,`background`,void 0),K([p({type:Boolean})],q.prototype,`border`,void 0),K([p()],q.prototype,`borderColor`,void 0),K([p()],q.prototype,`icon`,void 0),q=K([v(`wui-icon-box`)],q);var se=i`
  :host {
    display: block;
    width: var(--local-width);
    height: var(--local-height);
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
    border-radius: inherit;
  }
`,J=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},Y=class extends c{constructor(){super(...arguments),this.src=`./path/to/image.jpg`,this.alt=`Image`,this.size=void 0}render(){return this.style.cssText=`
      --local-width: ${this.size?`var(--wui-icon-size-${this.size});`:`100%`};
      --local-height: ${this.size?`var(--wui-icon-size-${this.size});`:`100%`};
      `,r`<img src=${this.src} alt=${this.alt} @error=${this.handleImageError} />`}handleImageError(){this.dispatchEvent(new CustomEvent(`onLoadError`,{bubbles:!0,composed:!0}))}};Y.styles=[l,u,se],J([p()],Y.prototype,`src`,void 0),J([p()],Y.prototype,`alt`,void 0),J([p()],Y.prototype,`size`,void 0),Y=J([v(`wui-image`)],Y);var ce=i`
  :host {
    display: flex;
    justify-content: center;
    align-items: center;
    height: var(--wui-spacing-m);
    padding: 0 var(--wui-spacing-3xs) !important;
    border-radius: var(--wui-border-radius-5xs);
    transition:
      border-radius var(--wui-duration-lg) var(--wui-ease-out-power-1),
      background-color var(--wui-duration-lg) var(--wui-ease-out-power-1);
    will-change: border-radius, background-color;
  }

  :host > wui-text {
    transform: translateY(5%);
  }

  :host([data-variant='main']) {
    background-color: var(--wui-color-accent-glass-015);
    color: var(--wui-color-accent-100);
  }

  :host([data-variant='shade']) {
    background-color: var(--wui-color-gray-glass-010);
    color: var(--wui-color-fg-200);
  }

  :host([data-variant='success']) {
    background-color: var(--wui-icon-box-bg-success-100);
    color: var(--wui-color-success-100);
  }

  :host([data-variant='error']) {
    background-color: var(--wui-icon-box-bg-error-100);
    color: var(--wui-color-error-100);
  }

  :host([data-size='lg']) {
    padding: 11px 5px !important;
  }

  :host([data-size='lg']) > wui-text {
    transform: translateY(2%);
  }
`,X=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},Z=class extends c{constructor(){super(...arguments),this.variant=`main`,this.size=`lg`}render(){this.dataset.variant=this.variant,this.dataset.size=this.size;let e=this.size===`md`?`mini-700`:`micro-700`;return r`
      <wui-text data-variant=${this.variant} variant=${e} color="inherit">
        <slot></slot>
      </wui-text>
    `}};Z.styles=[l,ce],X([p()],Z.prototype,`variant`,void 0),X([p()],Z.prototype,`size`,void 0),Z=X([v(`wui-tag`)],Z);var le=i`
  :host {
    display: flex;
  }

  :host([data-size='sm']) > svg {
    width: 12px;
    height: 12px;
  }

  :host([data-size='md']) > svg {
    width: 16px;
    height: 16px;
  }

  :host([data-size='lg']) > svg {
    width: 24px;
    height: 24px;
  }

  :host([data-size='xl']) > svg {
    width: 32px;
    height: 32px;
  }

  svg {
    animation: rotate 2s linear infinite;
  }

  circle {
    fill: none;
    stroke: var(--local-color);
    stroke-width: 4px;
    stroke-dasharray: 1, 124;
    stroke-dashoffset: 0;
    stroke-linecap: round;
    animation: dash 1.5s ease-in-out infinite;
  }

  :host([data-size='md']) > svg > circle {
    stroke-width: 6px;
  }

  :host([data-size='sm']) > svg > circle {
    stroke-width: 8px;
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes dash {
    0% {
      stroke-dasharray: 1, 124;
      stroke-dashoffset: 0;
    }

    50% {
      stroke-dasharray: 90, 124;
      stroke-dashoffset: -35;
    }

    100% {
      stroke-dashoffset: -125;
    }
  }
`,Q=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},$=class extends c{constructor(){super(...arguments),this.color=`accent-100`,this.size=`lg`}render(){return this.style.cssText=`--local-color: ${this.color===`inherit`?`inherit`:`var(--wui-color-${this.color})`}`,this.dataset.size=this.size,r`<svg viewBox="25 25 50 50">
      <circle r="20" cy="50" cx="50"></circle>
    </svg>`}};$.styles=[l,le],Q([p()],$.prototype,`color`,void 0),Q([p()],$.prototype,`size`,void 0),$=Q([v(`wui-loading-spinner`)],$);export{v as a,p as c,ne as i,j as n,h as o,C as r,m as s,V as t};