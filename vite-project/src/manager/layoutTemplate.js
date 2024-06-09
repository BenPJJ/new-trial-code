const LAYOUT_TEMPLATE_ONE = {
  ONE_PERSON_STYLE: "width: 100%;height: 100%;",
  TWO_PERSON_STYLE: "width: 50%;height: 100%;",
  THREE_PERSON_FIRST_STYLE: "width: 50%;height: 100%;",
  THREE_PERSON_SECOND_STYLE: "width: 50%;height: 50%;",
  FOUR_PERSON_STYLE: "width: 50%;height: 50%;",
  FIVE_PERSON_FIRST_STYLE: "width: 50%;height: 50%;",
  FIVE_PERSON_SECOND_STYLE: "width: 33.33%;height: 50%;",
  SIX_PERSON_STYLE: "width: 33.33%;height: 50%;",
};

const LAYOUT_TEMPLATE_TWO = {
  ONE_PERSON_STYLE: "width: 100%;height: 100%;",
  TWO_PERSON_STYLE: "width: 50%;height: 100%;",
  THREE_PERSON_STYLE: "width: 33.3%;height: 100%;",
  FOUR_PERSON_STYLE: "width: 50%;height: 50%;",
  FIVE_PERSON_STYLE: "width: 33.3%;height: 50%;",
  SIX_PERSON_STYLE: "width: 33.33%;height: 50%;",
};

const LAYOUT_TEMPLATE_THREE = {
  PERSON_STYLE: "width: 16.6%;height: 100%;",
};

const LAYOUT_TEMPLATE = {
  1: {
    0: {
      styleArr: "0",
      firstStyle: LAYOUT_TEMPLATE_ONE.ONE_PERSON_STYLE,
      secondStyle: "",
    },
    1: {
      styleArr: "00",
      firstStyle: LAYOUT_TEMPLATE_ONE.TWO_PERSON_STYLE,
      secondStyle: "",
    },
    2: {
      styleArr: "011",
      firstStyle: LAYOUT_TEMPLATE_ONE.THREE_PERSON_FIRST_STYLE,
      secondStyle: LAYOUT_TEMPLATE_ONE.THREE_PERSON_SECOND_STYLE,
    },
    3: {
      styleArr: "0000",
      firstStyle: LAYOUT_TEMPLATE_ONE.FOUR_PERSON_STYLE,
      secondStyle: "",
    },
    4: {
      styleArr: "00111",
      firstStyle: LAYOUT_TEMPLATE_ONE.FIVE_PERSON_FIRST_STYLE,
      secondStyle: LAYOUT_TEMPLATE_ONE.FIVE_PERSON_SECOND_STYLE,
    },
    5: {
      styleArr: "000000",
      firstStyle: LAYOUT_TEMPLATE_ONE.SIX_PERSON_STYLE,
      secondStyle: "",
    },
  },
  2: {
    0: {
      styleArr: "0",
      firstStyle: LAYOUT_TEMPLATE_TWO.ONE_PERSON_STYLE,
      secondStyle: "",
    },
    1: {
      styleArr: "00",
      firstStyle: LAYOUT_TEMPLATE_TWO.TWO_PERSON_STYLE,
      secondStyle: "",
    },
    2: {
      styleArr: "000",
      firstStyle: LAYOUT_TEMPLATE_TWO.THREE_PERSON_STYLE,
      secondStyle: "",
    },
    3: {
      styleArr: "0000",
      firstStyle: LAYOUT_TEMPLATE_TWO.FOUR_PERSON_STYLE,
      secondStyle: "",
    },
    4: {
      styleArr: "00000",
      firstStyle: LAYOUT_TEMPLATE_TWO.FIVE_PERSON_STYLE,
      secondStyle: "",
    },
    5: {
      styleArr: "000000",
      firstStyle: LAYOUT_TEMPLATE_TWO.SIX_PERSON_STYLE,
      secondStyle: "",
    },
  },
  3: {
    0: {
      styleArr: "0",
      firstStyle: LAYOUT_TEMPLATE_THREE.PERSON_STYLE,
      secondStyle: "",
    },
    1: {
      styleArr: "00",
      firstStyle: LAYOUT_TEMPLATE_THREE.PERSON_STYLE,
      secondStyle: "",
    },
    2: {
      styleArr: "000",
      firstStyle: LAYOUT_TEMPLATE_THREE.PERSON_STYLE,
      secondStyle: "",
    },
    3: {
      styleArr: "0000",
      firstStyle: LAYOUT_TEMPLATE_THREE.PERSON_STYLE,
      secondStyle: "",
    },
    4: {
      styleArr: "00000",
      firstStyle: LAYOUT_TEMPLATE_THREE.PERSON_STYLE,
      secondStyle: "",
    },
    5: {
      styleArr: "000000",
      firstStyle: LAYOUT_TEMPLATE_THREE.PERSON_STYLE,
      secondStyle: "",
    },
  },
};

/**
 *
 * @param {Number} type 模版类型
 * @param {Number} total 用户数量
 * @returns
 */
export function getVideoStyle(type, total) {
  if (typeof type !== "number" || !LAYOUT_TEMPLATE[type])
    return new Error("参数错误");

  const layoutTemplate = LAYOUT_TEMPLATE[type];
  const firstStyle = layoutTemplate[total].firstStyle || "";
  const secondStyle = layoutTemplate[total].secondStyle || "";
  const styleArr = layoutTemplate[total].styleArr || ""; // 模版样式，0-第一种样式 1-第二种样式

  const videoStyle = [];

  for (let i = 0; i < styleArr.length; i++) {
    if (styleArr[i] === "0") {
      videoStyle.push(firstStyle);
    } else if (styleArr[i] === "1") {
      videoStyle.push(secondStyle);
    }
  }

  return videoStyle;
}
