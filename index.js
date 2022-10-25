// This code sample uses the 'node-fetch' library:
// https://www.npmjs.com/package/node-fetch
import { fetchIssues, fetchLastDoneStatusUpdateFromChangeLog, checkStatus } from "./lib/jira.js"
import { getHolidays, getWorkingManDays } from "./lib/working-hours.js";
import { getUserCountryFromCSV } from "./lib/user-country.js";
import { mapJiraIssuesFields, writeCSV } from "./lib/writer.js";
import prompt from "prompt";

async function main(email, apiKey) {
  try {
    const issues = [];
    let index = 0;
    let searchResult = [];

    do {
      
      const response = await fetchIssues(
        email,
        apiKey,
        index  //startAt
      );
      checkStatus(response);
      searchResult = await response.json();
      issues.push(... await mapJiraIssuesFields(searchResult.issues));
      index += 100;
      console.log("Processing records -> " + index);
    } while (searchResult.issues.length > 0);

    console.log(`Total Records: ${issues.length}`);

    for (const issue of issues) {
      //update resolution date from change log (Done Status) if the original resolution date is null
      if (
        issue["fields.status.name"] == "Done" &&
        !issue["fields.resolutiondate"]
      ) {
        issue["fields.resolutiondate"] =
          await fetchLastDoneStatusUpdateFromChangeLog(
            email,
            apiKey,
            issue["key"]
          );
        issue["fields.resolutiondatefromlastdone"] = "1";
      }

      const startDate = new Date(issue["fields.created"]);
      const endDate = new Date(issue["fields.resolutiondate"]);

      //get all available holidays
      let holidays = [];
      for (let i = startDate.getFullYear(); i <= endDate.getFullYear(); i++) {
        holidays = holidays.concat(await getHolidays("SG", i));
      }

      //calculate time to resolve
      issue["fields.timeToResolve"] = (
        await getWorkingManDays(
          startDate,
          endDate,
          10, //business hour starts
          13, //lunch hour starts
          14, //lunch hour ends
          19, //business hour ends
          holidays,
          true
        )
      ).toFixed(2);

      //get country for assignee, if cannot find, look for report country
      const userCountries = await getUserCountryFromCSV();
      issue["fields.country"] =
        userCountries[issue["fields.assignee.displayName"]];
      if (!issue["fields.country"]) {
        issue["fields.country"] =
          userCountries[issue["fields.reporter.displayName"]];
      }
    }

    await writeCSV(issues)

  } catch (error) {
    console.error(error);

    const errorBody = await error.message;
    const errorStackTrace = await error.stack;
    console.error(`Error body: ${errorBody}`);
    console.error(`Error StackTrace: ${errorStackTrace}`);
  }
}

let email;
let apiKey;

if (process.argv.length < 3) {
  prompt.start();

  prompt.get(["email", "api_key"], function (err, result) {
    if (err) {
      return onErr(err);
    }

    email = result.email;
    apiKey = result.api_key;

    console.log("Command-line input received:");
    console.log("  Email: " + result.email);
    console.log("  API Key: " + result.api_key);

    main(email, apiKey);
  });
} else {
  email = process.argv[2];
  apiKey = process.argv[3];
  main(email, apiKey);
}
