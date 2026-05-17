import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';

const rules = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');

describe('Firestore security rules guardrails', () => {
  test('feature flag config is readable but writable only by super admins', () => {
    expect(rules).toContain('match /app_config/{docId}');
    expect(rules).toContain('allow read: if isAuthenticated();');
    expect(rules).toContain('allow create, update, delete: if isSuperAdmin();');
  });

  test('company feature overrides include team membership read access', () => {
    expect(rules).toContain('match /company_config/{orgId}');
    expect(rules).toContain('exists(/databases/$(database)/documents/users/$(request.auth.uid)/myTeams/$(orgId))');
  });

  test('joined teams are server-managed from the client perspective', () => {
    expect(rules).toContain('match /users/{userId}/myTeams/{teamId}');
    expect(rules).toContain('allow read: if isAuthenticated() && request.auth.uid == userId;');
    expect(rules).toContain('allow create, update, delete: if false;');
  });
});
