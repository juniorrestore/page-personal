import { createRouter } from 'next-connect';
import controller from 'infra/controller.js';
import user from 'models/user.js';
import middlewares from 'infra/middlewares';
import { ForbiddenError } from 'infra/errors';
import authorization from 'models/authorization';

const router = createRouter();

router.use(middlewares.injectAnonymousOrUser);
router.get(getHandler);
router.patch(middlewares.canRequest('update:user'), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const username = request.query.username;
  const found = await user.findOneByUsername(username);

  const secureValues = authorization.filterOutput(
    userTryingToGet,
    'read:user',
    found,
  );

  return response.status(200).json(secureValues);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;
  const userTryingToPatch = request.context.user;
  const targetUser = await user.findOneByUsername(username);

  if (!authorization.can(userTryingToPatch, 'update:user', targetUser)) {
    throw new ForbiddenError({
      message: 'Usuário não tem permissão para atualizar este recurso',
      action: 'Verifique suas permissões de usuário',
    });
  }
  const updatedUser = await user.update(username, userInputValues);

  const secureValues = authorization.filterOutput(
    userTryingToPatch,
    'read:user',
    updatedUser,
  );

  return response.status(201).json(secureValues);
}
