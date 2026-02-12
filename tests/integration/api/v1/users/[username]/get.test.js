import orchestrator from 'tests/orchestrator.js';
import { version as uuidVersion } from 'uuid';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET to /api/v1/users/[username]', () => {
  describe('Anonymous user', () => {
    test('With exact case match', async () => {
      await orchestrator.createUser({
        username: 'gilmario',
        email: 'gilmario@qaxsolutions.com',
        password: 'senha123',
      });

      const response2 = await fetch(
        'http://localhost:3000/api/v1/users/gilmario',
      );

      expect(response2.status).toBe(200);

      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        id: response2Body.id,
        username: 'gilmario',
        create_at: response2Body.create_at,
        update_at: response2Body.update_at,
        features: ['read:activation_token'],
      });
      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.create_at)).not.toBeNaN();
      expect(Date.parse(response2Body.update_at)).not.toBeNaN();
    });
    test('With case mismatch', async () => {
      await orchestrator.createUser({
        username: 'MisMatch',
      });

      const response2 = await fetch(
        'http://localhost:3000/api/v1/users/mismatch',
      );

      expect(response2.status).toBe(200);

      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        id: response2Body.id,
        username: 'MisMatch',
        create_at: response2Body.create_at,
        update_at: response2Body.update_at,
        features: ['read:activation_token'],
      });
      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.create_at)).not.toBeNaN();
      expect(Date.parse(response2Body.update_at)).not.toBeNaN();
    });
    test('With nonexistent user', async () => {
      const response = await fetch(
        'http://localhost:3000/api/v1/users/nonexistent',
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: 'NotFoundError',
        message: 'Não encontraro nenhum username',
        action: 'Verificar se o username está correto',
        status_code: 404,
      });
    });
  });
});
