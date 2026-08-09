import{i as e,l as t,t as n}from"./lit-Cbk7b9dC.js";import{a as r,c as i,i as a,o,s}from"./wui-text-B9kfHrov.js";import{C as c,D as l,E as u,F as d,L as f,N as ee,P as p,S as m,T as te,_ as h,a as g,b as _,c as v,d as y,h as b,i as ne,l as x,n as S,r as re,t as C,v as ie,w as ae,x as w,y as T}from"./ConstantsUtil-BQ-sc-2m.js";import{t as E}from"./SIWXUtil-CX3CKU8N.js";var D=d({message:``,open:!1,triggerRect:{width:0,height:0,top:0,left:0},variant:`shade`}),O=te({state:D,subscribe(e){return f(D,()=>e(D))},subscribeKey(e,t){return p(D,e,t)},showTooltip({message:e,triggerRect:t,variant:n}){D.open=!0,D.message=e,D.triggerRect=t,D.variant=n},hide(){D.open=!1,D.message=``,D.triggerRect={width:0,height:0,top:0,left:0}}}),k={isUnsupportedChainView(){return T.state.view===`UnsupportedChain`||T.state.view===`SwitchNetwork`&&T.state.history.includes(`UnsupportedChain`)},async safeClose(){if(this.isUnsupportedChainView()){v.shake();return}if(await E.isSIWXCloseDisabled()){v.shake();return}v.close()}},oe=t`
  :host {
    display: block;
    border-radius: clamp(0px, var(--wui-border-radius-l), 44px);
    box-shadow: 0 0 0 1px var(--wui-color-gray-glass-005);
    background-color: var(--wui-color-modal-bg);
    overflow: hidden;
  }

  :host([data-embedded='true']) {
    box-shadow:
      0 0 0 1px var(--wui-color-gray-glass-005),
      0px 4px 12px 4px var(--w3m-card-embedded-shadow-color);
  }
`,se=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},A=class extends n{render(){return e`<slot></slot>`}};A.styles=[g,oe],A=se([r(`wui-card`)],A);var ce=t`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--wui-spacing-s);
    border-radius: var(--wui-border-radius-s);
    border: 1px solid var(--wui-color-dark-glass-100);
    box-sizing: border-box;
    background-color: var(--wui-color-bg-325);
    box-shadow: 0px 0px 16px 0px rgba(0, 0, 0, 0.25);
  }

  wui-flex {
    width: 100%;
  }

  wui-text {
    word-break: break-word;
    flex: 1;
  }

  .close {
    cursor: pointer;
  }

  .icon-box {
    height: 40px;
    width: 40px;
    border-radius: var(--wui-border-radius-3xs);
    background-color: var(--local-icon-bg-value);
  }
`,j=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},M=class extends n{constructor(){super(...arguments),this.message=``,this.backgroundColor=`accent-100`,this.iconColor=`accent-100`,this.icon=`info`}render(){return this.style.cssText=`
      --local-icon-bg-value: var(--wui-color-${this.backgroundColor});
   `,e`
      <wui-flex flexDirection="row" justifyContent="space-between" alignItems="center">
        <wui-flex columnGap="xs" flexDirection="row" alignItems="center">
          <wui-flex
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            class="icon-box"
          >
            <wui-icon color=${this.iconColor} size="md" name=${this.icon}></wui-icon>
          </wui-flex>
          <wui-text variant="small-500" color="bg-350" data-testid="wui-alertbar-text"
            >${this.message}</wui-text
          >
        </wui-flex>
        <wui-icon
          class="close"
          color="bg-350"
          size="sm"
          name="close"
          @click=${this.onClose}
        ></wui-icon>
      </wui-flex>
    `}onClose(){m.close()}};M.styles=[g,ce],j([i()],M.prototype,`message`,void 0),j([i()],M.prototype,`backgroundColor`,void 0),j([i()],M.prototype,`iconColor`,void 0),j([i()],M.prototype,`icon`,void 0),M=j([r(`wui-alertbar`)],M);var le=t`
  :host {
    display: block;
    position: absolute;
    top: var(--wui-spacing-s);
    left: var(--wui-spacing-l);
    right: var(--wui-spacing-l);
    opacity: 0;
    pointer-events: none;
  }
`,N=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},ue={info:{backgroundColor:`fg-350`,iconColor:`fg-325`,icon:`info`},success:{backgroundColor:`success-glass-reown-020`,iconColor:`success-125`,icon:`checkmark`},warning:{backgroundColor:`warning-glass-reown-020`,iconColor:`warning-100`,icon:`warningCircle`},error:{backgroundColor:`error-glass-reown-020`,iconColor:`error-125`,icon:`exclamationTriangle`}},P=class extends n{constructor(){super(),this.unsubscribe=[],this.open=m.state.open,this.onOpen(!0),this.unsubscribe.push(m.subscribeKey(`open`,e=>{this.open=e,this.onOpen(!1)}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){let{message:t,variant:n}=m.state,r=ue[n];return e`
      <wui-alertbar
        message=${t}
        backgroundColor=${r?.backgroundColor}
        iconColor=${r?.iconColor}
        icon=${r?.icon}
      ></wui-alertbar>
    `}onOpen(e){this.open?(this.animate([{opacity:0,transform:`scale(0.85)`},{opacity:1,transform:`scale(1)`}],{duration:150,fill:`forwards`,easing:`ease`}),this.style.cssText=`pointer-events: auto`):e||(this.animate([{opacity:1,transform:`scale(1)`},{opacity:0,transform:`scale(0.85)`}],{duration:150,fill:`forwards`,easing:`ease`}),this.style.cssText=`pointer-events: none`)}};P.styles=le,N([s()],P.prototype,`open`,void 0),P=N([r(`w3m-alertbar`)],P);var de=t`
  button {
    border-radius: var(--local-border-radius);
    color: var(--wui-color-fg-100);
    padding: var(--local-padding);
  }

  @media (max-width: 700px) {
    button {
      padding: var(--wui-spacing-s);
    }
  }

  button > wui-icon {
    pointer-events: none;
  }

  button:disabled > wui-icon {
    color: var(--wui-color-bg-300) !important;
  }

  button:disabled {
    background-color: transparent;
  }
`,F=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},I=class extends n{constructor(){super(...arguments),this.size=`md`,this.disabled=!1,this.icon=`copy`,this.iconColor=`inherit`}render(){let t=this.size===`lg`?`--wui-border-radius-xs`:`--wui-border-radius-xxs`,n=this.size===`lg`?`--wui-spacing-1xs`:`--wui-spacing-2xs`;return this.style.cssText=`
    --local-border-radius: var(${t});
    --local-padding: var(${n});
`,e`
      <button ?disabled=${this.disabled}>
        <wui-icon color=${this.iconColor} size=${this.size} name=${this.icon}></wui-icon>
      </button>
    `}};I.styles=[g,re,S,de],F([i()],I.prototype,`size`,void 0),F([i({type:Boolean})],I.prototype,`disabled`,void 0),F([i()],I.prototype,`icon`,void 0),F([i()],I.prototype,`iconColor`,void 0),I=F([r(`wui-icon-link`)],I);var fe=t`
  button {
    display: block;
    display: flex;
    align-items: center;
    padding: var(--wui-spacing-xxs);
    gap: var(--wui-spacing-xxs);
    transition: all var(--wui-ease-out-power-1) var(--wui-duration-md);
    border-radius: var(--wui-border-radius-xxs);
  }

  wui-image {
    border-radius: 100%;
    width: var(--wui-spacing-xl);
    height: var(--wui-spacing-xl);
  }

  wui-icon-box {
    width: var(--wui-spacing-xl);
    height: var(--wui-spacing-xl);
  }

  button:hover {
    background-color: var(--wui-color-gray-glass-002);
  }

  button:active {
    background-color: var(--wui-color-gray-glass-005);
  }
`,L=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},R=class extends n{constructor(){super(...arguments),this.imageSrc=``}render(){return e`<button>
      ${this.imageTemplate()}
      <wui-icon size="xs" color="fg-200" name="chevronBottom"></wui-icon>
    </button>`}imageTemplate(){return this.imageSrc?e`<wui-image src=${this.imageSrc} alt="select visual"></wui-image>`:e`<wui-icon-box
      size="xxs"
      iconColor="fg-200"
      backgroundColor="fg-100"
      background="opaque"
      icon="networkPlaceholder"
    ></wui-icon-box>`}};R.styles=[g,re,S,fe],L([i()],R.prototype,`imageSrc`,void 0),R=L([r(`wui-select`)],R);var pe=t`
  :host {
    height: 64px;
  }

  wui-text {
    text-transform: capitalize;
  }

  wui-flex.w3m-header-title {
    transform: translateY(0);
    opacity: 1;
  }

  wui-flex.w3m-header-title[view-direction='prev'] {
    animation:
      slide-down-out 120ms forwards var(--wui-ease-out-power-2),
      slide-down-in 120ms forwards var(--wui-ease-out-power-2);
    animation-delay: 0ms, 200ms;
  }

  wui-flex.w3m-header-title[view-direction='next'] {
    animation:
      slide-up-out 120ms forwards var(--wui-ease-out-power-2),
      slide-up-in 120ms forwards var(--wui-ease-out-power-2);
    animation-delay: 0ms, 200ms;
  }

  wui-icon-link[data-hidden='true'] {
    opacity: 0 !important;
    pointer-events: none;
  }

  @keyframes slide-up-out {
    from {
      transform: translateY(0px);
      opacity: 1;
    }
    to {
      transform: translateY(3px);
      opacity: 0;
    }
  }

  @keyframes slide-up-in {
    from {
      transform: translateY(-3px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slide-down-out {
    from {
      transform: translateY(0px);
      opacity: 1;
    }
    to {
      transform: translateY(-3px);
      opacity: 0;
    }
  }

  @keyframes slide-down-in {
    from {
      transform: translateY(3px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`,z=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},me=[`SmartSessionList`];function B(){let e=T.state.data?.connector?.name,t=T.state.data?.wallet?.name,n=T.state.data?.network?.name,r=t??e,i=h.getConnectors();return{Connect:`Connect ${i.length===1&&i[0]?.id===`w3m-email`?`Email`:``} Wallet`,Create:`Create Wallet`,ChooseAccountName:void 0,Account:void 0,AccountSettings:void 0,AllWallets:`All Wallets`,ApproveTransaction:`Approve Transaction`,BuyInProgress:`Buy`,ConnectingExternal:r??`Connect Wallet`,ConnectingWalletConnect:r??`WalletConnect`,ConnectingWalletConnectBasic:`WalletConnect`,ConnectingSiwe:`Sign In`,Convert:`Convert`,ConvertSelectToken:`Select token`,ConvertPreview:`Preview convert`,Downloads:r?`Get ${r}`:`Downloads`,EmailLogin:`Email Login`,EmailVerifyOtp:`Confirm Email`,EmailVerifyDevice:`Register Device`,GetWallet:`Get a wallet`,Networks:`Choose Network`,OnRampProviders:`Choose Provider`,OnRampActivity:`Activity`,OnRampTokenSelect:`Select Token`,OnRampFiatSelect:`Select Currency`,Pay:`How you pay`,Profile:void 0,SwitchNetwork:n??`Switch Network`,SwitchAddress:`Switch Address`,Transactions:`Activity`,UnsupportedChain:`Switch Network`,UpgradeEmailWallet:`Upgrade your Wallet`,UpdateEmailWallet:`Edit Email`,UpdateEmailPrimaryOtp:`Confirm Current Email`,UpdateEmailSecondaryOtp:`Confirm New Email`,WhatIsABuy:`What is Buy?`,RegisterAccountName:`Choose name`,RegisterAccountNameSuccess:``,WalletReceive:`Receive`,WalletCompatibleNetworks:`Compatible Networks`,Swap:`Swap`,SwapSelectToken:`Select token`,SwapPreview:`Preview swap`,WalletSend:`Send`,WalletSendPreview:`Review send`,WalletSendSelectToken:`Select Token`,WhatIsANetwork:`What is a network?`,WhatIsAWallet:`What is a wallet?`,ConnectWallets:`Connect wallet`,ConnectSocials:`All socials`,ConnectingSocial:x.state.socialProvider?x.state.socialProvider:`Connect Social`,ConnectingMultiChain:`Select chain`,ConnectingFarcaster:`Farcaster`,SwitchActiveChain:`Switch chain`,SmartSessionCreated:void 0,SmartSessionList:`Smart Sessions`,SIWXSignMessage:`Sign In`,PayLoading:`Payment in progress`}}var V=class extends n{constructor(){super(),this.unsubscribe=[],this.heading=B()[T.state.view],this.network=y.state.activeCaipNetwork,this.networkImage=c.getNetworkImage(this.network),this.showBack=!1,this.prevHistoryLength=1,this.view=T.state.view,this.viewDirection=``,this.headerText=B()[T.state.view],this.unsubscribe.push(ae.subscribeNetworkImages(()=>{this.networkImage=c.getNetworkImage(this.network)}),T.subscribeKey(`view`,e=>{setTimeout(()=>{this.view=e,this.headerText=B()[e]},C.ANIMATION_DURATIONS.HeaderText),this.onViewChange(),this.onHistoryChange()}),y.subscribeKey(`activeCaipNetwork`,e=>{this.network=e,this.networkImage=c.getNetworkImage(this.network)}))}disconnectCallback(){this.unsubscribe.forEach(e=>e())}render(){return e`
      <wui-flex .padding=${this.getPadding()} justifyContent="space-between" alignItems="center">
        ${this.leftHeaderTemplate()} ${this.titleTemplate()} ${this.rightHeaderTemplate()}
      </wui-flex>
    `}onWalletHelp(){w.sendEvent({type:`track`,event:`CLICK_WALLET_HELP`}),T.push(`WhatIsAWallet`)}async onClose(){await k.safeClose()}rightHeaderTemplate(){let t=u?.state?.features?.smartSessions;return T.state.view!==`Account`||!t?this.closeButtonTemplate():e`<wui-flex>
      <wui-icon-link
        icon="clock"
        @click=${()=>T.push(`SmartSessionList`)}
        data-testid="w3m-header-smart-sessions"
      ></wui-icon-link>
      ${this.closeButtonTemplate()}
    </wui-flex> `}closeButtonTemplate(){return e`
      <wui-icon-link
        icon="close"
        @click=${this.onClose.bind(this)}
        data-testid="w3m-header-close"
      ></wui-icon-link>
    `}titleTemplate(){let t=me.includes(this.view);return e`
      <wui-flex
        view-direction="${this.viewDirection}"
        class="w3m-header-title"
        alignItems="center"
        gap="xs"
      >
        <wui-text variant="paragraph-700" color="fg-100" data-testid="w3m-header-text"
          >${this.headerText}</wui-text
        >
        ${t?e`<wui-tag variant="main">Beta</wui-tag>`:null}
      </wui-flex>
    `}leftHeaderTemplate(){let{view:t}=T.state,n=t===`Connect`,r=u.state.enableEmbedded,i=t===`ApproveTransaction`,o=t===`ConnectingSiwe`,s=t===`Account`,c=u.state.enableNetworkSwitch,l=i||o||n&&r;return s&&c?e`<wui-select
        id="dynamic"
        data-testid="w3m-account-select-network"
        active-network=${a(this.network?.name)}
        @click=${this.onNetworks.bind(this)}
        imageSrc=${a(this.networkImage)}
      ></wui-select>`:this.showBack&&!l?e`<wui-icon-link
        data-testid="header-back"
        id="dynamic"
        icon="chevronLeft"
        @click=${this.onGoBack.bind(this)}
      ></wui-icon-link>`:e`<wui-icon-link
      data-hidden=${!n}
      id="dynamic"
      icon="helpCircle"
      @click=${this.onWalletHelp.bind(this)}
    ></wui-icon-link>`}onNetworks(){this.isAllowedNetworkSwitch()&&(w.sendEvent({type:`track`,event:`CLICK_NETWORKS`}),T.push(`Networks`))}isAllowedNetworkSwitch(){let e=y.getAllRequestedCaipNetworks(),t=e?e.length>1:!1,n=e?.find(({id:e})=>e===this.network?.id);return t||!n}getPadding(){return this.heading?[`l`,`2l`,`l`,`2l`]:[`0`,`2l`,`0`,`2l`]}onViewChange(){let{history:e}=T.state,t=C.VIEW_DIRECTION.Next;e.length<this.prevHistoryLength&&(t=C.VIEW_DIRECTION.Prev),this.prevHistoryLength=e.length,this.viewDirection=t}async onHistoryChange(){let{history:e}=T.state,t=this.shadowRoot?.querySelector(`#dynamic`);e.length>1&&!this.showBack&&t?(await t.animate([{opacity:1},{opacity:0}],{duration:200,fill:`forwards`,easing:`ease`}).finished,this.showBack=!0,t.animate([{opacity:0},{opacity:1}],{duration:200,fill:`forwards`,easing:`ease`})):e.length<=1&&this.showBack&&t&&(await t.animate([{opacity:1},{opacity:0}],{duration:200,fill:`forwards`,easing:`ease`}).finished,this.showBack=!1,t.animate([{opacity:0},{opacity:1}],{duration:200,fill:`forwards`,easing:`ease`}))}onGoBack(){T.goBack()}};V.styles=pe,z([s()],V.prototype,`heading`,void 0),z([s()],V.prototype,`network`,void 0),z([s()],V.prototype,`networkImage`,void 0),z([s()],V.prototype,`showBack`,void 0),z([s()],V.prototype,`prevHistoryLength`,void 0),z([s()],V.prototype,`view`,void 0),z([s()],V.prototype,`viewDirection`,void 0),z([s()],V.prototype,`headerText`,void 0),V=z([r(`w3m-header`)],V);var he=t`
  :host {
    display: flex;
    column-gap: var(--wui-spacing-s);
    align-items: center;
    padding: var(--wui-spacing-xs) var(--wui-spacing-m) var(--wui-spacing-xs) var(--wui-spacing-xs);
    border-radius: var(--wui-border-radius-s);
    border: 1px solid var(--wui-color-gray-glass-005);
    box-sizing: border-box;
    background-color: var(--wui-color-bg-175);
    box-shadow:
      0px 14px 64px -4px rgba(0, 0, 0, 0.15),
      0px 8px 22px -6px rgba(0, 0, 0, 0.15);

    max-width: 300px;
  }

  :host wui-loading-spinner {
    margin-left: var(--wui-spacing-3xs);
  }
`,H=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},U=class extends n{constructor(){super(...arguments),this.backgroundColor=`accent-100`,this.iconColor=`accent-100`,this.icon=`checkmark`,this.message=``,this.loading=!1,this.iconType=`default`}render(){return e`
      ${this.templateIcon()}
      <wui-text variant="paragraph-500" color="fg-100" data-testid="wui-snackbar-message"
        >${this.message}</wui-text
      >
    `}templateIcon(){return this.loading?e`<wui-loading-spinner size="md" color="accent-100"></wui-loading-spinner>`:this.iconType==="default"?e`<wui-icon size="xl" color=${this.iconColor} name=${this.icon}></wui-icon>`:e`<wui-icon-box
      size="sm"
      iconSize="xs"
      iconColor=${this.iconColor}
      backgroundColor=${this.backgroundColor}
      icon=${this.icon}
      background="opaque"
    ></wui-icon-box>`}};U.styles=[g,he],H([i()],U.prototype,`backgroundColor`,void 0),H([i()],U.prototype,`iconColor`,void 0),H([i()],U.prototype,`icon`,void 0),H([i()],U.prototype,`message`,void 0),H([i()],U.prototype,`loading`,void 0),H([i()],U.prototype,`iconType`,void 0),U=H([r(`wui-snackbar`)],U);var ge=t`
  :host {
    display: block;
    position: absolute;
    opacity: 0;
    pointer-events: none;
    top: 11px;
    left: 50%;
    width: max-content;
  }
`,W=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},_e={loading:void 0,success:{backgroundColor:`success-100`,iconColor:`success-100`,icon:`checkmark`},error:{backgroundColor:`error-100`,iconColor:`error-100`,icon:`close`}},G=class extends n{constructor(){super(),this.unsubscribe=[],this.timeout=void 0,this.open=b.state.open,this.unsubscribe.push(b.subscribeKey(`open`,e=>{this.open=e,this.onOpen()}))}disconnectedCallback(){clearTimeout(this.timeout),this.unsubscribe.forEach(e=>e())}render(){let{message:t,variant:n,svg:r}=b.state,i=_e[n],{icon:a,iconColor:o}=r??i??{};return e`
      <wui-snackbar
        message=${t}
        backgroundColor=${i?.backgroundColor}
        iconColor=${o}
        icon=${a}
        .loading=${n===`loading`}
      ></wui-snackbar>
    `}onOpen(){clearTimeout(this.timeout),this.open?(this.animate([{opacity:0,transform:`translateX(-50%) scale(0.85)`},{opacity:1,transform:`translateX(-50%) scale(1)`}],{duration:150,fill:`forwards`,easing:`ease`}),this.timeout&&clearTimeout(this.timeout),b.state.autoClose&&(this.timeout=setTimeout(()=>b.hide(),2500))):this.animate([{opacity:1,transform:`translateX(-50%) scale(1)`},{opacity:0,transform:`translateX(-50%) scale(0.85)`}],{duration:150,fill:`forwards`,easing:`ease`})}};G.styles=ge,W([s()],G.prototype,`open`,void 0),G=W([r(`w3m-snackbar`)],G);var ve=t`
  :host {
    pointer-events: none;
  }

  :host > wui-flex {
    display: var(--w3m-tooltip-display);
    opacity: var(--w3m-tooltip-opacity);
    padding: 9px var(--wui-spacing-s) 10px var(--wui-spacing-s);
    border-radius: var(--wui-border-radius-xxs);
    color: var(--wui-color-bg-100);
    position: fixed;
    top: var(--w3m-tooltip-top);
    left: var(--w3m-tooltip-left);
    transform: translate(calc(-50% + var(--w3m-tooltip-parent-width)), calc(-100% - 8px));
    max-width: calc(var(--w3m-modal-width) - var(--wui-spacing-xl));
    transition: opacity 0.2s var(--wui-ease-out-power-2);
    will-change: opacity;
  }

  :host([data-variant='shade']) > wui-flex {
    background-color: var(--wui-color-bg-150);
    border: 1px solid var(--wui-color-gray-glass-005);
  }

  :host([data-variant='shade']) > wui-flex > wui-text {
    color: var(--wui-color-fg-150);
  }

  :host([data-variant='fill']) > wui-flex {
    background-color: var(--wui-color-fg-100);
    border: none;
  }

  wui-icon {
    position: absolute;
    width: 12px !important;
    height: 4px !important;
    color: var(--wui-color-bg-150);
  }

  wui-icon[data-placement='top'] {
    bottom: 0px;
    left: 50%;
    transform: translate(-50%, 95%);
  }

  wui-icon[data-placement='bottom'] {
    top: 0;
    left: 50%;
    transform: translate(-50%, -95%) rotate(180deg);
  }

  wui-icon[data-placement='right'] {
    top: 50%;
    left: 0;
    transform: translate(-65%, -50%) rotate(90deg);
  }

  wui-icon[data-placement='left'] {
    top: 50%;
    right: 0%;
    transform: translate(65%, -50%) rotate(270deg);
  }
`,K=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},q=class extends n{constructor(){super(),this.unsubscribe=[],this.open=O.state.open,this.message=O.state.message,this.triggerRect=O.state.triggerRect,this.variant=O.state.variant,this.unsubscribe.push(O.subscribe(e=>{this.open=e.open,this.message=e.message,this.triggerRect=e.triggerRect,this.variant=e.variant}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){this.dataset.variant=this.variant;let t=this.triggerRect.top,n=this.triggerRect.left;return this.style.cssText=`
    --w3m-tooltip-top: ${t}px;
    --w3m-tooltip-left: ${n}px;
    --w3m-tooltip-parent-width: ${this.triggerRect.width/2}px;
    --w3m-tooltip-display: ${this.open?`flex`:`none`};
    --w3m-tooltip-opacity: ${+!!this.open};
    `,e`<wui-flex>
      <wui-icon data-placement="top" color="fg-100" size="inherit" name="cursor"></wui-icon>
      <wui-text color="inherit" variant="small-500">${this.message}</wui-text>
    </wui-flex>`}};q.styles=[ve],K([s()],q.prototype,`open`,void 0),K([s()],q.prototype,`message`,void 0),K([s()],q.prototype,`triggerRect`,void 0),K([s()],q.prototype,`variant`,void 0),q=K([r(`w3m-tooltip`),r(`w3m-tooltip`)],q);var ye=t`
  :host {
    --prev-height: 0px;
    --new-height: 0px;
    display: block;
  }

  div.w3m-router-container {
    transform: translateY(0);
    opacity: 1;
  }

  div.w3m-router-container[view-direction='prev'] {
    animation:
      slide-left-out 150ms forwards ease,
      slide-left-in 150ms forwards ease;
    animation-delay: 0ms, 200ms;
  }

  div.w3m-router-container[view-direction='next'] {
    animation:
      slide-right-out 150ms forwards ease,
      slide-right-in 150ms forwards ease;
    animation-delay: 0ms, 200ms;
  }

  @keyframes slide-left-out {
    from {
      transform: translateX(0px);
      opacity: 1;
    }
    to {
      transform: translateX(10px);
      opacity: 0;
    }
  }

  @keyframes slide-left-in {
    from {
      transform: translateX(-10px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slide-right-out {
    from {
      transform: translateX(0px);
      opacity: 1;
    }
    to {
      transform: translateX(-10px);
      opacity: 0;
    }
  }

  @keyframes slide-right-in {
    from {
      transform: translateX(10px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`,J=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},Y=class extends n{constructor(){super(),this.resizeObserver=void 0,this.prevHeight=`0px`,this.prevHistoryLength=1,this.unsubscribe=[],this.view=T.state.view,this.viewDirection=``,this.unsubscribe.push(T.subscribeKey(`view`,e=>this.onViewChange(e)))}firstUpdated(){this.resizeObserver=new ResizeObserver(([e])=>{let t=`${e?.contentRect.height}px`;this.prevHeight!==`0px`&&(this.style.setProperty(`--prev-height`,this.prevHeight),this.style.setProperty(`--new-height`,t),this.style.animation=`w3m-view-height 150ms forwards ease`,this.style.height=`auto`),setTimeout(()=>{this.prevHeight=t,this.style.animation=`unset`},C.ANIMATION_DURATIONS.ModalHeight)}),this.resizeObserver?.observe(this.getWrapper())}disconnectedCallback(){this.resizeObserver?.unobserve(this.getWrapper()),this.unsubscribe.forEach(e=>e())}render(){return e`<div class="w3m-router-container" view-direction="${this.viewDirection}">
      ${this.viewTemplate()}
    </div>`}viewTemplate(){switch(this.view){case`AccountSettings`:return e`<w3m-account-settings-view></w3m-account-settings-view>`;case`Account`:return e`<w3m-account-view></w3m-account-view>`;case`AllWallets`:return e`<w3m-all-wallets-view></w3m-all-wallets-view>`;case`ApproveTransaction`:return e`<w3m-approve-transaction-view></w3m-approve-transaction-view>`;case`BuyInProgress`:return e`<w3m-buy-in-progress-view></w3m-buy-in-progress-view>`;case`ChooseAccountName`:return e`<w3m-choose-account-name-view></w3m-choose-account-name-view>`;case`Connect`:return e`<w3m-connect-view></w3m-connect-view>`;case`Create`:return e`<w3m-connect-view walletGuide="explore"></w3m-connect-view>`;case`ConnectingWalletConnect`:return e`<w3m-connecting-wc-view></w3m-connecting-wc-view>`;case`ConnectingWalletConnectBasic`:return e`<w3m-connecting-wc-basic-view></w3m-connecting-wc-basic-view>`;case`ConnectingExternal`:return e`<w3m-connecting-external-view></w3m-connecting-external-view>`;case`ConnectingSiwe`:return e`<w3m-connecting-siwe-view></w3m-connecting-siwe-view>`;case`ConnectWallets`:return e`<w3m-connect-wallets-view></w3m-connect-wallets-view>`;case`ConnectSocials`:return e`<w3m-connect-socials-view></w3m-connect-socials-view>`;case`ConnectingSocial`:return e`<w3m-connecting-social-view></w3m-connecting-social-view>`;case`Downloads`:return e`<w3m-downloads-view></w3m-downloads-view>`;case`EmailLogin`:return e`<w3m-email-login-view></w3m-email-login-view>`;case`EmailVerifyOtp`:return e`<w3m-email-verify-otp-view></w3m-email-verify-otp-view>`;case`EmailVerifyDevice`:return e`<w3m-email-verify-device-view></w3m-email-verify-device-view>`;case`GetWallet`:return e`<w3m-get-wallet-view></w3m-get-wallet-view>`;case`Networks`:return e`<w3m-networks-view></w3m-networks-view>`;case`SwitchNetwork`:return e`<w3m-network-switch-view></w3m-network-switch-view>`;case`Profile`:return e`<w3m-profile-view></w3m-profile-view>`;case`SwitchAddress`:return e`<w3m-switch-address-view></w3m-switch-address-view>`;case`Transactions`:return e`<w3m-transactions-view></w3m-transactions-view>`;case`OnRampProviders`:return e`<w3m-onramp-providers-view></w3m-onramp-providers-view>`;case`OnRampActivity`:return e`<w3m-onramp-activity-view></w3m-onramp-activity-view>`;case`OnRampTokenSelect`:return e`<w3m-onramp-token-select-view></w3m-onramp-token-select-view>`;case`OnRampFiatSelect`:return e`<w3m-onramp-fiat-select-view></w3m-onramp-fiat-select-view>`;case`UpgradeEmailWallet`:return e`<w3m-upgrade-wallet-view></w3m-upgrade-wallet-view>`;case`UpdateEmailWallet`:return e`<w3m-update-email-wallet-view></w3m-update-email-wallet-view>`;case`UpdateEmailPrimaryOtp`:return e`<w3m-update-email-primary-otp-view></w3m-update-email-primary-otp-view>`;case`UpdateEmailSecondaryOtp`:return e`<w3m-update-email-secondary-otp-view></w3m-update-email-secondary-otp-view>`;case`UnsupportedChain`:return e`<w3m-unsupported-chain-view></w3m-unsupported-chain-view>`;case`Swap`:return e`<w3m-swap-view></w3m-swap-view>`;case`SwapSelectToken`:return e`<w3m-swap-select-token-view></w3m-swap-select-token-view>`;case`SwapPreview`:return e`<w3m-swap-preview-view></w3m-swap-preview-view>`;case`WalletSend`:return e`<w3m-wallet-send-view></w3m-wallet-send-view>`;case`WalletSendSelectToken`:return e`<w3m-wallet-send-select-token-view></w3m-wallet-send-select-token-view>`;case`WalletSendPreview`:return e`<w3m-wallet-send-preview-view></w3m-wallet-send-preview-view>`;case`WhatIsABuy`:return e`<w3m-what-is-a-buy-view></w3m-what-is-a-buy-view>`;case`WalletReceive`:return e`<w3m-wallet-receive-view></w3m-wallet-receive-view>`;case`WalletCompatibleNetworks`:return e`<w3m-wallet-compatible-networks-view></w3m-wallet-compatible-networks-view>`;case`WhatIsAWallet`:return e`<w3m-what-is-a-wallet-view></w3m-what-is-a-wallet-view>`;case`ConnectingMultiChain`:return e`<w3m-connecting-multi-chain-view></w3m-connecting-multi-chain-view>`;case`WhatIsANetwork`:return e`<w3m-what-is-a-network-view></w3m-what-is-a-network-view>`;case`ConnectingFarcaster`:return e`<w3m-connecting-farcaster-view></w3m-connecting-farcaster-view>`;case`SwitchActiveChain`:return e`<w3m-switch-active-chain-view></w3m-switch-active-chain-view>`;case`RegisterAccountName`:return e`<w3m-register-account-name-view></w3m-register-account-name-view>`;case`RegisterAccountNameSuccess`:return e`<w3m-register-account-name-success-view></w3m-register-account-name-success-view>`;case`SmartSessionCreated`:return e`<w3m-smart-session-created-view></w3m-smart-session-created-view>`;case`SmartSessionList`:return e`<w3m-smart-session-list-view></w3m-smart-session-list-view>`;case`SIWXSignMessage`:return e`<w3m-siwx-sign-message-view></w3m-siwx-sign-message-view>`;case`Pay`:return e`<w3m-pay-view></w3m-pay-view>`;case`PayLoading`:return e`<w3m-pay-loading-view></w3m-pay-loading-view>`;default:return e`<w3m-connect-view></w3m-connect-view>`}}onViewChange(e){O.hide();let t=C.VIEW_DIRECTION.Next,{history:n}=T.state;n.length<this.prevHistoryLength&&(t=C.VIEW_DIRECTION.Prev),this.prevHistoryLength=n.length,this.viewDirection=t,setTimeout(()=>{this.view=e},C.ANIMATION_DURATIONS.ViewTransition)}getWrapper(){return this.shadowRoot?.querySelector(`div`)}};Y.styles=ye,J([s()],Y.prototype,`view`,void 0),J([s()],Y.prototype,`viewDirection`,void 0),Y=J([r(`w3m-router`)],Y);var be=t`
  :host {
    z-index: var(--w3m-z-index);
    display: block;
    backface-visibility: hidden;
    will-change: opacity;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    opacity: 0;
    background-color: var(--wui-cover);
    transition: opacity 0.2s var(--wui-ease-out-power-2);
    will-change: opacity;
  }

  :host(.open) {
    opacity: 1;
  }

  :host(.appkit-modal) {
    position: relative;
    pointer-events: unset;
    background: none;
    width: 100%;
    opacity: 1;
  }

  wui-card {
    max-width: var(--w3m-modal-width);
    width: 100%;
    position: relative;
    animation: zoom-in 0.2s var(--wui-ease-out-power-2);
    animation-fill-mode: backwards;
    outline: none;
    transition:
      border-radius var(--wui-duration-lg) var(--wui-ease-out-power-1),
      background-color var(--wui-duration-lg) var(--wui-ease-out-power-1);
    will-change: border-radius, background-color;
  }

  :host(.appkit-modal) wui-card {
    max-width: 400px;
  }

  wui-card[shake='true'] {
    animation:
      zoom-in 0.2s var(--wui-ease-out-power-2),
      w3m-shake 0.5s var(--wui-ease-out-power-2);
  }

  wui-flex {
    overflow-x: hidden;
    overflow-y: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  @media (max-height: 700px) and (min-width: 431px) {
    wui-flex {
      align-items: flex-start;
    }

    wui-card {
      margin: var(--wui-spacing-xxl) 0px;
    }
  }

  @media (max-width: 430px) {
    wui-flex {
      align-items: flex-end;
    }

    wui-card {
      max-width: 100%;
      border-bottom-left-radius: var(--local-border-bottom-mobile-radius);
      border-bottom-right-radius: var(--local-border-bottom-mobile-radius);
      border-bottom: none;
      animation: slide-in 0.2s var(--wui-ease-out-power-2);
    }

    wui-card[shake='true'] {
      animation:
        slide-in 0.2s var(--wui-ease-out-power-2),
        w3m-shake 0.5s var(--wui-ease-out-power-2);
    }
  }

  @keyframes zoom-in {
    0% {
      transform: scale(0.95) translateY(0);
    }
    100% {
      transform: scale(1) translateY(0);
    }
  }

  @keyframes slide-in {
    0% {
      transform: scale(1) translateY(50px);
    }
    100% {
      transform: scale(1) translateY(0);
    }
  }

  @keyframes w3m-shake {
    0% {
      transform: scale(1) rotate(0deg);
    }
    20% {
      transform: scale(1) rotate(-1deg);
    }
    40% {
      transform: scale(1) rotate(1.5deg);
    }
    60% {
      transform: scale(1) rotate(-1.5deg);
    }
    80% {
      transform: scale(1) rotate(1deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
    }
  }

  @keyframes w3m-view-height {
    from {
      height: var(--prev-height);
    }
    to {
      height: var(--new-height);
    }
  }
`,X=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},xe=`scroll-lock`,Z=class extends n{constructor(){super(),this.unsubscribe=[],this.abortController=void 0,this.hasPrefetched=!1,this.enableEmbedded=u.state.enableEmbedded,this.open=v.state.open,this.caipAddress=y.state.activeCaipAddress,this.caipNetwork=y.state.activeCaipNetwork,this.shake=v.state.shake,this.filterByNamespace=h.state.filterByNamespace,this.initializeTheming(),_.prefetchAnalyticsConfig(),this.unsubscribe.push(v.subscribeKey(`open`,e=>e?this.onOpen():this.onClose()),v.subscribeKey(`shake`,e=>this.shake=e),y.subscribeKey(`activeCaipNetwork`,e=>this.onNewNetwork(e)),y.subscribeKey(`activeCaipAddress`,e=>this.onNewAddress(e)),u.subscribeKey(`enableEmbedded`,e=>this.enableEmbedded=e),h.subscribeKey(`filterByNamespace`,e=>{this.filterByNamespace!==e&&!y.getAccountData(e)?.caipAddress&&(_.fetchRecommendedWallets(),this.filterByNamespace=e)}))}firstUpdated(){if(this.caipAddress){if(this.enableEmbedded){v.close(),this.prefetch();return}this.onNewAddress(this.caipAddress)}this.open&&this.onOpen(),this.enableEmbedded&&this.prefetch()}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),this.onRemoveKeyboardListener()}render(){return this.style.cssText=`
      --local-border-bottom-mobile-radius: ${this.enableEmbedded?`clamp(0px, var(--wui-border-radius-l), 44px)`:`0px`};
    `,this.enableEmbedded?e`${this.contentTemplate()}
        <w3m-tooltip></w3m-tooltip> `:this.open?e`
          <wui-flex @click=${this.onOverlayClick.bind(this)} data-testid="w3m-modal-overlay">
            ${this.contentTemplate()}
          </wui-flex>
          <w3m-tooltip></w3m-tooltip>
        `:null}contentTemplate(){return e` <wui-card
      shake="${this.shake}"
      data-embedded="${a(this.enableEmbedded)}"
      role="alertdialog"
      aria-modal="true"
      tabindex="0"
      data-testid="w3m-modal-card"
    >
      <w3m-header></w3m-header>
      <w3m-router></w3m-router>
      <w3m-snackbar></w3m-snackbar>
      <w3m-alertbar></w3m-alertbar>
    </wui-card>`}async onOverlayClick(e){e.target===e.currentTarget&&await this.handleClose()}async handleClose(){await k.safeClose()}initializeTheming(){let{themeVariables:e,themeMode:t}=ie.state;ne(e,o.getColorTheme(t))}onClose(){this.open=!1,this.classList.remove(`open`),this.onScrollUnlock(),b.hide(),this.onRemoveKeyboardListener()}onOpen(){this.open=!0,this.classList.add(`open`),this.onScrollLock(),this.onAddKeyboardListener()}onScrollLock(){let e=document.createElement(`style`);e.dataset.w3m=xe,e.textContent=`
      body {
        touch-action: none;
        overflow: hidden;
        overscroll-behavior: contain;
      }
      w3m-modal {
        pointer-events: auto;
      }
    `,document.head.appendChild(e)}onScrollUnlock(){let e=document.head.querySelector(`style[data-w3m="${xe}"]`);e&&e.remove()}onAddKeyboardListener(){this.abortController=new AbortController;let e=this.shadowRoot?.querySelector(`wui-card`);e?.focus(),window.addEventListener(`keydown`,t=>{if(t.key===`Escape`)this.handleClose();else if(t.key===`Tab`){let{tagName:n}=t.target;n&&!n.includes(`W3M-`)&&!n.includes(`WUI-`)&&e?.focus()}},this.abortController)}onRemoveKeyboardListener(){this.abortController?.abort(),this.abortController=void 0}async onNewAddress(e){let t=y.state.isSwitchingNamespace,n=l.getPlainAddress(e);!n&&!t?v.close():t&&n&&T.goBack(),await E.initializeIfEnabled(),this.caipAddress=e,y.setIsSwitchingNamespace(!1)}onNewNetwork(e){let t=this.caipNetwork,n=t?.caipNetworkId?.toString(),r=t?.chainNamespace,i=e?.caipNetworkId?.toString(),a=e?.chainNamespace,o=n!==i,s=o&&r===a,c=t?.name===ee.UNSUPPORTED_NETWORK_NAME,l=T.state.view===`ConnectingExternal`,u=!y.getAccountData(e?.chainNamespace)?.caipAddress,d=T.state.view===`UnsupportedChain`,f=v.state.open,p=!1;f&&!l&&(u?o&&(p=!0):(d||s&&!c)&&(p=!0)),p&&T.state.view!==`SIWXSignMessage`&&T.goBack(),this.caipNetwork=e}prefetch(){this.hasPrefetched||=(_.prefetch(),_.fetchWalletsByPage({page:1}),!0)}};Z.styles=be,X([i({type:Boolean})],Z.prototype,`enableEmbedded`,void 0),X([s()],Z.prototype,`open`,void 0),X([s()],Z.prototype,`caipAddress`,void 0),X([s()],Z.prototype,`caipNetwork`,void 0),X([s()],Z.prototype,`shake`,void 0),X([s()],Z.prototype,`filterByNamespace`,void 0);var Q=class extends Z{};Q=X([r(`w3m-modal`)],Q);var $=class extends Z{};$=X([r(`appkit-modal`)],$);export{$ as AppKitModal,Q as W3mModal,Z as W3mModalBase};