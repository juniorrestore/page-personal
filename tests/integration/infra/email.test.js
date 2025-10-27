import orchestrator from 'tests/orchestrator.js';
import email from '../../../infra/email.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

test('test from infra/email.js', async () => {
  await orchestrator.clearEmail();
  await email.send({
    from: 'Junior<junior.tester@example.com>',
    to: 'Contato<contact@example.com>',
    subject: 'Test Email',
    text: 'This is a test email',
    html: '<p>This is a test email</p>',
  });
  await email.send({
    from: 'Junior<junior.tester@example.com>',
    to: 'Contato<contact@example.com>',
    subject: 'Last Email',
    html: '<p>Body of Last Email</p>',
  });
  const lastEmail = await orchestrator.getLastEmail();

  expect(lastEmail.sender).toBe('<junior.tester@example.com>');
  expect(lastEmail.recipients).toEqual(['<contact@example.com>']);
  expect(lastEmail.subject).toBe('Last Email');
  expect(lastEmail.body).toContain('Body of Last Email');
});
