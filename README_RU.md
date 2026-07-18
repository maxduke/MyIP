# 🧰 MyIP — удобный набор инструментов для работы с IP

<div align="center">

![Баннер IPCheck.ing](https://raw.githubusercontent.com/jason5ng32/MyIP/main/public/github/gh_banner.png)

<a href="https://trendshift.io/repositories/5332" target="_blank"><img src="https://trendshift.io/api/badge/repositories/5332" alt="jason5ng32%2FMyIP | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>

[![Упоминается в Awesome Self Hosted](https://awesome.re/mentioned-badge.svg)](https://github.com/awesome-selfhosted/awesome-selfhosted)

![Звёзды репозитория GitHub](https://img.shields.io/github/stars/jason5ng32/MyIP)
![Форки GitHub](https://img.shields.io/github/forks/jason5ng32/myip)
![Загрузки Docker](https://img.shields.io/docker/pulls/jason5ng32/myip)

[![Сайт](https://img.shields.io/website?url=https%3A%2F%2Fipcheck.ing&up_message=online&label=IPCheck.ing 'IPCheck.ing')](https://ipcheck.ing)
![PWA](https://img.shields.io/badge/PWA-Supported-blue)

![CodeQL](https://github.com/jason5ng32/MyIP/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main)
![Сборка и публикация Docker](https://github.com/jason5ng32/MyIP/actions/workflows/docker-image.yml/badge.svg?branch=main)

🇺🇸 [English](README.md) | 🇨🇳 [简体中文](README_ZH.md) | 🇷🇺 [Русский](README_RU.md) | 🇫🇷 [Français](README_FR.md)

👉 Демо: [https://ipcheck.ing](https://ipcheck.ing)

Добавьте демо-сайт в закладки или разверните собственный экземпляр.

[![Развернуть с помощью Docker](https://raw.githubusercontent.com/jason5ng32/MyIP/main/public/github/Docker.svg)](https://hub.docker.com/r/jason5ng32/myip)

</div>

## 👀 Основные возможности

* 🛜 **Просмотр ваших IP-адресов**: обнаруживает и показывает локальные IP-адреса, используя несколько источников IPv4 и IPv6.
* 🔍 **Поиск информации об IP**: позволяет получить сведения о любом IP-адресе.
* 🕵️ **Информация об IP**: показывает подробные сведения обо всех IP-адресах, включая страну, регион, ASN, географическое положение и многое другое.
* 🛰️ **История ASN и топология вышестоящих сетей**: показывает историю анонсов AS для IP-префикса и визуализирует пути от ASN к магистральным сетям Tier 1.
* 🚦 **Проверка доступности**: проверяет доступность различных сайтов, например Google, GitHub, YouTube, ChatGPT и других.
* 📡 **Состояние сервисов**: показывает текущую доступность известных сервисов (Claude, OpenAI, GitHub, Cloudflare и других) по данным их официальных страниц состояния, включая состояние отдельных компонентов и недавние инциденты.
* 🚥 **Проверка WebRTC**: определяет IP-адрес, используемый при подключениях WebRTC.
* 🛑 **Тест утечки DNS**: показывает данные конечных точек DNS, чтобы оценить риск утечки DNS при использовании VPN или прокси.
* 🚀 **Тест скорости**: проверяет скорость сети с помощью пограничной инфраструктуры.
* 🚏 **Проверка правил прокси**: проверяет корректность правил маршрутизации в прокси-программах.
* ⏱️ **Глобальный тест задержки**: измеряет задержку с серверов, расположенных в разных регионах мира.
* 🚉 **Тест MTR**: выполняет MTR-тесты с серверов, расположенных в разных регионах мира.
* 🔦 **DNS-резолвер**: выполняет разрешение доменного имени через несколько источников и получает актуальные результаты, которые можно использовать для выявления подмены DNS.
* 🚧 **Проверка цензуры**: проверяет, заблокирован ли сайт в некоторых странах.
* 📓 **Поиск Whois**: получает регистрационные сведения о доменных именах и IP-адресах.
* 📀 **Поиск MAC-адреса**: получает сведения о физическом адресе устройства.
* 🖥️ **Цифровой отпечаток браузера**: позволяет рассчитать отпечаток браузера несколькими способами.
* 📋 **Контрольный список кибербезопасности**: содержит 258 рекомендаций по комплексной защите цифровой жизни.

## 💪 Дополнительно

* 🌗 **Тёмная тема**: автоматически переключается между светлой и тёмной темой в соответствии с настройками системы; также доступно ручное переключение.
* 📲 **Поддержка PWA**: сайт можно установить как приложение на телефон или компьютер через Chrome.
* ⌨️ **Сочетания клавиш**: все функции поддерживают горячие клавиши; нажмите `?`, чтобы открыть их список.
* 🌍 По результатам проверки доступности определяется, возможен ли полноценный доступ к глобальному интернету.
* 🇺🇸 🇨🇳 🇷🇺 🇫🇷 Поддерживаются английский, китайский, русский и французский языки.

## 📕 Использование

### Развёртывание в среде Node.js

Убедитесь, что Node.js установлен.

Клонируйте репозиторий:

```bash
git clone https://github.com/jason5ng32/MyIP.git
```

Установите зависимости и соберите проект. Проект использует pnpm. Если pnpm ещё не установлен, сначала установите его (npm входит в состав Node.js, поэтому эта команда всегда доступна):

```bash
npm install -g pnpm
pnpm install && pnpm run build
```

Запустите проект:

```bash
pnpm start
```

Приложение будет доступно на порту 18966.

### Использование Docker

Нажмите кнопку «Развернуть с помощью Docker» в верхней части страницы или выполните следующую команду:

```bash
docker run -d -p 18966:18966 --name myip --restart always jason5ng32/myip:latest
```

## 📚 Переменные окружения

Переменные, отмеченные как **Да**, необходимо задать для корректной работы серверной части. В частности, обязательны учётные данные MaxMind — перед заполнением таблицы прочитайте инструкции в следующем разделе.

### Базы данных MaxMind (обязательно)

MyIP использует бесплатные базы данных **GeoLite2** от MaxMind (City + ASN) для геолокации IP, поиска ASN и организаций, а также отображения значков стран во всём приложении (в карточках IP, кандидатах WebRTC ICE и других местах). Для полноценной работы серверной части требуется настроенный MaxMind.

Файлы `.mmdb` **не включены в репозиторий**, поскольку лицензия MaxMind GeoLite2 запрещает их распространение. Их необходимо получить самостоятельно. Доступны два способа:

**Вариант A — автоматически (рекомендуется, обязателен для Docker)**

1. Создайте бесплатную учётную запись на [maxmind.com/en/geolite2/signup](https://www.maxmind.com/en/geolite2/signup).
2. Создайте лицензионный ключ на странице «Manage License Keys» своей учётной записи.
3. Задайте три переменные окружения:
   ```bash
   MAXMIND_ACCOUNT_ID="your-account-id"
   MAXMIND_LICENSE_KEY="your-license-key"
   MAXMIND_AUTO_UPDATE="true"
   ```
4. Запустите серверную часть. Примерно через 60 секунд после первого запуска модуль обновления загрузит обе базы данных. Затем они будут автоматически обновляться каждые 24 часа.

> ⚠️ **При развёртывании через Docker необходимо использовать вариант A.** Новый контейнер содержит пустой каталог `common/maxmind-db/`. Без трёх указанных переменных сервер запустится, но источник IP-данных MaxMind и значки стран WebRTC работать не будут, а при каждом запуске в журнале будет появляться сообщение `MaxMind API will return 503...`.

**Вариант B — вручную (для изолированных сред и установок без Docker)**

Загрузите `GeoLite2-City.mmdb` и `GeoLite2-ASN.mmdb` из своей учётной записи MaxMind и поместите их в `common/maxmind-db/` до запуска серверной части. При таком способе `MAXMIND_AUTO_UPDATE` может оставаться равной `"false"`, однако новые версии файлов MaxMind придётся загружать вручную.

### Список переменных окружения

| Имя переменной | Обязательно | Значение по умолчанию | Описание |
| --- | --- | --- | --- |
| `MAXMIND_ACCOUNT_ID` | **Да** | `""` | Идентификатор учётной записи MaxMind, используемый вместе с `MAXMIND_LICENSE_KEY` для загрузки баз GeoLite2. См. раздел MaxMind выше. |
| `MAXMIND_LICENSE_KEY` | **Да** | `""` | Лицензионный ключ MaxMind, используемый вместе с `MAXMIND_ACCOUNT_ID`. См. раздел MaxMind выше. |
| `MAXMIND_AUTO_UPDATE` | **Да** | `"false"` | Установите `"true"`, чтобы автоматически загрузить базы GeoLite2 примерно через 60 секунд после запуска и обновлять их каждые 24 часа. **Обязательно для Docker.** Значение `"false"` допустимо только при ручном предварительном размещении файлов `.mmdb`. |
| `CAIDA_AUTO_UPDATE` | Нет | `"false"` | Установите `"true"`, чтобы ежедневно обновлять наборы данных CAIDA (as2org для поиска названия организации ASN и as-rel2 для графа связности ASN). При `"false"` отсутствующие снимки всё равно загружаются при запуске, но в дальнейшем не обновляются. |
| `VITE_GOOGLE_ANALYTICS_ID` | **Да** | `""` | Идентификатор Google Analytics для анализа использования сайта. |
| `BACKEND_PORT` | Нет | `"11966"` | Порт серверной части приложения. |
| `FRONTEND_PORT` | Нет | `"18966"` | Порт клиентской части приложения. |
| `SECURITY_RATE_LIMIT` | Нет | `"0"` | Максимальное количество запросов от одного IP к серверу за 60 минут; `0` отключает ограничение. |
| `SECURITY_DELAY_AFTER` | Нет | `"0"` | Количество первых запросов от одного IP за 20 минут, для которых не применяется замедление; после превышения задержка увеличивается. |
| `SECURITY_BLACKLIST_LOG_FILE_PATH` | Нет | `""` | Необязательный файл для записи IP, ограниченных по частоте запросов (например, `"logs/blacklist-ip.log"`). Пустое значение отключает запись в файл; событие в любом случае попадает в общий журнал. |
| `LOG_LEVEL` | Нет | `"info"` | Минимальный уровень журналирования (`debug` / `info` / `warn` / `error`). Сообщения более низких уровней подавляются. |
| `LOG_FORMAT` | Нет | pretty | Установите `"json"`, чтобы выводить по одному JSON-событию на строку для систем сбора журналов или jq. Любое другое значение или отсутствие переменной сохраняет цветной формат, используемый при разработке и просмотре журналов pm2. |
| `LOG_HTTP` | Нет | `"false"` | Установите `"true"`, чтобы включить журналирование HTTP-запросов к `/api/*` (метод, URL, статус и время ответа). По умолчанию отключено, чтобы не перегружать журналы pm2. Ошибки 4xx/5xx обработчиков журналируются независимо от этого параметра. |
| `VITE_SENTRY_DSN_FRONTEND` | Нет | `""` | DSN Sentry для клиентской части на этапе сборки. При пустом значении код Sentry вообще не включается в пакет. Переменная также используется серверной частью во время выполнения как список разрешённых адресов для `/api/monitoring` — собственного туннеля, передающего пакеты Sentry в обход блокировщиков. Если значение встраивается в самостоятельно собранный Docker-образ, передайте его контейнеру и во время выполнения, иначе маршрут туннеля останется отключённым. |
| `SENTRY_DSN_BACKEND` | Нет | `""` | DSN Sentry для серверной части во время выполнения. При пустом значении SDK Sentry не загружается. |
| `SENTRY_ENVIRONMENT` | Нет | `"production"` | Метка окружения в событиях Sentry серверной части. На компьютерах разработчиков используйте `"development"`; клиентская часть определяет окружение автоматически. |
| `SENTRY_ORG` | Нет | `""` | Slug организации Sentry, используемый вместе с `SENTRY_PROJECT_FRONTEND` и `SENTRY_AUTH_TOKEN` для загрузки карт исходного кода при сборке. |
| `SENTRY_PROJECT_FRONTEND` | Нет | `""` | Slug проекта клиентской части в Sentry, используемый при загрузке карт исходного кода во время сборки. |
| `SENTRY_AUTH_TOKEN` | Нет | `""` | Токен Sentry, разрешающий загрузку карт исходного кода во время сборки. Это секрет только для этапа сборки — он никогда не передаётся браузеру. |
| `ALLOWED_DOMAINS` | Нет | `""` | Разрешённые домены, разделённые запятыми; используются для предотвращения злоупотребления серверным API. |
| `GOOGLE_MAP_API_KEY` | Нет | `""` | Ключ API Google Maps для отображения местоположения IP на карте. |
| `IPINFO_API_KEY` | Нет | `""` | Токен API IPInfo.io для получения геолокационных данных IP. |
| `IPAPIIS_API_KEY` | Нет | `""` | Ключ API IPAPI.is для получения геолокационных данных IP. |
| `IP2LOCATION_API_KEY` | Нет | `""` | Ключ API IP2Location.io для получения геолокационных данных IP. |
| `CLOUDFLARE_API_KEY` | Нет | `""` | Ключ API Cloudflare для получения сведений об AS. Вместе с двумя переменными KV ниже и разрешением токена «Workers KV Storage: Edit» он также обеспечивает работу общедоступных диагностических отчётов. |
| `CLOUDFLARE_ACCOUNT_ID` | Нет | `""` | Идентификатор учётной записи Cloudflare, необходимый для хранения общедоступных диагностических отчётов в Workers KV. |
| `CLOUDFLARE_KV_NAMESPACE_ID` | Нет | `""` | Шестнадцатеричный идентификатор пространства имён Workers KV (не его название), где хранятся общедоступные диагностические отчёты. |
| `RIPESTAT_SOURCE_APP` | Нет | `""` | Имя приложения-источника для RIPE.net, используемое для получения истории ASN через RIPE.net. |
| `MAC_LOOKUP_API_KEY` | Нет | `""` | Ключ API MAC Lookup для получения сведений о MAC-адресах. |
| `VITE_CURL_IPV4_DOMAIN` | Нет | `""` | Домен IPv4 для CURL API, предоставляемого пользователям. |
| `VITE_CURL_IPV6_DOMAIN` | Нет | `""` | Домен IPv6 для CURL API, предоставляемого пользователям. |
| `VITE_CURL_IPV64_DOMAIN` | Нет | `""` | Домен с двойным стеком для CURL API, предоставляемого пользователям. |

Если отсутствует хотя бы одна из переменных окружения серии CURL, соответствующий API не будет включён.

### Использование переменных окружения в Node.js

Создайте файл переменных окружения:

```bash
cp .env.example .env
```

Измените `.env`, например добавив следующее:

```bash
BACKEND_PORT=11966
FRONTEND_PORT=18966
MAXMIND_ACCOUNT_ID="YOUR_ACCOUNT_ID"
MAXMIND_LICENSE_KEY="YOUR_LICENSE_KEY"
MAXMIND_AUTO_UPDATE="true"
GOOGLE_MAP_API_KEY="YOUR_KEY_HERE"
ALLOWED_DOMAINS="example.com,example.org"
```

Затем перезапустите серверную часть.

### Использование переменных окружения в Docker

Переменные окружения можно передать при запуске Docker, например:

```bash
docker run -d -p 18966:18966 \
  -e MAXMIND_ACCOUNT_ID="YOUR_ACCOUNT_ID" \
  -e MAXMIND_LICENSE_KEY="YOUR_LICENSE_KEY" \
  -e MAXMIND_AUTO_UPDATE="true" \
  -e GOOGLE_MAP_API_KEY="YOUR_KEY_HERE" \
  -e ALLOWED_DOMAINS="example.com,example.org" \
  --name myip \
  jason5ng32/myip:latest

```

## 👩🏻‍💻 Расширенное использование

Если для доступа в интернет используется прокси, добавьте следующее правило в конфигурацию прокси-клиента, изменив его под своё приложение. Это позволит проверять как настоящий IP-адрес, так и адрес, используемый через прокси:

```ini
# IP Testing
IP-CIDR,1.0.0.2/32,Proxy,no-resolve
IP-CIDR6,2606:4700:4700::1111/128,Proxy,no-resolve
DOMAIN,4.ipcheck.ing,DIRECT
DOMAIN,6.ipcheck.ing,DIRECT
# Rule Testing
DOMAIN,ptest-1.ipcheck.ing,Proxy1
DOMAIN,ptest-2.ipcheck.ing,Proxy2
DOMAIN,ptest-3.ipcheck.ing,Proxy3
DOMAIN,ptest-4.ipcheck.ing,Proxy4
DOMAIN,ptest-5.ipcheck.ing,Proxy5
DOMAIN,ptest-6.ipcheck.ing,Proxy6
DOMAIN,ptest-7.ipcheck.ing,Proxy7
DOMAIN,ptest-8.ipcheck.ing,Proxy8
```

## 💖 Спонсоры

Я очень благодарен следующим спонсорам за поддержку проекта с открытым исходным кодом:

<a href="https://www.digitalocean.com/?refcode=fd2634a3981b&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge"><img src="https://res.ipcheck.ing/img/digitalocean_logo.png" width="240px"  title="DigitalOcean" /></a>

<a href="https://www.1password.com"><img src="https://res.ipcheck.ing/img/1password_logo.png" alt="1Password" title="1Password" width="240px"  /></a>

<a href="https://www.greptile.com/"><img src="https://res.ipcheck.ing/img/greptile_logo.png" alt="Greptile" title="Greptile" width="240px"  /></a>

<a href="https://www.sentry.io"><img src="https://res.ipcheck.ing/img/sentry_logo.png" alt="Sentry" title="Sentry" width="240px" /></a>

<a href="https://www.cloudflare.com/lp/project-alexandria/"><img src="https://res.ipcheck.ing/img/cloudflare_logo.png" alt="Cloudflare Project Alexandria" title="Cloudflare Project Alexandria" width="240px" /></a>
