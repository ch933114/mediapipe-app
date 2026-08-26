/** Backend Result API envelope / 後端 Result API 統一回傳結構 */
export interface ApiResult<T = unknown> {
  code: number;
  message: string;
  data: T;
}
