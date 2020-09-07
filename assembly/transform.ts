let vw: f32 = 0
let vh: f32 = 0
let vmin: f32 = 0
let vmax: f32 = 0

let PI: f32 = f32( Math.PI )

let addrResult: u32 = 0x1000
let addrAccumulator: u32 = 0x1010
let addrStore: u32 = 0x1020

let transformationStart: u32 = 0x1030
let transformationOffsetDial: u32 = 0x02
let transformationOffsetParam: u32 = 0x04
let transformationSize: u32 = 0x08

let parameterStart: u32 = 0x80000
let parameterOffsetValue: u32 = 0x00
let parameterOffsetResult: u32 = 0x01
let parameterSize: u32 = 0x02

function getU32 ( i: u32 ): u32 {
  return load<u32>( i << 2 )
}

function getF32 ( i: u32 ): f32 {
  return load<f32>( i << 2 )
}

function setU32 ( i: u32, val: u32 ): void {
  store<u32>( i << 2, val )
}

function setF32 ( i: u32, val: f32 ): void {
  store<f32>( i << 2, val )
}

function accumulate (): void {
  let addr: u32

  for ( addr = 0; addr < 0x10; addr++ ) {
    setF32( addrAccumulator + addr, getF32( addrResult + addr ) )
  }
}

function setViewport ( vW: u32, vH: u32 ): void {
  vw = f32( vW / 100 )
  vh = f32( vH / 100 )

  vmin = vw
  vmax = vw

  if ( vW < vH ) {
    vmax = vh
  }
  else {
    vmin = vh
  }
}

function getParam ( addr: u32, param: u32 ): f32 {
  return getF32( parameterStart + getU32( addr + transformationOffsetParam + param ) * parameterSize + parameterOffsetResult )
}

function matrixWrite (
  m11: f32, m12: f32, m13: f32, m14: f32,
  m21: f32, m22: f32, m23: f32, m24: f32,
  m31: f32, m32: f32, m33: f32, m34: f32,
  m41: f32, m42: f32, m43: f32, m44: f32
): void {
  let matrix: u32 = addrStore

  setF32( matrix++, m11 )
  setF32( matrix++, m12 )
  setF32( matrix++, m13 )
  setF32( matrix++, m14 )
  setF32( matrix++, m21 )
  setF32( matrix++, m22 )
  setF32( matrix++, m23 )
  setF32( matrix++, m24 )
  setF32( matrix++, m31 )
  setF32( matrix++, m32 )
  setF32( matrix++, m33 )
  setF32( matrix++, m34 )
  setF32( matrix++, m41 )
  setF32( matrix++, m42 )
  setF32( matrix++, m43 )
  setF32( matrix++, m44 )
}

function setDial ( i: u32, val: f32 ): void {
  setF32( transformationStart + i * transformationSize + transformationOffsetDial, val )
}

function obtainDial ( addr: u32 ): f32 {
  return getF32( addr + transformationOffsetDial )
}

function translation (
  x: f32, y: f32, z: f32
): void {
  matrixWrite(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1
  )
}

function translate ( i: u32 ): void {
  let addr: u32 = transformationStart + i * transformationSize
  let dial: f32 = obtainDial( addr )

  let x: f32 = dial * getParam( addr, 0x0 )
  let y: f32 = dial * getParam( addr, 0x1 )

  translation(
    x, y, 0
  )
}

function translate3D ( i: u32 ): void {
  let addr: u32 = transformationStart + i * transformationSize
  let dial: f32 = obtainDial( addr )

  let x: f32 = dial * getParam( addr, 0x0 )
  let y: f32 = dial * getParam( addr, 0x1 )
  let z: f32 = dial * getParam( addr, 0x2 )

  translation(
    x, y, z
  )
}

function translateX ( i: u32 ): void {
  let addr: u32 = transformationStart + i * transformationSize
  let dial: f32 = obtainDial( addr )

  let x: f32 = dial * getParam( addr, 0x0 )

  translation(
    x, 0, 0
  )
}

function translateY ( i: u32 ): void {
  let addr: u32 = transformationStart + i * transformationSize
  let dial: f32 = obtainDial( addr )

  let y: f32 = dial * getParam( addr, 0x0 )

  translation(
    0, y, 0
  )
}

function translateZ ( i: u32 ): void {
  let addr: u32 = transformationStart + i * transformationSize
  let dial: f32 = obtainDial( addr )

  let z: f32 = dial * getParam( addr, 0x0 )

  translation(
    0, 0, z
  )
}

