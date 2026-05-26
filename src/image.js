const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");

const TEMPLATE_PATH = path.join(ROOT, "assets", "calendar-template.png");
const STAMP_PATH = path.join(ROOT, "assets", "stamp-attend.png");
const FONT_PATH = path.join(ROOT, "assets", "fonts", "cute-font.ttf");

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

  /*
    템플릿 이미지 기준 좌표입니다.
    나중에 날짜 위치가 살짝 안 맞으면 여기만 조정하면 됩니다.
  */
  const grid = {
    startX: width * 0.082,
    startY: height * 0.245,
    cellW: width * 0.127,
    cellH: height * 0.126,
  };

  const dateTexts = days
    .map(({ day, row, col }) => {
      const x = grid.startX + col * grid.cellW + grid.cellW * 0.16;
      const y = grid.startY + row * grid.cellH + grid.cellH * 0.34;

      return `
        <text
          x="${x}"
          y="${y}"
          font-family="CuteFont"
          font-size="${Math.round(width * 0.03)}"
          fill="#6373C7"
        >${day}</text>
      `;
    })
    .join("");

  const title = `${year}년 ${month}월 출석표`;

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
        y="${height * 0.095}"
        text-anchor="middle"
        font-family="CuteFont"
        font-size="${Math.round(width * 0.045)}"
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
  const normalStampSize = Math.round(width * 0.078);
  const todayStampSize = Math.round(width * 0.095);

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

  const grid = {
    startX: width * 0.082,
    startY: height * 0.245,
    cellW: width * 0.127,
    cellH: height * 0.126,
  };

  const days = getCalendarLayout(year, month);
  const composites = [];

  for (const { day, row, col } of days) {
    if (!attendedDays.includes(day)) continue;

    const isToday = today && day === today;
    const stampBuffer = isToday ? todayStamp : normalStamp;
    const stampSize = isToday ? todayStampSize : normalStampSize;

    const centerX = grid.startX + col * grid.cellW + grid.cellW * 0.58;
    const centerY = grid.startY + row * grid.cellH + grid.cellH * 0.62;

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
