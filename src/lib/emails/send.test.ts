import { afterEach, expect, it, vi } from "vitest";
import { sendEmail } from "./send";
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("attaches flow tags without changing recipients or untagged email behavior", async () => {
  vi.stubEnv("BREVO_API_KEY", "test-only");
  const fetcher = vi.fn().mockResolvedValue({ ok: true }); vi.stubGlobal("fetch", fetcher);
  const mail = { to: "test@example.invalid", subject: "Test", html: "<p>Test</p>" };
  await sendEmail({ ...mail, tags: ["ms-flow-bienvenida"] });
  const tagged = JSON.parse(fetcher.mock.calls[0][1].body);
  expect(tagged.tags).toEqual(["ms-flow-bienvenida"]);
  expect(tagged.to).toEqual([{ email: mail.to, name: mail.to }]);
  await sendEmail(mail);
  expect(JSON.parse(fetcher.mock.calls[1][1].body)).not.toHaveProperty("tags");
  expect(fetcher).toHaveBeenCalledTimes(2);
});
