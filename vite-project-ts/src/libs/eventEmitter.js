//发布订阅模式
class EventEmitter {
  constructor() {
    //维护一个对象
    this._events = {};
  }
  on(eventName, callback) {
    if (this._events[eventName]) {
      //如果有就放一个新的
      this._events[eventName].push(callback);
    } else {
      //如果没有就创建一个数组
      this._events[eventName] = [callback];
    }
  }
  emit(eventName, ...rest) {
    if (this._events[eventName]) {
      //循环一次执行
      this._events[eventName].forEach((item) => {
        item.call(this, ...rest);
      });
    }
  }
  removeListener(eventName, callback) {
    if (this._events[eventName]) {
      if (callback) {
        //当前数组和传递过来的callback相等则移除掉
        this._events[eventName] = this._events[eventName].filter(
          (item) => item !== callback
        );
      } else {
        this._events[eventName] = [];
      }
    }
  }
  once(eventName, callback) {
    function one() {
      //在one函数运行原来的函数，只有将one清空
      callback.apply(this, arguments);
      //先绑定 执行后再删除
      this.removeListener(eventName, one);
    }
    //此时emit触发会执行此函数，会给这个函数传递rest参数
    this.on(eventName, one);
  }
  clear() {
    this._events = {};
  }

  removeAll() {
    this._events = {};
  }
}

export default EventEmitter;
