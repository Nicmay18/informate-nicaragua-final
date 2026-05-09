const Security = require('./security');

describe('Security util', () => {
  test('sanitizeAttr should escape special HTML chars', () => {
    const encoded = Security.sanitizeAttr("<script>alert('x')</script>");
    expect(encoded).toBe('&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;');
  });

  test('isValidURL returns true for valid URL and false for invalid', () => {
    expect(Security.isValidURL('https://example.com')).toBe(true);
    expect(Security.isValidURL('nota-url')).toBe(false);
  });

  test('escapeRegExp should escape regex metacharacters', () => {
    expect(Security.escapeRegExp('hello.*+?^${}()|[\\]')).toBe('hello\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
  });

  test('createRateLimiter should limit calls', () => {
    const limiter = Security.createRateLimiter(2, 1000);
    expect(limiter()).toBe(true);
    expect(limiter()).toBe(true);
    expect(limiter()).toBe(false);
  });
});
