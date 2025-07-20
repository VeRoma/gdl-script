const fs = require("fs");
const path = require("path");
// Подключаем библиотеку для построения ВОГНУТОЙ оболочки
const concaveman = require('concaveman');

// --- ПУТИ К ФАЙЛАМ ---
const inputCoordsAndHeightsFilePath = path.join(__dirname, "input.data");
const inputDataFilePath = path.join(__dirname, "data.data");
const outputFilePath = path.join(__dirname, "code.gdl");
const outputMassFilePath = path.join(__dirname, "code-mass.gdl");
const outputMassTableFilePath = path.join(__dirname, "code-mass-table.gdl");
const outputAreaFilePath = path.join(__dirname, "code-areas.gdl");

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

const parseGDLCode = (gdlCode) => {
    const text2Lines = gdlCode.filter((line) => line.includes("text2"));
    const cleanedLines = text2Lines.map((line) => line.replace(/text2/g, "").trim());
    let x, y;
    const match = cleanedLines[cleanedLines.length - 1].match(/(-?\d+\.\d+),\s?(-?\d+\.\d+)/);
    if (match) {
        x = parseFloat(match[1]);
        y = parseFloat(match[2]);
    }
    cleanedLines.pop();
    cleanedLines.forEach((line, index) => {
        const match = line.match(/(-?\d+\.\d+),\s?(-?\d+\.\d+)/);
        if (match) {
            const newX = parseFloat(match[1]) - x;
            const newY = parseFloat(match[2]) - y;
            cleanedLines[index] = line.replace(/(-?\d+\.\d+),\s?(-?\d+\.\d+)/, `${newX.toFixed(2)}, ${newY.toFixed(2)}`);
        }
    });
    fs.writeFileSync(inputCoordsAndHeightsFilePath, cleanedLines.join("\n"));
};

const getDataFromFile = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, "utf8");
        return data.split("\n").map((row) => row.trim()).filter((row) => row);
    } catch (error) {
        console.error(`Ошибка при чтении файла ${filePath}:`, error);
        return [];
    }
};

const parseCoordHeightData = (lines) => {
    if (!Array.isArray(lines)) return [];
    const result = [];
    for (let i = 0; i < lines.length; i += 2) {
        if (!lines[i + 1]) continue;
        const xCoord = lines[i].split(",")[0];
        const yCoord = lines[i].split(",")[1];
        const projected = +lines[i].split('"')[1].replace(/,/g, ".").split(",")[0];
        const existing = +lines[i + 1].split('"')[1].replace(/,/g, ".").split(",")[0];
        result.push({ x: xCoord, y: yCoord, eHigh: existing, pHigh: projected });
    }
    return result;
};

const createClustersOnGrid = (cornerData) => {
    const clusters = [];
    const step = 10;
    const xValues = cornerData.map((point) => parseFloat(point.x));
    const yValues = cornerData.map((point) => parseFloat(point.y));
    const minX = Math.floor(Math.min(...xValues) / step) * step;
    const maxX = Math.ceil(Math.max(...xValues) / step) * step;
    const minY = Math.floor(Math.min(...yValues) / step) * step;
    const maxY = Math.ceil(Math.max(...yValues) / step) * step;
    for (let x = minX; x < maxX; x += step) {
        for (let y = maxY; y > minY; y -= step) {
            const cluster = [{ x: x, y: y }, { x: x + step, y: y }, { x: x, y: y - step }, { x: x + step, y: y - step }];
            clusters.push(cluster);
        }
    }
    return clusters;
};

const pointsInClusters = (clusters, cellCornerData) => {
    const cellsData = Array(clusters.length).fill().map(() => []);
    for (let i = 0; i < clusters.length; i++) {
        const xMin = clusters[i][0].x;
        const xMax = clusters[i][1].x;
        const yMax = clusters[i][0].y;
        const yMin = clusters[i][2].y;
        for (let j = 0; j < cellCornerData.length; j++) {
            if (
                cellCornerData[j].x >= xMin && cellCornerData[j].x <= xMax &&
                cellCornerData[j].y >= yMin && cellCornerData[j].y <= yMax
            ) {
                cellsData[i].push({
                    x: +cellCornerData[j].x,
                    y: +cellCornerData[j].y,
                    hDiff: cellCornerData[j].hDiff,
                });
            }
        }
    }
    return cellsData;
};

function getCentroid(points) {
    let centroid = { x: 0, y: 0 };
    if (points.length === 0) return centroid;
    for (const point of points) {
        centroid.x += point.x;
        centroid.y += point.y;
    }
    centroid.x = +(centroid.x / points.length).toFixed(2);
    centroid.y = +(centroid.y / points.length).toFixed(2);
    return centroid;
}

// --- ИЗМЕНЕННАЯ ФУНКЦИЯ РАСЧЕТА ПЛОЩАДИ ---
const calculateArea = (vertices) => {
    if (!Array.isArray(vertices) || vertices.length < 3) {
        return 0;
    }
    // 1. Преобразуем точки в формат, понятный библиотеке: [[x1, y1], [x2, y2], ...]
    const pointCoordinates = vertices.map(p => [p.x, p.y]);
    
    // 2. Вычисляем вогнутую оболочку. Библиотека СРАЗУ возвращает упорядоченный массив вершин
    const orderedPoints = concaveman(pointCoordinates);

    // 3. Считаем площадь по формуле Гаусса (шнурков)
    let area = 0;
    const n = orderedPoints.length;
    if (n < 3) {
        return 0;
    }
    for (let i = 0; i < n; i++) {
        const p1 = orderedPoints[i];
        const p2 = orderedPoints[(i + 1) % n];
        area += p1[0] * p2[1] - p2[0] * p1[1];
    }
    return Math.abs(area / 2);
};
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

