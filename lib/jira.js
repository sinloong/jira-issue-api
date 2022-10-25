import fetch from "node-fetch";
import * as fs from "fs";

const bodyData = `{
    "expand": [
        "names",
        "schema",
        "operations",
        "changelog"
    ],
    "jql": "{{Jql}}",
    "maxResults": 100,
    "fieldsByKeys": false,
    "fields": [
    ],
    "startAt": {{startAt}}
  }`;
  
  //"jql": "project in (igloohome-2022, iglooworks-2022, iDP, 'Igloohome Flutter', 'iglooworks App 2.0', 'iglooworks Dashboard 2.0', 'iglooworks app', 'iglooworks Dashboard', 'HW Product', 'CS Team Tool', 'CS Team Tool 2022', 'Bluetooth Mobile SDK', 'Aztech Bridge', 'IglooApp 2.0', iglooconnect-2022, Analytics, 'PRS App', 'PRS Admin App', 'Auto Test App') AND status in (Done, Resolved, Closed) AND createdDate >= 2022-01-01 AND createdDate < 2022-10-01 ORDER BY created DESC",
  //"jql": "project in ('iglooworks Dashboard') AND status in (Done, Resolved, Closed) AND createdDate >= 2022-01-01 AND createdDate < 2022-10-01 ORDER BY created DESC",

  
class HTTPResponseError extends Error {
  constructor(response, ...args) {
    super(
      `HTTP Error Response: ${response.status} ${response.statusText}`,
      ...args
    );
    this.response = response;
  }
}

export async function checkStatus(response) {
  if (response.ok) {
    // response.status >= 200 && response.status < 300
    return response;
  } else {
    throw new HTTPResponseError(response);
  }
}

const getJqlFromFile = () => {
    const jql = fs.readFileSync("./input/jql.txt");
    return jql.toString().replace(/(?:\r\n|\r|\n)/g, "");
  };

export async function fetchIssues(email, apiKey, startAt) {

  const jql = getJqlFromFile();

  const response = await fetch(
    "https://iglooapp.atlassian.net/rest/api/3/search",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(email + ":" + apiKey).toString(
          "base64"
        )}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: bodyData.replace("{{startAt}}", startAt).replace("{{Jql}}", jql),
    }
  );
  return response;
}

export async function fetchLastDoneStatusUpdateFromChangeLog(
  email,
  apiKey,
  issueKey
) {
  const response = await fetch(
    "https://iglooapp.atlassian.net/rest/api/3/issue/" +
      issueKey +
      "/changelog",
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(email + ":" + apiKey).toString(
          "base64"
        )}`,
        Accept: "application/json",
      },
    }
  );
  const histories = await response.json();
  let lastStatusDoneUpdate = null;
  for (const history of histories.values) {
    for (const item of history.items) {
      if (item.fieldId === "status" && item.to === "10001") {
        //10001 = Done
        lastStatusDoneUpdate = history.created;
      }
    }
  }
  return lastStatusDoneUpdate;
}
