import * as SQLite from "expo-sqlite";
import defaultData from "./initData.json";
import { CharacterType, HSKType, LessonType, RuleType, SentenceType, TextType, WordType } from "@/types";

export const db = SQLite.openDatabaseSync("app.db");

export function initDatabase() {
    db.execSync("PRAGMA foreign_keys = ON;");

    createHSKTable();
    createLessonTable();
    createTextTable();
    createSentencesTable(); 
    createWordsTable();
    createCharactersTable();
    createRulesTable();
    createJunctionTables();
console.log(1);
    seedDefaultData();
console.log(2);
}

export async function resetDatabase() {
  const db = await SQLite.openDatabaseAsync("app.db");

  await db.closeAsync();

  await SQLite.deleteDatabaseAsync("app.db");

  const newDb = await SQLite.openDatabaseAsync("app.db");

  return newDb;
}

export function seedDefaultData() {
    const hskCount = db.getFirstSync<{ count: number }>(
        "SELECT COUNT(*) as count FROM hsks"
    );

    

    if (!hskCount || !defaultData) return

    if (hskCount.count > 0) {
        return;
    }

    for (const hsk of defaultData.hsks) {
        db.runSync(
            "INSERT INTO hsks (id, name) VALUES (?, ?)",
            hsk.id,
            hsk.name
        );
    }

    for (const lesson of defaultData.lessons) {
        db.runSync(
            "INSERT INTO lessons (id, num, title, hskId) VALUES (?, ?, ?, ?)",
            lesson.id,
            lesson.num,
            lesson.title,
            lesson.hskId
        );
    }

    for (const text of defaultData.texts) {
        db.runSync(
            `INSERT INTO texts
            (id, lessonId, title, content, pinyin, meaning)
            VALUES (?, ?, ?, ?, ?, ?)`,
            text.id,
            text.lessonId,
            text.title,
            text.content,
            text.pinyin,
            text.meaning
        );
    }

    for (const sentence of defaultData.sentences) {
        db.runSync(
            `INSERT INTO sentences
            (id, lessonId, content, pinyin, meaning)
            VALUES (?, ?, ?, ?, ?)`,
            sentence.id,
            sentence.lessonId,
            sentence.content,
            sentence.pinyin,
            sentence.meaning
        );
    }

    for (const word of defaultData.words) {
        db.runSync(
            `INSERT INTO words
            (id, sentenceId, content, pinyin, meaning)
            VALUES (?, ?, ?, ?, ?)`,
            word.id,
            word.sentenceId,
            word.content,
            word.pinyin,
            word.meaning
        );
    }

    for (const character of defaultData.characters) {
        db.runSync(
            `INSERT INTO characters
            (id, textId, content, pinyin, tone, meaning)
            VALUES (?, ?, ?, ?, ?, ?)`,
            character.id,
            character.textId,
            character.content,
            character.pinyin,
            character.tone,
            character.meaning
        );
    }
    
    for (const rule of defaultData.rules) {
        console.log(rule);
        
        db.runSync(
            `INSERT INTO rules
            (id, hskId, lessonId, textId, sentenceId, wordId, content)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            rule.id,
            rule.hskId?? null,
            rule.lessonId?? null,
            rule.textId?? null,
            rule.sentenceId?? null,
            rule.wordId?? null,
            rule.content
        );
    }
    
}

// --------- HSKs table ------------

export const createHSKTable = () => {
    db.execSync(`
        CREATE TABLE IF NOT EXISTS hsks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        );
    `);
};

export const createHSK = (name: string) => {
    db.runSync(
        `INSERT OR IGNORE INTO hsks (name) VALUES (?)`,
        name
    );
};

export const getAllHSKs = () => { 
    const rows = db.getAllSync("SELECT * FROM hsks");
    return rows;
};

// --------- Lessons table ------------

export const createLessonTable = () => {
    db.execSync(`
        CREATE TABLE IF NOT EXISTS lessons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            num INTEGER  NOT NULL,
            title TEXT UNIQUE NOT NULL,
            hskId INTEGER NOT NULL,
            FOREIGN KEY (hskId) REFERENCES hsks(id)
        );
    `);
};

export const createLesson = (lesson: LessonType) => {
    db.runSync(
        `INSERT INTO lessons (num, title, hskId) VALUES (?, ?, ?)`,
        lesson.num,
        lesson.title,
        lesson.hskId
    );
};

export const getAllLessons = () => {
    const rows = db.getAllSync("SELECT * FROM lessons");
    return rows;
};

export const getLessonsByHSKId = (hskId: number) => {
    const rows = db.getAllSync("SELECT * FROM lessons WHERE hskId = ?", hskId);
    return rows;
};

// --------- Texts table ------------

export const createTextTable = () => {
    db.execSync(`
        CREATE TABLE IF NOT EXISTS texts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lessonId,
            hskId ,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            pinyin TEXT NOT NULL,
            meaning TEXT NOT NULL,
            FOREIGN KEY (lessonId) REFERENCES lessons(id),
            FOREIGN KEY (hskId) REFERENCES hsks(id)
        );
    `);
};

export const createText = (text: TextType) => {
    db.runSync(
        `INSERT INTO texts 
        (lessonId, hskId, title, content, pinyin, meaning) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        text.lessonId ?? null,
        text.hskId ?? null,
        text.title,
        text.content,
        text.pinyin,
        text.meaning
    );
};

