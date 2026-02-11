function can(user, features, resource) {
  let authorized = false;

  if (user.features.includes(features)) {
    authorized = true;
  }

  if (features === 'update:user' && resource) {
    authorized = false;
    if (user.id == resource.id || can(user, 'update:user:other')) {
      authorized = true;
    }
  }
  return authorized;
}

function filterOutput(user, feature, target) {
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
    if (feature.includes('read:status:admin')) {
      return {
        update_at: target.updateAt,
        database: {
          max_connections: target.statusData.max_connections,
          active_users: target.statusData.active_users,
          version: target.statusData.version,
        },
      };
    }
    return {
      update_at: target.updateAt,
      database: {
        max_connections: target.statusData.max_connections,
        active_users: target.statusData.active_users,
      },
    };
  }
}
const authorization = {
  can,
  filterOutput,
};

export default authorization;
