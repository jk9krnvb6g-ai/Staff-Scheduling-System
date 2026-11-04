export interface EventItem {
  id: string;
  title: string;
  time?: string;
  endTime?: string;
  type: "urgent" | "medium" | "normal" | "info";
  location?: string;
  responsibles?: string;
  department?: string;
  description?: string;
  ownerId?: string;
  workGroup?: string;
}

const manualEvents: Record<number, EventItem[]> = {
  5: [
    { id: "1", title: "สรุปงบประมาณประจำไต...", type: "medium" },
    { id: "2", title: "ประชุม", type: "normal" },
  ],
  6: [
    { id: "3", title: "วันจักรี", type: "urgent" },
    { id: "4", title: "ประชุม", type: "normal" },
  ],
  8: [{ id: "5", title: "เข้าร่วมพิธี", type: "normal" }],
  9: [
    { id: "6", title: "ปิดเทอม", type: "normal" },
    { id: "7", title: "วิ่งเพื่อสุขภาพ", type: "medium" },
  ],
  10: [{ id: "8", title: "วิ่งเพื่อสุขภาพ", type: "medium" }],
  12: [{ id: "9", title: "วิ่งเพื่อสุขภาพ", type: "medium", time: "10:47" }],
  13: [
    { id: "13-1", title: "วันสงกรานต์", type: "urgent" },
    { id: "10", title: "รดน้ำดำหัว", type: "normal", time: "10:00" },
    { id: "101", title: "ประชุม", type: "normal", time: "10:30" },
  ],
  14: [{ id: "11", title: "วันสงกรานต์", type: "urgent" }],
  15: [{ id: "12", title: "วันสงกรานต์", type: "urgent" }],
  16: [{ id: "161", title: "ทำความดี", type: "normal", time: "09:00" }],
  17: [
    {
      id: "14",
      title: "รับรายงานตัว ม.4",
      type: "normal",
      time: "ตลอดวัน",
      location: "ห้องประชุม 2",
      responsibles: "ครูที่ปรึกษา",
      department: "บริหารวิชาการ",
      description: "รับรายงานตัว ม.4",
    },
    {
      id: "15",
      title: "เรียนปรับพื้นฐาน",
      type: "normal",
      time: "08:30",
      endTime: "12:30 น.",
      location: "ห้องประชุม 1",
      responsibles: "ครูที่มีคำสั่ง",
      department: "กลุ่มบริหารงานบุคคล",
      description: "เรียนปรับพื้นฐาน ห้องเรียนพิเศษ",
    },
  ],
  18: [
    {
      id: "16",
      title: "กิจกรรม Big Cleanin...",
      type: "normal",
      time: "09:00",
    },
    { id: "17", title: "หวยออก", type: "urgent", time: "00:55" },
    { id: "18", title: "ประชุมฝ่ายบริหาร", type: "normal" },
  ],
  20: [
    { id: "201", title: "เรียนปรับพื้นฐาน", type: "normal" },
    { id: "202", title: "ประชุม", type: "normal" },
  ],
  23: [{ id: "231", title: "ไม่มีไรทำ", type: "normal" }],
  25: [{ id: "251", title: "อบรม Smart classroo...", type: "normal" }],
  26: [{ id: "261", title: "สอบคัดเลือกห้องเรียน ม.4", type: "normal" }],
  27: [
    { id: "271", title: "สอบคัดเลือกห้องเรียน ...", type: "normal" },
    { id: "272", title: "ประชุม", type: "normal" },
  ],
  28: [{ id: "281", title: "ค่ายน้องใหม่ ม.1", type: "normal" }],
  29: [{ id: "291", title: "ค่ายน้องใหม่ ม.4", type: "normal" }],
  30: [{ id: "301", title: "เปิดภาคเรียนที่ 1/2569", type: "normal" }],
};

