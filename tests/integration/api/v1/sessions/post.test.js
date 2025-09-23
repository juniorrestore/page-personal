import orchestrator from 'tests/orchestrator.js';
import session from 'models/session';
import setCookieParser from 'set-cookie-parser';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('POST to /api/v1/sessions', () => {
  describe('Anonymous user', () => {
    test('With incorrect email but correct password', async () => {
      await orchestrator.createUser({
        password: 'senha-correta',
      });
      const response = await fetch('http://localhost:3000/api/v1/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'incorreto@gilmariojunior.com',
          password: 'senha-correta',
        }),
      });
      const responseBody = await response.json();
      expect(response.status).toBe(401);
      expect(responseBody).toEqual({
        name: 'UnauthorizedError',
        status_code: 401,
        message: 'Dados de autenticaçào incorretos',
        action: 'Verifique se os dados enviados estão corretos',
      });
    });
    test('With correct email but incorrect password', async () => {
      await orchestrator.createUser({
        email: 'teste@qaxsolutions.com',
      });
      const response = await fetch('http://localhost:3000/api/v1/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'teste@qaxsolutions.com',
          password: 'senha-incorreta',
        }),
      });
      const responseBody = await response.json();
      expect(response.status).toBe(401);
      expect(responseBody).toEqual({
        name: 'UnauthorizedError',
        status_code: 401,
        message: 'Dados de autenticaçào incorretos',
        action: 'Verifique se os dados enviados estão corretos',
      });
    });
    test('With incorrect email and incorrect password', async () => {
      await orchestrator.createUser();
      const response = await fetch('http://localhost:3000/api/v1/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'email-incorreto@qaxsolutions.com',
          password: 'senha-incorreta',
        }),
      });
      const responseBody = await response.json();
      expect(response.status).toBe(401);
      expect(responseBody).toEqual({
        name: 'UnauthorizedError',
        status_code: 401,
        message: 'Dados de autenticaçào incorretos',
        action: 'Verifique se os dados enviados estão corretos',
      });
    });
    test('With correct email and correct password', async () => {
      await orchestrator.createUser({
        email: 'tudo-correta@qaxsolutiuons.com',
        password: 'senha-correta',
      });
      const response = await fetch('http://localhost:3000/api/v1/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'tudo-correta@qaxsolutiuons.com',
          password: 'senha-correta',
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        create_at: responseBody.create_at,
        expires_at: responseBody.expires_at,
        id: responseBody.id,
        token: responseBody.token,
        update_at: responseBody.update_at,
        user_id: responseBody.user_id,
      });

      const expiresAt = new Date(responseBody.expires_at);
      const createAt = new Date(responseBody.create_at);
      expiresAt.setMilliseconds(0);
      createAt.setMilliseconds(0);
      expiresAt.setSeconds(0);
      createAt.setSeconds(0);

      expect(expiresAt - createAt).toBe(session.expirationInMilliseconds);
      const parserSetCookie = setCookieParser(response, { map: true });
      expect(parserSetCookie.session_id).toEqual({
        name: 'session_id',
        value: responseBody.token,
        maxAge: session.expirationInMilliseconds / 1000,
        httpOnly: true,
        path: '/',
      });
    });
  });
});