function rotation (
  x: f32, y: f32, z: f32, a: f32
): void {
  let s = f32( Math.sin( a ) )
  let c = f32( Math.cos( a ) )

  matrixWrite(
    1 + ( 1 - c ) * ( x * x - 1 ),    - z * s + x * y * ( 1 - c ),      y * s + x * z * ( 1 - c ), 0,
        z * s + x * y * ( 1 - c ),  1 + ( 1 - c ) * ( y * y - 1 ),    - x * s + y * z * ( 1 - c ), 0,
      - y * s + x * z * ( 1 - c ),      x * s + y * z * ( 1 - c ),  1 + ( 1 - c ) * ( z * z - 1 ), 0,
                                0,                              0,                              0, 1
  )
}

function rotate3D ( i: u32 ): void {
  var addr: u32 = transformationStart + i * transformationSize
  let dial: f32 = obtainDial( addr )

  let x: f32 = getParam( addr, 0x0 )
  let y: f32 = getParam( addr, 0x1 )
  let z: f32 = getParam( addr, 0x2 )
  let a: f32 = getParam( addr, 0x3 ) * ( - dial )

  let norm = f32( Math.hypot( Math.hypot( x, y ), z ) )

  x = x / norm
  y = y / norm
  z = z / norm

  rotation(
    x, y, z, a
  )
}

function rotateX ( i: u32 ): void {
  var addr: u32 = transformationStart + i * transformationSize
  let dial: f32 = obtainDial( addr )

  let a: f32 = getParam( addr, 0x0 ) * ( - dial )

  rotation(
    1, 0, 0, a
  )
}

function rotateY ( i: u32 ): void {
  var addr: u32 = transformationStart + i * transformationSize
  let dial: f32 = obtainDial( addr )

  let a: f32 = getParam( addr, 0x0 ) * ( - dial )

  rotation(
    0, 1, 0, a
  )
}

function rotateZ ( i: u32 ): void {
  var addr: u32 = transformationStart + i * transformationSize
  let dial: f32 = obtainDial( addr )

  let a: f32 = getParam( addr, 0x0 ) * ( - dial )

  rotation(
    0, 0, 1, a
  )
}

function skewing (
  tx: f32, ty: f32
): void {
  matrixWrite(
    1, ty, 0, 0,
    tx, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  )
}

function skew ( i: u32 ): void {
  var addr: u32 = transformationStart + i * transformationSize
  let dial: f32 = obtainDial( addr )

  let x: f32 = getParam( addr, 0x0 ) * dial
  let y: f32 = getParam( addr, 0x1 ) * dial

  let tx = f32( Math.tan( x ) )
  let ty = f32( Math.tan( y ) )

  skewing(
    tx, ty
  )
}

function skewX ( i: u32 ): void {
  var addr: u32 = transformationStart + i * transformationSize
  let dial: f32 = obtainDial( addr )

  let result1: f32 = getParam( addr, 0x0 ) * dial

  let tx = f32( Math.tan( result1 ) )

  skewing(
    tx, 0
  )
}

function skewY ( i: u32 ): void {
  var addr: u32 = transformationStart + i * transformationSize
  let dial: f32 = obtainDial( addr )

  let result1: f32 = getParam( addr, 0x0 ) * dial

  let ty = f32( Math.tan( result1 ) )

  skewing(
    0, ty
  )
}

function scaling (
  x: f32, y: f32, z: f32
): void {
  matrixWrite(
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, z, 0,
    0, 0, 0, 1
  )
}

function scale ( i: u32 ): void {
  let addr: u32 = transformationStart + i * transformationSize
  let dial: f32 = obtainDial( addr )

  let x: f32 = 1 + ( getParam( addr, 0x0 ) - 1 ) * dial
  let y: f32 = 1 + ( getParam( addr, 0x1 ) - 1 ) * dial

  scaling(
    x, y, 1
  )
}

function scale3D ( i: u32 ): void {
  let addr: u32 = transformationStart + i * transformationSize
  let dial: f32 = obtainDial( addr )

  let x: f32 = 1 + ( getParam( addr, 0x0 ) - 1 ) * dial
  let y: f32 = 1 + ( getParam( addr, 0x1 ) - 1 ) * dial
  let z: f32 = 1 + ( getParam( addr, 0x2 ) - 1 ) * dial

  scaling(
    x, y, z
  )
}

