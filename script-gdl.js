const fs = require("fs");
const path = require("path");
const { exit } = require("process");

// Путь к файлам данных
const inputCoordsAndHeightsFilePath = path.join(__dirname, "input.data"); //	// Координаты и высоты формата: 2.280274484116, -1.642537572126, "39,40"	//	// 2.280274484116, -1.642537572126, "40,64"	//	// -2.683119037174, -5.004384032602, "39,43"	//	// -2.683119037174, -5.004384032602, "40,67"
const inputDataFilePath = path.join(__dirname, "data.data"); //	GDL исходный

const outputFilePath = path.join(__dirname, "code.gdl");
const outputMassFilePath = path.join(__dirname, "code-mass.gdl");
const outputMassTableFilePath = path.join(__dirname, "code-mass-table.gdl");

//Функция парсинга данных из файла с GDL-кодом
const parseGDLCode = (gdlCode) => {
  // удалим все строки, содержащие "pen"
  //const lines = gdlCode.filter((line) => !line.includes("pen"));

  // найдем строки, содержащие "text2"
  const text2Lines = gdlCode.filter((line) => line.includes("text2"));

  // удалим из строк символы "text2" и пробелы в начале строки
  const cleanedLines = text2Lines.map((line) =>
    line.replace(/text2/g, "").trim()
  );

  let x, y;

  // из последней строки получим x и y, при помощи регулярного выражения
  const match = cleanedLines[cleanedLines.length - 1].match(
    /(-?\d+\.\d+),\s?(-?\d+\.\d+)/
  );
  if (match) {
    x = parseFloat(match[1]);
    y = parseFloat(match[2]);
  }
  // И удалим последнюю строку из массива
  cleanedLines.pop();

  cleanedLines.forEach((line, index) => {
    const match = line.match(/(-?\d+\.\d+),\s?(-?\d+\.\d+)/);
    if (match) {
      const newX = parseFloat(match[1]) - x;
      const newY = parseFloat(match[2]) - y;
      cleanedLines[index] = line.replace(
        /(-?\d+\.\d+),\s?(-?\d+\.\d+)/,
        `${newX.toFixed(2)}, ${newY.toFixed(2)}`
      );
    }
  });

  // выведи в консоль максимальное и минимальное значение по x и y
  const xValues = cleanedLines.map((line) => parseFloat(line.split(",")[0]));
  const yValues = cleanedLines.map((line) => parseFloat(line.split(",")[1]));
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  // console.log("minX: ", minX);
  // console.log("maxX: ", maxX);
  // console.log("minY: ", minY);
  // console.log("maxY: ", maxY);

  // сохраним text2Lines построчно в файл inputDataFilePath
  fs.writeFileSync(inputCoordsAndHeightsFilePath, cleanedLines.join("\n"));

  //

  return text2Lines;
};

// Функция чтения данных из файла
const getDataFromFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return data
      .split("\n")
      .map((row) => row.trim())
      .filter((row) => row);
  } catch (error) {
    console.error(`Ошибка при чтении файла ${filePath}:`, error);
    return [];
  }
};

const parseCoordHeightData = (lines) => {
  if (!Array.isArray(lines)) return [];
  const result = [];
  for (let i = 0; i < lines.length; i += 2) {
    const xCoord = lines[i].split(",")[0];
    const yCoord = lines[i].split(",")[1];

    // найти в строке ковычки и взять значение от первого ковычки до второй и замерить запятую на точку
    const existing = +lines[i].split('"')[1].replace(/,/g, ".").split(",")[0];
    const projected = +lines[i + 1]
      .split('"')[1]
      .replace(/,/g, ".")
      .split(",")[0];

    result.push({
      x: xCoord,
      y: yCoord,
      eHigh: existing,
      pHigh: projected,
    });
  }

  return result;
};

// Функция для создания объектов кластеров
const createClustersOnGrid = (cornerData) => {
  const clusters = [];
  const step = 10;

  const xValues = cornerData.map((point) => point.x);
  const yValues = cornerData.map((point) => point.y);

  const minX = Math.floor(Math.min(...xValues) / step) * step;
  const maxX = Math.ceil(Math.max(...xValues) / step) * step;
  const minY = Math.floor(Math.min(...yValues) / step) * step;
  const maxY = Math.ceil(Math.max(...yValues) / step) * step;

  // Проходим по сетке и формируем кластеры
  for (let x = minX; x < maxX; x += step) {
    for (let y = maxY; y > minY; y -= step) {
      const cluster = [
        { x: x, y: y },
        { x: x + step, y: y },
        { x: x, y: y - step },
        { x: x + step, y: y - step },
      ];
      clusters.push(cluster);
    }
  }

  return clusters;
};

