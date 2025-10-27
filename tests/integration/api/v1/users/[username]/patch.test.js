import orchestrator from 'tests/orchestrator.js';
import { version as uuidVersion } from 'uuid';
import password from 'models/password';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('PATCH to /api/v1/users/[username]', () => {
  describe('Anonymous user', () => {
    test('With nonexistent user', async () => {
      const response = await fetch(
        'http://localhost:3000/api/v1/users/nonexistent',
        {
          method: 'PATCH',
        },
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

    test('With duplicated username', async () => {
      const user1 = await orchestrator.createUser({});
      const user2 = await orchestrator.createUser({});

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user2.username}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user1.username }),
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(400);
      expect(responseBody.message).toBe(
        'O username informado já está sendo utilizado',
      );
      expect(responseBody.action).toBe(
        'Utilizar um usuário diferente para esta ação',
      );
    });

    test('With duplicated email', async () => {
      await orchestrator.createUser({
        email: 'duplicado1@qaxsolutions.com',
      });
      const user = await orchestrator.createUser({
        email: 'duplicado2@qaxsolutions.com',
      });
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user.username}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'duplicado1@qaxsolutions.com' }),
        },
      );
      const responseBody = await response.json();
      expect(response.status).toBe(400);
      expect(responseBody.message).toBe(
        'O email informado já está sendo utilizado',
      );
      expect(responseBody.action).toBe(
        'Utilizar um email diferente para esta ação!',
      );
    });

    test('With unique "username"', async () => {
      const user = await orchestrator.createUser();
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user.username}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'unique2' }),
        },
      );
      const responseBody = await response.json();

      expect(response.status).toBe(201);
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: 'unique2',
        email: user.email,
        password: responseBody.password,
        features: ['read:activation_token'],
        create_at: responseBody.create_at,
        update_at: responseBody.update_at,
      });
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.create_at)).not.toBeNaN();
      expect(Date.parse(responseBody.update_at)).not.toBeNaN();

      expect(responseBody.update_at > responseBody.create_at).toBe(true);
    });

    test('With unique "email"', async () => {
      const user = await orchestrator.createUser({});

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user.username}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'uniqueEmail@qaxsolutions.com' }),
        },
      );
      const responseBody = await response.json();

      expect(response.status).toBe(201);
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: user.username,
        email: 'uniqueEmail@qaxsolutions.com',
        password: responseBody.password,
        features: ['read:activation_token'],
        create_at: responseBody.create_at,
        update_at: responseBody.update_at,
      });
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.create_at)).not.toBeNaN();
      expect(Date.parse(responseBody.update_at)).not.toBeNaN();

      expect(responseBody.update_at > responseBody.create_at).toBe(true);
    });

    test('With new "password"', async () => {
      const user = await orchestrator.createUser({});

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user.username}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'newPass' }),
        },
      );
      const responseBody = await response.json();

      expect(response.status).toBe(201);
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: user.username,
        email: user.email,
        password: responseBody.password,
        features: ['read:activation_token'],
        create_at: responseBody.create_at,
        update_at: responseBody.update_at,
      });
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.create_at)).not.toBeNaN();
      expect(Date.parse(responseBody.update_at)).not.toBeNaN();

      expect(responseBody.update_at > responseBody.create_at).toBe(true);

      const correctPasswordMatch = await password.compare(
        'newPass',
        responseBody.password,
      );
      expect(correctPasswordMatch).toBe(true);
    });
  });
});
