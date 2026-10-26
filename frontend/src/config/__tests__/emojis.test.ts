import { describe, it, expect } from 'vitest';
import {
  EXPRESSIONS_AND_REACTIONS,
  HEARTS_AND_LOVE,
  ANIMALS_AND_NATURE,
  FOOD_AND_DRINKS,
  TECHNOLOGY_AND_OBJECTS,
  SYMBOLS_AND_INDICATORS,
  TRAVEL_AND_PLACES,
  SPORTS_AND_ENTERTAINMENT,
  CHAT_EMOJI_CATEGORIES,
  ALL_CHAT_EMOJIS,
  QUICK_REACTIONS,
} from '../emojis';

describe('Chat Emojis Configuration', () => {
  it('contains all 7 required emoji categories', () => {
    expect(CHAT_EMOJI_CATEGORIES.length).toBe(7);
    const categoryIds = CHAT_EMOJI_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toEqual([
      'reactions',
      'animals',
      'food',
      'tech',
      'symbols',
      'travel',
      'sports',
    ]);
  });

  it('contains user-specified expressions and reactions', () => {
    expect(EXPRESSIONS_AND_REACTIONS).toContain('👍');
    expect(EXPRESSIONS_AND_REACTIONS).toContain('❤️');
    expect(EXPRESSIONS_AND_REACTIONS).toContain('🚀');
    expect(EXPRESSIONS_AND_REACTIONS).toContain('💻');
    expect(EXPRESSIONS_AND_REACTIONS.length).toBeGreaterThanOrEqual(60);
  });

  it('contains user-specified hearts and love collection', () => {
    expect(HEARTS_AND_LOVE).toContain('❤️');
    expect(HEARTS_AND_LOVE).toContain('💔');
    expect(HEARTS_AND_LOVE).toContain('💌');
    expect(HEARTS_AND_LOVE.length).toBeGreaterThanOrEqual(30);
  });

  it('contains animals and nature emojis', () => {
    expect(ANIMALS_AND_NATURE).toContain('🐶');
    expect(ANIMALS_AND_NATURE).toContain('🐱');
    expect(ANIMALS_AND_NATURE).toContain('🦄');
    expect(ANIMALS_AND_NATURE).toContain('🌈');
    expect(ANIMALS_AND_NATURE.length).toBeGreaterThanOrEqual(70);
  });

  it('contains food and drinks emojis', () => {
    expect(FOOD_AND_DRINKS).toContain('🍎');
    expect(FOOD_AND_DRINKS).toContain('🍕');
    expect(FOOD_AND_DRINKS).toContain('☕');
    expect(FOOD_AND_DRINKS.length).toBeGreaterThanOrEqual(60);
  });

  it('contains technology and objects emojis', () => {
    expect(TECHNOLOGY_AND_OBJECTS).toContain('💻');
    expect(TECHNOLOGY_AND_OBJECTS).toContain('🤖');
    expect(TECHNOLOGY_AND_OBJECTS).toContain('🛡️');
    expect(TECHNOLOGY_AND_OBJECTS.length).toBeGreaterThanOrEqual(60);
  });

  it('contains symbols and status indicator emojis', () => {
    expect(SYMBOLS_AND_INDICATORS).toContain('✅');
    expect(SYMBOLS_AND_INDICATORS).toContain('❌');
    expect(SYMBOLS_AND_INDICATORS).toContain('⚠️');
    expect(SYMBOLS_AND_INDICATORS.length).toBeGreaterThanOrEqual(70);
  });

  it('contains travel and places emojis', () => {
    expect(TRAVEL_AND_PLACES).toContain('🚗');
    expect(TRAVEL_AND_PLACES).toContain('✈️');
    expect(TRAVEL_AND_PLACES).toContain('🏰');
    expect(TRAVEL_AND_PLACES.length).toBeGreaterThanOrEqual(50);
  });

  it('contains sports and entertainment emojis', () => {
    expect(SPORTS_AND_ENTERTAINMENT).toContain('⚽');
    expect(SPORTS_AND_ENTERTAINMENT).toContain('🎮');
    expect(SPORTS_AND_ENTERTAINMENT).toContain('🎉');
    expect(SPORTS_AND_ENTERTAINMENT.length).toBeGreaterThanOrEqual(60);
  });

  it('provides a complete, deduplicated list of all emojis in ALL_CHAT_EMOJIS', () => {
    expect(ALL_CHAT_EMOJIS.length).toBeGreaterThanOrEqual(350);
    const uniqueSet = new Set(ALL_CHAT_EMOJIS);
    expect(uniqueSet.size).toBe(ALL_CHAT_EMOJIS.length);
  });

  it('includes top quick reaction shortcuts in QUICK_REACTIONS', () => {
    expect(QUICK_REACTIONS).toContain('👍');
    expect(QUICK_REACTIONS).toContain('❤️');
    expect(QUICK_REACTIONS).toContain('🔥');
    expect(QUICK_REACTIONS).toContain('💯');
  });
});