export const getAllTexts = () => {
    const rows = db.getAllSync("SELECT * FROM texts");
    return rows;
};

export const getTextById = (id: number): TextType | null => {
    const row = db.getFirstSync<TextType>("SELECT * FROM texts WHERE id = ?", id);
    return row ?? null;
};

export const getTextsByLessonId = (lessonId: number) => {
    const rows = db.getAllSync("SELECT * FROM texts WHERE lessonId = ?", lessonId);
    return rows;
};

export const getTextsByHSKId = (hskId: number) => {
    const rows = db.getAllSync("SELECT * FROM texts WHERE hskId = ?", hskId);
    return rows;
};

export const getTextsBySentenceId = (sentenceId: number) => {
    const rows = db.getAllSync("SELECT * FROM texts WHERE id IN (SELECT textId FROM sentences WHERE id = ?)", sentenceId);
    return rows;
};



export const getTextsByCharacterId = (characterId: number) => {
    const rows = db.getAllSync("SELECT * FROM texts WHERE id IN (SELECT textId FROM characters WHERE id = ?)", characterId);
    return rows;
};

export const getTextsByRuleId = (ruleId: number) => {
    const rows = db.getAllSync("SELECT * FROM texts WHERE id IN (SELECT textId FROM rules WHERE id = ?)", ruleId);
    return rows;
};

// --------- Sentences table ------------

export const createSentencesTable = () => {
    db.execSync(`
        CREATE TABLE IF NOT EXISTS sentences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hskId,
            lessonId,
            textId,
            content TEXT NOT NULL,
            pinyin TEXT NOT NULL,
            meaning TEXT NOT NULL,
            FOREIGN KEY (hskId) REFERENCES lessons(id)
            FOREIGN KEY (lessonId) REFERENCES lessons(id)
            FOREIGN KEY (textId) REFERENCES lessons(id)
        );
    `);
};

export const createSentence = (sentence: SentenceType) => {
    db.runSync(
        `INSERT INTO sentences 
        (lessonId, hskId, textId, content, pinyin, meaning) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        sentence.lessonId ?? null,
        sentence.hskId ?? null,
        sentence.textId ?? null,
        sentence.content,
        sentence.pinyin,
        sentence.meaning
    );
};

export const getAllSentences = () => {
    const rows = db.getAllSync("SELECT * FROM sentences");
    return rows;
};

export const getSentencesByLessonId = (lessonId: number) => {
    const rows = db.getAllSync("SELECT * FROM sentences WHERE lessonId = ?", lessonId);
    return rows;
};

export const getSentencesByHSKId = (hskId: number) => {
    const rows = db.getAllSync("SELECT * FROM sentences WHERE hskId = ?", hskId);
    return rows;
};

export const getSentencesByTextId = (textId: number) => {
    const rows = db.getAllSync("SELECT * FROM sentences WHERE textId = ?", textId);
    return rows;
};

export const getSentencesByWordId = (wordId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM sentences 
        WHERE id IN (SELECT sentenceId FROM words WHERE id = ?) 
           OR id IN (SELECT sentenceId FROM word_sentences WHERE wordId = ?)
    `, wordId, wordId);
    return rows;
};

export const getSentencesByCharacterId = (characterId: number) => {
    const rows = db.getAllSync("SELECT * FROM sentences WHERE id IN (SELECT sentenceId FROM characters WHERE id = ?)", characterId);
    return rows;
};

export const getSentencesByRuleId = (ruleId: number) => {
    const rows = db.getAllSync("SELECT * FROM sentences WHERE id IN (SELECT sentenceId FROM rules WHERE id = ?)", ruleId);
    return rows;
};

// --------- Words table ------------

