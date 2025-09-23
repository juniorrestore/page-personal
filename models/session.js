import controller from 'infra/controller';
import database from 'infra/database';
import { NotFoundError, UnauthorizedError } from 'infra/errors';
import crypto from 'node:crypto';

const expirationInMilliseconds = 60 * 60 * 1 * 1000;

async function create(userId) {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + expirationInMilliseconds);

  const newSession = await runInsertQuery(token, userId, expiresAt);

  return newSession;

  async function runInsertQuery(token, userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO sessions
    (token, user_id, expires_at)
    VALUES($1,$2,$3)
    RETURNING *`,
      values: [token, userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function findOneValidByToken(token) {
  const results = await database.query({
    text: `
      SELECT *
      FROM sessions
      WHERE token = $1
      AND expires_at > NOW()
    `,
    values: [token],
  });
  if (results.rowCount === 0) {
    throw new UnauthorizedError({
      message: 'Usuario sem sessão ativa.',
      action: 'Verifique se o usuário está logado',
    });
  }
  return results.rows[0];
}

async function renew(sessionId) {
  const renewedSessionObject = await runUpdateQuery(sessionId);
  return renewedSessionObject;

  async function runUpdateQuery(sessionId) {
    const newExpiresAt = new Date(Date.now() + expirationInMilliseconds);
    const results = await database.query({
      text: `
      UPDATE sessions
      SET expires_at = $1,
          update_at = NOW()
      WHERE id = $2
      RETURNING *
    `,
      values: [newExpiresAt, sessionId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({ message: 'Sessão não encontrada.' });
    }

    return results.rows[0];
  }
}

async function expireById(sessionId) {
  const expiredSessionObject = await runUpdateQuery(sessionId);
  return expiredSessionObject;

  async function runUpdateQuery(sessionId) {
    const results = await database.query({
      text: `
      UPDATE sessions
      SET expires_at = expires_at - INTERVAL '1 month',
          update_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
      values: [sessionId],
    });
    return results.rows[0];
  }
}

const session = {
  expireById,
  create,
  renew,
  findOneValidByToken,
  expirationInMilliseconds,
};

export default session;
