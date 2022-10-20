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
  console.log(holidays);
  return holidays.map((holiday) => { 
    return holiday.date.match(/^\d{4}\-\d{2}\-\d{2}/)[0]
  })
}


