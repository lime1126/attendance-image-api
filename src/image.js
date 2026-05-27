const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");

const FONT_PATH = path.join(ROOT, "assets", "fonts", "cute-font.ttf");

const DEFAULT_THEME_KEY = "purple";

/**
 * 테마 정보
 * 폴더명과 themeKey가 같아야 함.
 *
 * assets/
 * ├─ blue/
 * │  ├─ calendar-template.png
 * │  └─ stamp-attend.png
 * ├─ pink/
 * │  ├─ calendar-template.png
 * │  └─ stamp-attend.png
 * ├─ beige/
 * │  ├─ calendar-template.png
 * │  └─ stamp-attend.png
 * └─ purple/
 *    ├─ calendar-template.png
 *    └─ stamp-attend.png
 */
const THEMES = {
  purple: {
    name: "퍼플",
    titleColor: "#6373C7",
    dateColor: "#6373C7",
  },
  blue: {
    name: "블루",
    titleColor: "#4AA3F5",
    dateColor: "#4AA3F5",
  },
  pink: {
    name: "핑크",
    titleColor: "#F47FA7",
    dateColor: "#F47FA7",
  },
  beige: {
    name: "베이지",
    titleColor: "#C9823A",
    dateColor: "#C9823A",
  },
};

/**
 * 퍼플 기준으로 잡았던 좌표.
 * 다른 테마도 일단 같은 형태로 넣어두고,
 * 나중에 테마별로 숫자만 조금씩 고치면 됨.
 *
 * 핵심:
 * - baseWidth/baseHeight는 해당 테마 이미지 원본 크기 기준
 * - cellPositions는 해당 원본 크기에서의 도장 중심 좌표
 * - dateOffset은 도장 중심 기준 날짜 위치
 */
