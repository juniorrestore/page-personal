function can(user, features) {
  let authorized = false;

  if (user.features.includes(features)) {
    authorized = true;
  }
  return authorized;
}

const authorization = {
  can,
};

export default authorization;
