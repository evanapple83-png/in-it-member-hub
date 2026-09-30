// Runs while the server HTML is parsed (hard loads only): hides [data-reveal] so the first paint
// does not flash content that MotionProvider is about to fade in. It is JS, so without JS nothing
// is hidden, and it removes itself after 2.5s if the app bundle never takes over.
const BOOT = `(function(){try{if(!window.IntersectionObserver)return;var s=document.createElement("style");s.id="motion-pending";s.textContent="[data-reveal],[data-reveal-children]>*{opacity:0}";document.head.appendChild(s);setTimeout(function(){var e=document.getElementById("motion-pending");if(e)e.remove()},2500)}catch(e){}})();`;

export function MotionBoot() {
  return <script dangerouslySetInnerHTML={{ __html: BOOT }} />;
}
