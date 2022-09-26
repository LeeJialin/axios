// config.js
export const BASE_URL = "http://123.207.32.32:1888/api";
// export const BASE_URL = "http://codercba.com:1888/api"
export const TIMEOUT = 10000;

// request.js
import axios from "axios";
import { BASE_URL, TIMEOUT } from "./config";
import useMainStore from "@/stores/modules/main";

const mainStore = useMainStore();

class LINRequest {
  constructor(baseURL, timeout = 10000) {
    this.instance = axios.create({
      baseURL,
      timeout,
    });

    this.instance.interceptors.request.use(
      (config) => {
        // 添加loading动画效果
        mainStore.isLoading = true;
        return config;
      },
      (err) => {
        return err;
      }
    );
    this.instance.interceptors.response.use(
      (res) => {
        // 关闭loading动画效果
        mainStore.isLoading = false;
        return res;
      },
      (err) => {
        mainStore.isLoading = false;
        return err;
      }
    );
  }

  request(config) {
    // mainStore.isLoading = true
    return new Promise((resolve, reject) => {
      this.instance
        .request(config)
        .then((res) => {
          // 返回一个resolve，因为resolve也是一个promise，在调用的时候就可以直接.then获取到数据
          resolve(res.data);
          // mainStore.isLoading = false
        })
        .catch((err) => {
          reject(err);
          // mainStore.isLoading = false
        });
    });
  }

  get(config) {
    return this.request({ ...config, method: "GET" });
  }

  post(config) {
    return this.request({ ...config, method: "POST" });
  }

  delete(config) {
    return this.request({ ...config, method: "DELETE" });
  }

  patch(config) {
    return this.request({ ...config, method: "PATCH" });
  }
}

export default new LINRequest(BASE_URL, TIMEOUT);

// 使用
import LINRequest from "../request";

export function getHomeHotSuggests() {
  return LINRequest.get({
    url: "/home/hotSuggests",
  });
}

export function getHomeHouselist(currentPage) {
  return LINRequest.get({
    url: "/home/houselist",
    params: {
      page: currentPage,
    },
  });
}
