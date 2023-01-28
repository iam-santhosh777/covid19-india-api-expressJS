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

// API 1: Returns a list of all states in the state table.

const convertStateDBObject = (objectItem) => {
  return {
    stateId: objectItem.state_id,
    stateName: objectItem.state_name,
    population: objectItem.population,
  };
};

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
      '${districtName}',
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

// API 4: Returns a district based on the district ID.

const convertDistrictDBObject = (objectItem) => {
  return {
    districtId: objectItem.district_id,
    districtName: objectItem.district_name,
    stateId: objectItem.state_id,
    cases: objectItem.cases,
    cured: objectItem.cured,
    active: objectItem.active,
    deaths: objectItem.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIDQuery = `
  SELECT * FROM district WHERE district_id = ${districtId};
  `;
  const districtQueryResponse = await db.get(getDistrictIDQuery);
  response.send(convertDistrictDBObject(districtQueryResponse));
});

// API 5: Deletes a district from the district table based on the district ID.

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
  DELETE FROM district WHERE district_id = ${districtId};
  `;

  const deleteDistrictQueryResponse = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// API 6: Updates the details of a specific district based on the district ID.

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateDistrictQuery = `update district set
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths} where district_id = ${districtId};`;
  const updateDistrictQueryResponse = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});
// API 7: Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID.

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesStatsQuery = `
  SELECT SUM(cases) AS totalCases, SUM(cured) AS totalCured,
    SUM(active) AS totalActive, SUM(deaths) AS totalDeaths
  FROM district
  WHERE state_id = ${stateId};
  `;
  const statsQueryResponse = await db.get(getStatesStatsQuery);
  response.send(statsQueryResponse);
});

// API 8: Returns an object containing the state name of a district based on the district ID.

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `select state_id from district where district_id = ${districtId};`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  const getStateNameQuery = `select state_name as stateName from state where 
  state_id = ${getDistrictIdQueryResponse.state_id}`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
