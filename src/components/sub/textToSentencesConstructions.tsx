import Lucide from '@react-native-vector-icons/lucide'
import React, { useState } from 'react'
import { TouchableOpacity, View, Text } from 'react-native'

export const TextToSentencesConstructions = () => {

    const [showInstructions, setShowInstructions] = useState(false);
    
  return (
    <View
        style={{
            width: "100%",
            paddingHorizontal: 0,
            marginBottom: 10,
        }}
    >
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowInstructions(!showInstructions)}
            style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingVertical: 0,
            }}
        >
            <Lucide
                name={showInstructions ? "circle-x" : "circle-help"}
                size={15}
                color="#3B82F6"
            />

            <Text
                style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: "#3B82F6",
                }}
            >
                {showInstructions ? "Hide instructions" : "Show instructions"}
            </Text>
        </TouchableOpacity>

        {showInstructions && (
            <View
                style={{
                    backgroundColor: "#EFF6FF",
                    borderWidth: 1,
                    borderColor: "#BFDBFE",
                    borderRadius: 12,
                    padding: 15,
                    marginTop: 4,
                }}
            >
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 10,
                    }}
                >
                    <Lucide
                        name="info"
                        size={18}
                        color="#2563EB"
                    />

                    <Text
                        style={{
                            fontSize: 16,
                            fontWeight: "700",
                            color: "#1E3A8A",
                        }}
                    >
                        Text Input Instructions
                    </Text>
                </View>

                <Text
                    style={{
                        fontSize: 14,
                        lineHeight: 21,
                        color: "#374151",
                        marginBottom: 10,
                    }}
                >
                    To display the text correctly with Pinyin and translation,
                    sentence by sentence, please follow these instructions:
                </Text>

                <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                        <Text style={{ fontWeight: "700", color: "#2563EB" }}>
                            1.
                        </Text>

                        <Text
                            style={{
                                flex: 1,
                                fontSize: 14,
                                lineHeight: 21,
                                color: "#374151",
                            }}
                        >
                            Put a period (.) at the end of every sentence in all
                            three fields: Chinese text, Pinyin, and translation.
                        </Text>
                    </View>

                    <View style={{ flexDirection: "row", gap: 8 }}>
                        <Text style={{ fontWeight: "700", color: "#2563EB" }}>
                            2.
                        </Text>

                        <Text
                            style={{
                                flex: 1,
                                fontSize: 14,
                                lineHeight: 21,
                                color: "#374151",
                            }}
                        >
                            The number of sentences must be the same in all three
                            fields. Each Chinese sentence will be matched with
                            its corresponding Pinyin and translation.
                        </Text>
                    </View>
                </View>

                <View
                    style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: 8,
                        padding: 10,
                        marginTop: 12,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 13,
                            fontWeight: "700",
                            color: "#374151",
                            marginBottom: 5,
                        }}
                    >
                        Example:
                    </Text>

                    <Text style={{ fontSize: 13, color: "#DC2626" }}>
                        Chinese: 你好。你叫什么名字？
                    </Text>

                    <Text style={{ fontSize: 13, color: "#7C3AED", marginTop: 3 }}>
                        Pinyin: Nǐ hǎo. Nǐ jiào shénme míngzi?
                    </Text>

                    <Text style={{ fontSize: 13, color: "#059669", marginTop: 3 }}>
                        Translation: Hello. What is your name?
                    </Text>
                </View>

                <Text
                    style={{
                        fontSize: 12,
                        lineHeight: 18,
                        color: "#6B7280",
                        marginTop: 10,
                    }}
                >
                    This allows the system to correctly match each Chinese
                    sentence with its Pinyin and translation.
                </Text>
            </View>
        )}
    </View>
  )
}
