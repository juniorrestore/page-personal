import { createRouter } from 'next-connect';
import controller from 'infra/controller.js';
import user from 'models/user.js';
import activation from 'models/activation';
import middlewares from 'infra/middlewares';

const router = createRouter();
router.use(middlewares.injectAnonymousOrUser);
router.post(middlewares.canRequest('create:user'), postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userValues = request.body;
  const newUser = await user.create(userValues);

  const activationToken = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, activationToken);

  return response.status(201).json(newUser);
}
