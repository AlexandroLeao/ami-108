// This tests only local, pure guards. It never opens a database connection.
const assert = require('node:assert/strict');
const { destination, ensureAuthorized } = require('./preflight-production-db.cjs');

const host = 'ep-fragrant-sea-bcndj0xm.c-16.us-east-1.aws.neon.tech';
const url = (options = {}) => {
  const { hostname = host, name = 'ami', user = 'ami_app', tls = 'require', schema = 'public' } = options;
  return 'postgresql://' + user + ':dummy_example_only@' + hostname + '/' + name +
    '?sslmode=' + tls + '&schema=' + schema;
};

const prior = Object.fromEntries(['DATABASE_URL', 'GITHUB_REF', 'AMI_PRODUCTION_MIGRATION_CONFIRM']
  .map(key => [key, process.env[key]]));
try {
  process.env.DATABASE_URL = url();
  assert.equal(destination(), url());
  for (const attempted of [
    url({ hostname: 'ep-summer-field-bcnzvyx2.c-16.us-east-1.aws.neon.tech' }),
    url({ name: 'neondb' }),
    url({ user: 'postgres' }),
    url({ tls: 'disable' }),
    url({ schema: 'other' }),
    'postgresql://ami_app:dummy_example_only@localhost/ami?sslmode=require',
    '',
  ]) {
    process.env.DATABASE_URL = attempted;
    assert.throws(destination);
  }
  process.env.DATABASE_URL = url();
  assert.throws(ensureAuthorized);
  process.env.GITHUB_REF = 'refs/heads/main';
  process.env.AMI_PRODUCTION_MIGRATION_CONFIRM = 'INCORRECT';
  assert.throws(ensureAuthorized);
  process.env.AMI_PRODUCTION_MIGRATION_CONFIRM = 'MIGRATE_EMPTY_AMI_PRODUCTION';
  assert.doesNotThrow(ensureAuthorized);
  process.env.GITHUB_REF = 'refs/heads/feature/other';
  assert.throws(ensureAuthorized);
  console.log('Production migration identity and authorization guards: PASS');
} finally {
  for (const [key, value] of Object.entries(prior)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
