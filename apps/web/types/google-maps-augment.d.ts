// 最小限の setOptions 型を追加（必要なら項目を足せます）
// declare global {
//   namespace google.maps {
//     interface FunctionalSettings {
//       apiKey?: string;
//       version?: string;      // e.g. "weekly"
//       language?: string;
//       region?: string;
//       libraries?: string[];  // ["places"] など
//     }
//     function setOptions(options: FunctionalSettings): void;
//   }
// }
// export {};
export {}; // これでモジュール化しつつ何も輸出しない

declare global {
  // 必要ならヘルパー型などをここで宣言
  type GMap = google.maps.Map;
}