// Email delivery: Resend's HTTPS API when configured, SMTP otherwise
const loadEmailService = (env) => {
  let service;
  jest.isolateModules(() => {
    Object.assign(process.env, env);
    service = require('../utils/emailService');
  });
  return service;
};

const order = {
  id: '8f14e45f-ceea-467a-9575-111111111111',
  createdAt: new Date(),
  totalAmount: '24.99',
  status: 'processing',
  items: [{ name: 'Test <b>Item</b>', price: '14.99', quantity: 1 }],
  shippingAddress: { firstName: 'Ada', lastName: 'Buyer', address: '1 Union Street', city: 'Aberdeen', zipCode: 'AB10 1XG' }
};

afterEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
  jest.restoreAllMocks();
});

test('sends through Resend with the store address, reply-to support, and escaped content', async () => {
  const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ id: 'email_1' }) });
  const emailService = loadEmailService({
    RESEND_API_KEY: 're_test_key',
    EMAIL_FROM: 'Hailplus <orders@hailplus.co.uk>',
    SUPPORT_EMAIL: 'support@example.com'
  });

  await emailService.sendOrderConfirmation('customer@example.com', order);

  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, request] = fetchMock.mock.calls[0];
  const body = JSON.parse(request.body);
  expect(url).toBe('https://api.resend.com/emails');
  expect(request.headers.Authorization).toBe('Bearer re_test_key');
  expect(body).toMatchObject({
    from: 'Hailplus <orders@hailplus.co.uk>',
    to: ['customer@example.com'],
    reply_to: 'support@example.com'
  });
  expect(body.html).toContain('Test &lt;b&gt;Item&lt;/b&gt;');
  expect(body.html).toContain('£24.99');
});

test('a Resend error is logged, not thrown to the caller', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 403, text: async () => 'domain not verified' });
  const emailService = loadEmailService({ RESEND_API_KEY: 're_test_key' });

  await expect(emailService.sendOrderConfirmation('customer@example.com', order)).resolves.toBeUndefined();
});

test('without a Resend key it does not call the Resend API', async () => {
  const fetchMock = jest.spyOn(global, 'fetch');
  const emailService = loadEmailService({ EMAIL_HOST: '127.0.0.1', EMAIL_PORT: '1' });

  await emailService.sendOrderConfirmation('customer@example.com', order);
  expect(fetchMock).not.toHaveBeenCalled();
});
