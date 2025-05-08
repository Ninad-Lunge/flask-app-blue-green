const express = require('express');
const app = express();
const port = 80;

app.get('/', (req, res) => {
  res.send('Hello from Blue-Green Deployment!');
});

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});