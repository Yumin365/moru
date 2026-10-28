import { describe, expect, it } from 'vitest';
import { contrast } from './color';
import { buildPalette, PRESETS, themeWarnings } from './palette';

describe('palette builder', () => {
  it.each(PRESETS)('$name: every text colour stays readable', (p) => {
    const t = buildPalette({ preset: p.id, accent: p.accent, secondary: p.secondary, neutral: p.neutral });
    expect(contrast(t['--accent-ink'], t['--accent'])).toBeGreaterThanOrEqual(4.5); // button label
    expect(contrast(t['--accent-text'], '#ffffff')).toBeGreaterThanOrEqual(4.5); // accent text on cards
    expect(contrast(t['--iris-text'], '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t['--accent-bright'], t['--dark'])).toBeGreaterThanOrEqual(4.5); // on the dark hero card
    expect(contrast(t['--accent-deep'], t['--accent-2'])).toBeGreaterThanOrEqual(4.5); // calendar mid shade
    expect(t['--accent-rgb']).toMatch(/^\d+, \d+, \d+$/);
  });
  it('warns when the two colours are too close', () => {
    expect(themeWarnings({ preset: 'custom', accent: '#a8357c', secondary: '#a8357d', neutral: 'neutral' })).toHaveLength(1);
    expect(themeWarnings({ preset: 'plum', accent: '#a8357c', secondary: '#4766e4', neutral: 'neutral' })).toHaveLength(0);
  });
});
