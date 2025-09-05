import {
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from 'infra/errors';
import password from './password';
import user from './user';

async function validate(providedEmail, providedPassword) {
  try {
    const storedUser = await validateUser(providedEmail);
    await validatePassword(providedPassword, storedUser.password);

    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: 'Dados de autenticaçào incorretos',
        action: 'Verifique se os dados enviados estão corretos',
      });
    }
    throw error;
  }

  async function validateUser(providedEmail) {
    let storedUser;
    try {
      storedUser = await user.findOneByEmail(providedEmail);
      return storedUser;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: 'Email não confere',
          action: 'Reenviar informação com dado correto.',
        });
      }
      throw error;
    }
  }

  async function validatePassword(providedPassword, storedPassword) {
    const correctPasswordMatch = await password.compare(
      providedPassword,
      storedPassword,
    );
    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: 'Senha não confere',
        action: 'Reenviar informação com dado correto.',
      });
    }
  }
}

const authentication = { validate };

export default authentication;
