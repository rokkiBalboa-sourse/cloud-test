const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { modules } = require('./questions');
const { gradeSubmission } = require('./autograder');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Helper to shuffle arrays (Fisher-Yates)
function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Public questions API - randomized order of Linux CLI questions and choices, sensitive answers stripped
app.get('/api/questions', (req, res) => {
  const sanitized = modules.map(mod => {
    if (mod.id === 'sec1') {
      // Shuffle questions and options for Linux CLI
      const shuffledItems = shuffleArray(mod.items).map(item => {
        const { correctId, explanation, ...rest } = item;
        return {
          ...rest,
          options: shuffleArray(item.options)
        };
      });
      return {
        ...mod,
        items: shuffledItems
      };
    }
    return {
      ...mod,
      items: mod.items.map(item => {
        const { correctId, explanation, ...rest } = item;
        return rest;
      })
    };
  });

  res.json({ questions: sanitized });
});

// Check if user has already submitted
app.get('/api/submissions/status', (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: 'Username обязателен' });
  }

  const existing = db.prepare('SELECT id, submitted_at FROM submissions WHERE username = ?').get(username);
  res.json({
    hasSubmitted: !!existing,
    submittedAt: existing ? existing.submitted_at : null
  });
});

// Authentication
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Укажите логин и пароль' });
  }

  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const user = stmt.get(username.trim());

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }

  const existingSub = db.prepare('SELECT id FROM submissions WHERE username = ?').get(user.username);

  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.full_name,
      groupName: user.group_name,
      hasSubmitted: !!existingSub
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { username, password, fullName, groupName } = req.body;
  if (!username || !password || !fullName || !groupName) {
    return res.status(400).json({ error: 'Все поля обязательны к заполнению' });
  }

  const findStmt = db.prepare('SELECT id FROM users WHERE username = ?');
  if (findStmt.get(username.trim())) {
    return res.status(409).json({ error: 'Пользователь с таким логином уже существует' });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO users (username, password, role, full_name, group_name)
      VALUES (?, ?, 'student', ?, ?)
    `);
    const result = insert.run(username.trim(), password, fullName.trim(), groupName.trim());
    res.json({
      success: true,
      user: {
        id: result.lastInsertRowid,
        username: username.trim(),
        role: 'student',
        fullName: fullName.trim(),
        groupName: groupName.trim(),
        hasSubmitted: false
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка регистрации: ' + err.message });
  }
});

// Submit test answers
app.post('/api/submissions', (req, res) => {
  const { userId, username, fullName, groupName, answers, timeSpentSeconds } = req.body;
  if (!username || !answers) {
    return res.status(400).json({ error: 'Некорректные данные для отправки' });
  }

  // Prevent retake
  const existing = db.prepare('SELECT id FROM submissions WHERE username = ?').get(username);
  if (existing) {
    return res.status(403).json({ error: 'Вы уже завершили тестирование. Повторное прохождение запрещено.' });
  }

  const gradeResult = gradeSubmission(answers);

  const insert = db.prepare(`
    INSERT INTO submissions (
      user_id, username, full_name, group_name,
      status, time_spent_seconds, total_score, max_score,
      section_scores, answers, grading_details, verdict
    ) VALUES (?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?)
  `);

  let validUserId = null;
  if (userId) {
    const userRow = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (userRow) validUserId = userRow.id;
  }

  insert.run(
    validUserId,
    username,
    fullName || 'Без имени',
    groupName || 'Без группы',
    timeSpentSeconds || 0,
    gradeResult.totalScore,
    gradeResult.maxScore,
    JSON.stringify(gradeResult.sectionScores),
    JSON.stringify(answers),
    JSON.stringify(gradeResult.gradingDetails),
    gradeResult.verdict
  );

  res.json({
    success: true,
    message: 'Спасибо! Ваша работа принята и отправлена на проверку.'
  });
});

// Admin: Get all submissions
app.get('/api/admin/submissions', (req, res) => {
  const stmt = db.prepare(`
    SELECT id, user_id, username, full_name, group_name, total_score, max_score,
           section_scores, submitted_at, time_spent_seconds, verdict
    FROM submissions
    ORDER BY submitted_at DESC
  `);
  const rows = stmt.all();
  const parsed = rows.map(r => ({
    ...r,
    section_scores: JSON.parse(r.section_scores)
  }));

  res.json({ submissions: parsed });
});

// Admin: Get single submission details
app.get('/api/admin/submissions/:id', (req, res) => {
  const stmt = db.prepare('SELECT * FROM submissions WHERE id = ?');
  const row = stmt.get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Попытка не найдена' });
  }

  res.json({
    submission: {
      ...row,
      section_scores: JSON.parse(row.section_scores),
      answers: JSON.parse(row.answers),
      grading_details: JSON.parse(row.grading_details)
    }
  });
});

// Admin: Delete a submission
app.delete('/api/admin/submissions/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM submissions WHERE id = ?');
  stmt.run(req.params.id);
  res.json({ success: true });
});

// Admin: Export to CSV
app.get('/api/admin/export', (req, res) => {
  const stmt = db.prepare(`
    SELECT id, username, full_name, group_name, total_score, max_score,
           section_scores, submitted_at, time_spent_seconds, verdict
    FROM submissions
    ORDER BY total_score DESC, submitted_at ASC
  `);
  const rows = stmt.all();

  const headers = ['ID', 'ФИО', 'Группа', 'Логин', 'Итог (из 100)', 'Модуль 1 (Команды Linux)', 'Модуль 2 (Nginx/Логи)', 'Модуль 3 (Docker/CI)', 'Модуль 4 (Ansible)', 'Вердикт', 'Время (сек)', 'Дата сдачи'];
  
  const csvLines = [headers.join(';')];
  rows.forEach(r => {
    const s = JSON.parse(r.section_scores);
    const line = [
      r.id,
      `"${r.full_name}"`,
      `"${r.group_name}"`,
      `"${r.username}"`,
      r.total_score,
      s.sec1 || 0,
      s.sec2 || 0,
      s.sec3 || 0,
      s.sec4 || 0,
      `"${r.verdict}"`,
      r.time_spent_seconds,
      `"${r.submitted_at}"`
    ];
    csvLines.push(line.join(';'));
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="cloud_competition_results.csv"');
  res.send('\uFEFF' + csvLines.join('\n'));
});

// Transliterate Russian string to clean Latin
function transliterate(str) {
  const ru = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };
  return str.toLowerCase().split('').map(char => ru[char] !== undefined ? ru[char] : char).join('').replace(/[^a-z0-9]/g, '');
}

// Generate unique login for student
function generateLogin(fullName, existingUsernames) {
  const parts = fullName.trim().split(/\s+/);
  let base = '';
  if (parts.length >= 2) {
    const lastName = transliterate(parts[0]);
    const firstInitial = transliterate(parts[1][0] || '');
    const middleInitial = parts[2] ? transliterate(parts[2][0] || '') : '';
    base = `${lastName}_${firstInitial}${middleInitial}`.toLowerCase();
  } else {
    base = transliterate(parts[0]).toLowerCase();
  }
  if (!base || base.length < 2) base = 'student';

  let candidate = base;
  let counter = 1;
  while (existingUsernames.has(candidate)) {
    counter++;
    candidate = `${base}${counter}`;
  }
  existingUsernames.add(candidate);
  return candidate;
}

// Generate easy-to-read 6-character password without ambiguous characters
function generatePassword() {
  const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
  let pwd = '';
  for (let i = 0; i < 6; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

// Admin: Batch create student accounts
app.post('/api/admin/users/batch', (req, res) => {
  const { groupName, namesText } = req.body;
  if (!groupName || !namesText) {
    return res.status(400).json({ error: 'Укажите название группы и список ФИО' });
  }

  const lines = namesText.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    return res.status(400).json({ error: 'Список студентов пуст' });
  }

  // Get all existing usernames from DB to guarantee uniqueness
  const existingRows = db.prepare('SELECT username FROM users').all();
  const existingSet = new Set(existingRows.map(r => r.username.toLowerCase()));

  const created = [];
  const insertStmt = db.prepare(`
    INSERT INTO users (username, password, role, full_name, group_name)
    VALUES (?, ?, 'student', ?, ?)
  `);

  try {
    lines.forEach(fullName => {
      const username = generateLogin(fullName, existingSet);
      const password = generatePassword();
      const result = insertStmt.run(username, password, fullName, groupName.trim());
      created.push({
        id: result.lastInsertRowid,
        fullName,
        groupName: groupName.trim(),
        username,
        password
      });
    });

    res.json({
      success: true,
      count: created.length,
      users: created
    });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка создания пользователей: ' + err.message });
  }
});

// Admin: Get all student accounts
app.get('/api/admin/users', (req, res) => {
  const stmt = db.prepare(`
    SELECT id, username, password, full_name, group_name, created_at
    FROM users
    WHERE role = 'student'
    ORDER BY id DESC
  `);
  res.json({ users: stmt.all() });
});

// Admin: Delete student account
app.delete('/api/admin/users/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM users WHERE id = ? AND role = "student"');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления пользователя: ' + err.message });
  }
});

// Admin: Change password
app.post('/api/admin/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Укажите текущий и новый пароль' });
  }

  const admin = db.prepare('SELECT * FROM users WHERE username = "admin"').get();
  if (!admin || admin.password !== currentPassword) {
    return res.status(401).json({ error: 'Текущий пароль указан неверно' });
  }

  if (newPassword.trim().length < 4) {
    return res.status(400).json({ error: 'Новый пароль должен содержать минимум 4 символа' });
  }

  db.prepare('UPDATE users SET password = ? WHERE username = "admin"').run(newPassword.trim());
  res.json({ success: true, message: 'Пароль администратора успешно изменен' });
});

// Admin: Get authoritative answers key
app.get('/api/admin/answers-key', (req, res) => {
  const { linuxQuestions } = require('./questions');

  const answersKey = {
    module1: {
      title: 'Модуль 1. Базовые команды и администрирование Linux',
      maxScore: 25,
      items: linuxQuestions.map(q => {
        const correctOpt = q.options.find(o => o.id === q.correctId);
        return {
          id: q.id,
          question: q.question,
          correctCommand: correctOpt ? correctOpt.text : '',
          score: q.score,
          explanation: q.explanation
        };
      })
    },
    module2: {
      title: 'Модуль 2. Поиск ошибок в конфигурации Nginx и фильтрация логов',
      maxScore: 25,
      task2_1: {
        title: 'Задача 2.1. Исправление конфигурации Nginx (/etc/nginx/nginx.conf)',
        score: 15,
        fixes: [
          { text: 'Добавить точку с запятой (;) в конце директивы proxy_pass http://127.0.0.1:8080;', points: 8 },
          { text: 'Исправить опечатку в директиве stubs_status on; на stub_status on;', points: 7 }
        ],
        code: `server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
    }

    location /metrics {
        stub_status on; 
    }
}`
      },
      task2_2: {
        title: 'Задача 2.2. Фильтрация системных логов (/var/log/syslog)',
        score: 10,
        criteria: 'В выражении должны одновременно присутствовать статус [CRITICAL] и сервис kernel',
        validCommands: [
          "grep -E '\\[CRITICAL\\].*kernel' /var/log/syslog",
          "grep '\\[CRITICAL\\]' /var/log/syslog | grep 'kernel'",
          "^.*\\[CRITICAL\\].*kernel.*$",
          "\\[CRITICAL\\].*kernel"
        ],
        matchedLinesCount: 4,
        explanation: 'В файле ровно 4 строки содержат одновременно [CRITICAL] и kernel (CPU throttle, OOM killer kubelet, page allocation failure, kernel page fault).'
      }
    },
    module3: {
      title: 'Модуль 3. Dockerfile и логика CI/CD',
      maxScore: 25,
      task3_1: {
        title: 'Задача 3.1. Написание Dockerfile по ТЗ',
        score: 15,
        criteria: [
          { text: 'Базовый образ FROM alpine:3.19', points: 3 },
          { text: 'Установка nginx без кэша (RUN apk add --no-cache nginx)', points: 4 },
          { text: 'Копирование ./html в /usr/share/nginx/html', points: 3 },
          { text: 'Открытие порта EXPOSE 80', points: 2 },
          { text: 'Точка входа CMD ["nginx", "-g", "daemon off;"]', points: 3 }
        ],
        code: `FROM alpine:3.19

