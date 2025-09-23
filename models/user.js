import database from 'infra/database';
import { NotFoundError, ValidationError } from 'infra/errors';
import password from 'models/password';
('models/password');

async function create(userValues) {
  await validateEmail(userValues.email);
  await validateUsername(userValues.username);
  await hashPasswordObject(userValues);

  const newUser = await runInsertQuery(userValues);
  return newUser;

  async function runInsertQuery(user) {
    const result = await database.query({
      text: `insert into 
        users (username, email, password) 
            values ($1, $2, $3)
            RETURNING * ; `,
      values: [user.username, user.email, user.password],
    });
    return result.rows[0];
  }
}

async function findOneById(id) {
  const userFound = runSelectQuery(id);
  return userFound;
  async function runSelectQuery(id) {
    const result = await database.query({
      text: 'select * from users where id = $1 limit 1',
      values: [id],
    });
    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: 'Não encontraro nenhum id',
        action: 'Verificar se o id está correto',
      });
    }
    return result.rows[0];
  }
}

async function findOneByUsername(username) {
  const userFound = runSelectQuery(username);
  return userFound;
  async function runSelectQuery(username) {
    const result = await database.query({
      text: 'select * from users where lower(username) = lower($1) limit 1',
      values: [username],
    });
    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: 'Não encontraro nenhum username',
        action: 'Verificar se o username está correto',
      });
    }
    return result.rows[0];
  }
}

async function findOneByEmail(email) {
  const userFound = runSelectQuery(email);
  return userFound;
  async function runSelectQuery(email) {
    const result = await database.query({
      text: 'select * from users where lower(email) = lower($1) limit 1',
      values: [email],
    });
    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: 'Não encontraro nenhum email',
        action: 'Verificar se o email está correto',
      });
    }
    return result.rows[0];
  }
}

async function update(username, dataUserInput) {
  const currentUser = await findOneByUsername(username);

  if ('username' in dataUserInput) {
    await validateUsername(dataUserInput.username);
  }
  if ('email' in dataUserInput) {
    await validateEmail(dataUserInput.email);
  }
  if ('password' in dataUserInput) {
    await hashPasswordObject(dataUserInput);
  }

  const userWithNewValues = { ...currentUser, ...dataUserInput };
  const updateUser = await runUpdateQuery(userWithNewValues);

  return updateUser;

  async function runUpdateQuery(user) {
    const results = await database.query({
      text: `UPDATE
        users
      SET
        username = $2,
        email = $3,
        password = $4,
        update_at =  timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      `,
      values: [user.id, user.username, user.email, user.password],
    });
    return results.rows[0];
  }
}

async function validateUsername(username) {
  const result = await database.query({
    text: 'select * from users where lower(username) = lower($1)',
    values: [username],
  });
  if (result.rowCount > 0) {
    throw new ValidationError({
      message: 'O username informado já está sendo utilizado',
      action: 'Utilizar um usuário diferente para esta ação',
    });
  }
}

async function validateEmail(email) {
  const result = await database.query({
    text: 'select * from users where lower(email) = lower($1)',
    values: [email],
  });
  if (result.rowCount > 0) {
    throw new ValidationError({
      message: 'O email informado já está sendo utilizado',
      action: 'Utilizar um email diferente para esta ação!',
    });
  }
}

async function hashPasswordObject(inputValues) {
  const hashPassword = await password.hash(inputValues.password);
  inputValues.password = hashPassword;
}

const user = {
  create,
  findOneById,
  findOneByUsername,
  update,
  findOneByEmail,
};
export default user;
