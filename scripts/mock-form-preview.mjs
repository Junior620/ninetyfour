// Local-only QA companion. No mutation is ever forwarded to the application.
// Run: node scripts/mock-form-preview.mjs
import http from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureDir = path.join(root, 'artifacts', 'v2', 'fixtures');
await mkdir(fixtureDir, { recursive: true });
await writeFile(path.join(fixtureDir, 'synthetic-photo.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'));

function syntheticPdf() {
  const stream = 'BT /F1 15 Tf 40 780 Td (QA ONLY - synthetic document) Tj 0 -25 Td (No application saved. No email sent.) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let content = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(content));
    content += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(content);
  content += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  content += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  content += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(content);
}
const pdf = syntheticPdf();
await writeFile(path.join(fixtureDir, 'synthetic-document.pdf'), pdf);
const counters = { '/api/contact': 0, '/api/recruitments': 0 };
const json = (response, status, body) => {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-QA-Mock': 'local-only-no-side-effects' });
  response.end(JSON.stringify(body));
};

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url ?? '/', 'http://127.0.0.1:3002').pathname;
  if (request.method === 'GET' && pathname === '/__qa/reset') {
    Object.keys(counters).forEach(key => { counters[key] = 0; });
    return json(response, 200, { reset: true, counters });
  }
  if (request.method === 'GET' && pathname === '/__qa/status') return json(response, 200, { counters, upstream: 'http://127.0.0.1:3000', mutationsForwarded: 0 });
  if (request.method === 'POST' && Object.hasOwn(counters, pathname)) {
    // Discard the synthetic body; never log or save submitted fields or files.
    request.resume();
    request.on('end', () => {
      const attempt = ++counters[pathname];
      if (attempt === 1) return json(response, 503, { success: false, error: 'qa_simulated_service_unavailable' });
      return json(response, 200, {
        success: true, reference: pathname === '/api/contact' ? 'QA-CONTACT-SIMULATED' : 'QA-RECRUITMENT-SIMULATED',
        maskedEmail: 't***@example.invalid', emailSent: false,
        ...(pathname === '/api/recruitments' ? { applicationId: 'qa-only-not-saved', pdfSignedUrl: null, pdfBase64: pdf.toString('base64'), fileName: 'qa-synthetic-recruitment.pdf' } : {}),
      });
    });
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    request.resume();
    return json(response, 405, { success: false, error: 'qa_proxy_blocks_all_other_mutations' });
  }
  const upstream = http.request({ hostname: '127.0.0.1', port: 3000, path: request.url, method: request.method, headers: { ...request.headers, host: '127.0.0.1:3000' } }, incoming => {
    response.writeHead(incoming.statusCode ?? 502, incoming.headers);
    incoming.pipe(response);
  });
  upstream.on('error', () => json(response, 502, { success: false, error: 'qa_upstream_unavailable' }));
  request.on('aborted', () => upstream.destroy());
  upstream.end();
});
server.listen(3002, '127.0.0.1', () => console.log('QA proxy: http://127.0.0.1:3002 (GET/HEAD to 3000; contact/recruitment POST simulated, all other mutations blocked). Reset: /__qa/reset'));
