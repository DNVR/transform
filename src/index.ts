export {
  dirtyTransform
} from './dirty/dirty'

import TransformComputer from './asm/transform.asm'
import TransformWASMDefinitions from '../build/transform'

const TrueMeasurements = {
  width: 0,
  height: 0,
  get viewportWidth () {
    return this.width
  },
  get viewportHeight () {
    return this.height
  }
}

let memorySize = 0x100
let memory: WebAssembly.Memory

try {
  memory = new WebAssembly.Memory( { initial: memorySize } )

  // void async function initialise () {
  //   const TransformWASM = await import( 'file-loader!./../build/transform.wasm' )

  //   let response = await fetch( TransformWASM as any )
  //   let buffer = await response.arrayBuffer()
  //   let module = await WebAssembly.compile( buffer )
  //   let instance = await WebAssembly.instantiate( module, {
  //     env: {
  //       memory
  //     }
  //   })

  //   Object.assign( TransformModule, instance.exports )
  //   TransformModule.start( foreign.parameterStart )
  //   setViewport()
  // }()
}
catch ( e ) {
  memory = <any> {
    buffer: new ArrayBuffer( 0x10000 * memorySize )
  }
}

let moduleBuffer = memory.buffer
let foreign = {
  result: 0x1000,
  accumulator: 0x1010,
  store: 0x1020,

  transformationStart: 0x1030,
  transformationOffsetDial: 0x2,
  transformationOffsetParam: 0x4,
  transformationSize: 0x8,

  parameterStart: memorySize / 2,
  parameterOffsetValue: 0x0,
  parameterOffsetResult: 0x1,
  parameterSize: 0x2,
}

let TransformModule: typeof TransformWASMDefinitions = TransformComputer( window, foreign, moduleBuffer )

const F32 = new Float32Array( moduleBuffer )
const U32 = new Uint32Array( moduleBuffer )

type ParameterValue = number
type ParameterUnit = string | null

type TransformMatrix = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
]

const {
  PI: pi,

  min,
  max
} = Math

const ParameterAddressMap: WeakMap<Calc | Parameter, number> = new WeakMap

const ParameterValueMap: WeakMap<Parameter, number> = new WeakMap
const ParameterUnitMap: WeakMap<Parameter, string | null> = new WeakMap

const TrueValueProperty = Symbol()
const AdjustedValueMethod = Symbol()

const SubscribeMethod = Symbol()
const UnsubscribeMethod = Symbol()
const ChangeTriggerMethod = Symbol()

const ParameterSubscriberMap: WeakMap<Parameter, Set<Transformation | Calc>> = new WeakMap

let newParameterAddress = function () {
  let addr = 0

  return function () {
    return addr++
  }

}()

abstract class Parameter {
  constructor ( value: ParameterValue = 0, unit: ParameterUnit = null ) {
    ParameterAddressMap.set( this, newParameterAddress() )
    ParameterSubscriberMap.set( this, new Set )

    this.value = value
    ParameterUnitMap.set( this, unit )
  }

  get [ AdjustedValueMethod ] () {
    return TransformModule.n2n
  }

  get value (): ParameterValue {
    return ParameterValueMap.get( this )
  }
  set value ( value ) {
    if ( this.value !== value ) {
      ParameterValueMap.set( this, value )
      this[ ChangeTriggerMethod ]()
    }
  }

  get unit (): ParameterUnit {
    return ParameterUnitMap.get( this ) as string | null
  }
  set unit ( value: ParameterUnit ) { value }

  get [ TrueValueProperty ] (): number {
    return this.value
  }

  [ SubscribeMethod ] ( encapsulator: Transformation | Calc ) {
    ParameterSubscriberMap.get( this ).add( encapsulator )
  }
  [ UnsubscribeMethod ] ( encapsulator: Transformation | Calc ) {
    ParameterSubscriberMap.get( this ).delete( encapsulator )
  }

  [ ChangeTriggerMethod ] () {
    F32.set( [ this.value ], foreign.parameterStart + foreign.parameterSize * ParameterAddressMap.get( this ) )
    this[ AdjustedValueMethod ]( ParameterAddressMap.get( this ) )
    ParameterSubscriberMap.get( this ).forEach( changeTrigger )
  }
}

class RegularNumber extends Parameter {
  get [ Symbol.toPrimitive ] (): number {
    return this[ TrueValueProperty ]
  }
}

