function can(user, features, resource) {
  let authorized = false;

  if (user.features.includes(features)) {
    authorized = true;
  }

  if (features === 'update:user' && resource) {
    console.log('entrou aqui');
    authorized = false;
    console.log('user.id', user.id);
    console.log('resource.id', resource.id);
    if (user.id == resource.id) {
      authorized = true;
    }
  }
  return authorized;
}
const authorization = {
  can,
};

export default authorization;
