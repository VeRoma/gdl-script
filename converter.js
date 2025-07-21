const fs = require('fs');
const path = require('path');

/**
 * Эта функция парсит GDL-файл сложного формата, где данные о точке
 * (координаты и высота) разнесены по разным блокам.
 * Используется надежный двухпроходный алгоритм.
 * @param {string} fileContent - Содержимое GDL-файла в виде строки.
 * @returns {Array<object>} - Массив объектов точек, каждый вида {x, y, z}.
 */
function parseRichTextData(fileContent) {
    const lines = fileContent.split('\n');
    const pointData = {};
    const links = {};
    const finalPoints = [];

    // --- ПЕРВЫЙ ПРОХОД: Сбор всех данных о высотах и связях ---
    // На этом этапе мы не пытаемся собрать точку целиком, только собираем "запчасти".
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 1. Находим параграф и извлекаем его ID и высоту
        if (line.startsWith('paragraph')) {
            const paragraphIdMatch = line.match(/"(.*?)"/);
            if (paragraphIdMatch) {
                const paragraphId = paragraphIdMatch[1];
                let j = i + 1;
                while (j < lines.length && !lines[j].trim().startsWith('endparagraph')) {
                    const elevationLine = lines[j].trim();
                    const elevationMatch = elevationLine.match(/^"(\d+\.\d+)"$/);
                    if (elevationMatch) {
                        pointData[paragraphId] = { z: parseFloat(elevationMatch[1]) };
                        break; 
                    }
                    j++;
                }
            }
        }

        // 2. Находим текстовый блок и связываем его ID с ID параграфа
        if (line.startsWith('textblock')) {
            const idMatches = line.match(/"(.*?)"/g);
            if (idMatches && idMatches.length >= 2) {
                const textblockId = idMatches[0].replace(/"/g, '');
                const paragraphId = idMatches[1].replace(/"/g, '');
                links[textblockId] = paragraphId;
            }
        }
    }

    // --- ВТОРОЙ ПРОХОД: Сборка точек с использованием собранных данных ---
    // Теперь, когда у нас есть все высоты и связи, мы можем уверенно собирать точки.

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('richtext2')) {
            const parts = trimmedLine.replace(/richtext2/g, '').trim().split(',');
            const textblockIdMatch = trimmedLine.match(/"(.*?)"/);

            if (parts.length >= 2 && textblockIdMatch) {
                const x = parseFloat(parts[0]);
                const y = parseFloat(parts[1]);
                const textblockId = textblockIdMatch[1];
                
                const paragraphId = links[textblockId];

                if (paragraphId && pointData[paragraphId]) {
                    // Успех! У нас есть все данные для сборки точки.
                    finalPoints.push({
                        x: x,
                        y: y,
                        z: pointData[paragraphId].z
                    });
                }
            }
        }
    }

    return finalPoints;
}

/**
 * Основная функция-обработчик
 */
function processFile() {
    const inputFilePath = path.join(__dirname, 'data-elev-marks.data');
    const outputFilePath = path.join(__dirname, 'output.xyz');

    console.log(`Чтение данных из файла: ${inputFilePath}`);

    let fileContent;
    try {
        fileContent = fs.readFileSync(inputFilePath, 'utf8');
    } catch (error) {
        console.error(`Ошибка: не удалось прочитать файл ${inputFilePath}. Убедитесь, что он существует.`);
        return;
    }

    const allPoints = parseRichTextData(fileContent);
    console.log(`\nИтог: Найдено и распознано ${allPoints.length} полных точек.`);

    if (allPoints.length === 0) {
        console.log("Не найдено данных для обработки.");
        return;
    }

    const originPoint = allPoints.find(p => p.z === 999.99);
    let originX = 0;
    let originY = 0;

    if (originPoint) {
        originX = originPoint.x;
        originY = originPoint.y;
        console.log(`Найдена опорная точка (z=999.99) с координатами: x=${originX}, y=${originY}. Координаты будут смещены.`);
    } else {
        console.warn("Внимание: опорная точка с высотой 999.99 не найдена. Смещение координат не будет произведено.");
    }

    const finalPointsForFile = allPoints
        .filter(p => p.z !== 999.99)
        .map(p => ({
            x: p.x - originX,
            y: p.y - originY,
            z: p.z
        }));

    const xyzContent = finalPointsForFile
        .map(p => `${p.x.toFixed(6)} ${p.y.toFixed(6)} ${p.z.toFixed(2)}`)
        .join('\n');

    try {
        fs.writeFileSync(outputFilePath, xyzContent, 'utf8');
        console.log(`Успешно! ${finalPointsForFile.length} точек записано в файл: ${outputFilePath}`);
    } catch (error) {
        console.error(`Ошибка при записи файла ${outputFilePath}:`, error);
    }
}

// Запускаем обработку
processFile();
