import Button from "@/components/Button";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import * as Icon from "phosphor-react-native";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Dimensions, FlatList } from "react-native";

const SolarForecasting = () => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("Today");

  const tabs = ["Today", "Yesterday", "7 Days"];

  const graphData: { [key: string]: { time: string; value: number }[] } = {
    Today: [
      { time: "6:00", value: 20 },
      { time: "8:00", value: 35 },
      { time: "10:00", value: 15 },
      { time: "15:00", value: 30 },
      { time: "17:00", value: 55 },
      { time: "20:00", value: 40 },
      { time: "0:00", value: 45 },
      { time: "5:00", value: 30 },
    ],
    Yesterday: [
      { time: "6:00", value: 15 },
      { time: "8:00", value: 40 },
      { time: "10:00", value: 25 },
      { time: "15:00", value: 35 },
      { time: "17:00", value: 45 },
      { time: "20:00", value: 30 },
      { time: "0:00", value: 20 },
      { time: "5:00", value: 25 },
    ],
    "7 Days": [
      { time: "Mon", value: 50 },
      { time: "Tue", value: 45 },
      { time: "Wed", value: 60 },
      { time: "Thu", value: 55 },
      { time: "Fri", value: 70 },
      { time: "Sat", value: 65 },
      { time: "Sun", value: 80 },
    ],
  };

  const currentData = graphData[selectedTab];
  const graphWidth = 320;
  const graphHeight = 150;
  const maxValue = 100;

  const calculateY = (value: number) => graphHeight - (value / maxValue) * graphHeight;

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const locationName = "Malabe, Sri Lanka";

  const predictions = [
  
  { id: "1", label: "2 Days Ago", value: 14.7 },
  { id: "2", label: "Yesterday", value: 16.2 },
  { id: "3", label: "Today", value: 18.5 },
];

const { width } = Dimensions.get("window");
const cardWidth = width * 0.75;

  return (
    <ScreenWrapper>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>

          <View style={styles.main}>
            {/* Header */}
            <View style={styles.header}>
              <Typo size={28} fontWeight="700" color={colors.textPrimary}>
                Solar Energy Prediction
              </Typo>
              <Typo size={16} color={colors.textSecondary} style={{ marginTop: 4 }}>
                {formattedDate}
              </Typo>
              <View style={styles.locationRow}>
                <Icon.MapPin size={18} color="#FF4500" weight="fill" />
                <Typo size={16} color={colors.textPrimary} style={{ marginLeft: 6 }}>
                  {locationName}
                </Typo>
              </View>
            </View>

<FlatList
  data={predictions}
  horizontal
  showsHorizontalScrollIndicator={false}
  snapToInterval={cardWidth + 20}
  decelerationRate="fast"
  contentContainerStyle={{ paddingHorizontal: (width - cardWidth) / 2 }}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View style={[styles.sliderCard, { width: cardWidth }]}>
      <Typo size={20} fontWeight="700" color="#fff">
        {item.label}
      </Typo>

      <View style={styles.valueRow}>
        <Typo size={48} fontWeight="700" color="#fff">
          {item.value}
        </Typo>
        <Typo size={22} color="#fff"> kWh</Typo>
      </View>

      <Typo size={14} color="#fff">
        *Predicted solar energy for the day
      </Typo>
    </View>
  )}
