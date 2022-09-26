## axios的二次封装

### 函数封装：

```js
//二次封装 request.js
import axios from "axios";
import { MessageBox, Message } from "element-ui";
import store from "@/store";
import { getToken } from "@/utils/auth";

// 创建一个axios实例
const service = axios.create({
  // env.VUE_APP_BASE_API，这是一个文件，里面存放着baseURL，通过改文件名可以更改是测试还是开发服务器
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 5000, // request timeout
});

// 请求拦截器，例如携带token就在此完成
service.interceptors.request.use(
  (config) => {
    if (store.getters.token) {
      // let each request carry token
      // ['X-Token'] is a custom headers key
      // please modify it according to the actual situation
      // config.headers['X-Token'] = getToken()
      // 下面的token才是真正的后端服务器需要的请求头token值
      config.headers["token"] = getToken();
    }
    return config;
  },
  (error) => {
    // do something with request error
    console.log(error); // for debug
    return Promise.reject(error);
  }
);

// 想要拦截器，如果返回回来的数据失败给element UI一个动画Message，增加用户体验；
service.interceptors.response.use(
  (response) => {
    const res = response.data;

    // 判断状态码
    // 除了20000或是200状态码之外的那些状态全是失败
    if (res.code !== 20000 && res.code !== 200) {
      Message({
        message: res.message || "Error",
        type: "error",
        duration: 5 * 1000,
      });

      // 50008: Illegal token; 50012: Other clients logged in; 50014: Token expired;
      // 判断状态码
      if (res.code === 50008 || res.code === 50012 || res.code === 50014) {
        // to re-login
        MessageBox.confirm(
          "You have been logged out, you can cancel to stay on this page, or log in again",
          "Confirm logout",
          {
            confirmButtonText: "Re-Login",
            cancelButtonText: "Cancel",
            type: "warning",
          }
        ).then(() => {
          store.dispatch("user/resetToken").then(() => {
            location.reload();
          });
        });
      }
      return Promise.reject(new Error(res.message || "Error"));
    } else {
      return res;
    }
  },
  (error) => {
    console.log("err" + error); // for debug
    Message({
      message: error.message,
      type: "error",
      duration: 5 * 1000,
    });
    return Promise.reject(error);
  }
);

export default service;
```

```js
// 使用
import request from '@/utils/request'

// 1. 获取一级分类列表
export function reqGetAttrList({ category1Id, category2Id, category3Id }) {
  return request({
    url: `/admin/product/attrInfoList/${category1Id}/${category2Id}/${category3Id}`,
    method: 'get'
  })
}

// 2、登录
export function login(data) {
  return request({
    // url: '/vue-admin-template/user/login',
    url: '/admin/acl/index/login',
    method: 'post',
    data
  })
}

```

全局使用 

```js
// 引入到index文件
/**
 * 此文件是用来统一处理接口函数的，收集起来之后统一挂载到Vue.prototype上
 */
// 将所有的文件中的接口函数(一个个暴露的),最终统一放到一个别名对象当中
import * as trademark from './product/trademark'
import * as attr from './product/attr'

export default {
  trademark,
  attr,
}

// main.js
// 绑定到mian.js
import API from '@/api'
Vue.prototype.$API = API

 
// 使用
// 请求给用户进行角色授权
async assignRole() {
  const userId = this.user.id
  const roleIds = this.userRoleIds.join(',')
  this.loading = true
  const result = await this.$API.user.assignRoles(userId, roleIds)
}
```



### 类封装

```js
// config.js
export const BASE_URL = "http://123.207.32.32:1888/api"
// export const BASE_URL = "http://codercba.com:1888/api"
export const TIMEOUT = 10000 


// request.js
import axios from 'axios'
import { BASE_URL, TIMEOUT } from './config'
import useMainStore from '@/stores/modules/main'

const mainStore = useMainStore()

class LINRequest {
  constructor(baseURL, timeout=10000) {
    this.instance = axios.create({
      baseURL,
      timeout
    })

    this.instance.interceptors.request.use(config => {
      // 添加loading动画效果
      mainStore.isLoading = true
      return config
    }, err => {
      return err
    })
    this.instance.interceptors.response.use(res => {
      // 关闭loading动画效果
      mainStore.isLoading = false
      return res
    }, err => {
      mainStore.isLoading = false
      return err
    })
  }

  request(config) {
    // mainStore.isLoading = true
    return new Promise((resolve, reject) => {
      this.instance.request(config).then(res => {
        // 返回一个resolve，因为resolve也是一个promise，在调用的时候就可以直接.then获取到数据
        resolve(res.data)
        // mainStore.isLoading = false
      }).catch(err => {
        reject(err)
        // mainStore.isLoading = false
      })
    })
  }

  get(config) {
    return this.request({ ...config, method: 'GET' })
  }

  post(config) {
    return this.request({ ...config, method: 'POST' })
  }

  delete(config) {
    return this.request({ ...config, method: 'DELETE' })
  }

  patch(config) {
    return this.request({ ...config, method: 'PATCH' })
  }
}

export default new LINRequest(BASE_URL, TIMEOUT)


// 使用
import LINRequest from '../request'

export function getHomeHotSuggests() {
  return LINRequest.get({ 
    url: "/home/hotSuggests" 
  })
}

export function getHomeHouselist(currentPage) {
  return LINRequest.get({
    url: "/home/houselist",
    params: {
      page: currentPage
    }
  })
}
```



### 类封装（ts）

```js
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
```

```js
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
```

```js
// type.ts
export interface Result<T> {
  code: number
  data: T
}
```

```js
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

```