abstract class Length extends Parameter {
  constructor ( value: number = 0, unit: string = 'px' ) {
    super( value, unit )
  }

  get [ Symbol.toPrimitive ] (): number {
    return this[ TrueValueProperty ]
  }

  get [ AdjustedValueMethod ] () {
    return TransformModule.px2px
  }
}

class Pixel extends Length { }

class Inch extends Length {
  constructor ( value: number = 0 ) {
    super( value, 'in' )
  }

  get [ AdjustedValueMethod ] () {
    return TransformModule.in2px
  }

  get [ TrueValueProperty ] (): number {
    return this.value * 96
  }
}

class Pica extends Length {
  constructor ( value: number = 0 ) {
    super( value, 'pc' )
  }

  get [ AdjustedValueMethod ] () {
    return TransformModule.pc2px
  }

  get [ TrueValueProperty ] (): number {
    return this.value * 16
  }
}

class Point extends Length {
  constructor ( value: number = 0 ) {
    super( value, 'pt' )
  }

  get [ AdjustedValueMethod ] () {
    return TransformModule.pt2px
  }
  get [ TrueValueProperty ] (): number {
    return this.value * 4 / 3
  }
}

class CentiMetre extends Length {
  constructor ( value: number = 0 ) {
    super( value, 'cm' )
  }

  get [ AdjustedValueMethod ] () {
    return TransformModule.cm2px
  }

  get [ TrueValueProperty ] (): number {
    return this.value * 96 / 2.54
  }
}

class MilliMetre extends Length {
  constructor ( value: number = 0 ) {
    super( value, 'mm' )
  }

  get [ AdjustedValueMethod ] () {
    return TransformModule.mm2px
  }

  get [ TrueValueProperty ] (): number {
    return this.value * 96 / 25.4
  }
}

class Quarter extends Length {
  constructor ( value: number = 0 ) {
    super( value, 'Q' )
  }

  get [ AdjustedValueMethod ] () {
    return TransformModule.Q2px
  }

  get [ TrueValueProperty ] (): number {
    return this.value * 96 / 101.6
  }
}


let ViewportSet: Set<ViewportWidth | ViewportHeight | ViewportMinimum | ViewportMaximum> = new Set

class ViewportWidth extends Length {
  constructor ( value: number = 0 ) {
    super( value, 'vw' )

    ViewportSet.add( this )
  }

  get [ AdjustedValueMethod ] () {
    return TransformModule.vw2px
  }

  get [ TrueValueProperty ] (): number {
    return this.value * TrueMeasurements.viewportWidth / 100
  }
}

class ViewportHeight extends Length {
  constructor ( value: number = 0 ) {
    super( value, 'vh' )

    ViewportSet.add( this )
  }

  get [ AdjustedValueMethod ] () {
    return TransformModule.vh2px
  }

  get [ TrueValueProperty ] (): number {
    return this.value * TrueMeasurements.viewportHeight / 100
  }
}

class ViewportMinimum extends Length {
  constructor ( value: number = 0 ) {
    super( value, 'vmin' )

    ViewportSet.add( this )
  }

  get [ AdjustedValueMethod ] () {
    return TransformModule.vmin2px
  }

  get [ TrueValueProperty ] (): number {
    return this.value * min( TrueMeasurements.viewportWidth, TrueMeasurements.viewportHeight ) / 100
  }
}

class ViewportMaximum extends Length {
  constructor ( value: number = 0 ) {
    super( value, 'vmax' )

    ViewportSet.add( this )
  }

  get [ AdjustedValueMethod ] () {
    return TransformModule.vmax2px
  }

  get [ TrueValueProperty ] (): number {
    return this.value * max( TrueMeasurements.viewportWidth, TrueMeasurements.viewportHeight ) / 100
  }
}


abstract class Angle extends Parameter {
  constructor ( value: number, unit = 'rad' ) {
    super( value, unit )
  }

  get [ Symbol.toPrimitive ] (): number {
    return this[ TrueValueProperty ]
  }

  get [ AdjustedValueMethod ] () {
    return TransformModule.rad2rad
  }
}

class Radians extends Angle { }

class Degrees extends Angle {
  constructor ( value: number = 0 ) {
    super( value, 'deg' )
  }

  get [ AdjustedValueMethod ] () {
    return TransformModule.deg2rad
  }

  get [ TrueValueProperty ] (): number {
    return this.value * pi / 180
  }
}

class Gradients extends Angle {
  constructor ( value: number = 0 ) {
    super( value, 'grad' )
  }

