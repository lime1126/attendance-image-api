const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");

const TEMPLATE_PATH = path.join(ROOT, "assets", "calendar-template.png");
const STAMP_PATH = path.join(ROOT, "assets", "stamp-attend.png");
const FONT_PATH = path.join(ROOT, "assets", "fonts", "cute-font.ttf");

/**
 * 기준 이미지 크기
 * 현재 달력 템플릿 기준
 */
const BASE_WIDTH = 1536;
const BASE_HEIGHT = 1083;

/**
 * 7열 x 6행 전체 칸별 도장 중심 좌표
 *
 * col:
 * 0 = SUN
 * 1 = MON
 * 2 = TUE
 * 3 = WED
 * 4 = THU
 * 5 = FRI
 * 6 = SAT
 */
const CELL_POSITIONS = [
  [
    { x: 167, y: 294 },   // row 0, SUN
    { x: 367, y: 294 },   // row 0, MON
    { x: 566, y: 294 },   // row 0, TUE
    { x: 765, y: 294 },   // row 0, WED
    { x: 963, y: 294 },   // row 0, THU
    { x: 1161, y: 294 },  // row 0, FRI
    { x: 1358, y: 294 },  // row 0, SAT
  ],
  [
    { x: 167, y: 434 },   // row 1, SUN
    { x: 367, y: 434 },   // row 1, MON
    { x: 566, y: 434 },   // row 1, TUE
    { x: 765, y: 434 },   // row 1, WED
    { x: 963, y: 434 },   // row 1, THU
    { x: 1161, y: 434 },  // row 1, FRI
    { x: 1358, y: 434 },  // row 1, SAT
  ],
  [
    { x: 167, y: 575 },   // row 2, SUN
    { x: 367, y: 575 },   // row 2, MON
    { x: 566, y: 575 },   // row 2, TUE
    { x: 765, y: 575 },   // row 2, WED
    { x: 963, y: 575 },   // row 2, THU
    { x: 1161, y: 575 },  // row 2, FRI
    { x: 1358, y: 575 },  // row 2, SAT
  ],
  [
    { x: 167, y: 715 },   // row 3, SUN
    { x: 367, y: 715 },   // row 3, MON
    { x: 566, y: 715 },   // row 3, TUE
    { x: 765, y: 715 },   // row 3, WED
    { x: 963, y: 715 },   // row 3, THU
    { x: 1161, y: 715 },  // row 3, FRI
    { x: 1358, y: 715 },  // row 3, SAT
  ],
  [
    { x: 167, y: 855 },   // row 4, SUN
    { x: 367, y: 855 },   // row 4, MON
    { x: 566, y: 855 },   // row 4, TUE
    { x: 765, y: 855 },   // row 4, WED
    { x: 963, y: 855 },   // row 4, THU
    { x: 1161, y: 855 },  // row 4, FRI
    { x: 1358, y: 855 },  // row 4, SAT
  ],
  [
    { x: 167, y: 995 },   // row 5, SUN
    { x: 367, y: 995 },   // row 5, MON
    { x: 566, y: 995 },   // row 5, TUE
    { x: 765, y: 995 },   // row 5, WED
    { x: 963, y: 995 },   // row 5, THU
    { x: 1161, y: 995 },  // row 5, FRI
    { x: 1358, y: 995 },  // row 5, SAT
  ],
];

/**
 * 숫자 위치
 * - 왼쪽으로 조금 이동
 * - 아래로 조금 이동
 */
const DATE_OFFSET_X = -28;
const DATE_OFFSET_Y = -38;

/**
 * 도장 크기
 * 27일 버전 느낌에서 조금 더 키운 값
 */
const NORMAL_STAMP_SIZE = 112;
const TODAY_STAMP_SIZE = 126;

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

function makeTextLayer({ year, month, width, height }) {
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
          fill="#6373C7"
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
        y="${sy(height, 120)}"
        text-anchor="middle"
        font-family="CuteFont, Arial, sans-serif"
        font-size="${titleFontSize}"
        fill="#6373C7"
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
}) {
  const normalStampSize = Math.round(sx(width, NORMAL_STAMP_SIZE));
  const todayStampSize = Math.round(sx(width, TODAY_STAMP_SIZE));

  const normalStamp = await sharp(STAMP_PATH)
    .resize({
      width: normalStampSize,
      height: normalStampSize,
      fit: "contain",
    })
    .png()
    .toBuffer();

  const todayStamp = await sharp(STAMP_PATH)
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
}) {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error("assets/calendar-template.png 파일이 없습니다.");
  }

  if (!fs.existsSync(STAMP_PATH)) {
    throw new Error("assets/stamp-attend.png 파일이 없습니다.");
  }

  if (!fs.existsSync(FONT_PATH)) {
    throw new Error("assets/fonts/cute-font.ttf 파일이 없습니다.");
  }

  const metadata = await sharp(TEMPLATE_PATH).metadata();

  const width = metadata.width;
  const height = metadata.height;

  const textLayer = makeTextLayer({
    year,
    month,
    width,
    height,
  });

  const stampComposites = await makeStampComposites({
    width,
    height,
    year,
    month,
    attendedDays,
    today,
  });

  return sharp(TEMPLATE_PATH)
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
};