function scaleX ( i: u32 ): void {
  let addr: u32 = transformationStart + i * transformationSize
  let dial: f32 = obtainDial( addr )

  let x: f32 = 1 + ( getParam( addr, 0x0 ) - 1 ) * dial

  scaling(
    x, 1, 1
  )
}

function scaleY ( i: u32 ): void {
  let addr: u32 = transformationStart + i * transformationSize
  let dial: f32 = obtainDial( addr )

  let y: f32 = 1 + ( getParam( addr, 0x0 ) - 1 ) * dial

  scaling(
    1, y, 1
  )
}

function scaleZ ( i: u32 ): void {
  let addr: u32 = transformationStart + i * transformationSize
  let dial: f32 = obtainDial( addr )

  let z: f32 = 1 + ( getParam( addr, 0x0 ) - 1 ) * dial

  scaling(
    1, 1, z
  )
}

function convert ( i: u32, factor: f32 ): void {
  let addr: u32 = parameterStart + i * parameterSize

  setF32( addr + parameterOffsetResult, getF32( addr + parameterOffsetValue ) * factor )
}

function pixelFromPixel ( i: u32 ): void {
  convert( i, 1 )
}

function pixelFromInch ( i: u32 ): void {
  convert( i, 96 )
}

function pixelFromPica ( i: u32 ): void {
  convert( i, 16 )
}

function pixelFromPoint ( i: u32 ): void {
  convert( i, 4 / 3 )
}

function pixelFromCentiMetre ( i: u32 ): void {
  convert( i, 96 / 2.54 )
}

function pixelFromMilliMetre ( i: u32 ): void {
  convert( i, 96 / 25.4 )
}

function pixelFromQuarter ( i: u32 ): void {
  convert( i, 96 / 101.6 )
}

function pixelFromViewportWidth ( i: u32 ): void {
  convert( i, vw )
}

function pixelFromViewportHeight ( i: u32 ): void {
  convert( i, vh )
}

function pixelFromViewportMinimum ( i: u32 ): void {
  convert( i, vmin )
}

function pixelFromViewportMaximum ( i: u32 ): void {
  convert( i, vmax )
}



function radianFromRadian ( i: u32 ): void {
  convert( i, 1 )
}

function radianFromDegree ( i: u32 ): void {
  convert( i, PI / 180 )
}

function radianFromGradient ( i: u32 ): void {
  convert( i, PI / 200 )
}

function radianFromTurn ( i: u32 ): void {
  convert( i, PI * 2 )
}



function numberFromNumber ( i: u32 ): void {
  convert( i, 1 )
}



function reset (): void {
  let p: u32 = 0
  let q: u32 = 0

  for ( p = 0; p < 4; p++ ) {
    for ( q = 0; q < 4; q++ ) {
      setF32( addrAccumulator + 4 * p + q, ( p == q ? 1 : 0 ) )
    }
  }
}

function product (): void {
  let p: u32
  let q: u32
  let r: u32

  let sum: f32

  for ( p = 0; p < 4; p++ ) {
    for ( q = 0; q < 4; q++ ) {
      sum = 0

      for ( r = 0; r < 4; r++ ) {
        sum = sum + getF32( addrStore + 4 * p + r ) * getF32( addrAccumulator + 4 * r + q )
      }

      setF32( addrResult + 4 * p + q, sum )
    }
  }

  accumulate()
}

function start (
  setParameterStart: u32
): void {
  parameterStart = setParameterStart
}


export {
  setDial,
  setViewport,
  start,

  translate,
  translate3D,
  translateX,
  translateY,
  translateZ,

  rotate3D,
  rotateX,
  rotateY,
  rotateZ,

  scale,
  scale3D,
  scaleX,
  scaleY,
  scaleZ,

  skew,
  skewX,
  skewY,

  pixelFromPixel as px2px,
  pixelFromInch as in2px,
  pixelFromPica as pc2px,
  pixelFromPoint as pt2px,
  pixelFromCentiMetre as cm2px,
  pixelFromMilliMetre as mm2px,
  pixelFromQuarter as Q2px,
  pixelFromViewportWidth as vw2px,
  pixelFromViewportHeight as vh2px,
  pixelFromViewportMinimum as vmin2px,
  pixelFromViewportMaximum as vmax2px,

  radianFromRadian as rad2rad,
  radianFromDegree as deg2rad,
  radianFromGradient as grad2rad,
  radianFromTurn as turn2rad,

  numberFromNumber as n2n,

  reset,
  product,
  
}