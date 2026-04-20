import Button from "@/components/Button";
import BackButton from "@/components/BackButton";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import * as Icon from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from "react-native";

const BATTERY_PREDICTION_API_URL =
  "https://ww4gn1az54.execute-api.eu-north-1.amazonaws.com/predict";
const BATTERY_RESULT_API =
  "https://dj6ijy2cpk.execute-api.eu-north-1.amazonaws.com/get-result";
const BATTERY_DEVICE_ID = "Raspberry";

const BatteryRuntime = () => {
  const router = useRouter();
  const [isPredicting, setIsPredicting] = useState(false);

  // State for fetched payload
  const [payload, setPayload] = useState<any>({
    runtime_optimized_hours: 0,
    soc_improvement: 0,
    soc_optimized_percent: 0,
    optimizer_decision: "",
    shed_devices: "",
    runtime_baseline_hours: 0,
    soc_baseline_percent: 0,
    soh_percent: 0,
  });

  // Devices (static)
  const devices = [
    { id: 1, name: "SmokeDetector", priority: 1, percentage: 10, icon: "ShieldCheck", weight: "0.10" },
    { id: 2, name: "LEDs", priority: 2, percentage: 30, icon: "Lightbulb", weight: "0.30" },
    { id: 3, name: "Fan", priority: 3, percentage: 20, icon: "Fan", weight: "0.20" },
    { id: 4, name: "Heater", priority: 4, percentage: 40, icon: "Flame", weight: "0.40" },
  ];

  const handleGetPredictions = async () => {
    if (isPredicting) return;

    const requestId = `BA-${Date.now()}`;
    try {
      setIsPredicting(true);

      // Request prediction
      const response = await fetch(BATTERY_PREDICTION_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: BATTERY_DEVICE_ID, requestId }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);

      Alert.alert("Prediction Requested", `Request sent successfully.\nRequest ID: ${requestId}`);

      // Wait a few seconds for backend to process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Fetch the result
      const resultResponse = await fetch(`${BATTERY_RESULT_API}?requestId=${requestId}`);
      const resultData = await resultResponse.json();

      if (!resultResponse.ok) throw new Error(resultData?.error || `HTTP ${resultResponse.status}`);

      console.log("Prediction result fetched:", resultData);

      // Update state with full payload
      setPayload({
        runtime_optimized_hours: resultData.runtime_optimized_hours || 0,
        soc_improvement: resultData.soc_improvement || 0,
        soc_optimized_percent: resultData.soc_optimized_percent || 0,
        optimizer_decision: resultData.optimizer_decision || "",
        shed_devices: resultData.shed_devices || "",
        runtime_baseline_hours: resultData.runtime_baseline_hours || 0,
        soc_baseline_percent: resultData.soc_baseline_percent || 0,
        soh_percent: resultData.soh_percent || 0,
      });

    } catch (error) {
      console.error("Prediction error:", error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to fetch predictions");
    } finally {
      setIsPredicting(false);
    }
  };

  // Fetch latest payload on mount using a test requestId
  useEffect(() => {
    const fetchBatteryResults = async () => {
      try {
        const response = await fetch(`${BATTERY_RESULT_API}?requestId=BA-1773012977627`);
        const data = await response.json();
        if (data.status === "success") {
          setPayload({
            runtime_optimized_hours: data.runtime_optimized_hours || 0,
            soc_improvement: data.soc_improvement || 0,
            soc_optimized_percent: data.soc_optimized_percent || 0,
            optimizer_decision: data.optimizer_decision || "",
            shed_devices: data.shed_devices || "",
            runtime_baseline_hours: data.runtime_baseline_hours || 0,
            soc_baseline_percent: data.soc_baseline_percent || 0,
            soh_percent: data.soh_percent || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching battery results:", error);
      }
    };
    fetchBatteryResults();
  }, []);

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            <Typo size={70} fontWeight="800" color={colors.textSecondary} style={styles.backgroundText}>
              solar monitor
            </Typo>

            <View style={styles.main}>
              <BackButton
                style={styles.backButton}
                fallbackRoute="/(tabs)/batteryOptimization"
              />

              <Typo size={24} fontWeight="700" color={colors.textPrimary} style={{ textAlign: "center" }}>
                Battery Runtime
              </Typo>

              {/* Devices Section */}
              <View style={styles.devicesSection}>
                <Typo size={36} fontWeight="700" color={colors.textPrimary}>{devices.length}</Typo>
                <Typo size={12} fontWeight="600" color={colors.textSecondary} style={styles.devicesTitle}>
                  DEVICE PRIORITY LIST
                </Typo>
                <View style={styles.devicesList}>
                  {devices.map((device) => {
                    const DeviceIcon = (Icon as any)[device.icon];
                    return (
                      <View key={device.id} style={styles.deviceItem}>
                        <View style={styles.deviceInfo}>
                          <View style={styles.iconContainer}>
                            {DeviceIcon && <DeviceIcon size={24} color={colors.textPrimary} />}
                          </View>
                          <View style={styles.deviceText}>
                            <Typo size={16} fontWeight="600" color={colors.textPrimary}>{device.name}</Typo>
                            <Typo size={12} color={colors.textSecondary}>
                              Priority: {device.priority} | Load: {device.weight}
                            </Typo>
                          </View>
                        </View>
                        <View style={styles.percentageContainer}>
                          <Typo size={20} fontWeight="700" color="#FFD700">{device.percentage}</Typo>
                          <Typo size={12} color={colors.textSecondary} style={{ marginLeft: 2 }}>%</Typo>
                        </View>
                        <View style={[styles.progressBar, { width: `${device.percentage}%` }]} />
                        <View style={styles.separator} />
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Optimization Gains Section */}
              <View style={styles.gainsContainer}>
                <Typo size={12} fontWeight="700" color={colors.textSecondary} style={styles.sectionTitle}>
                  PROJECTED OPTIMIZATION GAINS
                </Typo>
                <View style={styles.gainsGrid}>
                  <View style={styles.gainCard}>
                    <View style={styles.gainIconContainer}>
                      <Icon.Timer size={22} color="#32CD32" weight="duotone" />
                    </View>
                    <Typo size={18} fontWeight="700" color={colors.textPrimary}>
                      {payload.runtime_optimized_hours.toFixed(2)}h
                    </Typo>
                    <Typo size={10} color={colors.textSecondary}>Optimized Runtime</Typo>
                  </View>
                  <View style={styles.gainCard}>
                    <View style={styles.gainIconContainer}>
                      <Icon.TrendUp size={22} color="#32CD32" weight="duotone" />
                    </View>
                    <Typo size={18} fontWeight="700" color="#32CD32">
                      +{payload.soc_improvement.toFixed(2)}%
                    </Typo>
                    <Typo size={10} color={colors.textSecondary}>SOC Improvement</Typo>
                  </View>
                  <View style={styles.gainCard}>
                    <View style={styles.gainIconContainer}>
                      <Icon.BatteryChargingVertical size={22} color="#32CD32" weight="duotone" />
                    </View>
                    <Typo size={18} fontWeight="700" color={colors.textPrimary}>
                      {payload.soc_optimized_percent.toFixed(2)}%
                    </Typo>
                    <Typo size={10} color={colors.textSecondary}>Optimized SOC</Typo>
                  </View>
                </View>
              </View>

              {/* Optimizer Decision */}
              <View style={styles.warningBanner}>
                <View style={styles.warningHeader}>
                  <Icon.WarningDiamond size={22} color="#FFA500" weight="fill" />
                  <Typo size={14} fontWeight="800" color="#FFA500" style={{ marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    System Optimizer Alert
                  </Typo>
                </View>
                <Typo size={18} fontWeight="700" color={colors.textPrimary} style={{ marginTop: 6 }}>
                  {payload.optimizer_decision.replace(/_/g, " ")}
                </Typo>
                <Typo size={12} color="rgba(255,165,0,0.8)" style={{ marginTop: 4 }}>
                  Devices to shed: {payload.shed_devices}
                </Typo>
              </View>

              {/* Status Card */}
              <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  <View style={styles.statusDot} />
                  <Typo size={12} fontWeight="700" color={colors.textSecondary} style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Actions recommended to execute
                  </Typo>
                </View>
                <Typo size={16} fontWeight="600" color={colors.textPrimary} style={{ marginTop: 8 }}>
                  Shutting down - {payload.shed_devices}
                </Typo>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Get Predictions Button */}
        <View style={{ paddingHorizontal: spacingX._20, marginBottom: spacingY._10 }}>
          <Pressable
            style={[styles.predictionButton, isPredicting && styles.buttonDisabled]}
            onPress={handleGetPredictions}
            disabled={isPredicting}
          >
            <Typo size={14} fontWeight="700" color="#000">
              {isPredicting ? "Requesting..." : "Get Optimization Insights"}
            </Typo>
          </Pressable>
        </View>

        {/* Footer Button */}
        <View style={styles.footer}>
          <Button style={styles.optimizeButton} onPress={() => router.push("/battery_runtime/page_2")}>
            <Typo size={18} fontWeight="700" color={colors.background}>
              Optimize Battery
            </Typo>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default BatteryRuntime;


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* Watermark */
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
    gap: spacingY._20,
  },
  backButton: {
    marginBottom: spacingY._5,
  },

  /* Graph Card */
  graphCard: {
    backgroundColor: "rgba(30, 40, 35, 0.8)",
    borderRadius: 16,
    padding: spacingX._15,
    borderWidth: 1,
    borderColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  graphHeader: {
    marginBottom: spacingY._12,
  },

  dateRange: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacingY._12,
    paddingHorizontal: spacingX._5,
  },

  graphContainer: {
    position: "relative",
    height: 180,
    marginBottom: spacingY._15,
  },

  gridLines: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  gridLine: {
    width: "100%",
    height: 1,
    backgroundColor: colors.surface,
    opacity: 0.3,
  },

  svgContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  curveSegment: {
    position: "absolute",
    height: 2,
    backgroundColor: "#7CFC00",
    borderRadius: 1,
  },

  dataPoint: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#7CFC00",
    shadowColor: "#7CFC00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    zIndex: 10,
  },

  xAxisLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacingX._5,
    marginTop: spacingY._7,
  },

  xAxisLabel: {
    alignItems: "center",
  },

  /* Devices Section */
  scrollContent: {
    paddingBottom: spacingY._30,
  },
  devicesSection: {
    marginTop: spacingY._10,
  },
  devicesTitle: {
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacingY._20,
  },
  devicesList: {
    gap: spacingY._15,
  },
  deviceItem: {
    position: "relative",
    paddingBottom: spacingY._15,
  },
  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._15,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  deviceText: {
    flex: 1,
  },
  percentageContainer: {
    position: "absolute",
    right: 0,
    top: 5,
    flexDirection: "row",
    alignItems: "baseline",
  },
  progressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: "#00BFFF", // Deep Sky Blue
    borderRadius: 2,
    zIndex: 1,
  },
  separator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  optimizeButton: {
    backgroundColor: colors.primary,
    height: verticalScale(50),
  },
  footer: {
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._20,
    paddingTop: spacingY._10,
  },
  predictionButton: {
    backgroundColor: "#FFD700",
    height: verticalScale(45),
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  /* Warning Banner Styles */
  warningBanner: {
    backgroundColor: "rgba(255, 165, 0, 0.1)",
    borderRadius: 16,
    padding: spacingX._20,
    borderLeftWidth: 4,
    borderLeftColor: "#FFA500",
    marginTop: spacingY._10,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  /* Status Card Styles */
  statusCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 16,
    padding: spacingX._20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFA500",
    shadowColor: "#FFA500",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  /* Gains Section Styles */
  gainsContainer: {
    marginTop: spacingY._10,
    gap: spacingY._12,
  },
  sectionTitle: {
    textTransform: "uppercase",
    letterSpacing: 1.5,
    opacity: 0.8,
  },
  gainsGrid: {
    flexDirection: "row",
    gap: spacingX._12,
    justifyContent: "space-between",
  },
  gainCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    padding: spacingX._12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  gainIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(50, 205, 50, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
});
