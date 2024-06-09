const { add, minus } = require("package1");

exports.calc = (a, b) => {
  return minus(add(a, b), 1);
};
