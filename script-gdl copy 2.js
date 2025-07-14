const fs = require("fs");
const path = require("path");
const { exit } = require("process");

// Путь к файлам данных
// const inputHeightsFilePath = path.join(__dirname, "input.data");
// const inputCoordsFilePath = path.join(__dirname, "input-xy.data");
const inputCoordsAndHeightsFilePath = path.join(__dirname, "input.data");		//	// Координаты и высоты формата: 2.280274484116, -1.642537572126, "39,40"	//	// 2.280274484116, -1.642537572126, "40,64"	//	// -2.683119037174, -5.004384032602, "39,43"	//	// -2.683119037174, -5.004384032602, "40,67"
const inputDataFilePath = path.join(__dirname, "data.data");					//	GDL исходный 
const devDataFilePath = path.join(__dirname, "dataDev.data");					//	GDL исходный 
const outputFilePath = path.join(__dirname, "code.gdl");	
const outputMassFilePath = path.join(__dirname, "code-mass.gdl");
const outputMassTableFilePath = path.join(__dirname, "code-mass-table.gdl");



let massCount = 0;

//Функция парсинга данных из файла с GDL-кодом
const parseGDLCode = (gdlCode) => {
	
	// удалим все строки, содержащие "pen"
	//const lines = gdlCode.filter((line) => !line.includes("pen"));

	// найдем строки, содержащие "text2"
	const text2Lines = 	gdlCode.filter((line) => line.includes("text2"));

	// удалим из строк символы "text2" и пробелы в начале строки	
	const cleanedLines = text2Lines.map((line) => line.replace(/text2/g, "").trim());

	let x, y;

	// из последней строки получим x и y, при помощи регулярного выражения
	const match = cleanedLines[cleanedLines.length - 1].match(/(-?\d+\.\d+),\s?(-?\d+\.\d+)/);
	if (match) {
		x = parseFloat(match[1]);
		y = parseFloat(match[2]);
	}
	console.log("x: ", x);
	console.log("y: ", y);
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



// Функция преобразования строки в число
const parseNumber = (str) => {
	if (!str || typeof str !== "string") return 0;
	return parseFloat(str.replace(",", ".")) || 0;
};
// Функция парсинга данных координат и высот
// шаблон данных:
// 2.280274484116, -1.642537572126, "39,40"

// 2.280274484116, -1.642537572126, "40,64"

// -2.683119037174, -5.004384032602, "39,43"

// -2.683119037174, -5.004384032602, "40,67"

// нужно:

// перое число в строке назначить X,
// второе число (после запятой) в строке назначить,
// взять строковое значение в строке назначить existing
// взять только строковое значение из следующей строки назначить projected

const parseCoordHeightData = (lines) => {
	if (!Array.isArray(lines)) return [];
	const result = [];
	for (let i = 0; i < lines.length; i += 2) {
		const xCoord = lines[i].split(",")[0];

		const yCoord = lines[i].split(",")[1];

		// взять строковое значение в строке
		// найти в строке ковычки и взять значение от первого ковычки до второй и замерить запятую на точку
		const projected = +lines[i] 
			.split('"')[1]
			.replace(/,/g, ".")
			.split(",")[0];
		//	console.log(lines[i + 1], '-----------------', lines.length);
		const existing = +lines[i + 1]
			.split('"')[1]
			.replace(/,/g, ".")
			.split(",")[0];	// // взять только строковое значение из следующей строки назначить projected

		// if (i > 10) {
		// 	console.log(result);
		// 	process.exit(1); // для отладки
		// }
		// const projected =
		// 	i + 1 < lines.length ? parseNumber(lines[i + 1].split(",")[2]) : 0;
		result.push({
			x: xCoord,
			y: yCoord,
			eHigh: existing,
			pHigh: projected,
		});
	}

	// console.log(result.length);

	// process.exit(1);

	return result;

	function customRound(num) {
		const fraction = num % 1; // Получаем дробную часть
		// console.log(Math.abs(fraction));
		if (1 - Math.abs(fraction) < 0.02 || Math.abs(fraction) < 0.02) {
			return Math.round(num); // Округляем, если остаток меньше или равен 0.01
		}
		return num; // Возвращаем число как есть
	}
};

// Функция парсинга данных координат
// const parseCoordData = (lines) => {
// 	if (!Array.isArray(lines)) return [];
// 	const result = [];
// 	for (let i = 0; i < lines.length; i += 2) {
// 		const xCoord = parseNumber(lines[i].split(":")[1]);
// 		const yCoord =
// 			i + 1 < lines.length ? parseNumber(lines[i + 1].split(":")[1]) : 0;
// 		result.push({ x: xCoord, y: yCoord });
// 	}
// 	return result; // Возвращаем массив вида: [{ x: 1, y: 2 }, { x: 3, y: 4 }]
// };

// // Функция парсинга данных высот
// const parseHeightData = (lines) => {
// 	if (!Array.isArray(lines)) return [];
// 	const result = [];
// 	for (let i = 0; i < lines.length; i += 2) {
// 		const existing = parseNumber(lines[i]);
// 		const projected = i + 1 < lines.length ? parseNumber(lines[i + 1]) : 0;
// 		result.push({ existing, projected });
// 	}
// 	return result; // Возвращаем массив вида: [{ existing: 1, projected: 2 }, { existing: 3, projected: 4 }]
// };

// Функция парсинга данных из таблицы (данные в виде строки, где каждый элемент разделен табуляцией). результат - одномерный массив
const parseTableData = (lines) => {
	if (!Array.isArray(lines)) return [];
	const result = lines.map((line) => line.split("\t")).flat(); // Расплющиваем массив массивов в одномерный
	// console.log(result);
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
const createClustersOnColumn = (gdlTableMass) => {	//	// Создание объектов кластеров колонок
	/*
	// const clusters = [];
	// const step = 10;

	// const xValues = cornerData.map((point) => point.x);
	// const yValues = cornerData.map((point) => point.y);

	// const minX = Math.floor(Math.min(...xValues) / step) * step;
	// const maxX = Math.ceil(Math.max(...xValues) / step) * step;
	// const minY = Math.floor(Math.min(...yValues) / step) * step;
	// const maxY = Math.ceil(Math.max(...yValues) / step) * step;

	// // Проходим по сетке и формируем кластеры
	// for (let x = minX; x < maxX; x += step) {
	// 	const cluster = [
	// 		{ x: x, y: -30 },
	// 		{ x: x + step, y: -30 },
	// 		{ x: x, y: -640 },
	// 		{ x: x + step, y: -640 },
	// 	];
	// 	clusters.push(cluster);
	// }
	// // console.log(clusters.length);
	// // process.exit(1);
	// return clusters;		// */
		
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
	// задать цикл в цикле по x и y c шагом 10 и для каждого кластера из gdlTableMass вытащить mass 
	// и записать в массив clusters
	

	
		// console.log(clusterMassSum);
		// console.log(clusterMass);
		process.exit(1);
	
	// console.log(clusters.length);
	fs.writeFileSync(devDataFilePath, JSON.stringify(clusters), "utf8");

	process.exit(1);
	return clusters;

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
				if (
					cellCornerData[j].y >= yMin &&
					cellCornerData[j].y <= yMax
				) {
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
		// Упорядочим точки
		// const orderedVertices = orderPointsClockwise(vertices);
	}

	// Удаляем все пустые ячейки
	const nonEmptyCellsData = cellsData.filter((cell) => cell.length > 0);

	// console.log(nonEmptyCellsData);
	return nonEmptyCellsData;
};

const pointsInClustersColumn = (clusters, cellCornerData) => {
	
	// Массив объектов колонок cellsData с координатами и разницей высот
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
				if (
					cellCornerData[j].y >= yMin &&
					cellCornerData[j].y <= yMax
				) {
					cellsData[i].push({
						x: cellCornerData[j].x,
						y: cellCornerData[j].y,
						hDiff: cellCornerData[j].hDiff,
					});
				}
			}
		}
		// Упорядочим точки
		// const orderedVertices = orderPointsClockwise(vertices);
	// 	console.log(nonEmptyCellsData);
	// process.exit(1);
	}

	// Удаляем все пустые ячейки
	const nonEmptyCellsData = cellsData.filter((cell) => cell.length > 0);

	// console.log(nonEmptyCellsData);
	// process.exit(1);
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
	centroid.x = +(centroid.x / points.length).toFixed(3); //
	centroid.y = +(centroid.y / points.length).toFixed(3);

	// console.log("centroid(getCentroid): ", centroid);
	return centroid;
}

