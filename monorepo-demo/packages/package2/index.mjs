import { add, minus } from "package1";

export const calc = (a, b) => {
  return minus(add(a, b), 1);
};
