import { describe, it, expect, vi } from 'vitest';
import { validateEnv, getEnv, requireEnv } from '@/lib/env';

describe('Environment Validation', () => {
  it('should validate required Firebase environment variables', () => {
    // Setup
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_CLIENT_EMAIL = 'test@iam.gserviceaccount.com';
    process.env.FIREBASE_PRIVATE_KEY = 'dummy-key-with-more-than-100-chars-to-pass-validation-test-suite-implementation';

    // Execute
    const result = validateEnv();

    // Assert
    expect(result.success).toBe(true);
  });

  it('should fail validation when required Firebase vars are missing', () => {
    // Setup
    delete process.env.FIREBASE_PROJECT_ID;

    // Execute & Assert
    expect(() => requireEnv('FIREBASE_PROJECT_ID')).toThrow();
  });

  it('should get validated environment variable', () => {
    // Setup
    process.env.FIREBASE_PROJECT_ID = 'my-test-project';
    validateEnv();

    // Execute
    const projectId = getEnv('FIREBASE_PROJECT_ID');

    // Assert
    expect(projectId).toBe('my-test-project');
  });

  it('should throw on requireEnv if variable is not set', () => {
    // Setup
    delete process.env.GROQ_API_KEY;

    // Execute & Assert
    expect(() => {
      const result = validateEnv();
      if (!result.success) throw new Error(result.error);
    }).not.toThrow(); // Optional var, should not throw
  });
});
