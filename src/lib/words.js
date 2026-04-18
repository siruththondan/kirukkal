/**
 * words.js — Tamil word bank
 * difficulty: 'easy' | 'medium' | 'hard'
 * getRandomWords now supports difficulty filtering
 */

export const WORDS = [
  // ── Animals ──────────────────────────────────────────────────────
  { id: 'elephant',   tamil: 'யானை',            tanglish: ['yaanai','yanai','aanai'],              english: 'elephant',  category: 'animals', difficulty: 'easy' },
  { id: 'tiger',      tamil: 'புலி',             tanglish: ['puli','pooli'],                        english: 'tiger',     category: 'animals', difficulty: 'easy' },
  { id: 'lion',       tamil: 'சிங்கம்',          tanglish: ['singam','singham'],                    english: 'lion',      category: 'animals', difficulty: 'easy' },
  { id: 'monkey',     tamil: 'குரங்கு',          tanglish: ['kurangu','korangu'],                   english: 'monkey',    category: 'animals', difficulty: 'easy' },
  { id: 'fish',       tamil: 'மீன்',             tanglish: ['meen','min'],                          english: 'fish',      category: 'animals', difficulty: 'easy' },
  { id: 'dog',        tamil: 'நாய்',             tanglish: ['naai','nai'],                          english: 'dog',       category: 'animals', difficulty: 'easy' },
  { id: 'cat',        tamil: 'பூனை',             tanglish: ['poonai','punai'],                      english: 'cat',       category: 'animals', difficulty: 'easy' },
  { id: 'horse',      tamil: 'குதிரை',           tanglish: ['kuthirai','kudurai','kuthurai'],        english: 'horse',     category: 'animals', difficulty: 'easy' },
  { id: 'cow',        tamil: 'மாடு',             tanglish: ['maadu','maatu','madu'],                english: 'cow',       category: 'animals', difficulty: 'easy' },
  { id: 'goat',       tamil: 'ஆடு',             tanglish: ['aadu','aatu'],                         english: 'goat',      category: 'animals', difficulty: 'easy' },
  { id: 'chicken',    tamil: 'கோழி',             tanglish: ['kozhi','koli','gozhi'],                english: 'chicken',   category: 'animals', difficulty: 'easy' },
  { id: 'duck',       tamil: 'வாத்து',           tanglish: ['vaathu','vaattu','wathu'],              english: 'duck',      category: 'animals', difficulty: 'easy' },
  { id: 'snake',      tamil: 'பாம்பு',           tanglish: ['pambu','paambu'],                      english: 'snake',     category: 'animals', difficulty: 'easy' },
  { id: 'rabbit',     tamil: 'முயல்',            tanglish: ['muyalu','muyal'],                      english: 'rabbit',    category: 'animals', difficulty: 'easy' },
  { id: 'fox',        tamil: 'நரி',              tanglish: ['nari','neri'],                         english: 'fox',       category: 'animals', difficulty: 'easy' },
  { id: 'bear',       tamil: 'கரடி',             tanglish: ['karadi','kardi'],                      english: 'bear',      category: 'animals', difficulty: 'easy' },
  { id: 'deer',       tamil: 'மான்',             tanglish: ['maan','man'],                          english: 'deer',      category: 'animals', difficulty: 'easy' },
  { id: 'parrot',     tamil: 'கிளி',             tanglish: ['kili','keeli'],                        english: 'parrot',    category: 'animals', difficulty: 'easy' },
  { id: 'crow',       tamil: 'காகம்',            tanglish: ['kaagam','kagam','kakkam'],              english: 'crow',      category: 'animals', difficulty: 'easy' },
  { id: 'peacock',    tamil: 'மயில்',            tanglish: ['mayil','muyil'],                       english: 'peacock',   category: 'animals', difficulty: 'easy' },
  { id: 'ant',        tamil: 'எறும்பு',          tanglish: ['erumbu','irumbu'],                     english: 'ant',       category: 'animals', difficulty: 'easy' },
  { id: 'frog',       tamil: 'தவளை',             tanglish: ['thavalay','thavalai'],                 english: 'frog',      category: 'animals', difficulty: 'easy' },
  { id: 'mosquito',   tamil: 'கொசு',             tanglish: ['kosu','goshu'],                        english: 'mosquito',  category: 'animals', difficulty: 'easy' },
  { id: 'crab',       tamil: 'நண்டு',            tanglish: ['nandu','nantu'],                       english: 'crab',      category: 'animals', difficulty: 'easy' },
  { id: 'eagle',      tamil: 'கழுகு',            tanglish: ['kazhugu','kazugu'],                    english: 'eagle',     category: 'animals', difficulty: 'medium' },
  { id: 'camel',      tamil: 'ஒட்டகம்',          tanglish: ['ottakam','oottakam'],                  english: 'camel',     category: 'animals', difficulty: 'medium' },
  { id: 'buffalo',    tamil: 'எருமை',            tanglish: ['erumai','irumi'],                      english: 'buffalo',   category: 'animals', difficulty: 'medium' },
  { id: 'butterfly',  tamil: 'வண்ணத்துப்பூச்சி', tanglish: ['vannathu puchi','butterfly'],          english: 'butterfly', category: 'animals', difficulty: 'hard' },
  { id: 'sparrow',    tamil: 'சிட்டுக்குருவி',  tanglish: ['chittu kuruvi','sittu kuruvi'],        english: 'sparrow',   category: 'animals', difficulty: 'hard' },

  // ── Food ─────────────────────────────────────────────────────────
  { id: 'idli',       tamil: 'இட்லி',            tanglish: ['idli','iddly','idly'],                 english: 'idli',      category: 'food', difficulty: 'easy' },
  { id: 'dosa',       tamil: 'தோசை',             tanglish: ['dosai','thosai','dosa'],               english: 'dosa',      category: 'food', difficulty: 'easy' },
  { id: 'sambar',     tamil: 'சாம்பார்',          tanglish: ['sambar','sambhar','saambar'],           english: 'sambar',    category: 'food', difficulty: 'easy' },
  { id: 'rasam',      tamil: 'ரசம்',             tanglish: ['rasam','raasam'],                      english: 'rasam',     category: 'food', difficulty: 'easy' },
  { id: 'biryani',    tamil: 'பிரியாணி',         tanglish: ['biryani','biriyani','briyani'],        english: 'biryani',   category: 'food', difficulty: 'easy' },
  { id: 'vadai',      tamil: 'வடை',              tanglish: ['vadai','vada','vaday'],                english: 'vada',      category: 'food', difficulty: 'easy' },
  { id: 'pongal',     tamil: 'பொங்கல்',          tanglish: ['pongal'],                              english: 'pongal',    category: 'food', difficulty: 'easy' },
  { id: 'mango',      tamil: 'மாம்பழம்',         tanglish: ['mambazham','maampazham','mango'],       english: 'mango',     category: 'food', difficulty: 'easy' },
  { id: 'rice',       tamil: 'சோறு',             tanglish: ['soru','choru'],                        english: 'rice',      category: 'food', difficulty: 'easy' },
  { id: 'milk',       tamil: 'பால்',             tanglish: ['paal','pal'],                          english: 'milk',      category: 'food', difficulty: 'easy' },
  { id: 'tea',        tamil: 'தேநீர்',           tanglish: ['theneer','tea','chai','chaaya'],        english: 'tea',       category: 'food', difficulty: 'easy' },
  { id: 'coffee',     tamil: 'காபி',             tanglish: ['kaapi','kapi','coffee'],               english: 'coffee',    category: 'food', difficulty: 'easy' },
  { id: 'murukku',    tamil: 'முறுக்கு',         tanglish: ['murukku','muruku'],                    english: 'murukku',   category: 'food', difficulty: 'easy' },
  { id: 'coconut',    tamil: 'தேங்காய்',         tanglish: ['theengai','thengai','coconut'],         english: 'coconut',   category: 'food', difficulty: 'easy' },
  { id: 'onion',      tamil: 'வெங்காயம்',        tanglish: ['vengayam','vengaayam','onion'],         english: 'onion',     category: 'food', difficulty: 'easy' },
  { id: 'tomato',     tamil: 'தக்காளி',          tanglish: ['thakkali','takkali','tomato'],          english: 'tomato',    category: 'food', difficulty: 'easy' },
  { id: 'banana',     tamil: 'வாழைப்பழம்',       tanglish: ['vaazhaipazham','vaalaippazham','banana'], english: 'banana',  category: 'food', difficulty: 'medium' },
  { id: 'halwa',      tamil: 'அல்வா',            tanglish: ['halwa','alva','alwa'],                 english: 'halwa',     category: 'food', difficulty: 'medium' },
  { id: 'payasam',    tamil: 'பாயசம்',           tanglish: ['payasam','paaysam'],                   english: 'payasam',   category: 'food', difficulty: 'medium' },
  { id: 'fish_curry', tamil: 'மீன் குழம்பு',    tanglish: ['meen kuzhambu','meen kulambu'],         english: 'fish curry',category: 'food', difficulty: 'medium' },
  { id: 'tamarind',   tamil: 'புளி',             tanglish: ['puli','pooli'],                        english: 'tamarind',  category: 'food', difficulty: 'medium' },
  { id: 'appam',      tamil: 'அப்பம்',           tanglish: ['appam','apam'],                        english: 'appam',     category: 'food', difficulty: 'medium' },
  { id: 'puttu',      tamil: 'புட்டு',           tanglish: ['puttu','putu'],                        english: 'puttu',     category: 'food', difficulty: 'medium' },
  { id: 'kozhukattai', tamil: 'கொழுக்கட்டை',   tanglish: ['kozhukattai','kozhukkattai'],          english: 'kozhukattai', category: 'food', difficulty: 'hard' },

  // ── Objects ──────────────────────────────────────────────────────
  { id: 'tree',       tamil: 'மரம்',             tanglish: ['maram'],                               english: 'tree',      category: 'objects', difficulty: 'easy' },
  { id: 'house',      tamil: 'வீடு',             tanglish: ['veedu','veetu'],                       english: 'house',     category: 'objects', difficulty: 'easy' },
  { id: 'car',        tamil: 'கார்',             tanglish: ['kaar','car'],                          english: 'car',       category: 'objects', difficulty: 'easy' },
  { id: 'book',       tamil: 'புத்தகம்',         tanglish: ['puthagam','puttakam','book'],           english: 'book',      category: 'objects', difficulty: 'easy' },
  { id: 'pen',        tamil: 'பேனா',             tanglish: ['pena','pen'],                          english: 'pen',       category: 'objects', difficulty: 'easy' },
  { id: 'glasses',    tamil: 'கண்ணாடி',          tanglish: ['kannadi','specs'],                     english: 'glasses',   category: 'objects', difficulty: 'easy' },
  { id: 'door',       tamil: 'கதவு',             tanglish: ['kathavu','katabu'],                    english: 'door',      category: 'objects', difficulty: 'easy' },
  { id: 'window',     tamil: 'ஜன்னல்',           tanglish: ['jannal','jannel'],                     english: 'window',    category: 'objects', difficulty: 'easy' },
  { id: 'chair',      tamil: 'நாற்காலி',         tanglish: ['naarkali','chair'],                    english: 'chair',     category: 'objects', difficulty: 'easy' },
  { id: 'table',      tamil: 'மேசை',             tanglish: ['mesai','mesa','table'],                english: 'table',     category: 'objects', difficulty: 'easy' },
  { id: 'phone',      tamil: 'தொலைபேசி',        tanglish: ['tholaipesi','phone','mobile'],         english: 'phone',     category: 'objects', difficulty: 'easy' },
  { id: 'fan',        tamil: 'விசிறி',           tanglish: ['fan','visiri'],                        english: 'fan',       category: 'objects', difficulty: 'easy' },
  { id: 'lamp',       tamil: 'விளக்கு',          tanglish: ['vilakku','lamp'],                      english: 'lamp',      category: 'objects', difficulty: 'easy' },
  { id: 'umbrella',   tamil: 'குடை',             tanglish: ['kudai','kodai','umbrella'],             english: 'umbrella',  category: 'objects', difficulty: 'easy' },
  { id: 'bag',        tamil: 'பை',               tanglish: ['pai','bag'],                           english: 'bag',       category: 'objects', difficulty: 'easy' },
  { id: 'clock',      tamil: 'கடிகாரம்',         tanglish: ['kadigaram','kedigaram','watch','clock'], english: 'clock',   category: 'objects', difficulty: 'easy' },
  { id: 'key',        tamil: 'சாவி',             tanglish: ['saavi','chaavi','key'],                english: 'key',       category: 'objects', difficulty: 'easy' },
  { id: 'boat',       tamil: 'படகு',             tanglish: ['padagu','boat'],                       english: 'boat',      category: 'objects', difficulty: 'easy' },
  { id: 'ship',       tamil: 'கப்பல்',           tanglish: ['kappal','ship'],                       english: 'ship',      category: 'objects', difficulty: 'easy' },
  { id: 'train',      tamil: 'ரயில்',            tanglish: ['rayil','train','rail'],                english: 'train',     category: 'objects', difficulty: 'easy' },
  { id: 'airplane',   tamil: 'விமானம்',          tanglish: ['vimaanam','plane'],                    english: 'airplane',  category: 'objects', difficulty: 'easy' },
  { id: 'kite',       tamil: 'பட்டம்',           tanglish: ['pattam','kite'],                       english: 'kite',      category: 'objects', difficulty: 'easy' },
  { id: 'ball',       tamil: 'பந்து',            tanglish: ['panthu','ball','pandu'],               english: 'ball',      category: 'objects', difficulty: 'easy' },
  { id: 'bucket',     tamil: 'வாளி',             tanglish: ['vaali','bucket'],                      english: 'bucket',    category: 'objects', difficulty: 'easy' },
  { id: 'bicycle',    tamil: 'சைக்கிள்',         tanglish: ['cycle','saikkal','saikil'],             english: 'bicycle',   category: 'objects', difficulty: 'medium' },
  { id: 'ladder',     tamil: 'ஏணி',             tanglish: ['yeni','eni','ladder'],                 english: 'ladder',    category: 'objects', difficulty: 'medium' },
  { id: 'candle',     tamil: 'மெழுகுவர்த்தி',   tanglish: ['mezhuguvartthi','candle'],              english: 'candle',    category: 'objects', difficulty: 'hard' },

  // ── Nature ───────────────────────────────────────────────────────
  { id: 'rain',       tamil: 'மழை',             tanglish: ['mazhai','malai','rain'],               english: 'rain',      category: 'nature', difficulty: 'easy' },
  { id: 'sun',        tamil: 'சூரியன்',          tanglish: ['suriyan','sooryan','sun'],              english: 'sun',       category: 'nature', difficulty: 'easy' },
  { id: 'moon',       tamil: 'நிலவு',            tanglish: ['nilavu','moon'],                       english: 'moon',      category: 'nature', difficulty: 'easy' },
  { id: 'mountain',   tamil: 'மலை',             tanglish: ['malai','mountain'],                    english: 'mountain',  category: 'nature', difficulty: 'easy' },
  { id: 'sea',        tamil: 'கடல்',             tanglish: ['kadal','sea','ocean'],                 english: 'sea',       category: 'nature', difficulty: 'easy' },
  { id: 'river',      tamil: 'நதி',              tanglish: ['nathi','river'],                       english: 'river',     category: 'nature', difficulty: 'easy' },
  { id: 'sky',        tamil: 'வானம்',            tanglish: ['vaanam','sky'],                        english: 'sky',       category: 'nature', difficulty: 'easy' },
  { id: 'cloud',      tamil: 'மேகம்',            tanglish: ['megam','cloud'],                       english: 'cloud',     category: 'nature', difficulty: 'easy' },
  { id: 'wind',       tamil: 'காற்று',           tanglish: ['kaatru','wind'],                       english: 'wind',      category: 'nature', difficulty: 'easy' },
  { id: 'fire',       tamil: 'நெருப்பு',         tanglish: ['neruppu','fire'],                      english: 'fire',      category: 'nature', difficulty: 'easy' },
  { id: 'flower',     tamil: 'பூ',               tanglish: ['poo','pu','flower'],                   english: 'flower',    category: 'nature', difficulty: 'easy' },
  { id: 'leaf',       tamil: 'இலை',             tanglish: ['ilai','elai','leaf'],                  english: 'leaf',      category: 'nature', difficulty: 'easy' },
  { id: 'wave',       tamil: 'அலை',             tanglish: ['alai','wave'],                         english: 'wave',      category: 'nature', difficulty: 'easy' },
  { id: 'lightning',  tamil: 'மின்னல்',          tanglish: ['minnal','lightning'],                  english: 'lightning', category: 'nature', difficulty: 'easy' },
  { id: 'snow',       tamil: 'பனி',              tanglish: ['pani','snow'],                         english: 'snow',      category: 'nature', difficulty: 'easy' },
  { id: 'star',       tamil: 'நட்சத்திரம்',      tanglish: ['natchathiram','star'],                 english: 'star',      category: 'nature', difficulty: 'medium' },
  { id: 'rainbow',    tamil: 'வானவில்',          tanglish: ['vaanavil','rainbow'],                  english: 'rainbow',   category: 'nature', difficulty: 'medium' },
  { id: 'soil',       tamil: 'மண்',              tanglish: ['mann','man','soil'],                   english: 'soil',      category: 'nature', difficulty: 'medium' },

  // ── Body ─────────────────────────────────────────────────────────
  { id: 'hand',       tamil: 'கை',               tanglish: ['kai','hand'],                          english: 'hand',      category: 'body', difficulty: 'easy' },
  { id: 'leg',        tamil: 'கால்',             tanglish: ['kaal','leg'],                          english: 'leg',       category: 'body', difficulty: 'easy' },
  { id: 'head',       tamil: 'தலை',             tanglish: ['thalai','talai','head'],               english: 'head',      category: 'body', difficulty: 'easy' },
  { id: 'eye',        tamil: 'கண்',              tanglish: ['kann','kan','eye'],                    english: 'eye',       category: 'body', difficulty: 'easy' },
  { id: 'nose',       tamil: 'மூக்கு',           tanglish: ['mukku','mookku','nose'],               english: 'nose',      category: 'body', difficulty: 'easy' },
  { id: 'mouth',      tamil: 'வாய்',             tanglish: ['vaai','mouth'],                        english: 'mouth',     category: 'body', difficulty: 'easy' },
  { id: 'ear',        tamil: 'காது',             tanglish: ['kaathu','ear','kathu'],                english: 'ear',       category: 'body', difficulty: 'easy' },
  { id: 'hair',       tamil: 'முடி',             tanglish: ['mudi','hair'],                         english: 'hair',      category: 'body', difficulty: 'easy' },
  { id: 'teeth',      tamil: 'பல்',              tanglish: ['pal','pall','teeth'],                  english: 'teeth',     category: 'body', difficulty: 'easy' },
  { id: 'tongue',     tamil: 'நாக்கு',           tanglish: ['naakku','tongue','nakku'],              english: 'tongue',    category: 'body', difficulty: 'easy' },
  { id: 'finger',     tamil: 'விரல்',            tanglish: ['viral','finger'],                      english: 'finger',    category: 'body', difficulty: 'easy' },
  { id: 'heart',      tamil: 'இதயம்',           tanglish: ['idhayam','heart'],                     english: 'heart',     category: 'body', difficulty: 'easy' },
  { id: 'stomach',    tamil: 'வயிறு',            tanglish: ['vayiru','stomach'],                    english: 'stomach',   category: 'body', difficulty: 'easy' },
  { id: 'shoulder',   tamil: 'தோள்',            tanglish: ['thol','shoulder'],                     english: 'shoulder',  category: 'body', difficulty: 'easy' },
  { id: 'knee',       tamil: 'முழங்கால்',        tanglish: ['muzhangkaal','knee'],                  english: 'knee',      category: 'body', difficulty: 'medium' },
];

export const CATEGORIES = [
  { id: 'all',     label: 'அனைத்தும்',   emoji: '🎲' },
  { id: 'animals', label: 'விலங்குகள்', emoji: '🦁' },
  { id: 'food',    label: 'உணவு',       emoji: '🍛' },
  { id: 'objects', label: 'பொருட்கள்', emoji: '🏠' },
  { id: 'nature',  label: 'இயற்கை',    emoji: '🌿' },
  { id: 'body',    label: 'உடல்',       emoji: '✋' },
];

/**
 * @param {string} category - 'all' or a category id
 * @param {number} count    - number of words to return
 * @param {string|null} difficulty - 'easy'|'medium'|'hard'|null (null = all)
 */
export function getRandomWords(category = 'all', count = 3, difficulty = null) {
  let pool = category === 'all' ? WORDS : WORDS.filter(w => w.category === category);
  if (difficulty === 'easy') {
    pool = pool.filter(w => w.difficulty === 'easy');
  } else if (difficulty === 'medium') {
    pool = pool.filter(w => w.difficulty === 'easy' || w.difficulty === 'medium');
  }
  // If pool is too small, fall back to all
  if (pool.length < count) pool = WORDS;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

export function getWordById(id) {
  return WORDS.find(w => w.id === id);
}
