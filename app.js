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

// API 2: Returns a state based on the state ID.

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT state_id As stateId, 
    state_name AS stateName,
    population
    FROM state WHERE state_id = ${stateId};`;

  const stateQueryResponse = await db.get(getStateQuery);
  response.send(stateQueryResponse);
});

// API 3: Create a district in the district table.
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `
  INSERT INTO district(district_name, state_id, cases, cured, active, deaths)
  VALUES(
      '$districtName',
      ${stateId},
      ${cases},
      ${cured},
      ${active},
      ${deaths}
  );
  `;

  const createDistrictQueryResponse = await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});
