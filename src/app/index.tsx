import React, { useCallback, useState } from 'react';
import * as Device from 'expo-device';
import { Platform, ScrollView, StyleSheet, Text, Image, useColorScheme, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { HintRow } from '@/components/hint-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { homeScreenItems } from '@/constants/data';
import { Lucide } from '@react-native-vector-icons/lucide';
import Header from '@/components/main/header';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bg1 } from '@/components/sub/bg1';
import { getStoredUser, User } from '@/services/authSyncService';

import { useSidebar } from '@/context/sidebar-context';

export default function HomeScreen() {

  const colorScheme = useColorScheme();
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const [user, setUser] = useState<User | null>(null);

  useFocusEffect(
    useCallback(() => {
      getStoredUser().then(setUser);
    }, [])
  );
  
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.safeArea}>

        
        <ThemedView
          style={{
            width: "100%",
            padding: 0,
            backgroundColor: "transparent",
            flex: 1
          }}
        >

          <Bg1/>


          {/* header */}
          <ThemedView
            style={{
              width: "100%",
              height: 60,
              backgroundColor: "#f3f4f6ff",
              zIndex: 999,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 10,
              position: "relative",
            }}
          >
            <TouchableOpacity
              onPress={openSidebar}
              style={{
                position: 'absolute',
                left: 10,
                width: 40,
                height: 40,
                borderRadius: 50,
                backgroundColor: "#e8e8e8ff",
                borderWidth: 1,
                borderColor: "#414040ff",
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <Lucide name="menu" size={20} color="#373737ff" />
            </TouchableOpacity>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Image
                source={require("@/assets/images/logo/normalScale.jpg")}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                }}
                resizeMode="cover"
              />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  letterSpacing: 0.5,
                }}
              >
                HanGo
              </Text>
            </View>

            {/* Account & Sync button */}
            <TouchableOpacity
              onPress={() => router.push('/pages/sync' as any)}
              style={{
                position: 'absolute',
                right: 10,
                width: 40,
                height: 40,
                borderRadius: 50,
                backgroundColor: "#e8e8e8ff",
                borderWidth: 1,
                borderColor: "#414040ff",
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <Lucide name="user" size={20} color="#373737ff" />
              {user && (
                <View
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 9,
                    height: 9,
                    borderRadius: 5,
                    backgroundColor: '#16a34a',
                    borderWidth: 1.5,
                    borderColor: '#ffffff',
                  }}
                />
              )}
            </TouchableOpacity>

          </ThemedView>

          <ScrollView
            contentContainerStyle={{
              width: "100%",
              display: "flex",
              alignItems: 'center',
              flexDirection: 'row',
              flexWrap: 'wrap',
              paddingBottom: 20,
            }}
            style={{
              width: "100%",
              flex: 1,
              
            }}
          >
            {homeScreenItems.map((item, index) => (
              <TouchableOpacity 
                key={index}
                activeOpacity={0.8}
                onPress={() => {
                  if (item.target === 'pages/hsks' || item.target === 'pages/lessons') {
                    router.push(`/${item.target}/[id]` as any);
                  } else {
                    router.push(`/${item.target}` as any);
                  }
                }}
                style={{
                  display: "flex",
                  width: "48%",
                  height: 200,
                  backgroundColor: item.color,
                  margin: "1%",
                  borderRadius: 10,
                  padding: 15,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 1
                }}
              >
                <Lucide
                  name={item.icon as any}
                  size={52}
                  color="#FFF"
                />
                <ThemedText
                  style={{
                    fontSize: 15,
                    marginTop: 10
                  }}
                >
                  {item.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>

        </ThemedView>
        {Platform.OS === 'web' && <WebBadge />}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    backgroundColor: "transparent",
    width: "100%",
    alignItems: 'center',
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    // alignItems: 'center',
    // justifyContent: 'center',
    // flex: 1,
    // paddingHorizontal: Spacing.four,
    // gap: Spacing.four,
  },


});
