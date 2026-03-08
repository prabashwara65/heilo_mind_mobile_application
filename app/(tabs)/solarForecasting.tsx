import Button from "@/components/Button";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import * as Icon from "phosphor-react-native";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";

const SOLAR_PREDICTION_API_URL =
  process.env.EXPO_PUBLIC_SOLAR_PREDICTION_API_URL as string;
const SOLAR_RESULT_API_URL =
  process.env.EXPO_PUBLIC_SOLAR_RESULT_API_URL as string;
const SOLAR_DEVICE_ID = process.env.EXPO_PUBLIC_SOLAR_DEVICE_ID as string;

const SolarForecasting = () => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("Today");
  const [isPredicting, setIsPredicting] = useState(false);

  const tabs = ["Today", "Tomorrow", "7 Days"];

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
    Tomorrow: [
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

  const calculateY = (value: number) =>
    graphHeight - (value / maxValue) * graphHeight;

  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const normalizeApiPayload = (payload: any) => {
    if (payload && typeof payload.body === "string") {
      try {
        return JSON.parse(payload.body);
      } catch {
        return payload;
      }
    }

    return payload;
  };

  const isResultPending = (status: number, payload: any) => {
    const message = String(
      payload?.error || payload?.message || payload?.details || ""
    ).toLowerCase();

    return (
      status === 404 ||
      status === 202 ||
      status === 429 ||
      message.includes("not ready") ||
      message.includes("not found") ||
      message.includes("pending")
    );
  };

  const extractSolarResultValue = (payload: any) => {
    return (
      payload?.prediction ??
      payload?.data?.prediction ??
      payload?.result?.prediction ??
      payload?.total_energy_kwh ??
      payload?.data?.total_energy_kwh ??
      payload?.result?.total_energy_kwh
    );
  };

  /**
   * Fetch prediction result from API with retries
   */
  const fetchPredictionResult = async (requestId: string) => {
    if (!SOLAR_RESULT_API_URL) {
      throw new Error("Solar result API URL is not configured.");
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        const url = `${SOLAR_RESULT_API_URL}?requestId=${encodeURIComponent(
          requestId
        )}`;
        console.log(`Attempt ${attempt + 1} GET:`, url);

        const response = await fetch(url);
        const rawResultData = await response.json().catch(() => ({}));
        const resultData = normalizeApiPayload(rawResultData);

        if (isResultPending(response.status, resultData)) {
          console.log(`Result not ready yet (${response.status}), retrying...`);
          throw new Error("Result not ready");
        }

        if (!response.ok) {
          const errorMessage =
            resultData?.error ||
            resultData?.details ||
            `HTTP ${response.status}`;
          throw new Error(errorMessage);
        }

        const hasPrediction = extractSolarResultValue(resultData) !== undefined;
        const isSuccessfulPayload =
          String(
            resultData?.status ??
              resultData?.data?.status ??
              resultData?.result?.status ??
              ""
          ).toLowerCase() === "success";

        if (hasPrediction || isSuccessfulPayload) {
          return resultData;
        }
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error("Failed to fetch result");
      }

      await wait(2000); // wait 2s before retry
    }

    if (lastError) throw lastError;
    throw new Error("Prediction result not available after multiple attempts.");
  };

  const handleGetPredictions = async () => {
    if (isPredicting) return;
    if (!SOLAR_PREDICTION_API_URL) {
      Alert.alert("Configuration Error", "Solar prediction API URL is missing.");
      return;
    }
    if (!SOLAR_DEVICE_ID) {
      Alert.alert("Configuration Error", "Solar device ID is missing.");
      return;
    }

    const requestId = `EN-${Date.now()}`;

    try {
      setIsPredicting(true);

      // 1️⃣ Send prediction request
      const response = await fetch(SOLAR_PREDICTION_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: SOLAR_DEVICE_ID,
          requestId,
        }),
      });

      const rawData = await response.json().catch(() => ({}));
      const data = normalizeApiPayload(rawData);

      if (!response.ok) {
        const errorMessage =
          data?.error || data?.details || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      console.log("Prediction request sent:", data);

      // 2️⃣ Fetch prediction result (with retry)
      const effectiveRequestId =
        data?.requestId || data?.requestid || data?.data?.requestId || requestId;
      const resultData = await fetchPredictionResult(effectiveRequestId);
      console.log("Prediction result fetched:", resultData);

      const returnedRequestId =
        resultData?.requestId ??
        resultData?.requestid ??
        resultData?.data?.requestId ??
        effectiveRequestId;
      const predictionValue = extractSolarResultValue(resultData);
      const predictionText =
        typeof predictionValue === "number"
          ? `${predictionValue} kWh`
          : typeof predictionValue === "object"
          ? JSON.stringify(predictionValue)
          : String(predictionValue ?? "N/A");

      // 3️⃣ Show Alert
      Alert.alert(
        "Prediction Received",
        `Request ID: ${returnedRequestId}\nPrediction: ${predictionText}`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to trigger prediction";
      Alert.alert("Request Failed", message);
      console.log("Prediction error:", error);
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Watermark */}
          <Typo
            size={70}
            fontWeight="800"
            color={colors.textSecondary}
            style={styles.backgroundText}
          >
            Solar Monitor
          </Typo>

          <View style={styles.main}>
            {/* Header */}
            <View style={styles.header}>
              <Typo size={28} fontWeight="700" color={colors.textPrimary}>
                Solar Energy Prediction
              </Typo>
              <Typo size={16} color={colors.textSecondary} style={{ marginTop: 4 }}>
                Wednesday, December 16, 2025
              </Typo>
              <View style={styles.locationRow}>
                <Icon.MapPin size={18} color="#FF4500" weight="fill" />
                <Typo size={16} color={colors.textPrimary} style={{ marginLeft: 6 }}>
                  Tangalle, Sri Lanka
                </Typo>
              </View>
            </View>

            {/* Prediction Card */}
            <View style={styles.predictionCard}>
              <Typo size={20} fontWeight="700" color="#fff">
                Today Predicted Energy Generation
              </Typo>
              <View style={styles.valueRow}>
                <Typo size={56} fontWeight="800" color="#fff">
                  18.5
                </Typo>
                <Typo size={24} fontWeight="600" color="#fff" style={{ marginLeft: 8, marginBottom: 10 }}>
                  kWh
                </Typo>
              </View>
              <Typo size={14} color="#fff" style={{ opacity: 0.9 }}>
                Expected energy generation
              </Typo>
            </View>

            {/* Tab Selector */}
            <View style={styles.tabContainer}>
              {tabs.map((tab) => (
                <Pressable
                  key={tab}
                  style={[styles.tabButton, selectedTab === tab && styles.activeTab]}
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
                <View style={styles.chartArea}>
                  {/* Line Chart */}
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
                          { left: x1, top: y1, width: dist, transform: [{ rotate: `${(angle * 180) / Math.PI}deg` }] },
                        ]}
                      />
                    );
                  })}
                  {currentData.map((point, index) => {
                    const x = (index / (currentData.length - 1)) * graphWidth;
                    const y = calculateY(point.value);
                    return <View key={index} style={[styles.dataDot, { left: x - 4, top: y - 4 }]} />;
                  })}
                </View>
                <View style={styles.xAxis}>
                  {currentData.map((point, index) => (
                    <Typo key={index} size={9} color={colors.textSecondary}>
                      {point.time}
                    </Typo>
                  ))}
                </View>
              </View>
            </View>

            {/* Prediction Button */}
            <Pressable
              style={[styles.predictionButton, isPredicting && styles.buttonDisabled]}
              onPress={handleGetPredictions}
              disabled={isPredicting}
            >
              <Typo size={16} fontWeight="700" color="#000">
                {isPredicting ? "Requesting..." : "Get Predictions"}
              </Typo>
            </Pressable>

            {/* Weather Report Button */}
            <Button style={styles.weatherButton} onPress={() => router.push("/(tabs)/weatherReport")}>
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
  container: { flex: 1 },
  scrollContent: { paddingBottom: spacingY._30 },
  backgroundText: {
    position: "absolute",
    top: verticalScale(400),
    alignSelf: "center",
    opacity: 0.06,
    textTransform: "uppercase",
    letterSpacing: 4,
    zIndex: -1,
  },
  main: { paddingHorizontal: spacingX._20, paddingVertical: spacingY._20, gap: spacingY._25 },
  header: { gap: spacingY._5 },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: spacingY._5 },
  predictionCard: {
    backgroundColor: "#32CD32",
    borderRadius: 24,
    padding: spacingX._20,
    shadowColor: "#32CD32",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  valueRow: { flexDirection: "row", alignItems: "baseline", marginVertical: spacingY._5 },
  tabContainer: { flexDirection: "row", gap: spacingX._15 },
  tabButton: { flex: 1, height: 50, borderRadius: 12, backgroundColor: "#F5F5F5", justifyContent: "center", alignItems: "center" },
  activeTab: { backgroundColor: "#32CD32" },
  graphSection: { gap: spacingY._15 },
  graphTitle: { letterSpacing: 1 },
  graphCard: { backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: 24, padding: spacingX._20, height: 250 },
  chartArea: { flex: 1, marginTop: 20, borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.1)", position: "relative" },
  lineSegment: { position: "absolute", height: 2, backgroundColor: "#ADFF2F", transformOrigin: "left center" },
  dataDot: { position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: "#ADFF2F", borderWidth: 2, borderColor: "#0A1E28", zIndex: 2 },
  xAxis: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  predictionButton: { backgroundColor: "#ADFF2F", height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  buttonDisabled: { opacity: 0.7 },
  weatherButton: { backgroundColor: "#32CD32", height: 60, borderRadius: 15, marginTop: spacingY._10 },
});
