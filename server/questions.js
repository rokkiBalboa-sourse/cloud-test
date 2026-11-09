// 60 realistic Linux syslog lines for log filtering task
const SYSLOG_SAMPLE = `Nov 09 10:14:01 srv-k8s01 systemd[1]: Starting Daily apt upgrade and clean activities...
Nov 09 10:14:02 srv-k8s01 kernel: [   12.392011] TCP: cubic registered
Nov 09 10:14:05 srv-k8s01 sshd[2410]: Accepted publickey for devops from 192.168.1.50 port 54122 ssh2
Nov 09 10:14:12 srv-k8s01 nginx[3102]: 192.168.1.10 - - [09/Nov/2026:10:14:12 +0300] "GET /healthz HTTP/1.1" 200 12
Nov 09 10:14:18 srv-k8s01 systemd[1]: [INFO] Started Prometheus Node Exporter service.
Nov 09 10:14:22 srv-k8s01 kernel: [   32.102341] [CRITICAL] kernel: CPU 0 temperature above threshold, cpu clock throttled
Nov 09 10:14:25 srv-k8s01 dockerd[1890]: time="2026-11-09T10:14:25Z" level=info msg="Container 9c4f1a started"
Nov 09 10:14:30 srv-k8s01 kubelet[2100]: I1109 10:14:30.102911 2100 status_manager.go:412] "Syncing Pod status" pod="kube-system/coredns"
Nov 09 10:14:41 srv-k8s01 systemd[1]: [WARNING] kubelet.service: Current memory usage exceeds 80%.
Nov 09 10:15:02 srv-k8s01 kernel: [   72.481902] e1000e: eth0 NIC Link is Up 1000 Mbps Full Duplex
Nov 09 10:15:15 srv-k8s01 kernel: [   85.192019] [CRITICAL] kernel: Out of memory: Kill process 1421 (kubelet) score 852
Nov 09 10:15:20 srv-k8s01 systemd[1]: [CRITICAL] kubelet.service: Main process exited, code=killed, status=9/KILL
Nov 09 10:15:22 srv-k8s01 containerd[1105]: time="2026-11-09T10:15:22Z" level=warning msg="Task exit event received"
Nov 09 10:15:35 srv-k8s01 haproxy[890]: 192.168.1.100:41920 [09/Nov/2026:10:15:35] k8s-api k8s-masters/k8s-srv1 1/0/2 102 -- 2/2/0/0/0 0/0
Nov 09 10:15:44 srv-k8s01 kernel: [  114.901821] [INFO] kernel: br_netfilter: bridge netfilter module loaded successfully
Nov 09 10:16:01 srv-k8s01 CRON[4190]: (root) CMD (/usr/local/bin/metrics-collector.sh)
Nov 09 10:16:11 srv-k8s01 kernel: [  141.201902] [CRITICAL] kernel: page allocation failure: order:2, mode:0x20
Nov 09 10:16:15 srv-k8s01 nginx[3102]: 192.168.1.10 - - [09/Nov/2026:10:16:15 +0300] "GET /metrics HTTP/1.1" 200 4821
Nov 09 10:16:22 srv-k8s01 keepalived[1020]: (VI_1) Entering MASTER STATE
Nov 09 10:16:30 srv-k8s01 kernel: [  160.109281] [WARNING] kernel: nf_conntrack: table full, dropping packet
Nov 09 10:16:48 srv-k8s01 sshd[2410]: Disconnected from user devops 192.168.1.50 port 54122
Nov 09 10:17:05 srv-k8s01 kernel: [  195.801290] [CRITICAL] kernel: BUG: unable to handle page fault for address 0000000000000008
Nov 09 10:17:10 srv-k8s01 systemd[1]: [CRITICAL] systemd-journald.service: Failed to write entry, ignoring: Read-only file system
Nov 09 10:17:22 srv-k8s01 prometheus[2900]: ts=2026-11-09T10:17:22Z caller=main.go:812 level=info msg="Starting Prometheus Server"
Nov 09 10:17:35 srv-k8s01 dockerd[1890]: time="2026-11-09T10:17:35Z" level=info msg="Pruning unused images"`;

