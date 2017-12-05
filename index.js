fetchData()
  .then(createTable)
  .then(createReportCards);

// Fetch and format poverty and population data
async function fetchData() {
  const povertyUrl = 'https://static.withhugo.com/tests/data/poverty.json';
  const populationUrl = 'https://static.withhugo.com/tests/data/population.json';

  let povertyData = await fetch(povertyUrl);
  let populationData = await fetch(populationUrl);

  povertyData = await getJson(povertyData);
  populationData = await getJson(populationData);

  // Aggregates poverty and population data into an array
  let populationPoverty = transformData(povertyData, populationData);

  return populationPoverty;
}

// Helper function for retrieving json data type
function getJson(response) {
  return response.json();
}

// Helper function for formatting and combining poverty + population data.
// Creates iterable array instead of mutating povertyData 
function transformData(povertyData, populationData) {
  const populationPoverty = [];

  for (let stateName in povertyData){
    // If theres population data for current state,
    // create and populate state object then push into array of states
    if (populationData[stateName]){
      const state = Object.assign({}, povertyData[stateName]);
      state.stateCode = stateName;
      state.population = populationData[stateName];
      state.povertyCount = state.total;
      state.povertyPercent = state.total/state.population * 100;

      populationPoverty.push(state);
    }
  }

  return populationPoverty;
}

// Function for creating table with population/poverty data
// Returns population/poverty data for promise chaining
function createTable(populationPoverty) {
  // Grab the body of the data for appending rows to
  const table = document.getElementById('statesData');

  populationPoverty.map(state => table.appendChild(getTableRow(state)));

  return populationPoverty;
}

// Helper function for returning a specific HTML td element
// for use in a row.
function getTableField(text) {
  const field = document.createElement('td');
  const fieldText = document.createTextNode(text);

  field.appendChild(fieldText);

  return field;
}

// Helper function for retrieving an HTML element defining
// a state in an HTML table.
function getTableRow(state) {
  // Generate a row for appending data to
  const row = document.createElement('tr');

  // State name (2-character-code)
  row.appendChild(getTableField(state.stateCode));
  // Population Count
  row.appendChild(getTableField(state.population.toLocaleString()));
  // Population in poverty count
  row.appendChild(getTableField(state.povertyCount.toLocaleString()));
  // Percentage in poverty
  row.appendChild(getTableField(state.povertyPercent.toFixed(2)+'%'));
  // 0 to 17 in poverty
  row.appendChild(getTableField(state.age0to17.toLocaleString()));

  return row;
}

// Helper function for creating card element
// and appending element to container
function createCard(container, state) {
  const card = document.createElement('div');
  const title = document.createElement('h3');
  const stateCode = document.createElement('p');
  const titleText = document.createTextNode(state.title);
  const stateText = document.createTextNode(state.stateCode);

  // Creates card title and state elements
  title.appendChild(titleText);
  stateCode.appendChild(stateText);

  // Gives card element class name and populates with title/state elements
  card.className = 'reportCard ' + 'card';
  card.appendChild(title);
  card.appendChild(stateCode);

  // Appends card to card container
  container.appendChild(card);
}

// Function for calculating and rendering the reports
function createReportCards(populationPoverty) {
  // DOM manipulations
  const body = document.getElementsByTagName('body')[0];
  const container = document.createElement('div');

  // Returns state with highest population in poverty
  const highestPop = calcHighestPop(populationPoverty);
  // Returns state with highest percent of population in poverty
  const highestPercent = calcHighestPercent(populationPoverty);
  // Returns state with population 0 - 17 closest to national mean
  const closestToMean = calcClosestToMean(populationPoverty);

  container.className = 'cardContainer';

  // Creates div elements for states and appends to container
  createCard(container, highestPop);
  createCard(container, highestPercent);
  createCard(container, closestToMean);

  // Appends container to document body
  body.insertBefore(container, body.firstChild);

  return populationPoverty;
}

// Helper function for calculating state with highest population in poverty
function calcHighestPop(populationPoverty) {
  let highestPopulationState = populationPoverty.reduce((highest, state) => {
      highest = state.povertyCount > highest.povertyCount ? state : highest;
      return highest;
    }
  );

  return {
    title: 'Highest Population in Poverty',
    stateCode: highestPopulationState.stateCode
  };
}

// Helper function for calculating state with highest percent population in poverty
function calcHighestPercent(populationPoverty) {
  let highestPercentState = populationPoverty.reduce((highest, state) => {
      highest = state.povertyPercent > highest.povertyPercent ? state : highest;
      return highest;
    }
  );

  return {
    title: 'Highest Percent Population in Poverty',
    stateCode: highestPercentState.stateCode
  };
}

// Helper function for calculating state with population of age 0 to 17
// that is closest to the national mean
function calcClosestToMean(populationPoverty ) {
  // Number of states used as divisor for calculating mean
  const numberStates = populationPoverty.length;
  // Total population between age 0 to 17 for all the states
  const total0to17 = populationPoverty.reduce((total, state ) => total + state.age0to17 );
  // Calculates national mean of age 0 to 17 in poverty
  const mean0to17 = total0to17/numberStates;

  // Returns state obj whose 0-17 population is closest to national mean
  const lowestDeviationState = populationPoverty.reduce((lowest, state) => {
      let lowestDeviation = Math.abs(lowest.age0to17 - mean0to17);
      let stateDeviation = Math.abs(lowest.age0to17 - mean0to17);

      lowest = stateDeviation < lowestDeviation ? state : lowest;
      return lowest;
    }
  );

  return {
    title: 'Closest to the National Average of Population of Age 0 - 17 in Poverty',
    stateCode: lowestDeviationState.stateCode
  };
}
