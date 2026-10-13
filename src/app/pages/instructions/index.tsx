import React, { useState } from 'react';
import {
  Image,
  Linking,
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

type CategoryTab = 'all' | 'loop' | 'sync' | 'modules' | 'practice' | 'contact' | 'tips';

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
  helpTip?: string;
}

const FEATURE_GUIDES: FeatureGuide[] = [
  {
    id: 'listeningLoop',
    title: 'Listening Loop (Shadowing)',
    chineseTitle: '听力循环与影子跟读',
    icon: 'headphones',
    color: '#ec4899',
    badge: 'Audio Training',
    route: '/pages/listeningLoop',
    summary: 'Continuous spoken Mandarin player with loop repeats, speed tuning, and sequential lesson progression.',
    instructions: [
      'Dual Study Modes: Switch between practicing Sentences in conversational context or single Vocabulary Words.',
      'Natural Curriculum Order: Sentences and words play in sequential order matching your textbook and lessons.',
      'Targeted Filters: Filter audio by your target HSK level and choose a specific lesson to focus your session.',
      'Custom Shadowing Settings: Adjust repeat count (1x, 3x, 5x, or infinite ∞) and speech playback speed (0.5x to 1.5x) to practice repeating aloud after native Mandarin audio.',
      'Quick Launcher: Tap the pink headphones icon in the top header of Words or Sentences to jump straight into the loop with that filter applied.',
    ],
    helpTip: 'Sound not playing? Make sure your device media volume is turned up and silent mode allows media playback. If speech is too fast, set the speed slider to 0.7x.',
  },
  {
    id: 'sync',
    title: 'Account & Cloud Sync',
    chineseTitle: '账号与云端数据同步',
    icon: 'cloud',
    color: '#7c3aed',
    badge: 'Cloud Backup',
    route: '/pages/sync',
    summary: 'Safely back up your learning progress to the cloud database and restore it onto any device anytime.',
    instructions: [
      'Simple Account Sign In: Create an account or log in with just your email and password.',
      'One-Tap Cloud Backup: Tap "Back Up to Cloud" to securely save all your custom HSKs, lessons, texts, words, rules, and writings to the cloud.',
      'Restore on Any Device: Switching phones or reinstalling? Log into your account and tap "Restore from Cloud" to retrieve all your data instantly.',
      'Cloud Status Dot: Check the profile icon in the top header on the Home dashboard — a green dot confirms your active connection.',
      'Works 100% Offline: HanGo saves everything locally on your device first, so you can study without internet and sync whenever you connect.',
    ],
    helpTip: 'Get an error when backing up? Check your Wi-Fi or mobile data connection. Your offline library is always safe on your phone.',
  },
  {
    id: 'hsks',
    title: 'HSKs (Proficiency Levels)',
    chineseTitle: '汉语水平考试 (HSK 1-6)',
    icon: 'book-marked',
    color: '#ef4444',
    badge: 'Curriculum',
    route: '/pages/hsks/1',
    summary: 'Standard Chinese proficiency system organizing curriculum into structured levels from beginner to advanced.',
    instructions: [
      'Choose your target proficiency level (HSK 1 for beginners up to HSK 6 for advanced learners).',
      'Explore all structured lessons, grammar rules, and vocabulary assigned to each level.',
      'Track your learning journey step-by-step as you complete units.',
    ],
    helpTip: 'New to Chinese? Start with HSK 1 to master basic pronunciation, greetings, numbers, and fundamental sentence structures.',
  },
  {
    id: 'lessons',
    title: 'Lessons (Structured Units)',
    chineseTitle: '课程单元',
    icon: 'book-open',
    color: '#f59e0b',
    badge: 'Curriculum',
    route: '/pages/lessons/1',
    summary: 'Cohesive lesson units connecting reading dialogues, vocabulary, key sentences, and grammar formulas.',
    instructions: [
      'Each lesson brings together dialogues and the new vocabulary introduced in that context.',
      'Tap any lesson card to see its full reading passages, sentences, grammar rules, and audio.',
      'Use the top filter to switch between different HSK levels easily.',
    ],
    helpTip: 'Can’t find a lesson? Make sure the HSK level dropdown at the top is set to the tier containing your desired lesson.',
  },
  {
    id: 'texts',
    title: 'Texts & Dialogues',
    chineseTitle: '课文朗读与阅读',
    icon: 'file-text',
    color: '#3b82f6',
    badge: 'Reading & Audio',
    route: '/pages/texts',
    summary: 'Authentic Chinese dialogues and reading passages with tone-marked Pinyin and audio synthesis.',
    instructions: [
      'Read passages with tone-marked Pinyin and translations to reinforce comprehension.',
      'Tap the speaker button next to any passage to hear native Mandarin speech.',
      'Filter passages by lesson or HSK level to match your current study goal.',
    ],
    helpTip: 'Need to review listening? Tap the headphones icon at the top of the screen to open the Listening Loop for the current lesson.',
  },
  {
    id: 'sentences',
    title: 'Sentences & Patterns',
    chineseTitle: '重点例句与句型',
    icon: 'message-square-text',
    color: '#8b5cf6',
    badge: 'Grammar & Audio',
    route: '/pages/sentences',
    summary: 'Key sentence structures illustrating grammar in real conversational context.',
    instructions: [
      'Examine real-world sentence examples to understand word order and particle placement.',
      'Listen to sentence audio on demand with the speaker button.',
      'Tap the headphone icon in the header to loop sentences for pronunciation and shadowing practice.',
    ],
    helpTip: 'Stuck on understanding sentence structure? Check the linked Grammar Rules section to learn why words are placed in that order.',
  },
  {
    id: 'words',
    title: 'Words & Vocabulary',
    chineseTitle: '生词卡片',
    icon: 'languages',
    color: '#10b981',
    badge: 'Vocabulary',
    route: '/pages/words',
    summary: 'Comprehensive vocabulary cards with Hanzi, Pinyin tones, definitions, and stroke counts.',
    instructions: [
      'Study words with clear tone marks, part of speech classifications, and definitions.',
      'View total stroke count to help recognize and write the characters.',
      'Tap the headphone icon in the header to launch the Listening Loop for current vocabulary.',
    ],
    helpTip: 'Searching for a word? Type either English definitions or Pinyin into the search bar at the top of the Words screen.',
  },
  {
    id: 'characters',
    title: 'Characters & Radicals',
    chineseTitle: '汉字与部首解析',
    icon: 'spell-check',
    color: '#ec489a',
    badge: 'Hanzi',
    route: '/pages/characters',
    summary: 'Break down Chinese characters into semantic radicals, tone pitches, and stroke compositions.',
    instructions: [
      'Understand how character radicals (部首) hint at meaning and pronunciation.',
      'Review tone pitch levels (1st high flat, 2nd rising, 3rd dipping, 4th falling, 5th neutral).',
      'Examine stroke counts to understand how characters are constructed.',
    ],
    helpTip: 'Finding characters hard to remember? Group them by shared radicals — characters with the water radical 氵 usually relate to liquids, for example.',
  },
  {
    id: 'characterWrite',
    title: 'Write Characters (Canvas)',
    chineseTitle: '写字 / 笔顺描红',
    icon: 'pencil-line',
    color: '#0284c7',
    badge: 'Practice',
    route: '/pages/characterWrite/1',
    summary: 'Interactive digital canvas with grid lines (米字格) to practice stroke order and handwriting.',
    instructions: [
      'Practice writing characters stroke-by-stroke on the guided grid canvas.',
      'Follow standard stroke order: top-to-bottom, left-to-right, outside-before-inside.',
      'Use the Clear or Undo buttons to restart anytime and build muscle memory.',
    ],
    helpTip: 'Drawing feels off? Use your finger or stylus smoothly inside the central grid guidelines. Tap Clear to wipe the canvas and try the character again.',
  },
  {
    id: 'writing',
    title: 'Writing Studio',
    chineseTitle: '中文写作与拼音',
    icon: 'keyboard',
    color: '#8b5cf6',
    badge: 'Practice',
    route: '/pages/writing/1',
    summary: 'Type and compose compositions in Chinese with pinyin assistance and instant export.',
    instructions: [
      'Compose personal notes, homework essays, or daily journal entries in Chinese.',
      'Review tone marks and character conversions as you type.',
      'Your drafts are automatically saved locally on your device so you never lose your work.',
    ],
    helpTip: 'Want to back up your written essays? Go to My Account in the sidebar and tap "Back Up to Cloud" to keep them safe on the server.',
  },
  {
    id: 'rules',
    title: 'Grammar Rules',
    chineseTitle: '语法规则与句式',
    icon: 'graduation-cap',
    color: '#6366f1',
    badge: 'Grammar',
    route: '/pages/rules',
    summary: 'Clear explanations of Mandarin sentence formulas, word orders, and grammatical particles.',
    instructions: [
      'Master core concepts like subject-verb-object order, measure words, and particles (了, 过, 着).',
      'Study formula templates illustrated with practical example sentences.',
      'Link grammar rules to specific lessons and vocabulary to understand how they work together.',
    ],
    helpTip: 'Confused by a grammar particle like 了? Read the example sentences attached to the rule to see how its meaning changes in context.',
  },
];

