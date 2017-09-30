# Canvas parallax

Simple plugin with declarative interface that render image in parallax mainer. Support responsive images and gracefully fall to default images if JS is disabled.

Support `DeviceOrientationEvent` event on mobile.

```html
<canvas data-parallax data-start="passTop" data-offset="60">
    <picture>
       <source media="(max-width: 768px)" srcset="images/image-sm.jpg">
       <source media="(max-width: 1024px)" srcset="images/image-md.jpg">
       <img src="images/image-lg.jpg" />
    </picture>
</canvas>
```

Supports: IE9+, Evergreen browsers.

Copyright © 2017, Dima Nechepurenko. Published under MIT license.
