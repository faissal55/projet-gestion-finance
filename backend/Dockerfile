FROM php:8.2-cli

# Installer extensions nécessaires
RUN apt-get update && apt-get install -y \
    unzip \
    curl \
    git \
    libzip-dev \
    zip \
    && docker-php-ext-install pdo pdo_mysql pdo_pgsql

# Installer Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Dossier de travail
WORKDIR /app

# Copier les fichiers
COPY . .

# Installer Laravel
RUN composer install

# Exposer le port
EXPOSE 10000

# Lancer le serveur Laravel
CMD php artisan serve --host=0.0.0.0 --port=10000