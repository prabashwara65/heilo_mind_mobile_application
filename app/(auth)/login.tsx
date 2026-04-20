import {
  StyleSheet,
  Image,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
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

const Login = () => {
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const {login: loginUser} = useAuth();

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
  });

  const handleSubmit = async () => {
    if (!emailRef.current || !passwordRef.current) {
      setAlertData({
        title: "Missing Fields",
        message: "Please enter both email and password",
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
    const res = await loginUser(emailRef.current, passwordRef.current);
    setIsLoading(false);
    if(!res.success){
      Alert.alert("Login", res.msg);
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
            fallbackRoute="/(auth)/welcome"
          />

          {/* Progress Bars */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar} />
            <View style={[styles.progressBar, styles.activeBar]} />
            <View style={styles.progressBar} />
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

          {/* Main Content */}
          <View style={styles.main}>
            <Image
              source={require("../../assets/images/logo-removebg.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={styles.form}>
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

              <Typo
                size={15}
                color={colors.textPrimary}
                style={{ alignSelf: "flex-end" }}
              >
                Forgot Password?
              </Typo>

              <Button loading={isLoading} onPress={handleSubmit}>
                <Typo size={16} color={colors.background} fontWeight="600">
                  SIGN IN
                </Typo>
              </Button>
            </View>

            <Typo
              size={15}
              color={colors.textSecondary}
              style={{ alignSelf: "center", marginVertical: spacingY._20 }}
            >
              or sign in with
            </Typo>

            <View style={styles.socialContainer}>
              <Pressable style={styles.socialButton} onPress={() => console.log("Google login")}>
                <Image
                  source={require("../../assets/images/google_logo.png")}
                  style={styles.socialIcon}
                />
              </Pressable>
              <Pressable style={styles.socialButton} onPress={() => console.log("Facebook login")}>
                <Image
                  source={require("../../assets/images/facebook_logo.png")}
                  style={styles.socialIcon}
                />
              </Pressable>
              <Pressable style={styles.socialButton} onPress={() => console.log("Inster login")}>
                <Image
                  source={require("../../assets/images/inster_logo.png")}
                  style={styles.socialIcon}
                />
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Typo size={15}>Don&apos;t have an account?</Typo>
              <Pressable onPress={() => router.navigate("/(auth)/register")}>
                <Typo size={15} color={colors.primary} fontWeight="700">
                  SIGN UP
                </Typo>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

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

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  backButton: {
    marginBottom: spacingY._15,
    marginLeft: spacingX._20,
  },

  /* Progress Bars */
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacingX._10,
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

  /* Watermark */
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
  },

  logo: {
    height: verticalScale(200),
    marginBottom: spacingY._10,
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

