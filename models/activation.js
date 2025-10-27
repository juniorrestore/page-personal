import database from 'infra/database';
import email from 'infra/email';
import { NotFoundError } from 'infra/errors';
import webserver from 'infra/webserver';

const EXPIRATION_IN_MILLISECONDS = 12 * 60 * 60 * 1000; // 12 hours
async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const result = await database.query({
      text: `
            INSERT INTO user_activation_tokens (user_id, expires_at)
            VALUES ($1, $2)
            RETURNING *
        `,
      values: [userId, expiresAt],
    });

    return result.rows[0];
  }
}
async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: 'Contato<contato@qaxsolutions.com>',
    to: user.email,
    subject: 'Ative sua conta',
    html: `
            <p>Olá ${user.username},</p>
            <p>Por favor, ative sua conta usando o token abaixo ou clicando no link</p>
            <p>https://${webserver.origin}/activate?token=${activationToken.id}</p>
            <p>Token de ativação: ${activationToken.id}</p>
        `,
  });
}
async function getTokenValid(token) {
  const result = await runInsertQuery();
  return result;

  async function runInsertQuery() {
    const result = await database.query({
      text: `
          SELECT *
          FROM user_activation_tokens
          WHERE id = $1 
          AND used_at is null 
          AND expires_at > NOW()
      `,
      values: [token],
    });
    if (result.rows.length === 0) {
      throw NotFoundError({
        message: 'Token de ativação inválido ou não encontrado',
        action: 'Faça um novo cadastro',
      });
    }
    return result.rows[0];
  }
}

const activation = {
  getTokenValid,
  create,
  sendEmailToUser,
};

export default activation;
