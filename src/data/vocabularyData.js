import { createVocabularyWord } from '../utils/vocabularySchema';

// SAT Vocabulary Database - High-frequency SAT words
export const vocabularyDatabase = [
  createVocabularyWord({
    word: "ubiquitous",
    pronunciation: "yoo-BIK-wi-tuhs",
    partOfSpeech: "adjective",
    difficulty: "hard",
    frequency: 7,
    satLevel: true,
    definitions: [
      {
        definition: "Present, appearing, or found everywhere; omnipresent",
        context: "academic",
        synonyms: ["omnipresent", "pervasive", "universal", "widespread"],
        antonyms: ["rare", "scarce", "uncommon", "absent"]
      }
    ],
    examples: [
      {
        sentence: "Smartphones have become ubiquitous in modern society, with nearly everyone carrying one.",
        context: "technology"
      },
      {
        sentence: "The artist's influence was ubiquitous throughout the exhibition, visible in every piece displayed.",
        context: "art"
      }
    ],
    etymology: {
      origin: "Latin",
      rootWords: ["ubique (everywhere)", "ous (full of)"],
      evolution: "From Latin ubique meaning 'everywhere' + -ous suffix"
    },
    mnemonics: ["Think of 'Uber' being everywhere - ubiquitous"],
    categories: ["academic", "technology", "social"],
    learningTips: "Remember: if something is ubiquitous, you can't escape it - it's everywhere!",
    sources: ["SAT Official Guide", "Princeton Review"]
  })
];

// Additional high-frequency SAT words for expansion
export const additionalSATWords = [
  "ambiguous", "arbitrary", "benevolent", "capricious", "comprehensive",
  "condescending", "conventional", "elaborate", "enigmatic", "fastidious",
  "fluctuate", "fortuitous", "hypothetical", "impartial", "innovative",
  "intricate", "juxtapose", "lucrative", "meager", "nostalgic",
  "obsolete", "ostentatious", "plausible", "prevalent", "profound",
  "redundant", "scrutinize", "sporadic", "superficial", "tenacious",
  "trivial", "vindicate", "whimsical", "zealous", "aesthetic"
];

export default vocabularyDatabase;

