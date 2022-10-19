// This code sample uses the 'node-fetch' library:
// https://www.npmjs.com/package/node-fetch
import fetch from "node-fetch";
import csvWriter from "csv-writer";

class HTTPResponseError extends Error {
  constructor(response, ...args) {
    super(
      `HTTP Error Response: ${response.status} ${response.statusText}`,
      ...args
    );
    this.response = response;
  }
}

const checkStatus = (response) => {
  if (response.ok) {
    // response.status >= 200 && response.status < 300
    return response;
  } else {
    throw new HTTPResponseError(response);
  }
};

const fields = [
  { id: "fields.summary", title: "Summary" },
  { id: "key", title: "Issue Key" },
  { id: "id", title: "Issue ID" },
  { id: "fields.parent.id", title: "Parent ID" },
  { id: "fields.issuetype.name", title: "Issue Type" },
  { id: "fields.status.name", title: "Status" },
  { id: "fields.project.key", title: "Project Key" },
  { id: "fields.project.name", title: "Project Name" },
  { id: "fields.project.projectTypeKey", title: "Project Type" },
  { id: "fields.project.self", title: "Project URL" },
  { id: "fields.priority.name", title: "Priority" },
  { id: "fields.resolution.name", title: "Resolution" },
  { id: "fields.assignee.displayName", title: "Assignee" },
  { id: "fields.assignee.accountId", title: "Assignee Id" },
  { id: "fields.reporter.displayName", title: "Reporter" },
  { id: "fields.reporter.accountId", title: "Reporter Id" },
  { id: "fields.creator.displayName", title: "Creator" },
  { id: "fields.creator.accountId", title: "Creator Id" },
  { id: "fields.created", title: "Created" },
  { id: "fields.updated", title: "Updated" },
  { id: "fields.lastViewed", title: "Last Viewed" },
  { id: "fields.resolutiondate", title: "Resolved" },
  { id: "fields.resolutiondatefromlastdone", title: "Resolved From Last Done" },
  { id: "fields.fixVersions", title: "Fix Versions" },
  { id: "fields.components", title: "Components" },
  { id: "fields.duedate", title: "Due Date" },
  { id: "fields.votes.votes", title: "Votes" },
  { id: "fields.labels", title: "Labels" },
  { id: "fields.description", title: "Description" },
  { id: "fields.timeoriginalestimate", title: "Original Estimate" },
  { id: "fields.timeestimate", title: "Remaining Estimate" },
  { id: "fields.timeestimate", title: "Remaining Estimate" },
  { id: "fields.timespent", title: "Time Spent" },
  { id: "fields.workratio", title: "Work Ratio" },
];

const getFieldValue = (issue, fieldName) => {
  const splitFieldName = fieldName.split(".");
  let returnValue;
  try {
    if (splitFieldName.length == 1) {
      returnValue = issue[splitFieldName[0]];
    } else if (splitFieldName.length == 2) {
      returnValue = issue[splitFieldName[0]][splitFieldName[1]];
    } else if (splitFieldName.length == 3) {
      returnValue =
        issue[splitFieldName[0]][splitFieldName[1]][splitFieldName[2]];
    }

    if (fieldName === "fields.description" && returnValue) {
      returnValue = getDescription(returnValue).join("\r\n");
    }
    if (
      (fieldName === "fields.fixVersions" ||
        fieldName === "fields.components") &&
      returnValue &&
      returnValue.length > 0
    ) {
      returnValue = returnValue.map((v) => v.name).join(",");
    }
    if (
      fieldName === "fields.labels" &&
      returnValue &&
      returnValue.length > 0
    ) {
      returnValue = returnValue.join(",");
    }
  } catch (e) {
    console.log("Failed to get " + fieldName + " field");
  }
  return returnValue;
};

//convert description json into text string only
const getDescription = (obj) => {
  let textArray = [];
  Object.keys(obj).forEach((key) => {
    //console.log(`key: ${key}, value: ${obj[key]}`)

    if (typeof obj[key] === "object" && obj[key] !== null) {
      const temp = getDescription(obj[key]);
      if (temp.length > 0) textArray = textArray.concat(temp);
    }

    if (key === "text") {
      textArray.push(obj[key]);
    }
    //console.log(textArray)
  });
  return textArray;
};

