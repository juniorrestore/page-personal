import controller from 'infra/controller';
import middlewares from 'infra/middlewares';
import activation from 'models/activation';
import authorization from 'models/authorization';
import { createRouter } from 'next-connect';

const router = createRouter();
router.use(middlewares.injectAnonymousOrUser);
router.patch(middlewares.canRequest('read:activation_token'), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const tokenId = request.query.token_id;
  const triyingUserToPatch = request.context.user;

  const activationToken = await activation.getTokenValid(tokenId);
  await activation.activateUserByUserId(activationToken.user_id);

  const usedActivationToken = await activation.markAsUsed(activationToken.id);

  const secureValues = authorization.filterOutput(
    triyingUserToPatch,
    'read:activation_token',
    usedActivationToken,
  );

  return response.status(200).json(secureValues);
}
