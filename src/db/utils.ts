import { CharacterType, HSKType, LessonType, RuleType, SentenceType, TextType, WordType } from "@/types";
import * as SQLite from "expo-sqlite";
import defaultData from "./initData.json";

export const db = SQLite.openDatabaseSync("app.db");

export function initDatabase() {
    createHSKTable();
    createLessonTable();
    createTextTable();
    createSentencesTable();
    createWordsTable();
    createCharactersTable();
    createRulesTable();
    createJunctionTables();
    seedDefaultData();
    repairDatabaseRelations();
}

export function repairDatabaseRelations() {
    try {
        if (!defaultData) return;

        // Check if repair is needed (e.g. sentences already have textId populated)
        const check = db.getFirstSync<{ count: number }>(
            "SELECT COUNT(*) as count FROM sentences WHERE textId IS NOT NULL"
        );
        if (check && check.count > 0) {
            return;
        }

        db.withTransactionSync(() => {
            // Sync sentences relations
            if (defaultData.sentences && Array.isArray(defaultData.sentences)) {
                for (const s of defaultData.sentences as any[]) {
                    db.runSync(
                        `UPDATE sentences SET textId = COALESCE(textId, ?), hskId = COALESCE(hskId, ?) WHERE id = ?`,
                        s.textId ?? null,
                        s.hskId ?? null,
                        s.id
                    );
                }
            }

            // Sync texts relations
            if (defaultData.texts && Array.isArray(defaultData.texts)) {
                for (const t of defaultData.texts as any[]) {
                    db.runSync(
                        `UPDATE texts SET hskId = COALESCE(hskId, ?) WHERE id = ?`,
                        t.hskId ?? null,
                        t.id
                    );
                }
            }

            // Sync words relations
            if (defaultData.words && Array.isArray(defaultData.words)) {
                for (const w of defaultData.words as any[]) {
                    db.runSync(
                        `UPDATE words SET hskId = COALESCE(hskId, ?), lessonId = COALESCE(lessonId, ?), textId = COALESCE(textId, ?), sentenceId = COALESCE(sentenceId, ?) WHERE id = ?`,
                        w.hskId ?? null,
                        w.lessonId ?? null,
                        w.textId ?? null,
                        w.sentenceId ?? null,
                        w.id
                    );
                }
            }

            // Sync characters relations
            if (defaultData.characters && Array.isArray(defaultData.characters)) {
                for (const c of defaultData.characters as any[]) {
                    db.runSync(
                        `UPDATE characters SET hskId = COALESCE(hskId, ?), lessonId = COALESCE(lessonId, ?), textId = COALESCE(textId, ?), sentenceId = COALESCE(sentenceId, ?), wordId = COALESCE(wordId, ?) WHERE id = ?`,
                        c.hskId ?? null,
                        c.lessonId ?? null,
                        c.textId ?? null,
                        c.sentenceId ?? null,
                        c.wordId ?? null,
                        c.id
                    );
                }
            }
        });
    } catch (e) {
        console.warn('repairDatabaseRelations warning:', e);
    }
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

    if (!hskCount || !defaultData) return;

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

    for (const text of defaultData.texts as any[]) {
        db.runSync(
            `INSERT INTO texts
            (id, hskId, lessonId, title, content, pinyin, meaning)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            text.id,
            text.hskId ?? null,
            text.lessonId ?? null,
            text.title,
            text.content,
            text.pinyin,
            text.meaning
        );
    }

    for (const sentence of defaultData.sentences as any[]) {
        db.runSync(
            `INSERT INTO sentences
            (id, hskId, lessonId, textId, content, pinyin, meaning)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            sentence.id,
            sentence.hskId ?? null,
            sentence.lessonId ?? null,
            sentence.textId ?? null,
            sentence.content,
            sentence.pinyin,
            sentence.meaning
        );
    }

    for (const word of defaultData.words as any[]) {
        db.runSync(
            `INSERT INTO words
            (id, hskId, lessonId, textId, sentenceId, content, pinyin, meaning)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            word.id,
            word.hskId ?? null,
            word.lessonId ?? null,
            word.textId ?? null,
            word.sentenceId ?? null,
            word.content,
            word.pinyin,
            word.meaning
        );
    }

    for (const character of defaultData.characters as any[]) {
        db.runSync(
            `INSERT INTO characters
            (id, hskId, lessonId, textId, sentenceId, wordId, content, pinyin, tone, meaning)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            character.id,
            character.hskId ?? null,
            character.lessonId ?? null,
            character.textId ?? null,
            character.sentenceId ?? null,
            character.wordId ?? null,
            character.content,
            character.pinyin,
            character.tone,
            character.meaning
        );
    }

    for (const rule of defaultData.rules as any[]) {
        db.runSync(
            `INSERT INTO rules
            (id, hskId, lessonId, textId, sentenceId, wordId, content)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            rule.id,
            rule.hskId ?? null,
            rule.lessonId ?? null,
            rule.textId ?? null,
            rule.sentenceId ?? null,
            rule.wordId ?? null,
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
    return db.runSync(
        `INSERT INTO hsks (name) VALUES (?)`,
        name
    );
};

export const updateHSK = (id: number, name: string) => {
    return db.runSync(`UPDATE hsks SET name = ? WHERE id = ?`, name, id);
};

export const deleteHSK = (id: number) => {
    return db.runSync(`DELETE FROM hsks WHERE id = ?`, id);
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

export const getLessonsPaged = (
    search: string,
    filter: 'all' | 'unassigned',
    limit: number,
    offset: number
): LessonType[] => {
    const q = `%${search.toLowerCase()}%`;
    const unassignedClause = filter === 'unassigned' ? 'AND hskId IS NULL' : '';
    const rows = db.getAllSync<LessonType>(
        `SELECT * FROM lessons WHERE (lower(title) LIKE ? OR ('lesson ' || num) LIKE ?) ${unassignedClause} ORDER BY num LIMIT ? OFFSET ?`,
        q, q, limit, offset
    );
    return rows;
};

export const getLessonsCount = (search: string, filter: 'all' | 'unassigned'): number => {
    try {
        const q = `%${search.toLowerCase()}%`;
        const unassignedClause = filter === 'unassigned' ? 'AND hskId IS NULL' : '';
        const row = db.getFirstSync<{ count: number }>(
            `SELECT COUNT(*) as count FROM lessons WHERE (lower(title) LIKE ? OR ('lesson ' || num) LIKE ?) ${unassignedClause}`,
            q, q
        );
        return row?.count || 0;
    } catch { return 0; }
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

export const getTextsPaged = (
    search: string,
    filter: 'all' | 'unassigned',
    limit: number,
    offset: number
): TextType[] => {
    const q = `%${search.toLowerCase()}%`;
    const unassignedClause = filter === 'unassigned' ? 'AND hskId IS NULL AND lessonId IS NULL' : '';
    const rows = db.getAllSync<TextType>(
        `SELECT * FROM texts WHERE (lower(title) LIKE ? OR lower(content) LIKE ? OR lower(meaning) LIKE ?) ${unassignedClause} ORDER BY id LIMIT ? OFFSET ?`,
        q, q, q, limit, offset
    );
    return rows;
};

export const getTextsCount = (search: string, filter: 'all' | 'unassigned'): number => {
    try {
        const q = `%${search.toLowerCase()}%`;
        const unassignedClause = filter === 'unassigned' ? 'AND hskId IS NULL AND lessonId IS NULL' : '';
        const row = db.getFirstSync<{ count: number }>(
            `SELECT COUNT(*) as count FROM texts WHERE (lower(title) LIKE ? OR lower(content) LIKE ? OR lower(meaning) LIKE ?) ${unassignedClause}`,
            q, q, q
        );
        return row?.count || 0;
    } catch { return 0; }
};

export const getTextById = (id: number): TextType | null => {
    try {
        if (id === undefined || id === null || isNaN(Number(id))) return null;
        const row = db.getFirstSync<TextType>("SELECT * FROM texts WHERE id = ?", Number(id));
        return row ?? null;
    } catch (e) {
        console.warn("getTextById error:", e);
        return null;
    }
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
    try {
        if (!sentenceId || isNaN(Number(sentenceId))) return [];
        const numId = Number(sentenceId);
        const sentence = getSentenceById(numId);
        const cleanContent = (sentence?.content || '').replace(/[。！？!?.,， \n\r\t]+$/g, '').trim();

        const rows = db.getAllSync<TextType>(`
            SELECT DISTINCT * FROM texts 
            WHERE id IN (SELECT textId FROM sentences WHERE id = ? AND textId IS NOT NULL)
               OR id IN (SELECT textId FROM words WHERE sentenceId = ? AND textId IS NOT NULL)
               OR (length(?) > 0 AND content LIKE '%' || ? || '%')
        `, numId, numId, cleanContent, cleanContent);
        return rows || [];
    } catch (e) {
        console.warn('getTextsBySentenceId error:', e);
        return [];
    }
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
            FOREIGN KEY (hskId) REFERENCES hsks(id),
            FOREIGN KEY (lessonId) REFERENCES lessons(id),
            FOREIGN KEY (textId) REFERENCES texts(id)
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

export const updateSentence = (id: number, sentence: Partial<SentenceType>) => {
    return db.runSync(
        `UPDATE sentences 
        SET content = COALESCE(?, content),
            pinyin = COALESCE(?, pinyin),
            meaning = COALESCE(?, meaning),
            hskId = ?,
            lessonId = ?,
            textId = ?
        WHERE id = ?`,
        sentence.content ?? null,
        sentence.pinyin ?? null,
        sentence.meaning ?? null,
        sentence.hskId ?? null,
        sentence.lessonId ?? null,
        sentence.textId ?? null,
        id
    );
};

export const getAllSentences = () => {
    const rows = db.getAllSync("SELECT * FROM sentences");
    return rows;
};

export const getSentencesPaged = (
    search: string,
    filter: 'all' | 'unassigned',
    limit: number,
    offset: number
): SentenceType[] => {
    const q = `%${search.toLowerCase()}%`;
    const unassignedClause = filter === 'unassigned' ? 'AND hskId IS NULL AND lessonId IS NULL AND textId IS NULL' : '';
    const rows = db.getAllSync<SentenceType>(
        `SELECT * FROM sentences WHERE (lower(content) LIKE ? OR lower(pinyin) LIKE ? OR lower(meaning) LIKE ?) ${unassignedClause} ORDER BY id LIMIT ? OFFSET ?`,
        q, q, q, limit, offset
    );
    return rows;
};

export const getSentencesCount = (search: string, filter: 'all' | 'unassigned'): number => {
    try {
        const q = `%${search.toLowerCase()}%`;
        const unassignedClause = filter === 'unassigned' ? 'AND hskId IS NULL AND lessonId IS NULL AND textId IS NULL' : '';
        const row = db.getFirstSync<{ count: number }>(
            `SELECT COUNT(*) as count FROM sentences WHERE (lower(content) LIKE ? OR lower(pinyin) LIKE ? OR lower(meaning) LIKE ?) ${unassignedClause}`,
            q, q, q
        );
        return row?.count || 0;
    } catch { return 0; }
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
    try {
        if (!textId || isNaN(Number(textId))) return [];
        const numId = Number(textId);
        const text = getTextById(numId);
        const cleanContent = (text?.content || '').trim();

        const rows = db.getAllSync<SentenceType>(`
            SELECT DISTINCT * FROM sentences 
            WHERE textId = ?
               OR (length(?) > 0 AND instr(?, replace(replace(replace(content, '。', ''), '！', ''), '？', '')) > 0)
        `, numId, cleanContent, cleanContent);
        return rows || [];
    } catch (e) {
        console.warn('getSentencesByTextId error:', e);
        return [];
    }
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

export const getSentenceById = (id: number): SentenceType | null => {
    try {
        if (id === undefined || id === null || isNaN(Number(id))) return null;
        const row = db.getFirstSync<SentenceType>("SELECT * FROM sentences WHERE id = ?", Number(id));
        return row ?? null;
    } catch (e) {
        console.warn("getSentenceById error:", e);
        return null;
    }
};

export const getHSKsBySentenceId = (sentenceId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM hsks 
        WHERE id IN (SELECT hskId FROM sentences WHERE id = ?)
           OR id IN (SELECT hskId FROM lessons WHERE id IN (SELECT lessonId FROM sentences WHERE id = ?))
    `, sentenceId, sentenceId);
    return rows;
};

export const getLessonsBySentenceId = (sentenceId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM lessons 
        WHERE id IN (SELECT lessonId FROM sentences WHERE id = ?)
    `, sentenceId);
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
            FOREIGN KEY (hskId) REFERENCES hsks(id),
            FOREIGN KEY (lessonId) REFERENCES lessons(id),
            FOREIGN KEY (textId) REFERENCES texts(id),
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

export const getWordsPaged = (
    search: string,
    filter: 'all' | 'unassigned',
    limit: number,
    offset: number
): WordType[] => {
    const q = `%${search.toLowerCase()}%`;
    const unassignedClause = filter === 'unassigned' ? 'AND hskId IS NULL AND lessonId IS NULL' : '';
    const rows = db.getAllSync<WordType>(
        `SELECT * FROM words WHERE (lower(content) LIKE ? OR lower(pinyin) LIKE ? OR lower(meaning) LIKE ?) ${unassignedClause} ORDER BY id LIMIT ? OFFSET ?`,
        q, q, q, limit, offset
    );
    return rows;
};

export const getWordsCount = (search: string, filter: 'all' | 'unassigned'): number => {
    try {
        const q = `%${search.toLowerCase()}%`;
        const unassignedClause = filter === 'unassigned' ? 'AND hskId IS NULL AND lessonId IS NULL' : '';
        const row = db.getFirstSync<{ count: number }>(
            `SELECT COUNT(*) as count FROM words WHERE (lower(content) LIKE ? OR lower(pinyin) LIKE ? OR lower(meaning) LIKE ?) ${unassignedClause}`,
            q, q, q
        );
        return row?.count || 0;
    } catch { return 0; }
};

export const getWordsBySentenceId = (sentenceId: number) => {
    try {
        if (!sentenceId || isNaN(Number(sentenceId))) return [];
        const numId = Number(sentenceId);
        const sentence = getSentenceById(numId);
        const cleanContent = (sentence?.content || '').replace(/[。！？!?.,， \n\r\t]+$/g, '').trim();

        const rows = db.getAllSync<WordType>(`
            SELECT DISTINCT * FROM words 
            WHERE sentenceId = ? 
               OR id IN (SELECT wordId FROM word_sentences WHERE sentenceId = ?)
               OR (length(?) > 0 AND instr(?, content) > 0)
        `, numId, numId, cleanContent, cleanContent);
        return rows || [];
    } catch (e) {
        console.warn('getWordsBySentenceId error:', e);
        return [];
    }
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
    try {
        if (id === undefined || id === null || isNaN(Number(id))) return null;
        const row = db.getFirstSync<WordType>("SELECT * FROM words WHERE id = ?", Number(id));
        return row ?? null;
    } catch (e) {
        console.warn("getWordById error:", e);
        return null;
    }
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
            FOREIGN KEY (hskId) REFERENCES hsks(id),
            FOREIGN KEY (lessonId) REFERENCES lessons(id),
            FOREIGN KEY (textId) REFERENCES texts(id),
            FOREIGN KEY (sentenceId) REFERENCES sentences(id),
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

export const getAllCharacters = (limit?: number, offset: number = 0) => {
    if (limit !== undefined && limit > 0) {
        const rows = db.getAllSync("SELECT * FROM characters LIMIT ? OFFSET ?", limit, offset);
        return rows;
    }
    const rows = db.getAllSync("SELECT * FROM characters");
    return rows;
};

export const getAllCharactersCount = (): number => {
    try {
        const row = db.getFirstSync<{ count: number }>("SELECT COUNT(*) as count FROM characters");
        return row?.count || 0;
    } catch {
        return 0;
    }
};

export const getCharactersPaged = (
    search: string,
    filter: 'all' | 'unassigned',
    limit: number,
    offset: number
): CharacterType[] => {
    const q = `%${search.toLowerCase()}%`;
    const unassignedClause = filter === 'unassigned' ? 'AND hskId IS NULL AND lessonId IS NULL' : '';
    const rows = db.getAllSync<CharacterType>(
        `SELECT * FROM characters WHERE (lower(content) LIKE ? OR lower(pinyin) LIKE ? OR lower(meaning) LIKE ?) ${unassignedClause} ORDER BY id LIMIT ? OFFSET ?`,
        q, q, q, limit, offset
    );
    return rows;
};

export const getCharactersCountPaged = (search: string, filter: 'all' | 'unassigned'): number => {
    try {
        const q = `%${search.toLowerCase()}%`;
        const unassignedClause = filter === 'unassigned' ? 'AND hskId IS NULL AND lessonId IS NULL' : '';
        const row = db.getFirstSync<{ count: number }>(
            `SELECT COUNT(*) as count FROM characters WHERE (lower(content) LIKE ? OR lower(pinyin) LIKE ? OR lower(meaning) LIKE ?) ${unassignedClause}`,
            q, q, q
        );
        return row?.count || 0;
    } catch { return 0; }
};

export const getCharactersByTextId = (textId: number) => {
    const rows = db.getAllSync("SELECT * FROM characters WHERE textId = ?", textId);
    return rows;
};

export const getCharactersByHSKId = (hskId: number, limit?: number, offset: number = 0) => {
    if (limit !== undefined && limit > 0) {
        const rows = db.getAllSync(`
            SELECT DISTINCT * FROM characters
            WHERE hskId = ?
               OR id IN (SELECT characterId FROM character_hsks WHERE hskId = ?)
            LIMIT ? OFFSET ?
        `, hskId, hskId, limit, offset);
        return rows;
    }
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM characters
        WHERE hskId = ?
           OR id IN (SELECT characterId FROM character_hsks WHERE hskId = ?)
    `, hskId, hskId);
    return rows;
};

export const getCharactersCountByHSKId = (hskId: number): number => {
    try {
        const row = db.getFirstSync<{ count: number }>(`
            SELECT COUNT(DISTINCT id) as count FROM characters
            WHERE hskId = ?
               OR id IN (SELECT characterId FROM character_hsks WHERE hskId = ?)
        `, hskId, hskId);
        return row?.count || 0;
    } catch {
        return 0;
    }
};

export const getCharactersBySentenceId = (sentenceId: number) => {
    try {
        if (!sentenceId || isNaN(Number(sentenceId))) return [];
        const numId = Number(sentenceId);
        const sentence = getSentenceById(numId);
        const cleanContent = (sentence?.content || '').replace(/[。！？!?.,， \n\r\t]+$/g, '').trim();

        const rows = db.getAllSync<CharacterType>(`
            SELECT DISTINCT * FROM characters 
            WHERE sentenceId = ?
               OR id IN (SELECT characterId FROM word_characters WHERE wordId IN (
                   SELECT id FROM words WHERE sentenceId = ? OR id IN (SELECT wordId FROM word_sentences WHERE sentenceId = ?)
               ))
               OR (length(?) > 0 AND instr(?, content) > 0)
        `, numId, numId, numId, cleanContent, cleanContent);
        return rows || [];
    } catch (e) {
        console.warn('getCharactersBySentenceId error:', e);
        return [];
    }
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

export const getRulesPaged = (
    search: string,
    filter: 'all' | 'unassigned',
    limit: number,
    offset: number
): RuleType[] => {
    const q = `%${search.toLowerCase()}%`;
    const unassignedClause = filter === 'unassigned' ? 'AND hskId IS NULL AND lessonId IS NULL' : '';
    const rows = db.getAllSync<RuleType>(
        `SELECT * FROM rules WHERE lower(content) LIKE ? ${unassignedClause} ORDER BY id LIMIT ? OFFSET ?`,
        q, limit, offset
    );
    return rows;
};

export const getRulesCount = (search: string, filter: 'all' | 'unassigned'): number => {
    try {
        const q = `%${search.toLowerCase()}%`;
        const unassignedClause = filter === 'unassigned' ? 'AND hskId IS NULL AND lessonId IS NULL' : '';
        const row = db.getFirstSync<{ count: number }>(
            `SELECT COUNT(*) as count FROM rules WHERE lower(content) LIKE ? ${unassignedClause}`,
            q
        );
        return row?.count || 0;
    } catch { return 0; }
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

export const getRuleById = (id: number): RuleType | null => {
    try {
        if (id === undefined || id === null || isNaN(Number(id))) return null;
        const row = db.getFirstSync<RuleType>("SELECT * FROM rules WHERE id = ?", Number(id));
        return row ?? null;
    } catch (e) {
        console.warn("getRuleById error:", e);
        return null;
    }
};

export const getHSKsByRuleId = (ruleId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM hsks 
        WHERE id IN (SELECT hskId FROM rules WHERE id = ? AND hskId IS NOT NULL)
           OR id IN (SELECT hskId FROM rule_hsks WHERE ruleId = ?)
    `, ruleId, ruleId);
    return rows;
};

export const getLessonsByRuleId = (ruleId: number) => {
    const rows = db.getAllSync(`
        SELECT DISTINCT * FROM lessons 
        WHERE id IN (SELECT lessonId FROM rules WHERE id = ? AND lessonId IS NOT NULL)
           OR id IN (SELECT lessonId FROM rule_lessons WHERE ruleId = ?)
    `, ruleId, ruleId);
    return rows;
};

export const getLessonById = (id: number): LessonType | null => {
    try {
        if (id === undefined || id === null || isNaN(Number(id))) return null;
        const row = db.getFirstSync<LessonType>("SELECT * FROM lessons WHERE id = ?", Number(id));
        return row ?? null;
    } catch (e) {
        console.warn("getLessonById error:", e);
        return null;
    }
};

export const getHSKById = (id: number): HSKType | null => {
    try {
        if (id === undefined || id === null || isNaN(Number(id))) return null;
        const row = db.getFirstSync<HSKType>("SELECT * FROM hsks WHERE id = ?", Number(id));
        return row ?? null;
    } catch (e) {
        console.warn("getHSKById error:", e);
        return null;
    }
};

export const getCharacterById = (id: number): CharacterType | null => {
    try {
        if (id === undefined || id === null || isNaN(Number(id))) return null;
        const row = db.getFirstSync<CharacterType>("SELECT * FROM characters WHERE id = ?", Number(id));
        return row ?? null;
    } catch (e) {
        console.warn("getCharacterById error:", e);
        return null;
    }
};

export const getCharactersByLessonId = (lessonId: number, limit?: number, offset: number = 0): CharacterType[] => {
    if (limit !== undefined && limit > 0) {
        const rows = db.getAllSync<CharacterType>(`
            SELECT DISTINCT * FROM characters
            WHERE lessonId = ?
               OR id IN (SELECT characterId FROM character_lessons WHERE lessonId = ?)
            LIMIT ? OFFSET ?
        `, lessonId, lessonId, limit, offset);
        return rows;
    }
    const rows = db.getAllSync<CharacterType>(`
        SELECT DISTINCT * FROM characters
        WHERE lessonId = ?
           OR id IN (SELECT characterId FROM character_lessons WHERE lessonId = ?)
    `, lessonId, lessonId);
    return rows;
};

export const getCharactersCountByLessonId = (lessonId: number): number => {
    try {
        const row = db.getFirstSync<{ count: number }>(`
            SELECT COUNT(DISTINCT id) as count FROM characters
            WHERE lessonId = ?
               OR id IN (SELECT characterId FROM character_lessons WHERE lessonId = ?)
        `, lessonId, lessonId);
        return row?.count || 0;
    } catch {
        return 0;
    }
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

        CREATE TABLE IF NOT EXISTS text_sentences (
            textId INTEGER NOT NULL,
            sentenceId INTEGER NOT NULL,
            PRIMARY KEY (textId, sentenceId),
            FOREIGN KEY (textId) REFERENCES texts(id) ON DELETE CASCADE,
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

export const updateRule = (id: number, content: string) => {
    return db.runSync(`UPDATE rules SET content = ? WHERE id = ?`, content, id);
};

export const updateRuleRelations = (
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
    if (relations.hskIds) {
        db.runSync(`DELETE FROM rule_hsks WHERE ruleId = ?`, ruleId);
        for (const hskId of relations.hskIds) {
            db.runSync(`INSERT OR IGNORE INTO rule_hsks (ruleId, hskId) VALUES (?, ?)`, ruleId, hskId);
        }
    }
    if (relations.lessonIds) {
        db.runSync(`DELETE FROM rule_lessons WHERE ruleId = ?`, ruleId);
        for (const lessonId of relations.lessonIds) {
            db.runSync(`INSERT OR IGNORE INTO rule_lessons (ruleId, lessonId) VALUES (?, ?)`, ruleId, lessonId);
        }
    }
    if (relations.textIds) {
        db.runSync(`DELETE FROM rule_texts WHERE ruleId = ?`, ruleId);
        for (const textId of relations.textIds) {
            db.runSync(`INSERT OR IGNORE INTO rule_texts (ruleId, textId) VALUES (?, ?)`, ruleId, textId);
        }
    }
    if (relations.sentenceIds) {
        db.runSync(`DELETE FROM rule_sentences WHERE ruleId = ?`, ruleId);
        for (const sentenceId of relations.sentenceIds) {
            db.runSync(`INSERT OR IGNORE INTO rule_sentences (ruleId, sentenceId) VALUES (?, ?)`, ruleId, sentenceId);
        }
    }
    if (relations.wordIds) {
        db.runSync(`DELETE FROM rule_words WHERE ruleId = ?`, ruleId);
        for (const wordId of relations.wordIds) {
            db.runSync(`INSERT OR IGNORE INTO rule_words (ruleId, wordId) VALUES (?, ?)`, ruleId, wordId);
        }
    }
    if (relations.characterIds) {
        db.runSync(`DELETE FROM rule_characters WHERE ruleId = ?`, ruleId);
        for (const characterId of relations.characterIds) {
            db.runSync(`INSERT OR IGNORE INTO rule_characters (ruleId, characterId) VALUES (?, ?)`, ruleId, characterId);
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

export const linkHSKRelations = (
    hskId: number,
    relations: {
        lessonIds?: number[];
        textIds?: number[];
        sentenceIds?: number[];
        wordIds?: number[];
        characterIds?: number[];
        ruleIds?: number[];
    }
) => {
    if (relations.lessonIds && relations.lessonIds.length > 0) {
        for (const lessonId of relations.lessonIds) {
            db.runSync(`UPDATE lessons SET hskId = ? WHERE id = ?`, hskId, lessonId);
        }
    }
    if (relations.textIds && relations.textIds.length > 0) {
        for (const textId of relations.textIds) {
            db.runSync(`UPDATE texts SET hskId = ? WHERE id = ?`, hskId, textId);
        }
    }
    if (relations.sentenceIds && relations.sentenceIds.length > 0) {
        for (const sentenceId of relations.sentenceIds) {
            db.runSync(`UPDATE sentences SET hskId = ? WHERE id = ?`, hskId, sentenceId);
        }
    }
    if (relations.wordIds && relations.wordIds.length > 0) {
        for (const wordId of relations.wordIds) {
            db.runSync(`INSERT OR IGNORE INTO word_hsks (wordId, hskId) VALUES (?, ?)`, wordId, hskId);
            db.runSync(`UPDATE words SET hskId = COALESCE(hskId, ?) WHERE id = ?`, hskId, wordId);
        }
    }
    if (relations.characterIds && relations.characterIds.length > 0) {
        for (const characterId of relations.characterIds) {
            db.runSync(`INSERT OR IGNORE INTO character_hsks (characterId, hskId) VALUES (?, ?)`, characterId, hskId);
            db.runSync(`UPDATE characters SET hskId = COALESCE(hskId, ?) WHERE id = ?`, hskId, characterId);
        }
    }
    if (relations.ruleIds && relations.ruleIds.length > 0) {
        for (const ruleId of relations.ruleIds) {
            db.runSync(`INSERT OR IGNORE INTO rule_hsks (ruleId, hskId) VALUES (?, ?)`, ruleId, hskId);
            db.runSync(`UPDATE rules SET hskId = COALESCE(hskId, ?) WHERE id = ?`, ruleId, ruleId);
        }
    }
};

export const updateHSKRelations = (
    hskId: number,
    relations: {
        lessonIds?: number[];
        textIds?: number[];
        sentenceIds?: number[];
        wordIds?: number[];
        characterIds?: number[];
        ruleIds?: number[];
    }
) => {
    if (relations.lessonIds) {
        for (const lessonId of relations.lessonIds) {
            db.runSync(`UPDATE lessons SET hskId = ? WHERE id = ?`, hskId, lessonId);
        }
    }
    if (relations.textIds) {
        for (const textId of relations.textIds) {
            db.runSync(`UPDATE texts SET hskId = ? WHERE id = ?`, hskId, textId);
        }
    }
    if (relations.sentenceIds) {
        for (const sentenceId of relations.sentenceIds) {
            db.runSync(`UPDATE sentences SET hskId = ? WHERE id = ?`, hskId, sentenceId);
        }
    }
    if (relations.wordIds) {
        db.runSync(`DELETE FROM word_hsks WHERE hskId = ?`, hskId);
        for (const wordId of relations.wordIds) {
            db.runSync(`INSERT OR IGNORE INTO word_hsks (wordId, hskId) VALUES (?, ?)`, wordId, hskId);
        }
    }
    if (relations.characterIds) {
        db.runSync(`DELETE FROM character_hsks WHERE hskId = ?`, hskId);
        for (const characterId of relations.characterIds) {
            db.runSync(`INSERT OR IGNORE INTO character_hsks (characterId, hskId) VALUES (?, ?)`, characterId, hskId);
        }
    }
    if (relations.ruleIds) {
        db.runSync(`DELETE FROM rule_hsks WHERE hskId = ?`, hskId);
        for (const ruleId of relations.ruleIds) {
            db.runSync(`INSERT OR IGNORE INTO rule_hsks (ruleId, hskId) VALUES (?, ?)`, ruleId, hskId);
        }
    }
};

// --------- Delete item helpers ------------

export const deleteWord = (id: number) => {
    return db.runSync(`DELETE FROM words WHERE id = ?`, id);
};

export const deleteWords = (ids: number[]) => {
    if (!ids || ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    return db.runSync(`DELETE FROM words WHERE id IN (${placeholders})`, ...ids);
};

export const deleteSentence = (id: number) => {
    return db.runSync(`DELETE FROM sentences WHERE id = ?`, id);
};

export const deleteSentences = (ids: number[]) => {
    if (!ids || ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    return db.runSync(`DELETE FROM sentences WHERE id IN (${placeholders})`, ...ids);
};

export const deleteCharacter = (id: number) => {
    return db.runSync(`DELETE FROM characters WHERE id = ?`, id);
};

export const deleteCharacters = (ids: number[]) => {
    if (!ids || ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    return db.runSync(`DELETE FROM characters WHERE id IN (${placeholders})`, ...ids);
};

export const deleteRule = (id: number) => {
    return db.runSync(`DELETE FROM rules WHERE id = ?`, id);
};

export const deleteRules = (ids: number[]) => {
    if (!ids || ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    return db.runSync(`DELETE FROM rules WHERE id IN (${placeholders})`, ...ids);
};

export const deleteText = (id: number) => {
    return db.runSync(`DELETE FROM texts WHERE id = ?`, id);
};

export const deleteTexts = (ids: number[]) => {
    if (!ids || ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    return db.runSync(`DELETE FROM texts WHERE id IN (${placeholders})`, ...ids);
};

export const deleteLesson = (id: number) => {
    return db.runSync(`DELETE FROM lessons WHERE id = ?`, id);
};

export const deleteLessons = (ids: number[]) => {
    if (!ids || ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    return db.runSync(`DELETE FROM lessons WHERE id IN (${placeholders})`, ...ids);
};

export const deleteHSKs = (ids: number[]) => {
    if (!ids || ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    return db.runSync(`DELETE FROM hsks WHERE id IN (${placeholders})`, ...ids);
};