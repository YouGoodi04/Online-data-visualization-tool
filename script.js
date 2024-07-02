let parsedData;
let chart;
document.getElementById('dataFile').addEventListener('change', function(event) {
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        var data = e.target.result;
        if (file.name.endsWith('.csv')) {
            parsedData = parseCSVData(data);
        } else if (file.name.endsWith('.xlsx')) {
            parsedData = parseXLSXData(data);
        }
        populateSelectOptions(parsedData[0]);
    };
    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx')) {
        reader.readAsArrayBuffer(file);
    }
});
function parseCSVData(data) {
    var lines = data.split('\n');
    var result = [];
    var headers = lines[0].split(',');
    for (var i = 1; i < lines.length; i++) {
        var obj = {};
        var currentLine = lines[i].split(',');
        for (var j = 0; j < headers.length; j++) {
            if (currentLine[j]) obj[headers[j]] = parseFloat(currentLine[j]);
        }
        result.push(obj);
    }
    return result;
}
function parseXLSXData(data) {
    var workbook = XLSX.read(data, { type: 'array' });
    var firstSheetName = workbook.SheetNames[0];
    var worksheet = workbook.Sheets[firstSheetName];
    var json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    var headers = json[0];
    var result = [];
    for (var i = 1; i < json.length; i++) {
        var obj = {};
        for (var j = 0; j < headers.length; j++) {
            if (json[i][j]) obj[headers[j]] = parseFloat(json[i][j]);
        }
        result.push(obj);
    }
    return result;
}
function populateSelectOptions(headers) {
    var xAxisSelect = document.getElementById('xAxis');
    var yAxisSelect = document.getElementById('yAxis');
    xAxisSelect.innerHTML = '';
    yAxisSelect.innerHTML = '';
    for (var key in headers) {
        var option = document.createElement('option');
        option.value = key;
        option.text = key;
        xAxisSelect.appendChild(option);
        yAxisSelect.appendChild(option.cloneNode(true));
    }
}
function updateChart() {
    var ctx = document.getElementById('myChart').getContext('2d');
    var chartType = document.getElementById('chartType').value;
    var xAxisKey = document.getElementById('xAxis').value;
    var yAxisKey = document.getElementById('yAxis').value;
    var xMin = document.getElementById('xMin').value;
    var xMax = document.getElementById('xMax').value;
    var yMin = document.getElementById('yMin').value;
    var yMax = document.getElementById('yMax').value;
    var data = parsedData.map(item => ({ x: item[xAxisKey], y: item[yAxisKey] }))
    if (chart) {
        chart.destroy();
    }
    var options = {
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                min: xMin ? parseFloat(xMin) : undefined,
                max: xMax ? parseFloat(xMax) : undefined,
                title: {
                    display: true,
                    text: xAxisKey
                }
            },
            y: {
                min: yMin ? parseFloat(yMin) : undefined,
                max: yMax ? parseFloat(yMax) : undefined,
                title: {
                    display: true,
                    text: yAxisKey
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${xAxisKey}: ${context.parsed.x}, ${yAxisKey}: ${context.parsed.y}`;
                    }
                }
            }
        }
    }
    if (chartType === 'pie') {
        chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: parsedData.map(item => item[xAxisKey]),
                datasets: [{
                    label: yAxisKey,
                    data: parsedData.map(item => item[yAxisKey]),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                }]
            }
        });
    } else if (chartType === 'boxplot') {
        chart = new Chart(ctx, {
            type: 'boxplot',
            data: {
                labels: [xAxisKey],
                datasets: [{
                    label: yAxisKey,
                    data: parsedData.map(item => item[yAxisKey]),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                }]
            }
        });
    } else if (chartType === 'area') {
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: parsedData.map(item => item[xAxisKey]),
                datasets: [{
                    label: yAxisKey,
                    data: parsedData.map(item => item[yAxisKey]),
                    fill: true,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                }]
            },
            options: options
        });
    } else {
        chart = new Chart(ctx, {
            type: chartType,
            data: {
                datasets: [{
                    label: `(${xAxisKey} vs ${yAxisKey})`,
                    data: data,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    showLine: chartType !== 'scatter'
                }]
            },
            options: options
        });
    }
}    
document.getElementById('xAxis').addEventListener('change', updateChart);
document.getElementById('yAxis').addEventListener('change', updateChart);
document.getElementById('chartType').addEventListener('change', updateChart);
document.getElementById('generateBtn').addEventListener('click', updateChart);
document.getElementById('exportBtn').addEventListener('click', function() {
    var link = document.createElement('a');
    link.href = chart.toBase64Image();
    link.download = 'chart.png';
    link.click();
});