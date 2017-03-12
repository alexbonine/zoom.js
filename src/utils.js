var windowWidth = () => document.documentElement.clientWidth;
var windowHeight = () => document.documentElement.clientHeight;

/* Added transitioning height for div that has invisible height/width. rect was
 * getting the original size and not taking into account the new invisibles divs. */
var elemOffset = (elem, transitioningHeight = 0, transitioningWidth = 0) => {
    var rect = elem.getBoundingClientRect();
    var docElem = document.documentElement;
    var win = window;
    return {
        top: rect.top + win.pageYOffset - docElem.clientTop - transitioningHeight,
        left: rect.left + win.pageXOffset - docElem.clientLeft - transitioningWidth
    };
};

var once = (elem, type, handler) => {
    var fn = e => {
        e.target.removeEventListener(type, fn);
        handler();
    };
    elem.addEventListener(type, fn);
};

export { windowWidth, windowHeight, elemOffset, once };
