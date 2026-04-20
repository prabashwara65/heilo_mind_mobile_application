import {
  StyleSheet,
  Image,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import React, { useRef, useState } from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import Input from "@/components/Input";
import * as Icon from "phosphor-react-native";
import Button from "@/components/Button";
import BackButton from "@/components/BackButton";
import { useRouter } from "expo-router";
import Toast from "@/components/Alert";
import { useAuth } from "@/context/authContext";

const Register = () => {
  const nameRef = useRef("");
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const confirmPasswordRef = useRef("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const {register: registerUser} = useAuth();

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
  });

  const handleSubmit = async () => {
    if (
      !nameRef.current ||
      !emailRef.current ||
      !passwordRef.current ||
      !confirmPasswordRef.current
    ) {
      setAlertData({
        title: "Missing Fields",
        message: "Please enter all fields",
        type: "error",
      });
      setAlertVisible(true);
      return;
    }

    setAlertData({
      title: "Success",
      message: "You are good to go 🚀",
      type: "success",
    });
    setAlertVisible(true);

    setIsLoading(true);

    const res = await registerUser(
      emailRef.current,
      passwordRef.current,
      nameRef.current
    );

    setIsLoading(false);
    console.log('register result: ', res);
    if(!res.success){
      Alert.alert("Signup", res.msg)
    }

  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <BackButton
            style={styles.backButton}
            fallbackRoute="/(auth)/login"
          />

          {/* Progress Bars */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar} />
            <View style={styles.progressBar} />
            <View style={[styles.progressBar, styles.activeBar]} />
          </View>

          {/* Watermark */}
          <Typo
            size={70}
            fontWeight="800"
            color={colors.textSecondary}
            style={styles.backgroundText}
          >
            solar monitor
          </Typo>

          {/* Scrollable Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.main}>
              {/* Logo */}
              <Image
                source={require("../../assets/images/logo-removebg.png")}
                style={styles.logo}
                resizeMode="contain"
              />

              {/* Form */}
              <View style={styles.form}>
                <Typo size={16} color={colors.textPrimary} fontWeight="500">
                  Name
                </Typo>
                <Input
                  placeholder="ex: jon smith"
                  onChangeText={(v) => (nameRef.current = v)}
                  icon={
                    <Icon.UserCircle
                      size={20}
                      color={colors.textPrimary}
                      weight="fill"
                    />
                  }
                />

                <Typo size={16} color={colors.textPrimary} fontWeight="500">
                  Email
                </Typo>
                <Input
                  placeholder="ex: jon.smith@email.com"
                  onChangeText={(v) => (emailRef.current = v)}
                  icon={
                    <Icon.EnvelopeSimple
                      size={20}
                      color={colors.textPrimary}
                      weight="fill"
                    />
                  }
                />

                <Typo size={16} color={colors.textPrimary} fontWeight="500">
                  Password
                </Typo>
                <Input
                  placeholder="*********"
                  secureTextEntry
                  onChangeText={(v) => (passwordRef.current = v)}
                  icon={
                    <Icon.LockSimple
                      size={20}
                      color={colors.textPrimary}
                      weight="fill"
                    />
                  }
                />

                <Typo size={16} color={colors.textPrimary} fontWeight="500">
                  Confirm Password
                </Typo>
                <Input
                  placeholder="*********"
                  secureTextEntry
                  onChangeText={(v) => (confirmPasswordRef.current = v)}
                  icon={
                    <Icon.LockSimple
                      size={20}
                      color={colors.textPrimary}
                      weight="fill"
                    />
                  }
                />

                <Button loading={isLoading} onPress={handleSubmit}>
                  <Typo size={16} color={colors.background} fontWeight="600">
                    SIGN UP
                  </Typo>
                </Button>
              </View>

              {/* Social Login */}
              <Typo
                size={15}
                color={colors.textSecondary}
                style={{ alignSelf: "center", marginVertical: spacingY._20 }}
              >
                or sign up with
              </Typo>

              <View style={styles.socialContainer}>
                <Pressable
                  style={styles.socialButton}
                  onPress={() => console.log("Google login")}
                >
                  <Image
                    source={require("../../assets/images/google_logo.png")}
                    style={styles.socialIcon}
                  />
                </Pressable>
                <Pressable
                  style={styles.socialButton}
                  onPress={() => console.log("Facebook login")}
                >
                  <Image
                    source={require("../../assets/images/facebook_logo.png")}
                    style={styles.socialIcon}
                  />
                </Pressable>
                <Pressable
                  style={styles.socialButton}
                  onPress={() => console.log("Instagram login")}
                >
                  <Image
                    source={require("../../assets/images/inster_logo.png")}
                    style={styles.socialIcon}
                  />
                </Pressable>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Typo size={15}>Already have an account?</Typo>
                <Pressable onPress={() => router.navigate("/(auth)/login")}>
                  <Typo size={15} color={colors.primary} fontWeight="700">
                    SIGN IN
                  </Typo>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Toast Alert */}
      <Toast
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        type={alertData.type}
        onHide={() => setAlertVisible(false)}
      />
    </ScreenWrapper>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    marginBottom: spacingY._15,
    marginLeft: spacingX._20,
  },
  scrollContent: {
    paddingBottom: spacingY._40,
  },

  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacingX._10,
    marginTop: 0,
  },
  progressBar: {
    width: verticalScale(115),
    height: verticalScale(4),
    backgroundColor: colors.surface,
    borderRadius: 10,
  },
  activeBar: {
    backgroundColor: colors.buttonPrimary,
  },

  backgroundText: {
    position: "absolute",
    top: verticalScale(400),
    alignSelf: "center",
    opacity: 0.06,
    textTransform: "uppercase",
    letterSpacing: 4,
  },

  main: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._20,
  },

  logo: {
    height: verticalScale(200),
    marginBottom: spacingY._20,
    alignSelf: "center",
  },

  form: {
    gap: spacingY._20,
  },

  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacingX._30,
    marginBottom: spacingY._20,
  },

  socialIcon: {
    width: verticalScale(50),
    height: verticalScale(50),
    resizeMode: "contain",
  },

  socialButton: {
    backgroundColor: colors.surface,
    borderRadius: 100,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  footer: {
    marginTop: spacingY._20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    marginBottom: spacingY._30,
  },
});
