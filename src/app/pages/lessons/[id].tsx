import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { ThemedView } from '@/components/themed-view'
import { ThemedText } from '@/components/themed-text'
import { getAllHSKs, getAllLessons, getLessonsByHSKId } from '@/db/utils'
import { HSKType, LessonType } from '@/types'
import Header from '@/components/main/header'
import { Bg1 } from '@/components/sub/bg1'
import { randomColors } from '@/constants/theme'
import Lucide from '@react-native-vector-icons/lucide'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'

const Lessons = () => {
  const params = useLocalSearchParams<{ id?: string; hskId?: string }>();
  const rawId = params.hskId || params.id;
  const hskId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : 0;
  const [lessons, setLessons] = useState<LessonType[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    try {
      let data: LessonType[] = [];
      if (hskId > 0) {
        data = getLessonsByHSKId(hskId) as unknown as LessonType[];
      } else {
        data = getAllLessons() as unknown as LessonType[];
      }
      setLessons(data);
    } catch (e) {
      console.error('Failed to load lessons:', e);
    }
  }, [hskId]);

  // Reload lessons when page gains focus (e.g. returning from addLesson)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => {
      setRefreshing(false);
    }, 400);
  }, [loadData]);

  return (
    <ThemedView
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: 'transparent'
      }}
    >
      <Bg1 />
      <Header
        useBackArrow={true}
        label="Lessons"
        items={[
          <TouchableOpacity
            key="add"
            onPress={() => router.push('/pages/addLesson')}
          >
            <Lucide
              name="plus"
              size={20}
              color="#373737ff"
              style={{
                fontSize: 22,
                backgroundColor: "#e8e8e8ff",
                borderRadius: 50,
                width: 40,
                height: 40,
                textAlign: "center",
                textAlignVertical: "center",
                borderWidth: 1,
                borderColor: "#414040ff"
              }}
            />
          </TouchableOpacity>,
          <TouchableOpacity
            key="delete"
            onPress={() => { alert("delete clicked") }}
          >
            <Lucide
              name="trash"
              size={20}
              color="#373737ff"
              style={{
                fontSize: 22,
                backgroundColor: "#e8e8e8ff",
                borderRadius: 50,
                width: 40,
                height: 40,
                textAlign: "center",
                textAlignVertical: "center",
                borderWidth: 1,
                borderColor: "#414040ff"
              }}
            />
          </TouchableOpacity>
        ]}
      />

      <ScrollView
        contentContainerStyle={{
          width: "100%",
          display: "flex",
          alignItems: 'center',
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingBottom: 20,
          paddingTop: 5
        }}
        style={{
          width: "100%",
          flex: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={["#3b82f6"]}
          />
        }
      >
        {
          lessons?.length > 0 ? (
            lessons.map((lesson, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={() => router.push({
                  pathname: '/pages/lessonDetails/[id]',
                  params: { lessonId: lesson.id }
                } as any)}
                style={{
                  display: "flex",
                  width: "48%",
                  height: 200,
                  backgroundColor: randomColors[index % randomColors.length],
                  margin: "1%",
                  borderRadius: 10,
                  padding: 15,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 1
                }}
              >
                <ThemedText
                  style={{
                    fontSize: 15,
                    marginTop: 10
                  }}
                >
                  {lesson.title}
                </ThemedText>
              </TouchableOpacity>
            ))
          ) : (
            <ThemedText style={{ padding: 20, textAlign: 'center', width: '100%' }}>
              No lessons found
            </ThemedText>
          )
        }
      </ScrollView>
    </ThemedView>
  )
}

export default Lessons

const styles = StyleSheet.create({})