const gdlTable = (gdlTableMass) => {
  //	Создание объектов кластеров колонок

  let sumPositiveMass = 0; //	Сумма положительных масс
  let globalSumPositiveMass = 0; //	Глобальная сумма положительных масс
  let sumNegativeMass = 0; //	Сумма отрицательных масс
  let globalSumNegativeMass = 0; //	Глобальная сумма отрицательных масс

  let gdlScriptTable = `
! Установка начальных параметров стиля
DEFINE STYLE "TextStyle" "Arial", 5, 0
SET STYLE "TextStyle"

paragraph "AC_PRG_INITIAL" 3, 0, 0, 0, 1
	pen penAttribute_1
	set style "TextStyle"
endparagraph
`;

  // Используя gdlTableMass узнаем минимальные и максимальные значения по x и y
  const xValues = gdlTableMass.map((point) => point.x);
  const yValues = gdlTableMass.map((point) => point.y);
  const minX = Math.floor(Math.min(...xValues) / 10) * 10;
  const maxX = Math.ceil(Math.max(...xValues) / 10) * 10;
  const minY = Math.floor(Math.min(...yValues) / 10) * 10;
  const maxY = Math.ceil(Math.max(...yValues) / 10) * 10;
  console.log("minX: ", minX);
  console.log("maxX: ", maxX);
  console.log("minY: ", minY);
  console.log("maxY: ", maxY);

  const step = 10;
  let x;

  // Проходим по сетке и формируем кластеры
  for (x = minX; x < maxX; x += step) {
    for (let y = maxY; y > minY; y -= step) {
      const cluster = [
        { x: x, y: y },
        { x: x + step, y: y },
        { x: x, y: y - step },
        { x: x + step, y: y - step },
      ];

      // проверяем, вхождение в кластер X и Y одного из значений gdlTableMass
      // если да, то:
      // 1) добавляем в sumPositiveMass или sumNegativeMass в зависимости от знака
      // 2) удаляем этот элемент из gdlTableMass
      for (let i = 0; i < gdlTableMass.length; i++) {
        if (
          gdlTableMass[i].x >= x &&
          gdlTableMass[i].x <= x + step &&
          gdlTableMass[i].y <= y &&
          gdlTableMass[i].y >= y - step
        ) {
          if (gdlTableMass[i].mass > 0) {
            sumPositiveMass += +gdlTableMass[i].mass;
          } else {
            sumNegativeMass += +gdlTableMass[i].mass;
          }
          gdlTableMass.splice(i, 1);
          i--;
        }
      }
    }

    sumPositiveMass = Math.abs(sumPositiveMass).toFixed(2);
    sumNegativeMass = Math.abs(sumNegativeMass).toFixed(2);

    gdlScriptTable += `
TEXT2 ${x}, 0, "${sumPositiveMass}"
TEXT2 ${x}, -5, "${sumNegativeMass}"
`;
    // globalSumPositiveMass += sumPositiveMass;
    // globalSumNegativeMass += sumNegativeMass;
    // Сохраним глобальные суммы, чтобы они были числом
    globalSumPositiveMass += +sumPositiveMass;
    globalSumNegativeMass += +sumNegativeMass;
    sumPositiveMass = 0;
    sumNegativeMass = 0;
  }

  gdlScriptTable += `
TEXT2 ${x + step}, 0, "${globalSumPositiveMass.toFixed(2)}"
TEXT2 ${x + step}, -5, "${globalSumNegativeMass.toFixed(2)}"
`;

  return gdlScriptTable;
};

// Функция для получения точек, принадлежащих каждому кластеру
const pointsInClusters = (clusters, cellCornerData) => {
  // Массив объектов ячеек cellsData с координатами и разницей высот
  const cellsData = Array(clusters.length)
    .fill()
    .map(() => []);

  // Проверяем, входят ли координаты точек из cellCornerData внутрь квадрата координат clusters
  for (let i = 0; i < clusters.length; i++) {
    const xMin = clusters[i][0].x;
    const xMax = clusters[i][1].x;
    const yMax = clusters[i][0].y;
    const yMin = clusters[i][2].y;

    for (let j = 0; j < cellCornerData.length; j++) {
      if (cellCornerData[j].x >= xMin && cellCornerData[j].x <= xMax) {
        if (cellCornerData[j].y >= yMin && cellCornerData[j].y <= yMax) {
          cellsData[i].push({
            // x: (cellCornerData[j].x).toFixed(2),
            // y: (cellCornerData[j].y).toFixed(2),
            // x,y - округляем до 2 знаков после запятой
            x: +cellCornerData[j].x,
            y: +cellCornerData[j].y,

            hDiff: cellCornerData[j].hDiff,
          });
        }
      }
    }
  }

  // Удаляем все пустые ячейки
  const nonEmptyCellsData = cellsData.filter((cell) => cell.length > 0);

  return nonEmptyCellsData;
};

// Найдём центроид (среднюю точку) всех точек для сортировки
function getCentroid(points) {
  // console.log("points: ", points);
  let centroid = { x: 0, y: 0 };
  for (const point of points) {
    centroid.x += point.x;
    centroid.y += point.y;
  }
  centroid.x = +(centroid.x / points.length).toFixed(2); //
  centroid.y = +(centroid.y / points.length).toFixed(2);

  return centroid;
}

