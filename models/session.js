import database from 'infra/database';
import crypto from 'node:crypto';

const expirationInMilliseconds = 60 * 60 * 1 * 1000;

async function create(userId) {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + expirationInMilliseconds);

  const newSession = await runInsertQuery(token, userId, expiresAt);

  return newSession;

  async function runInsertQuery(token, userId, expiresAt) {
    console.log(token, userId, expiresAt);

    const results = await database.query({
      text: `
        INSERT INTO sessions
    (token, user_id, expires_at)
    VALUES($1,$2,$3)
    RETURNING *`,
      values: [token, userId, expiresAt],
    });

    console.log('RESULTS', results.rows[0]);
    return results.rows[0];
  }
}

const session = {
  create,
  expirationInMilliseconds,
};

export default session;
