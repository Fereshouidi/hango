import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Lucide from '@react-native-vector-icons/lucide';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';

type CategoryTab = 'all' | 'start' | 'modules' | 'methods' | 'tips';

interface FeatureGuide {
  id: string;
  title: string;
  chineseTitle: string;
  icon: string;
  color: string;
  badge: string;
  route?: string;
  summary: string;
  instructions: string[];
}

const FEATURE_GUIDES: FeatureGuide[] = [
  {
    id: 'hsks',
    title: 'HSKs (Proficiency Levels)',
    chineseTitle: '汉语水平考试 (HSK 1-6)',
    icon: 'book-marked',
    color: '#ef4444',
    badge: 'Curriculum',
    route: '/pages/hsks/[id]',
    summary: 'Standardized Chinese proficiency system dividing learning into 6 structured tiers.',
    instructions: [
      'Select your target proficiency level (from beginner HSK 1 to advanced HSK 6).',
      'View all lessons, grammar rules, and vocabulary assigned to each HSK tier.',
      'Track learning progress systematically level-by-level.',
    ],
  },
  {
    id: 'lessons',
    title: 'Lessons (Structured Units)',
    chineseTitle: '课程单元',
    icon: 'book-open',
    color: '#f59e0b',
    badge: 'Curriculum',
    route: '/pages/lessons/[id]',
    summary: 'Cohesive lesson units connecting reading texts, vocabulary, sentences, and grammar.',
    instructions: [
      'Each lesson links dialogue passages with the new vocabulary introduced.',
      'Tap any lesson to access associated texts, sentences, rules, and audio.',
      'Use the top filter to narrow lessons down by HSK level.',
    ],
  },
  {
    id: 'texts',
    title: 'Texts & Dialogues',
    chineseTitle: '课文朗读与阅读',
    icon: 'file-text',
    color: '#3b82f6',
    badge: 'Reading & Audio',
    route: '/pages/texts',
    summary: 'Real-world dialogues and narrative passages with pinyin and native speech playback.',
    instructions: [
      'Read authentic Chinese passages with tone-marked Pinyin and English translations.',
      'Tap the speaker button to hear native Mandarin speech synthesis (TTS).',
      'Filter passages by lesson or HSK level for focused reading.',
    ],
  },
  {
    id: 'sentences',
    title: 'Sentences & Patterns',
    chineseTitle: '重点例句与句型',
    icon: 'message-square-text',
    color: '#8b5cf6',
    badge: 'Grammar & Audio',
    route: '/pages/sentences',
    summary: 'Key sentence structures illustrating grammar in conversational context.',
    instructions: [
      'Study grammar points in natural spoken context.',
      'Listen to individual sentence audio pronunciation on demand.',
      'Send sentences to the Listening Loop for repeated shadowing.',
    ],
  },
  {
    id: 'words',
    title: 'Words & Vocabulary',
    chineseTitle: '生词卡片',
    icon: 'languages',
    color: '#10b981',
    badge: 'Vocabulary',
    route: '/pages/words',
    summary: 'Comprehensive dictionary entries with Hanzi, Pinyin, definitions, and stroke counts.',
    instructions: [
      'Browse vocabulary with clear tone marks, part of speech, and English definitions.',
      'Inspect total stroke count and character composition for each word.',
      'Tap any word to view detailed usage examples.',
    ],
  },
  {
    id: 'characters',
    title: 'Characters & Radicals',
    chineseTitle: '汉字与部首解析',
    icon: 'spell-check',
    color: '#ec489a',
    badge: 'Hanzi',
    route: '/pages/characters',
    summary: 'Break down individual Hanzi into radical components, tones, and stroke structure.',
    instructions: [
      'Understand the semantic radical (部首) and phonetic components of characters.',
      'Master tone pitch (1st high flat, 2nd rising, 3rd dipping, 4th falling).',
      'Examine stroke counts to recognize character construction patterns.',
    ],
  },
  {
    id: 'characterWrite',
    title: 'Write Characters (Calligraphy)',
    chineseTitle: '写字 / 笔顺描红',
    icon: 'pencil-line',
    color: '#0284c7',
    badge: 'Practice',
    route: '/pages/characterWrite',
    summary: 'Interactive digital canvas with grid lines (米字格) to practice stroke order by hand.',
    instructions: [
      'Practice writing characters stroke-by-stroke on the guided grid canvas.',
      'Follow standard stroke order: top to bottom, left to right, horizontal then vertical.',
      'Clear, redo, or practice multiple times to cement muscle memory.',
    ],
  },
  {
    id: 'writing',
    title: 'Writing Studio',
    chineseTitle: '中文写作与拼音',
    icon: 'keyboard',
    color: '#8b5cf6',
    badge: 'Practice',
    route: '/pages/writing',
    summary: 'Type and compose compositions in Chinese with pinyin assistance and instant export.',
    instructions: [
      'Draft sentences, essays, or personal diary entries in Chinese.',
      'Look up words and verify pinyin conversions while typing.',
      'Share or copy your completed writings directly.',
    ],
  },
  {
    id: 'listeningLoop',
    title: 'Listening Loop',
    chineseTitle: '听力循环与影子跟读',
    icon: 'headphones',
    color: '#ec4899',
    badge: 'Audio Training',
    route: '/pages/listeningLoop',
    summary: 'Continuous audio player designed for sentence repetition, looping, and shadowing.',
    instructions: [
      'Queue sentences or whole texts into an infinite or counted replay loop.',
      'Adjust playback speech rate (0.5x to 1.5x) to match your listening speed.',
      'Shadow the speech: listen and repeat aloud immediately for accent perfection.',
    ],
  },
  {
    id: 'rules',
    title: 'Grammar Rules',
    chineseTitle: '语法规则与句式',
    icon: 'graduation-cap',
    color: '#6366f1',
    badge: 'Grammar',
    route: '/pages/rules',
    summary: 'In-depth explanations of Mandarin syntax formulas and sentence structures.',
    instructions: [
      'Explore core grammar concepts (word order, measure words, aspect particles 了/过/着).',
      'Study formulaic structural templates with clear illustrative examples.',
      'Review rules organized systematically by HSK difficulty.',
    ],
  },
];

