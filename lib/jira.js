import fetch from "node-fetch";

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

export async function fetchIssues(email, apiKey, jqlBodyData) {
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
      body: jqlBodyData,
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
