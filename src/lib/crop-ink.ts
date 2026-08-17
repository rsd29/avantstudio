/**
 * Crop an element’s box to the painted glyph ink, removing the usual
 * em-box padding (especially the empty space under capitals).
 */
export function cropToInk(el: HTMLElement) {
  el.style.height = "";
  el.style.transform = "";
  el.style.overflow = "visible";

  const range = document.createRange();
  range.selectNodeContents(el);
  const ink = range.getBoundingClientRect();
  const box = el.getBoundingClientRect();
  if (ink.height < 1 || box.height < 1) return;

  // Range bounds are often loose under display fonts; prefer canvas ink metrics.
  const style = getComputedStyle(el);
  const fontSize = parseFloat(style.fontSize) || ink.height;
  let inkHeight = ink.height;
  const text = el.textContent?.trim() ?? "";
  const ctx = document.createElement("canvas").getContext("2d");
  if (ctx && text) {
    ctx.font = style.font;
    const metrics = ctx.measureText(text);
    const ascent = metrics.actualBoundingBoxAscent;
    const descent = metrics.actualBoundingBoxDescent;
    if (ascent > 0 || descent > 0) {
      inkHeight = ascent + descent;
    } else {
      // Capitals usually sit above the em-box baseline padding
      inkHeight = ink.height - fontSize * 0.1;
    }
  }

  // Keep the glyph top; trim the empty space underneath
  const extraTop = ink.top - box.top;
  el.style.overflow = "hidden";
  el.style.height = `${Math.max(inkHeight, fontSize * 0.5)}px`;
  el.style.transform = `translateY(${-extraTop}px)`;
}
