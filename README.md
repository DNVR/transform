# Transform

A CSS Transform library.

Greater things to come...

## Install
```
npm install @dnvr/transform
```

## How it works

Transform provides a way to write CSS compute CSS Transform Matrices using JavaScript / TypeScript.

This includes chainable methods for all CSS Transform functions except of course `matrix` and `matrix3d`.

Methods that take length parameters such as `translateX`, `translateY`, `translateZ`, `translate` and `translate3d` and `perspective` take the same number of parameters as their CSS counterpart, with the numbers being in the `px` unit.

Methods dealing with angles `rotate`, `rotateX`, `rotateY`, `rotateZ`, `rotate3d`, `skew`, `skewX`, and `skewY` use `deg`ree as their unit, while similar methods with the `Rad` infix use `rad`ians.

Plain numbers work as is in methods such as `scale`, `scale3d`, `scaleX`, `scaleY`, `scaleZ` and `rotate3d`.

The final property string can be obtained using the `css` method.

The library also provides `alterDial`, a method that allows an effect similar to ScrollTimeline.

## Note

The import is called `dirtyTransform` as it is a quick and dirty implementation of DOMMatrix. There is a roadmap to improve the library and I'd like to reserve the term `transform` when it's implemented. This is also why `dirtyTransform` is not a default import.

## Usage
```TS
import {

  dirtyTransform

} from '@dnvr/transform'

let el = document.querySelector( 'element-of-interest' )

// The following will displace the element rightward by 100px
el.style.transform = dirtyTransform().translateX( 100 ).css()

// The following will displace the element downward by 50px
// Note the absence of the .css() method when placed within a template string
el.style.transform = `${ dirtyTransform( 0.5 ).translateY( 50 ) }`

// The following will rotate the element clockwise by a quarter turn which is a composition of a half turn clockwise and a quarter ( a half of a half ) turn counter-clockwise
// Note the chaining of methods
el.style.transform = dirtyTransform().rotate( 180 ).alterDial( 0.5 ).rotate( -180 ).css()
```

