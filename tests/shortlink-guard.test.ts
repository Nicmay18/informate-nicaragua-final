import { describe, it, expect, beforeEach } from 'vitest';
import {
  alreadyCounted,
  anonymizeIp,
  dedupKey,
  isNonClickUserAgent,
  overRateLimit,
  _resetShortlinkGuard,
} from '@/lib/shortlink-guard';

describe('shortlink-guard (SEC-02)', () => {
  beforeEach(() => _resetShortlinkGuard());

  it.each([
    'WhatsApp/2.23',
    'TelegramBot (like TwitterBot)',
    'facebookexternalhit/1.1',
    'Googlebot/2.1',
    'Twitterbot/1.0',
    'curl/8.0',
    'Mozilla/5.0 (compatible; bingbot/2.0)',
  ])('no cuenta UA de bot/preview: %s', (ua) => {
    expect(isNonClickUserAgent(ua)).toBe(true);
  });

  it.each([
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
    'Mozilla/5.0 (Linux; Android 14) Chrome/120.0 Mobile',
  ])('cuenta UA de navegador real: %s', (ua) => {
    expect(isNonClickUserAgent(ua)).toBe(false);
  });

  it('deduplica el mismo cliente+link dentro de la ventana', () => {
    const k = dedupKey('abc', '1.2.3.4', 'ua-x');
    expect(alreadyCounted(k)).toBe(false);
    expect(alreadyCounted(k)).toBe(true);
    expect(alreadyCounted(k)).toBe(true);
  });

  it('clientes distintos o links distintos cuentan por separado', () => {
    expect(alreadyCounted(dedupKey('a', '1.2.3.4', 'ua'))).toBe(false);
    expect(alreadyCounted(dedupKey('b', '1.2.3.4', 'ua'))).toBe(false);
    expect(alreadyCounted(dedupKey('a', '5.6.7.8', 'ua'))).toBe(false);
  });

  it('rate limit: 30/min por IP y luego deja de contar', () => {
    for (let i = 0; i < 30; i++) expect(overRateLimit('9.9.9.9')).toBe(false);
    expect(overRateLimit('9.9.9.9')).toBe(true);
    expect(overRateLimit('8.8.8.8')).toBe(false); // otra IP no afectada
  });

  it('anonimiza IPv4 a /24 e IPv6 a 4 grupos', () => {
    expect(anonymizeIp('192.168.1.55')).toBe('192.168.1.0');
    expect(anonymizeIp('2001:db8:85a3:8d3:1319:8a2e:370:7348')).toBe('2001:db8:85a3:8d3::');
    expect(anonymizeIp('unknown')).toBe('unknown');
  });
});
