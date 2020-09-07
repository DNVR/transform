function TransformComputer ( lib: typeof window, foreign: any, heap: ArrayBuffer ) {
  'use asm'

  var PI = lib.Math.PI

  var sin = lib.Math.sin
  var cos = lib.Math.cos
  var tan = lib.Math.tan

  var imul = lib.Math.imul
  var sqrt = lib.Math.sqrt

  var fround = lib.Math.fround

  var f32 = new lib.Float32Array( heap )
  var u32 = new lib.Uint32Array( heap )

  var result = foreign.result | 0
  var accumulator = foreign.accumulator | 0
  var store = foreign.store | 0

  var transformationStart = foreign.transformationStart | 0

  var transformationOffsetDial = foreign.transformationOffsetDial | 0
  var transformationOffsetParam = foreign.transformationOffsetParam | 0
  var transformationSize = foreign.transformationSize | 0

  var parameterStart = foreign.parameterStart | 0
  var parameterOffsetValue = foreign.parameterOffsetValue | 0
  var parameterOffsetResult = foreign.parameterOffsetResult | 0
  var parameterSize = foreign.parameterSize | 0

  var vw = 0.0
  var vh = 0.0
  var vmin = 0.0
  var vmax = 0.0

  function setViewport ( vW: number, vH: number ) {
    vW = vW | 0
    vH = vH | 0

    vw = +fround( vW | 0 )
    vh = +fround( vH | 0 )

    vmin = vw
    vmax = vw

    if ( ( vW | 0 ) < ( vH | 0 ) ) {
      vmax = vh
    }
    else {
      vmin = vh
    }
  }

  function get ( addr: number, param: number ) {
    addr = addr | 0
    param = param | 0

    return +f32[ ( ( ( parameterStart + imul( u32[ ( ( ( addr + transformationOffsetParam + param ) | 0 ) << 2 ) >> 2 ] | 0, parameterSize ) + parameterOffsetResult ) | 0 ) << 2 ) >> 2 ]
  }
  function setDial ( i: number, val: number ) {
    i = i | 0
    val = +val

    var addr = 0

    addr = ( transformationStart + imul( i, transformationSize ) ) | 0

    f32[ ( ( ( addr + transformationOffsetDial ) | 0 ) << 2 ) >> 2 ] = +val
  }

  function obtainDial ( addr: number ) {
    addr = addr | 0

    return +f32[ ( ( ( addr + transformationOffsetDial ) | 0 ) << 2 ) >> 2 ]
  }

  function matrixWrite (
    m11: number, m12: number, m13: number, m14: number,
    m21: number, m22: number, m23: number, m24: number,
    m31: number, m32: number, m33: number, m34: number,
    m41: number, m42: number, m43: number, m44: number
  ) {
    m11 = +m11
    m12 = +m12
    m13 = +m13
    m14 = +m14
    m21 = +m21
    m22 = +m22
    m23 = +m23
    m24 = +m24
    m31 = +m31
    m32 = +m32
    m33 = +m33
    m34 = +m34
    m41 = +m41
    m42 = +m42
    m43 = +m43
    m44 = +m44

    var matrix = 0

    matrix = ( store ) | 0

    f32[ ( ( ( matrix + 0x0 ) | 0 ) << 2 ) >> 2 ] = m11
    f32[ ( ( ( matrix + 0x1 ) | 0 ) << 2 ) >> 2 ] = m12
    f32[ ( ( ( matrix + 0x2 ) | 0 ) << 2 ) >> 2 ] = m13
    f32[ ( ( ( matrix + 0x3 ) | 0 ) << 2 ) >> 2 ] = m14
    f32[ ( ( ( matrix + 0x4 ) | 0 ) << 2 ) >> 2 ] = m21
    f32[ ( ( ( matrix + 0x5 ) | 0 ) << 2 ) >> 2 ] = m22
    f32[ ( ( ( matrix + 0x6 ) | 0 ) << 2 ) >> 2 ] = m23
    f32[ ( ( ( matrix + 0x7 ) | 0 ) << 2 ) >> 2 ] = m24
    f32[ ( ( ( matrix + 0x8 ) | 0 ) << 2 ) >> 2 ] = m31
    f32[ ( ( ( matrix + 0x9 ) | 0 ) << 2 ) >> 2 ] = m32
    f32[ ( ( ( matrix + 0xA ) | 0 ) << 2 ) >> 2 ] = m33
    f32[ ( ( ( matrix + 0xB ) | 0 ) << 2 ) >> 2 ] = m34
    f32[ ( ( ( matrix + 0xC ) | 0 ) << 2 ) >> 2 ] = m41
    f32[ ( ( ( matrix + 0xD ) | 0 ) << 2 ) >> 2 ] = m42
    f32[ ( ( ( matrix + 0xE ) | 0 ) << 2 ) >> 2 ] = m43
    f32[ ( ( ( matrix + 0xF ) | 0 ) << 2 ) >> 2 ] = m44
  }

  function translation (
    x: number, y: number, z: number
  ) {
    x = +x
    y = +y
    z = +z

    matrixWrite(
      1.0, 0.0, 0.0, 0.0,
      0.0, 1.0, 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      x, y, z, 1.0
    )
  }

  function translate ( i: number ) {
    i = i | 0

    var addr = 0

    var result1 = 0.0
    var result2 = 0.0

    var dial = 0.0

    addr = ( transformationStart + imul( i, transformationSize ) ) | 0
    dial = +obtainDial( addr )

    result1 = dial * +get( addr, 0 )
    result2 = dial * +get( addr, 1 )

    translation(
      result1, result2, 0.0
    )
  }
  function translate3D ( i: number ) {
    i = i | 0

    var addr = 0

    var result1 = 0.0
    var result2 = 0.0
    var result3 = 0.0

    var dial = 0.0

    addr = ( transformationStart + imul( i, transformationSize ) ) | 0
    dial = +obtainDial( addr )

    result1 = dial * +get( addr, 0 )
    result2 = dial * +get( addr, 1 )
    result3 = dial * +get( addr, 2 )

    translation(
      result1, result2, result3
    )
  }
  function translateX ( i: number ) {
    i = i | 0

    var addr = 0

    var result1 = 0.0

    var dial = 0.0

    addr = ( transformationStart + imul( i, transformationSize ) ) | 0
    dial = +obtainDial( addr )

    result1 = dial * +get( addr, 0 )

    translation(
      result1, 0.0, 0.0
    )
  }
  function translateY ( i: number ) {
    i = i | 0

    var addr = 0

    var result1 = 0.0

    var dial = 0.0

    addr = ( transformationStart + imul( i, transformationSize ) ) | 0
    dial = +obtainDial( addr )

    result1 = dial * +get( addr, 0 )

    translation(
      0.0, result1, 0.0
    )
  }
  function translateZ ( i: number ) {
    i = i | 0

    var addr = 0

    var result1 = 0.0

    var dial = 0.0

    addr = ( transformationStart + imul( i, transformationSize ) ) | 0
    dial = +obtainDial( addr )

    result1 = dial * +get( addr, 0 )

    translation(
      0.0, 0.0, result1
    )
  }


  function rotation (
    x: number, y: number, z: number, a: number
  ) {

    x = +x
    y = +y
    z = +z
    a = +a

    var s = 0.0
    var c = 0.0

    s = sin( a )
    c = cos( a )

    matrixWrite(
      1.0 + ( 1.0 - c ) * ( x * x - 1.0 ), - z * s + x * y * ( 1.0 - c ), y * s + x * z * ( 1.0 - c ), 0.0,
      z * s + x * y * ( 1.0 - c ), 1.0 + ( 1.0 - c ) * ( y * y - 1.0 ), - x * s + y * z * ( 1.0 - c ), 0.0,
      - y * s + x * z * ( 1.0 - c ), x * s + y * z * ( 1.0 - c ), 1.0 + ( 1.0 - c ) * ( z * z - 1.0 ), 0.0,
      0.0, 0.0, 0.0, 1.0
    )
  }


  function rotate3D ( i: number ) {
    i = i | 0

    var addr = 0

    var result1 = 0.0
    var result2 = 0.0
    var result3 = 0.0
    var result4 = 0.0

    var s = 0.0
    var c = 0.0

    var x = 0.0
    var y = 0.0
    var z = 0.0
    var a = 0.0

    var dial = 0.0

    var norm = 0.0

    addr = ( transformationStart + imul( i, transformationSize ) ) | 0
    dial = +obtainDial( addr )

    result1 = +get( addr, 0 )
    result2 = +get( addr, 1 )
    result3 = +get( addr, 2 )
    result4 = +get( addr, 3 )

    norm = sqrt( result1 * result1 + result2 * result2 + result3 * result3 )

    x = result1 / norm
    y = result2 / norm
    z = result3 / norm
    a = -dial * result4

    rotation(
      x, y, z, a
    )
  }
  function rotateX ( i: number ) {
    i = i | 0

    var addr = 0

    var result1 = 0.0

    var dial = 0.0

    addr = ( transformationStart + imul( i, transformationSize ) ) | 0
    dial = +obtainDial( addr )

    result1 = - dial * +get( addr, 0 )

    rotation(
      1.0, 0.0, 0.0, result1
    )
  }
  function rotateY ( i: number ) {
    i = i | 0

    var addr = 0

    var result1 = 0.0

    var dial = 0.0

    addr = ( transformationStart + imul( i, transformationSize ) ) | 0
    dial = +obtainDial( addr )

    result1 = - dial * +get( addr, 0 )

    rotation(
      0.0, 1.0, 0.0, result1
    )
  }
  function rotateZ ( i: number ) {
    i = i | 0

    var addr = 0

    var result1 = 0.0

    var dial = 0.0

    addr = ( transformationStart + imul( i, transformationSize ) ) | 0
    dial = +obtainDial( addr )

    result1 = - dial * +get( addr, 0 )

    rotation(
      0.0, 0.0, 1.0, result1
    )
  }

  function skewing (
    x: number, y: number
  ) {

    x = +x
    y = +y

    var tx = 0.0
    var ty = 0.0

    tx = tan( x )
    ty = tan( y )

    matrixWrite(
      1.0, ty, 0.0, 0.0,
      tx, 1.0, 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 0.0, 1.0
    )
  }

  function skew ( i: number ) {
    i = i | 0

    var addr = 0

    var result1 = 0.0
    var result2 = 0.0

    var dial = 0.0

    addr = ( transformationStart + imul( i, transformationSize ) ) | 0
    dial = +obtainDial( addr )

    result1 = +( dial * +get( addr, 0 ) )
    result2 = +( dial * +get( addr, 1 ) )

    skewing(
      result1, result2
    )
  }
  function skewX ( i: number ) {
    i = i | 0

    var addr = 0

    var result1 = 0.0

    var dial = 0.0

    addr = ( transformationStart + imul( i, transformationSize ) ) | 0
    dial = +obtainDial( addr )

    result1 = +( dial * +get( addr, 0 ) )

    skewing(
      result1, 0.0
    )
  }
  function skewY ( i: number ) {
    i = i | 0

    var addr = 0

    var result1 = 0.0

    var dial = 0.0

    addr = ( transformationStart + imul( i, transformationSize ) ) | 0
    dial = +obtainDial( addr )

    result1 = +( dial * +get( addr, 0 ) )

    skewing(
      0.0, result1
    )
  }

  function scaling (
    x: number, y: number, z: number
  ) {

    x = +x
    y = +y
    z = +z

    matrixWrite(
      x, 0.0, 0.0, 0.0,
      0.0, y, 0.0, 0.0,
      0.0, 0.0, z, 0.0,
      0.0, 0.0, 0.0, 1.0
    )
  }


  function scale ( i: number ) {
    i = i | 0

    var addr = 0

    var result1 = 0.0
    var result2 = 0.0

    var dial = 0.0

    addr = ( transformationStart + imul( i, transformationSize ) ) | 0
    dial = +obtainDial( addr )

    result1 = 1.0 + dial * ( +get( addr, 0 ) - 1.0 )
    result2 = 1.0 + dial * ( +get( addr, 1 ) - 1.0 )

    scaling(
      result1, result2, 1.0
    )
  }
  function scaleX ( i: number ) {
    i = i | 0

    var addr = 0

    var result1 = 0.0

    var dial = 0.0

    addr = ( transformationStart + imul( i, transformationSize ) ) | 0
    dial = +obtainDial( addr )

    result1 = 1.0 + dial * ( +get( addr, 0 ) - 1.0 )

    scaling(
      result1, 1.0, 1.0
    )
  }
  function scaleY ( i: number ) {
    i = i | 0

    var addr = 0

    var result1 = 0.0

    var dial = 0.0

    addr = ( transformationStart + imul( i, transformationSize ) ) | 0
    dial = +obtainDial( addr )

    result1 = 1.0 + dial * ( +get( addr, 0 ) - 1.0 )

    scaling(
      1.0, result1, 1.0
    )
  }
  function scaleZ ( i: number ) {
    i = i | 0

    var addr = 0

    var result1 = 0.0

    var dial = 0.0

    addr = ( transformationStart + imul( i, transformationSize ) ) | 0
    dial = +obtainDial( addr )

    result1 = 1.0 + dial * ( +get( addr, 0 ) - 1.0 )

    scaling(
      1.0, 1.0, result1
    )
  }

  function scale3D ( i: number ) {
    i = i | 0

    var addr = 0

    var result1 = 0.0
    var result2 = 0.0
    var result3 = 0.0

    var dial = 0.0

    addr = ( transformationStart + imul( i, transformationSize ) ) | 0
    dial = +obtainDial( addr )

    result1 = 1.0 + dial * ( +get( addr, 0 ) - 1.0 )
    result2 = 1.0 + dial * ( +get( addr, 1 ) - 1.0 )
    result3 = 1.0 + dial * ( +get( addr, 2 ) - 1.0 )

    scaling(
      result1, result2, result3
    )
  }


  function pixel2pixel ( i: number ) {
    i = i | 0

    var addr = 0

    addr = ( parameterStart + imul( i, parameterSize ) ) | 0

    f32[ ( ( addr + parameterOffsetResult ) << 2 ) >> 2 ] = + f32[ ( ( addr + parameterOffsetValue ) << 2 ) >> 2 ]
  }
  function inch2pixel ( i: number ) {
    i = i | 0

    var addr = 0

    addr = ( parameterStart + imul( i, parameterSize ) ) | 0

    f32[ ( ( addr + parameterOffsetResult ) << 2 ) >> 2 ] = + f32[ ( ( addr + parameterOffsetValue ) << 2 ) >> 2 ] * 96.0
  }
  function pica2pixel ( i: number ) {
    i = i | 0

    var addr = 0

    addr = ( parameterStart + imul( i, parameterSize ) ) | 0

    f32[ ( ( addr + parameterOffsetResult ) << 2 ) >> 2 ] = + f32[ ( ( addr + parameterOffsetValue ) << 2 ) >> 2 ] * 16.0
  }
  function point2pixel ( i: number ) {
    i = i | 0

    var addr = 0

    addr = ( parameterStart + imul( i, parameterSize ) ) | 0

    f32[ ( ( addr + parameterOffsetResult ) << 2 ) >> 2 ] = + f32[ ( ( addr + parameterOffsetValue ) << 2 ) >> 2 ] * 4.0 / 3.0
  }
  function centimetre2pixel ( i: number ) {
    i = i | 0

    var addr = 0

    addr = ( parameterStart + imul( i, parameterSize ) ) | 0

    f32[ ( ( addr + parameterOffsetResult ) << 2 ) >> 2 ] = + f32[ ( ( addr + parameterOffsetValue ) << 2 ) >> 2 ] * 96.0 / 2.54
  }
  function millimetre2pixel ( i: number ) {
    i = i | 0

    var addr = 0

    addr = ( parameterStart + imul( i, parameterSize ) ) | 0

    f32[ ( ( addr + parameterOffsetResult ) << 2 ) >> 2 ] = + f32[ ( ( addr + parameterOffsetValue ) << 2 ) >> 2 ] * 96.0 / 25.4
  }
  function quarter2pixel ( i: number ) {
    i = i | 0

    var addr = 0

    addr = ( parameterStart + imul( i, parameterSize ) ) | 0

    f32[ ( ( addr + parameterOffsetResult ) << 2 ) >> 2 ] = + f32[ ( ( addr + parameterOffsetValue ) << 2 ) >> 2 ] * 96.0 / 101.6
  }
  function viewportWidth2pixel ( i: number ) {
    i = i | 0

    var addr = 0

    addr = ( parameterStart + imul( i, parameterSize ) ) | 0

    f32[ ( ( addr + parameterOffsetResult ) << 2 ) >> 2 ] = + f32[ ( ( addr + parameterOffsetValue ) << 2 ) >> 2 ] * +vw / 100.0
  }
  function viewportHeight2pixel ( i: number ) {
    i = i | 0

    var addr = 0

    addr = ( parameterStart + imul( i, parameterSize ) ) | 0

    f32[ ( ( addr + parameterOffsetResult ) << 2 ) >> 2 ] = + f32[ ( ( addr + parameterOffsetValue ) << 2 ) >> 2 ] * +vh / 100.0
  }
  function viewportMinimum2pixel ( i: number ) {
    i = i | 0

    var addr = 0

    addr = ( parameterStart + imul( i, parameterSize ) ) | 0

    f32[ ( ( addr + parameterOffsetResult ) << 2 ) >> 2 ] = + f32[ ( ( addr + parameterOffsetValue ) << 2 ) >> 2 ] * +vmin / 100.0
  }
  function viewportMaximum2pixel ( i: number ) {
    i = i | 0

    var addr = 0

    addr = ( parameterStart + imul( i, parameterSize ) ) | 0

    f32[ ( ( addr + parameterOffsetResult ) << 2 ) >> 2 ] = + f32[ ( ( addr + parameterOffsetValue ) << 2 ) >> 2 ] * +vmax / 100.0
  }

  function radian2radian ( i: number ) {
    i = i | 0

    var addr = 0

    addr = ( parameterStart + imul( i, parameterSize ) ) | 0

    f32[ ( ( addr + parameterOffsetResult ) << 2 ) >> 2 ] = + f32[ ( ( addr + parameterOffsetValue ) << 2 ) >> 2 ]
  }
  function degree2radian ( i: number ) {
    i = i | 0

    var addr = 0

    addr = ( parameterStart + imul( i, parameterSize ) ) | 0

    f32[ ( ( addr + parameterOffsetResult ) << 2 ) >> 2 ] = + f32[ ( ( addr + parameterOffsetValue ) << 2 ) >> 2 ] * PI / 180.0
  }
  function gradient2radian ( i: number ) {
    i = i | 0

    var addr = 0

    addr = ( parameterStart + imul( i, parameterSize ) ) | 0

    f32[ ( ( addr + parameterOffsetResult ) << 2 ) >> 2 ] = + f32[ ( ( addr + parameterOffsetValue ) << 2 ) >> 2 ] * PI / 200.0
  }
  function turn2radian ( i: number ) {
    i = i | 0

    var addr = 0

    addr = ( parameterStart + imul( i, parameterSize ) ) | 0

    f32[ ( ( addr + parameterOffsetResult ) << 2 ) >> 2 ] = + f32[ ( ( addr + parameterOffsetValue ) << 2 ) >> 2 ] * PI * 2.0
  }

  function number2number ( i: number ) {
    i = i | 0

    var addr = 0

    addr = ( parameterStart + imul( i, parameterSize ) ) | 0

    f32[ ( ( addr + parameterOffsetResult ) << 2 ) >> 2 ] = + f32[ ( ( addr + parameterOffsetValue ) << 2 ) >> 2 ]
  }

  function reset () {
    var p = 0
    var q = 0

    while ( ( p | 0 ) < ( 4 << 2 ) ) {
      if ( ( p | 0 ) == ( q | 0 ) ) {
        f32[ ( ( ( accumulator << 2 ) + 4 * ( p | 0 ) + ( q | 0 ) ) | 0 ) >> 2 ] = 1.0
      }
      else {
        f32[ ( ( ( accumulator << 2 ) + 4 * ( p | 0 ) + ( q | 0 ) ) | 0 ) >> 2 ] = 0.0
      }

      q = ( ( q | 0 ) + ( 1 << 2 ) ) | 0
      if ( ( q | 0 ) < ( 4 << 2 ) ) continue

      q = 0 << 2

      p = ( ( p | 0 ) + ( 1 << 2 ) ) | 0
    }
  }

  function accumulate () {
    var p = 0

    while ( ( p | 0 ) < ( 0x10 << 2 ) ) {
      f32[ ( ( ( accumulator << 2 ) + ( p | 0 ) ) | 0 ) >> 2 ] = +f32[ ( ( ( result << 2 ) + ( p | 0 ) ) | 0 ) >> 2 ]

      p = ( ( p | 0 ) + ( 1 << 2 ) ) | 0
    }
  }

  function product () {
    var p = 0
    var q = 0
    var r = 0

    var sum = 0.0

    var matrix = 0

    matrix = store | 0

    while ( ( p | 0 ) < ( 4 << 2 ) ) {
      sum = +sum + +f32[ ( ( ( matrix << 2 ) + 4 * ( p | 0 ) + ( r | 0 ) ) | 0 ) >> 2 ] * +f32[ ( ( ( accumulator << 2 ) + 4 * ( r | 0 ) + ( q | 0 ) ) | 0 ) >> 2 ]

      r = ( ( r | 0 ) + ( 1 << 2 ) ) | 0
      if ( ( r | 0 ) < ( 4 << 2 ) ) continue

      r = 0 << 2

      f32[ ( ( ( result << 2 ) + 4 * ( p | 0 ) + ( q | 0 ) ) | 0 ) >> 2 ] = +sum
      sum = 0.0

      q = ( ( q | 0 ) + ( 1 << 2 ) ) | 0
      if ( ( q | 0 ) < ( 4 << 2 ) ) continue

      q = 0 << 2

      p = ( ( p | 0 ) + ( 1 << 2 ) ) | 0
    }

    accumulate()
  }

  function start (
    s: number
  ) {
    s = s | 0

    parameterStart = s | 0
  }

  return {
    setViewport: setViewport,

    setDial: setDial,

    start: start,

    translate: translate,
    translate3D: translate3D,
    translateX: translateX,
    translateY: translateY,
    translateZ: translateZ,

    rotate3D: rotate3D,
    rotateX: rotateX,
    rotateY: rotateY,
    rotateZ: rotateZ,

    skew: skew,
    skewX: skewX,
    skewY: skewY,

    scale: scale,
    scale3D: scale3D,
    scaleX: scaleX,
    scaleY: scaleY,
    scaleZ: scaleZ,

    n2n: number2number,

    px2px: pixel2pixel,
    in2px: inch2pixel,
    pc2px: pica2pixel,
    pt2px: point2pixel,
    cm2px: centimetre2pixel,
    mm2px: millimetre2pixel,
    Q2px: quarter2pixel,
    vw2px: viewportWidth2pixel,
    vh2px: viewportHeight2pixel,
    vmin2px: viewportMinimum2pixel,
    vmax2px: viewportMaximum2pixel,

    rad2rad: radian2radian,
    deg2rad: degree2radian,
    grad2rad: gradient2radian,
    turn2rad: turn2radian,

    product: product,
    reset: reset
  }
}

export default TransformComputer