// Подсчёт площади многоугольника
const orderPointsClockwise = (points) => {
	if (!Array.isArray(points)) {
		console.error("Error: points is not an array", points);
		return [];
	}
	// console.log( points );
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
		// console.error("Недостаточно вершин для формирования многоугольника"); // Недостаточно вершин для формирования многоугольника

		// console.log("Вершины:");
		// console.log(vertices);
		// console.log(` ----------------`);

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

// const calculateArea = (vertices) => {
//     // Прямо вызываем функцию расчета площади
//     return calculatePolygonArea(vertices);
// };

// Генерация GDL-кода для вывода данных одномерного массива (со значениями типа: '709,437',   '5532,909') используя TEXT2 c шагом 10 по x. y = 0
const generateGDLCodeForTableData = (tableData) => {
	// Установка начальных параметров стиля
	let gdlScript = `
! Установка начальных параметров стиля
DEFINE STYLE "TextStyle" "Arial", 5, 0
SET STYLE "TextStyle"

paragraph "AC_PRG_INITIAL" 3, 0, 0, 0, 1
	pen penAttribute_1
	set style "TextStyle"
endparagraph
`;

	// Генерация GDL-кода для вывода данных одномерного массива (со значениями типа: '709,437',   '5532,909') используя TEXT2 c шагом 10 по x. y = 0

	for (let i = 0; i < tableData.length; i++) {
		gdlScript += `


TEXT2 ${i * 10}, 0, "${tableData[i]}"
`;
	}

	return gdlScript;
};

// Генерация GDL-кода	
/*
const generateGDLCode = (clustersWithPoints) => {
	// Установка начальных параметров стиля
	let gdlScript = `
! Установка начальных параметров стиля для разностей высотных отметок
DEFINE STYLE "TextStyle" "Arial", 0.5, 0
SET STYLE "TextStyle"

paragraph "AC_PRG_INITIAL" 0.5, 0, 0, 0, 1
    pen penAttribute_1
    set style "TextStyle"
endparagraph
`;

	let gdlMassScript = `
! Установка начальных параметров стиля для объема
DEFINE STYLE "TextStyle" "Arial", 3, 0
SET STYLE "TextStyle"

paragraph "AC_PRG_INITIAL" 3, 0, 0, 0, 1
    pen penAttribute_1
    set style "TextStyle"
endparagraph
`;

	let xTable = 20;	//	// Начальная позиция по x для таблицы	
	let sumMass = 0;

	for (let i = 0; i < clustersWithPoints.length; i++) {	//
		const area = calculateArea(clustersWithPoints[i]);
		if (area == 0) {
			// console.error("Недостаточно вершин для формирования многоугольника"); // Недостаточно вершин для формирования многоугольника
			// console.log(clustersWithPoints[i]);
			// process.exit(1);
			continue;
		}
		// console.log(`Площадь ячейки ${i + 1}: `, area);
		
		// process.exit(1);

		const volume = (
			area *
			(clustersWithPoints[i].reduce(
				(sum, point) => sum + point.hDiff,
				0
			) /
				clustersWithPoints[i].length)
		).toFixed(3);
		const centroid = getCentroid(clustersWithPoints[i]);
		//конвертирую volume в integer
		// volume = parseInt(volume);
		// massCount += parseInt(volume);
		// console.log('----------------------------------');
		// console.log( `Ячейка ${i + 1}` );

		// console.log(`Центр: `, centroid);
		// console.log( `Объём: `, volume );
		// console.log('----------------------------------');

		// process.exit(1);

		// Формирование данных для каждой ячейки

		for (let j = 0; j < clustersWithPoints[i].length; j++) {
			const point = clustersWithPoints[i][j];
			const heightDiff = point.hDiff;

			gdlScript += `
TEXT2 ${point.x}, ${point.y}, "${heightDiff}"
`;
		}

		gdlMassScript += `
TEXT2 ${centroid.x}, ${centroid.y}, "${volume}"
`;
	}

	// process.exit(1);

	return { gdlScript, gdlMassScript };
};		//  */

const generateGDLCodeTable = (clustersWithPointsColumn) => {
     // Установка начальных параметров стиля
     

	// return  gdlTableMassScript ;
};
	// */
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
	let gdlScript = heightStyleHeader;       // Для вывода hDiff каждой точки
	let gdlMassScript = volumeStyleHeader;     // Для вывода объёма по центроидам
	let gdlTableMass = []; 	// Для табличных масс

	// // Начальная позиция по X для табличного скрипта
	// let xTable = 20;

     // let sumPositiveVolume = 0;
     // let sumNegativeVolume = 0;

	// let prevY = 0; // Переменная для хранения предыдущего значения Y
  
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
          ).toFixed(3);
     
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
     
		  gdlTableMass.push({ x:centroid.x, y:centroid.y, mass:volume });

          // Табличный скрипт: суммирование по колонке данных положительного объёма 
          // и запись в переменную sumPоsitiveVolume и отрицательного объёма в переменную sumNegativeVolume
          // после того, как данная колонка будет заполнена, запись в gdlTableScript зачения двуж этих переменных.
          // первая - в координату (xTable, 0). вторая - в координату (xTable, 20).
          // После записи в gdlTableScript, xTable увеличивается на 20.
          // Суммируем положительные и отрицательные объёмы
          
     
          // if (volume > 0) {
          //      sumPositiveVolume += parseFloat(volume);
          // } else {
          //      sumNegativeVolume += parseFloat(volume);
          // }
     
          // // проверяем, y > prevY
          // if (centroid.y > prevY) {
          //      gdlTableScript += `\nTEXT2 ${xTable}, 0, "${sumPositiveVolume}"`;
          //      gdlTableScript += `\nTEXT2 ${xTable}, -20, "${sumNegativeVolume}"`;
          //      xTable += 20; // Увеличиваем позицию по X для следующей записи
          // }
          // prevY = centroid.y;
	  

		  
		//   process.exit(1);

	}
	// fs.writeFileSync(devDataFilePath, JSON.stringify(gdlTableMass), "utf8");
  
	return { gdlScript, gdlMassScript, gdlTableMass };
  };
  