  get [ AdjustedValueMethod ] () {
    return TransformModule.grad2rad
  }

  get [ TrueValueProperty ] (): number {
    return this.value * pi / 200
  }
}

class Turns extends Angle {
  constructor ( value: number = 0 ) {
    super( value, 'turn' )
  }

  get [ AdjustedValueMethod ] () {
    return TransformModule.turn2rad
  }

  get [ TrueValueProperty ] (): number {
    return this.value * pi * 2
  }
}


class ScaleFactor extends RegularNumber {
  get [ AdjustedValueMethod ] () {
    return TransformModule.n2n
  }
}



// abstract class Parameter {
//   constructor ( value: ParameterValue = 0, unit: ParameterUnit = null ) {
//     ParameterAddressMap.set( this, newParameterAddress() )
//     ParameterSubscriberMap.set( this, new Set )

//     this.value = value
//     ParameterUnitMap.set( this, unit )
//   }

//   get [ AdjustedValueMethod ] () {
//     return TransformModule.n2n
//   }

//   get value (): ParameterValue {
//     return ParameterValueMap.get( this )
//   }
//   set value ( value ) {
//     if ( this.value !== value ) {
//       ParameterValueMap.set( this, value )
//       this[ ChangeTriggerMethod ]()
//     }
//   }

//   get unit (): ParameterUnit {
//     return ParameterUnitMap.get( this )
//   }
//   set unit ( value ) {}

//   get [ TrueValueProperty ] (): number {
//     return this.value
//   }

//   [ SubscribeMethod ] ( encapsulator: Transformation ) {
//     ParameterSubscriberMap.get( this ).add( encapsulator )
//   }
//   [ UnsubscribeMethod ] ( encapsulator: Transformation ) {
//     ParameterSubscriberMap.get( this ).delete( encapsulator )
//   }

//   [ ChangeTriggerMethod ] () {
//     F32.set( [ this.value ], foreign.parameterStart + foreign.parameterSize * ParameterAddressMap.get( this ) )
//     this[ AdjustedValueMethod ]( ParameterAddressMap.get( this ) )
//     ParameterSubscriberMap.get( this ).forEach( changeTrigger )
//   }
// }

let CalcOperandsMap: WeakMap<Calc, Array<Calc | Parameter>> = new WeakMap
let CalcSubscriberMap: WeakMap<Calc, Set<Transformation | Calc>> = new WeakMap
const ResultOfOperation = Symbol()

class Calc {
  constructor ( ...operands: Array<Calc | Parameter> ) {
    ParameterAddressMap.set( this, newParameterAddress() )

    CalcSubscriberMap.set( this, new Set )
    CalcOperandsMap.set( this, operands )

    CalcOperandsMap.get( this ).forEach( subscriber, this )
  }

  get value () {
    return this[ ResultOfOperation ]
  }

  get [ ResultOfOperation ] (): number {
    let [ entry ] = CalcOperandsMap.get( this )
    return entry[ TrueValueProperty ]
  }

  get [ TrueValueProperty ] (): number {
    return this[ ResultOfOperation ]
  }

  get [ AdjustedValueMethod ] () {
    return TransformModule.n2n
  }

  [ SubscribeMethod ] ( encapsulator: Transformation | Calc ) {
    CalcSubscriberMap.get( this ).add( encapsulator )
  }
  [ UnsubscribeMethod ] ( encapsulator: Transformation | Calc ) {
    CalcSubscriberMap.get( this ).delete( encapsulator )
  }

  [ ChangeTriggerMethod ] () {
    F32.set( [ this[ ResultOfOperation ] ], foreign.parameterStart + foreign.parameterSize * ParameterAddressMap.get( this ) )
    this[ AdjustedValueMethod ]( ParameterAddressMap.get( this ) )
    CalcSubscriberMap.get( this ).forEach( changeTrigger )
  }
}

class Addition extends Calc {
  get [ ResultOfOperation ] (): number {
    return CalcOperandsMap.get( this ).reduce( ( a, e ) => ( a + e[ TrueValueProperty ] ), 0 )
  }
}

class Subtraction extends Calc {
  get [ ResultOfOperation ] () {
    let [ a, b ] = CalcOperandsMap.get( this )
    return a[ TrueValueProperty ] - b[ TrueValueProperty ]
  }
}

class Multiply extends Calc {
  get [ ResultOfOperation ] (): number {
    return CalcOperandsMap.get( this ).reduce( ( a, e ) => ( a * e[ TrueValueProperty ] ), 0 )
  }
}