export const createWordsTable = () => {
    db.execSync(`
        CREATE TABLE IF NOT EXISTS words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hskId,
            lessonId,
            textId,
            sentenceId,
            content TEXT NOT NULL,
            pinyin TEXT NOT NULL,
            meaning TEXT NOT NULL,
            FOREIGN KEY (hskId) REFERENCES hsks(id)
            FOREIGN KEY (lessonId) REFERENCES lessons(id)
            FOREIGN KEY (textId) REFERENCES texts(id)
            FOREIGN KEY (sentenceId) REFERENCES sentences(id)
        );
    `);
};

export const createWord = (word: WordType) => {
    db.runSync(
        `INSERT INTO words 
        (lessonId, hskId, textId, sentenceId, content, pinyin, meaning) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        word.lessonId ?? null,
        word.hskId ?? null,
        word.textId ?? null,
        word.sentenceId ?? null,
        word.content,
        word.pinyin,
        word.meaning
    );
};

export const getAllWords = () => {
    const rows = db.getAllSync("SELECT * FROM words");
    return rows;
};

export const getWordsBySentenceId = (sentenceId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM words 
        WHERE sentenceId = ? 
           OR id IN (SELECT wordId FROM word_sentences WHERE sentenceId = ?)
    `, sentenceId, sentenceId);
    return rows;
};

export const getWordsByLessonId = (lessonId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM words 
        WHERE lessonId = ? 
           OR id IN (SELECT wordId FROM word_lessons WHERE lessonId = ?)
    `, lessonId, lessonId);
    return rows;
};

export const getWordsByHSKId = (hskId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM words 
        WHERE hskId = ? 
           OR id IN (SELECT wordId FROM word_hsks WHERE hskId = ?)
           OR lessonId IN (SELECT id FROM lessons WHERE hskId = ?)
    `, hskId, hskId, hskId);
    return rows;
};

export const getWordsByTextId = (textId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM words 
        WHERE textId = ? 
           OR id IN (SELECT wordId FROM word_texts WHERE textId = ?)
    `, textId, textId);
    return rows;
};

export const getWordsByCharacterId = (characterId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM words 
        WHERE id IN (SELECT wordId FROM characters WHERE id = ?)
           OR id IN (SELECT wordId FROM word_characters WHERE characterId = ?)
    `, characterId, characterId);
    return rows;
};

export const getWordsByRuleId = (ruleId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM words 
        WHERE id IN (SELECT wordId FROM rules WHERE id = ?)
           OR id IN (SELECT wordId FROM word_rules WHERE ruleId = ?)
    `, ruleId, ruleId);
    return rows;
};

export const getHSKsByWordId = (wordId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM hsks 
        WHERE id IN (SELECT hskId FROM words WHERE id = ? AND hskId IS NOT NULL)
           OR id IN (SELECT hskId FROM word_hsks WHERE wordId = ?)
    `, wordId, wordId);
    return rows;
};

export const getLessonsByWordId = (wordId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM lessons 
        WHERE id IN (SELECT lessonId FROM words WHERE id = ? AND lessonId IS NOT NULL)
           OR id IN (SELECT lessonId FROM word_lessons WHERE wordId = ?)
    `, wordId, wordId);
    return rows;
};

export const getTextsByWordId = (wordId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM texts 
        WHERE id IN (SELECT textId FROM words WHERE id = ? AND textId IS NOT NULL)
           OR id IN (SELECT textId FROM word_texts WHERE wordId = ?)
    `, wordId, wordId);
    return rows;
};

export const getWordById = (id: number): WordType | null => {
    const row = db.getFirstSync<WordType>("SELECT * FROM words WHERE id = ?", id);
    return row ?? null;
};

export const updateWord = (
    id: number,
    word: Partial<WordType>
) => {
    db.runSync(
        `UPDATE words 
        SET content = COALESCE(?, content),
            pinyin = COALESCE(?, pinyin),
            meaning = COALESCE(?, meaning),
            hskId = ?,
            lessonId = ?,
            textId = ?,
            sentenceId = ?
        WHERE id = ?`,
        word.content ?? null,
        word.pinyin ?? null,
        word.meaning ?? null,
        word.hskId ?? null,
        word.lessonId ?? null,
        word.textId ?? null,
        word.sentenceId ?? null,
        id
    );
};

export const updateWordRelations = (
    wordId: number,
    relations: {
        hskIds?: number[];
        lessonIds?: number[];
        textIds?: number[];
        sentenceIds?: number[];
        characterIds?: number[];
        ruleIds?: number[];
    }
) => {
    if (relations.hskIds) {
        db.runSync(`DELETE FROM word_hsks WHERE wordId = ?`, wordId);
        for (const hskId of relations.hskIds) {
            db.runSync(`INSERT OR IGNORE INTO word_hsks (wordId, hskId) VALUES (?, ?)`, wordId, hskId);
        }
    }
    if (relations.lessonIds) {
        db.runSync(`DELETE FROM word_lessons WHERE wordId = ?`, wordId);
        for (const lessonId of relations.lessonIds) {
            db.runSync(`INSERT OR IGNORE INTO word_lessons (wordId, lessonId) VALUES (?, ?)`, wordId, lessonId);
        }
    }
    if (relations.textIds) {
        db.runSync(`DELETE FROM word_texts WHERE wordId = ?`, wordId);
        for (const textId of relations.textIds) {
            db.runSync(`INSERT OR IGNORE INTO word_texts (wordId, textId) VALUES (?, ?)`, wordId, textId);
        }
    }
    if (relations.sentenceIds) {
        db.runSync(`DELETE FROM word_sentences WHERE wordId = ?`, wordId);
        for (const sentenceId of relations.sentenceIds) {
            db.runSync(`INSERT OR IGNORE INTO word_sentences (wordId, sentenceId) VALUES (?, ?)`, wordId, sentenceId);
        }
    }
    if (relations.characterIds) {
        db.runSync(`DELETE FROM word_characters WHERE wordId = ?`, wordId);
        for (const characterId of relations.characterIds) {
            db.runSync(`INSERT OR IGNORE INTO word_characters (wordId, characterId) VALUES (?, ?)`, wordId, characterId);
        }
    }
    if (relations.ruleIds) {
        db.runSync(`DELETE FROM word_rules WHERE wordId = ?`, wordId);
        for (const ruleId of relations.ruleIds) {
            db.runSync(`INSERT OR IGNORE INTO word_rules (wordId, ruleId) VALUES (?, ?)`, wordId, ruleId);
        }
    }
};

// --------- Characters table ------------

export const createCharactersTable = () => {
    db.execSync(`
        CREATE TABLE IF NOT EXISTS characters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hskId,
            lessonId,
            textId,
            sentenceId,
            wordId,
            content TEXT NOT NULL,
            pinyin TEXT NOT NULL,
            tone TEXT NOT NULL,
            meaning TEXT NOT NULL,
            FOREIGN KEY (hskId) REFERENCES hsks(id)
            FOREIGN KEY (lessonId) REFERENCES lessons(id)
            FOREIGN KEY (textId) REFERENCES texts(id)
            FOREIGN KEY (sentenceId) REFERENCES sentences(id)
            FOREIGN KEY (wordId) REFERENCES words(id)
        );
    `);
};

export const createCharacter = (
    character: CharacterType
) => {
    db.runSync(
        `INSERT INTO characters 
        (lessonId, hskId, textId, sentenceId, wordId, content, pinyin, tone, meaning) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        character.lessonId ?? null,
        character.hskId ?? null,
        character.textId ?? null,
        character.sentenceId ?? null,
        character.wordId ?? null,
        character.content,
        character.pinyin,
        character.tone,
        character.meaning
    );
};

export const updateCharacter = (
    id: number,
    character: Partial<CharacterType>
) => {
    db.runSync(
        `UPDATE characters 
        SET content = COALESCE(?, content),
            pinyin = COALESCE(?, pinyin),
            tone = COALESCE(?, tone),
            meaning = COALESCE(?, meaning),
            hskId = ?,
            lessonId = ?,
            textId = ?,
            sentenceId = ?,
            wordId = ?
        WHERE id = ?`,
        character.content ?? null,
        character.pinyin ?? null,
        character.tone ?? null,
        character.meaning ?? null,
        character.hskId ?? null,
        character.lessonId ?? null,
        character.textId ?? null,
        character.sentenceId ?? null,
        character.wordId ?? null,
        id
    );
};

export const updateCharacterRelations = (
    characterId: number,
    relations: {
        hskIds?: number[];
        lessonIds?: number[];
        textIds?: number[];
        sentenceIds?: number[];
        wordIds?: number[];
    }
) => {
    if (relations.hskIds) {
        db.runSync(`DELETE FROM character_hsks WHERE characterId = ?`, characterId);
        for (const hskId of relations.hskIds) {
            db.runSync(`INSERT OR IGNORE INTO character_hsks (characterId, hskId) VALUES (?, ?)`, characterId, hskId);
        }
    }
    if (relations.lessonIds) {
        db.runSync(`DELETE FROM character_lessons WHERE characterId = ?`, characterId);
        for (const lessonId of relations.lessonIds) {
            db.runSync(`INSERT OR IGNORE INTO character_lessons (characterId, lessonId) VALUES (?, ?)`, characterId, lessonId);
        }
    }
    if (relations.textIds) {
        db.runSync(`DELETE FROM character_texts WHERE characterId = ?`, characterId);
        for (const textId of relations.textIds) {
            db.runSync(`INSERT OR IGNORE INTO character_texts (characterId, textId) VALUES (?, ?)`, characterId, textId);
        }
    }
    if (relations.sentenceIds) {
        db.runSync(`DELETE FROM character_sentences WHERE characterId = ?`, characterId);
        for (const sentenceId of relations.sentenceIds) {
            db.runSync(`INSERT OR IGNORE INTO character_sentences (characterId, sentenceId) VALUES (?, ?)`, characterId, sentenceId);
        }
    }
    if (relations.wordIds) {
        db.runSync(`DELETE FROM character_words WHERE characterId = ?`, characterId);
        for (const wordId of relations.wordIds) {
            db.runSync(`INSERT OR IGNORE INTO character_words (characterId, wordId) VALUES (?, ?)`, characterId, wordId);
        }
    }
};

export const getAllCharacters = () => {
    const rows = db.getAllSync("SELECT * FROM characters");
    return rows;
};

export const getCharactersByTextId = (textId: number) => {
    const rows = db.getAllSync("SELECT * FROM characters WHERE textId = ?", textId);
    return rows;
};

export const getCharactersByHSKId = (hskId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM characters
        WHERE hskId = ?
           OR id IN (SELECT characterId FROM character_hsks WHERE hskId = ?)
    `, hskId, hskId);
    return rows;
};

export const getCharactersBySentenceId = (sentenceId: number) => {
    const rows = db.getAllSync("SELECT * FROM characters WHERE sentenceId = ?", sentenceId);
    return rows;
};

export const getCharactersByWordId = (wordId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM characters 
        WHERE wordId = ? 
           OR id IN (SELECT characterId FROM word_characters WHERE wordId = ?)
    `, wordId, wordId);
    return rows;
};

export const getCharactersByRuleId = (ruleId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM characters 
        WHERE id IN (SELECT characterId FROM rule_characters WHERE ruleId = ?)
    `, ruleId);
    return rows;
};

// --------- Rules table -------------

export const createRulesTable = () => {
    db.execSync(`
        CREATE TABLE IF NOT EXISTS rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hskId,
            lessonId,
            textId,
            sentenceId,
            wordId,
            content TEXT NOT NULL,
            FOREIGN KEY (hskId) REFERENCES hsks(id),
            FOREIGN KEY (lessonId) REFERENCES lessons(id),
            FOREIGN KEY (textId) REFERENCES texts(id),
            FOREIGN KEY (sentenceId) REFERENCES sentences(id)
            FOREIGN KEY (wordId) REFERENCES words(id)
        );
    `);
};

export const createRule = (rule: RuleType) => {
    db.runSync(
        `INSERT INTO rules (hskId, lessonId, textId, sentenceId, content) VALUES (?, ?, ?, ?, ?)`,
        rule.hskId ?? null,
        rule.lessonId ?? null,
        rule.textId ?? null,
        rule.sentenceId ?? null,
        rule.wordId ?? null,
        rule.content
    );
};

export const getAllRules = () => {
    const rows = db.getAllSync("SELECT * FROM rules");
    return rows;
};

export const getRulesByHSKId = (hskId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM rules 
        WHERE hskId = ? 
           OR id IN (SELECT ruleId FROM rule_hsks WHERE hskId = ?)
           OR lessonId IN (SELECT id FROM lessons WHERE hskId = ?)
    `, hskId, hskId, hskId);
    return rows;
};

export const getRulesByLessonId = (lessonId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM rules 
        WHERE lessonId = ? 
           OR id IN (SELECT ruleId FROM rule_lessons WHERE lessonId = ?)
    `, lessonId, lessonId);
    return rows;
};

export const getRulesByTextId = (textId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM rules 
        WHERE textId = ? 
           OR id IN (SELECT ruleId FROM rule_texts WHERE textId = ?)
    `, textId, textId);
    return rows;
};

export const getRulesBySentenceId = (sentenceId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM rules 
        WHERE sentenceId = ? 
           OR id IN (SELECT ruleId FROM rule_sentences WHERE sentenceId = ?)
    `, sentenceId, sentenceId);
    return rows;
};

export const getRulesByWordId = (wordId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM rules 
        WHERE wordId = ? 
           OR id IN (SELECT ruleId FROM rule_words WHERE wordId = ?)
           OR id IN (SELECT ruleId FROM word_rules WHERE wordId = ?)
    `, wordId, wordId, wordId);
    return rows;
};

export const getRulesByCharacterId = (characterId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM rules 
        WHERE id IN (SELECT ruleId FROM rule_characters WHERE characterId = ?)
           OR sentenceId IN (SELECT sentenceId FROM words WHERE id IN (SELECT wordId FROM word_characters WHERE characterId = ?))
           OR wordId IN (SELECT wordId FROM word_characters WHERE characterId = ?)
    `, characterId, characterId, characterId);
    return rows;
};

export const getLessonById = (id: number): LessonType | null => {
    const row = db.getFirstSync<LessonType>("SELECT * FROM lessons WHERE id = ?", id);
    return row ?? null;
};

export const getHSKById = (id: number): HSKType | null => {
    const row = db.getFirstSync<HSKType>("SELECT * FROM hsks WHERE id = ?", id);
    return row ?? null;
};

export const getCharacterById = (id: number): CharacterType | null => {
    const row = db.getFirstSync<CharacterType>("SELECT * FROM characters WHERE id = ?", id);
    return row ?? null;
};

export const getCharactersByLessonId = (lessonId: number): CharacterType[] => {
    const rows = db.getAllSync<CharacterType>(`
        SELECT DISTINCT * FROM characters
        WHERE lessonId = ?
           OR id IN (SELECT characterId FROM character_lessons WHERE lessonId = ?)
    `, lessonId, lessonId);
    return rows;
};

export const getHSKsByCharacterId = (characterId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM hsks
        WHERE id IN (SELECT hskId FROM characters WHERE id = ? AND hskId IS NOT NULL)
           OR id IN (SELECT hskId FROM character_hsks WHERE characterId = ?)
    `, characterId, characterId);
    return rows;
};

export const getLessonsByCharacterId = (characterId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM lessons
        WHERE id IN (SELECT lessonId FROM characters WHERE id = ? AND lessonId IS NOT NULL)
           OR id IN (SELECT lessonId FROM character_lessons WHERE characterId = ?)
    `, characterId, characterId);
    return rows;
};

// --------- Junction Tables for Many-to-Many Relations ----------

