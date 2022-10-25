import csvWriter from "csv-writer";

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
  { id: "fields.country", title: "Country" },
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
  { id: "fields.timeToResolve", title: "Time to Resolve(Manday)" },
  { id: "fields.fixVersions", title: "Fix Versions" },
  { id: "fields.components", title: "Components" },
  { id: "fields.duedate", title: "Due Date" },
  { id: "fields.votes.votes", title: "Votes" },
  { id: "fields.labels", title: "Labels" },
  { id: "fields.description", title: "Description" },
  { id: "fields.timeoriginalestimate", title: "Original Estimate" },
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
      returnValue = getFieldDescription(returnValue).join("\r\n");
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
    //console.log("Failed to get " + fieldName + " field");
  }
  return returnValue;
};

//convert description json into text string only
const getFieldDescription = (obj) => {
  let textArray = [];
  Object.keys(obj).forEach((key) => {
    //console.log(`key: ${key}, value: ${obj[key]}`)

    if (typeof obj[key] === "object" && obj[key] !== null) {
      const temp = getFieldDescription(obj[key]);
      if (temp.length > 0) textArray = textArray.concat(temp);
    }

    if (key === "text") {
      textArray.push(obj[key]);
    }
    //console.log(textArray)
  });
  return textArray;
};

export async function mapJiraIssuesFields(jiraIssues) {
  const issues = jiraIssues.map((issue) => {
    //console.log(history.author.displayName);
    let newIssue = {};
    fields.forEach((field) => {
      newIssue[field.id] = getFieldValue(issue, field.id);
    });
    return newIssue;
  });

  return issues;
}

export async function writeCSV(issues) {
  const csv = csvWriter.createObjectCsvWriter({
    path: "output/result.csv",
    header: fields,
  });

  csv
    .writeRecords(issues) // returns a promise
    .then(() => {
      console.log("...Done");
    });
}