class Divide extends Calc {
  get [ ResultOfOperation ] (): number {
    let [ a, b ] = CalcOperandsMap.get( this )
    return a[ TrueValueProperty ] / b[ TrueValueProperty ]
  }
}


class SquareRoot extends Calc {
  get [ ResultOfOperation ] () {
    let [ entry ] = CalcOperandsMap.get( this )
    return Math.sqrt( entry[ TrueValueProperty ] )
  }
}


class Minimum extends Calc {
  get [ ResultOfOperation ] (): number {
    return Math.min( ...CalcOperandsMap.get( this ).map( e => e[ TrueValueProperty ] ) )
  }
}

class Maximum extends Calc {
  get [ ResultOfOperation ] (): number {
    return Math.max( ...CalcOperandsMap.get( this ).map( e => e[ TrueValueProperty ] ) )
  }
}

const Parameters = Object.freeze( {
  CLASS: Parameter,

  number ( value: number = 0 ): RegularNumber {
    return new RegularNumber( value )
  },

  px ( value: number = 0 ): Pixel {
    return new Pixel( value )
  },
  in ( value: number = 0 ): Inch {
    return new Inch( value )
  },
  pc ( value: number = 0 ): Pica {
    return new Pica( value )
  },
  pt ( value: number = 0 ): Point {
    return new Point( value )
  },
  cm ( value: number = 0 ): CentiMetre {
    return new CentiMetre( value )
  },
  mm ( value: number = 0 ): MilliMetre {
    return new MilliMetre( value )
  },
  Q ( value: number = 0 ): Quarter {
    return new Quarter( value )
  },
  vw ( value: number = 0 ): ViewportWidth {
    return new ViewportWidth( value )
  },
  vh ( value: number = 0 ): ViewportHeight {
    return new ViewportHeight( value )
  },
  vmin ( value: number = 0 ): ViewportMinimum {
    return new ViewportMinimum( value )
  },
  vmax ( value: number = 0 ): ViewportMaximum {
    return new ViewportMaximum( value )
  },

  rad ( value: number = 0 ): Radians {
    return new Radians( value )
  },
  deg ( value: number = 0 ): Degrees {
    return new Degrees( value )
  },
  grad ( value: number = 0 ): Gradients {
    return new Gradients( value )
  },
  turn ( value: number = 0 ): Turns {
    return new Turns( value )
  },

  scale ( value: number = 1 ): ScaleFactor {
    return new ScaleFactor( value )
  },


  calc ( operand: Calc | Parameter ): Calc {
    return new Calc( operand )
  },
  add ( ...addends: Array<Calc | Parameter> ): Addition {
    return new Addition( ...addends )
  },
  sub ( subtractand: Calc | Parameter, subtractor: Calc | Parameter ): Subtraction {
    return new Subtraction( subtractand, subtractor )
  },
  mul ( ...multiplicands: Array<Calc | Parameter> ): Multiply {
    return new Multiply( ...multiplicands )
  },
  div ( dividend: Calc | Parameter, divisor: Calc | Parameter ): Divide {
    return new Divide( dividend, divisor )
  },
  sqrt ( candidate: Calc | Parameter ): SquareRoot {
    return new SquareRoot( candidate )
  },
  min ( ...operands: Array<Calc | Parameter> ): Minimum {
    return new Minimum( ...operands )
  },
  max ( ...operands: Array<Calc | Parameter> ): Maximum {
    return new Maximum( ...operands )
  }
} )


const ParameterAssignmentMethod = Symbol()

const EvaluationRetrievalMethod = Symbol()
const EvaluationPerformanceMethod = Symbol()

const ParametersListMap: WeakMap<Transformation, Array<Calc | Parameter>> = new WeakMap

const TransformationSubscriberMap: WeakMap<Transformation, Set<Transform>> = new WeakMap

const TransformationAddressMap: WeakMap<Transformation, number> = new WeakMap

let newTransformationAddress = function () {
  let addr = 0

  return function () {
    return addr++
  }

}()

abstract class Transformation {

  constructor () {
    TransformationAddressMap.set( this, newTransformationAddress() )
    TransformationSubscriberMap.set( this, new Set )
  }

