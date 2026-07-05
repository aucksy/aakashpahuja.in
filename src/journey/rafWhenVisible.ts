/** Run `frame` on requestAnimationFrame only while `el` is near the viewport.
 *  Chapter canvases (guitar strings, github constellation) must not burn frame
 *  budget while off-screen — otherwise they'd steal from whatever the visitor is
 *  actually looking at. Returns a cleanup fn. */
export function rafWhenVisible(el: HTMLElement, frame: () => void): () => void {
  let raf = 0;
  let running = false;
  const loop = () => {
    frame();
    raf = requestAnimationFrame(loop);
  };
  const io = new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting && !running) {
        running = true;
        raf = requestAnimationFrame(loop);
      } else if (!e.isIntersecting && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    },
    { rootMargin: '250px' },
  );
  io.observe(el);
  return () => {
    io.disconnect();
    cancelAnimationFrame(raf);
  };
}
