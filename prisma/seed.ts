import { PrismaClient, JLPTLevel, ReadingType, KanaType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // ── Kana ────────────────────────────────────────────────────────────────────
  const hiragana = [
    { character: 'あ', romaji: 'a',   group: 'a'  },
    { character: 'い', romaji: 'i',   group: 'a'  },
    { character: 'う', romaji: 'u',   group: 'a'  },
    { character: 'え', romaji: 'e',   group: 'a'  },
    { character: 'お', romaji: 'o',   group: 'a'  },
    { character: 'か', romaji: 'ka',  group: 'ka' },
    { character: 'き', romaji: 'ki',  group: 'ka' },
    { character: 'く', romaji: 'ku',  group: 'ka' },
    { character: 'け', romaji: 'ke',  group: 'ka' },
    { character: 'こ', romaji: 'ko',  group: 'ka' },
    { character: 'さ', romaji: 'sa',  group: 'sa' },
    { character: 'し', romaji: 'shi', group: 'sa' },
    { character: 'す', romaji: 'su',  group: 'sa' },
    { character: 'せ', romaji: 'se',  group: 'sa' },
    { character: 'そ', romaji: 'so',  group: 'sa' },
    { character: 'た', romaji: 'ta',  group: 'ta' },
    { character: 'ち', romaji: 'chi', group: 'ta' },
    { character: 'つ', romaji: 'tsu', group: 'ta' },
    { character: 'て', romaji: 'te',  group: 'ta' },
    { character: 'と', romaji: 'to',  group: 'ta' },
    { character: 'な', romaji: 'na',  group: 'na' },
    { character: 'に', romaji: 'ni',  group: 'na' },
    { character: 'ぬ', romaji: 'nu',  group: 'na' },
    { character: 'ね', romaji: 'ne',  group: 'na' },
    { character: 'の', romaji: 'no',  group: 'na' },
    { character: 'は', romaji: 'ha',  group: 'ha' },
    { character: 'ひ', romaji: 'hi',  group: 'ha' },
    { character: 'ふ', romaji: 'fu',  group: 'ha' },
    { character: 'へ', romaji: 'he',  group: 'ha' },
    { character: 'ほ', romaji: 'ho',  group: 'ha' },
    { character: 'ま', romaji: 'ma',  group: 'ma' },
    { character: 'み', romaji: 'mi',  group: 'ma' },
    { character: 'む', romaji: 'mu',  group: 'ma' },
    { character: 'め', romaji: 'me',  group: 'ma' },
    { character: 'も', romaji: 'mo',  group: 'ma' },
    { character: 'や', romaji: 'ya',  group: 'ya' },
    { character: 'ゆ', romaji: 'yu',  group: 'ya' },
    { character: 'よ', romaji: 'yo',  group: 'ya' },
    { character: 'ら', romaji: 'ra',  group: 'ra' },
    { character: 'り', romaji: 'ri',  group: 'ra' },
    { character: 'る', romaji: 'ru',  group: 'ra' },
    { character: 'れ', romaji: 're',  group: 'ra' },
    { character: 'ろ', romaji: 'ro',  group: 'ra' },
    { character: 'わ', romaji: 'wa',  group: 'wa' },
    { character: 'を', romaji: 'wo',  group: 'wa' },
    { character: 'ん', romaji: 'n',   group: 'n'  },
  ]

  for (const [i, k] of hiragana.entries()) {
    await prisma.kana.upsert({
      where: { character: k.character },
      create: { character: k.character, romaji: k.romaji, type: KanaType.HIRAGANA, group: k.group, order: i },
      update: {},
    })
  }
  console.log(`✓ ${hiragana.length} hiragana characters`)

  // ── N5 Vocabulary ────────────────────────────────────────────────────────────
  const n5vocab = [
    { kanji: '食べる',    reading: 'たべる',       romaji: 'taberu',    meanings: ['to eat'],            pos: ['verb', 'ichidan'], freq: 100 },
    { kanji: '飲む',      reading: 'のむ',         romaji: 'nomu',      meanings: ['to drink'],          pos: ['verb', 'godan'],   freq: 150 },
    { kanji: '行く',      reading: 'いく',         romaji: 'iku',       meanings: ['to go'],             pos: ['verb', 'godan'],   freq: 50  },
    { kanji: '来る',      reading: 'くる',         romaji: 'kuru',      meanings: ['to come'],           pos: ['verb', 'irregular'], freq: 60 },
    { kanji: '見る',      reading: 'みる',         romaji: 'miru',      meanings: ['to see', 'to watch'], pos: ['verb', 'ichidan'], freq: 80 },
    { kanji: '聞く',      reading: 'きく',         romaji: 'kiku',      meanings: ['to listen', 'to hear', 'to ask'], pos: ['verb', 'godan'], freq: 120 },
    { kanji: '話す',      reading: 'はなす',       romaji: 'hanasu',    meanings: ['to speak', 'to talk'], pos: ['verb', 'godan'], freq: 130 },
    { kanji: '書く',      reading: 'かく',         romaji: 'kaku',      meanings: ['to write'],          pos: ['verb', 'godan'],   freq: 140 },
    { kanji: '読む',      reading: 'よむ',         romaji: 'yomu',      meanings: ['to read'],           pos: ['verb', 'godan'],   freq: 160 },
    { kanji: '買う',      reading: 'かう',         romaji: 'kau',       meanings: ['to buy'],            pos: ['verb', 'godan'],   freq: 200 },
    { kanji: '学校',      reading: 'がっこう',     romaji: 'gakkou',    meanings: ['school'],            pos: ['noun'],            freq: 170 },
    { kanji: '先生',      reading: 'せんせい',     romaji: 'sensei',    meanings: ['teacher'],           pos: ['noun'],            freq: 180 },
    { kanji: '学生',      reading: 'がくせい',     romaji: 'gakusei',   meanings: ['student'],           pos: ['noun'],            freq: 190 },
    { kanji: '日本語',    reading: 'にほんご',     romaji: 'nihongo',   meanings: ['Japanese language'], pos: ['noun'],            freq: 210 },
    { kanji: '英語',      reading: 'えいご',       romaji: 'eigo',      meanings: ['English language'],  pos: ['noun'],            freq: 220 },
    { kanji: '日本',      reading: 'にほん',       romaji: 'nihon',     meanings: ['Japan'],             pos: ['proper noun'],     freq: 40  },
    { kanji: '水',        reading: 'みず',         romaji: 'mizu',      meanings: ['water'],             pos: ['noun'],            freq: 250 },
    { kanji: 'ご飯',      reading: 'ごはん',       romaji: 'gohan',     meanings: ['cooked rice', 'meal'], pos: ['noun'],          freq: 260 },
    { kanji: '食べ物',    reading: 'たべもの',     romaji: 'tabemono',  meanings: ['food'],              pos: ['noun'],            freq: 270 },
    { kanji: '飲み物',    reading: 'のみもの',     romaji: 'nomimono',  meanings: ['drink', 'beverage'], pos: ['noun'],            freq: 280 },
    { kanji: 'お茶',      reading: 'おちゃ',       romaji: 'ocha',      meanings: ['tea (Japanese)'],    pos: ['noun'],            freq: 290 },
    { kanji: 'コーヒー',  reading: 'こーひー',     romaji: 'koohii',    meanings: ['coffee'],            pos: ['noun'],            freq: 300 },
    { kanji: '家',        reading: 'いえ',         romaji: 'ie',        meanings: ['house', 'home'],     pos: ['noun'],            freq: 230 },
    { kanji: '家族',      reading: 'かぞく',       romaji: 'kazoku',    meanings: ['family'],            pos: ['noun'],            freq: 310 },
    { kanji: 'お母さん',  reading: 'おかあさん',   romaji: 'okaasan',   meanings: ['mother'],            pos: ['noun'],            freq: 320 },
    { kanji: 'お父さん',  reading: 'おとうさん',   romaji: 'otousan',   meanings: ['father'],            pos: ['noun'],            freq: 330 },
    { kanji: '友達',      reading: 'ともだち',     romaji: 'tomodachi', meanings: ['friend'],            pos: ['noun'],            freq: 340 },
    { kanji: '今日',      reading: 'きょう',       romaji: 'kyou',      meanings: ['today'],             pos: ['noun', 'adverb'],  freq: 70  },
    { kanji: '明日',      reading: 'あした',       romaji: 'ashita',    meanings: ['tomorrow'],          pos: ['noun', 'adverb'],  freq: 350 },
    { kanji: '昨日',      reading: 'きのう',       romaji: 'kinou',     meanings: ['yesterday'],         pos: ['noun', 'adverb'],  freq: 360 },
    { kanji: '時間',      reading: 'じかん',       romaji: 'jikan',     meanings: ['time'],              pos: ['noun'],            freq: 370 },
    { kanji: '何時',      reading: 'なんじ',       romaji: 'nanji',     meanings: ['what time'],         pos: ['noun'],            freq: 380 },
    { kanji: '大きい',    reading: 'おおきい',     romaji: 'ookii',     meanings: ['big', 'large'],      pos: ['adjective'],       freq: 390 },
    { kanji: '小さい',    reading: 'ちいさい',     romaji: 'chiisai',   meanings: ['small', 'little'],   pos: ['adjective'],       freq: 400 },
    { kanji: '新しい',    reading: 'あたらしい',   romaji: 'atarashii', meanings: ['new'],               pos: ['adjective'],       freq: 410 },
    { kanji: '古い',      reading: 'ふるい',       romaji: 'furui',     meanings: ['old'],               pos: ['adjective'],       freq: 420 },
    { kanji: '高い',      reading: 'たかい',       romaji: 'takai',     meanings: ['expensive', 'tall', 'high'], pos: ['adjective'], freq: 430 },
    { kanji: '安い',      reading: 'やすい',       romaji: 'yasui',     meanings: ['cheap', 'inexpensive'], pos: ['adjective'],   freq: 440 },
    { kanji: '好き',      reading: 'すき',         romaji: 'suki',      meanings: ['to like', 'likeable'], pos: ['na-adjective'], freq: 450 },
    { kanji: '嫌い',      reading: 'きらい',       romaji: 'kirai',     meanings: ['to dislike', 'hate'], pos: ['na-adjective'],  freq: 460 },
    { kanji: '元気',      reading: 'げんき',       romaji: 'genki',     meanings: ['healthy', 'energetic', 'fine'], pos: ['na-adjective', 'noun'], freq: 470 },
    { kanji: '一',        reading: 'いち',         romaji: 'ichi',      meanings: ['one', '1'],          pos: ['number'],          freq: 10  },
    { kanji: '二',        reading: 'に',           romaji: 'ni',        meanings: ['two', '2'],          pos: ['number'],          freq: 11  },
    { kanji: '三',        reading: 'さん',         romaji: 'san',       meanings: ['three', '3'],        pos: ['number'],          freq: 12  },
    { kanji: '四',        reading: 'よん',         romaji: 'yon',       meanings: ['four', '4'],         pos: ['number'],          freq: 13  },
    { kanji: '五',        reading: 'ご',           romaji: 'go',        meanings: ['five', '5'],         pos: ['number'],          freq: 14  },
    { kanji: '六',        reading: 'ろく',         romaji: 'roku',      meanings: ['six', '6'],          pos: ['number'],          freq: 15  },
    { kanji: '七',        reading: 'なな',         romaji: 'nana',      meanings: ['seven', '7'],        pos: ['number'],          freq: 16  },
    { kanji: '八',        reading: 'はち',         romaji: 'hachi',     meanings: ['eight', '8'],        pos: ['number'],          freq: 17  },
    { kanji: '九',        reading: 'きゅう',       romaji: 'kyuu',      meanings: ['nine', '9'],         pos: ['number'],          freq: 18  },
    { kanji: '十',        reading: 'じゅう',       romaji: 'juu',       meanings: ['ten', '10'],         pos: ['number'],          freq: 19  },
    { kanji: '百',        reading: 'ひゃく',       romaji: 'hyaku',     meanings: ['hundred', '100'],    pos: ['number'],          freq: 20  },
    { kanji: '千',        reading: 'せん',         romaji: 'sen',       meanings: ['thousand', '1000'],  pos: ['number'],          freq: 21  },
    // Katakana words
    { kanji: null, katakana: 'テレビ',   reading: 'てれび',     romaji: 'terebi',    meanings: ['television', 'TV'],  pos: ['noun'],  freq: 500 },
    { kanji: null, katakana: 'パン',     reading: 'ぱん',       romaji: 'pan',       meanings: ['bread'],             pos: ['noun'],  freq: 510 },
    { kanji: null, katakana: 'バス',     reading: 'ばす',       romaji: 'basu',      meanings: ['bus'],               pos: ['noun'],  freq: 520 },
    { kanji: null, katakana: 'タクシー', reading: 'たくしー',   romaji: 'takushii',  meanings: ['taxi'],              pos: ['noun'],  freq: 530 },
    { kanji: null, katakana: 'レストラン', reading: 'れすとらん', romaji: 'resutoran', meanings: ['restaurant'],       pos: ['noun'],  freq: 540 },
  ]

  let vocabCount = 0
  for (const v of n5vocab) {
    const exists = await prisma.vocabulary.findFirst({ where: { romaji: v.romaji } })
    if (!exists) {
      await prisma.vocabulary.create({
        data: {
          kanji: v.kanji,
          primaryReading: v.reading,
          katakana: (v as any).katakana ?? null,
          romaji: v.romaji,
          jlptLevel: 'N5',
          partOfSpeech: v.pos,
          frequency: v.freq,
          isCommon: v.freq < 300,
          meanings: {
            create: v.meanings.map((m, i) => ({ meaning: m, order: i })),
          },
        },
      })
      vocabCount++
    }
  }

  console.log(`✓ ${vocabCount} N5 vocabulary items`)

  // ── N5 Kanji ─────────────────────────────────────────────────────────────────
  const n5kanji = [
    { character: '日', meanings: ['sun', 'day'], on: ['ニチ', 'ジツ'], kun: ['ひ', 'か'], strokes: 4 },
    { character: '月', meanings: ['moon', 'month'], on: ['ゲツ', 'ガツ'], kun: ['つき'], strokes: 4 },
    { character: '火', meanings: ['fire'], on: ['カ'], kun: ['ひ'], strokes: 4 },
    { character: '水', meanings: ['water'], on: ['スイ'], kun: ['みず'], strokes: 4 },
    { character: '木', meanings: ['tree', 'wood'], on: ['モク', 'ボク'], kun: ['き', 'こ'], strokes: 4 },
    { character: '金', meanings: ['gold', 'money'], on: ['キン', 'コン'], kun: ['かね', 'かな'], strokes: 8 },
    { character: '土', meanings: ['earth', 'soil'], on: ['ド', 'ト'], kun: ['つち'], strokes: 3 },
    { character: '山', meanings: ['mountain'], on: ['サン'], kun: ['やま'], strokes: 3 },
    { character: '川', meanings: ['river'], on: ['セン'], kun: ['かわ'], strokes: 3 },
    { character: '田', meanings: ['rice field', 'paddy'], on: ['デン'], kun: ['た'], strokes: 5 },
    { character: '人', meanings: ['person', 'human'], on: ['ジン', 'ニン'], kun: ['ひと'], strokes: 2 },
    { character: '口', meanings: ['mouth'], on: ['コウ', 'ク'], kun: ['くち'], strokes: 3 },
    { character: '目', meanings: ['eye'], on: ['モク', 'ボク'], kun: ['め'], strokes: 5 },
    { character: '耳', meanings: ['ear'], on: ['ジ'], kun: ['みみ'], strokes: 6 },
    { character: '手', meanings: ['hand'], on: ['シュ', 'ズ'], kun: ['て'], strokes: 4 },
    { character: '足', meanings: ['foot', 'leg'], on: ['ソク'], kun: ['あし'], strokes: 7 },
    { character: '大', meanings: ['big', 'large', 'great'], on: ['ダイ', 'タイ'], kun: ['おお'], strokes: 3 },
    { character: '小', meanings: ['small', 'little'], on: ['ショウ'], kun: ['ちい', 'こ', 'お'], strokes: 3 },
    { character: '上', meanings: ['above', 'up', 'top'], on: ['ジョウ'], kun: ['うえ', 'かみ', 'のぼ'], strokes: 3 },
    { character: '下', meanings: ['below', 'down'], on: ['カ', 'ゲ'], kun: ['した', 'しも', 'さ', 'くだ', 'お'], strokes: 3 },
    { character: '中', meanings: ['middle', 'inside', 'center'], on: ['チュウ'], kun: ['なか'], strokes: 4 },
    { character: '本', meanings: ['book', 'main', 'origin'], on: ['ホン'], kun: ['もと'], strokes: 5 },
    { character: '国', meanings: ['country', 'nation'], on: ['コク'], kun: ['くに'], strokes: 8 },
    { character: '語', meanings: ['language', 'word'], on: ['ゴ'], kun: ['かた'], strokes: 14 },
    { character: '学', meanings: ['study', 'learning'], on: ['ガク'], kun: ['まな'], strokes: 8 },
    { character: '校', meanings: ['school'], on: ['コウ'], kun: [], strokes: 10 },
    { character: '先', meanings: ['before', 'ahead', 'previous'], on: ['セン'], kun: ['さき'], strokes: 6 },
    { character: '生', meanings: ['life', 'birth', 'student'], on: ['セイ', 'ショウ'], kun: ['い', 'う', 'お', 'は', 'き', 'なま'], strokes: 5 },
    { character: '年', meanings: ['year'], on: ['ネン'], kun: ['とし'], strokes: 6 },
    { character: '時', meanings: ['time', 'hour'], on: ['ジ'], kun: ['とき'], strokes: 10 },
  ]

  let kanjiCount = 0
  for (const [i, k] of n5kanji.entries()) {
    const existingKanji = await prisma.kanji.findUnique({ where: { character: k.character } })
    if (!existingKanji) {
      const kanji = await prisma.kanji.create({
        data: {
          character: k.character,
          meanings: k.meanings,
          onyomi: k.on,
          kunyomi: k.kun,
          strokeCount: k.strokes,
          jlptLevel: 'N5',
          frequency: (i + 1) * 10,
        },
      })
      // Add readings
      for (const r of k.on) {
        await prisma.kanjiReading.create({ data: { kanjiId: kanji.id, type: ReadingType.ON, reading: r } })
      }
      for (const r of k.kun) {
        await prisma.kanjiReading.create({ data: { kanjiId: kanji.id, type: ReadingType.KUN, reading: r } })
      }
      kanjiCount++
    }
  }
  console.log(`✓ ${kanjiCount} N5 kanji`)

  // ── N5 Grammar ───────────────────────────────────────────────────────────────
  const n5grammar = [
    {
      pattern: '〜は〜です', meaning: '[X] is [Y]', formation: 'Noun + は + Noun/Adjective + です',
      usage: 'Used to make simple declarative statements. は (wa) marks the topic of the sentence.',
      mistakes: 'Don\'t confuse は (topic) with が (subject). は marks what you\'re talking about.',
      examples: [
        { ja: '私は学生です。', en: 'I am a student.', ro: 'Watashi wa gakusei desu.' },
        { ja: 'これは本です。', en: 'This is a book.', ro: 'Kore wa hon desu.' },
      ], order: 1,
    },
    {
      pattern: '〜が〜', meaning: '[Subject] does [action]', formation: 'Noun + が + Verb',
      usage: 'が marks the grammatical subject of a verb. Used for emphasis or when introducing new information.',
      mistakes: 'が and は are often confused. は is for known information/topic; が is for new information/subject.',
      examples: [
        { ja: '猫がいます。', en: 'There is a cat.', ro: 'Neko ga imasu.' },
        { ja: '雨が降っています。', en: 'It is raining.', ro: 'Ame ga futte imasu.' },
      ], order: 2,
    },
    {
      pattern: '〜を〜', meaning: '[Object] is [verb-ed]', formation: 'Noun + を + Verb',
      usage: 'を (wo) marks the direct object of an action verb.',
      mistakes: 'を is only used with action verbs, not with state verbs like あります/います.',
      examples: [
        { ja: 'りんごを食べます。', en: 'I eat an apple.', ro: 'Ringo wo tabemasu.' },
        { ja: '日本語を勉強します。', en: 'I study Japanese.', ro: 'Nihongo wo benkyou shimasu.' },
      ], order: 3,
    },
    {
      pattern: '〜に行く / 来る', meaning: 'to go/come to [place]', formation: 'Place + に + 行く/来る/帰る',
      usage: 'に indicates direction/destination when used with movement verbs.',
      mistakes: 'に (destination) vs へ (direction) — both work with movement verbs but に is more specific.',
      examples: [
        { ja: '学校に行きます。', en: 'I go to school.', ro: 'Gakkou ni ikimasu.' },
        { ja: '家に帰ります。', en: 'I return home.', ro: 'Ie ni kaerimasu.' },
      ], order: 4,
    },
    {
      pattern: '〜たい', meaning: 'want to [do]', formation: 'Verb stem + たい',
      usage: 'Expresses the speaker\'s desire to do something. Only for first person in statements.',
      mistakes: '行くたい ❌ → 行きたい ✓ — attach to verb stem (masu-stem), not dictionary form.',
      examples: [
        { ja: '日本に行きたいです。', en: 'I want to go to Japan.', ro: 'Nihon ni ikitai desu.' },
        { ja: '寿司を食べたい。', en: 'I want to eat sushi.', ro: 'Sushi wo tabetai.' },
      ], order: 5,
    },
    {
      pattern: '〜ています', meaning: 'is doing / ongoing action', formation: 'Verb て-form + います',
      usage: 'Describes an ongoing action or a resulting state. Very common in Japanese.',
      mistakes: 'Verb て-form must be used, not the dictionary form. 食べています ✓, 食べいます ❌.',
      examples: [
        { ja: '今、ご飯を食べています。', en: 'I am eating right now.', ro: 'Ima, gohan wo tabete imasu.' },
        { ja: '日本語を勉強しています。', en: 'I am studying Japanese.', ro: 'Nihongo wo benkyou shite imasu.' },
      ], order: 6,
    },
    {
      pattern: '〜てください', meaning: 'Please do...', formation: 'Verb て-form + ください',
      usage: 'Polite request. Can be softened by adding ませんか after the て-form.',
      mistakes: 'Must use て-form. 食べてください ✓, 食べるください ❌.',
      examples: [
        { ja: '見てください。', en: 'Please look.', ro: 'Mite kudasai.' },
        { ja: 'ここに書いてください。', en: 'Please write here.', ro: 'Koko ni kaite kudasai.' },
      ], order: 7,
    },
    {
      pattern: '〜ない', meaning: 'negative verb form', formation: 'Verb (plain negative)',
      usage: 'The plain (casual) negative form of verbs. Used in casual speech and as a base for other forms.',
      mistakes: 'Different conjugation rules for Group 1 (godan), Group 2 (ichidan), and irregular verbs.',
      examples: [
        { ja: '今日は学校に行かない。', en: 'I\'m not going to school today.', ro: 'Kyou wa gakkou ni ikanai.' },
        { ja: 'あまり食べない。', en: 'I don\'t eat much.', ro: 'Amari tabenai.' },
      ], order: 8,
    },
    {
      pattern: '〜ました / 〜ませんでした', meaning: 'did [polite past]', formation: 'Verb masu-stem + ました / ませんでした',
      usage: 'Polite past tense. ました for affirmative, ませんでした for negative.',
      mistakes: '食べました ✓ (ate), 食べませんでした ✓ (didn\'t eat). Don\'t add です after ました.',
      examples: [
        { ja: '昨日、映画を見ました。', en: 'I watched a movie yesterday.', ro: 'Kinou, eiga wo mimashita.' },
        { ja: '朝ごはんを食べませんでした。', en: 'I didn\'t eat breakfast.', ro: 'Asagohan wo tabemasen deshita.' },
      ], order: 9,
    },
    {
      pattern: '〜から / 〜まで', meaning: 'from / until', formation: 'Noun/Verb + から + Noun/Verb + まで',
      usage: 'から marks starting point (time, place, reason). まで marks ending point.',
      mistakes: 'These can mark time or place. Can be used together: 9時から5時まで (from 9 to 5).',
      examples: [
        { ja: '9時から5時まで働きます。', en: 'I work from 9 to 5.', ro: 'Ku-ji kara go-ji made hatarakimasu.' },
        { ja: '駅から学校まで歩きます。', en: 'I walk from the station to school.', ro: 'Eki kara gakkou made arukimasu.' },
      ], order: 10,
    },
  ]

  let grammarCount = 0
  for (const g of n5grammar) {
    const existing = await prisma.grammar.findFirst({ where: { pattern: g.pattern } })
    if (!existing) {
      await prisma.grammar.create({
        data: {
          pattern: g.pattern,
          meaning: g.meaning,
          jlptLevel: 'N5',
          formation: g.formation,
          usage: g.usage,
          commonMistakes: g.mistakes,
          order: g.order,
          examples: {
            create: g.examples.map((ex, i) => ({
              japanese: ex.ja,
              romaji: ex.ro,
              english: ex.en,
              order: i,
            })),
          },
        },
      })
      grammarCount++
    }
  }
  console.log(`✓ ${grammarCount} N5 grammar points`)

  // ── Curriculum ───────────────────────────────────────────────────────────────
  const zeroCourse = await prisma.course.upsert({
    where: { id: 'course-zero-kana' },
    create: {
      id: 'course-zero-kana',
      title: 'Japanese Foundations',
      titleJa: '日本語の基礎',
      description: 'Learn the Japanese writing systems from absolute zero',
      level: 'ZERO' as JLPTLevel,
      order: 1,
      isPublished: true,
    },
    update: {},
  })

  const zeroLessons = [
    { title: 'What is Japanese?', order: 1, xp: 5 },
    { title: 'Hiragana: あいうえお', order: 2, xp: 10 },
    { title: 'Hiragana: かきくけこ', order: 3, xp: 10 },
    { title: 'Hiragana: さしすせそ', order: 4, xp: 10 },
    { title: 'Hiragana: Complete!', order: 5, xp: 20 },
    { title: 'Katakana Introduction', order: 6, xp: 10 },
    { title: 'Basic Greetings', order: 7, xp: 10 },
  ]

  for (const l of zeroLessons) {
    const existing = await prisma.lesson.findFirst({ where: { courseId: zeroCourse.id, order: l.order } })
    if (!existing) {
      await prisma.lesson.create({
        data: {
          courseId: zeroCourse.id,
          title: l.title,
          level: 'ZERO',
          order: l.order,
          xpReward: l.xp,
          isPublished: true,
        },
      })
    }
  }

  const n5Course = await prisma.course.upsert({
    where: { id: 'course-n5-main' },
    create: {
      id: 'course-n5-main',
      title: 'JLPT N5 Complete Course',
      titleJa: 'JLPT N5 完全コース',
      description: 'Complete beginner Japanese — grammar, vocabulary, kanji for N5',
      level: 'N5' as JLPTLevel,
      order: 1,
      isPublished: true,
    },
    update: {},
  })

  const n5Lessons = [
    { title: 'Lesson 01: Self Introduction', order: 1, xp: 10 },
    { title: 'Lesson 02: は and です', order: 2, xp: 10 },
    { title: 'Lesson 03: Basic Nouns', order: 3, xp: 10 },
    { title: 'Lesson 04: Numbers 1-10', order: 4, xp: 10 },
    { title: 'Lesson 05: Basic Verbs', order: 5, xp: 15 },
    { title: 'Lesson 06: Particles は・が・を', order: 6, xp: 15 },
    { title: 'Lesson 07: Particles に・で・へ', order: 7, xp: 15 },
    { title: 'Lesson 08: Food & Drink', order: 8, xp: 10 },
    { title: 'Lesson 09: Family', order: 9, xp: 10 },
    { title: 'Lesson 10: Time & Schedule', order: 10, xp: 15 },
    { title: 'Lesson 11: ています', order: 11, xp: 15 },
    { title: 'Lesson 12: たい form — Want to', order: 12, xp: 15 },
    { title: 'Lesson 13: Past Tense', order: 13, xp: 20 },
    { title: 'Lesson 14: て-form', order: 14, xp: 20 },
    { title: 'Lesson 15: Adjectives', order: 15, xp: 15 },
  ]

  for (const l of n5Lessons) {
    const existing = await prisma.lesson.findFirst({ where: { courseId: n5Course.id, order: l.order } })
    if (!existing) {
      await prisma.lesson.create({
        data: {
          courseId: n5Course.id,
          title: l.title,
          level: 'N5',
          order: l.order,
          xpReward: l.xp,
          isPublished: true,
        },
      })
    }
  }

  console.log('✓ Curriculum created')

  // Add example sentences to vocabulary
  const taberu = await prisma.vocabulary.findFirst({ where: { romaji: 'taberu' } })
  if (taberu) {
    const exCount = await prisma.vocabularyExample.count({ where: { vocabularyId: taberu.id } })
    if (exCount === 0) {
      await prisma.vocabularyExample.createMany({
        data: [
          { vocabularyId: taberu.id, japanese: '私はりんごを食べます。', romaji: 'Watashi wa ringo wo tabemasu.', english: 'I eat an apple.', order: 0 },
          { vocabularyId: taberu.id, japanese: '毎朝、朝ごはんを食べています。', romaji: 'Maiasa, asagohan wo tabete imasu.', english: 'I eat breakfast every morning.', order: 1 },
          { vocabularyId: taberu.id, japanese: '何を食べたいですか？', romaji: 'Nani wo tabetai desu ka?', english: 'What do you want to eat?', order: 2 },
        ],
      })
    }
  }

  const nomu = await prisma.vocabulary.findFirst({ where: { romaji: 'nomu' } })
  if (nomu) {
    const exCount = await prisma.vocabularyExample.count({ where: { vocabularyId: nomu.id } })
    if (exCount === 0) {
      await prisma.vocabularyExample.createMany({
        data: [
          { vocabularyId: nomu.id, japanese: '水を飲みます。', romaji: 'Mizu wo nomimasu.', english: 'I drink water.', order: 0 },
          { vocabularyId: nomu.id, japanese: 'お茶を飲みたい。', romaji: 'Ocha wo nomitai.', english: 'I want to drink tea.', order: 1 },
        ],
      })
    }
  }

  console.log('✓ Example sentences added')
  console.log('\n🎉 Seed complete!')
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
