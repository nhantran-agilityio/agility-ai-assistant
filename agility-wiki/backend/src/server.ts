import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Agility Wiki Backend Running');
});

app.listen(4000, () => {
  console.log('Server running on port 4000');
});