  [ ParameterAssignmentMethod ] ( ...params: Array<Calc | Parameter> ): void {
    void [ ...params ].forEach( ( param, index ) => {
      U32.set( [ ParameterAddressMap.get( param ) ], foreign.transformationStart + foreign.transformationSize * TransformationAddressMap.get( this ) + foreign.transformationOffsetParam + index )
    } )
    void [ ...params ].forEach( subscriber, this )
    ParametersListMap.set( this, [ ...params ] )
  }

  [ EvaluationRetrievalMethod ] ( dial: number ): void {
    this.dial( TransformationAddressMap.get( this ), dial )
    this[ EvaluationPerformanceMethod ]( TransformationAddressMap.get( this ) )
  }

  abstract get [ EvaluationPerformanceMethod ] (): Function

  get dial () {
    return TransformModule.setDial
  }

  [ SubscribeMethod ] ( encapsulator: Transform ): void {
    TransformationSubscriberMap.get( this ).add( encapsulator )
  }
  [ UnsubscribeMethod ] ( encapsulator: Transform ): void {
    TransformationSubscriberMap.get( this ).delete( encapsulator )
  }

  [ ChangeTriggerMethod ] (): void {
    TransformationSubscriberMap.get( this ).forEach( changeTrigger )
  }
}

abstract class LinearTransformation extends Transformation {
  abstract [ ParameterAssignmentMethod ] ( ...param: Array<Length | Calc> ): void
}

class Translation extends LinearTransformation {
  [ ParameterAssignmentMethod ] ( paramX: Length | Calc = Parameters.px( 0 ), paramY: Length | Calc = Parameters.px( 0 ) ): void {
    super[ ParameterAssignmentMethod ]( paramX, paramY )
  }

  get [ EvaluationPerformanceMethod ] () {
    return TransformModule.translate
  }
}

class Translation3D extends LinearTransformation {
  [ ParameterAssignmentMethod ] ( paramX: Length | Calc = Parameters.px( 0 ), paramY: Length | Calc = Parameters.px( 0 ), paramZ: Length | Calc = Parameters.px( 0 ) ): void {
    super[ ParameterAssignmentMethod ]( paramX, paramY, paramZ )
  }

  get [ EvaluationPerformanceMethod ] () {
    return TransformModule.translate3D
  }
}

class TranslationX extends LinearTransformation {
  [ ParameterAssignmentMethod ] ( paramX: Length | Calc = Parameters.px( 0 ) ): void {
    super[ ParameterAssignmentMethod ]( paramX )
  }

  get [ EvaluationPerformanceMethod ] () {
    return TransformModule.translateX
  }
}

class TranslationY extends LinearTransformation {
  [ ParameterAssignmentMethod ] ( paramY: Length | Calc = Parameters.px( 0 ) ): void {
    super[ ParameterAssignmentMethod ]( paramY )
  }

  get [ EvaluationPerformanceMethod ] () {
    return TransformModule.translateY
  }
}

class TranslationZ extends LinearTransformation {
  [ ParameterAssignmentMethod ] ( paramZ: Length | Calc = Parameters.px( 0 ) ): void {
    super[ ParameterAssignmentMethod ]( paramZ )
  }

  get [ EvaluationPerformanceMethod ] () {
    return TransformModule.translateZ
  }
}


abstract class RotaryTransformation extends Transformation {
  abstract [ ParameterAssignmentMethod ] ( ...params: Array<Calc | Parameter> ): void
}

class Rotation3D extends RotaryTransformation {
  [ ParameterAssignmentMethod ] ( paramX: RegularNumber | Calc = Parameters.number( 0 ), paramY: RegularNumber | Calc = Parameters.number( 0 ), paramZ: RegularNumber | Calc = Parameters.number( 0 ), paramAlpha: Angle | Calc = Parameters.rad( 0 ) ): void {
    super[ ParameterAssignmentMethod ]( paramX, paramY, paramZ, paramAlpha )
  }

  get [ EvaluationPerformanceMethod ] () {
    return TransformModule.rotate3D
  }
}

class RotationX extends RotaryTransformation {
  [ ParameterAssignmentMethod ] ( paramAlpha: Angle | Calc = Parameters.rad( 0 ) ): void {
    super[ ParameterAssignmentMethod ]( paramAlpha )
  }

  get [ EvaluationPerformanceMethod ] () {
    return TransformModule.rotateX
  }
}

class RotationY extends RotaryTransformation {
  [ ParameterAssignmentMethod ] ( paramAlpha: Angle | Calc = Parameters.rad( 0 ) ): void {
    super[ ParameterAssignmentMethod ]( paramAlpha )
  }

