export type SensorRecord = {
  timestamp: number;
};

const DAY_SLOTS = [0, 4, 8, 12, 16, 20];

export const processDayData = (data: SensorRecord[]) => {
  const result = DAY_SLOTS.map((slot) => ({
    label: `${slot.toString().padStart(2, "0")}:00`,
    value: 0,
  }));

  data.forEach((item) => {
    const date = new Date(item.timestamp * 1000);
    const hour = date.getHours();

    const slotIndex = Math.floor(hour / 4);
    if (result[slotIndex]) result[slotIndex].value += 1;
  });

  return result;
};

export const processWeekData = (data: SensorRecord[]) => {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const result = labels.map((label) => ({
    label,
    value: 0,
  }));

  data.forEach((item) => {
    const date = new Date(item.timestamp * 1000);
    const day = date.getDay();
    result[day].value += 1;
  });

  return result;
};

export const processMonthData = (data: SensorRecord[]) => {
  const result = [
    { label: "W1", value: 0 },
    { label: "W2", value: 0 },
    { label: "W3", value: 0 },
    { label: "W4", value: 0 },
  ];

  data.forEach((item) => {
    const date = new Date(item.timestamp * 1000);
    const day = date.getDate();

    const weekIndex = Math.floor((day - 1) / 7);
    if (result[weekIndex]) result[weekIndex].value += 1;
  });

  return result;
};

export const processYearData = (data: SensorRecord[]) => {
  const labels = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  const result = labels.map((label) => ({
    label,
    value: 0,
  }));

  data.forEach((item) => {
    const date = new Date(item.timestamp * 1000);
    const month = date.getMonth();
    result[month].value += 1;
  });

  return result;
};