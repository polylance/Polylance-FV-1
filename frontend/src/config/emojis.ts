/**
 * PolyLance Chat Emojis Configuration
 * Structured into categories with quick access collections.
 * Add new emojis or categories easily by appending to the arrays below.
 */

export interface EmojiCategory {
  id: string;
  name: string;
  icon: string;
  emojis: string[];
}

// 1. Reactions, faces & hearts
export const EXPRESSIONS_AND_REACTIONS: string[] = [
  '👍', '👎', '❤️', '😂', '🎉', '🔥', '🚀', '💻', '💡', '👏', '👀', '💬', '💯',
  '😍', '🥰', '😘', '😊', '😁', '😎', '🤔', '😭', '🤣', '😢', '😡', '🤯', '🥳',
  '😴', '🤗', '🙏', '🙌', '🤝', '🫶', '💪', '👌', '✌️', '🤞', '👋', '🫡', '🤷',
  '🤦', '🙄', '😏', '😅', '😆', '😉', '😋', '😇', '🥹', '😤', '😱', '🤫', '🤭',
  '🫣', '🫠', '🤐', '🥱', '🤮', '🤧', '😷', '🤒', '🤕', '😈', '👻', '💀', '🤡',
  '👽', '🤖'
];

export const HEARTS_AND_LOVE: string[] = [
  '❤️', '🩷', '🧡', '💛', '💚', '💙', '🩵', '💜', '🤎', '🖤', '🩶', '🤍', '💔',
  '❤️🔥', '❤️🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '❣️', '💌', '💋',
  '💑', '💏', '😍', '🥰', '😘', '💐', '🌹'
];

// Deduplicated merged reactions & hearts collection
export const REACTIONS_AND_HEARTS: string[] = Array.from(
  new Set([...EXPRESSIONS_AND_REACTIONS, ...HEARTS_AND_LOVE])
);

// 2. Animals & nature
export const ANIMALS_AND_NATURE: string[] = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷',
  '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄',
  '🐝', '🦋', '🐌', '🐞', '🐢', '🐍', '🦎', '🐙', '🦀', '🐠', '🐬', '🐳', '🦈',
  '🐊', '🐘', '🦒', '🦓', '🦍', '🦛', '🦏', '🐪', '🐫', '🦘', '🦥', '🦦', '🦨',
  '🦡', '🐿️', '🦔', '🌸', '🌹', '🌻', '🌷', '🌱', '🌲', '🌴', '🌵', '🍀', '🍁',
  '🍂', '🍄', '🌈', '☀️', '🌙', '⭐', '⚡', '❄️', '🔥', '🌊', '🌍', '🌎', '🌏',
  '🌧️', '⛈️', '🌪️', '🌫️'
];

// 3. Food & drinks
export const FOOD_AND_DRINKS: string[] = [
  '🍎', '🍏', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍',
  '🥥', '🥝', '🍅', '🥑', '🥦', '🥕', '🌽', '🌶️', '🥒', '🥬', '🧄', '🧅', '🥔',
  '🍞', '🥐', '🥨', '🧀', '🥚', '🍳', '🥞', '🧇', '🥓', '🍔', '🍟', '🍕', '🌭',
  '🥪', '🌮', '🌯', '🍜', '🍝', '🍣', '🍱', '🍛', '🍚', '🍗', '🍖', '🍩', '🍪',
  '🎂', '🍰', '🧁', '🍫', '🍿', '🍦', '🍨', '🍧', '🍮', '☕', '🫖', '🧋', '🥤',
  '🧃', '🥛', '💧', '🍵', '🧉'
];

// 4. Technology & everyday objects
export const TECHNOLOGY_AND_OBJECTS: string[] = [
  '💻', '🖥️', '🖨️', '⌨️', '🖱️', '📱', '📲', '☎️', '📞', '🔋', '🔌', '💾', '💿',
  '📷', '📸', '🎥', '🎬', '📺', '📻', '🎙️', '🎧', '🎤', '🔍', '🔎', '💡', '🔦',
  '🕯️', '🧯', '🔧', '🔨', '⚙️', '🛠️', '🔩', '🔑', '🔒', '🔓', '📚', '📖', '📝',
  '✏️', '📌', '📍', '✂️', '📦', '✉️', '📩', '📅', '📈', '📉', '💰', '💳', '🛒',
  '🎁', '🏆', '🥇', '🎯', '🧠', '🤖', '🧪', '🔬', '🧬', '🛡️', '🪄', '🧰', '🪛',
  '🪜', '🧲', '🪫', '🗜️'
];

