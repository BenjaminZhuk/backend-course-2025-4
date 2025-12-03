const { program } = require('commander');
const http = require('http');
const fs = require('fs');
const fsp = fs.promises;

const url = require('url');

program
  .requiredOption('-i, --input <path>', 'Введіть шлях до файлу')
  .requiredOption('-h, --host <host>', 'Адреса сервера')
  .requiredOption('-p, --port <port>', 'Порт сервера');

program.configureOutput({
  outputError: (str, write) => {
  }
});

program.exitOverride();

try {
  program.parse();
} catch (err) {
  if (err.code === 'commander.missingMandatoryOptionValue') {
    console.error("Please write required argument"); 
    process.exit(1);
  } else {
    console.error(err.message);
    process.exit(1);
  }
}

const options = program.opts();

if (!fs.existsSync(options.input)) {
  console.error("Cannot find input file");
  process.exit(1);
}

const host = options.host;
const port = options.port;

const server = http.createServer((req,res) =>{
res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    // Відправляємо текст клієнту
    res.end('сервер працює');
});
server.listen (port,host, ()=>{
console.log(`Server is running on http://${host}:${port}`);
});