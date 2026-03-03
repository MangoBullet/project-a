const { sequelize, User, Equipment, Borrow, BorrowDetail } = require('../models');
const { hashPassword } = require('../utils/password');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(dateString, days) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

async function seed() {
  try {
    await sequelize.sync({ force: true });

    const usersData = [
      {
        full_name: 'System Admin',
        student_id: 'ADM0001',
        phone: '081-000-0001',
        username: 'admin',
        password_hash: hashPassword('admin123'),
        role: 'admin'
      },
      {
        full_name: 'Anan Wongchai',
        student_id: 'STU1001',
        phone: '081-123-1001',
        username: 'stu1001',
        password_hash: hashPassword('stu1001'),
        role: 'user'
      },
      {
        full_name: 'Benjamas Saelim',
        student_id: 'STU1002',
        phone: '081-123-1002',
        username: 'stu1002',
        password_hash: hashPassword('stu1002'),
        role: 'user'
      },
      {
        full_name: 'Chaiwat Rungsri',
        student_id: 'STU1003',
        phone: '081-123-1003',
        username: 'stu1003',
        password_hash: hashPassword('stu1003'),
        role: 'user'
      },
      {
        full_name: 'Darunee Jaroen',
        student_id: 'STU1004',
        phone: '081-123-1004',
        username: 'stu1004',
        password_hash: hashPassword('stu1004'),
        role: 'user'
      },
      {
        full_name: 'Ekkarat Chotikul',
        student_id: 'STU1005',
        phone: '081-123-1005',
        username: 'stu1005',
        password_hash: hashPassword('stu1005'),
        role: 'user'
      },
      {
        full_name: 'Fahsai Kamon',
        student_id: 'STU1006',
        phone: '081-123-1006',
        username: 'stu1006',
        password_hash: hashPassword('stu1006'),
        role: 'user'
      },
      {
        full_name: 'Gunlada Srisawat',
        student_id: 'STU1007',
        phone: '081-123-1007',
        username: 'stu1007',
        password_hash: hashPassword('stu1007'),
        role: 'user'
      },
      {
        full_name: 'Harin Petch',
        student_id: 'STU1008',
        phone: '081-123-1008',
        username: 'stu1008',
        password_hash: hashPassword('stu1008'),
        role: 'user'
      },
      {
        full_name: 'Intira Narin',
        student_id: 'STU1009',
        phone: '081-123-1009',
        username: 'stu1009',
        password_hash: hashPassword('stu1009'),
        role: 'user'
      },
      {
        full_name: 'Jirayu Tansakul',
        student_id: 'STU1010',
        phone: '081-123-1010',
        username: 'stu1010',
        password_hash: hashPassword('stu1010'),
        role: 'user'
      }
    ];

    const equipmentData = [
      { equipment_name: 'Projector Epson X500', category: 'Presentation', quantity: 8, status: 'available' },
      { equipment_name: 'Wireless Microphone', category: 'Audio', quantity: 15, status: 'available' },
      { equipment_name: 'Portable Speaker', category: 'Audio', quantity: 6, status: 'available' },
      { equipment_name: 'HDMI Cable 3m', category: 'Cable', quantity: 40, status: 'available' },
      { equipment_name: 'Extension Cord', category: 'Electrical', quantity: 25, status: 'available' },
      { equipment_name: 'Whiteboard Marker Set', category: 'Stationery', quantity: 30, status: 'available' },
      { equipment_name: 'Laptop Dell Latitude', category: 'Computer', quantity: 12, status: 'available' },
      { equipment_name: 'Tablet Samsung A9', category: 'Computer', quantity: 10, status: 'available' },
      { equipment_name: 'Laser Pointer', category: 'Presentation', quantity: 20, status: 'available' },
      { equipment_name: 'Webcam Logitech C920', category: 'Video', quantity: 9, status: 'available' }
    ];

    const users = await User.bulkCreate(usersData, { returning: true });
    const normalUsers = users.filter((user) => user.role === 'user');
    const equipment = await Equipment.bulkCreate(equipmentData, { returning: true });

    const baseDate = '2026-02-01';
    const borrowData = [];

    for (let i = 0; i < 15; i += 1) {
      const borrowDate = addDays(baseDate, i);
      const dueDate = addDays(borrowDate, randomInt(2, 10));
        borrowData.push({
        user_id: normalUsers[randomInt(0, normalUsers.length - 1)].id,
        borrow_date: borrowDate,
        due_date: dueDate,
        borrow_status: i % 4 === 0 ? 'returned' : 'borrowed'
      });
    }

    const borrows = await Borrow.bulkCreate(borrowData, { returning: true });

    const detailData = [];
    for (let i = 0; i < 20; i += 1) {
      const amount = randomInt(1, 5);
      const returned = i % 5 === 0 ? amount : randomInt(0, amount - 1);

      detailData.push({
        borrow_id: borrows[randomInt(0, borrows.length - 1)].id,
        equipment_id: equipment[randomInt(0, equipment.length - 1)].id,
        amount,
        returned_amount: returned
      });
    }

    await BorrowDetail.bulkCreate(detailData);

    console.log('Seed completed successfully.');
    console.log('Users: 11 (admin: 1, user: 10), Equipment: 10, Borrows: 15, BorrowDetails: 20');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
