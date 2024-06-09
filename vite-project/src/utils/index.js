export const isEmptyParam = (param) => {
  param !== null || param !== undefined;
};

export const timeStamp = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return `${[year, month, day].map(formatNumber).join("")}${[
    hour,
    minute,
    second,
  ]
    .map(formatNumber)
    .join("")}`;
};

export const formatTime = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return `${[year, month, day].map(formatNumber).join("/")} ${[
    hour,
    minute,
    second,
  ]
    .map(formatNumber)
    .join(":")}`;
};

const formatNumber = (n) => {
  n = n.toString();
  return n[1] ? n : `0${n}`;
};

const CIPHER_SET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * 可指定特定生成长度与指定密文的 uuid
 * @param {*Number} len 生成的 uuid 长度
 * @param {*String} cipher 提供的随机密文
 * @returns String
 */
export const uuidVariableLength = (len = 32, cipher = CIPHER_SET) => {
  let uuid = [];
  const chars = cipher.split("");

  for (var i = 0; i < len; i++) {
    uuid[i] = chars[0 | (Math.random() * chars.length)];
  }

  const time = timeStamp(new Date());

  return uuid.join("") + time;
};