function generate3000Events(): Record<string | number, EventItem[]> {
  const result: Record<string | number, EventItem[]> = {};

  // Hydrate legacy manualEvents (mapped as number keys)
  Object.keys(manualEvents).forEach((key) => {
    const dayNum = Number(key);
    result[dayNum] = manualEvents[dayNum];
  });

  const titles = [
    "ประชุมฝ่ายวิชาการและนโยบาย",
    "อบรมทักษะการกู้ชีพขั้นสูง (ACLS)",
    "Big Cleaning Day กิจกรรมทำความสะอาด",
    "รายงานผู้ป่วยตอนเช้า (Morning Brief)",
    "ตรวจเยี่ยมหน่วยงานรอบเช้า (Ward Round)",
    "ประชุมคณะกรรมการบริหารโรงพยาบาล",
    "ติดตามความคืบหน้าระบบสารสนเทศ",
    "คัดกรองสุขภาพผู้ป่วยในชุมชน",
    "ปฐมนิเทศเจ้าหน้าที่ใหม่",
    "ประชุมเครือข่ายบริการสุขภาพ (CUP)",
    "ประเมินมาตรฐานคุณภาพโรงพยาบาล (HA)",
    "ตรวจสุขภาพประจำปีบุคลากร",
    "สัมมนาทางวิชาการและวิจัย",
    "ฝึกซ้อมแผนรับอุบัติภัยหมู่",
    "ประชุมทบทวนเคสผู้ป่วยสำคัญ",
    "ตรวจเช็คอุปกรณ์การแพทย์ฉุกเฉิน",
    "ประชุมเชิงปฏิบัติการพัฒนาองค์กร",
    "ตรวจวิเคราะห์คุณภาพน้ำและสิ่งแวดล้อม",
    "เยี่ยมบ้านผู้ป่วยติดเตียงและผู้สูงอายุ",
    "อบรมสารสนเทศและระบบไอที",
  ];

  const priorityTypes: ("urgent" | "medium" | "normal" | "info")[] = [
    "urgent",
    "medium",
    "normal",
    "info",
  ];

  const locations = [
    "ห้องประชุม 1 (อาคารเฉลิมพระเกียรติ)",
    "ห้องประชุม 2 (อาคารหลัก)",
    "ห้องประชุม IT ชั้น 3",
    "ศูนย์ส่งเสริมสุขภาพชุมชน",
    "หอผู้ป่วยวิกฤต (ICU)",
    "ห้องฉุกเฉิน (ER)",
    "หอผู้ป่วยในหญิง",
    "ห้องฝากครรภ์และวางแผนครอบครัว",
    "อาคารอเนกประสงค์หลังใหม่",
    "ห้องปฏิบัติการทันตกรรม",
  ];

  const departments = [
    "ฝ่ายการพยาบาล",
    "หอผู้ป่วยใน",
    "ห้องฉุกเฉิน",
    "กุมารเวชกรรม",
    "กลุ่มบริหารบุคคล",
    "ฝ่ายการเงินและบัญชี",
    "ฝ่ายพัสดุและบำรุงรักษา",
    "เทคโนโลยีสารสนเทศ",
    "สารสนเทศและการสื่อสาร",
    "ฝ่ายข้อมูลและสถิติ",
    "เวชศาสตร์ครอบครัว",
    "กลุ่มงานรังสีวิทยา",
    "ศูนย์สิทธิประโยชน์",
  ];

  const workGroups = [
    "กลุ่มงานการพยาบาล",
    "กลุ่มงานบริหารและจัดการ",
    "กลุ่มงานเทคโนโลยีและสารสนเทศ",
    "แอดมินระบบ",
    "กลุ่มภารกิจด้านการแพทย์",
  ];

  const responsibles = [
    "นพ.สมศักดิ์ รักดี",
    "พญ.สมศรี เรียนเก่ง",
    "คุณนฤมล พยาบาลวิชาชีพ",
    "ทีมบริหารคนเก่ง",
    "เจ้าหน้าที่เวชสารสนเทศ",
    "ทีมไอทีโรงพยาบาล",
    "พญ.มลฤดี วงศ์สว่าง",
    "นพ.ชัยรัตน์ แสวงหา",
    "คุณปรีชา งานพัสดุ",
    "คุณวิไลวัลย์ ฝ่ายการเงิน",
  ];

  const pad = (n: number) => String(n).padStart(2, "0");

  let count = 0;
  // Generate exactly 3000 unique events safely in a simple, non-infinite loop
  while (count < 3000) {
    const year = 2024 + Math.floor(Math.random() * 6); // 2024 to 2029 (6 years)
    const month = Math.floor(Math.random() * 12); // 0 to 11
    const day = 1 + Math.floor(Math.random() * 28); // 1 to 28 (safe for Feb)
    
    const key = `${year}-${pad(month + 1)}-${pad(day)}`;
    
    if (!result[key]) {
      result[key] = [];
    }

    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const randomType =
      priorityTypes[Math.floor(Math.random() * priorityTypes.length)];
    const randomLoc = locations[Math.floor(Math.random() * locations.length)];
    const randomDept =
      departments[Math.floor(Math.random() * departments.length)];
    const randomWG = workGroups[Math.floor(Math.random() * workGroups.length)];
    const randomResp =
      responsibles[Math.floor(Math.random() * responsibles.length)];
    const hour = 8 + Math.floor(Math.random() * 9); // 8:00 to 16:00
    const minute = Math.random() < 0.5 ? "00" : "30";
    const timeStr = `${pad(hour)}:${minute}`;

    result[key].push({
      id: `rand-${count}`,
      title: `${randomTitle} (#${count + 1})`,
      type: randomType,
      time: timeStr,
      location: randomLoc,
      responsibles: randomResp,
      department: randomDept,
      workGroup: randomWG,
      description: `กิจกรรมจำลองลำดับที่ ${count + 1} สำหรับทดสอบระบบสเกลขนาดใหญ่ 3,000 ข้อมูล`,
      ownerId: "staff",
    });

    count++;
  }

  return result;
}

export const initialEventsMap: Record<string | number, EventItem[]> =
  generate3000Events();
