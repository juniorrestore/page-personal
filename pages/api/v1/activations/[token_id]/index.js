import controller from 'infra/controller';
import middlewares from 'infra/middlewares';
import activation from 'models/activation';
import { createRouter } from 'next-connect';

const router = createRouter();
router.use(middlewares.injectAnonymousOrUser);
router.patch(middlewares.canRequest('read:activation_token'), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const tokenId = request.query.token_id;

  const activationToken = await activation.getTokenValid(tokenId);
  await activation.activateUserByUserId(activationToken.user_id);

  const usedActivationToken = await activation.markAsUsed(activationToken.id);

  return response.status(200).json(usedActivationToken);
}