// Основной алгоритм работы с данными
const processData = () => {
	
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


	// сохраним в файл devDataFilePath
	// fs.writeFileSync(devDataFilePath, JSON.stringify(clustersWithPoints), "utf8");
	

	const { gdlScript, gdlMassScript, gdlTableMass } = generateGDLCodeCombined(
		clustersWithPoints
	);     
	
	fs.writeFileSync(outputFilePath, gdlScript, "utf8");
	console.log(
		`GDL-код (РАЗНИЦА ВЫСОТ) успешно записан в файл: ${outputFilePath}`
	);

	fs.writeFileSync(outputMassFilePath, gdlMassScript, "utf8");
	console.log(
		`GDL-код (МАССЫ) успешно записан в файл: ${outputMassFilePath}`
	);


	// Создание массива кластеров колонок
	const clustersColumn = createClustersOnColumn(gdlTableMass);
	console.log(`Количество проверяемых кластеров колонок: ${clustersColumn.length}`);	

	// Получение точек, принадлежащих каждому кластеру колонок
	const clustersWithPointsColumn = pointsInClustersColumn(
		clustersColumn,
		cellCornerData
	);
	
	// сохраним в файл devDataFilePath
	// fs.writeFileSync(devDataFilePath, JSON.stringify(clustersWithPointsColumn), "utf8");

	// process.exit(1);

	const gdlMassTableScript = generateGDLCodeTable(clustersWithPointsColumn);

     fs.writeFileSync(outputMassTableFilePath, gdlMassTableScript, "utf8");
     console.log(
          `GDL-код (ТАБЛИЦА) успешно записан в файл: ${outputMassTableFilePath}`
     );
	
	// console.log(` gdlMassTableScript: ${gdlMassTableScript}`)

	// console.log(gdlScript)
	// process.exit(1);

	// fs.writeFileSync(outputFilePath, gdlScript, "utf8");
	// fs.writeFileSync(outputMassFilePath, gdlMassScript, "utf8");
	

	// console.log(
	// 	`GDL-код успешно записан в файлы: ${outputFilePath} и ${outputMassFilePath}`
	// );
	// console.log(massCount);
	// console.log(clustersWithPoints.length);
};



// Запуск основного процесса

parseGDLCode (getDataFromFile( inputDataFilePath ) );

processData();
// завершение работы
// process.exit(1);