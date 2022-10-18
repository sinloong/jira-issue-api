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

const exportCSV = (histories) => {
  const items = [];

  histories.forEach((history) => {
    //console.log(history.author.displayName);

    history.items.forEach((item) => {
      items.push({
        id: history.id,
        author: history.author.displayName,
        field: item.field,
        fromString: item.fromString,
        toString: item.toString,
        created: history.created,
      });
    });
  });

  csv
    .writeRecords(items) // returns a promise
    .then(() => {
      console.log("...Done");
    });
  //console.log(output);
};

const createCSV = csvWriter.createObjectCsvWriter;
const csv = createCSV({
  path: "demoD.csv",
  header: [
    { id: "id", title: "ID" },
    { id: "author", title: "Author" },
    { id: "field", title: "Field" },
    { id: "fromString", title: "FromString" },
    { id: "toString", title: "ToString" },
    { id: "created", title: "Created" },
  ],
});

const bodyData = `{
    "expand": [
        "names",
        "schema",
        "operations"
    ],
    "jql": "project = igloohome-2022",
    "maxResults": 15,
    "fieldsByKeys": false,
    "fields": [
    ],
    "startAt": 0
}`;

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
    body: bodyData,
  }
);

try {
  checkStatus(response);
  const histories = await response.json();
  exportCSV(histories.values);
} catch (error) {
  console.error(error);

  const errorBody = await error.response.text();
  console.error(`Error body: ${errorBody}`);
}
