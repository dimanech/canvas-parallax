'use strict';

/**
 * jQuery Canvas Paralax v0.1 (alfa)
 * Copyright © 2017, Dima Nechepurenko <dimanechepurenko@gmail.com>
 * Published under MIT license.
 */

/**
 * Parallax
 *
 * @type {jQuery}
 * @param {int} data-speed - aspect of the motion. Valid only for start: top
 * @param {string} data-start - from where start to render motion. Values: [document|top|bottom]. Default: bottom
 * @param {int} data-offset - max offset that picture has. Default: 40
 * @example
 * <canvas data-parallax data-start="top" data-offset="20">
 *    <picture>
 *       <source media="(max-width: 768px)" srcset="images/homepage/hp-carousel-slide-1-sm.jpg">
 *       <img src="images/homepage/hp-carousel-slide-1-lg.jpg" />
 *    </picture>
 * </canvas>
 */

var $ = require('jquery');

var instances = [];

/**
 * Creates new Parallax object
 * @constructor
 *
 * @param {object} params - parameters object
 * @param {object} params.instance - DOM node. `canvas` is expected
 * @param {string} params.src - image src URI string
 * @param {int} params.top - position from the top of the instance
 * @param {int} params.start - start point depending on options
 * @param {function} params.localScroll - scroll logic
 * @param {object} options - options object
 * @param {string} options.start - start option of the parallax
 * @param {int} options.offset - padding of the image on what it would be scrolled
 * @param {int} options.speed - delay of scroll. Valid only for start 'document' and 'top'
 */
var Parallax = function (params, options) {
    this.options = options;
    this.canvas = params.instance[0];
    this.src = params.src;
    this.top = params.top;
    this.beta = 0;
    this.gamma = 0;
    this.start = params.start;
    this.localScroll = params.localScroll;
    this.latestKnownScroll = 0;
    this.context = this.canvas.getContext('2d');
    this.loadImage();
    this.attachEventHandlers();

    return this;
};

/**
 * @function
 * @description normalize getting current scroll top coordinates
 */
Parallax.prototype.getDocumentScroll = function () {
    return (document.documentElement && document.documentElement.scrollTop) ||
        document.body.scrollTop;
};

/**
 * @function
 * @description load image from <picture> srcset or src
 */
Parallax.prototype.loadImage = function () {
    this.image = new Image();
    var self = this;
    this.image.addEventListener('load', function () {
        self.initCanvasSize();
        self.isImageLoaded = true;
        self.render(self.getDocumentScroll());
    }, false);
    this.image.src = this.src;
};

/**
 * @function
 * @description set sizes of loaded image on canvas element
 */
Parallax.prototype.initCanvasSize = function () {
    this.canvas.width = this.image.width - this.options.offset;
    this.canvas.height = this.image.height - this.options.offset;
};

/**
 * @function
 * @description render image on canvas according to scroll position and config
 * @param {int} scrollTop - scrolled position
 */
Parallax.prototype.render = function (scrollTop) {
    var offset = this.options.offset;

    var localScroll = this.localScroll(scrollTop);
    var y = Math.round(localScroll) - offset;

    var beta = this.beta > offset ? offset : this.beta;
    var gamma = this.gamma > offset ? offset : this.gamma;

    this.context.clearRect(0, 0, this.image.width, this.image.height);
    this.context.drawImage(this.image, beta - offset, y - gamma);
};

/**
 * @function
 * @description check if we need to call render() for particular instance onscroll event
 * @param {int} scrollTop - scrolled position
 */
Parallax.prototype.onScroll = function (scrollTop) {
    if (!this.isImageLoaded && scrollTop > this.top + this.image.height) {
        return false;
    }

    if (scrollTop >= this.start) {
        this.render(scrollTop);
    }
};

/**
 * @function
 * @description render image and update props depending on device orientation
 * @param {object} event - device orientation event object
 */
Parallax.prototype.onDeviceOrientationChange = function (event) {
    this.beta = Math.round(event.beta / 6);
    this.gamma = Math.round(event.gamma / 6);
    this.render(this.getDocumentScroll());
};

/**
 * @function
 * @description update instance parameters on screen size changes
 * @param {int} windowHeight - window height
 */
Parallax.prototype.onScreenChange = function (windowHeight) {
    var $canvas = $(this.canvas);
    var imageSrc = $canvas.find('img')[0];
    var canvasTop = $canvas.offset().top;

    this.top = canvasTop;
    this.start = canvasTop - windowHeight;
    this.src = imageSrc.currentSrc || imageSrc.src;

    this.loadImage();
};

/**
 * @function
 * @description recursive rendering. Used to fix scroll events delay on iOS
 */
Parallax.prototype.scrollPositionInfinitePoll = function () {
    var scrollTop = this.getDocumentScroll();

    if (scrollTop !== this.latestKnownScroll) {
        this.latestKnownScroll = scrollTop;
        this.onScroll(scrollTop);
    }

    window.requestAnimationFrame(this.scrollPositionInfinitePoll.bind(this));
};

/**
 * @function
 * @description attach event handlers for each instance
 */
Parallax.prototype.attachEventHandlers = function () {
    var self = this;

    if (navigator.userAgent.match('iPhone') || navigator.userAgent.match('iPad')) {
        this.scrollPositionInfinitePoll();
    } else {
        window.addEventListener('scroll', this.onScroll.bind(this));
        window.addEventListener('touchstart', this.onScroll.bind(this));
    }

    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', this.onDeviceOrientationChange.bind(this), true);
    }

    window.addEventListener('orientationchange resize', function () {
        var windowHeight = window.innerHeight;

        self.onScreenChange(windowHeight);
    });
};

$.fn.parallax = function () {
    var windowHeight = window.innerHeight;

    // Prepare each instance configuration
    $(this).each(function () {
        var instance = $(this);
        var options = {
            speed: instance.attr('data-speed') || 5,
            offset: instance.attr('data-offset') || 40,
            start: instance.attr('data-start') || 'bottom'
        };
        var top = instance.offset().top;
        var image = instance.find('img')[0];
        var start = 0;
        var localScroll = function (scrollTop) {
            return ((scrollTop - start) / options.speed);
        };

        switch (options.start) {
            case 'document':
                break;
            case 'bottom':
                start = top - windowHeight;
                localScroll = function (scrollTop) {
                    return (scrollTop - start) / (windowHeight / options.offset);
                };
                break;
            case 'top':
                start = top;
                break;
        }

        $(image).one('load', function () {
            var params = {
                instance: instance,
                src: image.currentSrc || image.src,
                top: top,
                start: start,
                localScroll: localScroll
            };

            instances.push(new Parallax(params, options));
        }).each(function () {
            if (this.complete) {
                $(this).load();
            }
        });
    });

    return this;
};

/*
 * Initialize DOM
 */
function initializeDOM() {
    $('canvas[data-parallax]').canvas.parallax();
}

module.exports = {
    init: function () {
        initializeDOM();
    }
};
