import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_CV_BYTES, readCvUpload, safeCvFilename } from "../src/lib/cv-validation.ts";

const pdf = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n");
function upload(content, name = "resume.pdf", type = "application/pdf") {
  const form = new FormData();
  form.append("file", new File([content], name, { type }));
  return new Request("http://localhost/api/me/cv", { method: "POST", body: form });
}

test("accepts PDF uploads and sanitizes download names", async () => {
  const result = await readCvUpload(upload(pdf, "My CV.PDF"));
  assert.equal(result.filename, "My CV.pdf");
  assert.equal(result.size, pdf.length);
  assert.deepEqual(result.content, pdf);
  assert.equal(safeCvFilename('../../cv"\r\n.pdf'), "cv___.pdf");
});

test("rejects empty, disguised, wrong-type and oversized files", async () => {
  for (const request of [
    upload(new Uint8Array()),
    upload("<html>not a PDF</html>"),
    upload(pdf, "resume.html"),
    upload(pdf, "resume.pdf", "text/html"),
    upload(new Uint8Array(MAX_CV_BYTES + 1)),
  ]) {
    await assert.rejects(readCvUpload(request), (error) => [400, 413].includes(error.status));
  }
});

test("limits streamed request bodies even without Content-Length", async () => {
  const stream = new ReadableStream({ start(controller) {
    controller.enqueue(new Uint8Array(MAX_CV_BYTES + 65537));
    controller.close();
  } });
  const request = new Request("http://localhost/api/me/cv", {
    method: "POST", body: stream, duplex: "half", headers: { "content-type": "multipart/form-data; boundary=demo" },
  });
  await assert.rejects(readCvUpload(request), (error) => error.status === 413);
});
