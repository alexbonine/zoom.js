import { elemOffset, once, windowWidth, windowHeight } from "./utils.js";

class Size {
    constructor(div, invisibles) {
        this.originalHeight = div.clientHeight;
        this.invisiblesHeight = this.getInvisiblesHeight(invisibles);
        this.height = this.originalHeight + this.invisiblesHeight;

        this.originalWidth = div.clientWidth;
        this.width = Math.ceil(this.originalWidth, this.getInvisiblesWidth(invisibles));
        this.invisiblesWidth = this.width - this.originalWidth;
    }

    getInvisiblesWidth(invisibles) {
        let width = 0;
        for (let i = 0; i < invisibles.length; i++) {
            width += invisibles[i].clientWidth;
        }
        return width;
    }

    getInvisiblesHeight(invisibles) {
        let height = 0;
        for (let i = 0; i < invisibles.length; i++) {
            height += invisibles[i].clientHeight;
        }
        return height;
    }
}

export class ZoomDiv {
    constructor(div, offset) {
        this.div = div;
        this.preservedTransform = div.style.transform;
        this.wrap = null;
        this.overlay = null;
        this.offset = offset;
        this.divSize = null;
        this.invisibles = null;
    }

    forceRepaint() {
        var _ = this.div.offsetWidth; 
        return;
    }

    zoom() {
        this.invisibles = this.div.getElementsByClassName('invisible');
        this.divSize = new Size(this.div, this.invisibles);

        this.wrap = document.createElement("div");
        this.wrap.classList.add("zoom-div-wrap");
        this.div.parentNode.insertBefore(this.wrap, this.div);
        this.wrap.appendChild(this.div);

        this.div.classList.add("zoom-div");
        this.div.setAttribute("data-action", "zoom-out");

        this.overlay = document.createElement("div");
        this.overlay.classList.add("zoom-overlay");
        document.body.appendChild(this.overlay);

        this.div.style.height = `${this.divSize.originalHeight}px`;
        this.div.style.width = `${this.divSize.originalWidth}px`;
        this.forceRepaint();
        var scale = this.calculateScale(this.divSize);
        this.forceRepaint();

        this.showInvisibles();
        this.animate(scale);

        document.body.classList.add("zoom-overlay-open");
    }

    showInvisibles () {
        this.div.style.height = `${this.divSize.height}px`;
        this.div.style.width = `${this.divSize.width}px`;
        for (let i = 0; i < this.invisibles.length; i++) {
            this.invisibles[i].style.position = 'relative';
            this.invisibles[i].style.visibility = 'visible';
            this.invisibles[i].style.opacity = 1;
        }
    }

    hideInvisibles () {
        this.div.style.height = `${this.divSize.originalHeight}px`;
        this.div.style.width = `${this.divSize.originalWidth}px`;
        for (let i = 0; i < this.invisibles.length; i++) {
            this.invisibles[i].removeAttribute("style");
        }
        this.div.removeAttribute("style");
    }

    calculateScale(size) {
        var maxScaleFactor = 1; //size.w / this.div.clientWidth; natural / curr size

        var viewportWidth = (windowWidth() - this.offset);
        var viewportHeight = (windowHeight() - this.offset);
        var imageAspectRatio = size.width / size.height;
        var viewportAspectRatio = viewportWidth / viewportHeight;

        if (size.width < viewportWidth && size.height < viewportHeight) {
            return maxScaleFactor;
        } else if (imageAspectRatio < viewportAspectRatio) {
            return (viewportHeight / size.height) * maxScaleFactor;
        } else {
            return (viewportWidth / size.width) * maxScaleFactor;
        }
    }

    animate(scale) {
        var elementOffset = elemOffset(this.div, this.divSize.invisiblesHeight, this.divSize.invisiblesWidth);
        var scrollTop = window.pageYOffset;

        var viewportX = (windowWidth() / 2);
        var viewportY = scrollTop + (windowHeight() / 2);

        var imageCenterX = elementOffset.left + (this.divSize.width / 2);
        var imageCenterY = elementOffset.top + (this.divSize.height / 2);

        var tx = viewportX - imageCenterX;
        var ty = viewportY - imageCenterY;
        var tz = 0;

        var divTr = `scale(${scale})`;
        var wrapTr = `translate3d(${tx}px, ${ty}px, ${tz}px)`;

        this.div.style.transform = divTr;
        this.wrap.style.transform = wrapTr;
    }

    dispose() {
        if (this.wrap == null || this.wrap.parentNode == null) {
            return;
        }
        this.div.classList.remove("zoom-div");
        this.div.setAttribute("data-action", "zoom");
        this.wrap.parentNode.insertBefore(this.div, this.wrap);
        this.wrap.parentNode.removeChild(this.wrap);

        document.body.removeChild(this.overlay);
        document.body.classList.remove("zoom-overlay-transitioning");
    }

    close() {
        document.body.classList.add("zoom-overlay-transitioning");
        this.div.style.transform = this.preservedTransform;
        this.hideInvisibles();
        if (this.div.style.length === 0) {
            this.div.removeAttribute("style");
        }
        this.wrap.style.transform = "none";

        once(this.div, "transitionend", () => {
            this.dispose();
            // XXX(nishanths): remove class should happen after dispose. Otherwise,
            // a new click event could fire and create a duplicate ZoomImage for
            // the same <div> element.
            document.body.classList.remove("zoom-overlay-open");
        });
    }
}
