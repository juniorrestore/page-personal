import session from 'models/session';
import orchestrator from 'tests/orchestrator.js';
import setCookieParser from 'set-cookie-parser';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('Get to /api/v1/user', () => {
  describe('Default User', () => {
    test('with valid session', async () => {
      const createdUser = await orchestrator.createUser({
        username: 'validUserSession',
      });
      const sessionObject = await orchestrator.createSession(createdUser.id);
      const response = await fetch('http://localhost:3000/api/v1/user', {
        method: 'GET',
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      const cacheControl = response.headers.get('Cache-Control');

      const responseBody = await response.json();

      expect(cacheControl).toBe(
        'no-store, no-cache, max-age=0, must-revalidate',
      );
      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        id: createdUser.id,
        username: 'validUserSession',
        email: createdUser.email,
        create_at: createdUser.create_at.toISOString(),
        update_at: createdUser.update_at.toISOString(),
        password: createdUser.password,
      });

      //Tests if the session was renewed

      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token,
      );

      expect(renewedSessionObject.expires_at.getTime()).toBeGreaterThan(
        sessionObject.expires_at.getTime(),
      );

      expect(renewedSessionObject.update_at.getTime()).toBeGreaterThan(
        sessionObject.update_at.getTime(),
      );

      //Tests of Set-Cookie was set in the response
      const parserSetCookie = setCookieParser(response, { map: true });
      expect(parserSetCookie.session_id).toEqual({
        name: 'session_id',
        value: sessionObject.token,
        maxAge: session.expirationInMilliseconds / 1000,
        httpOnly: true,
        path: '/',
      });
    });

    test('with a valid session close to expiring', async () => {
      await jest.useFakeTimers({
        now: new Date(
          Date.now() - session.expirationInMilliseconds + 1000 * 60 * 2,
        ),
      });
      const createdUser = await orchestrator.createUser({
        username: 'userCloseToExpireSession',
      });
      const sessionObject = await orchestrator.createSession(createdUser.id);
      const response = await fetch('http://localhost:3000/api/v1/user', {
        method: 'GET',
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      await jest.useRealTimers();
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        id: createdUser.id,
        username: 'userCloseToExpireSession',
        email: createdUser.email,
        create_at: createdUser.create_at.toISOString(),
        update_at: createdUser.update_at.toISOString(),
        password: createdUser.password,
      });

      //Tests if the session was renewed

      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token,
      );

      expect(renewedSessionObject.expires_at.getTime()).toBeGreaterThan(
        sessionObject.expires_at.getTime(),
      );

      expect(renewedSessionObject.update_at.getTime()).toBeGreaterThan(
        sessionObject.update_at.getTime(),
      );

      //Tests of Set-Cookie was set in the response
      const parserSetCookie = setCookieParser(response, { map: true });
      expect(parserSetCookie.session_id).toEqual({
        name: 'session_id',
        value: sessionObject.token,
        maxAge: session.expirationInMilliseconds / 1000,
        httpOnly: true,
        path: '/',
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

      const response = await fetch('http://localhost:3000/api/v1/user', {
        method: 'GET',
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

    test('with token inexistent', async () => {
      const nonExistentToken =
        'e172e1740cd1dd15feb583219c1d489e0002c15c9a0a6bf15c8bdb86999c97d40106297bec49d63bb0d68c3b07bd2dd8';

      const response = await fetch('http://localhost:3000/api/v1/user', {
        method: 'GET',
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
