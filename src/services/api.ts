import { create } from "axios";
import type {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const statusMessage: Record<number, string> = {
  200: "成功",
  400: "錯誤請求",
  401: "未授權",
  403: "禁止訪問",
  404: "資源不存在",
  500: "伺服器錯誤",
};

/** Shared axios instance / 共用 axios 實例；各模組 API 請放 `services/apis/` */
const api: AxiosInstance = create({
  baseURL: import.meta.env.VITE_APP_API_URL,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const { response } = error;
    if (response) {
      console.warn(
        statusMessage[response.status] ?? `未知錯誤: 狀態碼 ${response.status}`
      );
    } else if (!window.navigator.onLine) {
      console.warn("網路異常,請檢查網路連線");
    }
    return Promise.reject(error);
  }
);

export default api;