const linuxQuestions = [
  {
    id: 'lq_systemctl_status',
    type: 'choice',
    score: 2,
    question: 'Какая команда позволяет проверить текущее состояние службы systemd (активна, завершилась с ошибкой или остановлена), а также просмотреть последние строки её журналов?',
    options: [
      { id: 'opt_lq1_a', text: 'systemctl status <service>' },
      { id: 'opt_lq1_b', text: 'service <service> reload' },
      { id: 'opt_lq1_c', text: 'systemctl enable <service>' },
      { id: 'opt_lq1_d', text: 'journalctl -u <service> --vacuum-time=1d' }
    ],
    correctId: 'opt_lq1_a',
    explanation: 'systemctl status отображает статус загрузки юнита, PID основного процесса, потребление памяти/CPU и последние строки вывода.'
  },
  {
    id: 'lq_hostnamectl',
    type: 'choice',
    score: 2,
    question: 'Какая утилита позволяет просмотреть информацию о сетевом имени хоста (hostname), версии операционной системы, архитектуре процессора и версии используемого ядра Linux?',
    options: [
      { id: 'opt_lq2_a', text: 'hostnamectl' },
      { id: 'opt_lq2_b', text: 'whoami' },
      { id: 'opt_lq2_c', text: 'sysctl kernel.hostname' },
      { id: 'opt_lq2_d', text: 'ifconfig -a' }
    ],
    correctId: 'opt_lq2_a',
    explanation: 'hostnamectl без аргументов выводит имя машины, шасси, Machine ID, Boot ID, ОС, версию ядра и архитектуру.'
  },
  {
    id: 'lq_journalctl_xeu',
    type: 'choice',
    score: 2,
    question: 'Что выполняет команда journalctl -xeu nginx.service?',
    options: [
      { id: 'opt_lq3_a', text: 'Выводит журнал службы nginx с переходом в конец (-e), расширенными пояснениями ошибок (-x) и фильтрацией по юниту (-u)' },
      { id: 'opt_lq3_b', text: 'Перезапускает службу nginx и очищает её журналы на диске' },
      { id: 'opt_lq3_c', text: 'Экспортирует конфигурационный файл nginx в формат JSON' },
      { id: 'opt_lq3_d', text: 'Удаляет все записи журнала старше 30 дней' }
    ],
    correctId: 'opt_lq3_a',
    explanation: '-u указывает юнит, -e переходит в конец лога (pager end), -x добавляет поясняющие сообщения из каталога ошибок systemd.'
  },
  {
    id: 'lq_ss_tlnp',
    type: 'choice',
    score: 2,
    question: 'Какая команда выведет список всех прослушиваемых TCP-сокетов (портов) с указанием номеров процессов (PID) и имен программ?',
    options: [
      { id: 'opt_lq4_a', text: 'ss -tlnp' },
      { id: 'opt_lq4_b', text: 'netstat -u' },
      { id: 'opt_lq4_c', text: 'lsof /dev/null' },
      { id: 'opt_lq4_d', text: 'iptables -L -n' }
    ],
    correctId: 'opt_lq4_a',
    explanation: 'ss: -t (TCP), -l (listening), -n (numeric ports), -p (processes/PID).'
  },
  {
    id: 'lq_ip_a',
    type: 'choice',
    score: 2,
    question: 'С помощью какой утилиты в современных дистрибутивах Linux рекомендуется проверять назначенные IP-адреса, MAC-адреса и состояние сетевых интерфейсов?',
    options: [
      { id: 'opt_lq5_a', text: 'ip a (или ip addr show)' },
      { id: 'opt_lq5_b', text: 'route -n' },
      { id: 'opt_lq5_c', text: 'arp -a' },
      { id: 'opt_lq5_d', text: 'netstat -i' }
    ],
    correctId: 'opt_lq5_a',
    explanation: 'Пакет iproute2 (утилита ip) является современным стандартом управления сетью в Linux взамен устаревшего ifconfig.'
  },
  {
    id: 'lq_df_h',
    type: 'choice',
    score: 2,
    question: 'Какая команда отображает информацию о занятом и доступном дисковом пространстве на всех смонтированных файловых системах в удобном для чтения виде (GB, MB)?',
    options: [
      { id: 'opt_lq6_a', text: 'df -h' },
      { id: 'opt_lq6_b', text: 'du -sh /' },
      { id: 'opt_lq6_c', text: 'fdisk -l' },
      { id: 'opt_lq6_d', text: 'lsblk -f' }
    ],
    correctId: 'opt_lq6_a',
    explanation: 'df (disk free) с флагом -h (human-readable) выводит объемы файловых систем в удобных единицах.'
  },
  {
    id: 'lq_free_h',
    type: 'choice',
    score: 2,
    question: 'Какая команда позволяет быстро оценить объем свободной и занятой оперативной памяти (RAM), буферов, кэша и файла подкачки (Swap) в человекочитаемом формате?',
    options: [
      { id: 'opt_lq7_a', text: 'free -h' },
      { id: 'opt_lq7_b', text: 'vmstat 1' },
      { id: 'opt_lq7_c', text: 'cat /proc/cpuinfo' },
      { id: 'opt_lq7_d', text: 'uptime' }
    ],
    correctId: 'opt_lq7_a',
    explanation: 'Команда free -h отображает total, used, free, shared, buff/cache и available память.'
  },
  {
    id: 'lq_tail_f',
    type: 'choice',
    score: 2,
    question: 'Какая команда выведет последние 50 строк файла /var/log/syslog и продолжит непрерывно отображать новые строки в реальном времени?',
    options: [
      { id: 'opt_lq8_a', text: 'tail -n 50 -f /var/log/syslog' },
      { id: 'opt_lq8_b', text: 'cat -n 50 /var/log/syslog' },
      { id: 'opt_lq8_c', text: 'head -n 50 /var/log/syslog' },
      { id: 'opt_lq8_d', text: 'less +50 /var/log/syslog' }
    ],
    correctId: 'opt_lq8_a',
    explanation: 'Флаг -n 50 задает количество выводимых строк с конца, а -f (follow) держит файл открытым для новых записей.'
  },
  {
    id: 'lq_chmod_x',
    type: 'choice',
    score: 2,
    question: 'Как сделать bash-скрипт deploy.sh исполняемым?',
    options: [
      { id: 'opt_lq9_a', text: 'chmod +x deploy.sh' },
      { id: 'opt_lq9_b', text: 'chown root deploy.sh' },
      { id: 'opt_lq9_c', text: 'chmod 644 deploy.sh' },
      { id: 'opt_lq9_d', text: 'touch +x deploy.sh' }
    ],
    correctId: 'opt_lq9_a',
    explanation: 'chmod +x устанавливает флаг выполнения (executable) для файла.'
  },
  {
    id: 'lq_tar_xzvf',
    type: 'choice',
    score: 2,
    question: 'Какая команда распакует архив backup.tar.gz в текущую директорию?',
    options: [
      { id: 'opt_lq10_a', text: 'tar -xzvf backup.tar.gz' },
      { id: 'opt_lq10_b', text: 'tar -czvf backup.tar.gz' },
      { id: 'opt_lq10_c', text: 'gzip -d -r backup.tar.gz' },
      { id: 'opt_lq10_d', text: 'unzip -q backup.tar.gz' }
    ],
    correctId: 'opt_lq10_a',
    explanation: '-x (extract), -z (gzip), -v (verbose), -f (file).'
  },
  {
    id: 'lq_sysctl_p',
    type: 'choice',
    score: 2,
    question: 'Какая команда немедленно перечитывает и применяет параметры ядра Linux из файла конфигурации /etc/sysctl.conf без перезагрузки системы?',
    options: [
      { id: 'opt_lq11_a', text: 'sysctl -p' },
      { id: 'opt_lq11_b', text: 'systemctl reload kernel' },
      { id: 'opt_lq11_c', text: 'modprobe -r sysctl' },
      { id: 'opt_lq11_d', text: 'sysctl -a' }
    ],
    correctId: 'opt_lq11_a',
    explanation: 'sysctl -p загружает настройки из /etc/sysctl.conf или указанного файла.'
  },
  {
    id: 'lq_ps_aux',
    type: 'choice',
    score: 3,
    question: 'Какая связка команд позволяет найти идентификатор процесса (PID) запущенного сервиса prometheus?',
    options: [
      { id: 'opt_lq12_a', text: 'ps aux | grep prometheus (или pgrep prometheus)' },
      { id: 'opt_lq12_b', text: 'kill -l prometheus' },
      { id: 'opt_lq12_c', text: 'top -b -n 1 | cat' },
      { id: 'opt_lq12_d', text: 'whereis prometheus' }
    ],
    correctId: 'opt_lq12_a',
    explanation: 'ps aux выводит полный список процессов всех пользователей, а grep фильтрует строки по имени.'
  }
];