// Подсчёт площади многоугольника
const orderPointsClockwise = (points) => {
  if (!Array.isArray(points)) {
    console.error("Ошибка: points не является массивом", points);
    return [];
  }

  const centroid = getCentroid(points);

  // Сортировка точек на основе угла к центроиду
  points.sort((a, b) => {
    const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
    const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
    return angleA - angleB;
  });

  return points;
};

const calculateArea = (vertices) => {
  // // Упорядочим точки
  // console.log( 'before: ', vertices )
  const orderedVertices = orderPointsClockwise(vertices);
  // console.log('after: ', vertices )

  let area = 0;
  const n = orderedVertices.length;

  if (n < 3) {
    return 0;
  }

  // Рассчитываем площадь
  for (let i = 0; i < n; i++) {
    const { x: xi, y: yi } = orderedVertices[i];
    const { x: xNext, y: yNext } = orderedVertices[(i + 1) % n];
    area += xi * yNext - yi * xNext;
  }

  return Math.abs(area / 2);
};

const generateGDLCodeCombined = (clustersWithPoints) => {
  // Определение стилей для разностей высот и объёма
  const heightStyleHeader = `
  ! Установка начальных параметров стиля для разностей высотных отметок
  DEFINE STYLE "TextStyle" "Arial", 0.5, 0
  SET STYLE "TextStyle"
  
  paragraph "AC_PRG_INITIAL" 0.5, 0, 0, 0, 1
	  pen penAttribute_1
	  set style "TextStyle"
  endparagraph
  `;

  const volumeStyleHeader = `
  ! Установка начальных параметров стиля для объёма
  DEFINE STYLE "TextStyle" "Arial", 3, 0
  SET STYLE "TextStyle"
  
  paragraph "AC_PRG_INITIAL" 3, 0, 0, 0, 1
	  pen penAttribute_1
	  set style "TextStyle"
  endparagraph
  `;

  // Инициализация трех скриптов
  let gdlScript = heightStyleHeader; // Для вывода hDiff каждой точки
  let gdlMassScript = volumeStyleHeader; // Для вывода объёма по центроидам
  let gdlTableMass = []; // Для табличных масс

  // Обход каждого кластера
  for (let i = 0; i < clustersWithPoints.length; i++) {
    const cluster = clustersWithPoints[i];
    const area = calculateArea(cluster);

    if (area === 0) {
      // Если площадь равна 0, нельзя корректно вычислить объём
      continue;
    }

    // Вычисляем объём как площадь умноженная на среднее значение hDiff в кластере
    const volume = (
      area *
      (cluster.reduce((sum, point) => sum + point.hDiff, 0) / cluster.length)
    ).toFixed(2);

    // Вычисляем центроид кластера
    const centroid = getCentroid(cluster);

    // Формируем скрипт для разностей высот:
    // Для каждой точки в кластере выводим команду TEXT2 с координатами и значением hDiff
    for (let j = 0; j < cluster.length; j++) {
      const point = cluster[j];
      gdlScript += `\nTEXT2 ${point.x}, ${point.y}, "${point.hDiff}"`;
    }

    // Формируем скрипт для объёма:
    // Выводим одну команду TEXT2 в позициях центроида для обозначения объёма ячейки
    gdlMassScript += `\nTEXT2 ${centroid.x}, ${centroid.y}, "${volume}"`;

    gdlTableMass.push({ x: centroid.x, y: centroid.y, mass: volume });
  }

  return { gdlScript, gdlMassScript, gdlTableMass };
};

// Основной алгоритм работы с данными
parseGDLCode(getDataFromFile(inputDataFilePath));

const coordsAndHeightLines = getDataFromFile(inputCoordsAndHeightsFilePath);

const coordsAndHeightData = parseCoordHeightData(coordsAndHeightLines); // Парсим координаты и высотные отметки

// Создание массива объектов углов ячеек
const cellCornerData = coordsAndHeightData.map((point) => ({
  x: point.x,
  y: point.y,
  hDiff: +(point.pHigh - point.eHigh).toFixed(2),
}));

// Создание массива кластеров
const clusters = createClustersOnGrid(cellCornerData);
console.log(`Количество проверяемых кластеров: ${clusters.length}`);

// Получение точек, принадлежащих каждому кластеру
const clustersWithPoints = pointsInClusters(clusters, cellCornerData);

// Создание GDL-скрипта для разностей высот и объёма
// формирование данных табличных масс
const { gdlScript, gdlMassScript, gdlTableMass } =
  generateGDLCodeCombined(clustersWithPoints);

fs.writeFileSync(outputFilePath, gdlScript, "utf8");
console.log(
  `GDL-код (РАЗНИЦА ВЫСОТ) успешно записан в файл: ${outputFilePath}`
);

fs.writeFileSync(outputMassFilePath, gdlMassScript, "utf8");
console.log(`GDL-код (МАССЫ) успешно записан в файл: ${outputMassFilePath}`);

// Создание GDL-скрипта для табличных масс
const gdlScriptTable = gdlTable(gdlTableMass);

fs.writeFileSync(outputMassTableFilePath, gdlScriptTable, "utf8");
console.log(
  `GDL-код (ТАБЛИЦА) успешно записан в файл: ${outputMassTableFilePath}`
);
