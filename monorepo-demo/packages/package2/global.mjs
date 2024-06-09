import pk1 from "package1/global";

export default {
  calc(a, b) {
    return pk1.minus(pk1.add(a, b), 1);
  },
};
