exports.up = (pgm) => {
  pgm.createTable('sessions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    token: {
      type: 'varchar(96)',
      notNUll: true,
      unique: true,
    },
    user_id: {
      type: 'uuid',
      notNUll: true,
    },
    expires_at: {
      type: 'timestamptz',
      notNUll: true,
    },
    create_at: {
      type: 'timestamptz',
      notNUll: true,
      default: pgm.func("timezone('utc', now())"),
    },
    update_at: {
      type: 'timestamptz',
      notNUll: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
};

exports.down = false;
