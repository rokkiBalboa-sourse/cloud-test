# Инструкция по развертыванию на сервере: Docker + Nginx + Certbot SSL

Данная инструкция описывает полный пошаговый процесс развертывания платформы отборочного тестирования на домене **`cloud.sudostudy.dev`** под управлением Ubuntu/Debian Linux.

---

## Архитектура развертывания

```
Интернет (Студенты / Эксперты)
             │
             ▼ 443 (HTTPS / SSL Let's Encrypt)
     ┌───────────────┐
     │ Nginx Reverse │ (Хостовая ОС)
     │     Proxy     │ (SSL certbot: cloud.sudostudy.dev)
     └───────┬───────┘
             │ 3050 (HTTP Loopback 127.0.0.1)
             ▼
     ┌───────────────┐
     │ Docker Compose│
     │ Container     │ (Node.js + React SPA + SQLite)
     │ [cloud-test]  │
     └───────┬───────┘
             ▼ Persistent Volume
     /data/cloud_testing.db
```

---

## 1. Подготовка сервера

### 1.1. Настройка DNS-записи
Убедитесь, что A-запись для домена указывает на IP вашего сервера:
```text
cloud.sudostudy.dev  A  <IP_ВАШЕГО_СЕРВЕРА>
```

### 1.2. Обновление пакетов и установка зависимостей
Выполните на сервере:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw nginx certbot python3-certbot-nginx
```

### 1.3. Установка Docker и Docker Compose
Если Docker ещё не установлен:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Проверка
docker --version
docker compose version
```

### 1.4. Настройка фаервола (UFW)
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (Let's Encrypt / Редирект)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 2. Клонирование репозитория и запуск в Docker

### 2.1. Клонирование проекта
```bash
cd /opt
sudo git clone https://github.com/rokkiBalboa-sourse/cloud-test.git cloud-test
sudo chown -R $USER:$USER /opt/cloud-test
cd /opt/cloud-test
```

### 2.2. Запуск приложения через Docker Compose
```bash
# Сборка образа и запуск контейнера в фоне
docker compose up -d --build

# Проверка статуса контейнера
docker compose ps
docker compose logs -f
```

Контейнер будет запущен и будет прослушивать локальный адрес хоста `127.0.0.1:3050` (порт наружу не открыт, что защищает от прямого доступа в обход Nginx).

---

## 3. Выпуск бесплатного SSL-сертификата Certbot

### 3.1. Создание временной конфигурации Nginx для выпуска сертификата
Создайте директорию для ACME-челленджа:
```bash
sudo mkdir -p /var/www/certbot
```

Создайте базовый конфиг:
```bash
sudo tee /etc/nginx/sites-available/cloud.sudostudy.dev.conf << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name cloud.sudostudy.dev;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'OK';
    }
}
EOF
```

Активируйте сайт и перезапустите Nginx:
```bash
sudo ln -sf /etc/nginx/sites-available/cloud.sudostudy.dev.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 3.2. Получение сертификата
```bash
sudo certbot certonly --webroot -w /var/www/certbot -d cloud.sudostudy.dev --agree-tos --email admin@sudostudy.dev --non-interactive
```

После выполнения сертификаты сохранятся в каталоге:
`/etc/letsencrypt/live/cloud.sudostudy.dev/`

---

## 4. Настройка финального Nginx Reverse Proxy

Скопируйте готовый production-конфиг из репозитория:
```bash
sudo cp /opt/cloud-test/nginx/cloud.sudostudy.dev.conf /etc/nginx/sites-available/cloud.sudostudy.dev.conf
```

Проверьте синтаксис Nginx и примените конфигурацию:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Автопродление сертификата SSL
Certbot по умолчанию настраивает systemd таймер:
```bash
# Проверка таймера продления
sudo systemctl status certbot.timer

# Тестовый прогон автопродления
sudo certbot renew --dry-run
```

---

## 6. Управление проектом в продакшене

### Перезапуск сервиса
```bash
cd /opt/cloud-test
docker compose restart
```

### Просмотр логов
```bash
# Логи приложения
docker compose logs -f --tail=100

# Логи Nginx
sudo tail -f /var/log/nginx/cloud_test_access.log
sudo tail -f /var/log/nginx/cloud_test_error.log
```

### Резервное копирование базы данных SQLite
Все данные (учетные записи, протоколы решений, результаты) хранятся в `/opt/cloud-test/data/cloud_testing.db`.
Для создания бэкапа:
```bash
cp /opt/cloud-test/data/cloud_testing.db /opt/backup_cloud_$(date +%Y%m%d_%H%M%S).db
```

### Вход эксперта / администратора
- **URL:** `https://cloud.sudostudy.dev`
- **Логин:** `admin`
- **Пароль:** `admin2027` (или `admin123`)
- Во вкладке **«Генератор студентов»** эксперт может вставить список ФИО группы и в 1 клик выгрузить готовую ведомость с логинами и паролями для раздачи.

