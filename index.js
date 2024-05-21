const cnFileInput = document.getElementById('cnFileInput');
const usFileInput = document.getElementById('usFileInput');
const convertBtn = document.getElementById('convertBtn');
const csvOutput = document.getElementById('output');
const downloadBtn = document.getElementById('downloadBtn');


convertBtn.addEventListener('click', processData);

function processData() {
    let cnCleanData;
    let usCleanData;

    convertToJSON(cnFileInput)
        .then(cnData => {
            cnCleanData = cleanCNData(cnData);
            return convertToJSON(usFileInput);
        })
        .then(usData => {
            usCleanData = cleanUSData(usData);
            let csv = jsonToCSV(merge(cnCleanData, usCleanData));
            csvOutput.textContent = csv;
            // Add click event listener to download button
            downloadBtn.addEventListener('click', () => {
                let currentDate = new Date();
                let formattedDate = formatDate(currentDate);
                downloadCSV(csv, (formattedDate + ' data.csv'));
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function merge(database1, database2) {
    // Combine both databases into a single array
    const combinedDatabase = [...database1, ...database2];

    // Create an object to store the merged quantities for each item
    const mergedItems = {};

    // Iterate over each item in the combined database
    for (const item of combinedDatabase) {
        const itemName = item.item;
        const quantity = parseFloat(item.quantity);

        // If the item is already in the mergedItems object, add the quantity to it
        if (mergedItems[itemName]) {
            mergedItems[itemName] += quantity;
        } else {
            // Otherwise, initialize the quantity for the item
            mergedItems[itemName] = quantity;
        }
    }

    // Convert the merged items object back into an array of objects
    const mergedArray = [];
    for (const itemName in mergedItems) {
        mergedArray.push({ item: itemName, quantity: mergedItems[itemName].toFixed(3) });
    }

    // Sort the merged array alphabetically by item name
    mergedArray.sort((a, b) => a.item.localeCompare(b.item));

    return mergedArray;
}


function convertToJSON(elem) {
    const file = elem.files[0];

    if (!file) {
        window.alert("Please select a CSV file");
        return Promise.reject(new Error('No file selected'));
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const csvData = reader.result;
            const data = csvToJSON(csvData);
            resolve(data);
        };

        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };

        reader.readAsText(file);
    });
}

function csvToJSON(csvData) {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',');
  const jsonArray = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].split(',');

    // Skip empty lines
    if (currentLine.length === 1 && currentLine[0] === '') {
      continue;
    }

    const jsonObject = {};

    for (let j = 0; j < headers.length; j++) {
      const value = j < currentLine.length ? currentLine[j].trim() : '';
      jsonObject[headers[j].trim()] = value;
    }

    jsonArray.push(jsonObject);
  }

  return jsonArray;
}

function cleanCNData(data) {
    let output = [];
    for (let i = 0; i < data.length; i++) {
        if (isNaN(data[i].quantity)) {
            window.alert("Row " + i + "\'s quantity is not a number");
        }
        let index = findIndexOf(output, data[i].item);
        if (index != -1) {
            output[index].quantity += parseFloat(data[i].quantity);
            data[i].quantity = 0;
        }
        else {
            let obj = {
                "item": data[i].item.toString(),
                "quantity": parseFloat(data[i].quantity)
            }
            output.push(obj);
        }
    }
    roundOutput(output);
    return output;
}

function cleanUSData(data) {
    let output = [];
    for (let i = 0; i < data.length; i++) {
        let itemName = data[i].item.toString();
        if (isNaN(data[i].quantity)) {
            window.alert("Row " + i + "\'s quantity is not a number");
        }
        data[i].quantity = parseFloat(data[i].quantity);

        if (itemName.includes(":")) {
            let mainName = itemName.substring(0, itemName.indexOf(":"));
            let index = findIndexOf(data, mainName);
            if (index == -1) {
                itemName = mainName;
            }
            else {
                data[index].quantity += data[i].quantity;
                data[i].quantity = 0;
            }
        }
    }
    for (let i = 0; i < data.length; i++) {
        if (data[i].item.toString().includes(":")) {
            continue;
        }
        let obj = {
            "item": data[i].item.toString(),
            "quantity": parseFloat(data[i].quantity)
        }
        output.push(obj);
    }
    roundOutput(output);
    return output;
}

function findIndexOf(data, item) {
    for (let i = 0; i < data.length; i++) {
        if (data[i].item == item) {
            return i;
        }
    }
    return -1;
}

function roundOutput(data) {
    for (let i = 0; i < data.length; i++) {
        data[i].quantity = data[i].quantity.toFixed(3);
    }
}

function jsonToCSV(jsonData) {
    // Extract headers from the first object in the array
    const headers = Object.keys(jsonData[0]);

    // Create CSV header row
    let csvString = headers.join(',') + '\n';

    // Iterate over each object in the array
    for (const obj of jsonData) {
        // Extract values for each header
        const values = headers.map(header => obj[header]);

        // Format values to CSV string and append to the CSV
        csvString += values.join(',') + '\n';
    }

    return csvString;
}


function downloadCSV(csvString, filename) {
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}


function formatDate(date) {
    // Get month, day, year, hour, and minutes
    const month = date.getMonth() + 1; // Months are zero-indexed, so add 1
    const day = date.getDate();
    const year = date.getFullYear();
    const hour = date.getHours();
    const minutes = date.getMinutes();

    // Pad single-digit values with leading zeros
    const formattedMonth = month < 10 ? '0' + month : month;
    const formattedDay = day < 10 ? '0' + day : day;
    const formattedYear = year;
    const formattedHour = hour < 10 ? '0' + hour : hour;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    // Construct formatted string
    const formattedDate = formattedMonth + '-' + formattedDay + '-' + formattedYear + '@' + formattedHour + ':' + formattedMinutes;

    return formattedDate;
}

// Example usage:
