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
const authorization = {
  can,
};

export default authorization;
