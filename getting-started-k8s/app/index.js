const http = require('http');

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});

server.listen(process.env.PORT ?? 3000, () => {
  const { address, port } = server.address();

  console.log(`server running on ${address}:${port}`);
});
