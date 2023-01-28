const express = require("express");
const { open } = require("sqlite");

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

const sqlite3 = require("sqlite3");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (err) {
    console.log(`DB Error: ${err.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertStateDBObject = (objectItem) => {
  return {
    stateId: objectItem.state_id,
    stateName: objectItem.state_name,
    population: objectItem.population,
  };
};

// API 1: Returns a list of all states in the state table.

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT *
    FROM 
        state;`;
  const getStateDetails = await db.all(getStatesQuery);
  response.send(
    getStateDetails.map((eachState) => convertStateDBObject(eachState))
  );
});
