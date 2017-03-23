import { elemOffset, once, windowWidth, windowHeight } from "./utils.js";

/* MinusPadding versions used for setting size of div; others for transform/centering */
class Size {
    constructor(div, invisibles, recedes) {
        const styles = window.getComputedStyle(div);
        this.originalHeight = div.clientHeight;
        this.originalHeightMinusPadding = this.originalHeight - parseInt(styles.paddingTop, 10) - parseInt(styles.paddingBottom, 10);
        this.invisiblesHeight = this.getTotalHeight(invisibles);
        this.recedesHeight = this.getTotalHeight(recedes);
        this.newHeight = this.originalHeight + this.invisiblesHeight - this.recedesHeight;
        this.newHeightMinusPadding = this.originalHeightMinusPadding + this.invisiblesHeight - this.recedesHeight;

        this.originalWidth = div.clientWidth;
        this.originalWidthMinusPadding = this.originalWidth - parseInt(styles.paddingLeft, 10) - parseInt(styles.paddingRight, 10);
        // this.width = Math.ceil(this.originalWidth, this.getInvisiblesWidth(invisibles));
        // this.invisiblesWidth = this.width - this.originalWidth;
    }

    // getInvisiblesWidth(invisibles) {
    //     let width = 0;
    //     for (let i = 0; i < invisibles.length; i++) {
    //         width += invisibles[i].clientWidth;
    //     }
    //     return width;
    // }

    getTotalHeight(elements) {
        let height = 0;
        for (let i = 0; i < elements.length; i++) {
            height += elements[i].clientHeight;
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
        this.recedes = null;
    }

    forceRepaint() {
        var _ = this.div.offsetWidth; 
        return;
    }

    zoom() {
        this.invisibles = this.div.getElementsByClassName('invisible');
        this.recedes = this.div.getElementsByClassName('recede');
        this.divSize = new Size(this.div, this.invisibles, this.recedes);

        this.wrap = document.createElement("div");
        this.wrap.classList.add("zoom-div-wrap");
        this.div.parentNode.insertBefore(this.wrap, this.div);
        this.wrap.appendChild(this.div);

        this.div.classList.add("zoom-div");
        this.div.setAttribute("data-action", "zoom-out");

        this.overlay = document.createElement("div");
        this.overlay.classList.add("zoom-overlay");
        document.body.appendChild(this.overlay);

        this.div.style.height = `${this.divSize.originalHeightMinusPadding}px`;
        this.div.style.width = `${this.divSize.originalWidthMinusPadding}px`;
        this.forceRepaint();
        var scale = this.calculateScale(this.divSize);
        this.forceRepaint();

        this.showEnhancedDiv();
        this.animate(scale);

        document.body.classList.add("zoom-overlay-open");
    }

    showEnhancedDiv () {
        this.div.style.height = `${this.divSize.newHeightMinusPadding}px`;
        this.div.style.width = `${this.divSize.originalWidthMinusPadding}px`;
        for (let i = 0; i < this.invisibles.length; i++) {
            this.invisibles[i].style.position = 'relative';
            this.invisibles[i].style.visibility = 'visible';
            this.invisibles[i].style.opacity = 1;
        }
        for (let i = 0; i < this.recedes.length; i++) {
            this.recedes[i].style.position = 'absolute';
            this.recedes[i].style.visibility = 'hidden';
            this.recedes[i].style.opacity = 0;
        }
    }

    returnToOriginalDiv () {
        this.div.style.height = `${this.divSize.originalHeightMinusPadding}px`;
        this.div.style.width = `${this.divSize.originalWidthMinusPadding}px`;
        for (let i = 0; i < this.invisibles.length; i++) {
            this.invisibles[i].removeAttribute("style");
        }
        for (let i = 0; i < this.recedes.length; i++) {
            this.recedes[i].removeAttribute("style");
        }
    }

    calculateScale(size) {
        var maxScaleFactor = 1; //size.w / this.div.clientWidth; natural / curr size

        var viewportWidth = (windowWidth() - this.offset);
        var viewportHeight = (windowHeight() - this.offset);
        var imageAspectRatio = size.originalWidth / size.newHeight;
        var viewportAspectRatio = viewportWidth / viewportHeight;

        if (size.originalWidth < viewportWidth && size.newHeight < viewportHeight) { // would be newWidth if resize width too
            return maxScaleFactor;
        } else if (imageAspectRatio < viewportAspectRatio) {
            return (viewportHeight / size.newHeight) * maxScaleFactor;
        } else {
            return (viewportWidth / size.originalWidth) * maxScaleFactor;
        }
    }

    animate(scale) {
        var elementOffset = elemOffset(this.div);
        var scrollTop = window.pageYOffset;

        var viewportX = (windowWidth() / 2);
        var viewportY = scrollTop + (windowHeight() / 2);

        var imageCenterX = elementOffset.left + (this.divSize.originalWidth / 2);
        var imageCenterY = elementOffset.top + (this.divSize.newHeight / 2);

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
        this.returnToOriginalDiv();
        this.wrap.style.transform = "none";

        once(this.div, "transitionend", () => {
            this.div.style.height = '';
            this.div.style.width = '';
            if (this.div.style.length === 0) {
                this.div.removeAttribute("style");
            }
            this.dispose();
            // XXX(nishanths): remove class should happen after dispose. Otherwise,
            // a new click event could fire and create a duplicate ZoomImage for
            // the same <div> element.
            document.body.classList.remove("zoom-overlay-open");
        });
    }
}