const THEME_LAYOUTS = {
  purple: {
    baseWidth: 1493,
    baseHeight: 1053,

    titleY: 138,

    dateOffsetX: -28,
    dateOffsetY: -38,

    normalStampSize: 112,
    todayStampSize: 126,

    cellPositions: [
      [
        { x: 167, y: 294 },
        { x: 367, y: 294 },
        { x: 566, y: 294 },
        { x: 765, y: 294 },
        { x: 963, y: 294 },
        { x: 1161, y: 294 },
        { x: 1358, y: 294 },
      ],
      [
        { x: 167, y: 434 },
        { x: 367, y: 434 },
        { x: 566, y: 434 },
        { x: 765, y: 434 },
        { x: 963, y: 434 },
        { x: 1161, y: 434 },
        { x: 1358, y: 434 },
      ],
      [
        { x: 167, y: 575 },
        { x: 367, y: 575 },
        { x: 566, y: 575 },
        { x: 765, y: 575 },
        { x: 963, y: 575 },
        { x: 1161, y: 575 },
        { x: 1358, y: 575 },
      ],
      [
        { x: 167, y: 715 },
        { x: 367, y: 715 },
        { x: 566, y: 715 },
        { x: 765, y: 715 },
        { x: 963, y: 715 },
        { x: 1161, y: 715 },
        { x: 1358, y: 715 },
      ],
      [
        { x: 167, y: 855 },
        { x: 367, y: 855 },
        { x: 566, y: 855 },
        { x: 765, y: 855 },
        { x: 963, y: 855 },
        { x: 1161, y: 855 },
        { x: 1358, y: 855 },
      ],
      [
        { x: 167, y: 995 },
        { x: 367, y: 995 },
        { x: 566, y: 995 },
        { x: 765, y: 995 },
        { x: 963, y: 995 },
        { x: 1161, y: 995 },
        { x: 1358, y: 995 },
      ],
    ],
  },

  blue: {
    baseWidth: 1493,
    baseHeight: 1053,

    titleY: 138,

    dateOffsetX: -28,
    dateOffsetY: -38,

    normalStampSize: 112,
    todayStampSize: 126,

    cellPositions: [
      [
        { x: 167, y: 294 },
        { x: 367, y: 294 },
        { x: 566, y: 294 },
        { x: 765, y: 294 },
        { x: 963, y: 294 },
        { x: 1161, y: 294 },
        { x: 1358, y: 294 },
      ],
      [
        { x: 167, y: 434 },
        { x: 367, y: 434 },
        { x: 566, y: 434 },
        { x: 765, y: 434 },
        { x: 963, y: 434 },
        { x: 1161, y: 434 },
        { x: 1358, y: 434 },
      ],
      [
        { x: 167, y: 575 },
        { x: 367, y: 575 },
        { x: 566, y: 575 },
        { x: 765, y: 575 },
        { x: 963, y: 575 },
        { x: 1161, y: 575 },
        { x: 1358, y: 575 },
      ],
      [
        { x: 167, y: 715 },
        { x: 367, y: 715 },
        { x: 566, y: 715 },
        { x: 765, y: 715 },
        { x: 963, y: 715 },
        { x: 1161, y: 715 },
        { x: 1358, y: 715 },
      ],
      [
        { x: 167, y: 855 },
        { x: 367, y: 855 },
        { x: 566, y: 855 },
        { x: 765, y: 855 },
        { x: 963, y: 855 },
        { x: 1161, y: 855 },
        { x: 1358, y: 855 },
      ],
      [
        { x: 167, y: 995 },
        { x: 367, y: 995 },
        { x: 566, y: 995 },
        { x: 765, y: 995 },
        { x: 963, y: 995 },
        { x: 1161, y: 995 },
        { x: 1358, y: 995 },
      ],
    ],
  },

  pink: {
    baseWidth: 1493,
    baseHeight: 1053,

    titleY: 138,

    dateOffsetX: -28,
    dateOffsetY: -38,

    normalStampSize: 112,
    todayStampSize: 126,

    cellPositions: [
      [
        { x: 167, y: 294 },
        { x: 367, y: 294 },
        { x: 566, y: 294 },
        { x: 765, y: 294 },
        { x: 963, y: 294 },
        { x: 1161, y: 294 },
        { x: 1358, y: 294 },
      ],
      [
        { x: 167, y: 434 },
        { x: 367, y: 434 },
        { x: 566, y: 434 },
        { x: 765, y: 434 },
        { x: 963, y: 434 },
        { x: 1161, y: 434 },
        { x: 1358, y: 434 },
      ],
      [
        { x: 167, y: 575 },
        { x: 367, y: 575 },
        { x: 566, y: 575 },
        { x: 765, y: 575 },
        { x: 963, y: 575 },
        { x: 1161, y: 575 },
        { x: 1358, y: 575 },
      ],
      [
        { x: 167, y: 715 },
        { x: 367, y: 715 },
        { x: 566, y: 715 },
        { x: 765, y: 715 },
        { x: 963, y: 715 },
        { x: 1161, y: 715 },
        { x: 1358, y: 715 },
      ],
      [
        { x: 167, y: 855 },
        { x: 367, y: 855 },
        { x: 566, y: 855 },
        { x: 765, y: 855 },
        { x: 963, y: 855 },
        { x: 1161, y: 855 },
        { x: 1358, y: 855 },
      ],
      [
        { x: 167, y: 995 },
        { x: 367, y: 995 },
        { x: 566, y: 995 },
        { x: 765, y: 995 },
        { x: 963, y: 995 },
        { x: 1161, y: 995 },
        { x: 1358, y: 995 },
      ],
    ],
  },

  beige: {
    // 네가 말한 대로 beige는 사이즈가 다를 수 있어서 따로 둠.
    // 실제 파일이 1492 x 1054면 이 값 유지.
    // 만약 나중에 1493 x 1053으로 맞추면 여기만 바꾸면 됨.
    baseWidth: 1492,
    baseHeight: 1054,

    titleY: 138,

    dateOffsetX: -28,
    dateOffsetY: -38,

    normalStampSize: 112,
    todayStampSize: 126,

    cellPositions: [
      [
        { x: 167, y: 294 },
        { x: 367, y: 294 },
        { x: 566, y: 294 },
        { x: 765, y: 294 },
        { x: 963, y: 294 },
        { x: 1161, y: 294 },
        { x: 1358, y: 294 },
      ],
      [
        { x: 167, y: 434 },
        { x: 367, y: 434 },
        { x: 566, y: 434 },
        { x: 765, y: 434 },
        { x: 963, y: 434 },
        { x: 1161, y: 434 },
        { x: 1358, y: 434 },
      ],
      [
        { x: 167, y: 575 },
        { x: 367, y: 575 },
        { x: 566, y: 575 },
        { x: 765, y: 575 },
        { x: 963, y: 575 },
        { x: 1161, y: 575 },
        { x: 1358, y: 575 },
      ],
      [
        { x: 167, y: 715 },
        { x: 367, y: 715 },
        { x: 566, y: 715 },
        { x: 765, y: 715 },
        { x: 963, y: 715 },
        { x: 1161, y: 715 },
        { x: 1358, y: 715 },
      ],
      [
        { x: 167, y: 855 },
        { x: 367, y: 855 },
        { x: 566, y: 855 },
        { x: 765, y: 855 },
        { x: 963, y: 855 },
        { x: 1161, y: 855 },
        { x: 1358, y: 855 },
      ],
      [
        { x: 167, y: 995 },
        { x: 367, y: 995 },
        { x: 566, y: 995 },
        { x: 765, y: 995 },
        { x: 963, y: 995 },
        { x: 1161, y: 995 },
        { x: 1358, y: 995 },
      ],
    ],
  },
};

