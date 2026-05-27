const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");

const FONT_PATH = path.join(ROOT, "assets", "fonts", "cute-font.ttf");

/**
 * 지원 테마 목록
 * 폴더명과 themeKey가 같아야 함.
 */
const THEMES = {
  blue: {
    name: "블루",
    titleColor: "#6373C7",
    dateColor: "#6373C7",
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
  purple: {
    name: "퍼플",
    titleColor: "#9A7BEA",
    dateColor: "#9A7BEA",
  },
};

const DEFAULT_THEME_KEY = "blue";

/**
 * 기준 이미지 크기
 * 현재 달력 템플릿 기준
 */
const BASE_WIDTH = 1536;
const BASE_HEIGHT = 1083;

/**
 * 7열 x 6행 전체 칸별 도장 중심 좌표
 */
const CELL_POSITIONS = [
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
];

/**
 * 숫자 위치
 */
const DATE_OFFSET_X = -28;
const DATE_OFFSET_Y = -38;

/**
 * 도장 크기
 */
const NORMAL_STAMP_SIZE = 112;
const TODAY_STAMP_SIZE = 126;

/**
 * 제목 위치
 */
const TITLE_Y = 138;

function sx(width, value) {
  return (value / BASE_WIDTH) * width;
}

function sy(height, value) {
  return (value / BASE_HEIGHT) * height;
}

function scalePoint(width, height, point) {
  return {
    x: sx(width, point.x),
    y: sy(height, point.y),
  };
}

function getSafeThemeKey(themeKey) {
  if (!themeKey || !THEMES[themeKey]) {
    return DEFAULT_THEME_KEY;
  }

  return themeKey;
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
  const theme = THEMES[safeThemeKey];

  const fontBase64 = fs.readFileSync(FONT_PATH).toString("base64");
  const days = getCalendarLayout(year, month);

  const dateFontSize = Math.round(sx(width, 30));
  const titleFontSize = Math.round(sx(width, 64));

  const dateTexts = days
    .map(({ day, row, col }) => {
      const center = scalePoint(width, height, CELL_POSITIONS[row][col]);

      const x = center.x + sx(width, DATE_OFFSET_X);
      const y = center.y + sy(height, DATE_OFFSET_Y);

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
        y="${sy(height, TITLE_Y)}"
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
  stampPath,
}) {
  const normalStampSize = Math.round(sx(width, NORMAL_STAMP_SIZE));
  const todayStampSize = Math.round(sx(width, TODAY_STAMP_SIZE));

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

    const center = scalePoint(width, height, CELL_POSITIONS[row][col]);

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
