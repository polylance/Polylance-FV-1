import http from 'http';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/sunny/.gemini/antigravity-ide/brain/38c18270-8058-4854-abbd-b5b17205ff53';
const CLIENT_WALLET = '0xB8aa0398B91A150B041DA819bc954Bb356e009Dd';

function getWebSocketDebuggerUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          const page = list.find(p => p.type === 'page' && !p.url.startsWith('chrome://'));
          resolve(page.webSocketDebuggerUrl);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  const wsUrl = await getWebSocketDebuggerUrl();
  const WebSocket = (await import('ws')).default;
  const ws = new WebSocket(wsUrl);

  let idCounter = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.on('message', (msg) => {
    const data = JSON.parse(msg.toString());
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  });

  await new Promise(r => ws.on('open', r));

  console.log('Setting wallet credentials and navigating to Chat with active job...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        localStorage.setItem('polylance_connected_wallet', '${CLIENT_WALLET}');
        localStorage.setItem('polylance_mock_address', '${CLIENT_WALLET}');
        localStorage.setItem('polylance_account_mode', 'client');
      })()
    `
  });

  await send('Page.navigate', { url: 'http://localhost:5173/chat?jobId=0x6b56da137Df2' });
  await new Promise(r => setTimeout(r, 2500));

  // Click on the active channel in sidebar
  const channelClick = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const channels = Array.from(document.querySelectorAll('button, div[role="button"]')).filter(b => 
          b.closest('.overflow-y-auto') && (b.textContent.includes('Reaching SBT') || b.textContent.includes('USDC') || b.textContent.includes('Escrow'))
        );
        if (channels.length > 0) {
          channels[0].click();
          return { clicked: true, text: channels[0].textContent.slice(0, 30) };
        }
        return { clicked: false };
      })()
    `,
    returnByValue: true
  });
  console.log('Active channel clicked:', channelClick.result.value);
  await new Promise(r => setTimeout(r, 1000));

  // Click the smile icon
  const openResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const smileBtn = Array.from(document.querySelectorAll('button')).find(b => 
          b.querySelector('.lucide-smile') || b.innerHTML.includes('lucide-smile')
        );
        if (smileBtn) {
          smileBtn.click();
          return { success: true };
        }
        return { success: false };
      })()
    `,
    returnByValue: true
  });
  console.log('Emoji Popover Opened:', openResult.result.value);
  await new Promise(r => setTimeout(r, 600));

  // Verify all scroll sections
  const scrollVerification = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const popover = document.querySelector('[data-lenis-prevent="true"].shadow-2xl');
        if (!popover) return { error: 'Popover not rendered' };

        // 1. Quick Reactions Bar
        const quickBar = popover.querySelector('.overflow-x-auto');
        let quickBarScrollOk = false;
        let quickBarScrollWidth = 0;
        let quickBarClientWidth = 0;
        if (quickBar) {
          quickBarScrollWidth = quickBar.scrollWidth;
          quickBarClientWidth = quickBar.clientWidth;
          const initial = quickBar.scrollLeft;
          // dispatch wheel event
          quickBar.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true }));
          quickBarScrollOk = quickBar.scrollLeft > initial || quickBar.scrollWidth > quickBar.clientWidth;
        }

        // 2. Category Tabs Bar
        const catTabs = popover.querySelectorAll('.overflow-x-auto')[1];
        let catTabsScrollOk = false;
        let catTabsScrollWidth = 0;
        let catTabsClientWidth = 0;
        if (catTabs) {
          catTabsScrollWidth = catTabs.scrollWidth;
          catTabsClientWidth = catTabs.clientWidth;
          const initial = catTabs.scrollLeft;
          catTabs.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true }));
          catTabsScrollOk = catTabs.scrollLeft > initial || catTabs.scrollWidth > catTabs.clientWidth;
        }

        // 3. Emoji Options Grid
        const emojiGrid = popover.querySelector('.overflow-y-auto');
        let emojiGridScrollOk = false;
        let gridMetrics = null;
        if (emojiGrid) {
          const initial = emojiGrid.scrollTop;
          emojiGrid.scrollTop = 150;
          emojiGridScrollOk = emojiGrid.scrollTop > initial;
          gridMetrics = {
            initialScrollTop: initial,
            newScrollTop: emojiGrid.scrollTop,
            scrollHeight: emojiGrid.scrollHeight,
            clientHeight: emojiGrid.clientHeight,
            hasCustomScrollbar: emojiGrid.classList.contains('custom-scrollbar')
          };
        }

        // 4. Test Search filter
        const searchInput = popover.querySelector('input[type="text"]');
        let searchResultsCount = 0;
        if (searchInput) {
          searchInput.value = 'cat';
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          // count emoji buttons
          searchResultsCount = popover.querySelectorAll('.grid button').length;
        }

        // 5. Test messages feed above composer
        const chatFeed = document.querySelector('.flex-1.overflow-y-auto.custom-scrollbar');

        return {
          quickBar: {
            scrollOk: quickBarScrollOk,
            scrollWidth: quickBarScrollWidth,
            clientWidth: quickBarClientWidth
          },
          categoryTabs: {
            scrollOk: catTabsScrollOk,
            scrollWidth: catTabsScrollWidth,
            clientWidth: catTabsClientWidth
          },
          emojiGrid: {
            scrollOk: emojiGridScrollOk,
            metrics: gridMetrics
          },
          searchFilter: {
            active: !!searchInput,
            results: searchResultsCount
          },
          chatFeedAboveComposer: {
            present: !!chatFeed,
            hasCustomScrollbar: chatFeed?.classList.contains('custom-scrollbar')
          }
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Scroll Verification Details:', JSON.stringify(scrollVerification.result.value, null, 2));

  // Capture screenshot of the open and scrolled popover
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshot.data, 'base64');
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'emoji_scrolling_verified.png'), buffer);
  console.log('Saved screenshot: emoji_scrolling_verified.png');

  ws.close();
}

run().catch(console.error);
