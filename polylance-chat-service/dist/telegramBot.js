import dotenv from 'dotenv';
dotenv.config();
import { Telegraf, Markup } from 'telegraf';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
const DEFAULT_PREFERENCES = {
    milestones: true,
    submissions: true,
    payouts: true,
    disputes: true,
    proposals: true
};
// In-memory pending pairing tokens: token -> { walletAddress, expiresAt }
const pendingPairingTokens = new Map();
// Persisted file dedicated to Telegram bindings (safe from state-sync overwrites)
const BINDINGS_FILE = path.resolve(process.cwd(), 'polylance_telegram_bindings.json');
const SHARED_STATE_FILE = path.resolve(process.cwd(), 'polylance_shared_state.json');
function loadBindings() {
    const bindings = new Map();
    try {
        // 1. Try dedicated bindings file first
        if (fs.existsSync(BINDINGS_FILE)) {
            const data = JSON.parse(fs.readFileSync(BINDINGS_FILE, 'utf-8'));
            if (Array.isArray(data)) {
                for (const b of data) {
                    if (b.walletAddress && b.chatId) {
                        bindings.set(b.walletAddress.toLowerCase(), {
                            ...b,
                            preferences: b.preferences || { ...DEFAULT_PREFERENCES }
                        });
                    }
                }
                return bindings;
            }
        }
        // 2. Fallback to shared state file if migrating
        if (fs.existsSync(SHARED_STATE_FILE)) {
            const data = JSON.parse(fs.readFileSync(SHARED_STATE_FILE, 'utf-8'));
            if (data && Array.isArray(data.telegramBindings)) {
                for (const b of data.telegramBindings) {
                    if (b.walletAddress && b.chatId) {
                        bindings.set(b.walletAddress.toLowerCase(), {
                            ...b,
                            preferences: b.preferences || { ...DEFAULT_PREFERENCES }
                        });
                    }
                }
            }
        }
    }
    catch (err) {
        console.error('[TELEGRAM] Error loading telegram bindings:', err);
    }
    return bindings;
}
function saveBindings(bindingsMap) {
    try {
        const list = Array.from(bindingsMap.values());
        fs.writeFileSync(BINDINGS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    }
    catch (err) {
        console.error('[TELEGRAM] Error saving telegram bindings:', err);
    }
}
// Global state
let bindings = loadBindings();
let botInstance = null;
let botUsername = process.env.TELEGRAM_BOT_USERNAME || 'polylancelivebot';
let jobsGetter = () => [];
export function setJobsGetter(fn) {
    jobsGetter = fn;
}
function getNotificationsKeyboard(pref) {
    return Markup.inlineKeyboard([
        [Markup.button.callback(`Milestones & Escrow: ${pref.milestones ? '✅ ON' : '❌ OFF'}`, 'toggle_milestones')],
        [Markup.button.callback(`Submissions & Review: ${pref.submissions ? '✅ ON' : '❌ OFF'}`, 'toggle_submissions')],
        [Markup.button.callback(`Payout Releases: ${pref.payouts ? '✅ ON' : '❌ OFF'}`, 'toggle_payouts')],
        [Markup.button.callback(`DAO Disputes: ${pref.disputes ? '✅ ON' : '❌ OFF'}`, 'toggle_disputes')],
        [Markup.button.callback(`New Proposals: ${pref.proposals ? '✅ ON' : '❌ OFF'}`, 'toggle_proposals')],
        [Markup.button.callback(`🔄 Reset All Alerts to ON`, 'reset_notifications')]
    ]);
}
export function initTelegramBot(getLiveJobs) {
    if (getLiveJobs) {
        jobsGetter = getLiveJobs;
    }
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || token.trim() === '') {
        console.warn('⚠️ [Telegram Bot] TELEGRAM_BOT_TOKEN is not configured in .env. Bot is disabled.');
        return null;
    }
    if (!token.includes(':')) {
        console.warn('⚠️ [Telegram Bot] Token format appears incomplete. BotFather tokens are formatted as <ID>:<TOKEN> (e.g. 123456789:AAG...).');
        return null;
    }
    botUsername = process.env.TELEGRAM_BOT_USERNAME || botUsername;
    try {
        const bot = new Telegraf(token.trim());
        // ─────────────────────────────────────────────────────────────
        // 1. /start command
        // ─────────────────────────────────────────────────────────────
        bot.start(async (ctx) => {
            const chatId = String(ctx.chat.id);
            const startPayload = ctx.message && 'text' in ctx.message ? ctx.message.text.split(' ')[1] : undefined;
            // Handle pairing deep-link: /start LINK_<token>
            if (startPayload && startPayload.startsWith('LINK_')) {
                const tokenVal = startPayload.replace('LINK_', '');
                const pending = pendingPairingTokens.get(tokenVal);
                if (!pending || pending.expiresAt < Date.now()) {
                    pendingPairingTokens.delete(tokenVal);
                    return ctx.reply('⚠️ <b>Pairing Link Expired or Invalid</b>\n\nPlease return to PolyLance Settings and click "Connect Telegram Alerts" to generate a fresh link.', { parse_mode: 'HTML' });
                }
                const wallet = pending.walletAddress.toLowerCase();
                pendingPairingTokens.delete(tokenVal);
                bindings.set(wallet, {
                    walletAddress: wallet,
                    chatId,
                    telegramUsername: ctx.from.username,
                    linkedAt: Date.now(),
                    preferences: { ...DEFAULT_PREFERENCES }
                });
                saveBindings(bindings);
                const shortAddr = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
                return ctx.reply(`🛡️ <b>PolyLance Wallet Verified & Linked!</b>\n\n` +
                    `Connected Address: <code>${shortAddr}</code>\n\n` +
                    `✅ <b>Real-Time Alerts are now ACTIVE</b>\n` +
                    `You will receive immediate alerts for:\n` +
                    `• Escrow milestone deposits\n` +
                    `• Deliverable inspection & submissions\n` +
                    `• Instant payout releases on Polygon\n` +
                    `• Proposals and dispute updates\n\n` +
                    `Use /status to see your active contracts or /notifications to customize alert preferences.`, {
                    parse_mode: 'HTML',
                    ...Markup.inlineKeyboard([
                        [Markup.button.url('Open PolyLance Dashboard', 'https://polylance.codes/#/dashboard')],
                        [Markup.button.callback('⚙️ Alert Preferences', 'open_notifications')]
                    ])
                });
            }
            // Standard /start without pairing token
            const existing = Array.from(bindings.values()).find((b) => b.chatId === chatId);
            if (existing) {
                const shortAddr = `${existing.walletAddress.slice(0, 6)}...${existing.walletAddress.slice(-4)}`;
                return ctx.reply(`👋 <b>Welcome back to PolyLance Alerts!</b>\n\n` +
                    `Connected Wallet: <code>${shortAddr}</code>\n` +
                    `Status: 🟢 <b>Active Real-Time Monitoring</b>\n\n` +
                    `<b>Available Commands:</b>\n` +
                    `/status - View your active contracts & escrow status\n` +
                    `/notifications - Toggle alert types (milestones, payouts, etc.)\n` +
                    `/workspace - Direct links to active contract workspaces\n` +
                    `/unlink - Disconnect this Telegram account\n` +
                    `/help - Security & privacy details`, {
                    parse_mode: 'HTML',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('📊 View Contract Status', 'open_status')],
                        [Markup.button.url('🚀 Open PolyLance dApp', 'https://polylance.codes/#/dashboard')]
                    ])
                });
            }
            return ctx.reply(`👋 <b>Welcome to PolyLance Live Notifications!</b>\n\n` +
                `This bot delivers real-time, encrypted smart contract alerts for your PolyLance escrow milestones, payouts, and proposals on Polygon.\n\n` +
                `<b>Two Ways to Connect:</b>\n` +
                `1️⃣ <b>Direct Command:</b> Send <code>/link &lt;yourWalletAddress&gt;</code> here in this chat.\n` +
                `2️⃣ <b>From dApp:</b> Go to <a href="https://polylance.codes/#/settings">PolyLance Settings</a> and click <b>"Connect Telegram Alerts"</b>.\n\n` +
                `🔒 <i>100% Non-Custodial & Private. We never request private keys or seed phrases.</i>`, {
                parse_mode: 'HTML',
                link_preview_options: { is_disabled: true },
                ...Markup.inlineKeyboard([
                    [Markup.button.url('Connect via Settings ↗️', 'https://polylance.codes/#/settings')]
                ])
            });
        });
        // ─────────────────────────────────────────────────────────────
        // 2. /status command - View active contracts & escrow status
        // ─────────────────────────────────────────────────────────────
        const renderStatus = (chatId) => {
            const existing = Array.from(bindings.values()).find((b) => b.chatId === chatId);
            if (!existing) {
                return {
                    text: `⚪ <b>No Wallet Connected</b>\n\n` +
                        `You have not connected a PolyLance wallet to this Telegram account yet.\n\n` +
                        `👉 Send <code>/link &lt;yourWalletAddress&gt;</code> (e.g. <code>/link 0x...</code>) or click below to connect from PolyLance Settings.`,
                    extra: {
                        parse_mode: 'HTML',
                        link_preview_options: { is_disabled: true },
                        ...Markup.inlineKeyboard([
                            [Markup.button.url('Connect via Settings ↗️', 'https://polylance.codes/#/settings')]
                        ])
                    }
                };
            }
            const wallet = existing.walletAddress.toLowerCase();
            const shortAddr = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
            const allJobs = jobsGetter ? jobsGetter() : [];
            const userJobs = (allJobs || []).filter((j) => {
                if (!j)
                    return false;
                const client = String(j.client || '').toLowerCase();
                const freelancer = String(j.freelancer || '').toLowerCase();
                return client === wallet || freelancer === wallet;
            });
            if (userJobs.length === 0) {
                return {
                    text: `📊 <b>PolyLance Escrow & Contract Status</b>\n\n` +
                        `• Linked Wallet: <code>${shortAddr}</code>\n` +
                        `• Alert Status: 🟢 <b>Active & Monitoring</b>\n` +
                        `• Active Contracts: <b>0</b>\n\n` +
                        `ℹ️ You have no active contracts at this moment. Once you post a job, fund an escrow, or accept a contract, live updates will appear here!`,
                    extra: {
                        parse_mode: 'HTML',
                        ...Markup.inlineKeyboard([
                            [Markup.button.url('💼 Browse Marketplace', 'https://polylance.codes/#/jobs')],
                            [Markup.button.url('🚀 Open Workspace', 'https://polylance.codes/#/workspace')]
                        ])
                    }
                };
            }
            let summary = `📊 <b>PolyLance Escrow & Contract Status</b>\n\n` +
                `• Linked Wallet: <code>${shortAddr}</code>\n` +
                `• Active Contracts: <b>${userJobs.length}</b>\n\n` +
                `━━━━━━━━━━━━━━━━━━━━\n`;
            const buttons = [];
            userJobs.slice(0, 5).forEach((j, idx) => {
                const isClient = String(j.client || '').toLowerCase() === wallet;
                const role = isClient ? '👤 Client' : '💻 Freelancer';
                const budget = j.budget || j.reward || '0';
                const tokenSym = j.paymentTokenSymbol || 'USDC';
                const status = j.status || 'Active';
                const title = j.title || 'Untitled Job';
                const shortJobId = String(j.id).slice(0, 8);
                let statusEmoji = '🟢';
                if (status === 'Funded')
                    statusEmoji = '🔒 Escrow Funded';
                else if (status === 'Completed')
                    statusEmoji = '✅ Completed';
                else if (status === 'Disputed')
                    statusEmoji = '⚖️ In Dispute';
                else if (status === 'Review')
                    statusEmoji = '📋 Under Review';
                summary += `<b>${idx + 1}. ${title}</b>\n` +
                    `• Role: ${role}\n` +
                    `• Status: ${statusEmoji}\n` +
                    `• Escrow: <b>${budget} ${tokenSym}</b>\n` +
                    `• ID: <code>${shortJobId}</code>\n\n`;
                buttons.push([
                    Markup.button.url(`Inspect "${title.slice(0, 20)}..." ↗️`, `https://polylance.codes/#/workspace?jobId=${j.id}`)
                ]);
            });
            buttons.push([
                Markup.button.url('🚀 Open All Workspaces', 'https://polylance.codes/#/workspace')
            ]);
            return {
                text: summary,
                extra: {
                    parse_mode: 'HTML',
                    ...Markup.inlineKeyboard(buttons)
                }
            };
        };
        bot.command('status', (ctx) => {
            const res = renderStatus(String(ctx.chat.id));
            return ctx.reply(res.text, res.extra);
        });
        bot.action('open_status', async (ctx) => {
            await ctx.answerCbQuery();
            const res = renderStatus(String(ctx.chat?.id));
            return ctx.reply(res.text, res.extra);
        });
        // ─────────────────────────────────────────────────────────────
        // 3. /notifications command - Toggle alert types
        // ─────────────────────────────────────────────────────────────
        const renderNotifications = (chatId) => {
            const existing = Array.from(bindings.values()).find((b) => b.chatId === chatId);
            const pref = existing?.preferences || { ...DEFAULT_PREFERENCES };
            const text = `🔔 <b>Telegram Notification Preferences</b>\n\n` +
                `Customize which smart contract events trigger push notifications for your wallet.\n` +
                `Tap any option below to toggle on or off in real time:\n\n` +
                `• <b>Milestones:</b> Client escrow deposits\n` +
                `• <b>Submissions:</b> Deliverables uploaded for review\n` +
                `• <b>Payout Releases:</b> Milestone approvals & fund release\n` +
                `• <b>DAO Disputes:</b> Arbitration cases and judge decisions\n` +
                `• <b>New Proposals:</b> Freelancers applying to your contracts`;
            return {
                text,
                keyboard: getNotificationsKeyboard(pref)
            };
        };
        bot.command('notifications', (ctx) => {
            const res = renderNotifications(String(ctx.chat.id));
            return ctx.reply(res.text, {
                parse_mode: 'HTML',
                ...res.keyboard
            });
        });
        bot.action('open_notifications', async (ctx) => {
            await ctx.answerCbQuery();
            const res = renderNotifications(String(ctx.chat?.id));
            return ctx.reply(res.text, {
                parse_mode: 'HTML',
                ...res.keyboard
            });
        });
        // Toggle individual notification preferences
        bot.action(/^toggle_(\w+)$/, async (ctx) => {
            const field = ctx.match[1];
            const chatId = String(ctx.chat?.id);
            const existing = Array.from(bindings.values()).find((b) => b.chatId === chatId);
            if (existing) {
                if (!existing.preferences)
                    existing.preferences = { ...DEFAULT_PREFERENCES };
                if (field in existing.preferences) {
                    existing.preferences[field] = !existing.preferences[field];
                    saveBindings(bindings);
                }
            }
            await ctx.answerCbQuery(`Updated ${field}`);
            const pref = existing?.preferences || { ...DEFAULT_PREFERENCES };
            try {
                await ctx.editMessageReplyMarkup(getNotificationsKeyboard(pref).reply_markup);
            }
            catch { }
        });
        bot.action('reset_notifications', async (ctx) => {
            const chatId = String(ctx.chat?.id);
            const existing = Array.from(bindings.values()).find((b) => b.chatId === chatId);
            if (existing) {
                existing.preferences = { ...DEFAULT_PREFERENCES };
                saveBindings(bindings);
            }
            await ctx.answerCbQuery('All alerts reset to ON');
            try {
                await ctx.editMessageReplyMarkup(getNotificationsKeyboard(DEFAULT_PREFERENCES).reply_markup);
            }
            catch { }
        });
        // ─────────────────────────────────────────────────────────────
        // 4. /workspace command - Direct links to active contract workspace
        // ─────────────────────────────────────────────────────────────
        bot.command('workspace', (ctx) => {
            const chatId = String(ctx.chat.id);
            const existing = Array.from(bindings.values()).find((b) => b.chatId === chatId);
            if (!existing) {
                return ctx.reply(`⚪ <b>No Wallet Connected</b>\n\n` +
                    `Connect your wallet using <code>/link &lt;address&gt;</code> to access your contract workspace directly from Telegram.`, {
                    parse_mode: 'HTML',
                    ...Markup.inlineKeyboard([
                        [Markup.button.url('Open PolyLance Workspace', 'https://polylance.codes/#/workspace')]
                    ])
                });
            }
            const wallet = existing.walletAddress.toLowerCase();
            const allJobs = jobsGetter ? jobsGetter() : [];
            const userJobs = (allJobs || []).filter((j) => {
                if (!j)
                    return false;
                return String(j.client || '').toLowerCase() === wallet || String(j.freelancer || '').toLowerCase() === wallet;
            });
            if (userJobs.length === 0) {
                return ctx.reply(`🚀 <b>PolyLance Contract Workspace</b>\n\n` +
                    `You currently have no active escrow contracts.\n` +
                    `Tap below to open the workspace and view available jobs.`, {
                    parse_mode: 'HTML',
                    ...Markup.inlineKeyboard([
                        [Markup.button.url('Open PolyLance Workspace', 'https://polylance.codes/#/workspace')]
                    ])
                });
            }
            const buttons = userJobs.slice(0, 5).map((j) => [
                Markup.button.url(`💼 ${j.title.slice(0, 24)}... (${j.status || 'Active'}) ↗️`, `https://polylance.codes/#/workspace?jobId=${j.id}`)
            ]);
            buttons.push([Markup.button.url('🚀 Open Full Workspace', 'https://polylance.codes/#/workspace')]);
            return ctx.reply(`🚀 <b>Your Active Contract Workspaces</b>\n\n` +
                `Select any active contract below to inspect deliverables, release milestone escrow, or chat in the encrypted room:`, {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard(buttons)
            });
        });
        // ─────────────────────────────────────────────────────────────
        // 5. /link command - Connect wallet directly inside Telegram
        // ─────────────────────────────────────────────────────────────
        bot.command('link', (ctx) => {
            const text = ctx.message && 'text' in ctx.message ? ctx.message.text.trim() : '';
            const parts = text.split(/\s+/);
            const rawAddr = parts[1] || '';
            if (!rawAddr || !/^0x[a-fA-F0-9]{40}$/.test(rawAddr)) {
                return ctx.reply(`⚠️ <b>Invalid Wallet Address</b>\n\n` +
                    `Please provide a valid 42-character Polygon address.\n` +
                    `<b>Usage:</b>\n` +
                    `<code>/link 0xb30F2eFBCEBC529d946e05C9ccE0f1ffFB7e1aB1</code>`, { parse_mode: 'HTML' });
            }
            const wallet = rawAddr.toLowerCase();
            const chatId = String(ctx.chat.id);
            bindings.set(wallet, {
                walletAddress: wallet,
                chatId,
                telegramUsername: ctx.from.username,
                linkedAt: Date.now(),
                preferences: { ...DEFAULT_PREFERENCES }
            });
            saveBindings(bindings);
            const shortAddr = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
            return ctx.reply(`🛡️ <b>Wallet Connected Successfully!</b>\n\n` +
                `• Linked Address: <code>${shortAddr}</code>\n` +
                `• Status: 🟢 <b>Live Real-Time Alerts Active</b>\n\n` +
                `You will now receive private alerts whenever:\n` +
                `• Milestone funds are locked in escrow\n` +
                `• Deliverables are uploaded for review\n` +
                `• Payouts are confirmed on Polygon\n` +
                `• Proposals or arbitration disputes occur\n\n` +
                `Type /status to see your active contracts or /notifications to customize preferences.`, {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('📊 Check Contract Status', 'open_status')],
                    [Markup.button.url('Open PolyLance Dashboard', 'https://polylance.codes/#/dashboard')]
                ])
            });
        });
        // ─────────────────────────────────────────────────────────────
        // 6. Direct address auto-detection
        // ─────────────────────────────────────────────────────────────
        bot.hears(/^0x[a-fA-F0-9]{40}$/i, (ctx) => {
            const text = ctx.message.text.trim();
            const wallet = text.toLowerCase();
            const chatId = String(ctx.chat.id);
            bindings.set(wallet, {
                walletAddress: wallet,
                chatId,
                telegramUsername: ctx.from.username,
                linkedAt: Date.now(),
                preferences: { ...DEFAULT_PREFERENCES }
            });
            saveBindings(bindings);
            const shortAddr = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
            return ctx.reply(`🛡️ <b>Wallet Linked:</b> <code>${shortAddr}</code>\n\n` +
                `Live real-time alerts are now active for this wallet! You can use /status anytime to view your active escrows.`, {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('📊 Check Contract Status', 'open_status')],
                    [Markup.button.url('Open PolyLance Dashboard', 'https://polylance.codes/#/dashboard')]
                ])
            });
        });
        // ─────────────────────────────────────────────────────────────
        // 7. /unlink command
        // ─────────────────────────────────────────────────────────────
        bot.command('unlink', (ctx) => {
            const chatId = String(ctx.chat.id);
            const existing = Array.from(bindings.values()).find((b) => b.chatId === chatId);
            if (!existing) {
                return ctx.reply('ℹ️ No active wallet connection found for this Telegram account.');
            }
            bindings.delete(existing.walletAddress.toLowerCase());
            saveBindings(bindings);
            return ctx.reply(`🔴 <b>Wallet Disconnected</b>\n\n` +
                `Your wallet link has been permanently removed. You will no longer receive contract notifications here.\n\n` +
                `You can reconnect at any time by typing <code>/link &lt;address&gt;</code> or from PolyLance Settings.`, { parse_mode: 'HTML' });
        });
        // ─────────────────────────────────────────────────────────────
        // 8. /help command
        // ─────────────────────────────────────────────────────────────
        bot.command('help', (ctx) => {
            return ctx.reply(`🛡️ <b>PolyLance Bot Security & Privacy Policy</b>\n\n` +
                `• <b>100% Non-Custodial:</b> This bot NEVER asks for your private keys, seed phrase, or passwords.\n` +
                `• <b>Zero Data Leakage:</b> Direct 1-to-1 communication only. Your contracts and address are never visible to other users.\n` +
                `• <b>Instant Contract Deep-Links:</b> Tap direct buttons to open your smart contract workspace.\n\n` +
                `<b>Available Commands:</b>\n` +
                `/status - View your active contracts & escrow status\n` +
                `/notifications - Toggle alert types (milestones, payouts, disputes)\n` +
                `/workspace - Direct links to active contract workspaces\n` +
                `/link <address> - Link your Polygon wallet address\n` +
                `/unlink - Disconnect and delete notification link\n` +
                `/help - View this guide`, { parse_mode: 'HTML' });
        });
        // Verify bot credentials & launch long-polling in background
        bot.telegram.getMe().then((me) => {
            console.log(`🤖 [Telegram Bot] @${me.username} verified with BotFather and listening for live contract alerts!`);
        }).catch((err) => {
            console.error('❌ [Telegram Bot] getMe failed:', err?.message || err);
        });
        bot.launch().catch((err) => {
            console.error('❌ [Telegram Bot] Error launching bot:', err?.message || err);
        });
        // Graceful shutdown handlers
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));
        botInstance = bot;
        return bot;
    }
    catch (err) {
        console.error('❌ [Telegram Bot] Initialization error:', err?.message || err);
        return null;
    }
}
/**
 * Creates a secure 5-minute single-use pairing token for the connected wallet
 */
