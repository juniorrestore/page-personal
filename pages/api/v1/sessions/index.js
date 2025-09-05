import { createRouter } from 'next-connect';
import controller from 'infra/controller.js';
import { UnauthorizedError } from 'infra/errors';
import authentication from 'models/authentication';
import session from 'models/session';
import * as cookie from 'cookie';

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userValues = request.body;
  const authenticatedUser = await authentication.validate(
    userValues.email,
    userValues.password,
  );

  const sessionCreated = await session.create(authenticatedUser.id);

  const setCookie = cookie.serialize('session_id', sessionCreated.token, {
    path: '/',
    maxAge: session.expirationInMilliseconds / 1000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  });

  response.setHeader('Set-Cookie', setCookie);

  return response.status(201).json(sessionCreated);
}
