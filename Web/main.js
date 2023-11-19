function dStringToDate(d) {
  var year = d.substring(0, 4);
  var month = d.substring(4, 6);
  var day = d.substring(6, 8);
  var hour = d.substring(9, 11);
  var minute = d.substring(11, 13);
  var second = d.substring(13, 15);
  return new Date(year, month, day, Number(hour) + 1, minute, second);
}

function fetchDatesFromCalendar(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((res) => res.text())
      .then((text) => {
        const dates = [];
        text.split('\n').forEach((line) => {
          if (line.startsWith('DTSTART')) {
            const date = line.split(':')[1];
            dates.push(dStringToDate(date.trim()));
          }
        });
        resolve(dates);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function datesPerDate(dates) {
  const datesPerDate = {};
  dates.forEach((date) => {
    const dateString = date.toISOString().split('T')[0];
    if (datesPerDate[dateString]) {
      datesPerDate[dateString].push(date);
    } else {
      datesPerDate[dateString] = [date];
    }
  });
  return datesPerDate;
}

function filterDatesAfter5pm(dates) {
  return dates.filter((date) => date.getHours() >= 17);
}
function filterDatesBefore4pm(dates) {
  return dates.filter((date) => date.getHours() < 16);
}
function filterDatesThatAreCloseTogether(dates, minutes) {
  if (!Array.isArray(dates) || dates.length < 2) {
    // If the input is not an array or has less than two dates, return an empty array
    return [];
  }

  // Sort the dates in ascending order
  const sortedDates = [...dates].sort((a, b) => a - b);

  // Initialize an array to store the filtered dates
  const result = [sortedDates[0]];

  for (let i = 1; i < sortedDates.length; i++) {
    const current = sortedDates[i];
    const previous = sortedDates[i - 1];

    // Check if the difference between current and previous dates is greater than the specified time window
    if (current - previous >= minutes * 60 * 1000) {
      result.push(current);
    }
  }

  return result;
}

function convertDatesObjectToChartData(datesPerDate) {
  const labels = [];
  const data = [];
  Object.keys(datesPerDate).forEach((dateString) => {
    labels.push(dateString);
    data.push(datesPerDate[dateString].length);
  });
  return {
    labels: labels,
    data: data,
  };
}

function getBorderColor(i) {
    const colors = ['rgb(75, 192, 192)', 'rgb(75, 192, 112)', 'rgb(75, 192, 142)', 'rgb(75, 192, 92)', 'rgb(75, 192, 22)'];
    return colors[i];
    }


function fillExistingChart(chartId, intervals, dataSetData) {
  // Prepare data for Chart.js
  const chartData = {
    labels: intervals.map((interval) => interval.toLocaleTimeString([], { hour: '2-digit', day: '2-digit' })),
    datasets: dataSetData.map((dataSet, index) => {
        return {            
              label: dataSet.title,
              data: dataSet.counts,
              fill: true,
              borderColor: getBorderColor(index),
              tension: 0.3,
    }
    }),
  };

  // Create a line chart using Chart.js
  const ctx = document.getElementById(chartId).getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: chartData,
  });
}

// Function to group timestamps by 3-hour intervals
function groupTimestamps(timestamps, intervalSizeInHours) {
  const groupedData = {};

  timestamps.forEach((timestamp) => {
    // Round the timestamp to the nearest interval
    const roundedTimestamp = new Date(
      Math.floor(timestamp.getTime() / (intervalSizeInHours * 60 * 60 * 1000)) * (intervalSizeInHours * 60 * 60 * 1000)
    );

    // Convert the rounded timestamp to a string for easy use as an object key
    const key = roundedTimestamp.toISOString();

    // Add the timestamp to the corresponding interval
    if (groupedData[key]) {
      groupedData[key].push(timestamp);
    } else {
      groupedData[key] = [timestamp];
    }
  });

  return groupedData;
}

// Function to generate a sequence of 3-hour intervals
function generateIntervals(timestamps, intervalSizeInHours) {
  // Find the minimum and maximum timestamps to determine the range
  const minTimestamp = Math.min(...timestamps);
  const maxTimestamp = Math.max(...timestamps);

  // Round the minimum timestamp down to the nearest interval
  const startInterval = new Date(
    Math.floor(minTimestamp / (intervalSizeInHours * 60 * 60 * 1000)) * (intervalSizeInHours * 60 * 60 * 1000)
  );

  // Create an array to store the intervals
  const intervals = [];

  // Generate intervals until the maximum timestamp
  let currentInterval = new Date(startInterval);

  while (currentInterval <= maxTimestamp) {
    intervals.push(new Date(currentInterval));
    currentInterval.setTime(currentInterval.getTime() + intervalSizeInHours * 60 * 60 * 1000); // Move to the next interval
  }

  return intervals;
}

// Function to count occurrences of timestamps within each interval
function countTimestampsInIntervals(groupedData, intervals) {
  const counts = [];

  intervals.forEach((interval) => {
    // Convert the interval to a string for comparison with groupedData keys
    const key = interval.toISOString();

    // Check if the key exists in the groupedData
    if (groupedData[key]) {
      counts.push(groupedData[key].length);
    } else {
      counts.push(0);
    }
  });

  return counts;
}


function printDatesToDiv(dates){
    const div = document.getElementById('dates');
    div.innerHTML = '';
    // On every new day, print a new headline with h1
    // Just print the time for every date element
    let lastDate = null;
    dates.forEach((date) => {
      const dateString = date.toISOString().split('T')[0];
      if (lastDate !== dateString) {
        const h1 = document.createElement('h3');
        h1.innerText = dateString;
        div.appendChild(h1);
        lastDate = dateString;
      }
      const p = document.createElement('span');
      // margin-right: 1rem;
        p.style.marginRight = '1rem';
      p.innerText = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      div.appendChild(p);
    });
}