export const createJunctionTables = () => {
    db.execSync(`
        CREATE TABLE IF NOT EXISTS word_hsks (
            wordId INTEGER NOT NULL,
            hskId INTEGER NOT NULL,
            PRIMARY KEY (wordId, hskId),
            FOREIGN KEY (wordId) REFERENCES words(id) ON DELETE CASCADE,
            FOREIGN KEY (hskId) REFERENCES hsks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS word_lessons (
            wordId INTEGER NOT NULL,
            lessonId INTEGER NOT NULL,
            PRIMARY KEY (wordId, lessonId),
            FOREIGN KEY (wordId) REFERENCES words(id) ON DELETE CASCADE,
            FOREIGN KEY (lessonId) REFERENCES lessons(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS word_texts (
            wordId INTEGER NOT NULL,
            textId INTEGER NOT NULL,
            PRIMARY KEY (wordId, textId),
            FOREIGN KEY (wordId) REFERENCES words(id) ON DELETE CASCADE,
            FOREIGN KEY (textId) REFERENCES texts(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS word_sentences (
            wordId INTEGER NOT NULL,
            sentenceId INTEGER NOT NULL,
            PRIMARY KEY (wordId, sentenceId),
            FOREIGN KEY (wordId) REFERENCES words(id) ON DELETE CASCADE,
            FOREIGN KEY (sentenceId) REFERENCES sentences(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS word_characters (
            wordId INTEGER NOT NULL,
            characterId INTEGER NOT NULL,
            PRIMARY KEY (wordId, characterId),
            FOREIGN KEY (wordId) REFERENCES words(id) ON DELETE CASCADE,
            FOREIGN KEY (characterId) REFERENCES characters(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS word_rules (
            wordId INTEGER NOT NULL,
            ruleId INTEGER NOT NULL,
            PRIMARY KEY (wordId, ruleId),
            FOREIGN KEY (wordId) REFERENCES words(id) ON DELETE CASCADE,
            FOREIGN KEY (ruleId) REFERENCES rules(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS rule_hsks (
            ruleId INTEGER NOT NULL,
            hskId INTEGER NOT NULL,
            PRIMARY KEY (ruleId, hskId),
            FOREIGN KEY (ruleId) REFERENCES rules(id) ON DELETE CASCADE,
            FOREIGN KEY (hskId) REFERENCES hsks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS rule_lessons (
            ruleId INTEGER NOT NULL,
            lessonId INTEGER NOT NULL,
            PRIMARY KEY (ruleId, lessonId),
            FOREIGN KEY (ruleId) REFERENCES rules(id) ON DELETE CASCADE,
            FOREIGN KEY (lessonId) REFERENCES lessons(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS rule_texts (
            ruleId INTEGER NOT NULL,
            textId INTEGER NOT NULL,
            PRIMARY KEY (ruleId, textId),
            FOREIGN KEY (ruleId) REFERENCES rules(id) ON DELETE CASCADE,
            FOREIGN KEY (textId) REFERENCES texts(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS rule_sentences (
            ruleId INTEGER NOT NULL,
            sentenceId INTEGER NOT NULL,
            PRIMARY KEY (ruleId, sentenceId),
            FOREIGN KEY (ruleId) REFERENCES rules(id) ON DELETE CASCADE,
            FOREIGN KEY (sentenceId) REFERENCES sentences(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS rule_words (
            ruleId INTEGER NOT NULL,
            wordId INTEGER NOT NULL,
            PRIMARY KEY (ruleId, wordId),
            FOREIGN KEY (ruleId) REFERENCES rules(id) ON DELETE CASCADE,
            FOREIGN KEY (wordId) REFERENCES words(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS rule_characters (
            ruleId INTEGER NOT NULL,
            characterId INTEGER NOT NULL,
            PRIMARY KEY (ruleId, characterId),
            FOREIGN KEY (ruleId) REFERENCES rules(id) ON DELETE CASCADE,
            FOREIGN KEY (characterId) REFERENCES characters(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS character_hsks (
            characterId INTEGER NOT NULL,
            hskId INTEGER NOT NULL,
            PRIMARY KEY (characterId, hskId),
            FOREIGN KEY (characterId) REFERENCES characters(id) ON DELETE CASCADE,
            FOREIGN KEY (hskId) REFERENCES hsks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS character_lessons (
            characterId INTEGER NOT NULL,
            lessonId INTEGER NOT NULL,
            PRIMARY KEY (characterId, lessonId),
            FOREIGN KEY (characterId) REFERENCES characters(id) ON DELETE CASCADE,
            FOREIGN KEY (lessonId) REFERENCES lessons(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS character_texts (
            characterId INTEGER NOT NULL,
            textId INTEGER NOT NULL,
            PRIMARY KEY (characterId, textId),
            FOREIGN KEY (characterId) REFERENCES characters(id) ON DELETE CASCADE,
            FOREIGN KEY (textId) REFERENCES texts(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS character_sentences (
            characterId INTEGER NOT NULL,
            sentenceId INTEGER NOT NULL,
            PRIMARY KEY (characterId, sentenceId),
            FOREIGN KEY (characterId) REFERENCES characters(id) ON DELETE CASCADE,
            FOREIGN KEY (sentenceId) REFERENCES sentences(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS character_words (
            characterId INTEGER NOT NULL,
            wordId INTEGER NOT NULL,
            PRIMARY KEY (characterId, wordId),
            FOREIGN KEY (characterId) REFERENCES characters(id) ON DELETE CASCADE,
            FOREIGN KEY (wordId) REFERENCES words(id) ON DELETE CASCADE
        );
    `);
};

export const linkWordRelations = (
    wordId: number,
    relations: {
        hskIds?: number[];
        lessonIds?: number[];
        textIds?: number[];
        sentenceIds?: number[];
        characterIds?: number[];
        ruleIds?: number[];
    }
) => {
    if (relations.hskIds && relations.hskIds.length > 0) {
        for (const hskId of relations.hskIds) {
            db.runSync(
                `INSERT OR IGNORE INTO word_hsks (wordId, hskId) VALUES (?, ?)`,
                wordId,
                hskId
            );
        }
    }
    if (relations.lessonIds && relations.lessonIds.length > 0) {
        for (const lessonId of relations.lessonIds) {
            db.runSync(
                `INSERT OR IGNORE INTO word_lessons (wordId, lessonId) VALUES (?, ?)`,
                wordId,
                lessonId
            );
        }
    }
    if (relations.textIds && relations.textIds.length > 0) {
        for (const textId of relations.textIds) {
            db.runSync(
                `INSERT OR IGNORE INTO word_texts (wordId, textId) VALUES (?, ?)`,
                wordId,
                textId
            );
        }
    }
    if (relations.sentenceIds && relations.sentenceIds.length > 0) {
        for (const sentenceId of relations.sentenceIds) {
            db.runSync(
                `INSERT OR IGNORE INTO word_sentences (wordId, sentenceId) VALUES (?, ?)`,
                wordId,
                sentenceId
            );
        }
    }
    if (relations.characterIds && relations.characterIds.length > 0) {
        for (const characterId of relations.characterIds) {
            db.runSync(
                `INSERT OR IGNORE INTO word_characters (wordId, characterId) VALUES (?, ?)`,
                wordId,
                characterId
            );
            db.runSync(
                `UPDATE characters SET wordId = COALESCE(wordId, ?) WHERE id = ?`,
                wordId,
                characterId
            );
        }
    }
    if (relations.ruleIds && relations.ruleIds.length > 0) {
        for (const ruleId of relations.ruleIds) {
            db.runSync(
                `INSERT OR IGNORE INTO word_rules (wordId, ruleId) VALUES (?, ?)`,
                wordId,
                ruleId
            );
            db.runSync(
                `UPDATE rules SET wordId = COALESCE(wordId, ?) WHERE id = ?`,
                wordId,
                ruleId
            );
        }
    }
};

