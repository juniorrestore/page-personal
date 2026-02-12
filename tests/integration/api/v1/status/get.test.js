import user from 'models/user';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe('Get to /api/v1/status', () => {
  describe('with an anonymous user', () => {
    test('should return status without version', async () => {
      const response = await fetch('http://localhost:3000/api/v1/status');
      const responseBody = (await response.json()).secureValues;
      expect(response.status).toBe(200);
      expect(responseBody.database.max_connections).toBe(100);
      expect(responseBody.database.active_users).toBeGreaterThan(0);
    });
  });
  describe('with an admin user', () => {
    test('should return status with version', async () => {
      const adminUser = await orchestrator.createUser({});
      const activatedUser = await orchestrator.activateUserByUserId(
        adminUser.id,
      );
      const sessionObject = await orchestrator.createSession(activatedUser.id);
      await user.addFeatures(adminUser.id, ['read:status:admin']);
      const response = await fetch('http://localhost:3000/api/v1/status', {
        method: 'GET',
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      const responseBody = (await response.json()).secureValues;
      console.log('responseBody', responseBody);
      expect(response.status).toBe(200);
      expect(responseBody.database.max_connections).toBe(100);
      expect(responseBody.database.active_users).toBeGreaterThan(0);
      expect(responseBody.database.version).toBe('17.2');
    });
  });
});
