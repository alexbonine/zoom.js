import { elemOffset, once, windowWidth, windowHeight, srcsetMaxWidth, srcsetFixSizes } from "./utils.js";

class Size {
    constructor(w, h) {
        this.w = w;
        this.h = h;
    }
}

export class ZoomImage {
    constructor(img, offset) {
        this.img = img;
        this.preservedTransform = img.style.transform;
        this.wrap = null;
        this.overlay = null;
        this.offset = offset;
    }

    forceRepaint() {
        var _ = this.img.offsetWidth; 
        return;
    }

    zoom() {
        var naturalSize = new Size(this.img.naturalWidth, this.img.naturalHeight);
        var imgSize = new Size(this.img.width, this.img.height);

        this.wrap = document.createElement("div");
        this.wrap.classList.add("zoom-img-wrap");
        this.img.parentNode.insertBefore(this.wrap, this.img);
        this.wrap.appendChild(this.img);

        this.img.classList.add("zoom-img");
        this.img.setAttribute("data-action", "zoom-out");

        this.overlay = document.createElement("div");
        this.overlay.classList.add("zoom-overlay");
        document.body.appendChild(this.overlay);

        this.forceRepaint();
        var scale = this.calculateScale(naturalSize);

        this.forceRepaint();
        this.animate(scale, imgSize);

        document.body.classList.add("zoom-overlay-open");

        once(this.img, "transitionend", () => {
            if(this.img.hasAttribute('srcset')){
                this.img.setAttribute('sizes', Math.ceil(this.img.width * scale) + 'px');
            }
        });
    }

    calculateScale(size) {

        var imageAspectRatio = size.w / size.h;

        if(this.img.hasAttribute('srcset')){
            var srcSetMaxWidth = srcsetMaxWidth(this.img);

            if(srcSetMaxWidth > 0) {
                size.w = srcSetMaxWidth *  window.devicePixelRatio;
                size.h = size.w / imageAspectRatio;
            }
        }

        var maxScaleFactor = size.w / this.img.width;

        var viewportWidth = (windowWidth() - this.offset);
        var viewportHeight = (windowHeight() - this.offset);
        var viewportAspectRatio = viewportWidth / viewportHeight;

        if (size.w < viewportWidth && size.h < viewportHeight) {
            return maxScaleFactor;
        } else if (imageAspectRatio < viewportAspectRatio) {
            return (viewportHeight / size.h) * maxScaleFactor;
        } else {
            return (viewportWidth / size.w) * maxScaleFactor;
        }
    }

    animate(scale, size) {
        var imageOffset = elemOffset(this.img);
        var scrollTop = window.pageYOffset;

        var viewportX = (windowWidth() / 2);
        var viewportY = scrollTop + (windowHeight() / 2);

        var imageCenterX = imageOffset.left + (size.w / 2);
        var imageCenterY = imageOffset.top + (size.h / 2);

        var tx = viewportX - imageCenterX;
        var ty = viewportY - imageCenterY;
        var tz = 0;

        var imgTr = `scale(${scale})`;
        var wrapTr = `translate3d(${tx}px, ${ty}px, ${tz}px)`;

        this.img.style.transform = imgTr;
        this.wrap.style.transform = wrapTr;
    }

    dispose() {
        if (this.wrap == null || this.wrap.parentNode == null) {
            return;
        }
        this.img.classList.remove("zoom-img");
        this.img.setAttribute("data-action", "zoom");

        this.wrap.parentNode.insertBefore(this.img, this.wrap);
        this.wrap.parentNode.removeChild(this.wrap);

        document.body.removeChild(this.overlay);
        document.body.classList.remove("zoom-overlay-transitioning");
    }

    close() {
        document.body.classList.add("zoom-overlay-transitioning");
        this.img.style.transform = this.preservedTransform;
        if (this.img.style.length === 0) {
            this.img.removeAttribute("style");
        }
        this.wrap.style.transform = "none";

        srcsetFixSizes([this.img]);

        once(this.img, "transitionend", () => {
            this.dispose();
            // XXX(nishanths): remove class should happen after dispose. Otherwise,
            // a new click event could fire and create a duplicate ZoomImage for
            // the same <img> element.
            document.body.classList.remove("zoom-overlay-open");
        });
    }
}