  get [ EvaluationPerformanceMethod ] () {
    return TransformModule.rotateY
  }
}

class RotationZ extends RotaryTransformation {
  [ ParameterAssignmentMethod ] ( paramAlpha: Angle | Calc = Parameters.rad( 0 ) ): void {
    super[ ParameterAssignmentMethod ]( paramAlpha )
  }

  get [ EvaluationPerformanceMethod ] () {
    return TransformModule.rotateZ
  }
}

class Rotation extends RotationZ { }


abstract class AskewTransformation extends Transformation {
  abstract [ ParameterAssignmentMethod ] ( ...param: Array<Angle | Calc> ): void
}

class Skewing extends AskewTransformation {
  [ ParameterAssignmentMethod ] ( paramX: Angle | Calc = Parameters.rad( 0 ), paramY: Angle | Calc = Parameters.rad( 0 ) ): void {
    super[ ParameterAssignmentMethod ]( paramX, paramY )
  }

  get [ EvaluationPerformanceMethod ] () {
    return TransformModule.skew
  }
}

class SkewingX extends AskewTransformation {
  [ ParameterAssignmentMethod ] ( paramX: Angle | Calc = Parameters.rad( 0 ) ): void {
    super[ ParameterAssignmentMethod ]( paramX )
  }

  get [ EvaluationPerformanceMethod ] () {
    return TransformModule.skewX
  }
}

class SkewingY extends AskewTransformation {
  [ ParameterAssignmentMethod ] ( paramY: Angle | Calc = Parameters.rad( 0 ) ): void {
    super[ ParameterAssignmentMethod ]( paramY )
  }

  get [ EvaluationPerformanceMethod ] () {
    return TransformModule.skewY
  }
}


abstract class ScalingTransformation extends Transformation {
  abstract [ ParameterAssignmentMethod ] ( ...params: Array<ScaleFactor | Calc> ): void
}

class Scaling2D extends ScalingTransformation {
  [ ParameterAssignmentMethod ] ( paramX: ScaleFactor | Calc = Parameters.scale( 1 ), paramY?: ScaleFactor | Calc ): void {
    if ( undefined === paramY ) {
      paramY = paramX
    }
    super[ ParameterAssignmentMethod ]( paramX, paramY )
  }

  get [ EvaluationPerformanceMethod ] () {
    return TransformModule.scale
  }
}

class Scaling3D extends ScalingTransformation {
  [ ParameterAssignmentMethod ] ( paramX: ScaleFactor | Calc = Parameters.scale( 1 ), paramY?: ScaleFactor | Calc, paramZ?: ScaleFactor | Calc ): void {
    if ( undefined === paramY && undefined === paramZ ) {
      paramY = paramX
      paramZ = paramX
    }
    if ( undefined === paramZ ) {
      paramZ = Parameters.scale( 1 )
    }
    super[ ParameterAssignmentMethod ]( paramX, paramY, paramZ )
  }

  get [ EvaluationPerformanceMethod ] () {
    return TransformModule.scale3D
  }
}

class ScalingX extends ScalingTransformation {
  [ ParameterAssignmentMethod ] ( paramX: ScaleFactor | Calc = Parameters.scale( 1 ) ): void {
    super[ ParameterAssignmentMethod ]( paramX, undefined, undefined )
  }

  get [ EvaluationPerformanceMethod ] () {
    return TransformModule.scaleX
  }
}

class ScalingY extends ScalingTransformation {
  [ ParameterAssignmentMethod ] ( paramY: ScaleFactor | Calc = Parameters.scale( 1 ) ): void {
    super[ ParameterAssignmentMethod ]( paramY )
  }

  get [ EvaluationPerformanceMethod ] () {
    return TransformModule.scaleY
  }
}

class ScalingZ extends ScalingTransformation {
  [ ParameterAssignmentMethod ] ( paramZ: ScaleFactor | Calc = Parameters.scale( 1 ) ): void {
    super[ ParameterAssignmentMethod ]( paramZ )
  }

  get [ EvaluationPerformanceMethod ] () {
    return TransformModule.scaleZ
  }
}

