import controller from 'infra/controller';
import middlewares from 'infra/middlewares';
import authorization from 'models/authorization';
import statusDatabase from 'models/status_database';
import { createRouter } from 'next-connect';

const router = createRouter();

router.use(middlewares.injectAnonymousOrUser);
router.get(middlewares.canRequest('read:status'), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const tryingUserGet = request.context.user;

  const updateAt = new Date().toISOString();
  const statusData = await statusDatabase.get();
  const secureValues = authorization.filterOutput(
    tryingUserGet,
    tryingUserGet.features,
    { updateAt, statusData },
  );

  return response.status(200).json({
    secureValues,
  });
}
