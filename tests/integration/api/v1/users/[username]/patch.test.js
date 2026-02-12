import orchestrator from 'tests/orchestrator.js';
import { version as uuidVersion } from 'uuid';
import password from 'models/password';
import user from 'models/user';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('PATCH to /api/v1/users/[username]', () => {
  describe('Anonymous user', () => {
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

      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        action: 'Verifique suas permissões.',
        message: 'Acesso negado.',
        name: 'ForbiddenError',
        status_code: 403,
      });
    });
  });
  describe('Default user', () => {
    test('With nonexistent user', async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUserByUserId(
        createdUser.id,
      );
      const sessionObject = await orchestrator.createSession(activatedUser.id);
      const response = await fetch(
        'http://localhost:3000/api/v1/users/nonexistent',
        {
          method: 'PATCH',
          headers: { Cookie: `session_id=${sessionObject.token}` },
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

    test('With user2 targeting user1', async () => {
      const user1 = await orchestrator.createUser({});
      const user2 = await orchestrator.createUser({});
      const activatedUser2 = await orchestrator.activateUserByUserId(user2.id);
      const sessionObject2 = await orchestrator.createSession(
        activatedUser2.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user1.username}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session_id=${sessionObject2.token}`,
          },
          body: JSON.stringify({ username: 'user3' }),
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: 'ForbiddenError',
        action: 'Verifique suas permissões de usuário',
        message: 'Usuário não tem permissão para atualizar este recurso',
        status_code: 403,
      });
    });

    test('With duplicated username', async () => {
      const user1 = await orchestrator.createUser({});
      const user2 = await orchestrator.createUser({});
      const activatedUser2 = await orchestrator.activateUserByUserId(user2.id);
      const sessionObject2 = await orchestrator.createSession(
        activatedUser2.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user2.username}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session_id=${sessionObject2.token}`,
          },
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
      const activatedUser = await orchestrator.activateUserByUserId(user.id);
      const sessionObject = await orchestrator.createSession(activatedUser.id);
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user.username}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session_id=${sessionObject.token}`,
          },
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
      const activatedUser = await orchestrator.activateUserByUserId(user.id);
      const sessionObject = await orchestrator.createSession(activatedUser.id);
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user.username}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({ username: 'unique2' }),
        },
      );
      const responseBody = await response.json();

      expect(response.status).toBe(201);
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: 'unique2',
        features: [
          'read:session',
          'create:session',
          'update:user',
          'read:status',
        ],
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
      const activatedUser = await orchestrator.activateUserByUserId(user.id);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user.username}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({ email: 'uniqueEmail@qaxsolutions.com' }),
        },
      );
      const responseBody = await response.json();

      expect(response.status).toBe(201);
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: user.username,
        features: [
          'read:session',
          'create:session',
          'update:user',
          'read:status',
        ],
        create_at: responseBody.create_at,
        update_at: responseBody.update_at,
      });
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.create_at)).not.toBeNaN();
      expect(Date.parse(responseBody.update_at)).not.toBeNaN();

      expect(responseBody.update_at > responseBody.create_at).toBe(true);
    });

    test('With new "password"', async () => {
      const userDefault = await orchestrator.createUser({});
      const activatedUser = await orchestrator.activateUserByUserId(
        userDefault.id,
      );
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userDefault.username}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({ password: 'newPass' }),
        },
      );
      const responseBody = await response.json();

      expect(response.status).toBe(201);
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: userDefault.username,
        features: [
          'read:session',
          'create:session',
          'update:user',
          'read:status',
        ],
        create_at: responseBody.create_at,
        update_at: responseBody.update_at,
      });
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.create_at)).not.toBeNaN();
      expect(Date.parse(responseBody.update_at)).not.toBeNaN();

      expect(responseBody.update_at > responseBody.create_at).toBe(true);

      const userInDatabase = await user.findOneById(userDefault.id);

      const correctPasswordMatch = await password.compare(
        'newPass',
        userInDatabase.password,
      );
      expect(correctPasswordMatch).toBe(true);
    });
  });
  describe('Administrator user', () => {
    test('With user privileged targeting default user', async () => {
      const user = await orchestrator.createUser({});
      const activatedUser = await orchestrator.activateUserByUserId(user.id);
      await orchestrator.addFeaturesToUser(user, ['update:user:other']);
      const sessionObject = await orchestrator.createSession(activatedUser.id);
      const userDefault = await orchestrator.createUser({});

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userDefault.username}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({ username: 'user3' }),
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(201);
      expect(responseBody).toEqual({
        id: userDefault.id,
        username: 'user3',
        features: ['read:activation_token'],
        create_at: responseBody.create_at,
        update_at: responseBody.update_at,
      });
    });
  });
});
