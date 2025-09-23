import { createRouter } from 'next-connect';
import controller from 'infra/controller.js';
import authentication from 'models/authentication';
import session from 'models/session';

const router = createRouter();

router.post(postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userValues = request.body;
  const authenticatedUser = await authentication.validate(
    userValues.email,
    userValues.password,
  );

  const sessionCreated = await session.create(authenticatedUser.id);
  controller.setSessionCookie(sessionCreated.token, response);

  return response.status(201).json(sessionCreated);
}

async function deleteHandler(request, response) {
  const sessionToken = request.cookies.session_id;
  const sessionObject = await session.findOneValidByToken(sessionToken);

  const expireSession = await session.expireById(sessionObject.id);

  controller.clearSessionCookie(sessionToken, response);

  return response.status(200).json(expireSession);
}
