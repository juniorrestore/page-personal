import { createRouter } from 'next-connect';
import controller from 'infra/controller.js';
import user from 'models/user.js';
import activation from 'models/activation';
import middlewares from 'infra/middlewares';
import authorization from 'models/authorization';

const router = createRouter();
router.use(middlewares.injectAnonymousOrUser);
router.post(middlewares.canRequest('create:user'), postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userValues = request.body;
  const newUser = await user.create(userValues);

  const userTryingToPost = request.context.user;

  const activationToken = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, activationToken);

  const secureValues = authorization.filterOutput(
    userTryingToPost,
    'read:user',
    newUser,
  );

  return response.status(201).json(secureValues);
}
