import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import * as Icon from "phosphor-react-native";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const MIRROR_PREDICTION_API_URL =
  "https://7w7nhxpbpg.execute-api.eu-north-1.amazonaws.com/predict";
const MIRROR_RESULT_API_URL =
  "https://rcik2ednid.execute-api.eu-north-1.amazonaws.com/get-result";
const MIRROR_DEVICE_ID = "Raspberry";

const MirrorRedirect = () => {
  const [controlMode, setControlMode] = useState("Auto");
  const [isRequesting, setIsRequesting] = useState(false);

  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const fetchMirrorResult = async (requestId: string) => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        const url = `${MIRROR_RESULT_API_URL}?requestId=${encodeURIComponent(
          requestId
        )}`;
        const response = await fetch(url);

        if (response.status === 404) {
          throw new Error("Result not ready");
        }

        const resultData = await response.json().catch(() => ({}));
        if (!response.ok) {
          const errorMessage =
            resultData?.error ||
            resultData?.details ||
            `HTTP ${response.status}`;
          throw new Error(errorMessage);
        }

        if (resultData?.prediction !== undefined) {
          return resultData;
        }
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error("Failed to fetch result");
      }

      await wait(2000);
    }

    if (lastError) throw lastError;
    throw new Error("Prediction result not available yet.");
  };

  const handleMirrorPredict = async () => {
    if (isRequesting) return;

    const requestId = `MI-${Date.now()}`;

    try {
      setIsRequesting(true);

      const response = await fetch(MIRROR_PREDICTION_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: MIRROR_DEVICE_ID,
          requestId,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMessage =
          data?.error || data?.details || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      const resultData = await fetchMirrorResult(requestId);
      const returnedRequestId =
        resultData?.requestId ?? resultData?.requestid ?? requestId;
      const predictionText =
        typeof resultData?.prediction === "object"
          ? JSON.stringify(resultData.prediction)
          : String(resultData?.prediction ?? "N/A");

      Alert.alert(
        "Prediction Received",
        `Request ID: ${returnedRequestId}\nPrediction: ${predictionText}`
      );
      console.log("Mirror prediction request response:", data);
      console.log("Mirror prediction result response:", resultData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to trigger prediction";
      Alert.alert("Request Failed", message);
      console.log("Mirror prediction request error:", error);
    } finally {
      setIsRequesting(false);
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
          {/* Watermark Background */}
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
              <View>
                <Typo size={28} fontWeight="700" color={colors.textPrimary}>
                  Solar Mirror Angle
                </Typo>
                <Typo size={16} color={colors.textSecondary}>
                  3D visualization & control
                </Typo>
              </View>

              <View style={styles.headerActions}>
                <Pressable
                  style={[
                    styles.imageButton,
                    isRequesting && styles.buttonDisabled,
                  ]}
                  onPress={handleMirrorPredict}
                  disabled={isRequesting}
                >
                  <Icon.DeviceRotateIcon
                    size={18}
                    color={colors.primary}
                    weight="bold"
                  />
                </Pressable>
              </View>
            </View>

            {/* Current Angle Card */}
            <View style={styles.angleCard}>
              <Typo size={18} fontWeight="600" color="#fff">
                Current Mirror Angle
              </Typo>
              <View style={styles.angleValueContainer}>
                <Typo size={64} fontWeight="800" color="#fff">
                  37
                </Typo>
                <Typo size={32} fontWeight="700" color="#fff" style={styles.degreeSymbol}>
                  °
                </Typo>
              </View>
              <Typo size={14} color="#fff" style={styles.optimizationText}>
                Optimized for maximum efficiency
              </Typo>
            </View>

            {/* 3D Model View */}
            <View style={styles.section}>
              <Typo size={20} fontWeight="700" color={colors.textPrimary} style={styles.sectionTitle}>
                3D Model View
              </Typo>
              <View style={styles.modelCard}>
                <View style={styles.modelContainer}>
                  {/* Stylized Solar Panel Model */}
                  <View style={styles.modelVisual}>
                    {/* Sun Indicator */}
                    <View style={styles.sunIndicator}>
                      <Icon.Sun size={32} color="#FFD700" weight="fill" />
                      <Typo size={12} color={colors.textSecondary}>Sun</Typo>
                    </View>
                    
                    {/* Angle Line */}
                    <View style={styles.angleLineContainer}>
                      <View style={styles.dottedLine} />
                      <Typo size={12} color={colors.textSecondary} style={styles.angleLabel}>37°</Typo>
                    </View>

                    {/* Solar Panel Visualization */}
                    <View style={styles.panelWrapper}>
                      <View style={styles.panelBase} />
                      <View style={styles.panelStand} />
                      <View style={styles.panelPlate}>
                        <View style={styles.gridContainer}>
                          {[...Array(9)].map((_, i) => (
                            <View key={i} style={styles.gridCell} />
                          ))}
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Control Mode */}
            <View style={styles.section}>
              <Typo size={20} fontWeight="700" color={colors.textPrimary} style={styles.sectionTitle}>
                Control Mode
              </Typo>
              <View style={styles.toggleContainer}>
                <Pressable 
                  style={[
                    styles.toggleButton, 
                    controlMode === "Auto" && styles.activeToggle
                  ]}
                  onPress={() => setControlMode("Auto")}
                >
                  <Typo 
                    size={16} 
                    fontWeight="700" 
                    color={controlMode === "Auto" ? "#fff" : colors.textSecondary}
                  >
                    Auto
                  </Typo>
                </Pressable>
                <Pressable 
                  style={[
                    styles.toggleButton, 
                    controlMode === "Manual" && styles.activeToggleManual
                  ]}
                  onPress={() => setControlMode("Manual")}
                >
                  <Typo 
                    size={16} 
                    fontWeight="700" 
                    color={controlMode === "Manual" ? colors.primary : colors.textSecondary}
                  >
                    Manual
                  </Typo>
                </Pressable>
              </View>
              <View style={styles.statusFooter}>
                <Icon.ArrowsClockwise size={16} color={colors.textSecondary} />
                <Typo size={14} color={colors.textSecondary} style={{ marginLeft: 8 }}>
                  System controlled based on sun position
                </Typo>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default MirrorRedirect;

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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacingY._5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  imageButton: {
    width: verticalScale(36),
    height: verticalScale(36),
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  angleCard: {
    backgroundColor: "#32CD32", // Primary green
    borderRadius: 24,
    padding: spacingX._20,
    shadowColor: "#32CD32",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  angleValueContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: spacingY._5,
  },
  degreeSymbol: {
    marginTop: 10,
    marginLeft: 2,
  },
  optimizationText: {
    opacity: 0.9,
  },
  section: {
    gap: spacingY._15,
  },
  sectionTitle: {
    marginBottom: spacingY._5,
  },
  modelCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 24,
    height: 250,
    padding: spacingX._20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  modelContainer: {
    width: "100%",
    height: "100%",
  },
  modelVisual: {
    flex: 1,
    position: "relative",
  },
  sunIndicator: {
    position: "absolute",
    right: 20,
    top: 10,
    alignItems: "center",
  },
  angleLineContainer: {
    position: "absolute",
    right: 0,
    top: 70,
    flexDirection: "row",
    alignItems: "center",
  },
  dottedLine: {
    width: 60,
    height: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderStyle: "dashed",
  },
  angleLabel: {
    marginLeft: 8,
    fontWeight: "600",
  },
  panelWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  panelBase: {
    width: 120,
    height: 12,
    backgroundColor: "#1B3A4B",
    borderRadius: 6,
    position: "absolute",
    bottom: 30,
  },
  panelStand: {
    width: 8,
    height: 60,
    backgroundColor: "#1B3A4B",
    position: "absolute",
    bottom: 40,
  },
  panelPlate: {
    width: 180,
    height: 130,
    backgroundColor: "#2E8B57",
    borderRadius: 12,
    transform: [{ rotate: "-40deg" }], // Adjusted to match 37 degrees look
    borderWidth: 4,
    borderColor: "#1B3A4B",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  gridContainer: {
    width: "90%",
    height: "90%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  gridCell: {
    width: "30%",
    height: "30%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(27, 58, 75, 0.3)",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 6,
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  activeToggle: {
    backgroundColor: "#32CD32",
  },
  activeToggleManual: {
    backgroundColor: "#fff",
  },
  statusFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacingY._5,
    opacity: 0.8,
  },
});
