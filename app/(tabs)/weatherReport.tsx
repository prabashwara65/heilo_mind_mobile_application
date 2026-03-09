import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import * as Icon from "phosphor-react-native";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

const WeatherReport = () => {
  const weatherMetrics = [
    { 
      label: "Temperature", 
      value: "24", 
      unit: "°C", 
      icon: "SunIcon", 
      color: "#FFFBEB" 
    },
    { 
      label: "Irradiance", 
      value: "850", 
      unit: "w/m*2", 
      icon: "LightningIcon", 
      color: "#FFFBEB" 
    },
    { 
      label: "Cloud Cover", 
      value: "15", 
      unit: "%", 
      icon: "CloudSunIcon", 
      color: "#32CD32",
      isHighlight: true 
    },
    { 
      label: "Humidity", 
      value: "62", 
      unit: "%", 
      icon: "WindIcon", 
      color: "#FFFBEB" 
    },
  ];

  const historicalData = [
    { label: "Avg. Sunlight Hours", value: "8.2 hrs/day", isYellow: true },
    { label: "7-Day Avg. Energy", value: "17.5 kWh", isYellow: true },
    { label: "Peak Generation Time", value: "12.00 - 2.00 PM", isYellow: true },
  ];

  return (
    <ScreenWrapper>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.main}>
            {/* Title */}
            <Typo size={28} fontWeight="700" color={colors.textPrimary} style={styles.pageTitle}>
              Today's Weather
            </Typo>

            {/* Weather Grid */}
            <View style={styles.grid}>
              {weatherMetrics.map((item, index) => {
                const WeatherIcon = (Icon as any)[item.icon];
                return (
                  <View 
                    key={index} 
                    style={[
                      styles.metricCard, 
                      { backgroundColor: item.color }
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      {WeatherIcon && (
                        <WeatherIcon 
                          size={28} 
                          color={item.isHighlight ? "#fff" : "#000"} 
                          weight="regular" 
                        />
                      )}
                    </View>
                    <View style={styles.cardContent}>
                      <Typo 
                        size={14} 
                        fontWeight="600" 
                        color={item.isHighlight ? "#fff" : "#444"}
                      >
                        {item.label}
                      </Typo>
                      <View style={styles.valueRow}>
                        <Typo 
                          size={24} 
                          fontWeight="700" 
                          color={item.isHighlight ? "#fff" : "#000"}
                        >
                          {item.value}
                        </Typo>
                        <Typo 
                          size={14} 
                          fontWeight="600" 
                          color={item.isHighlight ? "#fff" : "#444"}
                          style={{ marginLeft: 4, marginBottom: 2 }}
                        >
                          {item.unit}
                        </Typo>
                      </View>
                    </View>
                    {item.isHighlight && (
                      <View style={styles.loadingContainer}>
                         <Icon.CircleNotchIcon size={24} color="#fff" style={styles.spinningIcon} />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Historical Summary */}
            <View style={styles.historySection}>
              <Typo size={24} fontWeight="700" color={colors.textPrimary} style={styles.historyTitle}>
                Historical Data Summary
              </Typo>

              <View style={styles.historyList}>
                {historicalData.map((data, index) => (
                  <View key={index} style={styles.historyItem}>
                    <Typo size={16} fontWeight="600" color={colors.textPrimary}>
                      {data.label}
                    </Typo>
                    <Typo 
                      size={16} 
                      fontWeight="700" 
                      color={data.isYellow ? "#FFD700" : colors.textPrimary}
                    >
                      {data.value}
                    </Typo>
                    <View style={styles.separator} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default WeatherReport;

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
    gap: spacingY._30,
  },
  pageTitle: {
    marginBottom: spacingY._10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacingY._15,
  },
  metricCard: {
    width: "47%",
    height: 140,
    borderRadius: 24,
    padding: spacingX._20,
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  cardHeader: {
    marginBottom: spacingY._10,
  },
  cardContent: {
    gap: 4,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  loadingContainer: {
    position: "absolute",
    right: 15,
    bottom: 15,
  },
  spinningIcon: {
    opacity: 0.8,
  },
  historySection: {
    marginTop: spacingY._20,
    gap: spacingY._25,
  },
  historyTitle: {
    marginBottom: spacingY._10,
  },
  historyList: {
    gap: spacingY._30,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: spacingY._15,
    position: "relative",
  },
  separator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});
