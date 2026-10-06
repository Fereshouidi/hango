import * as Device from 'expo-device';
import { Platform, ScrollView, StyleSheet, Text, Image, useColorScheme, TouchableOpacity } from 'react-native';
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
import { useRouter } from 'expo-router';
import { Bg1 } from '@/components/sub/bg1';

// function getDevMenuHint() {
//   if (Platform.OS === 'web') {
//     return <ThemedText type="small">use browser devtools</ThemedText>;
//   }
//   if (Device.isDevice) {
//     return (
//       <ThemedText type="small">
//         shake device or press <ThemedText type="code">m</ThemedText> in terminal
//       </ThemedText>
//     );
//   }
//   const shortcut = Platform.OS === 'android' ? 'cmd+m (or ctrl+m)' : 'cmd+d';
//   return (
//     <ThemedText type="small">
//       press <ThemedText type="code">{shortcut}</ThemedText>
//     </ThemedText>
//   );
// }

import { useSidebar } from '@/context/sidebar-context';

export default function HomeScreen() {

  const colorScheme = useColorScheme();
  const router = useRouter();
  const { openSidebar } = useSidebar();
  
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

            <Image
              source={require("@/assets/images/logo.png")}
              style={{
                width: 200,
                height: "80%",
              }}
              resizeMode="contain"
            />

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