const Functions = Object.freeze( {
  CLASS: Transformation,

  translate ( x: Length | Calc, y?: Length | Calc ): Translation {
    let transformation = new Translation
    transformation[ ParameterAssignmentMethod ]( x, y )
    return transformation
  },
  translate3d ( x: Length, y?: Length, z?: Length ): Translation3D {
    let transformation = new Translation3D
    transformation[ ParameterAssignmentMethod ]( x, y, z )
    return transformation
  },
  translateX ( x: Length | Calc ): TranslationX {
    let transformation = new TranslationX
    transformation[ ParameterAssignmentMethod ]( x )
    return transformation
  },
  translateY ( y: Length | Calc ): TranslationY {
    let transformation = new TranslationY
    transformation[ ParameterAssignmentMethod ]( y )
    return transformation
  },
  translateZ ( z: Length | Calc ): TranslationZ {
    let transformation = new TranslationZ
    transformation[ ParameterAssignmentMethod ]( z )
    return transformation
  },

  rotate3d ( x: RegularNumber | Calc, y: RegularNumber | Calc, z: RegularNumber | Calc, a: Angle | Calc ): Rotation3D {
    let transformation = new Rotation3D
    transformation[ ParameterAssignmentMethod ]( x, y, z, a )
    return transformation
  },
  rotateX ( a: Angle | Calc ): RotationX {
    let transformation = new RotationX
    transformation[ ParameterAssignmentMethod ]( a )
    return transformation
  },
  rotateY ( a: Angle | Calc ): RotationY {
    let transformation = new RotationY
    transformation[ ParameterAssignmentMethod ]( a )
    return transformation
  },
  rotateZ ( a: Angle | Calc ): RotationZ {
    let transformation = new RotationZ
    transformation[ ParameterAssignmentMethod ]( a )
    return transformation
  },
  rotate ( a: Angle | Calc ): Rotation {
    let transformation = new Rotation
    transformation[ ParameterAssignmentMethod ]( a )
    return transformation
  },

  skew ( x: Angle | Calc, y?: Angle | Calc ): Skewing {
    let transformation = new Skewing
    transformation[ ParameterAssignmentMethod ]( x, y )
    return transformation
  },
  skewX ( x: Angle | Calc ): SkewingX {
    let transformation = new SkewingX
    transformation[ ParameterAssignmentMethod ]( x )
    return transformation
  },
  skewY ( y: Angle | Calc ): SkewingY {
    let transformation = new SkewingY
    transformation[ ParameterAssignmentMethod ]( y )
    return transformation
  },

  scale ( x: ScaleFactor | Calc, y?: ScaleFactor | Calc ): Scaling2D {
    let transformation = new Scaling2D
    transformation[ ParameterAssignmentMethod ]( x, y )
    return transformation
  },
  scale3d ( x: ScaleFactor | Calc, y?: ScaleFactor | Calc, z?: ScaleFactor | Calc ): Scaling3D {
    let transformation = new Scaling3D
    transformation[ ParameterAssignmentMethod ]( x, y, z )
    return transformation
  },
  scaleX ( x: ScaleFactor | Calc ): ScalingX {
    let transformation = new ScalingX
    transformation[ ParameterAssignmentMethod ]( x )
    return transformation
  },
  scaleY ( y: ScaleFactor | Calc ): ScalingY {
    let transformation = new ScalingY
    transformation[ ParameterAssignmentMethod ]( y )
    return transformation
  },
  scaleZ ( z: ScaleFactor | Calc ): ScalingZ {
    let transformation = new ScalingZ
    transformation[ ParameterAssignmentMethod ]( z )
    return transformation
  }
} )

// const transformation = function ( str ) {
//   if ( Reflect.has( Transformation, str ) ) {
//     return Transformation[ str ]
//   }
//   else {
//     return false
//   }
// }

const DialComputeMethod: unique symbol = Symbol()

class Dial {
  constructor ( fn?: ( dial: number ) => number ) {
    if ( 'function' === typeof fn ) {
      this[ DialComputeMethod ] = fn
    }
  }

  [ DialComputeMethod ] ( dial: number ) {
    return dial
  }

  [ EvaluationRetrievalMethod ] ( dial: number ): number {
    return this[ DialComputeMethod ]( dial )
  }

  [ SubscribeMethod ] () { }
  [ UnsubscribeMethod ] () { }
}

const Dials = Object.freeze( {
  CLASS: Dial,

  triviality: new Dial( function () { return 0 } ),
  identity: new Dial( function () { return 1 } ),

  linear: new Dial,
  square: new Dial( function ( dial ) { return dial * dial } ),
  cube: new Dial( function ( dial ) { return dial * dial * dial } )
} )

type AnythingWithStyle = {
  style: any
}