const STUDY_STEPS = [
  {
    step: '1',
    title: 'Select HSK & Lesson',
    chinese: '选定级别与课程',
    desc: 'Pick your level (e.g. HSK 1 for basics) and open a structured lesson to explore reading texts.',
    color: '#ef4444',
    icon: 'book-open',
  },
  {
    step: '2',
    title: 'Study Vocab & Stroke Order',
    chinese: '识词练字',
    desc: 'Check new words with pinyin tones, then trace character stroke order in Write Characters.',
    color: '#0284c7',
    icon: 'pencil-line',
  },
  {
    step: '3',
    title: 'Master Grammar Rules',
    chinese: '理解语法句式',
    desc: 'Read rule explanations and inspect example sentences to understand word order patterns.',
    color: '#6366f1',
    icon: 'graduation-cap',
  },
  {
    step: '4',
    title: 'Listen & Shadow in Loop',
    chinese: '循环听力跟读',
    desc: 'Load texts and sentences into the Listening Loop, adjust speed, and repeat aloud for natural fluency.',
    color: '#ec4899',
    icon: 'headphones',
  },
  {
    step: '5',
    title: 'Write & Apply',
    chinese: '写作输出巩固',
    desc: 'Compose your own sentences and short paragraphs in the Writing Studio to ensure long-term retention.',
    color: '#10b981',
    icon: 'keyboard',
  },
];

const TIPS = [
  {
    title: 'Quick Sidebar Navigation',
    chinese: '侧边栏快速导航',
    icon: 'menu',
    desc: 'Swipe inward from the left edge of your screen or tap the top-left menu button anywhere to open the navigation drawer.',
  },
  {
    title: 'Audio Speech Synthesis (TTS)',
    chinese: '一键语音朗读',
    icon: 'volume-2',
    desc: 'Whenever you see a speaker icon, tap it to hear accurate standard Mandarin pronunciation powered by Expo Speech.',
  },
  {
    title: 'Content Filtering',
    chinese: '层级筛选过滤',
    icon: 'filter',
    desc: 'Use the top filter bar in Texts, Sentences, and Words to isolate content belonging to a specific HSK level or lesson.',
  },
  {
    title: 'Offline SQLite Storage',
    chinese: '完全离线存储',
    icon: 'database',
    desc: 'All your vocabulary, lessons, custom writings, and data are saved locally on your device in SQLite—no internet connection required.',
  },
  {
    title: 'Custom Content Creation',
    chinese: '自定义添加内容',
    icon: 'plus-circle',
    desc: 'Add your own HSKs, lessons, reading passages, sentences, words, and grammar rules using the dedicated Add forms.',
  },
];

