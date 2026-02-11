import activation from 'models/activation';
import orchestrator from 'tests/orchestrator';

describe('PATCH /api/v1/activations/[token_id]', () => {
  describe('Anonymous User', () => {
    test('with nonexistent token', async () => {
      const response = await fetch(
        'http://localhost:3000/api/v1/activations/b7136b2e-8a3b-4821-ac58-e14ab18fb8ef',
        {
          method: 'PATCH',
        },
      );
      const responseBody = await response.json();
      expect(response.status).toBe(404);
      expect(responseBody).toEqual({
        action: 'Faça um novo cadastro',
        message: 'Token de ativação inválido ou não encontrado',
        name: 'NotFoundError',
        status_code: 404,
      });
    });
    test('with expired token', async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MILLISECONDS),
      });
      const user = await orchestrator.createUser({});
      const token = await activation.create(user.id);
      jest.useRealTimers();
      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${token.id}`,
        {
          method: 'PATCH',
        },
      );
      const responseBody = await response.json();
      expect(response.status).toBe(404);
      expect(responseBody).toEqual({
        action: 'Faça um novo cadastro',
        message: 'Token de ativação inválido ou não encontrado',
        name: 'NotFoundError',
        status_code: 404,
      });
    });
    test('with used token', async () => {
      const user = await orchestrator.createUser({});
      const token = await activation.create(user.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${token.id}`,
        {
          method: 'PATCH',
        },
      );
      expect(response.status).toBe(200);
      const response2 = await fetch(
        `http://localhost:3000/api/v1/activations/${token.id}`,
        {
          method: 'PATCH',
        },
      );
      const responseBody = await response2.json();
      expect(response2.status).toBe(404);
      expect(responseBody).toEqual({
        action: 'Faça um novo cadastro',
        message: 'Token de ativação inválido ou não encontrado',
        name: 'NotFoundError',
        status_code: 404,
      });
    });
    test('with existent token', async () => {
      const user = await orchestrator.createUser({});
      const token = await activation.create(user.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${token.id}`,
        {
          method: 'PATCH',
        },
      );
      const responseBody = await response.json();
      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        user_id: user.id,
        expires_at: responseBody.expires_at,
        create_at: responseBody.create_at,
        id: responseBody.id,
        update_at: responseBody.update_at,
        used_at: responseBody.used_at,
      });
    });
  });
  describe('Default User', () => {
    test('with existent token', async () => {
      const user1 = await orchestrator.createUser({});
      const token1 = await activation.create(user1.id);
      const user2 = await orchestrator.createUser({});
      const token2 = await activation.create(user2.id);
      const session = await orchestrator.createSession(user1.id);

      const responseUser1 = await fetch(
        `http://localhost:3000/api/v1/activations/${token1.id}`,
        {
          method: 'PATCH',
        },
      );
      expect(responseUser1.status).toBe(200);
      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${token2.id}`,
        {
          method: 'PATCH',
          headers: {
            Cookie: `session_id=${session.token}`,
          },
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
});
