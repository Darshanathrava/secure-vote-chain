const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

mongoose.set('strictQuery', false);

const authRoutes = require('./Routes/AuthRoute');
const voteRoutes = require('./Routes/voteRoute');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/vote', voteRoutes);

app.get('/api/elections', async (req, res) => {
  try {
    const Election = require('./Models/Election');
    const elections = await Election.find({ isActive: true });
    res.json(elections);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch elections' });
  }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected With DB Successfull');
    app.listen(process.env.PORT || 1322, () => {
      console.log(`Server is Listening on PORT ${process.env.PORT || 1322}`);
    });
  })
  .catch(err => console.error('DB connection error:', err));