export default function InstructionsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <ThemedView style={styles.container}>
      <Bg1 />

      <Header
        label="Instructions"
        subtitle="HanGo Guide & Help"
        useBackArrow={true}
        showMenu={true}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Image
              source={require('@/assets/images/logo/normalScale.jpg')}
              style={styles.heroLogo}
              resizeMode="cover"
            />
            <View style={styles.heroTextContainer}>
              <View style={styles.heroTitleRow}>
                <ThemedText style={styles.heroTitle}>HanGo</ThemedText>
                <View style={styles.versionBadge}>
                  <Text style={styles.versionBadgeText}>v1.0</Text>
                </View>
              </View>
              <Text style={styles.heroSubtitle}>学中文 · 练汉字 · 听力突破</Text>
              <Text style={styles.heroTagline}>
                Your complete offline companion for mastering Mandarin Chinese
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>6</Text>
              <Text style={styles.statLabel}>HSK Levels</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>10</Text>
              <Text style={styles.statLabel}>Core Modules</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>100%</Text>
              <Text style={styles.statLabel}>Offline Ready</Text>
            </View>
          </View>
        </View>

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.7}
          >
            <Lucide
              name="sparkles"
              size={15}
              color={activeTab === 'all' ? '#ffffff' : '#64748b'}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'all' && styles.tabButtonTextActive,
              ]}
            >
              All Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'start' && styles.tabButtonActive]}
            onPress={() => setActiveTab('start')}
            activeOpacity={0.7}
          >
            <Lucide
              name="compass"
              size={15}
              color={activeTab === 'start' ? '#ffffff' : '#64748b'}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'start' && styles.tabButtonTextActive,
              ]}
            >
              Study Roadmap
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'modules' && styles.tabButtonActive]}
            onPress={() => setActiveTab('modules')}
            activeOpacity={0.7}
          >
            <Lucide
              name="book-open"
              size={15}
              color={activeTab === 'modules' ? '#ffffff' : '#64748b'}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'modules' && styles.tabButtonTextActive,
              ]}
            >
              App Modules
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'methods' && styles.tabButtonActive]}
            onPress={() => setActiveTab('methods')}
            activeOpacity={0.7}
          >
            <Lucide
              name="lightbulb"
              size={15}
              color={activeTab === 'methods' ? '#ffffff' : '#64748b'}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'methods' && styles.tabButtonTextActive,
              ]}
            >
              Study Methods
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'tips' && styles.tabButtonActive]}
            onPress={() => setActiveTab('tips')}
            activeOpacity={0.7}
          >
            <Lucide
              name="circle-help"
              size={15}
              color={activeTab === 'tips' ? '#ffffff' : '#64748b'}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'tips' && styles.tabButtonTextActive,
              ]}
            >
              Tips & Gestures
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Section: Study Roadmap */}
        {(activeTab === 'all' || activeTab === 'start') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: '#eff6ff' }]}>
                <Lucide name="compass" size={18} color="#2563eb" />
              </View>
              <View style={styles.sectionHeaderText}>
                <ThemedText style={styles.sectionTitle}>5-Step Study Roadmap</ThemedText>
                <Text style={styles.sectionChinese}>高效五步学习路径</Text>
              </View>
            </View>

            <View style={styles.roadmapList}>
              {STUDY_STEPS.map((step, idx) => (
                <View key={idx} style={styles.roadmapItem}>
                  <View style={styles.roadmapLeftCol}>
                    <View
                      style={[styles.stepCircle, { backgroundColor: step.color }]}
                    >
                      <Text style={styles.stepCircleText}>{step.step}</Text>
                    </View>
                    {idx < STUDY_STEPS.length - 1 && <View style={styles.stepConnector} />}
                  </View>
                  <View style={styles.roadmapRightCard}>
                    <View style={styles.roadmapTitleRow}>
                      <ThemedText style={styles.roadmapTitle}>{step.title}</ThemedText>
                      <Text style={styles.roadmapChinese}>{step.chinese}</Text>
                    </View>
                    <Text style={styles.roadmapDesc}>{step.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Section: Core Modules Guide */}
        {(activeTab === 'all' || activeTab === 'modules') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: '#fef2f2' }]}>
                <Lucide name="layers" size={18} color="#ef4444" />
              </View>
              <View style={styles.sectionHeaderText}>
                <ThemedText style={styles.sectionTitle}>Module Instructions</ThemedText>
                <Text style={styles.sectionChinese}>核心功能使用指南</Text>
              </View>
            </View>

            <View style={styles.modulesGrid}>
              {FEATURE_GUIDES.map((guide) => {
                const isExpanded = expandedId === guide.id;
                return (
                  <View key={guide.id} style={styles.moduleCard}>
                    <TouchableOpacity
                      style={styles.moduleCardHeader}
                      onPress={() => toggleExpand(guide.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.moduleIconContainer,
                          { backgroundColor: `${guide.color}18` },
                        ]}
                      >
                        <Lucide name={guide.icon as any} size={22} color={guide.color} />
                      </View>

                      <View style={styles.moduleHeaderInfo}>
                        <View style={styles.moduleTitleBadgeRow}>
                          <ThemedText style={styles.moduleTitle}>{guide.title}</ThemedText>
                          <View
                            style={[
                              styles.moduleBadge,
                              { backgroundColor: `${guide.color}20` },
                            ]}
                          >
                            <Text
                              style={[styles.moduleBadgeText, { color: guide.color }]}
                            >
                              {guide.badge}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.moduleChinese}>{guide.chineseTitle}</Text>
                        <Text style={styles.moduleSummary} numberOfLines={isExpanded ? undefined : 2}>
                          {guide.summary}
                        </Text>
                      </View>

                      <Lucide
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#94a3b8"
                      />
                    </TouchableOpacity>

                    {/* Expanded Instructions */}
                    {isExpanded && (
                      <View style={styles.moduleExpandedContent}>
                        <View style={styles.divider} />
                        <Text style={styles.instructionsHeading}>How to use:</Text>
                        {guide.instructions.map((inst, i) => (
                          <View key={i} style={styles.instructionRow}>
                            <View
                              style={[
                                styles.instructionBullet,
                                { backgroundColor: guide.color },
                              ]}
                            />
                            <Text style={styles.instructionText}>{inst}</Text>
                          </View>
                        ))}

                        {guide.route && (
                          <TouchableOpacity
                            style={[
                              styles.openModuleBtn,
                              { backgroundColor: guide.color },
                            ]}
                            onPress={() => router.push(guide.route as any)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.openModuleBtnText}>
                              Open {guide.title.split(' ')[0]}
                            </Text>
                            <Lucide name="arrow-right" size={16} color="#ffffff" />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Section: Study Methods & Mastery */}
        {(activeTab === 'all' || activeTab === 'methods') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: '#fdf4ff' }]}>
                <Lucide name="lightbulb" size={18} color="#c026d3" />
              </View>
              <View style={styles.sectionHeaderText}>
                <ThemedText style={styles.sectionTitle}>Mandarin Mastery Principles</ThemedText>
                <Text style={styles.sectionChinese}>汉语掌握法则</Text>
              </View>
            </View>

            <View style={styles.principlesContainer}>
              <View style={styles.principleCard}>
                <View style={styles.principleHeader}>
                  <View style={[styles.principleNum, { backgroundColor: '#ef4444' }]}>
                    <Text style={styles.principleNumText}>1</Text>
                  </View>
                  <ThemedText style={styles.principleTitle}>Master the 4 Tones First</ThemedText>
                </View>
                <Text style={styles.principleBody}>
                  Mandarin is tonal: mā (妈, mother), má (麻, hemp), mǎ (马, horse), mà (骂, scold). Always use the TTS speaker button in HanGo to listen to pitch contours before memorizing spelling.
                </Text>
              </View>

              <View style={styles.principleCard}>
                <View style={styles.principleHeader}>
                  <View style={[styles.principleNum, { backgroundColor: '#0284c7' }]}>
                    <Text style={styles.principleNumText}>2</Text>
                  </View>
                  <ThemedText style={styles.principleTitle}>Radical Breakdown (部首)</ThemedText>
                </View>
                <Text style={styles.principleBody}>
                  Over 80% of Chinese characters are phono-semantic compounds (形声字). Radicals give clues to meaning (e.g. 氵 related to water, 言 related to speech, 木 related to trees/wood).
                </Text>
              </View>

              <View style={styles.principleCard}>
                <View style={styles.principleHeader}>
                  <View style={[styles.principleNum, { backgroundColor: '#ec4899' }]}>
                    <Text style={styles.principleNumText}>3</Text>
                  </View>
                  <ThemedText style={styles.principleTitle}>Shadowing with Listening Loop</ThemedText>
                </View>
                <Text style={styles.principleBody}>
                  Queue sentences into HanGo's Listening Loop. Shadowing means repeating the audio 0.2 to 0.5 seconds after hearing it, copying pitch and rhythm directly to build native speech patterns.
                </Text>
              </View>

              <View style={styles.principleCard}>
                <View style={styles.principleHeader}>
                  <View style={[styles.principleNum, { backgroundColor: '#10b981' }]}>
                    <Text style={styles.principleNumText}>4</Text>
                  </View>
                  <ThemedText style={styles.principleTitle}>Daily Active Output</ThemedText>
                </View>
                <Text style={styles.principleBody}>
                  Recognition is passive; writing is active. Practice tracing characters stroke-by-stroke in Write Characters, and draft short real-life sentences in the Writing Studio daily.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Section: Tips & Gestures */}
        {(activeTab === 'all' || activeTab === 'tips') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: '#ecfdf5' }]}>
                <Lucide name="circle-help" size={18} color="#059669" />
              </View>
              <View style={styles.sectionHeaderText}>
                <ThemedText style={styles.sectionTitle}>App Gestures & Tips</ThemedText>
                <Text style={styles.sectionChinese}>实用技巧与手势操作</Text>
              </View>
            </View>

            <View style={styles.tipsList}>
              {TIPS.map((tip, idx) => (
                <View key={idx} style={styles.tipCard}>
                  <View style={styles.tipIconBox}>
                    <Lucide name={tip.icon as any} size={20} color="#059669" />
                  </View>
                  <View style={styles.tipContent}>
                    <View style={styles.tipTitleRow}>
                      <ThemedText style={styles.tipTitle}>{tip.title}</ThemedText>
                      <Text style={styles.tipChinese}>{tip.chinese}</Text>
                    </View>
                    <Text style={styles.tipDesc}>{tip.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bottom CTA to start exploring */}
        <View style={styles.footerCard}>
          <ThemedText style={styles.footerTitle}>Ready to begin your journey?</ThemedText>
          <Text style={styles.footerSubtitle}>
            千里之行，始于足下 (A journey of a thousand miles begins with a single step.)
          </Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => router.push('/pages/hsks/[id]')}
            activeOpacity={0.8}
          >
            <Text style={styles.startBtnText}>Start with HSK Levels</Text>
            <Lucide name="arrow-right" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  /* Hero */
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroLogo: {
    width: 60,
    height: 60,
    borderRadius: 14,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  versionBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  versionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 2,
  },
  heroTagline: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
  },

  /* Tabs */
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  tabButtonActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },

  /* Section Containers */
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    gap: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionChinese: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
  },

  /* Roadmap */
  roadmapList: {
    gap: 0,
  },
  roadmapItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  roadmapLeftCol: {
    alignItems: 'center',
    width: 36,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 2,
  },
  stepCircleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  stepConnector: {
    width: 2,
    flex: 1,
    minHeight: 40,
    backgroundColor: '#cbd5e1',
    marginVertical: 4,
  },
  roadmapRightCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginLeft: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  roadmapTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  roadmapTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  roadmapChinese: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  roadmapDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },

  /* Modules Grid */
  modulesGrid: {
    gap: 10,
  },
  moduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    overflow: 'hidden',
  },
  moduleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  moduleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleHeaderInfo: {
    flex: 1,
  },
  moduleTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  moduleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  moduleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  moduleChinese: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
    fontWeight: '500',
  },
  moduleSummary: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 16,
  },
  moduleExpandedContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  instructionsHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  instructionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
  },
  instructionText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  openModuleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  openModuleBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Principles */
  principlesContainer: {
    gap: 10,
  },
  principleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  principleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  principleNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  principleNumText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  principleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  principleBody: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },

  /* Tips */
  tipsList: {
    gap: 10,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  tipIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  tipChinese: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  tipDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },

  /* Footer Card */
  footerCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  footerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  footerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
