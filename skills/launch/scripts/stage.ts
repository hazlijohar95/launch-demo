/**
 * Human pacing for demo specs. Playwright clicks instantly and draws no
 * pointer; on film that reads as a page changing by itself. A filmed context
 * draws a cursor, and a Hand moves it along an eased path, presses, and types
 * at reading speed.
 */

import type { Browser, Locator, Page } from "@playwright/test";

export const FILM_VIEWPORT = { width: 1600, height: 900 };

export async function filmedContext(
  browser: Browser,
  options: { baseURL: string; storageState?: string },
) {
  const context = await browser.newContext({
    ...options,
    viewport: FILM_VIEWPORT,
    deviceScaleFactor: 2,
  });
  await context.addInitScript(drawCursor);
  return context;
}

export class Hand {
  private x = FILM_VIEWPORT.width / 2;
  private y = FILM_VIEWPORT.height / 2;

  constructor(readonly page: Page) {}

  async click(target: Locator) {
    // A trial click waits until the target is visible, stable, enabled and
    // not covered, as a real click would, without clicking.
    await target.click({ trial: true });
    const box = await target.boundingBox();
    if (!box) throw new Error(`Nothing to click: ${target}`);
    await this.moveTo(box.x + box.width / 2, box.y + box.height / 2);
    await this.page.waitForTimeout(180);
    await this.page.mouse.down();
    await this.page.waitForTimeout(90);
    await this.page.mouse.up();
    await this.page.waitForTimeout(350);
  }

  /** Replace the field's contents with `text`, typed at reading speed. */
  async type(target: Locator, text: string) {
    await this.click(target);
    await target.press("ControlOrMeta+A");
    await target.pressSequentially(text, { delay: 55 });
    await this.page.waitForTimeout(250);
  }

  private async moveTo(x: number, y: number) {
    const from = { x: this.x, y: this.y };
    const distance = Math.hypot(x - from.x, y - from.y);
    const steps = Math.round(Math.min(45, Math.max(12, distance / 18)));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      await this.page.mouse.move(
        from.x + (x - from.x) * eased,
        from.y + (y - from.y) * eased,
      );
      await this.page.waitForTimeout(10);
    }
    this.x = x;
    this.y = y;
  }
}

/** Runs in the page: a pointer that follows the mouse and a ripple on press. */
function drawCursor() {
  if (window.top !== window) return;
  const KEY = "demo-cursor";
  const cursor = document.createElement("div");
  cursor.setAttribute("aria-hidden", "true");
  cursor.style.cssText =
    "position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px)";
  cursor.innerHTML =
    '<svg width="26" height="26" viewBox="0 0 26 26"><path d="M3 2 L3 21 L8.5 16 L12 24 L15.5 22.5 L12 15 L19.5 15 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  const place = (x: number, y: number) => {
    cursor.style.transform = `translate(${x - 3}px, ${y - 2}px)`;
  };
  // Hydration can drop nodes React did not render, so the cursor re-attaches.
  const attach = () => {
    if (!cursor.isConnected && document.body) {
      document.body.appendChild(cursor);
    }
  };
  // Opaque-origin documents (about:blank, data: URLs) refuse storage.
  const store = (() => {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  })();
  const saved = store?.getItem(KEY)?.match(/^(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)$/);
  if (saved) place(Number(saved[1]), Number(saved[2]));
  setInterval(attach, 200);

  window.addEventListener(
    "mousemove",
    (event) => {
      attach();
      place(event.clientX, event.clientY);
      store?.setItem(KEY, `${event.clientX},${event.clientY}`);
    },
    true,
  );
  window.addEventListener(
    "mousedown",
    (event) => {
      const ripple = document.createElement("div");
      ripple.style.cssText = `position:fixed;left:${event.clientX - 18}px;top:${event.clientY - 18}px;width:36px;height:36px;border-radius:50%;background:rgba(37,99,235,.35);z-index:2147483646;pointer-events:none`;
      document.body.appendChild(ripple);
      ripple
        .animate(
          [
            { transform: "scale(.4)", opacity: 1 },
            { transform: "scale(1.6)", opacity: 0 },
          ],
          { duration: 450, easing: "ease-out" },
        )
        .finished.then(() => ripple.remove());
    },
    true,
  );
}
