import database from 'infra/database';
import email from 'infra/email';
import { ForbiddenError, NotFoundError } from 'infra/errors';
import webserver from 'infra/webserver';
import user from 'models/user';
import authorization from './authorization';

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
  const result = await runSelectQuery();
  return result;

  async function runSelectQuery() {
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
      throw new NotFoundError({
        message: 'Token de ativação inválido ou não encontrado',
        action: 'Faça um novo cadastro',
      });
    }
    return result.rows[0];
  }
}
async function markAsUsed(tokenId) {
  const result = await runInsertQuery();
  return result;

  async function runInsertQuery() {
    const result = await database.query({
      text: `
          UPDATE user_activation_tokens
          SET used_at = NOW(), update_at = NOW()
          WHERE id = $1
          RETURNING *
      `,
      values: [tokenId],
    });
    return result.rows[0];
  }
}
async function activateUserByUserId(userId) {
  const userToActivate = await user.findOneById(userId);
  if (authorization.can(userToActivate, 'read:acivation_token')) {
    throw new ForbiddenError({
      message: 'Não é possível ativar esta conta',
      action: 'Solicita uma nova ativação ou verifique se sua conta está ativa',
    });
  }
  const activedUser = await user.setFeatures(userId, [
    'read:session',
    'create:session',
    'update:user',
    'read:status',
  ]);
  return activedUser;
}

const activation = {
  EXPIRATION_IN_MILLISECONDS,
  activateUserByUserId,
  getTokenValid,
  create,
  sendEmailToUser,
  markAsUsed,
};

export default activation;