function mapIssuesFields(searchResult) {
  const names = searchResult.names;
  const issuesData = searchResult.issues;

  const issues = issuesData.map((issue) => {
    //console.log(history.author.displayName);
    let newIssue = {};
    fields.forEach((field) => {
      newIssue[field.id] = getFieldValue(issue, field.id);
    });
    return newIssue;
  });

  return issues;
}

const fetchIssuesFromJira = async (jqlBodyData) => {
  const response = await fetch(
    "https://iglooapp.atlassian.net/rest/api/3/search",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          "sinloong.koo@igloohome.co:oZ5ULrvUXAz3nKeRNe432DBF"
        ).toString("base64")}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: jqlBodyData,
    }
  );
  return response;
};

const fetchLastDoneStatusUpdateFromJiraChangeLog = async (issueKey) => {
  const response = await fetch(
    "https://iglooapp.atlassian.net/rest/api/3/issue/" + issueKey + "/changelog",
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(
          "sinloong.koo@igloohome.co:oZ5ULrvUXAz3nKeRNe432DBF"
        ).toString("base64")}`,
        Accept: "application/json",
      },
    }
  );
  const histories = await response.json()
  let lastStatusDoneUpdate = null;
  for (const history of histories.values) {
    for (const item of history.items) {
      if (item.fieldId === "status" && item.to === "10001") {
        lastStatusDoneUpdate = history.created
      }
    }
  }
  return lastStatusDoneUpdate;
};

const bodyData = `{
    "expand": [
        "names",
        "schema",
        "operations",
        "changelog"
    ],
    "jql": "project in (igloohome-2022, iglooworks-2022, iDP, 'Igloohome Flutter', 'iglooworks App 2.0', 'iglooworks Dashboard 2.0', 'iglooworks app', 'iglooworks Dashboard', 'HW Product', 'CS Team Tool', 'CS Team Tool 2022', 'Bluetooth Mobile SDK', 'Aztech Bridge', 'IglooApp 2.0', iglooconnect-2022, Analytics, 'PRS App', 'PRS Admin App', 'Auto Test App') AND status in (Done, Resolved, Closed) AND createdDate >= 2022-01-01 AND createdDate < 2022-10-01 ORDER BY created DESC",
    "maxResults": 100,
    "fieldsByKeys": false,
    "fields": [
    ],
    "startAt": {{startAt}}
}`;

//"jql": "project in (igloohome-2022, iglooworks-2022, iDP, 'Igloohome Flutter', 'iglooworks App 2.0', 'iglooworks Dashboard 2.0', 'iglooworks app', 'iglooworks Dashboard', 'HW Product', 'CS Team Tool', 'CS Team Tool 2022', 'Bluetooth Mobile SDK', 'Aztech Bridge', 'IglooApp 2.0', iglooconnect-2022, Analytics, 'PRS App', 'PRS Admin App', 'Auto Test App') AND status in (Done, Resolved, Closed) AND createdDate >= 2022-01-01 AND createdDate < 2022-10-01 ORDER BY created DESC",
//"jql": "project in ('iglooworks Dashboard') AND status in (Done, Resolved, Closed) AND createdDate >= 2022-01-01 AND createdDate < 2022-10-01 ORDER BY created DESC",

try {
  const issues = [];
  let index = 0;
  let searchResult = []

  do {
    const response = await fetchIssuesFromJira(bodyData.replace('{{startAt}}', index));
    checkStatus(response);
    searchResult = await response.json();
    issues.push(...mapIssuesFields(searchResult));
    index += 100;
    console.log("Processing records -> " + index)
  } while (searchResult.issues.length > 0);

  for (const issue of issues) {
    if (issue["fields.status.name"] == "Done" && !issue["fields.resolutiondate"]) {
      issue["fields.resolutiondate"] = await fetchLastDoneStatusUpdateFromJiraChangeLog(issue["key"]);
      issue["fields.resolutiondatefromlastdone"] = "1"
    }
  }

  const csv = csvWriter.createObjectCsvWriter({
    path: "output/demoD.csv",
    header: fields
  });

  csv
    .writeRecords(issues) // returns a promise
    .then(() => {
      console.log("...Done");
    });
} catch (error) {
  console.error(error);

  const errorBody = await error.message;
  const errorStackTrace = await error.stack;
  console.error(`Error body: ${errorBody}`);
  console.error(`Error StackTrace: ${errorStackTrace}`);
}
