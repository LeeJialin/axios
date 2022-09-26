// config.ts
// 1.区分环境变量方式一:
// export const API_BASE_URL = 'https://coderwLIN/org/dev'
// export const API_BASE_URL = 'https://coderwLIN/org/prod'

// 2.区分环境变量方式二:
// let baseURL = ''
// if (process.env.NODE_ENV === 'production') {
//   baseURL = 'https://coderwLIN/org/prod'
// } else if (process.env.NODE_ENV === 'development') {
//   baseURL = 'https://coderwLIN/org/dev'
// } else {
//   baseURL = 'https://coderwLIN/org/test'
// }

// 3.区分环境变量方式三: 加载.env文件
export const API_BASE_URL = process.env.VUE_APP_BASE_URL

export const TIME_OUT = 10000

// request.ts
import axios from 'axios'
import type { AxiosRequestConfig, AxiosInstance, AxiosResponse } from 'axios'
import { ElLoading } from 'element-plus'
import { ILoadingInstance } from 'element-plus/lib/el-loading/src/loading.type'

interface InterceptorHooks {
  requestInterceptor?: (config: AxiosRequestConfig) => AxiosRequestConfig
  requestInterceptorCatch?: (error: any) => any

  responseInterceptor?: (response: AxiosResponse) => AxiosResponse
  responseInterceptorCatch?: (error: any) => any
}

interface LINRequestConfig extends AxiosRequestConfig {
  showLoading?: boolean
  interceptorHooks?: InterceptorHooks
}

interface LINData<T> {
  data: T
  returnCode: string
  success: boolean
}

class LINRequest {
  config: AxiosRequestConfig
  interceptorHooks?: InterceptorHooks
  showLoading: boolean
  loading?: ILoadingInstance
  instance: AxiosInstance

  constructor(options: LINRequestConfig) {
    this.config = options
    this.interceptorHooks = options.interceptorHooks
    this.showLoading = options.showLoading ?? true
    this.instance = axios.create(options)

    this.setupInterceptor()
  }

  setupInterceptor(): void {
    this.instance.interceptors.request.use(
      this.interceptorHooks?.requestInterceptor,
      this.interceptorHooks?.requestInterceptorCatch
    )
    this.instance.interceptors.response.use(
      this.interceptorHooks?.responseInterceptor,
      this.interceptorHooks?.responseInterceptorCatch
    )

    this.instance.interceptors.request.use((config) => {
      if (this.showLoading) {
        // element-puls的loading动画
        this.loading = ElLoading.service({
          lock: true,
          text: 'Loading',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })
      }
      return config
    })

    this.instance.interceptors.response.use(
      (res) => {
        this.loading?.close()
        return res
      },
      (err) => {
        this.loading?.close()
        return err
      }
    )
  }

  request<T = any>(config: LINRequestConfig): Promise<T> {
    if (!config.showLoading) {
      this.showLoading = false
    }
    return new Promise((resolve, reject) => {
      this.instance
        .request<any, LINData<T>>(config)
        .then((res) => {
          resolve(res.data)
          this.showLoading = true
        })
        .catch((err) => {
          reject(err)
          this.showLoading = true
        })
    })
  }

  get<T = any>(config: LINRequestConfig): Promise<T> {
    return this.request({ ...config, method: 'GET' })
  }

  post<T = any>(config: LINRequestConfig): Promise<T> {
    return this.request({ ...config, method: 'POST' })
  }

  delete<T = any>(config: LINRequestConfig): Promise<T> {
    return this.request({ ...config, method: 'DELETE' })
  }

  patch<T = any>(config: LINRequestConfig): Promise<T> {
    return this.request({ ...config, method: 'PATCH' })
  }
}

export default LINRequest


// type.ts
export interface Result<T> {
  code: number
  data: T
}


// index.ts
import LINRequest from './request/request'
import { API_BASE_URL, TIME_OUT } from './request/config'
import localCache from '@/utils/cache'

const LINRequest = new LINRequest({
  baseURL: API_BASE_URL,
  timeout: TIME_OUT,
  interceptorHooks: {
    requestInterceptor: (config) => {
      const token = localCache.getCache('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    requestInterceptorCatch: (err) => {
      return err
    },
    responseInterceptor: (res) => {
      return res.data
    },
    responseInterceptorCatch: (err) => {
      return err
    }
  }
})

export default LINRequest