/>

            {/* Tab Selector */}
            <View style={styles.tabContainer}>
              {tabs.map((tab) => (
                <Pressable
                  key={tab}
                  style={[
                    styles.tabButton,
                    selectedTab === tab && styles.activeTab
                  ]}
                  onPress={() => setSelectedTab(tab)}
                >
                  <Typo
                    size={16}
                    fontWeight="700"
                    color={selectedTab === tab ? "#fff" : colors.textSecondary}
                  >
                    {tab}
                  </Typo>
                </Pressable>
              ))}
            </View>

            {/* Graph Section */}
            <View style={styles.graphSection}>
              <Typo size={14} fontWeight="600" color={colors.textSecondary} style={styles.graphTitle}>
                ENERGY GENERATION (kWh)
              </Typo>
              
              <View style={styles.graphCard}>
                <View style={styles.graphLabelsY}>
                  <Typo size={10} color={colors.textSecondary}>Aug</Typo>
                  <Typo size={10} color={colors.textSecondary}>1</Typo>
                </View>

                <View style={styles.chartArea}>
                  {/* Grid Lines */}
                  {[0, 1, 2, 3].map((i) => (
                    <View 
                      key={i} 
                      style={[
                        styles.gridLine, 
                        { left: (i * graphWidth) / 4 }
                      ]} 
                    />
                  ))}

                  {/* Line Chart */}
                  <View style={styles.svgContainer}>
                    {currentData.map((point, index) => {
                      if (index === 0) return null;
                      const prev = currentData[index - 1];
                      const x1 = ((index - 1) / (currentData.length - 1)) * graphWidth;
                      const y1 = calculateY(prev.value);
                      const x2 = (index / (currentData.length - 1)) * graphWidth;
                      const y2 = calculateY(point.value);

                      const angle = Math.atan2(y2 - y1, x2 - x1);
                      const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

                      return (
                        <View
                          key={index}
                          style={[
                            styles.lineSegment,
                            {
                              left: x1,
                              top: y1,
                              width: dist,
                              transform: [{ rotate: `${(angle * 180) / Math.PI}deg` }],
                            },
                          ]}
                        />
                      );
                    })}

                    {/* Dots */}
                    {currentData.map((point, index) => {
                      const x = (index / (currentData.length - 1)) * graphWidth;
                      const y = calculateY(point.value);
                      return (
                        <View
                          key={`dot-${index}`}
                          style={[styles.dataDot, { left: x - 4, top: y - 4 }]}
                        />
                      );
                    })}
                  </View>
                </View>

                {/* X Axis Labels */}
                <View style={styles.xAxis}>
                  {currentData.map((point, index) => (
                    <Typo key={index} size={9} color={colors.textSecondary}>
                      {point.time}
                    </Typo>
                  ))}
                </View>
              </View>
            </View>

            {/* Weather Report Button */}
            <Button 
              style={styles.weatherButton}
              onPress={() => router.push("/(tabs)/weatherReport")}
            >
              <Typo size={18} fontWeight="700" color="#fff">
                Weather Report {">"}
              </Typo>
            </Button>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default SolarForecasting;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacingY._30,
  },
  backgroundText: {
    position: "absolute",
    top: verticalScale(400),
    alignSelf: "center",
    opacity: 0.06,
    textTransform: "uppercase",
    letterSpacing: 4,
    zIndex: -1,
  },
  main: {
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._20,
    gap: spacingY._25,
  },
  header: {
    gap: spacingY._5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacingY._5,
  },
  predictionRow: {
  flexDirection: "row",
  gap: spacingX._10,
},

sliderCard: {
  backgroundColor: "#32CD32",
  borderRadius: 24,
  padding: spacingX._20,
  marginHorizontal: 10,
  justifyContent: "center",
  shadowColor: "#32CD32",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.3,
  shadowRadius: 12,
  elevation: 8,
},
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginVertical: spacingY._5,
  },
  tabContainer: {
    flexDirection: "row",
    gap: spacingX._15,
  },
  tabButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#32CD32",
  },
  graphSection: {
    gap: spacingY._15,
  },
  graphTitle: {
    letterSpacing: 1,
  },
  graphCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 24,
    padding: spacingX._20,
    height: 250,
  },
  graphLabelsY: {
    position: "absolute",
    left: 15,
    top: 40,
    alignItems: "center",
  },
  chartArea: {
    flex: 1,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  svgContainer: {
    flex: 1,
    position: "relative",
  },
  lineSegment: {
    position: "absolute",
    height: 2,
    backgroundColor: "#ADFF2F",
    transformOrigin: "left center",
  },
  dataDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ADFF2F",
    borderWidth: 2,
    borderColor: "#0A1E28",
    zIndex: 2,
  },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  weatherButton: {
    backgroundColor: "#32CD32",
    height: 60,
    borderRadius: 15,
    marginTop: spacingY._10,
  },
});
