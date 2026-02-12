import { InternalServerError } from 'infra/errors';

const availableFeatures = [
  //USER
  'read:user',
  'create:user',
  'update:user',
  'update:user:other',

  //SESSION
  'read:session',
  'create:session',

  //ACTIVATION
  'read:activation_token',

  //STATUS
  'read:status',
  'read:status:admin',
];

function can(user, feature, target) {
  validateUser(user);
  validateFeatures(feature);
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  if (feature === 'update:user' && target) {
    authorized = false;
    if (user.id == target.id || can(user, 'update:user:other')) {
      authorized = true;
    }
  }

  return authorized;
}

function filterOutput(user, feature, target) {
  validateUser(user);
  validateFeatures(feature);
  validateTarget(target);
  if (feature === 'read:user') {
    return {
      id: target.id,
      username: target.username,
      features: target.features,
      create_at: target.create_at,
      update_at: target.update_at,
    };
  }

  if (feature === 'read:session') {
    if (target.user_id === user.id) {
      return {
        id: target.id,
        token: target.token,
        user_id: target.user_id,
        features: target.features,
        create_at: target.create_at,
        update_at: target.update_at,
        expires_at: target.expires_at,
      };
    }
  }

  if (feature === 'read:activation_token') {
    return {
      id: target.id,
      user_id: target.user_id,
      used_at: target.used_at,
      create_at: target.create_at,
      update_at: target.update_at,
      expires_at: target.expires_at,
    };
  }

  if (feature.includes('read:status')) {
    const result = {
      update_at: target.updateAt,
      database: {
        max_connections: target.statusData.max_connections,
        active_users: target.statusData.active_users,
      },
    };

    if (user.features.includes('read:status:admin')) {
      result.database.version = target.statusData.version;
    }

    return result;
  }
}

function validateUser(user) {
  if (!user || !user.features) {
    throw new InternalServerError({
      cause: 'User or user.features is required',
    });
  }
}

function validateFeatures(features) {
  if (!features || !availableFeatures.includes(features)) {
    throw new InternalServerError({
      cause: 'It is necessary to inform a valid feature',
    });
  }
}

function validateTarget(target) {
  if (!target) {
    throw new InternalServerError({
      cause: 'It is necessary to inform a Target',
    });
  }
}

const authorization = {
  can,
  filterOutput,
};

export default authorization;
