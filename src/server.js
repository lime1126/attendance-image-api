require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { supabase } = require("./supabase");
const { generateAttendanceImage } = require("./image");

const app = express();

app.use(cors());
app.use(express.json());

function checkApiSecret(req, res, next) {
  const expected = process.env.API_SECRET;

  if (!expected) {
    return res.status(500).json({
      message: "API_SECRET이 설정되지 않았습니다.",
    });
  }

  const auth = req.headers.authorization;

  if (auth !== `Bearer ${expected}`) {
    return res.status(401).json({
      message: "인증 실패",
    });
  }

  next();
}

function getKoreaToday() {
  const now = new Date();

  const korea = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Seoul",
    })
  );

  const year = korea.getFullYear();
  const month = korea.getMonth() + 1;
  const day = korea.getDate();

  const yyyy = String(year);
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");

  return {
    year,
    month,
    day,
    dateString: `${yyyy}-${mm}-${dd}`,
  };
}

function getMonthRange(year, month) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDate = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDate).padStart(2, "0")}`;

  return {
    start,
    end,
  };
}

async function getAttendedDays(userId, year, month) {
  const { start, end } = getMonthRange(year, month);

  const { data, error } = await supabase
    .from("attendance")
    .select("attendance_date")
    .eq("user_id", userId)
    .gte("attendance_date", start)
    .lte("attendance_date", end)
    .order("attendance_date", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data.map((row) => {
    const parts = String(row.attendance_date).split("-");
    return Number(parts[2]);
  });
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Attendance Image API is running.",
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
  });
});

app.post("/attendance/check", checkApiSecret, async (req, res) => {
  try {
    const { userId, userName } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId가 필요합니다.",
      });
    }

    const today = getKoreaToday();

    const { error: upsertError } = await supabase
      .from("attendance")
      .upsert(
        {
          user_id: userId,
          user_name: userName || null,
          attendance_date: today.dateString,
        },
        {
          onConflict: "user_id,attendance_date",
        }
      );

    if (upsertError) {
      throw upsertError;
    }

    const attendedDays = await getAttendedDays(
      userId,
      today.year,
      today.month
    );

    const imageBuffer = await generateAttendanceImage({
      year: today.year,
      month: today.month,
      today: today.day,
      attendedDays,
    });

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.send(imageBuffer);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "출석 이미지 생성 실패",
      error: error.message,
    });
  }
});

app.get("/attendance/image", checkApiSecret, async (req, res) => {
  try {
    const userId = req.query.userId;
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (!userId || !year || !month) {
      return res.status(400).json({
        message: "userId, year, month가 필요합니다.",
      });
    }

    const todayInfo = getKoreaToday();

    const attendedDays = await getAttendedDays(userId, year, month);

    const isCurrentMonth =
      todayInfo.year === year && todayInfo.month === month;

    const imageBuffer = await generateAttendanceImage({
      year,
      month,
      today: isCurrentMonth ? todayInfo.day : null,
      attendedDays,
    });

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.send(imageBuffer);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "출석 이미지 조회 실패",
      error: error.message,
    });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Attendance API running on port ${port}`);
});