const STUDY_STEPS = [
  {
    step: '1',
    title: 'Select HSK & Lesson',
    chinese: '选定级别与课程',
    desc: 'Pick your level (e.g. HSK 1 for basics) and open a structured lesson to explore reading dialogues.',
    color: '#ef4444',
    icon: 'book-open',
  },
  {
    step: '2',
    title: 'Study Vocab & Stroke Order',
    chinese: '识词练字',
    desc: 'Review new words with tone-marked Pinyin, then trace stroke order on the Write Characters canvas.',
    color: '#0284c7',
    icon: 'pencil-line',
  },
  {
    step: '3',
    title: 'Master Grammar Rules',
    chinese: '理解语法句式',
    desc: 'Examine rule formulas and study linked example sentences to understand natural Chinese word order.',
    color: '#6366f1',
    icon: 'graduation-cap',
  },
  {
    step: '4',
    title: 'Shadow in Listening Loop',
    chinese: '循环听力跟读',
    desc: 'Play sentences or words in the Listening Loop, adjust speech speed, and repeat aloud for fluency.',
    color: '#ec4899',
    icon: 'headphones',
  },
  {
    step: '5',
    title: 'Sync to Cloud & Protect Progress',
    chinese: '云端同步保存',
    desc: 'One tap backs up all your custom words, lessons, and notes to the cloud so you can study anywhere.',
    color: '#7c3aed',
    icon: 'cloud',
  },
];