const gdlTable = (gdlTableMass) => {
    let globalSumPositiveMass = 0;
    let globalSumNegativeMass = 0;
    let gdlScriptTable = `! GDL Table of Earthwork Masses\nDEFINE STYLE "TextStyle" "Arial", 5, 0\nSET STYLE "TextStyle"\n`;

    if (!gdlTableMass || gdlTableMass.length === 0) return gdlScriptTable;

    const xValues = gdlTableMass.map((point) => point.x);
    const minX = Math.floor(Math.min(...xValues) / 10) * 10;
    const maxX = Math.ceil(Math.max(...xValues) / 10) * 10;
    const step = 10;

    for (let currentX = minX; currentX < maxX; currentX += step) {
        let positiveColumnMass = 0;
        let negativeColumnMass = 0;
        for (const item of gdlTableMass) {
            if (item.x >= currentX && item.x < currentX + step) {
                const mass = parseFloat(item.mass);
                if (mass > 0) {
                    positiveColumnMass += mass;
                } else {
                    negativeColumnMass += mass;
                }
            }
        }
        gdlScriptTable += `\nTEXT2 ${currentX + step / 2}, 0, "${positiveColumnMass.toFixed(2)}"`;
        gdlScriptTable += `\nTEXT2 ${currentX + step / 2}, -5, "${Math.abs(negativeColumnMass).toFixed(2)}"`;
        globalSumPositiveMass += positiveColumnMass;
        globalSumNegativeMass += negativeColumnMass;
    }

    gdlScriptTable += `\n! --- TOTAL ---`;
    gdlScriptTable += `\nTEXT2 ${maxX + step}, 0, "${globalSumPositiveMass.toFixed(2)}"`;
    gdlScriptTable += `\nTEXT2 ${maxX + step}, -5, "${Math.abs(globalSumNegativeMass).toFixed(2)}"`;
    return gdlScriptTable;
};

const generateGDLCodeCombined = (clustersWithPoints) => {
    const heightStyleHeader = `! Heights Differences\nDEFINE STYLE "TextStyle" "Arial", 0.5, 0\nSET STYLE "TextStyle"`;
    const volumeStyleHeader = `! Earthwork Volumes\nDEFINE STYLE "TextStyle" "Arial", 3, 0\nSET STYLE "TextStyle"`;
    const areaStyleHeader = `! Calculated Areas\nDEFINE STYLE "TextStyle" "Arial", 3, 0\nSET STYLE "TextStyle"`;
    
    let gdlScript = heightStyleHeader;
    let gdlMassScript = volumeStyleHeader;
    let gdlAreaScript = areaStyleHeader;
    let gdlTableMass = [];

    if (!Array.isArray(clustersWithPoints)) {
        return { gdlScript, gdlMassScript, gdlAreaScript, gdlTableMass };
    }

    for (const cluster of clustersWithPoints) {
        if (cluster.length < 3) continue;

        const area = calculateArea(cluster);
        if (area === 0) continue;

        const volume = (
            area *
            (cluster.reduce((sum, point) => sum + point.hDiff, 0) / cluster.length)
        ).toFixed(2);

        const centroid = getCentroid(cluster);
        for (const point of cluster) {
            gdlScript += `\nTEXT2 ${point.x}, ${point.y}, "${point.hDiff.toFixed(2)}"`;
        }
        gdlMassScript += `\nTEXT2 ${centroid.x}, ${centroid.y}, "${volume}"`;
        gdlAreaScript += `\nTEXT2 ${centroid.x}, ${centroid.y}, "${area.toFixed(2)}"`;
        
        gdlTableMass.push({ x: centroid.x, y: centroid.y, mass: volume });
    }
    return { gdlScript, gdlMassScript, gdlAreaScript, gdlTableMass };
};

// --- ОСНОВНОЙ АЛГОРИТМ ---
console.log("Запуск скрипта...");
parseGDLCode(getDataFromFile(inputDataFilePath));
const coordsAndHeightLines = getDataFromFile(inputCoordsAndHeightsFilePath);
const coordsAndHeightData = parseCoordHeightData(coordsAndHeightLines);
const cellCornerData = coordsAndHeightData.map((point) => ({
    x: parseFloat(point.x),
    y: parseFloat(point.y),
    hDiff: +(point.pHigh - point.eHigh).toFixed(2),
}));

const clusters = createClustersOnGrid(cellCornerData);
const clustersWithPoints = pointsInClusters(clusters, cellCornerData);
const { gdlScript, gdlMassScript, gdlAreaScript, gdlTableMass } = generateGDLCodeCombined(clustersWithPoints);

fs.writeFileSync(outputFilePath, gdlScript, "utf8");
console.log(`GDL-код (РАЗНИЦА ВЫСОТ) успешно записан в файл: ${outputFilePath}`);
fs.writeFileSync(outputMassFilePath, gdlMassScript, "utf8");
console.log(`GDL-код (МАССЫ) успешно записан в файл: ${outputMassFilePath}`);
fs.writeFileSync(outputAreaFilePath, gdlAreaScript, "utf8");
console.log(`GDL-код (ПЛОЩАДИ) успешно записан в файл: ${outputAreaFilePath}`);
const gdlScriptTable = gdlTable(gdlTableMass);
fs.writeFileSync(outputMassTableFilePath, gdlScriptTable, "utf8");
console.log(`GDL-код (ТАБЛИЦА) успешно записан в файл: ${outputMassTableFilePath}`);

console.log("Готово!");
