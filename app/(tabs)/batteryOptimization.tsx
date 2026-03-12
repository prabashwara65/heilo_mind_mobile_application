import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import * as Icon from "phosphor-react-native";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

const BATTERY_PREDICTION_API_URL =
  "https://ww4gn1az54.execute-api.eu-north-1.amazonaws.com/predict";

const BATTERY_RESULT_API =
  "https://dj6ijy2cpk.execute-api.eu-north-1.amazonaws.com/get-result";

const BATTERY_DEVICE_ID = "Raspberry";

const BatteryOptimization = () => {

  const [batteryLevel, setBatteryLevel] = useState(0);
  const [led_count, setLedCount] = useState(0);
  const [runtimeHours, setRuntimeHours] = useState(0);
  const [batteryHealth, setBatteryHealth] = useState(0);
  const [isPredicting, setIsPredicting] = useState(false);

  const router = useRouter();

  const handlePowerDrainingPress = () => {
    router.push("/battery_runtime/page");
  };

  const handleGetPredictions = async () => {

    if (isPredicting) return;

    const requestId = `BA-${Date.now()}`;

    try {

      setIsPredicting(true);

      const response = await fetch(BATTERY_PREDICTION_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: BATTERY_DEVICE_ID,
          requestId,
          led_count: led_count, // LED logic added
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage =
          data?.error || data?.details || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      Alert.alert(
        "Prediction Requested",
        `Request sent successfully.\nRequest ID: ${requestId}`
      );

      console.log("Battery prediction request response:", data);

      // wait backend processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const resultResponse = await fetch(
        `${BATTERY_RESULT_API}?requestId=${requestId}`
      );

      const resultData = await resultResponse.json();

      console.log("Prediction result payload:", resultData);

      // update states from API
      setLedCount(resultData.led_count || 0);
      setBatteryLevel(Math.round(resultData.soc_baseline_percent || 0));
      setRuntimeHours(resultData.runtime_baseline_hours || 0);
      setBatteryHealth(Math.round(resultData.soh_percent || 0));

    } catch (error) {

      const message =
        error instanceof Error ? error.message : "Failed to trigger prediction";

      Alert.alert("Request Failed", message);

      console.log("Battery prediction request error:", error);

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

          <Typo
            size={70}
            fontWeight="800"
            color={colors.textSecondary}
            style={styles.backgroundText}
          >
            solar monitor
          </Typo>

          <View style={styles.main}>

            <Typo
              size={28}
              fontWeight="700"
              color={colors.textPrimary}
              style={{ textAlign: "center", marginBottom: spacingY._10 }}
            >
              Battery Runtime
            </Typo>

            {/* Battery Visualization */}
            <View
              style={[
                styles.batteryContainer,
                { marginTop: -verticalScale(40) },
              ]}
            >

              <View style={styles.batteryFrame}>

                <View style={styles.batteryCap} />

                <View style={styles.batteryBody}>

                  <View style={styles.topIconContainer}>
                    <Icon.Lightning size={40} color="#90EE90" weight="fill" />
                  </View>

                  <View
                    style={[
                      styles.batteryFill,
                      { height: `${batteryLevel}%` },
                    ]}
                  >
                    <View style={styles.innerGlowBottom} />
                    <View style={styles.innerGlowMiddle} />
                    <View style={styles.innerGlowTop} />
                  </View>

                  <View style={styles.percentageContainer}>

                    <Typo
                      size={18}
                      fontWeight="600"
                      color="rgba(255,255,255,0.8)"
                      style={{ marginBottom: 4, textAlign: "center" }}
                    >
                      State of Charge
                    </Typo>

                    <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                      <Typo size={48} fontWeight="700" color="#fff">
                        {batteryLevel}
                      </Typo>
                      <Typo
                        size={24}
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

            </View>

            {/* Devices Working */}
            <Pressable
              onPress={() => setLedCount((prev) => (prev === 2 ? 1 : 2))}
              style={{ marginTop: -verticalScale(10) }}
            >
              <Typo size={16} fontWeight="600" color={colors.textPrimary}>
                {led_count > 0
                  ? `${led_count} device${led_count > 1 ? "s" : ""} ${led_count > 1 ? "are" : "is"
                  } currently working`
                  : "No devices connected"}
              </Typo>
            </Pressable>

            {/* Widgets */}
            <View style={styles.widgetsContainer}>

              <View style={styles.widgetRow}>

                <View style={styles.widgetLarge}>
                  <Typo size={12} fontWeight="600" color="#000" style={{ marginBottom: 8 }}>
                    REMAINING BATTERY LIFE
                  </Typo>

                  <Typo size={32} fontWeight="700" color="#000">
                    {runtimeHours.toFixed(2)}h
                  </Typo>
                </View>

                <View style={styles.widgetLarge}>
                  <Typo size={12} fontWeight="600" color="#000" style={{ marginBottom: 8 }}>
                    State of Battery Health
                  </Typo>

                  <Typo size={32} fontWeight="700" color="#000">
                    {batteryHealth}%
                  </Typo>
                </View>

              </View>

              <View style={styles.widgetRow}>

                <Pressable
                  style={[styles.widgetSmall, { flex: 1 }]}
                  onPress={handlePowerDrainingPress}
                >
                  <View style={styles.widgetSmallContent}>

                    <View>
                      <Typo size={13} fontWeight="800" color="#000">
                        Optimize battery for maximum battery life
                      </Typo>
                    </View>

                    <Icon.CaretRight size={24} color="#000" weight="bold" />

                  </View>
                </Pressable>

              </View>

            </View>

            <Pressable
              style={[
                styles.predictionButton,
                isPredicting && styles.buttonDisabled,
              ]}
              onPress={handleGetPredictions}
              disabled={isPredicting}
            >
              <Typo size={14} fontWeight="700" color="#000">
                {isPredicting ? "Requesting..." : "Get Predictions"}
              </Typo>
            </Pressable>

          </View>

        </View>

      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default BatteryOptimization;

/* Styles remain unchanged */

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

  batteryContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 200,
    height: 320,
  },

  batteryFrame: { alignItems: "center", zIndex: 10 },

  batteryCap: {
    width: 60,
    height: 15,
    borderWidth: 3,
    borderColor: "#7CFC00",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomWidth: 0,
    marginBottom: -2,
  },

  batteryBody: {
    width: 160,
    height: 280,
    backgroundColor: "rgba(20,25,20,0.95)",
    borderWidth: 3,
    borderColor: "#7CFC00",
    borderRadius: 35,
    overflow: "hidden",
    justifyContent: "flex-end",
  },

  topIconContainer: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },

  batteryFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#32CD32",
    opacity: 0.8,
  },

  innerGlowBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", backgroundColor: "#00ff00", opacity: 0.4 },
  innerGlowMiddle: { position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", backgroundColor: "#32CD32", opacity: 0.3 },
  innerGlowTop: { position: "absolute", bottom: 0, left: 0, right: 0, height: "80%", backgroundColor: "#7CFC00", opacity: 0.2 },

  percentageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  widgetsContainer: { width: "100%", gap: spacingY._15 },

  widgetRow: { flexDirection: "row", gap: spacingX._15, width: "100%" },

  widgetLarge: {
    flex: 1.5,
    backgroundColor: "#7CFC00",
    borderRadius: 16,
    padding: spacingX._15,
  },

  widgetSmall: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacingX._15,
  },

  widgetSmallContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  predictionButton: {
    marginTop: spacingY._5,
    width: "100%",
    backgroundColor: "#7CFC00",
    borderRadius: 14,
    paddingVertical: spacingY._12,
    alignItems: "center",
  },

  buttonDisabled: { opacity: 0.65 },
});