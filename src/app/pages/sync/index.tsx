import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { Bg1 } from '@/components/sub/bg1';
import Header from '@/components/main/header';
import {
  backupDataToCloud,
  fetchSyncStatus,
  getLastSyncTime,
  getStoredToken,
  getStoredUser,
  loginAccount,
  logoutAccount,
  registerAccount,
  restoreDataFromCloud,
  SyncStats,
  User,
} from '@/services/authSyncService';
import { getSetting, setSetting, removeInitData, restoreInitData } from '@/db/utils';
import { useAppUpdates } from '@/context/update-context';

type AuthTab = 'login' | 'register';
type SyncState = 'idle' | 'running' | 'success' | 'error';

export default function AccountPage() {
  const router = useRouter();

  // App updates
  const { currentVersion, latestVersion, checkForUpdates, checking, updateAvailable } = useAppUpdates();

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authTab, setAuthTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Sync state
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncType, setSyncType] = useState<'backup' | 'restore' | null>(null);
  const [syncStep, setSyncStep] = useState('');
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [cloudStats, setCloudStats] = useState<SyncStats | null>(null);

  // Starter content toggle
  const [useInitData, setUseInitData] = useState<boolean>(
    getSetting('use_init_data', 'true') !== 'false'
  );
  const [initDataLoading, setInitDataLoading] = useState(false);

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Initialize
  useEffect(() => {
    (async () => {
      const user = await getStoredUser();
      const token = await getStoredToken();
      if (user && token) {
        setCurrentUser(user);
        loadStatus();
      }

      const last = await getLastSyncTime();
      setLastSync(last);
    })();
  }, []);

  const loadStatus = async () => {
    try {
      const status = await fetchSyncStatus();
      if (status.hasBackup && status.stats) {
        setCloudStats(status.stats);
        if (status.updatedAt) setLastSync(status.updatedAt);
      }
    } catch {
      // Non-critical, ignore
    }
  };

  // Auth actions
  const handleAuthSubmit = async () => {
    setAuthError('');
    if (!email.trim() || !password) {
      setAuthError('Please enter your email and password.');
      return;
    }

    if (authTab === 'register') {
      if (password.length < 6) {
        setAuthError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setAuthError('Passwords do not match.');
        return;
      }
    }

    setAuthLoading(true);
    try {
      if (authTab === 'register') {
        const res = await registerAccount(email.trim(), username.trim(), password);
        setCurrentUser(res.user);
        Alert.alert('Welcome!', `Your account is created and ready.`);
      } else {
        const res = await loginAccount(email.trim(), password);
        setCurrentUser(res.user);
      }
      setPassword('');
      setConfirmPassword('');
      loadStatus();
    } catch (err: any) {
      setAuthError(err.message || 'Could not sign in. Please check your info.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logoutAccount();
          setCurrentUser(null);
          setCloudStats(null);
        },
      },
    ]);
  };

  // Backup action
  const handleBackup = async () => {
    setSyncType('backup');
    setSyncState('running');
    setSyncProgress(0);
    setSyncStep('Saving your progress...');

    Animated.timing(progressAnim, {
      toValue: 0.1,
      duration: 200,
      useNativeDriver: false,
    }).start();

    try {
      const res = await backupDataToCloud((step, pct) => {
        setSyncStep(step);
        setSyncProgress(pct);
        Animated.timing(progressAnim, {
          toValue: pct / 100,
          duration: 250,
          useNativeDriver: false,
        }).start();
      });

      setSyncState('success');
      setLastSync(res.updatedAt);
      setCloudStats(res.stats);
      Alert.alert(
        'Progress Saved!',
        `Your study data is backed up safely:\n• ${res.stats.wordsCount} Words\n• ${res.stats.sentencesCount} Sentences\n• ${res.stats.lessonsCount} Lessons`
      );
    } catch (err: any) {
      setSyncState('error');
      Alert.alert('Save Failed', err.message || 'Could not save your progress right now.');
    } finally {
      setTimeout(() => {
        setSyncState('idle');
        setSyncType(null);
      }, 3500);
    }
  };

  // Restore action
  const handleRestore = () => {
    Alert.alert(
      'Restore Saved Progress',
      'This will download your saved progress and update your app. Would you like to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore Now',
          style: 'default',
          onPress: async () => {
            setSyncType('restore');
            setSyncState('running');
            setSyncProgress(0);
            setSyncStep('Restoring your progress...');

            Animated.timing(progressAnim, {
              toValue: 0.1,
              duration: 200,
              useNativeDriver: false,
            }).start();

            try {
              const res = await restoreDataFromCloud((step, pct) => {
                setSyncStep(step);
                setSyncProgress(pct);
                Animated.timing(progressAnim, {
                  toValue: pct / 100,
                  duration: 250,
                  useNativeDriver: false,
                }).start();
              });

              setSyncState('success');
              setLastSync(res.updatedAt);
              setCloudStats(res.stats);
              Alert.alert(
                'Restore Complete!',
                `Your study data has been successfully restored:\n• ${res.stats.wordsCount} Words\n• ${res.stats.sentencesCount} Sentences\n• ${res.stats.lessonsCount} Lessons`
              );
            } catch (err: any) {
              setSyncState('error');
              Alert.alert('Restore Failed', err.message || 'Could not restore progress.');
            } finally {
              setTimeout(() => {
                setSyncState('idle');
                setSyncType(null);
              }, 3500);
            }
          },
        },
      ]
    );
  };

  // Format date nicely
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return 'Not saved yet';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString() + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  // Toggle starter / init data
  const handleToggleInitData = (newValue: boolean) => {
    const action = newValue ? 'restore' : 'remove';
    const title = newValue ? 'Load Starter Content' : 'Hide Starter Content';
    const message = newValue
      ? 'This will re-load all the built-in starter lessons, words, and texts into your library. Continue?'
      : 'This will remove all built-in starter content (lessons, words, sentences, texts, characters, and grammar rules) from your library. Your own added content will not be affected. Continue?';

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: newValue ? 'Load It' : 'Remove It',
        style: newValue ? 'default' : 'destructive',
        onPress: () => {
          setInitDataLoading(true);
          try {
            if (newValue) {
              restoreInitData();
            } else {
              removeInitData();
            }
            setSetting('use_init_data', newValue ? 'true' : 'false');
            setUseInitData(newValue);
            Alert.alert(
              newValue ? 'Starter Content Loaded!' : 'Starter Content Hidden',
              newValue
                ? 'All built-in lessons, words, and texts are now visible in your library.'
                : 'Starter content has been removed. You can restore it anytime from this page.'
            );
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Something went wrong. Please try again.');
          } finally {
            setInitDataLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <Bg1 />
      <Header
        useBackArrow={true}
        label="My Account"
        subtitle="我的账号"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ════════════════════ LOGGED OUT STATE ════════════════════ */}
          {!currentUser ? (
            <View style={styles.authContainer}>
              {/* Friendly Welcome Banner */}
              <View style={styles.heroBanner}>
                <View style={styles.heroIconBox}>
                  <Lucide name="shield-check" size={36} color="#4f46e5" />
                </View>
                <Text style={styles.heroTitle}>Keep Your Progress Safe</Text>
                <Text style={styles.heroSubtitle}>
                  Sign in or create an account to back up all your Chinese words, sentences, and lessons so you never lose them.
                </Text>
              </View>

              {/* Tab Selector */}
              <View style={styles.tabsContainer}>
                <TouchableOpacity
                  style={[styles.tabButton, authTab === 'login' && styles.tabButtonActive]}
                  onPress={() => {
                    setAuthTab('login');
                    setAuthError('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.tabButtonText, authTab === 'login' && styles.tabButtonTextActive]}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabButton, authTab === 'register' && styles.tabButtonActive]}
                  onPress={() => {
                    setAuthTab('register');
                    setAuthError('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      authTab === 'register' && styles.tabButtonTextActive,
                    ]}
                  >
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Form Card */}
              <View style={styles.formCard}>
                {authError ? (
                  <View style={styles.errorAlert}>
                    <Lucide name="alert-circle" size={16} color="#ef4444" />
                    <Text style={styles.errorAlertText}>{authError}</Text>
                  </View>
                ) : null}

                {/* Username field (only on register) */}
                {authTab === 'register' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Your Name / Username</Text>
                    <View style={styles.inputWrapper}>
                      <Lucide name="user" size={18} color="#64748b" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. Alex"
                        placeholderTextColor="#94a3b8"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                )}

                {/* Email field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {authTab === 'login' ? 'Email or Username' : 'Email Address'}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Lucide name="mail" size={18} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={authTab === 'login' ? 'user@example.com or username' : 'user@example.com'}
                      placeholderTextColor="#94a3b8"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Password field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Lucide name="lock" size={18} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="••••••••"
                      placeholderTextColor="#94a3b8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                    >
                      <Lucide
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={18}
                        color="#64748b"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password field (only on register) */}
                {authTab === 'register' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <View style={styles.inputWrapper}>
                      <Lucide name="lock" size={18} color="#64748b" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="••••••••"
                        placeholderTextColor="#94a3b8"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitBtn, authLoading && styles.btnDisabled]}
                  onPress={handleAuthSubmit}
                  disabled={authLoading}
                  activeOpacity={0.8}
                >
                  {authLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Lucide
                        name={authTab === 'login' ? 'log-in' : 'user-plus'}
                        size={18}
                        color="#ffffff"
                      />
                      <Text style={styles.submitBtnText}>
                        {authTab === 'login' ? 'Sign In' : 'Create Account'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* ════════════════════ LOGGED IN STATE ════════════════════ */
            <View style={styles.profileContainer}>
              {/* Profile Card */}
              <View style={styles.profileCard}>
                <View style={styles.profileTopRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarLetter}>
                      {(currentUser.username || currentUser.email || 'U')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileUsername}>{currentUser.username || 'Learner'}</Text>
                    <Text style={styles.profileEmail}>{currentUser.email}</Text>
                    <View style={styles.protectedTag}>
                      <Lucide name="check-circle" size={12} color="#059669" />
                      <Text style={styles.protectedTagText}>Progress Protected & Synced</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                  >
                    <Lucide name="log-out" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.profileDivider} />

                <View style={styles.profileBottomRow}>
                  <View style={styles.metaItem}>
                    <Lucide name="clock" size={14} color="#64748b" />
                    <Text style={styles.metaLabel}>Last Saved:</Text>
                    <Text style={styles.metaValue}>{formatTime(lastSync)}</Text>
                  </View>
                </View>
              </View>

              {/* Sync Progress Bar */}
              {syncState === 'running' && (
                <View style={styles.progressCard}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressTitle}>
                      {syncType === 'backup' ? 'Saving your progress...' : 'Restoring your progress...'}
                    </Text>
                    <Text style={styles.progressPct}>{syncProgress}%</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <Animated.View
                      style={[
                        styles.progressBarFill,
                        {
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressStepText}>{syncStep}</Text>
                </View>
              )}

              {/* Cloud Stats Card (if available) */}
              {cloudStats && (
                <View style={styles.statsCard}>
                  <View style={styles.statsHeader}>
                    <Lucide name="book-open" size={16} color="#4f46e5" />
                    <Text style={styles.statsTitle}>Saved In Your Account</Text>
                  </View>
                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <Text style={styles.statNumber}>{cloudStats.wordsCount}</Text>
                      <Text style={styles.statLabel}>Words</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statNumber}>{cloudStats.sentencesCount}</Text>
                      <Text style={styles.statLabel}>Sentences</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statNumber}>{cloudStats.lessonsCount}</Text>
                      <Text style={styles.statLabel}>Lessons</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statNumber}>{cloudStats.charactersCount}</Text>
                      <Text style={styles.statLabel}>Characters</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Primary Action Buttons Section */}
              <View style={styles.actionsSection}>
                {/* Backup Card */}
                <View style={styles.actionCard}>
                  <View style={styles.actionIconBox}>
                    <Lucide name="cloud-upload" size={24} color="#4f46e5" />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Save My Progress</Text>
                    <Text style={styles.actionDesc}>
                      Back up all your learned vocabulary, sentences, and notes safely.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      styles.backupBtn,
                      syncState === 'running' && styles.btnDisabled,
                    ]}
                    onPress={handleBackup}
                    disabled={syncState === 'running'}
                    activeOpacity={0.8}
                  >
                    {syncState === 'running' && syncType === 'backup' ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Lucide name="upload-cloud" size={16} color="#ffffff" />
                        <Text style={styles.actionBtnText}>Save Now</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Restore Card */}
                <View style={styles.actionCard}>
                  <View style={[styles.actionIconBox, { backgroundColor: '#f0fdf4' }]}>
                    <Lucide name="cloud-download" size={24} color="#059669" />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Restore My Progress</Text>
                    <Text style={styles.actionDesc}>
                      Download your saved study data back to this phone.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      styles.restoreBtn,
                      syncState === 'running' && styles.btnDisabled,
                    ]}
                    onPress={handleRestore}
                    disabled={syncState === 'running'}
                    activeOpacity={0.8}
                  >
                    {syncState === 'running' && syncType === 'restore' ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Lucide name="download-cloud" size={16} color="#ffffff" />
                        <Text style={styles.actionBtnText}>Restore</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign Out Button */}
              {/* <TouchableOpacity
                style={styles.signOutFooterBtn}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Lucide name="log-out" size={16} color="#ffffffff" />
                <Text style={styles.signOutFooterText}>Sign Out</Text>
              </TouchableOpacity> */}
            </View>
          )}

          {/* ════════════════════ STARTER CONTENT TOGGLE ════════════════════ */}
          <View style={styles.initDataCard}>
            <View style={styles.initDataHeader}>
              <View style={styles.initDataIconBox}>
                <Lucide name="package" size={22} color="#f59e0b" />
              </View>
              <View style={styles.initDataInfo}>
                <Text style={styles.initDataTitle}>Starter Content</Text>
                <Text style={styles.initDataSub}>Built-in lessons, words & texts</Text>
              </View>
              {initDataLoading ? (
                <ActivityIndicator size="small" color="#f59e0b" />
              ) : (
                <Switch
                  value={useInitData}
                  onValueChange={handleToggleInitData}
                  trackColor={{ false: '#e2e8f0', true: '#fef3c7' }}
                  thumbColor={useInitData ? '#f59e0b' : '#94a3b8'}
                />
              )}
            </View>

            <Text style={styles.initDataDesc}>
              {useInitData
                ? 'The built-in starter content (3 HSK levels, lessons, words, sentences, texts, characters, and grammar rules) is currently visible in your library.'
                : 'Starter content is currently hidden. Toggle on to restore it to your library at any time.'}
            </Text>

            <View style={[styles.initDataStatusRow, { backgroundColor: useInitData ? '#fffbeb' : '#f8fafc' }]}>
              <Lucide
                name={useInitData ? 'check-circle' : 'eye-off'}
                size={14}
                color={useInitData ? '#d97706' : '#64748b'}
              />
              <Text style={[styles.initDataStatusText, { color: useInitData ? '#d97706' : '#64748b' }]}>
                {useInitData ? 'Starter content is visible' : 'Starter content is hidden'}
              </Text>
            </View>
          </View>

          {/* ════════════════════ APP UPDATES SECTION ════════════════════ */}
          <View style={styles.updatesCard}>
            <View style={styles.updatesHeader}>
              <View style={styles.updatesIconBox}>
                <Lucide name="arrow-up-circle" size={22} color="#2563eb" />
              </View>
              <View style={styles.updatesInfo}>
                <Text style={styles.updatesTitle}>App Updates</Text>
                <Text style={styles.updatesSub}>Installed Version: v{currentVersion}</Text>
              </View>

              <TouchableOpacity
                style={[styles.checkUpdateBtn, checking && { opacity: 0.7 }]}
                onPress={() => checkForUpdates(true)}
                disabled={checking}
                activeOpacity={0.8}
              >
                {checking ? (
                  <ActivityIndicator size="small" color="#2563eb" />
                ) : (
                  <>
                    <Lucide name="refresh-cw" size={13} color="#2563eb" />
                    <Text style={styles.checkUpdateBtnText}>Check Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.updatesStatusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: updateAvailable ? '#ef4444' : '#10b981' },
                ]}
              />
              <Text style={styles.updatesStatusText}>
                {updateAvailable
                  ? `New update available (v${latestVersion})!`
                  : `HanGo is up to date (v${currentVersion})`}
              </Text>
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafce7',
  },
  scrollContent: {
    padding: 5,
    paddingBottom: 40,
  },

  // Auth View
  authContainer: {
    gap: 5,
  },
  heroBanner: {
    alignItems: 'center',
    backgroundColor: '#ffffffe3',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  heroIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eef2ffe9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#ffffffeb',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#4f46e5',
  },

  formCard: {
    backgroundColor: '#ffffffe5',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  errorAlertText: {
    color: '#b91c1c',
    fontSize: 13,
    flex: 1,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  eyeBtn: {
    padding: 8,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },

  // Profile View
  profileContainer: {
    gap: 5,
  },
  profileCard: {
    backgroundColor: '#ffffffe6',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileUsername: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 1,
  },
  protectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
    marginTop: 4,
  },
  protectedTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
  },
  profileDivider: {
    height: 1,
    backgroundColor: '#f1f5f9eb',
    marginVertical: 14,
  },
  profileBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },

  // Progress Bar
  progressCard: {
    backgroundColor: '#ffffffe7',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  progressPct: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4f46e5',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#e2e8f0e3',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4f46e5',
    borderRadius: 4,
  },
  progressStepText: {
    fontSize: 12,
    color: '#64748b',
  },

  // Stats Card
  statsCard: {
    backgroundColor: '#ffffffec',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8fafce9',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4f46e5',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },

  // Actions
  actionsSection: {
    gap: 5,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffffe9',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  actionDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  backupBtn: {
    backgroundColor: '#4f46e5',
  },
  restoreBtn: {
    backgroundColor: '#059669',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  signOutFooterBtn: {
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    backgroundColor: "#e71212ff"
  },
  signOutFooterText: {
    fontSize: 13,
    color: '#ffffffff',
    fontWeight: '600',
  },

  /* Starter Content Toggle Card */
  initDataCard: {
    backgroundColor: '#ffffffe0',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 10,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    marginTop: 8,
  },
  initDataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  initDataIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initDataInfo: {
    flex: 1,
  },
  initDataTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  initDataSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  initDataDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  initDataStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  initDataStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Updates Card
  updatesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  updatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  updatesIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updatesInfo: {
    flex: 1,
  },
  updatesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  updatesSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  checkUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  checkUpdateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  updatesStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  updatesStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
});
