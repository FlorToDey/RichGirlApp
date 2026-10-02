import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { db, UPLOAD_DIR, now } from './db.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const SEED_PHOTOS = path.join(here, '..', 'seed', 'photos')

const girls = [
  { name: 'Алиса', age: 27, city: 'Москва', worth: 340_000_000, car: 'Rolls-Royce Cullinan', garage: ['Mercedes-Benz G 63 AMG', 'Porsche Taycan'], companies: ['AlisaPay', 'Сеть кофеен «Пенка»', '12% в логистическом холдинге'], realty: 'Пентхаус на Патриках, вилла в Каннах', yacht: '42 м, зовут «Котик»', allowance: 15_000, bio: 'Устала от мужчин, которым от меня что-то нужно. Хочу того, кому нужно всё. Шучу. Наверное.' },
  { name: 'Виктория', age: 31, city: 'Санкт-Петербург', worth: 1_200_000_000, car: 'Bentley Bentayga', garage: ['Mercedes-Maybach S 680'], companies: ['VikaGroup', 'Три завода по производству кирпича'], realty: 'Особняк на Крестовском, домик в Альпах', yacht: 'Есть, но я её стесняюсь', allowance: 40_000, bio: 'Ищу парня, который умеет красиво молчать на благотворительных ужинах.' },
  { name: 'Ксения', age: 25, city: 'Сочи', worth: 85_000_000, car: 'Porsche 911 Turbo S', garage: [], companies: ['Сеть салонов красоты «Ресничка»'], realty: 'Апартаменты на Красной Поляне', yacht: 'Нет, только катер', allowance: 6_000, bio: 'Люблю горы, массаж и когда мне не перечат. Можно без опыта, научу.' },
  { name: 'Дарина', age: 29, city: 'Дубай', worth: 2_700_000_000, car: 'Bugatti Chiron', garage: ['Mercedes-Benz G 63 AMG', 'Lamborghini Urus', 'Rolls-Royce Spectre'], companies: ['Darina Holdings', 'Нефтесервис', 'Сеть отелей «Песочек»'], realty: 'Этаж в Бурдж-Халифе', yacht: '78 м с вертолётной площадкой', allowance: 100_000, bio: 'Мне нужен человек, который будет напоминать мне пить воду. Плачу хорошо.' },
  { name: 'Полина', age: 24, city: 'Москва', worth: 42_000_000, car: 'Mercedes-AMG GT', garage: [], companies: ['Онлайн-школа «Деньги к деньгам»'], realty: 'Лофт в Сити', yacht: 'Арендую по праздникам', allowance: 3_500, bio: 'Мой курс купили 400 тысяч человек. Ищу одного, кто купит меня. Бесплатно.' },
  { name: 'Ева', age: 33, city: 'Казань', worth: 520_000_000, car: 'Lamborghini Urus', garage: ['Range Rover SV'], companies: ['Агрохолдинг «Зерно»', 'Банк «Евро-Ева»'], realty: 'Пол-Казани, если честно', yacht: 'На Волге, 30 м', allowance: 20_000, bio: 'Хочу простого мужского плеча. Плечо оплачу.' },
  { name: 'Марго', age: 35, city: 'Монако', worth: 3_900_000_000, car: 'Ferrari SF90 Stradale', garage: ['McLaren 750S', 'Rolls-Royce Phantom', 'Bugatti Divo', 'Porsche 911 GT3'], companies: ['Margot Capital', 'Модный дом MRG', 'Футбольный клуб (маленький)'], realty: 'Монако, Лондон, Нью-Йорк, Бали', yacht: 'Две. Одна для гостей', allowance: 250_000, bio: 'Бывший муж сказал, что деньги не главное. Теперь он в этом убедился.' },
  { name: 'Софья', age: 26, city: 'Екатеринбург', worth: 110_000_000, car: 'Range Rover SV', garage: ['Tesla Model S Plaid'], companies: ['IT-аутсорс «Софтия»', 'Сеть барбершопов'], realty: 'Дом у озера', yacht: 'Нет, но есть сап', allowance: 8_000, bio: 'Пишу код, зарабатываю миллионы. Ищу того, кто будет говорить мне «ну ты и умница».' },
  { name: 'Ангелина', age: 28, city: 'Москва', worth: 760_000_000, car: 'Mercedes-Maybach S 680', garage: ['Bentley Continental GT'], companies: ['Ювелирный дом «Ангел»', 'Сеть ломбардов (тсс)'], realty: 'Особняк на Рублёвке', yacht: '55 м, «Бриллиантик»', allowance: 30_000, bio: 'Подарю кольцо сама. Тебе останется только сказать «да».' },
  { name: 'Лера', age: 23, city: 'Новосибирск', worth: 28_000_000, car: 'Tesla Cybertruck', garage: [], companies: ['Кофейня «Сибирь»', 'Майнинг-ферма в гараже'], realty: 'Двушка и гараж с фермой', yacht: 'Нет. Пока', allowance: 2_000, bio: 'Купила биток по 300 баксов. Теперь ищу, кого бы купить по такой же цене.' },
  { name: 'Наталья', age: 39, city: 'Москва', worth: 4_500_000_000, car: 'Rolls-Royce Phantom', garage: ['Mercedes-Maybach GLS 600', 'Bentley Flying Spur'], companies: ['Металлургический комбинат', 'Медиахолдинг', 'Сеть клиник'], realty: 'Сколько? Восемь, кажется', yacht: '92 м, «Наташенька II»', allowance: 300_000, bio: 'Взрослая, мудрая, богатая. Ищу молодого, глупого, красивого. Два из трёх подойдёт.' },
  { name: 'Мила', age: 27, city: 'Калининград', worth: 64_000_000, car: 'BMW M8 Competition', garage: [], companies: ['Янтарная фабрика'], realty: 'Дом на Куршской косе', yacht: 'Парусная, 18 м', allowance: 5_000, bio: 'Море, янтарь и ты. Последний пункт пока вакантен.' },
  { name: 'Диана', age: 30, city: 'Москва', worth: 980_000_000, car: 'Aston Martin DBX', garage: ['Porsche Cayenne'], companies: ['Сеть фитнес-клубов «Диана»', 'Производство протеина'], realty: 'Пентхаус + загородный клуб', yacht: 'Есть, на ней спортзал', allowance: 25_000, bio: 'Возьму в зал, в Дубай и в жизнь. Именно в таком порядке.' },
  { name: 'Агата', age: 52, city: 'Лондон', worth: 1_800_000_000, car: 'McLaren 765LT', garage: ['Rolls-Royce Ghost'], companies: ['Agatha Art Fund', 'Аукционный дом'], realty: 'Таунхаус в Кенсингтоне', yacht: 'Да, с галереей на борту', allowance: 60_000, bio: 'Коллекционирую Ротко и красивых мужчин. Ротко пока больше.' },
  { name: 'Елена', age: 41, city: 'Краснодар', worth: 2_100_000_000, car: 'Cadillac Escalade', garage: ['Lexus LX 600', 'Toyota Land Cruiser 300'], companies: ['Агрохолдинг «Кубань-Голд»', 'Виноградники', 'Сахарный завод'], realty: 'Усадьба 40 гектар', yacht: 'На Чёрном море, 60 м', allowance: 80_000, bio: 'Мой виноградник видно из космоса. Тебя пока нет. Исправим?' },
  { name: 'Карина', age: 26, city: 'Москва', worth: 190_000_000, car: 'Mercedes-Benz G 63 AMG', garage: ['Porsche 911 Turbo S'], companies: ['Бренд одежды KRN', 'Шоурум в ЦУМе'], realty: 'Квартира на Остоженке', yacht: 'Арендую на Лазурке', allowance: 12_000, bio: 'Одену, обую, отвезу на показ. Требование одно: не носи кроксы.' },
  { name: 'Злата', age: 29, city: 'Ростов-на-Дону', worth: 670_000_000, car: 'Ferrari Roma', garage: ['Lexus LX 600'], companies: ['Золотодобывающая артель', 'Ресторан «Злато»'], realty: 'Дом на Дону, квартира в Москве', yacht: 'Речная, но огромная', allowance: 22_000, bio: 'Имя обязывает. Золота хватит на двоих, характера — только на меня.' },
  { name: 'Ульяна', age: 32, city: 'Владивосток', worth: 380_000_000, car: 'Toyota Land Cruiser 300', garage: ['Lexus LX 600', 'Toyota Alphard'], companies: ['Импорт авто из Японии', 'Рыболовецкий флот'], realty: 'Дом с видом на Золотой Рог', yacht: 'Целый флот, но рыболовный', allowance: 14_000, bio: 'Привезу тебе машину из Японии. И краба. Можно сразу двух.' },
  { name: 'Вероника', age: 37, city: 'Женева', worth: 6_300_000_000, car: 'Pagani Huayra', garage: ['Koenigsegg Jesko', 'Rolls-Royce Cullinan'], companies: ['Частный банк', 'Часовая мануфактура', 'Фарма'], realty: 'Шале, замок, остров (маленький)', yacht: '110 м, подводная лодка в комплекте', allowance: 500_000, bio: 'Есть остров. Нет того, с кем на нём молчать. Подаём заявки.' },
  { name: 'Стефания', age: 28, city: 'Ницца', worth: 1_450_000_000, car: 'Rolls-Royce Spectre', garage: ['Ferrari Purosangue'], companies: ['Сеть бутик-отелей', 'Парфюмерный бренд'], realty: 'Вилла на Кап-Ферра', yacht: '64 м, «Мадмуазель»', allowance: 45_000, bio: 'Ты будешь пахнуть моими духами и жить в моих отелях. Звучит как план?' },
]

