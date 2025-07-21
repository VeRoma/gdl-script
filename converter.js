const fs = require('fs');
const path = require('path');

/**
 * Парсит GDL-файл, используя упрощенный последовательный подход.
 * Предполагается, что блок с координатами (`richtext2`) всегда следует
 * за соответствующим блоком с высотой (`paragraph`).
 * @param {string} fileContent - Содержимое GDL-файла в виде строки.
 * @returns {Array<object>} - Массив объектов точек, каждый вида {x, y, z}.
 */
function parseRichTextDataSimplified(fileContent) {
    const lines = fileContent.split('\n');
    const finalPoints = [];
    let lastFoundElevation = null; // Переменная для временного хранения последней найденной высоты

    console.log('\n--- НАЧАЛО ДЕТАЛЬНОГО ЛОГИРОВАНИЯ (Упрощенный метод) ---');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 1. Ищем блок параграфа, чтобы найти высоту
        if (line.startsWith('paragraph')) {
            console.log(`[Шаг 1] Обнаружен блок 'paragraph' на строке ${i + 1}. Поиск высоты...`);
            let j = i + 1;
            let foundElevationInBlock = false;
            while (j < lines.length && !lines[j].trim().startsWith('endparagraph')) {
                const elevationLine = lines[j].trim();
                // Ищем строку, которая содержит только число в кавычках
                const elevationMatch = elevationLine.match(/^"(\d+(\.\d+)?)"$/);
                if (elevationMatch) {
                    lastFoundElevation = parseFloat(elevationMatch[1]);
                    console.log(`    -> Найдена и временно сохранена высота: ${lastFoundElevation}`);
                    foundElevationInBlock = true;
                    break; // Нашли, выходим из внутреннего цикла
                }
                j++;
            }
            if (!foundElevationInBlock) {
                 console.log(`    -> Внимание: Высота в этом блоке 'paragraph' не найдена.`);
            }
        }

        // 2. Ищем блок с координатами
        if (line.startsWith('richtext2')) {
             console.log(`[Шаг 2] Обнаружен блок 'richtext2' на строке ${i + 1}.`);
            // Ищем два вещественных числа после команды richtext2
            const richTextMatch = line.match(/richtext2\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);

            if (richTextMatch) {
                const x = parseFloat(richTextMatch[1]);
                const y = parseFloat(richTextMatch[2]);
                 console.log(`    -> Найдены координаты: x=${x}, y=${y}`);

                // 3. Если у нас есть и высота, и координаты, создаем точку
                if (lastFoundElevation !== null) {
                    finalPoints.push({ x, y, z: lastFoundElevation });
                    console.log(`    -> УСПЕХ: Точка собрана! { x: ${x}, y: ${y}, z: ${lastFoundElevation} }`);
                    // Сбрасываем высоту, чтобы она не использовалась для следующей точки
                    lastFoundElevation = null;
                } else {
                    console.log(`    -> ОШИБКА СБОРКИ: Координаты найдены, но для них нет сохраненной высоты.`);
                }
            } else {
                 console.log(`    -> Внимание: Не удалось извлечь координаты из строки 'richtext2'.`);
            }
        }
    }

    console.log('--- КОНЕЦ ДЕТАЛЬНОГО ЛОГИРОВАНИЯ ---\n');
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

    // Используем новую, упрощенную функцию парсинга
    const allPoints = parseRichTextDataSimplified(fileContent);
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
