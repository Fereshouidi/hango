import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, Image } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { useEffect } from 'react';
import { getAllCharacters, getAllHSKs, getAllLessons, getAllRules, getAllSentences, getAllTexts, getCharactersByTextId, getLessonsByHSKId, getRulesByHSKId, getRulesByLessonId, getSentencesByLessonId, getTextsByLessonId, getWordsBySentenceId, initDatabase, resetDatabase } from '@/db/utils';
// import HomeScreen from '.';
import { ThemedView } from '@/components/themed-view';
import { SidebarProvider, useSidebar } from '@/context/sidebar-context';
import { Sidebar } from '@/components/main/sidebar';

SplashScreen.preventAutoHideAsync();

const SidebarWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isOpen, openSidebar, closeSidebar } = useSidebar();
  return (
    <Sidebar isOpen={isOpen} onOpen={openSidebar} onClose={closeSidebar}>
      {children}
    </Sidebar>
  );
};

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    
    initDatabase();
  }, [])

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SidebarProvider>
        <SidebarWrapper>
          <ThemedView
            style={{
              width: "100%",
              height: "100%",
            }}
          >
            <View style={{
              display: 'flex', 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '100%', 
              height: 45, 
              backgroundColor: colorScheme === 'dark' ? DarkTheme.colors.background : DefaultTheme.colors.background
            }}></View>

            <Image
              source={require("@/assets/images/bg1.png")}
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                zIndex: 0,
                opacity: 0.1
              }}
            />
            <Stack>
                <Stack.Screen
                    name="index"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/hsks/[id]"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/lessons/[id]"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/addHSK"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/addLesson"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/addText"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/addSentence"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/addWord"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/addCharacter"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/addRule"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/lessonDetails/[id]"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/sentences/[id]"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/sentenceDetails/[id]"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/hskDetails/[id]"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/characterDetails/[id]"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/characterWrite/[id]"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/characterWrite/index"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/writing/index"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/listeningLoop/index"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/wordDetails/[id]"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/ruleDetails/[id]"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/sentences/index"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/texts/[id]"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/texts/index"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/textDetails/[id]"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/textDetails/index"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/words/[id]"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/words/index"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/characters/[id]"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/characters/index"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/rules/[id]"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/rules/index"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="pages/instructions/index"
                    options={{ headerShown: false }}
                />

            </Stack>
          </ThemedView>
        </SidebarWrapper>

        <AnimatedSplashOverlay />
      </SidebarProvider>
    </ThemeProvider>
  );
}
