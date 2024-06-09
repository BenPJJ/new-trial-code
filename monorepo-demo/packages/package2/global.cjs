const pk1 = require("package1/global");

module.exports = {
  calc(a, b) {
    return pk1.minus(pk1.add(a, b), 1);
  },
};
