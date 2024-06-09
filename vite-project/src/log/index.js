import { formatTime } from "../utils/index";

let api = "https://alivereport.xiaoeknow.com/report/alive_information";

class Log {
  #options = null;
  #request = null;
  #trackList = [];
  constructor() {}

  init({ options, request }) {
    this.#options = options;
    this.#request = request;

    api += `?kpiClient=${options.kpi_client}&version`;
  }

  #send(params = {}) {
    try {
      const {
        app_id,
        alive_id,
        user_id,
        kpi_client,
        platform,
        alive_mode,
        user_type,
        universal_union_id,
      } = this.#options;
      const defaultParams = {
        kpi_topic: "alive:voice",
        kpi_key: "",
        app_id,
        alive_id,
        user_id,
        trace_id: "",
        kpi_client,
        params: {},
      };

      Object.assign(defaultParams, params);

      defaultParams.params.time_str = formatTime(new Date());
      defaultParams.params.platform = platform;
      defaultParams.params.alive_mode = alive_mode;
      defaultParams.params.user_type = user_type;
      defaultParams.params.universal_union_id = universal_union_id;

      for (const key in defaultParams.params) {
        const value = defaultParams.params[key];
        defaultParams.params[key] =
          typeof value !== "string"
            ? typeof value === "object"
              ? JSON.stringify(value)
              : "" + value
            : value;
      }

      return this.#request.post(api, defaultParams);
    } catch (error) {
      console.error("[liveVoice] 日志上报异常", error);
      return Promise.reject();
    }
  }

  // 通用上报
  sendReport(params) {
    this.#send(params);
  }

  // 连麦业务上报
  sendFsmReport(params) {
    this.#send({
      kpi_key: "voiceFsm",
      params,
    });
  }

  // 轨迹上报
  addTrackReport(log, needReport = false) {
    this.#trackList.push(log);

    if (needReport) {
      this.#send({
        kpi_key: "voice-track",
      }).then(() => {
        this.#trackList = [];
      });
    }
  }

  destroyed() {
    this.#options = null;
    this.#request = null;
  }
}

export default new Log();
