const { program } = require('commander');
const fs = require('fs');

program
  .name('weather-analyzer')
  .description('Аналіз погодних даних')
  .version('1.0.0');

program
  .option('-i, --input <path>', 'шлях до вхідного JSON файлу')
  .option('-o, --output [path]', 'шлях до вихідного файлу')
  .option('-d, --display', 'вивести результат у консоль')
  .option('-h, --humidity', 'додати вивід вологості вдень (Humidity3pm)')
  .option('-r, --rainfall <number>', 'відображати лише записи з опадами більше за вказане значення');

program.parse();
const options = program.opts();

if (!options.input) {
  console.error('Помилка: вкажіть шлях до вхідного файлу через --input');
  process.exit(1);
}

if (!fs.existsSync(options.input)) {
  console.error('Помилка: файл не знайдено');
  process.exit(1);
}

try {
  const content = fs.readFileSync(options.input, 'utf8');
  let data = [];

  try {
    // Пробуємо розпарсити як масив JSON
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      data = parsed;
    } else {
      data = [parsed]; // один об'єкт
    }
  } catch {
    // Якщо не масив — спробуємо JSON Lines
    const lines = content.split('\n').filter(line => line.trim() !== '');
    data = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(d => d !== null);
  }

  console.log(`Завантажено ${data.length} записів`);

  let filtered = data;

  // Фільтр за опадами
  if (options.rainfall) {
    const minRain = parseFloat(options.rainfall);
    filtered = filtered.filter(rec => parseFloat(rec.Rainfall) > minRain);
    console.log(`Після фільтрації залишилось ${filtered.length} записів (Rainfall > ${minRain})`);
  }

  // Формуємо результат
  const result = filtered.map(rec => {
    let line = `${rec.Rainfall} ${rec.Pressure3pm}`;
    if (options.humidity && rec.Humidity3pm !== undefined) {
      line += ` ${rec.Humidity3pm}`;
    }
    return line;
  }).join('\n');

  if (options.display) {
    console.log('\n=== РЕЗУЛЬТАТ ===');
    console.log(result);
  }

  if (options.output) {
    fs.writeFileSync(options.output, result);
    console.log(`Результат збережено у файл: ${options.output}`);
  }

} catch (err) {
  console.error('Помилка обробки файлу:', err.message);
  process.exit(1);
}
