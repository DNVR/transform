type TransformMatrix = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
]

const {
  sqrt,

  sin,
  cos,
  tan,

  PI: pi
} = Math

const degree2radian = function ( deg: number ): number {
  return pi * deg / 180
}

// @ts-ignore
const radian2degree = function ( rad: number ): number {
  return 180 * rad / pi
}

const zero = function (): TransformMatrix {
  return [
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0
  ]
}

const identity = function (): TransformMatrix {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]
}

const premultiply = function ( a: TransformMatrix, b: TransformMatrix ): TransformMatrix {
  let result = zero()

  for ( let i = 0; i < 16; i++ ) {
    for ( let k = 0; k < 4; k++ ) {
      result[ i ] += a[ 4 * ( ( i / 4 ) | 0 ) + k ] * b[ 4 * k + i % 4 ]
    }
  }

  return result
}

class DirtyTransform {

  private matrix: TransformMatrix;
  private dial: number;

  constructor ( given: TransformMatrix, dial = 1 ) {
    this.matrix = undefined === given ? identity() : given
    this.dial = dial
  }

  [ Symbol.toPrimitive ] () {
    return this.css()
  }

  public translate ( x: number = 0, y: number = 0, z: number = 0 ): DirtyTransform {
    let { matrix, dial } = this
    x = x * dial
    y = y * dial
    z = z * dial

    let multiplicand: TransformMatrix = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1
    ]

    return new DirtyTransform( premultiply( multiplicand, matrix ), dial )
  }

  public translateX ( x: number = 0 ): DirtyTransform {
    return this.translate( x, 0, 0 )
  }

  public translateY ( y: number = 0 ): DirtyTransform {
    return this.translate( 0, y, 0 )
  }

  public translateZ ( z: number = 0 ): DirtyTransform {
    return this.translate( 0, 0, z )
  }

  public rotateRad3d ( x: number = 0, y: number = 0, z: number = 0, a: number = 0 ): DirtyTransform {
    let norm = sqrt( x * x + y * y + z * z )

    if ( 0 === norm ) return this

    if ( norm !== 1 ) {
      x = x / norm
      y = y / norm
      z = z / norm
    }

    let { matrix, dial } = this

    a = - a * dial

    let s = sin( a )
    let c = cos( a )

    let multiplicand: TransformMatrix = [
      1 + ( 1 - c ) * ( x * x - 1 ),    - z * s + x * y * ( 1 - c ),      y * s + x * z * ( 1 - c ),  0,
          z * s + x * y * ( 1 - c ),  1 + ( 1 - c ) * ( y * y - 1 ),    - x * s + y * z * ( 1 - c ),  0,
        - y * s + x * z * ( 1 - c ),      x * s + y * z * ( 1 - c ),  1 + ( 1 - c ) * ( z * z - 1 ),  0,
                                  0,                              0,                              0,  1  
    ]

    return new DirtyTransform( premultiply( multiplicand, matrix ), dial )
  }

  public rotate3d ( x: number = 0, y: number = 0, z: number = 1, a: number = 0 ): DirtyTransform {
    return this.rotateRad3d( x, y, z, degree2radian( a ) )
  }

  public rotateRadX ( x: number = 0 ): DirtyTransform {
    return this.rotateRad3d( 1, 0, 0, x )
  }

  public rotateRadY ( y: number = 0 ): DirtyTransform {
    return this.rotateRad3d( 0, 1, 0, y )
  }

  public rotateRadZ ( z: number = 0 ): DirtyTransform {
    return this.rotateRad3d( 0, 0, 1, z )
  }

  public rotateX ( x: number = 0 ): DirtyTransform {
    return this.rotateRadX( degree2radian( x ) )
  }

  public rotateY ( y: number = 0 ): DirtyTransform {
    return this.rotateRadY( degree2radian( y ) )
  }

  public rotateZ ( z: number = 0 ): DirtyTransform {
    return this.rotateRadZ( degree2radian( z ) )
  }

  public rotate ( z: number = 0 ): DirtyTransform {
    return this.rotateRadZ( degree2radian( z ) )
  }

  public skewRad ( x: number = 0, y: number = 0 ): DirtyTransform {
    let { matrix, dial } = this

    x = x * dial
    y = y * dial

    let tx = tan( x )
    let ty = tan( y )

    let multiplicand: TransformMatrix = [
       1,ty, 0, 0,
      tx, 1, 0, 0,
       0, 0, 1, 0,
       0, 0, 0, 1
    ]

    return new DirtyTransform( premultiply( multiplicand, matrix ), dial )
  }

  public skewRadX ( x: number = 0 ): DirtyTransform {
    return this.skewRad( x, 0 )
  }

  public skewRadY ( y: number = 0 ): DirtyTransform {
    return this.skewRad( 0, y )
  }

  public skew ( x: number = 0, y: number = 0 ): DirtyTransform {
    return this.skewRad( degree2radian( x ), degree2radian( y ) )
  }

  public skewX ( x: number = 0 ): DirtyTransform {
    return this.skew( x, 0 )
  }

  public skewY ( y: number = 0 ): DirtyTransform {
    return this.skew( 0, y )
  }

  public scale3d ( x: number = 1, y: number = 1, z: number = 1 ): DirtyTransform {
    let { matrix, dial } = this

    x = 1 + ( x - 1 ) * dial
    y = 1 + ( y - 1 ) * dial
    z = 1 + ( z - 1 ) * dial

    let multiplicand: TransformMatrix = [
      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1
    ]

    return new DirtyTransform( premultiply( multiplicand, matrix ), dial )
  }

  public scaleX ( x: number = 1 ): DirtyTransform {
    return this.scale3d( x, 1, 1 )
  }

  public scaleY ( y: number = 1 ): DirtyTransform {
    return this.scale3d( 1, y, 1 )
  }

  public scaleZ ( z: number = 1 ): DirtyTransform {
    return this.scale3d( 1, 1, z )
  }

  public scale ( n: number = 1 ): DirtyTransform {
    return this.scale3d( n, n, n )
  }

  public perspective ( n: number = 0 ): DirtyTransform {
    let {
      dial,
      matrix
    } = this

    let multiplicand: TransformMatrix = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, -1/n,
      0, 0, 0, 1
    ]
    return new DirtyTransform( premultiply( multiplicand, matrix ), dial )
  }

  alterDial ( dial: number ): DirtyTransform {
    return new DirtyTransform( this.matrix, dial )
  }

  css (): string {
    let { matrix } = this

    return `matrix3d( ${ matrix.join( ', ' ) } )`
  }
}

const dirtyTransform = function ( dial: number = 1 ): DirtyTransform {
  return new DirtyTransform( identity(), dial )
}

export {
  dirtyTransform
}