RUN apk add --no-cache nginx

COPY ./html /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]`
      },
      task3_2: {
        title: 'Задача 3.2. Исправление пайплайна .gitlab-ci.yml',
        score: 10,
        explanation: 'В задаче test-job необходимо заменить ошибочный статичный тег app:latest на динамический тег собранного контейнера app:$CI_PIPELINE_IID',
        code: `stages:
  - build
  - test

build-job:
  stage: build
  tags:
    - test
  script:
    - docker build -t app:$CI_PIPELINE_IID .

test-job:
  stage: test
  tags:
    - test
  script:
    - docker run -d --name app-test -p 8080:80 app:$CI_PIPELINE_IID`
      }
    },
    module4: {
      title: 'Модуль 4. Идемпотентность и синтаксис Ansible Playbook',
      maxScore: 25,
      task4_1: {
        title: 'Задача 4.1. Исправление ошибок в плейбуке prepare.yml',
        score: 25,
        criteria: [
          { text: 'Синтаксическая валидность YAML структуры', points: 10 },
          { text: 'Использование официального FQCN модуля ansible.posix.sysctl вместо устаревшего sysctl', points: 10 },
          { text: 'Корректная задача отключения SWAP (command: swapoff -a) при условии when: ansible_swaptotal_mb > 0', points: 5 }
        ],
        code: `- name: Prepare Kubernetes Nodes
  hosts: all
  become: true
  tasks:
    - name: Enable IP Forwarding
      ansible.posix.sysctl:
        name: net.ipv4.ip_forward
        value: '1'
        state: present
        reload: true

    - name: Disable SWAP
      command: swapoff -a
      when: ansible_swaptotal_mb > 0`
      }
    }
  };

  res.json({ answersKey });
});

// Fallback for SPA routing
const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    const indexPath = path.join(distDir, 'index.html');
    if (require('fs').existsSync(indexPath)) {
      return res.sendFile(indexPath);
    } else {
      return res.send('API сервер работает. Для запуска фронтенда выполните сборку (npm run build) или запустите vite (npm run dev).');
    }
  }
  next();
});

const server = app.listen(PORT, () => {
  console.log(`Сервер тестирования запущен на http://localhost:${PORT}`);
});

module.exports = server;