const guys = [
  { name: 'Артём', age: 24, city: 'Москва', bio: 'Готовлю пасту, ношу сумки, умею ждать в машине по 4 часа.', skills: ['Ношу сумки', 'Готовлю', 'Фотограф для сторис'] },
  { name: 'Никита', age: 26, city: 'Санкт-Петербург', bio: 'Красиво молчу на ужинах. Рекомендации от трёх бывших прилагаю.', skills: ['Красиво молчу', 'Знаю вина'] },
  { name: 'Даниил', age: 23, city: 'Сочи', bio: 'Хожу в зал, делаю массаж, не задаю лишних вопросов.', skills: ['Массаж', 'Пресс', 'Права категории B'] },
  { name: 'Максим', age: 28, city: 'Москва', bio: 'Бывший стартапер. Стартап кончился, обаяние осталось.', skills: ['Питчинг', 'Танцы', 'Слушаю'] },
  { name: 'Илья', age: 25, city: 'Казань', bio: 'Играю на гитаре под окном. Окно на 40 этаже — приеду на лифте.', skills: ['Гитара', 'Стихи', 'Пунктуальность'] },
  { name: 'Егор', age: 27, city: 'Екатеринбург', bio: 'Умею чинить всё, кроме своего финансового положения.', skills: ['Руки из плеч', 'Шашлык'] },
  { name: 'Тимур', age: 38, city: 'Дубай', bio: 'Уже в Дубае. Осталось найти, у кого тут жить.', skills: ['Английский', 'Загар', 'Позитив'] },
  { name: 'Марк', age: 29, city: 'Москва', bio: 'Выгуливаю собак, кошек и чужие суперкары. Аккуратно.', skills: ['Водитель', 'Собачник', 'Не храплю'] },
]

