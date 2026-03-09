import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import * as Icon from "phosphor-react-native";
import React, { useState } from "react";
import * as Icons from "phosphor-react-native";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const MIRROR_PREDICTION_API_URL =
  "https://7w7nhxpbpg.execute-api.eu-north-1.amazonaws.com/predict";

const MIRRORANGLE_PREDICTION_API_URL =
  process.env.EXPO_PUBLIC_MIRRORANGLE_PREDICTION_API_URL ||
  "https://q2untz4lh2.execute-api.eu-north-1.amazonaws.com/predict";

const MIRROR_DEVICE_ID = "Raspberry";

const MirrorRedirect = () => {
  const [controlMode, setControlMode] = useState("Auto");
  const [isRequesting, setIsRequesting] = useState(false);

  // Mirror prediction request
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

      Alert.alert(
        "Request Sent",
        `Prediction request has been sent successfully.\nRequest ID: ${requestId}`
      );

      console.log("Mirror prediction request response:", data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to trigger prediction";

      Alert.alert("Request Failed", message);
      console.log("Mirror prediction request error:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  // Mirror Angle prediction request
  const handleMirrorAnglePredict = async () => {
    if (isRequesting) return;

    const requestId = `MA-${Date.now()}`;

    try {
      setIsRequesting(true);

      const response = await fetch(MIRRORANGLE_PREDICTION_API_URL, {
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

      Alert.alert(
        "Angle Request Sent",
        `Mirror angle prediction triggered.\nRequest ID: ${requestId}`
      );

      console.log("Mirror angle prediction response:", data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to trigger prediction";

      Alert.alert("Angle Request Failed", message);
      console.log("Mirror angle prediction error:", error);
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
                  visualization & control
                </Typo>
              </View>

              <View style={styles.headerActions}>
                {/* Rotate Prediction */}
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

                {/* Angle Prediction */}
                <Pressable
                  style={[
                    styles.imageButton,
                    isRequesting && styles.buttonDisabled,
                  ]}
                  onPress={handleMirrorAnglePredict}
                  disabled={isRequesting}
                >
                  <Icon.Angle size={18} color={colors.primary} weight="bold" />
                </Pressable>
              </View>
            </View>

            {/* Solar Prediction Card */}
<View style={styles.card}>
  <View style={styles.cardHeader}>
    <Typo size={16} fontWeight="600">IoT Connection Status</Typo>
    <Icons.Sun size={24} color={colors.primary} weight="fill" />
  </View>

  {/* Hardcoded Prediction Value */}
  <Typo size={36} fontWeight="700" style={styles.cardValue}>
    Connected
  </Typo>

</View>

       
              

    

            {/* Solar Prediction Card */}
<View style={styles.card}>
  <View style={styles.cardHeader}>
    <Typo size={16} fontWeight="600">Servo Motor Status</Typo>
    <Icons.Sun size={24} color={colors.primary} weight="fill" />
  </View>

  {/* Hardcoded Prediction Value */}
  <Typo size={36} fontWeight="700" style={styles.cardValue}>
    Connected
  </Typo>

</View>
{/* Solar Prediction Card */}
<View style={styles.card}>
  <View style={styles.cardHeader}>
    <Typo size={16} fontWeight="600">Solar Mirror Angle</Typo>
    <Icons.Sun size={24} color={colors.primary} weight="fill" />
  </View>

           

  {/* Hardcoded Prediction Value */}
  <Typo size={36} fontWeight="700" style={styles.cardValue}>
    45°
  </Typo>

</View>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};


export default MirrorRedirect;

// --- Styles (unchanged from your original code) ---
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
  main: { paddingHorizontal: spacingX._20, paddingVertical: spacingY._20, gap: spacingY._30 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacingY._5 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  imageButton: { width: verticalScale(36), height: verticalScale(36), borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255, 255, 255, 0.08)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.12)" },
  buttonDisabled: { opacity: 0.6 },
  angleCard: { backgroundColor: "#32CD32", borderRadius: 24, padding: spacingX._20, shadowColor: "#32CD32", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  angleValueContainer: { flexDirection: "row", alignItems: "flex-start", marginVertical: spacingY._5 },
  degreeSymbol: { marginTop: 10, marginLeft: 2 },
  optimizationText: { opacity: 0.9 },
  section: { gap: spacingY._15 },
  sectionTitle: { marginBottom: spacingY._5 },
  modelCard: { backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: 24, height: 250, padding: spacingX._20, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  modelContainer: { width: "100%", height: "100%" },
  modelVisual: { flex: 1, position: "relative" },
  sunIndicator: { position: "absolute", right: 20, top: 10, alignItems: "center" },
  angleLineContainer: { position: "absolute", right: 0, top: 70, flexDirection: "row", alignItems: "center" },
  dottedLine: { width: 60, height: 1, borderWidth: 1, borderColor: "#ccc", borderStyle: "dashed" },
  angleLabel: { marginLeft: 8, fontWeight: "600" },
  panelWrapper: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 20 },
  panelBase: { width: 120, height: 12, backgroundColor: "#1B3A4B", borderRadius: 6, position: "absolute", bottom: 30 },
  panelStand: { width: 8, height: 60, backgroundColor: "#1B3A4B", position: "absolute", bottom: 40 },
  panelPlate: { width: 180, height: 130, backgroundColor: "#2E8B57", borderRadius: 12, transform: [{ rotate: "-40deg" }], borderWidth: 4, borderColor: "#1B3A4B", justifyContent: "center", alignItems: "center", marginBottom: 40, shadowColor: "#000", shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2, shadowRadius: 10 },
  gridContainer: { width: "90%", height: "90%", flexDirection: "row", flexWrap: "wrap", gap: 4 },
  gridCell: { width: "30%", height: "30%", backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: 2, borderWidth: 1, borderColor: "rgba(27, 58, 75, 0.3)" },
  toggleContainer: { flexDirection: "row", backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: 16, padding: 6, gap: 10 },
  toggleButton: { flex: 1, height: 50, borderRadius: 12, justifyContent: "center", alignItems: "center", backgroundColor: "transparent" },
  activeToggle: { backgroundColor: "#32CD32" },
  activeToggleManual: { backgroundColor: "#fff" },
  statusFooter: { flexDirection: "row", alignItems: "center", marginTop: spacingY._5, opacity: 0.8 },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: spacingX._20,
    borderRadius: 24,
    gap: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardValue: {
    marginTop: 4,
  },
  cardSubValue: {
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  
});