// 5. Symbols & status indicators
export const SYMBOLS_AND_INDICATORS: string[] = [
  '✅', '❌', '☑️', '✔️', '✖️', '➕', '➖', '➗', '✳️', '❗', '❓', '‼️', '⁉️',
  '💯', '♻️', '⚠️', '🚫', '⛔', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪',
  '🟤', '⬆️', '⬇️', '⬅️', '➡️', '↗️', '↘️', '🔄', '🔁', '🔃', '🔔', '🔕', '🔊',
  '🔇', '⭐', '✨', '💫', '💥', '💦', '💨', '💤', '♾️', '©️', '®️', '™️', '🔗',
  '🔒', '🔑', '💲', '➰', '➿', '〰️', '🔆', '🔅', '⭕', '❇️', '✴️', '🔱', '⚜️',
  '☯️', '☮️', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'
];

// 6. Travel & places
export const TRAVEL_AND_PLACES: string[] = [
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚚', '🚛', '🚜', '🛵',
  '🏍️', '🚲', '🛴', '✈️', '🛫', '🛬', '🚀', '🛸', '🚁', '🚢', '⛵', '🚂', '🚆',
  '🚇', '🚉', '⛽', '🗺️', '🧭', '🏠', '🏡', '🏢', '🏫', '🏥', '🏦', '🏨', '🏰',
  '🗼', '🗽', '⛪', '🕌', '🛕', '🏖️', '🏝️', '🏔️', '⛰️', '🌋', '🏕️', '⛺', '🌆',
  '🌃', '🌉', '🌌', '🏟️', '🏛️', '🏗️', '🏭', '🏬', '🏪', '🏘️', '⛲', '⛱️'
];

// 7. Sports & entertainment
export const SPORTS_AND_ENTERTAINMENT: string[] = [
  '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒',
  '🏑', '🥊', '🥋', '⛳', '🏹', '🎣', '🤿', '🥇', '🏆', '🎮', '🕹️', '🎲', '🧩',
  '🎯', '🎨', '🎭', '🎪', '🎤', '🎧', '🎼', '🎹', '🥁', '🎸', '🎻', '🎬', '🎞️',
  '🎟️', '🎫', '🎉', '🎊', '🎈', '🎂', '🎁', '🎵', '🎶', '🎷', '🪇', '🪘', '🪩',
  '🎺', '🎻', '🪕', '🎰', '🎳', '🎿', '⛷️', '🏂', '🛹', '🛼', '🪁', '🏄', '🏊',
  '🚴', '🏋️', '🤸', '🧘'
];

/**
 * Top quick reactions shown in the header of the picker
 */
export const QUICK_REACTIONS: string[] = [
  '👍', '👎', '❤️', '😂', '🎉', '🔥', '🚀', '💻', '💡', '👏', '👀', '💯'
];

/**
 * Categorized emoji groupings for tabbed or sectioned rendering
 */
export const CHAT_EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'reactions',
    name: 'Reactions & Hearts',
    icon: '😊',
    emojis: REACTIONS_AND_HEARTS,
  },
  {
    id: 'animals',
    name: 'Animals & Nature',
    icon: '🐱',
    emojis: ANIMALS_AND_NATURE,
  },
  {
    id: 'food',
    name: 'Food & Drinks',
    icon: '🍕',
    emojis: FOOD_AND_DRINKS,
  },
  {
    id: 'tech',
    name: 'Tech & Objects',
    icon: '💻',
    emojis: TECHNOLOGY_AND_OBJECTS,
  },
  {
    id: 'symbols',
    name: 'Symbols & Status',
    icon: '✅',
    emojis: SYMBOLS_AND_INDICATORS,
  },
  {
    id: 'travel',
    name: 'Travel & Places',
    icon: '🚀',
    emojis: TRAVEL_AND_PLACES,
  },
  {
    id: 'sports',
    name: 'Sports & Fun',
    icon: '🎮',
    emojis: SPORTS_AND_ENTERTAINMENT,
  },
];

/**
 * Complete flat array of all chat emojis (deduplicated)
 */
export const ALL_CHAT_EMOJIS: string[] = Array.from(
  new Set(CHAT_EMOJI_CATEGORIES.flatMap((c) => c.emojis))
);
