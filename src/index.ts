import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import projectsData from './projects.json' with { type: 'json' };

dotenv.config();

// ເເຊື່ອມຕໍ່ MongoDB (ຕັ້ງຄ່າ Timeout ໃຫ້ໄວຂຶ້ນເພື່ອ Fallback)
const MONGODB_URI = process.env.MONGODB_URI || '';
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // ເພີ່ມເປັນ 5 ວິນາທີເພື່ອຄວາມແນ່ນອນ
})
  .then(() => {
    console.log('ເຊື່ອມຕໍ່ຖານຂໍ້ມູນ MongoDB ສຳເລັດແລ້ວ! 🍃');
    // ເລີ່ມຕົ້ນ Server ຫຼັງຈາກເຊື່ອມຕໍ່ MongoDB สำເລັດ
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ ບໍ່ສາມາດເຊື່ອມຕໍ່ MongoDB ໄດ້ (ອາດຈະເປັນ IP Whitelist):', err);
    console.log('💡 ລະບົບຈະໃຊ້ຂໍ້ມູນຈາກ projects.json ແທນອັດຕະໂນມັດ.');
    // ຖ້າເຊື່ອມຕໍ່ບໍ່ໄດ້ ກໍຍັງເປີດ Server ໃຫ້ໃຊ້ JSON Fallback ໄດ້
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} (Fallback Mode)`);
    });
  });

// ສ້າງ Schema ສຳລັບ Projects
const projectSchema = new mongoose.Schema({
  title: String,
  title_la: String,
  title_th: String,
  title_en: String,
  description: String,
  description_la: String,
  description_th: String,
  description_en: String,
  tags: [String],
  link: String,
  status: String,
  image: String
});

const ProjectModel = mongoose.model('Project', projectSchema);

console.log('--- ເລີ່ມຕົ້ນການກວດສອບ Backend ---');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'ຕັ້ງຄ່າແລ້ວ ✅' : 'ຍັງບໍ່ທັນຕັ້ງຄ່າ ❌');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'ຕັ້ງຄ່າແລ້ວ ✅' : 'ຍັງບໍ່ທັນຕັ້ງຄ່າ ❌');

const app = express();
const PORT = process.env.PORT || 5000;

// ອະນຸຍາດໃຫ້ Frontend ດຶງຂໍ້ມູນໄດ້
app.use(cors({
  origin: ['https://pengsuelee99.github.io', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// ຕັ້ງຄ່າເພື່ອຮັບຮອງ Static Files (ຮູບພາບ)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/projects', express.static(path.join(__dirname, 'projects')));

// ຕັ້ງຄ່າ Nodemailer (ແບບລະອຽດ)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ສ້າງ Route ທຳອິດ
app.get('/', (req, res) => {
  res.send('Server is running! 🚀');
});

// API ເອົາຂໍ້ມູນ Projects
app.get('/api/status', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({ 
    status: 'Server is running', 
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/projects', async (req, res) => {
  console.log("📡 GET /api/projects request received");
  
  // 1. ຖ້າ MongoDB ຍັງບໍ່ທັນເຊື່ອມຕໍ່ (readyState != 1), ໃຫ້ສົ່ງ JSON ທັນທີໂດຍບໍ່ຕ້ອງລໍຖ້າ
  if (mongoose.connection.readyState !== 1) {
    console.log("⚠️ MongoDB is not connected, sending instant JSON fallback...");
    return res.json(projectsData);
  }

  try {
    // 2. ຖ້າເຊື່ອມຕໍ່ແລ້ວ, ລອງດຶງຂໍ້ມູນຈາກ DB
    const projects = await ProjectModel.find().maxTimeMS(2000); // ບັງຄັບໃຫ້ Timeout ໃນ 2 ວິນາທີ
    
    if (projects.length === 0) {
      console.log("⚠️ MongoDB is empty, sending JSON fallback data...");
      return res.json(projectsData);
    }
    
    console.log(`✅ Success: Sent ${projects.length} projects from MongoDB`);
    res.json(projects);
  } catch (error) {
    console.error("❌ MongoDB Query Error, using JSON fallback:", error);
    res.json(projectsData);
  }
});

// API ຮັບຂໍ້ມູນຈາກ Contact Form ແລະ ສົ່ງ Email
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO,
    subject: `ຂໍ້ຄວາມໃໝ່ຈາກ Portfolio: ${name}`,
    text: `ທ່ານມີຂໍ້ຄວາມໃໝ່:\n\nຊື່: ${name}\nອີເມວ: ${email}\nຂໍ້ຄວາມ: ${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('ສົ່ງ Email ສຳເລັດແລ້ວ!');
    res.status(200).json({ message: 'ສົ່ງຂໍ້ຄວາມສຳເລັດແລ້ວ! ຂອບໃຈທີ່ຕິດຕໍ່ມາ.' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'ເກີດຂໍ້ຜິດພາດໃນການສົ່ງ Email.' });
  }
});

// Export app ສຳລັບ Vercel
export default app;