// More comprehensive SAT vocabulary words
const moreSATWords = [
  createVocabularyWord({
    word: "ephemeral",
    pronunciation: "ih-FEM-er-uhl",
    partOfSpeech: "adjective", 
    difficulty: "hard",
    frequency: 6,
    satLevel: true,
    definitions: [
      {
        definition: "Lasting for a very short time; transitory",
        context: "literary",
        synonyms: ["fleeting", "transient", "temporary", "brief"],
        antonyms: ["permanent", "eternal", "lasting", "enduring"]
      }
    ],
    examples: [
      {
        sentence: "The beauty of cherry blossoms is ephemeral, lasting only a few weeks each spring.",
        context: "nature"
      }
    ],
    etymology: {
      origin: "Greek",
      rootWords: ["epi (upon)", "hemera (day)"],
      evolution: "From Greek ephemeros meaning 'lasting only a day'"
    },
    mnemonics: ["Ephemeral = 'a femur' breaks quickly, doesn't last"],
    categories: ["literature", "philosophy", "nature"],
    sources: ["SAT Official Guide", "Kaplan SAT"]
  }),

  createVocabularyWord({
    word: "gregarious",
    pronunciation: "grih-GAIR-ee-uhs",
    partOfSpeech: "adjective",
    difficulty: "medium",
    frequency: 8,
    satLevel: true,
    definitions: [
      {
        definition: "Fond of the company of others; sociable",
        context: "social",
        synonyms: ["sociable", "outgoing", "social", "extroverted"],
        antonyms: ["antisocial", "introverted", "solitary", "reclusive"]
      }
    ],
    examples: [
      {
        sentence: "Maria's gregarious nature made her the perfect host for the dinner party.",
        context: "social"
      }
    ],
    etymology: {
      origin: "Latin",
      rootWords: ["grex (flock)", "arius (pertaining to)"],
      evolution: "From Latin gregarius meaning 'of a flock'"
    },
    mnemonics: ["Gregarious = Greg is 'great' at parties, very social"],
    categories: ["psychology", "social", "personality"],
    sources: ["SAT Official Guide", "Barron's SAT"]
  }),

  createVocabularyWord({
    word: "meticulous",
    pronunciation: "muh-TIK-yuh-luhs",
    partOfSpeech: "adjective",
    difficulty: "medium",
    frequency: 9,
    satLevel: true,
    definitions: [
      {
        definition: "Showing great attention to detail; very careful and precise",
        context: "academic",
        synonyms: ["careful", "thorough", "precise", "painstaking"],
        antonyms: ["careless", "sloppy", "negligent", "hasty"]
      }
    ],
    examples: [
      {
        sentence: "The scientist's meticulous research methods ensured accurate and reliable results.",
        context: "science"
      }
    ],
    etymology: {
      origin: "Latin",
      rootWords: ["metus (fear)", "ulous (full of)"],
      evolution: "Originally meant 'fearful' but evolved to mean 'careful'"
    },
    mnemonics: ["Meticulous = 'Met-ick-you-less' mistakes because so careful"],
    categories: ["academic", "work", "personality"],
    sources: ["SAT Official Guide", "Princeton Review"]
  }),

  createVocabularyWord({
    word: "eloquent",
    pronunciation: "EL-uh-kwuhnt",
    partOfSpeech: "adjective",
    difficulty: "medium",
    frequency: 8,
    satLevel: true,
    definitions: [
      {
        definition: "Fluent or persuasive in speaking or writing",
        context: "communication",
        synonyms: ["articulate", "fluent", "persuasive", "expressive"],
        antonyms: ["inarticulate", "unclear", "mumbling", "incoherent"]
      }
    ],
    examples: [
      {
        sentence: "The lawyer's eloquent argument convinced the jury of her client's innocence.",
        context: "legal"
      }
    ],
    etymology: {
      origin: "Latin",
      rootWords: ["e (out)", "loqui (to speak)"],
      evolution: "From Latin eloquens meaning 'speaking out'"
    },
    mnemonics: ["Eloquent = 'L-a-quent' speaks really well"],
    categories: ["communication", "literature", "politics"],
    sources: ["SAT Official Guide", "Kaplan SAT"]
  }),

  createVocabularyWord({
    word: "pragmatic",
    pronunciation: "prag-MAT-ik",
    partOfSpeech: "adjective",
    difficulty: "hard",
    frequency: 7,
    satLevel: true,
    definitions: [
      {
        definition: "Dealing with things sensibly and realistically; practical",
        context: "business",
        synonyms: ["practical", "realistic", "sensible", "matter-of-fact"],
        antonyms: ["idealistic", "impractical", "theoretical", "unrealistic"]
      }
    ],
    examples: [
      {
        sentence: "The manager took a pragmatic approach to solving the budget crisis.",
        context: "business"
      }
    ],
    etymology: {
      origin: "Greek",
      rootWords: ["pragma (deed, action)"],
      evolution: "From Greek pragmatikos meaning 'active'"
    },
    mnemonics: ["Pragmatic = 'Prag-matic' is practical, not automatic"],
    categories: ["business", "philosophy", "problem-solving"],
    sources: ["SAT Official Guide", "Barron's SAT"]
  })
];

// Combine all vocabulary words
vocabularyDatabase.push(...moreSATWords);

// Word categories for filtering
export const wordCategories = {
  academic: ["ubiquitous", "meticulous", "comprehensive", "scrutinize"],
  social: ["gregarious", "benevolent", "condescending", "ostentatious"],
  business: ["pragmatic", "lucrative", "innovative", "redundant"],
  literature: ["eloquent", "aesthetic", "elaborate", "profound"],
  science: ["hypothetical", "intricate", "fluctuate", "comprehensive"],
  personality: ["gregarious", "meticulous", "capricious", "tenacious"]
};

// Difficulty levels
export const difficultyLevels = {
  easy: ["happy", "big", "good", "new"],
  medium: ["gregarious", "meticulous", "eloquent", "benevolent"], 
  hard: ["ubiquitous", "ephemeral", "pragmatic", "capricious"],
  expert: ["perspicacious", "grandiloquent", "pusillanimous", "sesquipedalian"]
};
