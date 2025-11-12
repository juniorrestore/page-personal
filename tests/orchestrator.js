import retry from 'async-retry';
import { faker } from '@faker-js/faker';
import database from 'infra/database';
import migrator from 'models/migrator';
import user from 'models/user';
import session from 'models/session';
import activation from 'models/activation';

const emailApiUrl = 'http://localhost:1080';

async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();
  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });
    async function fetchStatusPage() {
      const response = await fetch('http://localhost:3000/api/v1/status');
      if (response.status !== 200) {
        throw Error;
      }
    }
  }

  async function waitForEmailServer() {
    return retry(fetchEmailPage, {
      retries: 100,
      maxTimeout: 1000,
    });
    async function fetchEmailPage() {
      const response = await fetch(emailApiUrl);
      if (response.status !== 200) {
        throw Error;
      }
    }
  }
}
async function clearDatabase() {
  await database.query(`
    drop schema public cascade; 
    create schema public;
    `);
}
async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}
async function createSession(userId) {
  return session.create(userId);
}
async function createUser(userValues) {
  return await user.create({
    username:
      userValues?.username || faker.internet.username().replace(/[_.-]/g, ''),
    email: userValues?.email || faker.internet.email(),
    password: userValues?.password || 'passwordForTest2025',
  });
}
async function clearEmail() {
  await fetch(`${emailApiUrl}/messages`, { method: 'DELETE' });
}
async function activateUserByUserId(userId) {
  const activedUser = await activation.activateUserByUserId(userId);
  return activedUser;
}
async function getLastEmail() {
  const emailResponse = await fetch(`${emailApiUrl}/messages`);
  const emailList = await emailResponse.json();
  const lastEmail = emailList.pop();
  if (!lastEmail) {
    return null;
  }
  const bodyLastEmail = await fetch(
    `${emailApiUrl}/messages/${lastEmail.id}.html`,
  );
  lastEmail.body = await bodyLastEmail.text();
  return lastEmail;
}
const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  clearEmail,
  getLastEmail,
  activateUserByUserId,
};

export default orchestrator;
