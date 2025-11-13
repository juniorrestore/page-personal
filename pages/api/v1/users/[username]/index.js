import { createRouter } from 'next-connect';
import controller from 'infra/controller.js';
import user from 'models/user.js';
import middlewares from 'infra/middlewares';

const router = createRouter();

router.use(middlewares.injectAnonymousOrUser);
router.get(getHandler);
router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const username = request.query.username;
  const found = await user.findOneByUsername(username);
  return response.status(200).json(found);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;

  const updatedUser = await user.update(username, userInputValues);
  return response.status(201).json(updatedUser);
}
