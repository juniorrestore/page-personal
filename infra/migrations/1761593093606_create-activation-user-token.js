exports.up = (pgm) => {
  pgm.createTable('user_activation_tokens', {
    id: {
      type: 'uuid',
      notNull: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
    },
    used_at: {
      type: 'timestamp',
      notNull: false,
      default: null,
    },
    expires_at: {
      type: 'timestamp',
      notNull: true,
    },
    create_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    update_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};
exports.down = false;