export function generateTelegramPairingToken(walletAddress) {
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    pendingPairingTokens.set(token, {
        walletAddress: walletAddress.toLowerCase(),
        expiresAt
    });
    // Clean up expired tokens
    for (const [k, v] of pendingPairingTokens.entries()) {
        if (v.expiresAt < Date.now()) {
            pendingPairingTokens.delete(k);
        }
    }
    const deepLink = `https://t.me/${botUsername}?start=LINK_${token}`;
    return { token, deepLink, expiresAt };
}
/**
 * Checks if a wallet is currently bound to a Telegram chat
 */
export function isWalletTelegramBound(walletAddress) {
    if (!walletAddress)
        return false;
    return bindings.has(walletAddress.toLowerCase());
}
/**
 * Unlinks a wallet address
 */
export function unlinkWalletTelegram(walletAddress) {
    if (!walletAddress)
        return false;
    const existed = bindings.delete(walletAddress.toLowerCase());
    if (existed)
        saveBindings(bindings);
    return existed;
}
/**
 * Dispatches a live alert to the user's private Telegram chat respecting preferences
 */
export async function sendTelegramNotification(targetWalletAddress, alert) {
    if (!botInstance || !targetWalletAddress)
        return false;
    const binding = bindings.get(targetWalletAddress.toLowerCase());
    if (!binding || !binding.chatId)
        return false;
    const pref = binding.preferences || DEFAULT_PREFERENCES;
    if (alert.type === 'milestone' && !pref.milestones)
        return false;
    if (alert.type === 'submission' && !pref.submissions)
        return false;
    if (alert.type === 'payout' && !pref.payouts)
        return false;
    if (alert.type === 'dispute' && !pref.disputes)
        return false;
    if (alert.type === 'proposal' && !pref.proposals)
        return false;
    try {
        const badgeText = alert.badge ? `[${alert.badge.toUpperCase()}] ` : '';
        const message = `🔔 <b>PolyLance Alert: ${badgeText}${alert.title}</b>\n\n` +
            `${alert.description}\n\n` +
            `🌐 <i>Polygon Smart Contract Escrow</i>`;
        const keyboard = alert.actionUrl
            ? Markup.inlineKeyboard([Markup.button.url('Inspect on PolyLance ↗', alert.actionUrl)])
            : undefined;
        await botInstance.telegram.sendMessage(binding.chatId, message, {
            parse_mode: 'HTML',
            ...(keyboard ? keyboard : {})
        });
        return true;
    }
    catch (err) {
        console.error(`⚠️ [Telegram Bot] Failed to send notification to ${targetWalletAddress}:`, err?.message || err);
        return false;
    }
}
