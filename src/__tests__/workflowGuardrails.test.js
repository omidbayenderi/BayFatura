import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';

const readWorkflow = (name) => fs.readFileSync(path.join(process.cwd(), '.github', 'workflows', name), 'utf8');

describe('GitHub workflow guardrails', () => {
  test('core workflows use Node.js 22', () => {
    [
      'ci.yml',
      'deploy-production.yml',
      'preview-deploy.yml',
      'android-build.yml',
      'ios-build.yml',
    ].forEach((workflow) => {
      expect(readWorkflow(workflow)).toContain("node-version: '22'");
    });
  });

  test('preview deploy uses staging Firebase credentials only', () => {
    const previewWorkflow = readWorkflow('preview-deploy.yml');

    expect(previewWorkflow).toContain('secrets.STAGING_FIREBASE_SERVICE_ACCOUNT');
    expect(previewWorkflow).toContain('secrets.STAGING_VITE_FIREBASE_PROJECT_ID');
    expect(previewWorkflow).not.toContain('secrets.FIREBASE_SERVICE_ACCOUNT');
    expect(previewWorkflow).not.toContain('secrets.VITE_FIREBASE_PROJECT_ID }}');
    expect(previewWorkflow).not.toContain('channelId: live');
  });

  test('production deploy remains manual-only', () => {
    const productionWorkflow = readWorkflow('deploy-production.yml');

    expect(productionWorkflow).toContain('workflow_dispatch:');
    expect(productionWorkflow).toContain('environment: production');
    expect(productionWorkflow).not.toMatch(/\npush:/);
  });
});
