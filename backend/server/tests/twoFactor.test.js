jest.mock('../config/stripe', () => require('./helpers/stripeMock'));
jest.mock('../utils/emailService');

const { authenticator } = require('otplib');
const { resetDb, resetRateLimits, client, createUser, createAdmin, loginAs, closeAll } = require('./helpers/app');

// A controllable clock: authenticator codes change every 30 seconds
let now;
beforeEach(async () => {
  await resetDb();
  resetRateLimits();
  now = Date.now();
  jest.spyOn(Date, 'now').mockImplementation(() => now);
});
afterEach(() => jest.restoreAllMocks());
afterAll(closeAll);

const nextCodeWindow = () => { now += 30 * 1000; };
const codeFor = (secret) => authenticator.generate(secret);

// Signs in and turns 2FA on; returns the client, secret and recovery codes
const withTwoFactor = async (user) => {
  const c = await loginAs(user);
  const { secret } = (await c.post('/api/auth/2fa/setup')).body;
  const { recoveryCodes } = (await c.post('/api/auth/2fa/enable', { code: codeFor(secret) })).body;
  nextCodeWindow();
  return { c, secret, recoveryCodes };
};

const passwordStep = async (user) => {
  const c = client();
  const res = await c.post('/api/auth/login', { email: user.email, password: 'password123' });
  return { c, res };
};

describe('setting up', () => {
  test('setup returns a QR code and secret but does not turn 2FA on until confirmed', async () => {
    const user = await createUser();
    const c = await loginAs(user);

    const res = await c.post('/api/auth/2fa/setup');
    expect(res.status).toBe(200);
    expect(res.body.qrCode).toMatch(/^data:image\/png;base64,/);
    expect(res.body.secret).toMatch(/^[A-Z2-7]+$/);

    const { res: login } = await passwordStep(user);
    expect(login.body.twoFactorRequired).toBeUndefined();
  });

  test('a wrong confirmation code does not turn 2FA on', async () => {
    const c = await loginAs(await createUser());
    await c.post('/api/auth/2fa/setup');
    const res = await c.post('/api/auth/2fa/enable', { code: '000000' });
    expect(res.status).toBe(400);
    expect((await c.get('/api/auth/profile')).body.twoFactorEnabled).toBe(false);
  });

  test('confirming gives 8 recovery codes, keeps this device signed in and signs out others', async () => {
    const user = await createUser();
    const other = await loginAs(user);
    const { c, recoveryCodes } = await withTwoFactor(user);

    expect(recoveryCodes).toHaveLength(8);
    expect((await c.get('/api/auth/profile')).body.twoFactorEnabled).toBe(true);
    expect((await other.get('/api/auth/profile')).status).toBe(401);
  });
});

describe('signing in with 2FA', () => {
  test('a correct password alone does not sign in', async () => {
    const user = await createUser();
    await withTwoFactor(user);

    const { c, res } = await passwordStep(user);
    expect(res.body).toEqual({ twoFactorRequired: true });
    expect((await c.get('/api/auth/profile')).status).toBe(401);
  });

  test('the authenticator code completes sign-in', async () => {
    const user = await createUser();
    const { secret } = await withTwoFactor(user);

    const { c } = await passwordStep(user);
    const res = await c.post('/api/auth/2fa/verify', { code: codeFor(secret) });
    expect(res.status).toBe(200);
    expect((await c.get('/api/auth/profile')).status).toBe(200);
  });

  test('a wrong code is rejected', async () => {
    const user = await createUser();
    await withTwoFactor(user);
    const { c } = await passwordStep(user);
    expect((await c.post('/api/auth/2fa/verify', { code: '123456' })).status).toBe(401);
  });

  test('a code cannot be used twice', async () => {
    const user = await createUser();
    const { secret } = await withTwoFactor(user);
    const code = codeFor(secret);

    const first = await passwordStep(user);
    expect((await first.c.post('/api/auth/2fa/verify', { code })).status).toBe(200);
    const second = await passwordStep(user);
    expect((await second.c.post('/api/auth/2fa/verify', { code })).status).toBe(401);
  });

  test('each recovery code works once', async () => {
    const user = await createUser();
    const { recoveryCodes } = await withTwoFactor(user);

    const first = await passwordStep(user);
    expect((await first.c.post('/api/auth/2fa/verify', { code: recoveryCodes[0] })).status).toBe(200);
    const second = await passwordStep(user);
    expect((await second.c.post('/api/auth/2fa/verify', { code: recoveryCodes[0] })).status).toBe(401);
    expect((await second.c.post('/api/auth/2fa/verify', { code: recoveryCodes[1].toUpperCase() })).status).toBe(200);
  });

  test('the code step needs the password step first', async () => {
    const user = await createUser();
    const { secret } = await withTwoFactor(user);
    const res = await client().post('/api/auth/2fa/verify', { code: codeFor(secret) });
    expect(res.status).toBe(401);
  });

  test('the password-step pass expires after 5 minutes', async () => {
    const user = await createUser();
    const { secret } = await withTwoFactor(user);
    const { c } = await passwordStep(user);
    now += 6 * 60 * 1000;
    expect((await c.post('/api/auth/2fa/verify', { code: codeFor(secret) })).status).toBe(401);
  });
});

describe('turning it off', () => {
  test('needs the password and a valid code', async () => {
    const user = await createUser();
    const { c, secret } = await withTwoFactor(user);

    expect((await c.post('/api/auth/2fa/disable', { password: 'wrongpass1', code: codeFor(secret) })).status).toBe(401);
    expect((await c.post('/api/auth/2fa/disable', { password: 'password123', code: '000000' })).status).toBe(401);
    const res = await c.post('/api/auth/2fa/disable', { password: 'password123', code: codeFor(secret) });
    expect(res.status).toBe(200);

    const { res: login } = await passwordStep(user);
    expect(login.body.twoFactorRequired).toBeUndefined();
  });
});

test('the secret and recovery codes are never sent to browsers', async () => {
  const user = await createUser();
  const { c } = await withTwoFactor(user);
  const admin = await loginAs(await createAdmin());

  const profile = (await c.get('/api/auth/profile')).body;
  const listed = (await admin.get('/api/users')).body.users.find(u => u.id === user.id);
  const edited = (await admin.put(`/api/users/${user.id}`, { name: 'Renamed' })).body.user;
  for (const record of [profile, listed, edited]) {
    for (const field of ['twoFactorSecret', 'twoFactorRecoveryCodes', 'twoFactorLastStep', 'tokenVersion']) {
      expect(record).not.toHaveProperty(field);
    }
  }
});
