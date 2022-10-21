import Holidays from "date-holidays";
import * as fs from "fs";

export async function getHolidays(country, year) {
  const file = `./output/holidays-${year}.json`;

  if (!fs.existsSync(file)) {
    const hd = new Holidays(country);
    const tmpHolidays = hd.getHolidays(year);
    await fs.promises.writeFile(file, JSON.stringify(tmpHolidays), {
      encoding: "utf8",
    });
    console.log(`holidays-${year} file has been created!`);
  }

  const body = await fs.promises.readFile(file, "utf8");
  const holidays = JSON.parse(body);
  //console.log(holidays);
  return holidays.map((holiday) => {
    return holiday.date.match(/^\d{4}\-\d{2}\-\d{2}/)[0];
  });
}

// Simple function that accepts two parameters and calculates
// the number of hours worked within that range
export async function getWorkingMandays(
  startDate,
  endDate,
  WorkhourStart,
  lunchStart,
  lunchEnd,
  WorkhourEnd,
  holidays,
  excludeWeekends
) {
  // Store minutes worked
  let minutesWorked = 0;

  // Validate input
  if (endDate < startDate) {
    return 0;
  }

  // Loop from your Start to End dates (by hour)
  const current = startDate;

  // Define work range
  const workHoursStart = WorkhourStart;
  const workHoursEnd = WorkhourEnd;
  console.log("Start Date -> " + startDate)
  console.log("End Date -> " + endDate)

  // Loop while currentDate is less than end Date (by minutes)
  while (current <= endDate) {
    // Store the current time (with minutes adjusted)
    let currentTime = current.getHours() + (current.getMinutes() / 60);

    // Is the current time within a work day (and if it
    // occurs on a weekend or not)
    if (
      currentTime >= workHoursStart &&
      currentTime < workHoursEnd &&
      !(currentTime >= lunchStart && currentTime < lunchEnd) &&
      !(holidays.indexOf(current.getFullYear() + "-" + String(current.getMonth() + 1).padStart(2, '0') + "-" + String(current.getDate()).padStart(2, '0')) >= 0) &&
      (excludeWeekends
        ? current.getDay() !== 0 && current.getDay() !== 6
        : true)
    ) {
      minutesWorked++;
      //console.log(currentTime + " -> " + minutesWorked)
    }

    // Increment current time
    current.setTime(current.getTime() + 1000 * 60);
  }

  // Return the number of hours
  return minutesWorked / 480;
}