type TransformationOrDial = Transformation | Dial

const TransformElementMap: WeakMap<Transform, AnythingWithStyle> = new WeakMap

const TransformListMap: WeakMap<Transform, TransformationOrDial[]> = new WeakMap
const TransformDialMap: WeakMap<Transform, number> = new WeakMap

const TransformOriginMap: WeakMap<Transform, [ Length, Length, Length ]> = new WeakMap

const TransformationAssignmentMethod = Symbol()

let baseX = Parameters.px( 0 )
let baseY = Parameters.px( 0 )
let baseZ = Parameters.px( 0 )

const resultMatrix: TransformMatrix = <any> new Float32Array( moduleBuffer, foreign.result << 2, 16 )

class Transform {

  altAttr: string

  static get Functions () {
    return Functions
  }
  static get Parameters () {
    return Parameters
  }
  static get Dials () {
    return Dials
  }

  get Functions () {
    return Functions
  }
  get Parameters () {
    return Parameters
  }
  get Dials () {
    return Dials
  }

  constructor ( entry: AnythingWithStyle, altAttr: string = 'style' ) {
    TransformElementMap.set( this, entry )

    this.altAttr = altAttr

    TransformListMap.set( this, [] )
    TransformDialMap.set( this, 0 )

    TransformOriginMap.set( this, [ baseX, baseY, baseZ ] )
  }

  get dial (): number {
    return TransformDialMap.get( this )
  }
  set dial ( value: number ) {
    TransformDialMap.set( this, value )
    this[ EvaluationRetrievalMethod ]( value )
  }

  originate ( originX: Length = Parameters.px( 0 ), originY: Length = Parameters.px( 0 ), originZ: Length = Parameters.px( 0 ) ) {
    TransformOriginMap.set( this, [ originX, originY, originZ ] )
  }

  reset () {
    let transformList = TransformListMap.get( this )
    transformList.forEach( unsubscriber, this )
    TransformListMap.set( this, [] )
  }

  set ( ...params: TransformationOrDial[] ) {
    this[ TransformationAssignmentMethod ]( ...params )
  }

  [ TransformationAssignmentMethod ] ( ...params: TransformationOrDial[] ) {
    this.reset()

    void [ ...params ].forEach( subscriber, this )
    TransformListMap.set( this, [ ...params ] )
  }

  [ EvaluationRetrievalMethod ] ( dial: number ) {
    TransformModule.reset()
    TransformListMap.get( this ).reduce( transformLister, { Dial: dial, dial } )

    // let [ originX, originY, originZ ] = TransformOriginMap.get( this )
    // TransformElementMap.get( this ).style.transformOrigin = `${ originX[ TrueValueProperty ] }px ${ originY[ TrueValueProperty ] }px ${ originZ[ TrueValueProperty ] }px`

    TransformElementMap.get( this ).style.transform = `matrix3d( ${ resultMatrix.join( ', ' ) } )`
  }

  [ ChangeTriggerMethod ] () {
    this[ EvaluationRetrievalMethod ]( this.dial )
  }
}

type InternalDialObject = {
  Dial: number,
  dial: number
}

const transformLister = function ( dialObject: InternalDialObject, entry: Transformation | Dial ) {
  if ( entry instanceof Transformation ) {
    let { dial } = dialObject
    entry[ EvaluationRetrievalMethod ]( dial )
    TransformModule.product()
  }
  else if ( entry instanceof Dial ) {
    dialObject.dial = entry[ EvaluationRetrievalMethod ]( dialObject.Dial )
  }

  return dialObject
}

function changeTrigger ( entry: Transform | Transformation | Parameter | Calc ) {
  entry[ ChangeTriggerMethod ]()
}
function subscriber ( this: any, entry: TransformationOrDial | Parameter | Calc ) {
  entry[ SubscribeMethod ]( this )
}
function unsubscriber ( this: any, entry: TransformationOrDial | Parameter | Calc ) {
  entry[ UnsubscribeMethod ]( this )
}

let setViewport = function () {
  TrueMeasurements.width = window.innerWidth
  TrueMeasurements.height = window.innerHeight

  TransformModule.setViewport( TrueMeasurements.viewportWidth, TrueMeasurements.viewportHeight )
  ViewportSet.forEach( changeTrigger )
}
setViewport()
window.addEventListener( 'resize', setViewport )

export {
  Functions as TransformationFunctions,
  Parameters as TransformationParameters,
  Dials as TransformationDials
}

export default Transform