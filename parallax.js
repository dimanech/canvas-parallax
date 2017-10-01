'use strict';

/**
 * Canvas Parallax
 * Copyright © 2017, Dima Nechepurenko <dimanechepurenko@gmail.com>
 * Published under MIT license.
 *
 * @param {int} data-speed - aspect of the motion. Valid only for start: top
 * @param {string} data-start - from where start to render motion. Values: [document|passTop|passBottom]. Default: bottom
 * @param {int} data-offset - max offset that picture has. Default: 60
 * @example
 * <canvas data-parallax data-start="passTop" data-offset="60">
 *    <picture>
 *       <source media="(max-width: 768px)" srcset="images/img-sm.jpg" />
 *       <img src="images/img-lg.jpg" />
 *    </picture>
 * </canvas>
 */
class CanvasParallax {
	/**
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
	 * @param {int} options.speed - delay of scroll. Valid only for start 'document' and 'passTop'
	 */
	constructor(params, options) {
		this.options = options;
		this.canvas = params.instance;
		this.src = params.src;
		this.top = params.top;
		this.beta = 0;
		this.gamma = 0;
		this.start = this.top - window.innerHeight;
		this.localScroll = params.localScroll;
		this.latestKnownScroll = 0;
		this.isImageLoaded = false;
		this.isPainting = false;
		this.context = this.canvas.getContext('2d');
		this.loadImage();
		this.attachEventHandlers();
	}

	static getDocumentScroll() {
		return (document.documentElement && document.documentElement.scrollTop) ||
			document.body.scrollTop;
	};

	loadImage() {
		this.image = new Image();
		this.image.addEventListener('load', () => {
			this.initCanvasSize();
			this.isImageLoaded = true;
			this.render(CanvasParallax.getDocumentScroll());
		});
		this.image.src = this.src;
	};

	initCanvasSize() {
		this.canvas.width = this.image.width - (this.options.offset);
		this.canvas.height = this.image.height - (this.options.offset);
	};

	outerToInnerScroll(scrollTop) {
		const offset = this.options.offset;
		const localScroll = scrollTop - this.start;
		const position = localScroll / (window.innerHeight / offset);
		return position - offset;
	}

	render(scrollTop) {
		const offset = this.options.offset;

		const y = Math.round(this.outerToInnerScroll(scrollTop));
		const beta = this.beta > offset ? offset : this.beta;
		const gamma = this.gamma > offset ? offset : this.gamma;

		if (y > offset) {
			return false;
		}

		this.context.drawImage(this.image, beta - offset, y - gamma);
		this.isPainting = false;
	};

	onScroll() {
		const scrollTop = CanvasParallax.getDocumentScroll();
		const isImageOutOfView = scrollTop > this.top + this.image.height;
		const shouldStart = scrollTop >= this.start;

		if (this.latestKnownScroll === scrollTop ||
			this.isPainting ||
			isImageOutOfView ||
			!shouldStart ||
			!this.isImageLoaded
			) {
			return false;
		}

		this.latestKnownScroll = scrollTop;
		this.isPainting = true;
		this.render(scrollTop);
	};

	onDeviceOrientationChange(event) {
		this.beta = Math.round(event.beta / 6);
		this.gamma = Math.round(event.gamma / 6);
		this.render(CanvasParallax.getDocumentScroll());
	};

	onScreenChange() {
		const canvas = this.canvas;
		const imageSrc = canvas.querySelectorAll('img')[0];
		const canvasTop = canvas.getBoundingClientRect().top + CanvasParallax.getDocumentScroll();

		this.top = canvasTop;
		this.start = canvasTop - window.innerHeight;
		this.src = imageSrc.currentSrc || imageSrc.src;

		this.loadImage();
	};

	attachEventHandlers() {
		window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
		window.addEventListener('touchstart', this.onScroll.bind(this), { passive: true });

		if (window.DeviceOrientationEvent) {
			window.addEventListener('deviceorientation', this.onDeviceOrientationChange.bind(this));
		}

		window.addEventListener('orientationchange', this.onScreenChange.bind(this));
		window.addEventListener('resize', this.onScreenChange.bind(this));
	};
}

class CanvasParallaxDocument extends CanvasParallax {
	outerToInnerScroll(scrollTop) {
		return (scrollTop / this.options.speed);
	}
}

class CanvasParallaxTop extends CanvasParallax {
	constructor(params, options) {
		super(params, options);
		this.start = this.top;
	}

	onScreenChange() {
		const canvas = this.canvas;
		const imageSrc = canvas.querySelectorAll('img')[0];

		this.top = canvas.getBoundingClientRect().top + CanvasParallax.getDocumentScroll();
		this.start = this.top;
		this.src = imageSrc.currentSrc || imageSrc.src;

		this.loadImage();
	};

	outerToInnerScroll(scrollTop) {
		return ((scrollTop - this.start) / this.options.speed);
	}
}

document.querySelectorAll('canvas[data-parallax]').forEach(function (inst) {
	const instance = inst;
	const image = instance.querySelectorAll('img')[0];

	function createInstance() {
		const params = {
			instance: instance,
			src: image.currentSrc || image.src,
			top: instance.getBoundingClientRect().top + CanvasParallax.getDocumentScroll()
		};

		const options = {
			speed: instance.getAttribute('data-speed') || 5,
			offset: instance.getAttribute('data-offset') || 60,
			start: instance.getAttribute('data-start') || 'passBottom'
		};

		switch (options.start) {
			case 'document':
				new CanvasParallaxDocument(params, options);
				break;
			case 'passBottom':
				new CanvasParallax(params, options);
				break;
			case 'passTop':
				new CanvasParallaxTop(params, options);
				break;
		}
	}

	// We need to wait until image is loaded because we don't have right src-set
	// in other case.
	if (image.complete) {
		// If image returns from cache
		createInstance(instance);
	} else {
		// Remove listener after done
		image.addEventListener('load', createInstance());
		image.removeEventListener('load', createInstance());
	}
});
