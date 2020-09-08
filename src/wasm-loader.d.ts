declare module 'wasm-loader!*' {
  interface Environment {
    memory?: WebAssembly.Memory
    table?: WebAssembly.Table
  }
  interface InstanceConstructorArgument {
    env?: Environment
  }
  const Instance: ( input?: InstanceConstructorArgument ) => Promise<WebAssembly.Instance & { exports: any }>
  export default Instance
}