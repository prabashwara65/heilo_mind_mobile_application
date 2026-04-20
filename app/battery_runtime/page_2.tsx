import Button from "@/components/Button";
import BackButton from "@/components/BackButton";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import * as Icon from "phosphor-react-native";
import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View
} from "react-native";

const EnergySavingActions = () => {
  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
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

            {/* Main Content */}
            <View style={styles.main}>
              <BackButton
                style={styles.backButton}
                fallbackRoute="/battery_runtime/page"
              />

              {/* Title */}
              <Typo size={24} fontWeight="700" color={colors.textPrimary} style={styles.pageTitle}>
                Energy Saving Actions
              </Typo>

              {/* Cards Container */}
              <View style={styles.cardsContainer}>
                
                {/* Suggestion Card */}
                <View style={styles.card}>
                  <Typo size={18} fontWeight="700" color={colors.textPrimary} style={styles.cardTitle}>
                    Energy Optimization Suggestion
                  </Typo>
                  <Typo size={14} color={colors.textPrimary} style={styles.cardDescription}>
                    Energy usage can be optimized by reducing load or delaying non-critical operations
                  </Typo>
                </View>

                {/* Warning Card */}
                <View style={styles.card}>
                  <Typo size={18} fontWeight="700" color={colors.textPrimary} style={styles.cardTitle}>
                    Extended Runtime Warning
                  </Typo>
                  <View style={styles.warningContent}>
                    <Icon.Warning
                      size={40}
                      color="#FF0000"
                      weight="fill"
                      style={styles.warningIcon}
                    />
                    <Typo size={14} color={colors.textPrimary} style={styles.warningText}>
                      Estimated runtime is less than 2 hours under current conditions
                    </Typo>
                  </View>
                </View>

              </View>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Footer Button */}
        <View style={styles.footer}>
          <Button style={styles.optimizeButton}>
            <Typo size={18} fontWeight="700" color={colors.background}>
              Optimize Battery
            </Typo>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default EnergySavingActions;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacingY._30,
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
    gap: spacingY._30,
  },
  backButton: {
    marginBottom: -spacingY._10,
  },
  pageTitle: {
    marginBottom: spacingY._10,
  },
  cardsContainer: {
    gap: spacingY._20,
  },
  card: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacingX._20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    marginBottom: spacingY._10,
  },
  cardDescription: {
    lineHeight: 20,
    opacity: 0.9,
  },
  warningContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._15,
    marginTop: spacingY._5,
  },
  warningIcon: {
    flexShrink: 0,
  },
  warningText: {
    flex: 1,
    lineHeight: 20,
    opacity: 0.9,
  },
  optimizeButton: {
    backgroundColor: colors.primary,
    height: verticalScale(50),
  },
  footer: {
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._20,
    paddingTop: spacingY._5,
  },
});
