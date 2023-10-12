const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thrusday",
  "Friday",
  "Saturday",
];

function removeJunk(items) {
  for (var item of items) {
    if (!item || item === "") {
      items.splice(items.indexOf(item), 1);
    }
  }
  return items;
}

function parseTimeslot(timeslot) {
  const currentDate = new Date(Date.now());
  const currentOffset = currentDate.getTimezoneOffset();
  const ISTOffset = 330;
  var indiaCurrentDateTime = new Date(
    currentDate.getTime() + (ISTOffset + currentOffset) * 60000
  );

  let dateInfomation = {
    day: indiaCurrentDateTime.getDate(),
    month: indiaCurrentDateTime.getMonth() + 1,
    year: indiaCurrentDateTime.getFullYear(),
  };
  let timeInfomation = {
    hour: 00,
    min: 00,
    sec: 00,
    dayOfWeek: "",
  };
  const slotSegments = timeslot.split(",");
  let dateSegments = [];
  if (slotSegments.length > 1) {
    dateSegments = slotSegments[1].split(" ");
  }
  const timeSegments = slotSegments[0].split(" ");
  dateSegments = removeJunk(dateSegments);
  if (timeSegments[0] !== "Today") {
    dateInfomation.day = parseInt(dateSegments[1].replace("th", ""));
  } else {
    dateInfomation.day = currentDate.getDate();
  }
  if (timeSegments.length > 0) {
    timeInfomation.dayOfWeek = timeSegments[timeSegments.length - 1];
    timeInfomation.hour = parseInt(timeSegments[1].replace(":00", ""));
    if (timeSegments[2] === "PM") {
      if (timeInfomation.hour != 12) {
        timeInfomation.hour += 12;
      }
    }
  }
  if (timeInfomation.dayOfWeek == "AM" || timeInfomation.dayOfWeek == "PM") {
    timeInfomation.dayOfWeek = daysOfWeek[currentDate.getDay()];
  }
  // timeInfomation.min = indiaCurrentDateTime.getMinutes() + 2;
  return {
    ...timeInfomation,
    ...dateInfomation,
  };
}

const slots = [
  {
    slotStart: 6,
    slotEnd: 9,
  },
  {
    slotStart: 8,
    slotEnd: 11,
  },
  {
    slotStart: 10,
    slotEnd: 13,
  },
  {
    slotStart: 12,
    slotEnd: 15,
  },
  {
    slotStart: 14,
    slotEnd: 17,
  },
  {
    slotStart: 16,
    slotEnd: 19,
  },
  {
    slotStart: 18,
    slotEnd: 21,
  },
];

const timeslotConfig = {
  start: 6,
  tomorrowStart: 6,
  timeDifference: 3,
  slotDifference: 2,
  end: 16,
};

function getIndianTime(prefix = "Today", date = new Date(Date.now())) {
  const currentDate = date;
  const currentOffset = currentDate.getTimezoneOffset();
  const ISTOffset = 330;
  let indiaCurrentDateTime = new Date(
    currentDate.getTime() + (ISTOffset + currentOffset) * 60000
  );
  if (prefix === "Today") {
    return indiaCurrentDateTime;
  }
  return new Date(2021, 1, 16, 5, 00, 00, 00);
}

function generateTimeslots(prefix = "Today") {
  const timeslots = [];
  let tempSlots = JSON.parse(JSON.stringify(slots));
  const currentDate = getIndianTime(prefix);
  for (let slot of tempSlots) {
    if (currentDate.getHours() <= timeslotConfig.end) {
      if (
        slot.slotStart !== timeslotConfig.start &&
        slot.slotStart > timeslotConfig.start &&
        slot.slotStart !== currentDate.getHours() &&
        slot.slotStart > currentDate.getHours()
      ) {
        timeslots.push(slot);
      }
    }
  }
  for (var slot of timeslots) {
    if (slot.slotStart == 12) {
      slot["slotStartAMPM"] = "PM";
    }
    if (slot.slotEnd == 12) {
      slot["slotEndAMPM"] = "PM";
    }

    if (slot.slotStart < 12) {
      slot["slotStartAMPM"] = "AM";
    }
    if (slot.slotEnd < 12) {
      slot["slotEndAMPM"] = "AM";
    }
    if (slot.slotStart > 12) {
      slot["slotStartAMPM"] = "PM";
      slot.slotStart -= 12;
    }
    if (slot.slotEnd > 12) {
      slot["slotEndAMPM"] = "PM";
      slot.slotEnd -= 12;
    }

    slot["slotStart"] = `${slot.slotStart}:00 ${slot.slotStartAMPM}`;
    slot["slotEnd"] = `${slot.slotEnd}:00 ${slot.slotEndAMPM}`;
    slot["slot"] = `${prefix} ${slot["slotStart"]} - ${slot["slotEnd"]}`;
  }
  return timeslots;
}

// const generateTimeslots = () => {
//   console.log(getIndianTime())
// }

module.exports = {
  parseTimeslot,
  generateTimeslots,
  getIndianTime,
};
