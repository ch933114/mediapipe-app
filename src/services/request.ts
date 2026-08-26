import type { AxiosRequestConfig } from "axios";

import type { ApiResult } from "@/types/api";

import api from "./api";

/** Successful Result API business codes / Result API 業務成功碼 */
const SUCCESS_CODES = new Set([0, 200]);

/** Unwrap Result API body / 解開 Result API，失敗時拋錯 */
export function unwrapResult<T>(result: ApiResult<T>): T {
  if (!SUCCESS_CODES.has(result.code)) {
    throw new Error(result.message || `API error: ${result.code}`);
  }
  return result.data;
}

/** GET with Result API / Result API GET，回傳 data */
export async function getData<T>(
  url: string,
  params?: Record<string, unknown>,
  config: AxiosRequestConfig = {}
): Promise<T> {
  const res = await api.get<ApiResult<T>>(url, { ...config, params });
  return unwrapResult(res.data);
}

/** POST with Result API / Result API POST，回傳 data */
export async function postData<T>(
  url: string,
  data?: unknown,
  params?: Record<string, unknown>,
  config: AxiosRequestConfig = {}
): Promise<T> {
  const res = await api.post<ApiResult<T>>(url, data, { ...config, params });
  return unwrapResult(res.data);
}

/** PUT with Result API / Result API PUT，回傳 data */
export async function putData<T>(
  url: string,
  data?: unknown,
  config: AxiosRequestConfig = {}
): Promise<T> {
  const res = await api.put<ApiResult<T>>(url, data, config);
  return unwrapResult(res.data);
}

/** DELETE with Result API / Result API DELETE，回傳 data */
export async function deleteData<T>(
  url: string,
  config: AxiosRequestConfig = {}
): Promise<T> {
  const res = await api.delete<ApiResult<T>>(url, config);
  return unwrapResult(res.data);
}
