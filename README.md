# Canvas parallax (0.1 alfa)

Simple plugin with declarative interface that render image in parallax mainer. Support responsive images and gracefully fall to default images if JS is disabled.

Just import this module and add this structure with `data`-attributes and alternative image sources.

```html
<canvas data-parallax data-start="top" data-offset="20">
    <picture>
       <source media="(max-width: 768px)" srcset="images/homepage/hp-slide-1-sm.jpg">
       <source media="(max-width: 1024px)" srcset="images/homepage/hp-slide-1-md.jpg">
       <img src="images/homepage/hp-slide-1-lg.jpg" />
    </picture>
</canvas>
```

This plugin use gyroscope to render image depending of device angle that add additional effect of perspective. 

Supports: IE9+, Evergreen browsers.

Copyright © 2017, Dima Nechepurenko. Published under MIT license.