const modules = [
  {
    id: 'sec1',
    title: 'Модуль 1. Базовые команды и администрирование Linux',
    description: 'Проверка знания фундаментальных системных утилит, управления службами systemd, сетью и процессами.',
    maxScore: 25,
    items: linuxQuestions
  },
  {
    id: 'sec2',
    title: 'Модуль 2. Поиск ошибок в конфигурации Nginx и фильтрация логов',
    description: 'Проверка навыков работы с веб-серверами, синтаксисом конфигураций и фильтрацией журналов Linux.',
    maxScore: 25,
    items: [
      {
        id: 't2_1',
        type: 'code',
        language: 'nginx',
        score: 15,
        title: 'Задача 2.1. Исправление конфигурации Nginx (/etc/nginx/nginx.conf)',
        taskText: `В веб-редакторе выведен файл конфигурации /etc/nginx/nginx.conf, содержащий синтаксические и конфигурационные ошибки.
Найдите и исправьте все ошибки в блоках location, чтобы веб-сервер мог корректно проксировать трафик на upstream и отдавать системные метрики.`,
        template: `server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://127.0.0.1:8080
        proxy_set_header Host $host;
    }

    location /metrics {
        stubs_status on; 
    }
}`
      },
      {
        id: 't2_2',
        type: 'log_filter',
        score: 10,
        title: 'Задача 2.2. Фильтрация системных логов (/var/log/syslog)',
        taskText: `Перед вами журнал событий /var/log/syslog.
Напишите команду grep (или регулярное выражение) для отбора событий, в которых одновременно присутствует статус [CRITICAL] и компонент kernel.`,
        logData: SYSLOG_SAMPLE,
        template: ''
      }
    ]
  },
  {
    id: 'sec3',
    title: 'Модуль 3. Dockerfile и логика CI/CD',
    description: 'Проверка навыков контейнеризации, оптимизации образов и отладки пайплайнов.',
    maxScore: 25,
    items: [
      {
        id: 't3_1',
        type: 'code',
        language: 'dockerfile',
        score: 15,
        title: 'Задача 3.1. Написание Dockerfile по ТЗ',
        taskText: `Напишите Dockerfile для запуска веб-сервера nginx согласно техническому заданию:
- Базовый образ: alpine:3.19
- Установка nginx без сохранения кэша менеджера пакетов
- Копирование локального каталога ./html в /usr/share/nginx/html
- Открытие сетевого порта: 80
- Команда запуска nginx на переднем плане (foreground) в режиме daemon off`,
        template: ''
      },
      {
        id: 't3_2',
        type: 'code',
        language: 'yaml',
        score: 10,
        title: 'Задача 3.2. Исправление пайплайна .gitlab-ci.yml',
        taskText: `В редакторе открыт конфигурационный файл пайплайна .gitlab-ci.yml.
Найдите и исправьте ошибку в стадиях конвейера, из-за которой в этапе тестирования запускается некорректная версия контейнера вместо только что собранного образа.`,
        template: `stages:
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
    - docker run -d --name app-test -p 8080:80 app:latest`
      }
    ]
  },
  {
    id: 'sec4',
    title: 'Модуль 4. Идемпотентность и синтаксис Ansible Playbook',
    description: 'Понимание концепций Ansible, модулей подготовки хостов и синтаксиса YAML.',
    maxScore: 25,
    items: [
      {
        id: 't4_1',
        type: 'code',
        language: 'yaml',
        score: 25,
        title: 'Задача 4.1. Исправление ошибок в плейбуке prepare.yml',
        taskText: `В редакторе открыт плейбук prepare.yml для подготовки узлов.
Найдите и исправьте ошибки, чтобы плейбук использовал официальный FQCN модуль для управления параметрами ядра sysctl и корректно отключал swap.`,
        template: `- name: Prepare Kubernetes Nodes
  hosts: all
  become: true
  tasks:
    - name: Enable IP Forwarding
      sysctl:
        name: net.ipv4.ip_forward
        value: '1'
        state: present
        reload: true

    - name: Disable SWAP
      command: swapoff -a
      when: ansible_swaptotal_mb > 0`
      }
    ]
  }
];

module.exports = { modules, linuxQuestions, SYSLOG_SAMPLE };
