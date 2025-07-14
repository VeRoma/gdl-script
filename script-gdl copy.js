const fs = require("fs");
const path = require("path");

// Путь к файлам данных
// const inputHeightsFilePath = path.join(__dirname, "input.data");
// const inputCoordsFilePath = path.join(__dirname, "input-xy.data");
const inputCoordsAndHeightsFilePath = path.join(__dirname, "input.data");		//	// Координаты и высоты формата: 2.280274484116, -1.642537572126, "39,40"	//	// 2.280274484116, -1.642537572126, "40,64"	//	// -2.683119037174, -5.004384032602, "39,43"	//	// -2.683119037174, -5.004384032602, "40,67"
const inputDataFilePath = path.join(__dirname, "data.data");					//	необходимый файл, но для отладки делает 
const outputFilePath = path.join(__dirname, "code.gdl");	
const outputMassFilePath = path.join(__dirname, "code-mass.gdl");
const outputMassTableFilePath = path.join(__dirname, "code-mass-table.gdl");

let massCount = 0;

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
		const xCoord = +customRound(
			(Math.round(
				(parseNumber(lines[i].split(",")[0]) - 2.280274484116) * 100
			) +
				8000) /
				100
		);

		const yCoord = +customRound(
			(Math.round(
				(parseNumber(lines[i].split(",")[1]) + 1.642537572126) * 100
			) -
				3663) /
				100
		);

		// взять строковое значение в строке
		// найти в строке ковычки и взять значение от первого ковычки до второй и замерить запятую на точку
		const existing = +lines[i]
			.split('"')[1]
			.replace(/,/g, ".")
			.split(",")[0];
		const projected = +lines[i + 1]
			.split('"')[1]
			.replace(/,/g, ".")
			.split(",")[0];

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
const createClustersOnColumn = (cornerData) => {
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
		const cluster = [
			{ x: x, y: -30 },
			{ x: x + step, y: -30 },
			{ x: x, y: -640 },
			{ x: x + step, y: -640 },
		];
		clusters.push(cluster);
	}
	// console.log(clusters.length);
	// process.exit(1);
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
						x: cellCornerData[j].x,
						y: cellCornerData[j].y,
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
	// console.log("111");
	// process.exit(1);
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
	// console.log( points );
	let centroid = { x: 0, y: 0 };
	for (const point of points) {
		centroid.x += point.x;
		centroid.y += point.y;
	}
	centroid.x = (centroid.x / points.length).toFixed(3); //
	centroid.y = (centroid.y / points.length).toFixed(3);

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
		console.error("Недостаточно вершин для формирования многоугольника"); // Недостаточно вершин для формирования многоугольника

		console.log("Вершины:");
		console.log(vertices);
		console.log(` ----------------`);

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

	let xTable = 20;
	let sumMass = 0;

	for (let i = 0; i < clustersWithPoints.length; i++) {
		const area = calculateArea(clustersWithPoints[i]);
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

	return { gdlScript, gdlMassScript };
};

const generateGDLCodeTable = (clustersWithPoints) => {
	// Установка начальных параметров стиля	

	let gdlMassScript = `
! Установка начальных параметров стиля для объема
DEFINE STYLE "TextStyle" "Arial", 3, 0
SET STYLE "TextStyle"

paragraph "AC_PRG_INITIAL" 3, 0, 0, 0, 1
    pen penAttribute_1
    set style "TextStyle"
endparagraph
`;

	let xTable = 20;
	let sumMass = 0;

	for (let i = 0; i < clustersWithPoints.length; i++) {
		const area = calculateArea(clustersWithPoints[i]);
		const volume = (
			area *
			(clustersWithPoints[i].reduce(
				(sum, point) => sum + point.hDiff,
				0
			) /
				clustersWithPoints[i].length)
		).toFixed(3);

		console.log( clustersWithPoints[i])
		process.exit(1);

		const centroid = getCentroid(clustersWithPoints[i]);
		
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

	return { gdlScript, gdlMassScript };
};

// Основной алгоритм работы с данными
const processData = () => {
	// const heightLines = getDataFromFile(inputHeightsFilePath); // 	Высотные отметки
	// const coordLines = getDataFromFile(inputCoordsFilePath); //	Координаты
	const coordsAndHeightLines = getDataFromFile(inputCoordsAndHeightsFilePath);
	// console.log(coordsAndHeightLines);

	const dataLines = getDataFromFile(inputDataFilePath); //	Данные из таблицы

	const coordsAndHeightData = parseCoordHeightData(coordsAndHeightLines); // Парсим координаты и высотные отметки
	// console.log(coordsAndHeightData);
	// const heightData = parseHeightData(heightLines); // 	Парсим высотные отметки
	// const coordData = parseCoordData(coordLines); //	Парсим координаты
	const tableData = parseTableData(dataLines); //	Парсим данные

	// if (heightData.length !== coordData.length) {
	// 	console.error(
	// 		"Количество высотных отметок не совпадает с количеством координат!"
	// 	);
	// 	return;
	// }

	// Создание массива объектов углов ячеек
	const cellCornerData = coordsAndHeightData.map((point) => ({
		x: point.x,
		y: point.y,
		hDiff: +(point.pHigh - point.eHigh).toFixed(2),
	}));

	// console.log(cellCornerData);

	// process.exit(1);

	// Создание массива кластеров
	const clusters = createClustersOnGrid(cellCornerData);

	// Получение точек, принадлежащих каждому кластеру
	const clustersWithPoints = pointsInClusters(clusters, cellCornerData);

	// Выводим в GDL

	// for (let i = 0; i < clustersWithPoints.length; i++) {
	// 	const area = (calculateArea(clustersWithPoints[i]));
	// 	const volume = (area * (clustersWithPoints[i].reduce((sum, point) => sum + point.hDiff, 0) / clustersWithPoints[i].length)).toFixed(3);

	// 	console.log('----------------------------------');
	// 	console.log( `Ячейка ${i + 1}` );

	// 	console.log(`Центр: `, getCentroid(clustersWithPoints[i]));
	// 	console.log( `Объём: `, volume );
	// 	console.log('----------------------------------');
	// }

	// generateGDLCode( clustersWithPoints );

	const { gdlScript, gdlMassScript } = generateGDLCode(clustersWithPoints);

	// console.log( tableData);

	// Создание массива кластеров колонок
	const clustersColumn = createClustersOnColumn(cellCornerData);

	// Получение точек, принадлежащих каждому кластеру колонок
	const clustersWithPointsColumn = pointsInClustersColumn(
		clustersColumn,
		cellCornerData
	);

	const gdlMassTableScript = generateGDLCodeTable(clustersWithPointsColumn);

	fs.writeFileSync(outputFilePath, gdlScript, "utf8");
	fs.writeFileSync(outputMassFilePath, gdlMassScript, "utf8");
	fs.writeFileSync(outputMassTableFilePath, gdlMassTableScript, "utf8");

	console.log(
		`GDL-код успешно записан в файлы: ${outputFilePath} и ${outputMassFilePath}`
	);
	console.log(massCount);
	console.log(clustersWithPoints.length);
};

// Запуск основного процесса
processData();
