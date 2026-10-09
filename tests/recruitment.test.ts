import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../src/app/api/recruitments/route';
import {
  PHOTO_MAX_BYTES, DOCUMENT_MAX_BYTES, recruitmentDocuments,
  validateAttachment, validateRecruitmentAttachments, attachmentMessage,
} from '../src/lib/recruitment/attachments';
import { createContactSchema, createRecruitmentSchema, type RecruitmentFormData } from '../src/lib/validations/schemas';

const file = (type: string, size = 1) => new File([new Uint8Array(size)], 'synthetic-test-file', { type });
const flags = { birthCertificateProvided: true, parentalAuthProvided: true, medicalCertificateProvided: true, feesPaidProvided: true };
const validData: RecruitmentFormData = {
  playerNumber: 'TEST-001', category: 'U-14', zone: 'A', lastName: 'Synthetic', firstNames: 'Test',
  dobDay: '01', dobMonth: '01', dobYear: '2013', age: '13', nationality: 'Test',
  playerPhone: '000000000', fatherTutorName: 'Test Guardian', fatherTutorPhone: '000000000',
  email: 'test@example.invalid', address: 'Synthetic test address', currentClub: 'Test club', school: 'Test school',
  primaryPosition: 'GARDIEN', strongFoot: 'right', injuryCurrent: false, ...flags,
  amountPaidXaf: '1', paymentMethod: 'cash', parentDeclarationName: 'Test Guardian', consent: true,
};

test('photo limits accept JPEG/PNG through 5 MiB and reject PDF, empty files and oversize uploads', () => {
  for (const type of ['image/jpeg', 'image/png']) assert.equal(validateAttachment('photo', file(type, PHOTO_MAX_BYTES)), null);
  assert.equal(validateAttachment('photo', file('image/png', PHOTO_MAX_BYTES + 1))?.code, 'size');
  assert.equal(validateAttachment('photo', file('application/pdf'))?.code, 'type');
  assert.equal(validateAttachment('photo', file('image/png', 0))?.code, 'empty');
  assert.equal(validateAttachment('photo', 'a-filename-is-not-a-file.png')?.code, 'missing');
});

test('documents accept PDF/JPEG/PNG through 10 MiB and validate every supplied attachment', () => {
  for (const type of ['application/pdf', 'image/jpeg', 'image/png']) assert.equal(validateAttachment('birthCertificate', file(type, DOCUMENT_MAX_BYTES)), null);
  assert.equal(validateAttachment('birthCertificate', file('application/pdf', DOCUMENT_MAX_BYTES + 1))?.code, 'size');
  assert.equal(validateAttachment('parentalAuth', file('image/gif'))?.code, 'type');
  assert.equal(validateAttachment('medicalCertificate', file('application/pdf', 0))?.code, 'empty');
  assert.equal(validateAttachment('feesReceipt', undefined, false), null);
  assert.equal(validateAttachment('feesReceipt', file('text/plain'), false)?.code, 'type');
});

test('declared documents must be real files; undeclared absent documents remain optional', () => {
  assert.deepEqual(validateRecruitmentAttachments(flags, { photo: file('image/png') }), recruitmentDocuments.map(({ field }) => ({ field, code: 'missing' })));
  assert.deepEqual(validateRecruitmentAttachments({ birthCertificateProvided: false, parentalAuthProvided: false, medicalCertificateProvided: false, feesPaidProvided: false }, { photo: file('image/jpeg') }), []);
  assert.match(attachmentMessage({ field: 'photo', code: 'size' }, 'fr'), /5 Mo/);
  assert.match(attachmentMessage({ field: 'medicalCertificate', code: 'type' }, 'en'), /PDF, JPEG or PNG/);
});

test('contact and recruitment validators localize field and conditional errors', () => {
  for (const locale of ['fr', 'en']) {
    const contact = createContactSchema(locale).safeParse({ name: '', email: '', subject: '', message: '' });
    assert.equal(contact.success, false);
    if (!contact.success) assert.equal(contact.error.issues.find(issue => issue.path[0] === 'name')?.message, locale === 'fr' ? 'Nom requis' : 'Please enter your name');
    const missingPosition = createRecruitmentSchema(locale).safeParse({ ...validData, primaryPosition: undefined });
    assert.equal(missingPosition.success, false);
    if (!missingPosition.success) assert.equal(missingPosition.error.issues.find(issue => issue.path[0] === 'primaryPosition')?.message, locale === 'fr' ? 'Poste requis' : 'Position is required');
    const recruitment = createRecruitmentSchema(locale).safeParse({ ...validData, injuryCurrent: true, injuryDetails: '', amountPaidXaf: '', paymentMethod: 'other', paymentMethodOther: '' });
    assert.equal(recruitment.success, false);
    if (!recruitment.success) {
      const messages = new Map(recruitment.error.issues.map(issue => [issue.path[0], issue.message]));
      assert.equal(messages.get('injuryDetails'), locale === 'fr' ? 'Veuillez préciser la blessure.' : 'Please describe the injury.');
      assert.equal(messages.get('amountPaidXaf'), locale === 'fr' ? 'Montant requis.' : 'Amount is required.');
      assert.equal(messages.get('paymentMethodOther'), locale === 'fr' ? 'Veuillez préciser le mode de paiement.' : 'Please specify the payment method.');
    }
  }
});

test('recruitment API rejects missing declared attachments before PDF generation or external effects', async t => {
  const originalFetch = globalThis.fetch;
  const envNames = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
  const originalEnv = envNames.map(name => process.env[name]);
  let networkCalls = 0;
  let fileReads = 0;
  let requestNumber = 0;
  globalThis.fetch = async () => { networkCalls++; throw new Error('External calls are prohibited in this test'); };
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.example.invalid';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-key';
  const makeRequest = (missing: string) => {
    const form = new FormData();
    for (const [key, value] of Object.entries(validData)) form.set(key, String(value));
    form.set('locale', 'en');
    for (const field of ['photo', ...recruitmentDocuments.map(item => item.field)]) {
      if (field === missing) continue;
      const attachment = file(field === 'photo' ? 'image/png' : 'application/pdf');
      // PDF/persistence consume these bytes only after all attachment checks pass.
      attachment.arrayBuffer = async () => { fileReads++; throw new Error('Invalid applications must not read attachment bytes for PDF/storage'); };
      form.set(field, attachment);
    }
    return { formData: async () => form, headers: new Headers({ 'x-forwarded-for': `recruitment-test-${++requestNumber}` }) } as unknown as Request;
  };
  try {
    for (const field of ['photo', ...recruitmentDocuments.map(item => item.field)]) {
      await t.test(`missing ${field} returns HTTP 400`, async () => {
        const response = await POST(makeRequest(field));
        assert.equal(response.status, 400);
        const body = await response.json();
        assert.equal(body.success, false);
        assert.equal(body.error, 'invalid_attachments');
        assert.deepEqual(body.issues, [{ field, code: 'missing' }]);
        assert.equal(fileReads, 0);
        assert.equal(networkCalls, 0);
      });
    }
    await t.test('missing attachment validation still takes precedence when storage is unconfigured', async () => {
      envNames.forEach(name => delete process.env[name]);
      assert.equal((await POST(makeRequest('parentalAuth'))).status, 400);
      assert.equal(fileReads, 0);
      assert.equal(networkCalls, 0);
    });
  } finally {
    globalThis.fetch = originalFetch;
    envNames.forEach((name, index) => { if (originalEnv[index] === undefined) delete process.env[name]; else process.env[name] = originalEnv[index]; });
  }
});