function getSafeThemeKey(themeKey) {
  if (!themeKey || !THEMES[themeKey]) {
    return DEFAULT_THEME_KEY;
  }

  return themeKey;
}

function getTheme(themeKey) {
  const safeThemeKey = getSafeThemeKey(themeKey);
  return THEMES[safeThemeKey];
}

function getThemeLayout(themeKey) {
  const safeThemeKey = getSafeThemeKey(themeKey);
  return THEME_LAYOUTS[safeThemeKey] || THEME_LAYOUTS[DEFAULT_THEME_KEY];
}

function getThemePaths(themeKey) {
  const safeThemeKey = getSafeThemeKey(themeKey);

  return {
    themeKey: safeThemeKey,
    templatePath: path.join(
      ROOT,
      "assets",
      safeThemeKey,
      "calendar-template.png"
    ),
    stampPath: path.join(
      ROOT,
      "assets",
      safeThemeKey,
      "stamp-attend.png"
    ),
  };
}

function getAvailableThemes() {
  return Object.entries(THEMES).map(([themeKey, theme]) => ({
    themeKey,
    themeName: theme.name,
    titleColor: theme.titleColor,
    dateColor: theme.dateColor,
  }));
}

function sx(layout, width, value) {
  return (value / layout.baseWidth) * width;
}

function sy(layout, height, value) {
  return (value / layout.baseHeight) * height;
}

function scalePoint(layout, width, height, point) {
  return {
    x: sx(layout, width, point.x),
    y: sy(layout, height, point.y),
  };
}

function getMonthName(month) {
  return [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ][month - 1];
}

function getCalendarLayout(year, month) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const lastDate = new Date(year, month, 0).getDate();

  const days = [];

  for (let day = 1; day <= lastDate; day++) {
    const index = firstDay + day - 1;

    days.push({
      day,
      row: Math.floor(index / 7),
      col: index % 7,
    });
  }

  return days;
}