// "Bentley Bentayga + водитель Геннадий" -> main car plus the rest of the garage
function carList(g) {
  const extra = g.garage || []
  return [{ name: g.car, main: true }, ...extra.map((name) => ({ name, main: false }))]
}

function copyPhoto(file) {
  const dir = path.join(UPLOAD_DIR, 'seed')
  fs.mkdirSync(dir, { recursive: true })
  const dest = path.join(dir, file)
  if (!fs.existsSync(dest)) fs.copyFileSync(path.join(SEED_PHOTOS, file), dest)
  return `/uploads/seed/${file}`
}

export function seed() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users WHERE is_bot = 1').get().c
  if (count > 0) return
  const pass = bcrypt.hashSync('bot-' + Math.random(), 8)
  const insert = db.prepare(`INSERT INTO users
    (login, pass, role, name, age, city, bio, photos, net_worth, main_car, cars, companies, income_source, realty, yacht, allowance, skills, verified, is_bot, created_at)
    VALUES (@login, @pass, @role, @name, @age, @city, @bio, @photos, @net_worth, @main_car, @cars, @companies, @income_source, @realty, @yacht, @allowance, @skills, @verified, 1, @created_at)`)
  const tx = db.transaction(() => {
    girls.forEach((g, i) => insert.run({
      login: `bot_girl_${i + 1}`, pass, role: 'f', name: g.name, age: g.age, city: g.city, bio: g.bio,
      photos: JSON.stringify([copyPhoto(`g${i + 1}.jpg`)]),
      net_worth: g.worth, main_car: carList(g)[0].name, cars: JSON.stringify(carList(g)), companies: JSON.stringify(g.companies), income_source: null,
      realty: g.realty, yacht: g.yacht, allowance: g.allowance, skills: '[]', verified: i % 3 === 0 ? 1 : 0,
      created_at: now(),
    }))
    guys.forEach((b, i) => insert.run({
      login: `bot_guy_${i + 1}`, pass, role: 'm', name: b.name, age: b.age, city: b.city, bio: b.bio,
      photos: JSON.stringify([copyPhoto(`b${i + 1}.jpg`)]),
      net_worth: null, main_car: null, cars: '[]', companies: '[]', income_source: null, realty: null, yacht: null,
      allowance: null, skills: JSON.stringify(b.skills), verified: 0, created_at: now(),
    }))
  })
  tx()
  console.log(`seeded ${girls.length} girls and ${guys.length} guys`)
}
