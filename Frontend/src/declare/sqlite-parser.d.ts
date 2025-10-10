// d.ts 文件就是 TypeScript 的“说明书”——
// 只写类型签名，不写具体实现，告诉 TS：“某个 JS 库长什么样，我能怎么调用”。

declare module 'sqlite-parser' {
  function parse(sql: string): any;
  export default parse;
}