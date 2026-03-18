import mongoose from 'mongoose';
import dotenv from 'dotenv';
import projectsData from './projects.json' with { type: 'json' };

dotenv.config();

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

async function seedDatabase() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || '';
    if (!MONGODB_URI) {
      console.error('❌ ບໍ່ພົບ MONGODB_URI ໃນ .env');
      return;
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ ເຊື່ອມຕໍ່ MongoDB ສຳເລັດແລ້ວ...');

    // ລຶບຂໍ້ມູນເກົ່າອອກກ່ອນ (ຖ້າມີ)
    await ProjectModel.deleteMany({});
    console.log('🗑️ ລຶບຂໍ້ມູນເກົ່າສຳເລັດ...');

    // ເພີ່ມຂໍ້ມູນໃໝ່
    await ProjectModel.insertMany(projectsData);
    console.log('🚀 ຍ້າຍຂໍ້ມູນຈາກ JSON ເຂົ້າ MongoDB ສຳເລັດແລ້ວ!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ ເກີດຂໍ້ຜິດພາດ:', error);
    process.exit(1);
  }
}

seedDatabase();
