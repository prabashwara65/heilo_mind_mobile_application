import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import * as Icon from "phosphor-react-native";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";

const BATTERY_PREDICTION_API_URL =
  process.env.EXPO_PUBLIC_BATTERY_PREDICTION_API_URL as string;
const BATTERY_RESULT_API_URL =
  process.env.EXPO_PUBLIC_BATTERY_RESULT_API_URL as string;
const BATTERY_DEVICE_ID = process.env.EXPO_PUBLIC_SOLAR_DEVICE_ID as string;

const BatteryOptimization = () => {
  const [batteryLevel] = useState(12);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictedRuntime, setPredictedRuntime] = useState<string | null>(null);

  const router = useRouter();

  const handlePowerDrainingPress = () => {
    router.push("/battery_runtime/page");
  };

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  const extractBatteryResultValue = (payload: any) => {
    return (
      payload?.prediction ??
      payload?.data?.prediction ??
      payload?.result?.prediction ??
      payload?.runtime_optimized_hours ??
      payload?.data?.runtime_optimized_hours ??
      payload?.result?.runtime_optimized_hours
    );
  };

  // GET prediction result with retry
  const fetchBatteryResult = async (requestId: string) => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        const url = `${BATTERY_RESULT_API_URL}?requestId=${encodeURIComponent(
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
            resultData?.error || resultData?.details || `HTTP ${response.status}`;
          throw new Error(errorMessage);
        }

        const hasPrediction = extractBatteryResultValue(resultData) !== undefined;
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
        lastError = error instanceof Error ? error : new Error("Failed to fetch result");
      }

      await wait(2000); // wait 2s before retry
    }

    if (lastError) throw lastError;
    throw new Error("Battery prediction not available after multiple attempts.");
  };

  const handleGetPredictions = async () => {
    if (isPredicting) return;

    const requestId = `BA-${Date.now()}`;

    try {
      setIsPredicting(true);
      setPredictedRuntime(null);

      // 1️⃣ POST prediction request
      const response = await fetch(BATTERY_PREDICTION_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: BATTERY_DEVICE_ID,
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

      console.log("Battery prediction request sent:", data);

      // 2️⃣ GET prediction result with retry
      const effectiveRequestId =
        data?.requestId || data?.requestid || data?.data?.requestId || requestId;
      const resultData = await fetchBatteryResult(effectiveRequestId);
      console.log("Battery prediction result fetched:", resultData);

      const predictionValue = extractBatteryResultValue(resultData);

      const predictionText =
        typeof predictionValue === "number"
          ? `${predictionValue.toFixed(2)}h`
          : typeof predictionValue === "object"
          ? JSON.stringify(predictionValue)
          : String(predictionValue ?? "N/A");

      // Show result in UI
      setPredictedRuntime(predictionText);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get prediction";
      Alert.alert("Request Failed", message);
      console.log("Battery prediction error:", error);
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          {/* Watermark */}
          <Typo
            size={70}
            fontWeight="800"
            color={colors.textSecondary}
            style={styles.backgroundText}
          >
            solar monitor
          </Typo>

          {/* Main Content */}
          <View style={styles.main}>
            {/* Title */}
            <Typo
              size={28}
              fontWeight="700"
              color={colors.textPrimary}
              style={{ textAlign: "center", marginBottom: spacingY._10 }}
            >
              Battery Runtime
            </Typo>

            {/* Battery Visualization */}
            <View style={styles.batteryContainer}>
              <View style={styles.batteryFrame}>
                <View style={styles.batteryCap} />
                <View style={styles.batteryBody}>
                  <View style={styles.topIconContainer}>
                    <Icon.Lightning size={40} color="#90EE90" weight="fill" />
                  </View>
                  <View style={[styles.batteryFill, { height: `${batteryLevel}%` }]}>
                    <View style={styles.innerGlowBottom} />
                    <View style={styles.innerGlowMiddle} />
                    <View style={styles.innerGlowTop} />
                  </View>
                  <View style={styles.percentageContainer}>
                    <Typo size={48} fontWeight="700" color="#fff">
                      {batteryLevel}
                    </Typo>
                    <Typo
                      size={20}
                      fontWeight="600"
                      color="#fff"
                      style={{ marginLeft: 4 }}
                    >
                      %
                    </Typo>
                  </View>
                </View>
              </View>
            </View>

            {/* Widgets */}
            <View style={styles.widgetsContainer}>
              <View style={styles.widgetRow}>
                <View style={styles.widgetLarge}>
                  <Typo size={12} fontWeight="600" color="#000" style={{ marginBottom: 8 }}>
                    REMAINING BATTERY LIFE
                  </Typo>
                  <Typo size={32} fontWeight="700" color="#000">
                    {predictedRuntime ? predictedRuntime : "5.13h"}
                  </Typo>
                </View>
                <Pressable style={styles.widgetSmall} onPress={handlePowerDrainingPress}>
                  <View style={styles.widgetSmallContent}>
                    <View>
                      <Typo size={28} fontWeight="700" color="#000">
                        18
                      </Typo>
                      <Typo size={11} fontWeight="600" color="#000" style={{ marginTop: 4 }}>
                        POWER DRAINING
                      </Typo>
                      <Typo size={10} color="#000">
                        Devices
                      </Typo>
                    </View>
                    <Icon.CaretRight size={24} color="#000" weight="bold" />
                  </View>
                </Pressable>
              </View>

              <View style={styles.widgetRow}>
                <View style={styles.widgetSmall}>
                  <Typo size={12} fontWeight="600" color="#000" style={{ marginBottom: 8 }}>
                    TIME TO FULLY CHARGE
                  </Typo>
                  <Typo size={28} fontWeight="700" color="#000">
                    2h
                  </Typo>
                </View>

                <View style={styles.widgetLarge}>
                  <Typo size={12} fontWeight="600" color="#000" style={{ marginBottom: 8 }}>
                    State of Battery Health
                  </Typo>
                  <Typo size={32} fontWeight="700" color="#000">
                    89%
                  </Typo>
                </View>
              </View>
            </View>

            {/* Prediction Button */}
            <Pressable
              style={[styles.predictionButton, isPredicting && styles.buttonDisabled]}
              onPress={handleGetPredictions}
              disabled={isPredicting}
            >
              {isPredicting ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Typo size={14} fontWeight="700" color="#000">
                  Get Predictions
                </Typo>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default BatteryOptimization;

// Styles remain unchanged from your original code
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between" },
  backgroundText: {
    position: "absolute",
    top: verticalScale(400),
    alignSelf: "center",
    opacity: 0.06,
    textTransform: "uppercase",
    letterSpacing: 4,
  },
  main: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    justifyContent: "center",
    alignItems: "center",
    gap: spacingY._30,
  },
  batteryContainer: { position: "relative", alignItems: "center", justifyContent: "center", width: 200, height: 320 },
  batteryFrame: { alignItems: "center", zIndex: 10 },
  batteryCap: {
    width: 60,
    height: 15,
    backgroundColor: "transparent",
    borderWidth: 3,
    borderColor: "#7CFC00",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomWidth: 0,
    marginBottom: -2,
    shadowColor: "#7CFC00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  batteryBody: {
    width: 160,
    height: 280,
    backgroundColor: "rgba(20, 25, 20, 0.95)",
    borderWidth: 3,
    borderColor: "#7CFC00",
    borderRadius: 35,
    overflow: "hidden",
    justifyContent: "flex-end",
    shadowColor: "#7CFC00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  topIconContainer: { position: "absolute", top: 20, left: 0, right: 0, alignItems: "center", zIndex: 20 },
  batteryFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#32CD32",
    opacity: 0.8,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#32CD32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    overflow: "hidden",
  },
  innerGlowBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", backgroundColor: "#00ff00", opacity: 0.4 },
  innerGlowMiddle: { position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", backgroundColor: "#32CD32", opacity: 0.3 },
  innerGlowTop: { position: "absolute", bottom: 0, left: 0, right: 0, height: "80%", backgroundColor: "#7CFC00", opacity: 0.2 },
  percentageContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, flexDirection: "row", justifyContent: "center", alignItems: "center", zIndex: 10 },
  widgetsContainer: { width: "100%", gap: spacingY._15 },
  widgetRow: { flexDirection: "row", gap: spacingX._15, width: "100%" },
  widgetLarge: { flex: 1.5, backgroundColor: "#7CFC00", borderRadius: 16, padding: spacingX._15, justifyContent: "flex-start", shadowColor: "#7CFC00", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  widgetSmall: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: spacingX._15, justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  widgetSmallContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  predictionButton: { marginTop: spacingY._5, width: "100%", backgroundColor: "#7CFC00", borderRadius: 14, paddingVertical: spacingY._12, alignItems: "center", justifyContent: "center" },
  buttonDisabled: { opacity: 0.65 },
});
