import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import { Timestamp } from "firebase/firestore";

// Extend dayjs with necessary plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

// Function to convert Firebase timestamp to a formatted date string
const convertFBTimestamp = (timestamp, format) =>
  dayjs(timestamp.toDate()).format(format);

// Function to convert Firebase timestamp to a "time ago" string
const attachDateWithTime = (date, time) => {
  const selectedDate = date.toDate ? date.toDate() : date;
  const selectedTime = time.toDate ? time.toDate() : time;

  const selectedDateTime = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    selectedTime.getHours(),
    selectedTime.getMinutes()
  );
  return selectedDateTime;
};

// Function to convert Firebase timestamp to a "time ago" string
const convertFBTimestampToTimeago = (timestamp) => {
  return dayjs(timestamp.toDate()).fromNow();
};

// Function to convert time between time zones
const convertTimeZone = ({
  time,
  sourceTZ = "America/New_York",
  targetTimeZone,
  format = "h:mm A",
}) => {
  return dayjs.tz(time, sourceTZ).tz(targetTimeZone).format(format);
};

const calculateTargetDate = (frequency, checkins) => {
  if (checkins <= 0) return undefined;

  let targetDate = dayjs();

  switch (frequency) {
    case "daily":
      targetDate = targetDate.add(checkins, "day");
      break;
    case "monthly":
      targetDate = targetDate.add(checkins, "month");
      break;
    case "quarterly":
      targetDate = targetDate.add(checkins * 3, "month");
      break;
    case "yearly":
      targetDate = targetDate.add(checkins, "year");
      break;
    case "prn":
      return undefined;
    default:
      return undefined;
  }

  return Timestamp.fromDate(targetDate.toDate());
};

export default {
  convertFBTimestamp,
  convertFBTimestampToTimeago,
  convertTimeZone,
  attachDateWithTime,
  calculateTargetDate,
};