function makeTextLayer({
  year,
  month,
  width,
  height,
  themeKey,
}) {
  const safeThemeKey = getSafeThemeKey(themeKey);
  const theme = getTheme(safeThemeKey);
  const layout = getThemeLayout(safeThemeKey);

  const fontBase64 = fs.readFileSync(FONT_PATH).toString("base64");
  const days = getCalendarLayout(year, month);

  const dateFontSize = Math.round(sx(layout, width, 30));
  const titleFontSize = Math.round(sx(layout, width, 64));

  const dateTexts = days
    .map(({ day, row, col }) => {
      const center = scalePoint(
        layout,
        width,
        height,
        layout.cellPositions[row][col]
      );

      const x = center.x + sx(layout, width, layout.dateOffsetX);
      const y = center.y + sy(layout, height, layout.dateOffsetY);

      return `
        <text
          x="${x}"
          y="${y}"
          font-family="CuteFont, Arial, sans-serif"
          font-size="${dateFontSize}"
          fill="${theme.dateColor}"
          text-anchor="middle"
        >${day}</text>
      `;
    })
    .join("");

  const title = `${getMonthName(month)} ${year}`;

  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @font-face {
            font-family: "CuteFont";
            src: url(data:font/truetype;charset=utf-8;base64,${fontBase64});
          }
        </style>
      </defs>

      <text
        x="${width * 0.5}"
        y="${sy(layout, height, layout.titleY)}"
        text-anchor="middle"
        font-family="CuteFont, Arial, sans-serif"
        font-size="${titleFontSize}"
        fill="${theme.titleColor}"
      >${title}</text>

      ${dateTexts}
    </svg>
  `);
}

async function makeStampComposites({
  width,
  height,
  year,
  month,
  attendedDays,
  today,
  themeKey,
  stampPath,
}) {
  const safeThemeKey = getSafeThemeKey(themeKey);
  const layout = getThemeLayout(safeThemeKey);

  const normalStampSize = Math.round(
    sx(layout, width, layout.normalStampSize)
  );
  const todayStampSize = Math.round(
    sx(layout, width, layout.todayStampSize)
  );

  const normalStamp = await sharp(stampPath)
    .resize({
      width: normalStampSize,
      height: normalStampSize,
      fit: "contain",
    })
    .png()
    .toBuffer();

  const todayStamp = await sharp(stampPath)
    .resize({
      width: todayStampSize,
      height: todayStampSize,
      fit: "contain",
    })
    .png()
    .toBuffer();

  const days = getCalendarLayout(year, month);
  const composites = [];

  for (const { day, row, col } of days) {
    if (!attendedDays.includes(day)) continue;

    const center = scalePoint(
      layout,
      width,
      height,
      layout.cellPositions[row][col]
    );

    const isToday = today && day === today;
    const stampBuffer = isToday ? todayStamp : normalStamp;
    const stampSize = isToday ? todayStampSize : normalStampSize;

    composites.push({
      input: stampBuffer,
      left: Math.round(center.x - stampSize / 2),
      top: Math.round(center.y - stampSize / 2),
    });
  }

  return composites;
}

async function generateAttendanceImage({
  year,
  month,
  today,
  attendedDays,
  themeKey = DEFAULT_THEME_KEY,
}) {
  const { themeKey: safeThemeKey, templatePath, stampPath } =
    getThemePaths(themeKey);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`assets/${safeThemeKey}/calendar-template.png 파일이 없습니다.`);
  }

  if (!fs.existsSync(stampPath)) {
    throw new Error(`assets/${safeThemeKey}/stamp-attend.png 파일이 없습니다.`);
  }

  if (!fs.existsSync(FONT_PATH)) {
    throw new Error("assets/fonts/cute-font.ttf 파일이 없습니다.");
  }

  const metadata = await sharp(templatePath).metadata();

  const width = metadata.width;
  const height = metadata.height;

  const textLayer = makeTextLayer({
    year,
    month,
    width,
    height,
    themeKey: safeThemeKey,
  });

  const stampComposites = await makeStampComposites({
    width,
    height,
    year,
    month,
    attendedDays,
    today,
    themeKey: safeThemeKey,
    stampPath,
  });

  return sharp(templatePath)
    .composite([
      {
        input: textLayer,
        left: 0,
        top: 0,
      },
      ...stampComposites,
    ])
    .png()
    .toBuffer();
}

module.exports = {
  generateAttendanceImage,
  getAvailableThemes,
  getSafeThemeKey,
};
