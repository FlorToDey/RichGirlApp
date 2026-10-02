// Suggestion lists for onboarding autocomplete

export const CAR_MODELS = {
  'Rolls-Royce': ['Phantom', 'Ghost', 'Cullinan', 'Spectre', 'Wraith', 'Dawn'],
  Bentley: ['Bentayga', 'Continental GT', 'Flying Spur'],
  Bugatti: ['Chiron', 'Divo', 'Tourbillon', 'Veyron'],
  Ferrari: ['SF90 Stradale', 'Roma', 'Purosangue', '296 GTB', '812 Superfast', 'F8 Tributo', '12Cilindri'],
  Lamborghini: ['Urus', 'Huracán', 'Revuelto', 'Aventador'],
  McLaren: ['750S', '765LT', 'Artura', 'P1', 'Senna'],
  Porsche: ['911 Turbo S', '911 GT3', 'Cayenne', 'Panamera', 'Taycan', 'Macan'],
  'Mercedes-Benz': ['G 63 AMG', 'S-Class', 'GLS', 'E-Class', 'EQS', 'V-Class'],
  'Mercedes-Maybach': ['S 680', 'GLS 600', 'SL 680'],
  'Mercedes-AMG': ['GT', 'GT 63 S', 'SL 63', 'One'],
  BMW: ['M5', 'M8 Competition', 'X7', 'X5 M', '7 Series', 'i7', 'XM'],
  Audi: ['RS Q8', 'R8', 'RS6 Avant', 'A8', 'e-tron GT'],
  'Aston Martin': ['DBX', 'DB12', 'Vantage', 'Valkyrie'],
  'Range Rover': ['SV', 'Sport', 'Velar'],
  'Land Rover': ['Defender', 'Discovery'],
  Maserati: ['MC20', 'Levante', 'GranTurismo'],
  Pagani: ['Huayra', 'Zonda', 'Utopia'],
  Koenigsegg: ['Jesko', 'Regera', 'Gemera'],
  Tesla: ['Model S Plaid', 'Model X', 'Cybertruck', 'Model 3', 'Roadster'],
  Cadillac: ['Escalade', 'Lyriq'],
  Lexus: ['LX 600', 'LM', 'RX', 'LC 500'],
  Toyota: ['Land Cruiser 300', 'Alphard', 'Camry', 'Supra'],
  Dodge: ['Challenger', 'Charger', 'Durango', 'Viper', 'Ram TRX'],
  Chevrolet: ['Corvette', 'Camaro', 'Tahoe'],
  Ford: ['Mustang', 'F-150 Raptor', 'GT', 'Bronco'],
  Genesis: ['G90', 'GV80'],
  Zeekr: ['001', '009'],
  'Li Auto': ['L9', 'Mega'],
  Lada: ['Vesta', 'Granta', 'Niva Legend', 'Priora (тюнинг)'],
}

export const CARS = Object.entries(CAR_MODELS).flatMap(([brand, models]) => models.map((m) => `${brand} ${m}`))

export const YACHTS = [
  'Lürssen', 'Feadship', 'Benetti', 'Oceanco', 'Amels', 'Heesen', 'Sanlorenzo', 'Azimut', 'Sunseeker',
  'Princess', 'Ferretti', 'Riva', 'Pershing', 'Baglietto', 'Codecasa', 'Wally', 'Nobiskrug', 'Abeking & Rasmussen',
].flatMap((b) => [`${b}, 30 м`, `${b}, 50 м`, `${b}, 80 м`])

export const BUSINESSES = [
  'Сеть кофеен', 'Сеть ресторанов', 'IT-компания', 'Нефтесервис', 'Девелопмент', 'Строительная компания',
  'Салоны красоты', 'Фитнес-клубы', 'Бренд одежды', 'Ювелирный дом', 'Отели', 'Логистика', 'Агрохолдинг',
  'Онлайн-школа', 'Маркетплейс', 'Банк', 'Инвестфонд', 'Майнинг-ферма', 'Медицинские клиники', 'Автосалоны',
  'Винодельня', 'Медиахолдинг', 'Парфюмерный бренд', 'Золотодобыча', 'Сеть барбершопов',
]

export const REALTY = [
  'Пентхаус в Москва-Сити', 'Особняк на Рублёвке', 'Вилла в Ницце', 'Вилла в Каннах', 'Апартаменты в Дубае',
  'Шале в Куршевеле', 'Таунхаус в Лондоне', 'Дом на Бали', 'Остров (небольшой)', 'Замок во Франции',
  'Квартира на Патриарших', 'Дом в Монако',
]

export const CITIES = [
  'Москва', 'Санкт-Петербург', 'Сочи', 'Казань', 'Екатеринбург', 'Новосибирск', 'Краснодар', 'Ростов-на-Дону',
  'Калининград', 'Владивосток', 'Нижний Новгород', 'Самара', 'Уфа', 'Пермь', 'Воронеж', 'Тюмень', 'Красноярск',
  'Минск', 'Алматы', 'Астана', 'Ташкент', 'Тбилиси', 'Ереван', 'Баку', 'Дубай', 'Монако', 'Лондон', 'Ницца',
  'Женева', 'Милан', 'Париж', 'Майами', 'Нью-Йорк', 'Бали', 'Пхукет', 'Стамбул',
]

export const SKILLS = ['Ношу сумки', 'Красиво молчу', 'Готовлю', 'Массаж', 'Фотограф для сторис', 'Права категории B', 'Знаю вина', 'Танцы', 'Гитара', 'Пресс', 'Слушаю', 'Не храплю']

// "dodge" -> all Dodge models; "chal" -> Dodge Challenger; matches word starts first
export function suggest(list, query, limit = 6) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const starts = []
  const words = []
  const contains = []
  for (const item of list) {
    const l = item.toLowerCase()
    if (l === q) continue
    if (l.startsWith(q)) starts.push(item)
    else if (l.split(/[\s-]+/).some((w) => w.startsWith(q))) words.push(item)
    else if (l.includes(q)) contains.push(item)
  }
  return [...starts, ...words, ...contains].slice(0, limit)
}
