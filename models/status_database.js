import database from 'infra/database';

async function get() {
  const dataName = process.env.POSTGRES_DB;
  const maxConnections = await database.query('show max_connections');
  const version = await database.query('show server_version');
  const activeUsers = await database.query({
    text: `select count(*)::int as total from pg_stat_activity where datname = $1;`,
    values: [dataName],
  });

  return {
    version: version.rows[0].server_version,
    max_connections: parseInt(maxConnections.rows[0].max_connections),
    active_users: activeUsers.rows[0].total,
  };
}

const statusDatabase = {
  get,
};

export default statusDatabase;
