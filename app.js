const path = require('path');
require('dotenv').config();

const express = require('express');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');

const { sequelize, User, Equipment, Borrow, BorrowDetail } = require('./models');
const { attachCurrentUser, requireAuth } = require('./middlewares/auth');
const { hashPassword } = require('./utils/password');

const authRoutes = require('./routes/auth');
const indexRoutes = require('./routes/index');
const userRoutes = require('./routes/users');
const equipmentRoutes = require('./routes/equipment');
const borrowRoutes = require('./routes/borrows');
const borrowDetailRoutes = require('./routes/borrowDetails');
const reportRoutes = require('./routes/reports');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'yeumeasy-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }
  })
);

app.use(flash());

app.use(attachCurrentUser);

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.path = req.path;
  res.locals.currentUser = res.locals.currentUser || null;
  next();
});

app.use('/', authRoutes);
app.use(requireAuth);

app.use('/', indexRoutes);
app.use('/users', userRoutes);
app.use('/equipment', equipmentRoutes);
app.use('/borrows', borrowRoutes);
app.use('/borrow-details', borrowDetailRoutes);
app.use('/reports', reportRoutes);

app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { message: 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 3000;
const MAX_PORT_ATTEMPTS = 10;

function listenWithFallback(startPort, attemptsLeft = MAX_PORT_ATTEMPTS) {
  const server = app
    .listen(startPort, () => {
      console.log(`YeumEasy running on http://localhost:${startPort}`);
    })
    .on('error', (error) => {
      if (error.code === 'EADDRINUSE' && attemptsLeft > 0) {
        const nextPort = startPort + 1;
        console.warn(
          `Port ${startPort} is in use. Retrying on port ${nextPort}...`
        );
        listenWithFallback(nextPort, attemptsLeft - 1);
        return;
      }

      console.error('Failed to start application:', error);
      process.exit(1);
    });

  return server;
}

async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const existingAdmin = await User.findOne({ where: { username: adminUsername } });
    if (!existingAdmin) {
      await User.create({
        full_name: process.env.DEFAULT_ADMIN_NAME || 'System Admin',
        student_id: process.env.DEFAULT_ADMIN_STUDENT_ID || `ADM${Date.now()}`,
        phone: process.env.DEFAULT_ADMIN_PHONE || '000-000-0000',
        username: adminUsername,
        password_hash: hashPassword(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'),
        role: 'admin'
      });
      console.log(`Default admin created. username: ${adminUsername}`);
    }

    // Ensure sqlite file exists after first sync.
    await Promise.all([
      User.count(),
      Equipment.count(),
      Borrow.count(),
      BorrowDetail.count()
    ]);

    listenWithFallback(PORT);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

startServer();
