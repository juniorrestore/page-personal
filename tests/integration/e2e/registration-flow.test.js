import activation from 'models/activation';
import orchestrator from 'tests/orchestrator';
import { version as uuidVersion } from 'uuid';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.clearEmail();
});

describe('E2E: Registration Flow (all successful)', () => {
  let responseBody;
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
    responseBody = await response.json();
    expect(response.status).toBe(201);
    expect(responseBody).toEqual({
      id: responseBody.id,
      username: 'gilmario',
      email: 'registration-flow@qaxsolutions.com',
      password: responseBody.password,
      features: ['read:activation_token'],
      create_at: responseBody.create_at,
      update_at: responseBody.update_at,
    });
    expect(uuidVersion(responseBody.id)).toBe(4);
    expect(Date.parse(responseBody.create_at)).not.toBeNaN();
    expect(Date.parse(responseBody.update_at)).not.toBeNaN();
  });

  test('Receive activation email', async () => {
    const lastEmail = await orchestrator.getLastEmail();
    const tokenEmail = lastEmail.body.match(
      /Token de ativação:\s*([0-9a-fA-F-]{36})/,
    );
    const tokenValid = await activation.getTokenValid(tokenEmail[1]);

    expect(tokenValid.used_at).toBeNull();
    expect(tokenValid.id).toBeDefined();
    expect(tokenValid.user_id).toBe(responseBody.id);
    expect(lastEmail.sender).toBe('<contato@qaxsolutions.com>');
    expect(lastEmail.recipients).toEqual([
      '<registration-flow@qaxsolutions.com>',
    ]);
    expect(lastEmail.subject).toBe('Ative sua conta');
    expect(lastEmail.body).toContain(
      'Por favor, ative sua conta usando o token abaixo',
    );
  });
  test('Activate account', async () => {});
  test('Login', async () => {});
  test('Get user information', async () => {});
});
