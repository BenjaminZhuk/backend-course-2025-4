const { program } = require('commander');
const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const xml = require('fast-xml-parser');
// 💡 ВИПРАВЛЕННЯ 1: Додаємо require для модуля url
const url = require('url');

// Деструктуризація для зручного використання XMLBuilder
const { XMLBuilder } = xml; 

// ... (частина з commander залишається без змін)
program
  .version('1.0.0')
  .description('Просто HTTP сервер')
  .requiredOption('-i, --input <path>', "шлях до вхідного JSON файлу")
  .requiredOption('-h, --host <string>', "адреса сервера") 
  .requiredOption('-p, --port <number>', "порт сервера")
  .parse(process.argv);

const options = program.opts();
const inputPath = options.input;
const host = options.host;
const port = options.port;

try {
  // Використання fs.constants.F_OK для більш чіткої перевірки існування файлу
  fs.accessSync(inputPath, fs.constants.F_OK); 
} catch (error) {
  console.error("Cannot find input file"); 
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  try {
    const baseURL = `http://${host}:${port}`;
    // 💡 ВИПРАВЛЕННЯ 2: Тепер url.URL працює коректно
    const parsedUrl = new url.URL(req.url, baseURL);
    const params = parsedUrl.searchParams;

    const mfoParam = params.get('mfo'); 
    const normalParam = params.get('normal'); 
    
    // Використання fsp.readFile (з оголошеним fsp) є кращим стилем
    const fileContent = await fsp.readFile(inputPath, 'utf8');
    const data = JSON.parse(fileContent);

    let filteredData = data;

    // Фільтрація: Нормальний стан (COD_STATE = 1)
    if (normalParam === 'true') {
      // Порівнюємо з числом, оскільки порт (number) вказано в опціях
      filteredData = filteredData.filter(bank => bank.COD_STATE === 1); 
    }
    
    const mappedData = filteredData.map(bank => {
        const bankRecord = {};
        if (mfoParam === 'true') {
          // Вихідне поле MFO
          bankRecord.mfo_code = bank.MFO; 
        }
        // Вихідне поле NAME (я використовую NAME замість SHORTNAME з попереднього коду, щоб відповідати логіці лаби)
        bankRecord.name = bank.NAME; 
        // Вихідне поле COD_STATE
        bankRecord.state_code = bank.COD_STATE;
        return bankRecord;
    });

    const xmlObject = {
      banks: {
        bank: mappedData 
      }
    };
    
    // 💡 ВИПРАВЛЕННЯ 3: Використовуємо XMLBuilder, який ми деструктуризували
    const builder = new XMLBuilder(); 
    const xmlString = builder.build(xmlObject);

    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' }); 
    res.end(xmlString); 

  } catch (error) {
    console.error('Помилка при обробці запиту:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

server.listen(port, host, () => {
  console.log(`Сервер запущено на http://${host}:${port}`);
  console.log(`Використовується файл: ${inputPath}`);
});