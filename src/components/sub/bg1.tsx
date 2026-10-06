import { Image } from 'react-native'
import React from 'react'
import { ThemedView } from '../themed-view'

export const Bg1 = () => {
  return (
    <ThemedView
        style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
        }}
    >
    <Image
        source={require("@/assets/images/bg1.png")}
        style={{
            width: "100%",
        height: "100%",
        }}
    />
    </ThemedView>
  )
}
