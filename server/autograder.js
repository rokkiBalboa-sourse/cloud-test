const YAML = require('yaml');
const { linuxQuestions } = require('./questions');

function gradeSubmission(answers) {
  let totalScore = 0;
  const sectionScores = {
    sec1: 0,
    sec2: 0,
    sec3: 0,
    sec4: 0
  };
  const gradingDetails = {};

  // Grade Module 1: Linux CLI multiple choice questions (25 pts total)
  linuxQuestions.forEach(q => {
    const studentAnswerId = answers[q.id];
    const isCorrect = studentAnswerId === q.correctId;
    const earned = isCorrect ? q.score : 0;

    sectionScores.sec1 += earned;
    totalScore += earned;

    const correctOption = q.options.find(o => o.id === q.correctId);
    gradingDetails[q.id] = {
      score: earned,
      maxScore: q.score,
      isCorrect,
      feedback: isCorrect
        ? 'Верно! ' + q.explanation
        : 'Неверно. Правильный ответ: ' + (correctOption ? correctOption.text : '') + '. ' + q.explanation
    };
  });

  // Grade Module 2: Task 2.1 - Nginx Config Fix (15 pts)
  {
    const code = answers['t2_1'] || '';
    let score = 0;
    const checks = [];

    // Check proxy_pass semicolon
    if (/proxy_pass\s+http:\/\/127\.0\.0\.1:8080\s*;/i.test(code) || /proxy_pass\s+[^;\n]+;/i.test(code)) {
      score += 8;
      checks.push({ passed: true, text: 'Ошибка 1 устранена: директива proxy_pass завершается точкой с запятой (;)' });
    } else {
      checks.push({ passed: false, text: 'Ошибка 1 не исправлена: пропущена точка с запятой (;) после proxy_pass' });
    }

    // Check stub_status on;
    if (/stub_status\s+on\s*;/i.test(code)) {
      score += 7;
      checks.push({ passed: true, text: 'Ошибка 2 устранена: опечатка в stub_status on; исправлена' });
    } else {
      checks.push({ passed: false, text: 'Ошибка 2 не исправлена: не найдена корректная директива stub_status on;' });
    }

    sectionScores.sec2 += score;
    totalScore += score;
    gradingDetails['t2_1'] = { score, maxScore: 15, checks };
  }

  // Grade Module 2: Task 2.2 - Log grep / regex query (10 pts)
  {
    const query = (answers['t2_2'] || '').trim().toLowerCase();
    let score = 0;
    const checks = [];

    const hasCritical = query.includes('critical');
    const hasKernel = query.includes('kernel');

    if (hasCritical && hasKernel) {
      score = 10;
      checks.push({ passed: true, text: 'Фильтр корректен: отбирает события со статусом [CRITICAL] и сервисом kernel' });
    } else {
      checks.push({ passed: false, text: 'В выражении отсутствует условие на [CRITICAL] или сервис kernel' });
    }

    sectionScores.sec2 += score;
    totalScore += score;
    gradingDetails['t2_2'] = { score, maxScore: 10, checks };
  }

  // Grade Module 3: Task 3.1 - Dockerfile (15 pts)
  {
    const code = (answers['t3_1'] || '').toLowerCase();
    let score = 0;
    const checks = [];

    if (/from\s+alpine:3\.19/.test(code)) {
      score += 3;
      checks.push({ passed: true, text: 'Базовый образ alpine:3.19 указан' });
    } else {
      checks.push({ passed: false, text: 'Не найден базовый образ FROM alpine:3.19' });
    }

    if (/apk\s+add.*--no-cache.*nginx/.test(code) || /apk.*--no-cache.*add.*nginx/.test(code)) {
      score += 4;
      checks.push({ passed: true, text: 'Установка nginx без сохранения кэша (apk add --no-cache nginx)' });
    } else {
      checks.push({ passed: false, text: 'Не найдена инструкция установки nginx без кэша (apk add --no-cache nginx)' });
    }

    if (/copy\s+\.?\/?html\s+\/usr\/share\/nginx\/html/.test(code)) {
      score += 3;
      checks.push({ passed: true, text: 'Копирование ./html в /usr/share/nginx/html настроено' });
    } else {
      checks.push({ passed: false, text: 'Не найдена инструкция COPY ./html /usr/share/nginx/html' });
    }

    if (/expose\s+80/.test(code)) {
      score += 2;
      checks.push({ passed: true, text: 'Сетевой порт 80 открыт (EXPOSE 80)' });
    } else {
      checks.push({ passed: false, text: 'Не найден проброс порта EXPOSE 80' });
    }

    if (/cmd\s*\[.*nginx.*-g.*daemon\s+off;?.*\]/.test(code) || /cmd.*nginx.*daemon off/.test(code)) {
      score += 3;
      checks.push({ passed: true, text: 'Запуск nginx на foreground (CMD ["nginx", "-g", "daemon off;"])' });
    } else {
      checks.push({ passed: false, text: 'Не найдена инструкция CMD ["nginx", "-g", "daemon off;"]' });
    }

    sectionScores.sec3 += score;
    totalScore += score;
    gradingDetails['t3_1'] = { score, maxScore: 15, checks };
  }

  // Grade Module 3: Task 3.2 - .gitlab-ci.yml fix (10 pts)
  {
    const code = answers['t3_2'] || '';
    const lower = code.toLowerCase();
    let score = 0;
    const checks = [];

    const usesPipelineIid = lower.includes('app:$ci_pipeline_iid') || lower.includes('app:${ci_pipeline_iid}');
    const usesLatest = lower.includes('app:latest');

    if (usesPipelineIid && !usesLatest) {
      score = 10;
      checks.push({ passed: true, text: 'Ошибка устранена: в test-job запускается собранный образ app:$CI_PIPELINE_IID' });
    } else {
      checks.push({ passed: false, text: 'В задаче test-job по-прежнему запускается app:latest вместо app:$CI_PIPELINE_IID' });
    }

    sectionScores.sec3 += score;
    totalScore += score;
    gradingDetails['t3_2'] = { score, maxScore: 10, checks };
  }

  // Grade Module 4: Task 4.1 - Ansible Playbook fix (25 pts)
  {
    const code = answers['t4_1'] || '';
    let score = 0;
    const checks = [];

    // YAML structure validity (10 pts)
    try {
      YAML.parse(code);
      score += 10;
      checks.push({ passed: true, text: 'Синтаксис YAML корректен' });
    } catch (err) {
      checks.push({ passed: false, text: 'Ошибка синтаксиса YAML: ' + err.message });
    }

    // FQCN module ansible.posix.sysctl (10 pts)
    if (/ansible\.posix\.sysctl/i.test(code)) {
      score += 10;
      checks.push({ passed: true, text: 'Использован официальный FQCN модуль ansible.posix.sysctl' });
    } else {
      checks.push({ passed: false, text: 'Модуль sysctl не заменен на официальный ansible.posix.sysctl' });
    }

    // Swapoff task (5 pts)
    if (/swapoff\s+-a/i.test(code) && /when:\s*ansible_swaptotal_mb/i.test(code)) {
      score += 5;
      checks.push({ passed: true, text: 'Задача отключения SWAP (swapoff -a) настроена корректно' });
    } else {
      checks.push({ passed: false, text: 'Ошибка в задаче отключения SWAP или условии when' });
    }

    sectionScores.sec4 += score;
    totalScore += score;
    gradingDetails['t4_1'] = { score, maxScore: 25, checks };
  }

  let verdict = 'not_recommended';
  if (totalScore >= 80) {
    verdict = 'recommended';
  } else if (totalScore >= 60) {
    verdict = 'reserve';
  }

  return {
    totalScore,
    maxScore: 100,
    sectionScores,
    gradingDetails,
    verdict
  };
}

module.exports = { gradeSubmission };
