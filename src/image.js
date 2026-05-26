const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");

const TEMPLATE_PATH = path.join(ROOT, "assets", "calendar-template.png");
const STAMP_PATH = path.join(ROOT, "assets", "stamp-attend.png");
const FONT_PATH = path.join(ROOT, "assets", "fonts", "cute-font.ttf");

const BASE_WIDTH = 1493;
const BASE_HEIGHT = 1053;

// 이 값들이 실제 달력 격자의 바깥쪽 기준입니다.
// 기준 이미지: 1493 x 1053
const BASE_GRID = {
  left: 68,
  top: 219,
  right: 1416,
  bottom: 1018,
};

function sx(width, value) {
  return (value / BASE_WIDTH) * width;
}

function sy(height, value) {
  return (value / BASE_HEIGHT) * height;
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

function getGrid(width, height) {
  const left = sx(width, BASE_GRID.left);
  const top = sy(height, BASE_GRID.top);
  const right = sx(width, BASE_GRID.right);
  const bottom = sy(height, BASE_GRID.bottom);

  const cellW = (right - left) / 7;
  const cellH = (bottom - top) / 6;

  return {
    left,
    top,
    right,
    bottom,
    cellW,
    cellH,
  };
}

function makeTextLayer({ year, month, width, height }) {
  const fontBase64 = fs.readFileSync(FONT_PATH).toString("base64");
  const days = getCalendarLayout(year, month);
  const grid = getGrid(width, height);

  const dateFontSize = Math.round(sx(width, 30));
  const titleFontSize = Math.round(sx(width, 64));

  const dateTexts = days
    .map(({ day, row, col }) => {
      const cellX = grid.left + col * grid.cellW;
      const cellY = grid.top + row * grid.cellH;

      // 날짜는 각 칸의 좌상단, 고양이 아이콘 오른쪽 아래
      const x = cellX + sx(width, 70);
      const y = cellY + sy(height, 44);

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
        y="${sy(height, 100)}"
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
  const normalStampSize = Math.round(sx(width, 82));
  const todayStampSize = Math.round(sx(width, 98));

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

  const grid = getGrid(width, height);
  const days = getCalendarLayout(year, month);
  const composites = [];

  for (const { day, row, col } of days) {
    if (!attendedDays.includes(day)) continue;

    const isToday = today && day === today;
    const stampBuffer = isToday ? todayStamp : normalStamp;
    const stampSize = isToday ? todayStampSize : normalStampSize;

    const cellX = grid.left + col * grid.cellW;
    const cellY = grid.top + row * grid.cellH;

    // 도장은 칸 내부 중앙보다 살짝 아래쪽
    const centerX = cellX + grid.cellW * 0.5;
    const centerY = cellY + grid.cellH * 0.62;

    composites.push({
      input: stampBuffer,
      left: Math.round(centerX - stampSize / 2),
      top: Math.round(centerY - stampSize / 2),
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
