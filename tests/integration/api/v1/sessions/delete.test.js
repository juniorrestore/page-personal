import session from 'models/session';
import orchestrator from 'tests/orchestrator.js';
import setCookieParser from 'set-cookie-parser';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('DELETE to /api/v1/session', () => {
  describe('Default User', () => {
    test('with valid session', async () => {
      const createdUser = await orchestrator.createUser({
        username: 'validUserSessionDelete',
      });
      const sessionObject = await orchestrator.createSession(createdUser.id);

      const response = await fetch('http://localhost:3000/api/v1/sessions', {
        method: 'DELETE',
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: sessionObject.id,
        token: sessionObject.token,
        user_id: sessionObject.user_id,
        expires_at: responseBody.expires_at,
        create_at: responseBody.create_at,
        update_at: responseBody.update_at,
      });

      expect(Date.parse(responseBody.expires_at)).toBeLessThan(
        sessionObject.expires_at.getTime(),
      );

      expect(Date.parse(responseBody.update_at)).toBeGreaterThan(
        sessionObject.update_at.getTime(),
      );

      //Tests of Set-Cookie was set in the response
      const parserSetCookie = setCookieParser(response, { map: true });
      expect(parserSetCookie.session_id).toEqual({
        name: 'session_id',
        value: 'invalid',
        maxAge: -1,
        httpOnly: true,
        path: '/',
      });

      //Double check if the session is expired
      const doubleCheckSession = await fetch(
        'http://localhost:3000/api/v1/user',
        {
          method: 'GET',
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      expect(doubleCheckSession.status).toBe(401);
      const responseBodyDoubleCheck = await doubleCheckSession.json();
      expect(responseBodyDoubleCheck).toEqual({
        action: 'Verifique se o usuário está logado',
        message: 'Usuario sem sessão ativa.',
        name: 'UnauthorizedError',
        status_code: 401,
      });
    });

    test('with expired session', async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.expirationInMilliseconds),
      });

      const createdUser = await orchestrator.createUser({
        username: 'expiredUserSession',
      });
      const sessionObject = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const response = await fetch('http://localhost:3000/api/v1/sessions', {
        method: 'DELETE',
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toBe(401);
      expect(responseBody).toEqual({
        action: 'Verifique se o usuário está logado',
        message: 'Usuario sem sessão ativa.',
        name: 'UnauthorizedError',
        status_code: 401,
      });
    });

    test('with session inexistent', async () => {
      const nonExistentToken =
        'e172e1740cd1dd15feb583219c1d489e0002c15c9a0a6bf15c8bdb86999c97d40106297bec49d63bb0d68c3b07bd2dd8';

      const response = await fetch('http://localhost:3000/api/v1/sessions', {
        method: 'DELETE',
        headers: {
          Cookie: `session_id=${nonExistentToken}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toBe(401);
      expect(responseBody).toEqual({
        action: 'Verifique se o usuário está logado',
        message: 'Usuario sem sessão ativa.',
        name: 'UnauthorizedError',
        status_code: 401,
      });
    });
  });
});
