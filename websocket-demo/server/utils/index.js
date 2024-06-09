const CIPHER_SET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function generateUniqueId(len = 32, cipher = CIPHER_SET) {
  let uuid = "";
  const charts = cipher.split("");

  for (let i = 0; i < len; i++) {
    uuid += charts[0 | (Math.random() * charts.length)];
  }

  return uuid;
}

module.exports = generateUniqueId;