const FAQS = [
  {
    question: 'Audio or speech is not playing?',
    chinese: '声音无法播放？',
    icon: 'volume-x',
    answer:
      'Check your phone media volume slider and ensure silent/vibrate mode is not muting audio. On iOS or Android, make sure speech synthesis (TTS) volume is active.',
  },
  {
    question: 'How do I open the sidebar drawer?',
    chinese: '如何打开侧边栏？',
    icon: 'menu',
    answer:
      'Tap the menu button in the top header or simply swipe your finger from the very left edge of the screen to the right anywhere in the app.',
  },
  {
    question: 'How do I transfer my study progress to a new device?',
    chinese: '换新手机如何同步学习进度？',
    icon: 'cloud-download',
    answer:
      'First tap "Back Up to Cloud" in My Account on your old phone. Then install HanGo on your new phone, log in with the same account, and tap "Restore from Cloud".',
  },
  {
    question: 'Can I study completely without internet?',
    chinese: '无网络状态下可以正常学习吗？',
    icon: 'wifi-off',
    answer:
      'Yes! HanGo stores all lessons, words, sentences, grammar rules, and character writing locally on your device in SQLite. Internet is only needed when backing up to the cloud.',
  },
  {
    question: 'How do I quickly launch the Listening Loop for my current lesson?',
    chinese: '如何快速进入当前课文的听力循环？',
    icon: 'headphones',
    answer:
      'Whenever you are viewing Words or Sentences, look at the top header bar and tap the headphones icon. It will instantly launch the Listening Loop with your active lesson filter applied.',
  },
];