export const linkRuleRelations = (
    ruleId: number,
    relations: {
        hskIds?: number[];
        lessonIds?: number[];
        textIds?: number[];
        sentenceIds?: number[];
        wordIds?: number[];
        characterIds?: number[];
    }
) => {
    if (relations.hskIds && relations.hskIds.length > 0) {
        for (const hskId of relations.hskIds) {
            db.runSync(
                `INSERT OR IGNORE INTO rule_hsks (ruleId, hskId) VALUES (?, ?)`,
                ruleId,
                hskId
            );
        }
    }
    if (relations.lessonIds && relations.lessonIds.length > 0) {
        for (const lessonId of relations.lessonIds) {
            db.runSync(
                `INSERT OR IGNORE INTO rule_lessons (ruleId, lessonId) VALUES (?, ?)`,
                ruleId,
                lessonId
            );
        }
    }
    if (relations.textIds && relations.textIds.length > 0) {
        for (const textId of relations.textIds) {
            db.runSync(
                `INSERT OR IGNORE INTO rule_texts (ruleId, textId) VALUES (?, ?)`,
                ruleId,
                textId
            );
        }
    }
    if (relations.sentenceIds && relations.sentenceIds.length > 0) {
        for (const sentenceId of relations.sentenceIds) {
            db.runSync(
                `INSERT OR IGNORE INTO rule_sentences (ruleId, sentenceId) VALUES (?, ?)`,
                ruleId,
                sentenceId
            );
        }
    }
    if (relations.wordIds && relations.wordIds.length > 0) {
        for (const wordId of relations.wordIds) {
            db.runSync(
                `INSERT OR IGNORE INTO rule_words (ruleId, wordId) VALUES (?, ?)`,
                ruleId,
                wordId
            );
        }
    }
    if (relations.characterIds && relations.characterIds.length > 0) {
        for (const characterId of relations.characterIds) {
            db.runSync(
                `INSERT OR IGNORE INTO rule_characters (ruleId, characterId) VALUES (?, ?)`,
                ruleId,
                characterId
            );
        }
    }
};

export const linkCharacterRelations = (
    characterId: number,
    relations: {
        hskIds?: number[];
        lessonIds?: number[];
        textIds?: number[];
        sentenceIds?: number[];
        wordIds?: number[];
        ruleIds?: number[];
    }
) => {
    if (relations.hskIds && relations.hskIds.length > 0) {
        for (const hskId of relations.hskIds) {
            db.runSync(
                `INSERT OR IGNORE INTO character_hsks (characterId, hskId) VALUES (?, ?)`,
                characterId,
                hskId
            );
        }
    }
    if (relations.lessonIds && relations.lessonIds.length > 0) {
        for (const lessonId of relations.lessonIds) {
            db.runSync(
                `INSERT OR IGNORE INTO character_lessons (characterId, lessonId) VALUES (?, ?)`,
                characterId,
                lessonId
            );
        }
    }
    if (relations.textIds && relations.textIds.length > 0) {
        for (const textId of relations.textIds) {
            db.runSync(
                `INSERT OR IGNORE INTO character_texts (characterId, textId) VALUES (?, ?)`,
                characterId,
                textId
            );
        }
    }
    if (relations.sentenceIds && relations.sentenceIds.length > 0) {
        for (const sentenceId of relations.sentenceIds) {
            db.runSync(
                `INSERT OR IGNORE INTO character_sentences (characterId, sentenceId) VALUES (?, ?)`,
                characterId,
                sentenceId
            );
        }
    }
    if (relations.wordIds && relations.wordIds.length > 0) {
        for (const wordId of relations.wordIds) {
            db.runSync(
                `INSERT OR IGNORE INTO character_words (characterId, wordId) VALUES (?, ?)`,
                characterId,
                wordId
            );
        }
    }
    if (relations.ruleIds && relations.ruleIds.length > 0) {
        for (const ruleId of relations.ruleIds) {
            db.runSync(
                `INSERT OR IGNORE INTO rule_characters (ruleId, characterId) VALUES (?, ?)`,
                ruleId,
                characterId
            );
        }
    }
};