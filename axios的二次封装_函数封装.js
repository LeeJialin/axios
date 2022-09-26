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


// 使用1：单独封装请求函数
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

// 使用2：全局使用
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

