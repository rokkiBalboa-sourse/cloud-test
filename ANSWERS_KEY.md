# Ключи правильных ответов (Облегчённый тест, 40–45 минут)

Документ содержит эталонные решения и критерии оценивания для всех 4 модулей отборочного тестирования.

---

## Модуль 1. Базовые команды и администрирование Linux (25 баллов)
Вопросы и варианты ответов выводятся студентам в **случайном (рандомизированном)** порядке.

| № | Вопрос / Назначение | Правильная команда / ответ | Баллы |
|---|---|---|---|
| 1 | Проверка текущего состояния службы systemd и её последних журналов | `systemctl status <service>` | 2 б. |
| 2 | Просмотр имени хоста, версии ОС, ядра и архитектуры | `hostnamectl` | 2 б. |
| 3 | Журнал службы с переходом в конец (`-e`), пояснениями (`-x`) и фильтром (`-u`) | `journalctl -xeu nginx.service` | 2 б. |
| 4 | Список прослушиваемых TCP-портов с PID и именами процессов | `ss -tlnp` | 2 б. |
| 5 | Просмотр назначенных IP-адресов и сетевых интерфейсов | `ip a` (или `ip addr show`) | 2 б. |
| 6 | Использование дискового пространства в человекочитаемом виде | `df -h` | 2 б. |
| 7 | Оперативная память и Swap (свободно / занято) | `free -h` | 2 б. |
| 8 | Просмотр последних 50 строк лога в реальном времени | `tail -n 50 -f /var/log/syslog` | 2 б. |
| 9 | Предоставление прав на исполнение скрипту | `chmod +x deploy.sh` | 2 б. |
| 10 | Распаковка архива `backup.tar.gz` в текущую папку | `tar -xzvf backup.tar.gz` | 2 б. |
| 11 | Немедленное применение параметров ядра из `/etc/sysctl.conf` | `sysctl -p` | 2 б. |
| 12 | Поиск PID запущенного сервиса prometheus | `ps aux \| grep prometheus` (или `pgrep prometheus`) | 3 б. |

---

## Модуль 2. Поиск ошибок в конфигурации Nginx и фильтрация логов (25 баллов)

### Задача 2.1. Исправление конфигурации Nginx (/etc/nginx/nginx.conf) — 15 баллов
**Ошибки в заготовке:**
1. Пропущена точка с запятой (`;`) после строки `proxy_pass http://127.0.0.1:8080` (8 баллов).
2. Опечатка в директиве `stubs_status on;` вместо `stub_status on;` (7 баллов).

**Эталонный код:**
```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
    }

    location /metrics {
        stub_status on; 
    }
}
```

---

### Задача 2.2. Фильтрация системных логов (/var/log/syslog) — 10 баллов
**Задание:** Написать команду grep или регулярное выражение для строк, содержащих статус `[CRITICAL]` и сервис `kernel`.

**Варианты правильного ввода:**
- `grep -E '\[CRITICAL\].*kernel' /var/log/syslog`
- `grep '\[CRITICAL\]' /var/log/syslog | grep 'kernel'`
- `^.*\[CRITICAL\].*kernel.*$`
- `\[CRITICAL\].*kernel`

*(В файле лога под этот фильтр подпадают ровно 4 строки: CPU throttle, OOM killer kubelet, page allocation failure, kernel page fault).*

---

## Модуль 3. Dockerfile и логика CI/CD (25 баллов)

### Задача 3.1. Написание Dockerfile по ТЗ — 15 баллов
**Критерии оценивания:**
- Базовый образ `FROM alpine:3.19` (3 б.)
- Установка nginx без кэша `RUN apk add --no-cache nginx` (4 б.)
- Копирование `COPY ./html /usr/share/nginx/html` (3 б.)
- Открытие порта `EXPOSE 80` (2 б.)
- Точка входа `CMD ["nginx", "-g", "daemon off;"]` (3 б.)

**Эталонный код:**
```dockerfile
FROM alpine:3.19

RUN apk add --no-cache nginx

COPY ./html /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

### Задача 3.2. Исправление пайплайна .gitlab-ci.yml — 10 баллов
**Что нужно исправить:**
В джобе `test-job` заменить запуск неверного тега `app:latest` на собранный образ `app:$CI_PIPELINE_IID`.

**Эталонный код:**
```yaml
stages:
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
    - docker run -d --name app-test -p 8080:80 app:$CI_PIPELINE_IID
```

---

## Модуль 4. Идемпотентность и синтаксис Ansible Playbook (25 баллов)

### Задача 4.1. Исправление ошибок в prepare.yml — 25 баллов
**Что нужно исправить:**
1. Валидный синтаксис YAML структуры (10 баллов).
2. Замена устаревшего короткого имени модуля `sysctl` на официальный FQCN модуль `ansible.posix.sysctl` (10 баллов).
3. Корректное отключение swap (`command: swapoff -a` при условии `when: ansible_swaptotal_mb > 0`) (5 баллов).

**Эталонный код:**
```yaml
- name: Prepare Kubernetes Nodes
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
      when: ansible_swaptotal_mb > 0
```