export default function InstructionsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>('listeningLoop');

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.warn('Could not open URL:', url);
    }
  };

  const filteredGuides = FEATURE_GUIDES.filter((guide) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'loop') return guide.id === 'listeningLoop';
    if (activeTab === 'sync') return guide.id === 'sync';
    if (activeTab === 'modules')
      return ['hsks', 'lessons', 'texts', 'sentences', 'words', 'characters', 'rules'].includes(
        guide.id
      );
    if (activeTab === 'practice') return ['characterWrite', 'writing'].includes(guide.id);
    return true;
  });

  return (
    <ThemedView style={styles.container}>
      <Bg1 />

      <Header
        label="Instructions"
        subtitle="Features & Help Guide"
        useBackArrow={true}
        showMenu={true}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner Card */}
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
              <Text style={styles.heroSubtitle}>学中文 · 练汉字 · 听力突破 · 云端同步</Text>
              <Text style={styles.heroTagline}>
                Your complete Mandarin learning companion with offline storage, Listening Loop shadowing, and Cloud Backup.
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>6</Text>
              <Text style={styles.statLabel}>HSK Tiers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#ec4899' }]}>Loop</Text>
              <Text style={styles.statLabel}>Shadowing</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#7c3aed' }]}>Sync</Text>
              <Text style={styles.statLabel}>Cloud Safe</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#10b981' }]}>100%</Text>
              <Text style={styles.statLabel}>Offline</Text>
            </View>
          </View>
        </View>

        {/* Creator / Personal Help Banner */}
        <View style={styles.creatorBannerCard}>
          <View style={styles.creatorHeaderRow}>
            <Image
              source={require('@/assets/images/creatorPic.jpg')}
              style={styles.creatorAvatar}
              resizeMode="cover"
            />
            <View style={styles.creatorInfo}>
              <View style={styles.creatorNameRow}>
                <ThemedText style={styles.creatorName}>fares houid</ThemedText>
                <View style={styles.creatorBadge}>
                  <Text style={styles.creatorBadgeText}>Creator</Text>
                </View>
              </View>
              <Text style={styles.creatorSub}>App Creator & Developer</Text>
              <Text style={styles.creatorBio}>
                Need help or got stuck with something not clear? Reach out to me directly on Messenger or Facebook anytime!
              </Text>
            </View>
          </View>

          <View style={styles.creatorActionRow}>
            <TouchableOpacity
              style={styles.messengerBtn}
              onPress={() => openLink('https://m.me/fares.houidi.2025')}
              activeOpacity={0.8}
            >
              <Lucide name="message-circle" size={16} color="#ffffff" />
              <Text style={styles.messengerBtnText}>Chat on Messenger</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.facebookBtn}
              onPress={() => openLink('https://www.facebook.com/fares.houidi.2025')}
              activeOpacity={0.8}
            >
              <Lucide name="external-link" size={15} color="#1877f2" />
              <Text style={styles.facebookBtnText}>Facebook Profile</Text>
            </TouchableOpacity>
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
              size={14}
              color={activeTab === 'all' ? '#ffffff' : '#64748b'}
            />
            <Text style={[styles.tabButtonText, activeTab === 'all' && styles.tabButtonTextActive]}>
              All Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'loop' && styles.tabButtonActive]}
            onPress={() => setActiveTab('loop')}
            activeOpacity={0.7}
          >
            <Lucide
              name="headphones"
              size={14}
              color={activeTab === 'loop' ? '#ffffff' : '#64748b'}
            />
            <Text style={[styles.tabButtonText, activeTab === 'loop' && styles.tabButtonTextActive]}>
              Listening Loop
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'sync' && styles.tabButtonActive]}
            onPress={() => setActiveTab('sync')}
            activeOpacity={0.7}
          >
            <Lucide
              name="cloud"
              size={14}
              color={activeTab === 'sync' ? '#ffffff' : '#64748b'}
            />
            <Text style={[styles.tabButtonText, activeTab === 'sync' && styles.tabButtonTextActive]}>
              Cloud Sync
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'modules' && styles.tabButtonActive]}
            onPress={() => setActiveTab('modules')}
            activeOpacity={0.7}
          >
            <Lucide
              name="book-open"
              size={14}
              color={activeTab === 'modules' ? '#ffffff' : '#64748b'}
            />
            <Text style={[styles.tabButtonText, activeTab === 'modules' && styles.tabButtonTextActive]}>
              Curriculum Modules
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'practice' && styles.tabButtonActive]}
            onPress={() => setActiveTab('practice')}
            activeOpacity={0.7}
          >
            <Lucide
              name="pencil-line"
              size={14}
              color={activeTab === 'practice' ? '#ffffff' : '#64748b'}
            />
            <Text style={[styles.tabButtonText, activeTab === 'practice' && styles.tabButtonTextActive]}>
              Writing & Canvas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'contact' && styles.tabButtonActive]}
            onPress={() => setActiveTab('contact')}
            activeOpacity={0.7}
          >
            <Lucide
              name="message-circle"
              size={14}
              color={activeTab === 'contact' ? '#ffffff' : '#64748b'}
            />
            <Text style={[styles.tabButtonText, activeTab === 'contact' && styles.tabButtonTextActive]}>
              Contact Creator
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'tips' && styles.tabButtonActive]}
            onPress={() => setActiveTab('tips')}
            activeOpacity={0.7}
          >
            <Lucide
              name="help-circle"
              size={14}
              color={activeTab === 'tips' ? '#ffffff' : '#64748b'}
            />
            <Text style={[styles.tabButtonText, activeTab === 'tips' && styles.tabButtonTextActive]}>
              Getting Unstuck
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Feature Spotlight: Listening Loop & Cloud Sync */}
        {(activeTab === 'all' || activeTab === 'loop' || activeTab === 'sync') && (
          <View style={styles.spotlightContainer}>
            {/* Spotlight Card 1: Listening Loop */}
            {(activeTab === 'all' || activeTab === 'loop') && (
              <TouchableOpacity
                style={[styles.spotlightCard, { borderColor: '#fbcfe8', backgroundColor: '#fdf2f8de' }]}
                onPress={() => router.push('/pages/listeningLoop' as any)}
                activeOpacity={0.8}
              >
                <View style={styles.spotlightHeader}>
                  <View style={[styles.spotlightIconBox, { backgroundColor: '#ec4899' }]}>
                    <Lucide name="headphones" size={20} color="#ffffff" />
                  </View>
                  <View style={styles.spotlightHeaderText}>
                    <Text style={[styles.spotlightTitle, { color: '#9d174d' }]}>Listening Loop</Text>
                    <Text style={styles.spotlightSub}>听力循环 · 影子跟读</Text>
                  </View>
                  <View style={[styles.spotlightBadge, { backgroundColor: '#f472b6' }]}>
                    <Text style={styles.spotlightBadgeText}>Audio</Text>
                  </View>
                </View>
                <Text style={styles.spotlightDesc}>
                  Continuous sentence & word replay ordered sequentially. Tune speech speed and repeat aloud to master native Mandarin pronunciation.
                </Text>
                <View style={styles.spotlightActionRow}>
                  <Text style={[styles.spotlightActionText, { color: '#db2777' }]}>Open Listening Loop</Text>
                  <Lucide name="arrow-right" size={15} color="#db2777" />
                </View>
              </TouchableOpacity>
            )}

            {/* Spotlight Card 2: Cloud Sync */}
            {(activeTab === 'all' || activeTab === 'sync') && (
              <TouchableOpacity
                style={[styles.spotlightCard, { borderColor: '#ddd6fe', backgroundColor: '#f5f3ffe9' }]}
                onPress={() => router.push('/pages/sync' as any)}
                activeOpacity={0.8}
              >
                <View style={styles.spotlightHeader}>
                  <View style={[styles.spotlightIconBox, { backgroundColor: '#7c3aed' }]}>
                    <Lucide name="cloud" size={20} color="#ffffff" />
                  </View>
                  <View style={styles.spotlightHeaderText}>
                    <Text style={[styles.spotlightTitle, { color: '#5b21b6' }]}>Account & Cloud Sync</Text>
                    <Text style={styles.spotlightSub}>账号与云端备份</Text>
                  </View>
                  <View style={[styles.spotlightBadge, { backgroundColor: '#8b5cf6' }]}>
                    <Text style={styles.spotlightBadgeText}>Sync</Text>
                  </View>
                </View>
                <Text style={styles.spotlightDesc}>
                  Sign in with email and password to back up all your vocabulary and custom lessons to the cloud database with one tap.
                </Text>
                <View style={styles.spotlightActionRow}>
                  <Text style={[styles.spotlightActionText, { color: '#7c3aed' }]}>Manage Account & Sync</Text>
                  <Lucide name="arrow-right" size={15} color="#7c3aed" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Section: Study Roadmap */}
        {activeTab === 'all' && (
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
                    <View style={[styles.stepCircle, { backgroundColor: step.color }]}>
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

        {/* Section: Detailed Feature Guides (How to use & troubleshooting) */}
        {activeTab !== 'contact' && activeTab !== 'tips' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: '#fef2f2' }]}>
                <Lucide name="layers" size={18} color="#ef4444" />
              </View>
              <View style={styles.sectionHeaderText}>
                <ThemedText style={styles.sectionTitle}>Feature Guides & Instructions</ThemedText>
                <Text style={styles.sectionChinese}>功能详解与使用说明</Text>
              </View>
            </View>

            <View style={styles.modulesGrid}>
              {filteredGuides.map((guide) => {
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
                        <Lucide name={guide.icon as any} size={20} color={guide.color} />
                      </View>

                      <View style={styles.moduleHeaderInfo}>
                        <View style={styles.moduleTitleBadgeRow}>
                          <ThemedText style={styles.moduleTitle}>{guide.title}</ThemedText>
                          <View
                            style={[
                              styles.moduleBadge,
                              { backgroundColor: `${guide.color}18` },
                            ]}
                          >
                            <Text style={[styles.moduleBadgeText, { color: guide.color }]}>
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

                    {/* Expanded Instructions & Help */}
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

                        {guide.helpTip && (
                          <View style={styles.helpTipBox}>
                            <Lucide name="info" size={14} color="#0284c7" />
                            <Text style={styles.helpTipText}>
                              <Text style={{ fontWeight: '700' }}>Troubleshooting tip: </Text>
                              {guide.helpTip}
                            </Text>
                          </View>
                        )}

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
                            <Lucide name="arrow-right" size={15} color="#ffffff" />
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

        {/* Section: Frequently Asked Questions & Getting Unstuck */}
        {(activeTab === 'all' || activeTab === 'tips') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: '#ecfdf5' }]}>
                <Lucide name="life-buoy" size={18} color="#059669" />
              </View>
              <View style={styles.sectionHeaderText}>
                <ThemedText style={styles.sectionTitle}>Getting Unstuck & FAQs</ThemedText>
                <Text style={styles.sectionChinese}>常见疑问与解答</Text>
              </View>
            </View>

            <View style={styles.tipsList}>
              {FAQS.map((faq, idx) => (
                <View key={idx} style={styles.tipCard}>
                  <View style={styles.tipIconBox}>
                    <Lucide name={faq.icon as any} size={18} color="#059669" />
                  </View>
                  <View style={styles.tipContent}>
                    <View style={styles.tipTitleRow}>
                      <ThemedText style={styles.tipTitle}>{faq.question}</ThemedText>
                      {/* <Text style={styles.tipChinese}>{faq.chinese}</Text> */}
                    </View>
                    <Text style={styles.tipDesc}>{faq.answer}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Section: Dedicated Direct Help & Creator Contact */}
        {(activeTab === 'all' || activeTab === 'contact') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: '#eff6ff' }]}>
                <Lucide name="heart-handshake" size={18} color="#2563eb" />
              </View>
              <View style={styles.sectionHeaderText}>
                <ThemedText style={styles.sectionTitle}>Need More Help? Contact Fares</ThemedText>
                <Text style={styles.sectionChinese}>联系作者获取专属支持</Text>
              </View>
            </View>

            <View style={styles.contactCard}>
              <View style={styles.contactTopRow}>
                <Image
                  source={require('@/assets/images/creatorPic.jpg')}
                  style={styles.contactAvatar}
                  resizeMode="cover"
                />
                <View style={styles.contactMeta}>
                  <ThemedText style={styles.contactName}>fares houid</ThemedText>
                  <Text style={styles.contactRole}>Creator & Developer of HanGo</Text>
                  <Text style={styles.contactDesc}>
                    If something in the app is unclear, you get stuck, or have feedback and suggestions, please message me directly!
                  </Text>
                </View>
              </View>

              <View style={styles.contactButtonsRow}>
                <TouchableOpacity
                  style={styles.contactMessengerBtn}
                  onPress={() => openLink('https://m.me/fares.houidi.2025')}
                  activeOpacity={0.8}
                >
                  <Lucide name="message-circle" size={17} color="#ffffff" />
                  <Text style={styles.contactMessengerText}>Chat on Messenger</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.contactFacebookBtn}
                  onPress={() => openLink('https://www.facebook.com/fares.houidi.2025')}
                  activeOpacity={0.8}
                >
                  <Lucide name="external-link" size={17} color="#1877f2" />
                  <Text style={styles.contactFacebookText}>Facebook Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Footer Quick Launch Card */}
        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Ready to begin your study?</Text>
          <Text style={styles.footerSubtitle}>
            Explore reading texts, practice handwriting, loop audio sentences, or sync your progress to the cloud.
          </Text>
          <View style={styles.footerBtnsRow}>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => router.push('/pages/listeningLoop' as any)}
              activeOpacity={0.8}
            >
              <Lucide name="headphones" size={16} color="#ffffff" />
              <Text style={styles.startBtnText}>Listening Loop</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: '#7c3aed' }]}
              onPress={() => router.push('/pages/sync' as any)}
              activeOpacity={0.8}
            >
              <Lucide name="cloud" size={16} color="#ffffff" />
              <Text style={styles.startBtnText}>My Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 24 }} />
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
    paddingHorizontal: 5,
    paddingTop: 8,
    paddingBottom: 0,
    gap: 5,
  },

  /* Hero Card */
  heroCard: {
    backgroundColor: '#ffffffe0',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroLogo: {
    width: 62,
    height: 62,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  versionBadge: {
    backgroundColor: '#eff6ffe0',
    paddingHorizontal: 8,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
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
    justifyContent: 'space-between',
    backgroundColor: '#f8fafce1',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#e2e8f0e7',
  },

  /* Creator Banner Card */
  creatorBannerCard: {
    backgroundColor: '#ffffffe3',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#dbeafe',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  creatorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  creatorAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  creatorInfo: {
    flex: 1,
  },
  creatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  creatorName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  creatorBadge: {
    backgroundColor: '#eff6ffe3',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  creatorBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
  },
  creatorSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  creatorBio: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 3,
    lineHeight: 16,
  },
  creatorActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  messengerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0084ffe6',
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  messengerBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  facebookBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f0f7ffe3',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingVertical: 9,
    borderRadius: 10,
  },
  facebookBtnText: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Spotlight Container */
  spotlightContainer: {
    gap: 5,
  },
  spotlightCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  spotlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  spotlightIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotlightHeaderText: {
    flex: 1,
  },
  spotlightTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  spotlightSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
    fontWeight: '500',
  },
  spotlightBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  spotlightBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  spotlightDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 10,
  },
  spotlightActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  spotlightActionText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* Tabs Row */
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffffe1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  tabButtonActive: {
    backgroundColor: '#ef4444ff',
    borderColor: '#ef4444',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#ffffffe7',
    fontWeight: '700',
  },

  /* Section Container */
  sectionContainer: {
    backgroundColor: '#ffffffe0',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionChinese: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },

  /* Roadmap List */
  roadmapList: {
    gap: 0,
    marginTop: 2,
  },
  roadmapItem: {
    flexDirection: 'row',
    gap: 12,
  },
  roadmapLeftCol: {
    alignItems: 'center',
    width: 28,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  stepCircleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  stepConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#e2e8f0e9',
    marginVertical: 4,
  },
  roadmapRightCard: {
    flex: 1,
    paddingBottom: 14,
  },
  roadmapTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  roadmapTitle: {
    fontSize: 13.5,
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
    lineHeight: 16.5,
  },

  /* Modules Grid */
  modulesGrid: {
    gap: 9,
  },
  moduleCard: {
    backgroundColor: '#ffffffe6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  moduleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  moduleIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleHeaderInfo: {
    flex: 1,
  },
  moduleTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moduleTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  moduleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  moduleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  moduleChinese: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
    fontWeight: '500',
  },
  moduleSummary: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 3,
    lineHeight: 16,
  },
  moduleExpandedContent: {
    paddingHorizontal: 13,
    paddingBottom: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9ef',
    marginBottom: 10,
  },
  instructionsHeading: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
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
  helpTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: '#f0f9ffe8',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 8,
    padding: 9,
    marginTop: 6,
    marginBottom: 4,
  },
  helpTipText: {
    flex: 1,
    fontSize: 11.5,
    color: '#0369a1',
    lineHeight: 16,
  },
  openModuleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 10,
  },
  openModuleBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* Tips & FAQs */
  tipsList: {
    gap: 9,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffffe6',
    borderRadius: 14,
    padding: 12,
    gap: 11,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  tipIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitleRow: {
    flexDirection: 'column',
    // alignItems: 'center',
    // justifyContent: 'space-between',
    marginBottom: 2,
    // backgroundColor: "red"
  },
  tipTitle: {
    // flex: 1,
    // maxWidth: "50%",
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    // backgroundColor: "blue"
  },
  tipChinese: {
    flex: 1,
    fontSize: 10.5,
    color: '#94a3b8',
    fontWeight: '500',
  },
  tipDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },

  /* Contact Card */
  contactCard: {
    backgroundColor: '#ffffffe3',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#dbeafe',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  contactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  contactMeta: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  contactRole: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  contactDesc: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 3,
    lineHeight: 16,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  contactMessengerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0084ff',
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  contactMessengerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  contactFacebookBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 9,
    borderRadius: 10,
  },
  contactFacebookText: {
    color: '#1e293b',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Footer Card */
  footerCard: {
    backgroundColor: '#0f172ae2',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 0,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  footerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 16,
  },
  footerBtnsRow: {
    flexDirection: 'row',
    gap: 5,
    width: '100%',
    justifyContent: 'center',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ec489aec',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  startBtnText: {
    color: '#ffffffe6',
    fontSize: 13,
    fontWeight: '700',
  },
});
