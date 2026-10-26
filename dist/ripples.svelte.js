export function useRipples(options = {}) {
    const { color = "currentColor", duration = 600, opacity = 0.35, scale = 2, holdSpeed = 0.15, } = options;
    return (node) => {
        if (matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;
        // Clipping layer, so the host element's own overflow/styles stay untouched
        const layer = document.createElement("span");
        layer.setAttribute("aria-hidden", "true");
        Object.assign(layer.style, {
            position: "absolute",
            inset: "0",
            overflow: "hidden",
            borderRadius: "inherit",
            pointerEvents: "none",
        });
        if (getComputedStyle(node).position === "static") {
            node.style.position = "relative";
        }
        node.append(layer);
        const held = new Set();
        function release() {
            for (const anim of held)
                anim.playbackRate = 1;
            held.clear();
        }
        function onPointerDown(e) {
            if (e.button !== 0)
                return;
            const rect = node.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * scale;
            const ripple = document.createElement("span");
            Object.assign(ripple.style, {
                position: "absolute",
                left: `${e.clientX - rect.left - size / 2}px`,
                top: `${e.clientY - rect.top - size / 2}px`,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: "50%",
                background: color,
                pointerEvents: "none",
            });
            layer.append(ripple);
            const anim = ripple.animate([
                { transform: "scale(0.05)", opacity: 0, offset: 0 },
                { opacity, offset: 0.2 },
                { transform: "scale(1)", opacity: 0, offset: 1 },
            ], { duration, easing: "ease-out", fill: "forwards" });
            anim.playbackRate = holdSpeed;
            anim.onfinish = () => {
                held.delete(anim);
                ripple.remove();
            };
            held.add(anim);
        }
        node.addEventListener("pointerdown", onPointerDown);
        // Window-level so releasing outside the element still resumes the ripple
        window.addEventListener("pointerup", release);
        window.addEventListener("pointercancel", release);
        return () => {
            node.removeEventListener("pointerdown", onPointerDown);
            window.removeEventListener("pointerup", release);
            window.removeEventListener("pointercancel", release);
            for (const anim of held)
                anim.cancel();
            held.clear();
            layer.remove();
        };
    };
}
