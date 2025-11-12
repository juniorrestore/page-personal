import email from 'infra/email';
import activation from 'models/activation';
import user from 'models/user';
import orchestrator from 'tests/orchestrator';
import { version as uuidVersion } from 'uuid';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.clearEmail();
});

describe('E2E: Registration Flow (all successful)', () => {
  let userResponseBody;
  let userLoginResponseBody;
  let tokenValid;
  test('Create user account', async () => {
    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'gilmario',
        email: 'registration-flow@qaxsolutions.com',
        password: 'senha123',
      }),
    });
    userResponseBody = await response.json();
    expect(response.status).toBe(201);
    expect(userResponseBody).toEqual({
      id: userResponseBody.id,
      username: 'gilmario',
      email: 'registration-flow@qaxsolutions.com',
      password: userResponseBody.password,
      features: ['read:activation_token'],
      create_at: userResponseBody.create_at,
      update_at: userResponseBody.update_at,
    });
    expect(uuidVersion(userResponseBody.id)).toBe(4);
    expect(Date.parse(userResponseBody.create_at)).not.toBeNaN();
    expect(Date.parse(userResponseBody.update_at)).not.toBeNaN();
  });

  test('Receive activation email', async () => {
    const lastEmail = await orchestrator.getLastEmail();
    const tokenEmail = lastEmail.body.match(
      /Token de ativação:\s*([0-9a-fA-F-]{36})/,
    );
    tokenValid = await activation.getTokenValid(tokenEmail[1]);

    expect(tokenValid.used_at).toBeNull();
    expect(tokenValid.id).toBeDefined();
    expect(tokenValid.user_id).toBe(userResponseBody.id);
    expect(lastEmail.sender).toBe('<contato@qaxsolutions.com>');
    expect(lastEmail.recipients).toEqual([
      '<registration-flow@qaxsolutions.com>',
    ]);
    expect(lastEmail.subject).toBe('Ative sua conta');
    expect(lastEmail.body).toContain(
      'Por favor, ative sua conta usando o token abaixo',
    );
  });

  test('Activate account', async () => {
    const result = await fetch(
      `http://localhost:3000/api/v1/activations/${tokenValid.id}`,
      {
        method: 'PATCH',
      },
    );

    expect(result.status).toBe(200);
    const responseBody = await result.json();
    expect(responseBody.user_id).toBe(userResponseBody.id);
    const activateUser = await user.findOneById(userResponseBody.id);
    expect(activateUser.features).toEqual(['read:session', 'create:session']);
    expect(responseBody.used_at).not.toBeNull();
  });

  test('Login', async () => {
    const userLoginResponse = await fetch(
      'http://localhost:3000/api/v1/sessions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'registration-flow@qaxsolutions.com',
          password: 'senha123',
        }),
      },
    );

    expect(userLoginResponse.status).toBe(201);
    userLoginResponseBody = await userLoginResponse.json();
    expect(userLoginResponseBody.user_id).toEqual(userResponseBody.id);
  });

  test('Get user information', async () => {
    const userResponse = await fetch('http://localhost:3000/api/v1/user', {
      headers: {
        Cookie: `session_id=${userLoginResponseBody.token}`,
      },
    });
    const body = await userResponse.json();

    expect(userResponse.status).toBe(200);
    expect(userResponseBody.id).toBe(body.id);
  });
});
