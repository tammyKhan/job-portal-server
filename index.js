const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/',(req, res) => {
  res.send('Job is falling from the sky')
})

app.listen(port, () => {
  console.log(`Job is waiting at: ${port}`)
})