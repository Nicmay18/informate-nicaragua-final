import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    metadata: vi.fn(() => Promise.resolve({ width: 800, height: 600 })),
    resize: vi.fn(function () { return this; }),
    toFormat: vi.fn(function () { return this; }),
    toBuffer: vi.fn(() => Promise.resolve(Buffer.from('fake-webp'))),
  })),
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn(() => Promise.resolve(Buffer.from('fake-image'))),
  default: { readFile: vi.fn(() => Promise.resolve(Buffer.from('fake-image'))) },
}));

const { GET } = await import('@/app/api/transform/route');

function makeRequest(url: string): Request {
  return new Request(`https://nicaraguainformate.com${url}`);
}

describe('SSRF Protection — /api/transform', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rechaza http:// (non-HTTPS)', async () => {
    const req = makeRequest('/api/transform?url=http://cdn.jsdelivr.net/npm/test.jpg&ratio=1x1');
    const res = await GET(req as any);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toContain('HTTPS');
  });

  it('rechaza localhost', async () => {
    const req = makeRequest('/api/transform?url=https://localhost/secret&ratio=1x1');
    const res = await GET(req as any);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toContain('bloqueado');
  });

  it('rechaza 127.0.0.1', async () => {
    const req = makeRequest('/api/transform?url=https://127.0.0.1/secret&ratio=1x1');
    const res = await GET(req as any);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toContain('bloqueado');
  });

  it('rechaza 169.254.169.254 (cloud metadata)', async () => {
    const req = makeRequest('/api/transform?url=https://169.254.169.254/latest/meta-data&ratio=1x1');
    const res = await GET(req as any);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toContain('bloqueado');
  });

  it('rechaza 10.x.x.x (RFC1918 private)', async () => {
    const req = makeRequest('/api/transform?url=https://10.0.0.1/internal&ratio=1x1');
    const res = await GET(req as any);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toContain('bloqueado');
  });

  it('rechaza 192.168.x.x (RFC1918 private)', async () => {
    const req = makeRequest('/api/transform?url=https://192.168.1.1/admin&ratio=1x1');
    const res = await GET(req as any);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toContain('bloqueado');
  });

  it('rechaza 172.16.x.x (RFC1918 private)', async () => {
    const req = makeRequest('/api/transform?url=https://172.16.0.1/internal&ratio=1x1');
    const res = await GET(req as any);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toContain('bloqueado');
  });

  it('rechaza 0.0.0.0', async () => {
    const req = makeRequest('/api/transform?url=https://0.0.0.0/&ratio=1x1');
    const res = await GET(req as any);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toContain('bloqueado');
  });

  it('rechaza host no permitido', async () => {
    const req = makeRequest('/api/transform?url=https://evil.com/image.jpg&ratio=1x1');
    const res = await GET(req as any);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toContain('no permitido');
  });

  it('rechaza URL sin protocolo http/https (ej: file://)', async () => {
    const req = makeRequest('/api/transform?url=file:///etc/passwd&ratio=1x1');
    const res = await GET(req as any);
    expect(res.status).toBe(400);
  });

  it('rechaza data: URI', async () => {
    const req = makeRequest('/api/transform?url=data:image/png;base64,abc&ratio=1x1');
    const res = await GET(req as any);
    expect(res.status).toBe(400);
  });

  it('rechaza javascript: URI', async () => {
    const req = makeRequest('/api/transform?url=javascript:alert(1)&ratio=1x1');
    const res = await GET(req as any);
    expect(res.status).toBe(400);
  });

  it('acepta URL local relativa (/images/foto.webp)', async () => {
    const req = makeRequest('/api/transform?url=/images/test.webp&ratio=1x1');
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/webp');
  });

  it('rechaza falta de parámetro url', async () => {
    const req = makeRequest('/api/transform?ratio=1x1');
    const res = await GET(req as any);
    expect(res.status).toBe(400);
  });

  it('rechaza ratio inválido', async () => {
    const req = makeRequest('/api/transform?url=/images/test.webp&ratio=2x2');
    const res = await GET(req as any);
    expect(res.status).toBe(400);
  });
});
