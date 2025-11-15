# Добавление метаданных к токену

Для добавления метаданных (название, символ, изображение) к вашему токену нужно использовать Metaplex Token Metadata стандарт.

## Проблема

В вашем контракте **mint authority** - это сам mint (PDA), а не wallet пользователя. Это означает, что для создания метаданных нужно подписать транзакцию от имени PDA, что требует вызова через вашу программу.

## Решения

### Вариант 1: Использовать Metaplex CLI (Рекомендуется)

Самый простой способ - использовать Metaplex CLI:

```bash
# Установите Metaplex CLI
npm install -g @metaplex-foundation/metaplex-cli

# Создайте метаданные JSON файл
cat > metadata.json << EOF
{
  "name": "Meme Token",
  "symbol": "MEME",
  "description": "Мой мем-токен",
  "image": "https://example.com/your-image.png",
  "external_url": "https://example.com"
}
EOF

# Загрузите метаданные (требует создания инструкции в программе)
```

### Вариант 2: Добавить функцию в программу

Добавьте функцию `create_metadata` в программу Rust, которая будет создавать метаданные через CPI к Metaplex Token Metadata программе.

### Вариант 3: Использовать внешние инструменты

- Metaplex UI: https://www.metaplex.com/
- Token Creator: https://github.com/creator-platform/token-creator

## Структура JSON метаданных

Создайте JSON файл со следующей структурой:

```json
{
  "name": "Meme Token",
  "symbol": "MEME",
  "description": "Описание вашего токена",
  "image": "https://example.com/your-image.png",
  "external_url": "https://example.com",
  "attributes": [
    {
      "trait_type": "Category",
      "value": "Meme"
    }
  ]
}
```

1. Загрузите изображение на IPFS (например, через Pinata: https://www.pinata.cloud/) или другой хостинг
2. Замените `image` на URL вашего изображения
3. Загрузите JSON файл на IPFS или хостинг
4. Используйте URL JSON файла как URI в метаданных токена

## Примечание

Текущий скрипт `scripts/add-metadata.ts` требует доработки для работы с PDA signer. Для полноценной работы нужно либо добавить функцию в программу Rust, либо использовать внешние инструменты.

