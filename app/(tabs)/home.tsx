import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/context/authContext";
import { useFocusEffect } from "@react-navigation/native";
import { getProfileImage } from "@/services/imageService";
import { verticalScale } from "@/utils/styling";
import { Image } from "expo-image";
import * as Icons from "phosphor-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { trackAppOpen } from "@/services/visitTracker";
import { trackAppOpenAWS } from "@/services/awsAppVisit";
import { fetchSyncStatus, SyncStatus } from "@/services/syncService";
import { publishGetDataRequest } from "@/services/awsIotPublisher";

const SENSOR_API_URL =
  "https://m5isvhcq7e.execute-api.eu-north-1.amazonaws.com/sensor?deviceId=Raspberry";

const Home = () => {
  const { user } = useAuth();
  const [sensorData, setSensorData] = useState<Record<string, any> | null>(
    null,
  );
  const [sensorLoading, setSensorLoading] = useState(true);
  const [sensorError, setSensorError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSynced: "",
    deviceCount: 0,
    status: "Inactive",
  });
  const [awsAppVisitCount, setAwsAppVisitCount] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const hasVisitedDashboardOnce = useRef(false);

  const recordVisit = useCallback(async () => {
    if (!user?.uid) return;

    // Track with Firebase
    await trackAppOpen(user as any);

    // Track with AWS Lambda
    const awsData = await trackAppOpenAWS(user.uid);
    console.log("AWS App Visit Data:", awsData);

    // Optionally, you can store it in state to display on UI
    if (awsData) {
      setAwsAppVisitCount(awsData.dailyAppOpenCount);
    }
  }, [user]);

  // Count visit only when user enters Home screen (not on refresh action)
  useFocusEffect(
    useCallback(() => {
      recordVisit();
    }, [recordVisit]),
  );

  useEffect(() => {
    publishGetDataRequest("app_open");
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasVisitedDashboardOnce.current) {
        hasVisitedDashboardOnce.current = true;
        return;
      }

      publishGetDataRequest("dashboard_visit");
    }, []),
  );

  const loadSyncStatus = useCallback(async () => {
    const status = await fetchSyncStatus();
    setSyncStatus(status);
  }, []);

  useEffect(() => {
    loadSyncStatus();
    const interval = setInterval(loadSyncStatus, 30000);  
    return () => clearInterval(interval);
  }, [loadSyncStatus]);

  // Flatten nested objects
  const flattenData = useCallback((
    obj: Record<string, any>,
    prefix = "",
  ): Record<string, any> => {
    let result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.assign(result, flattenData(value, `${prefix}${key}_`));
      } else {
        result[`${prefix}${key}`] = value;
      }
    }
    return result;
  }, []);

  //fetch sensor data
  const fetchSensorData = useCallback(async () => {
    try {
      setSensorError(null);
      const response = await fetch(SENSOR_API_URL);

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const payload = await response.json();
      const data =
        payload && typeof payload === "object" && "data" in payload
          ? (payload as { data: Record<string, any> }).data
          : payload;

      if (!data || typeof data !== "object") {
        throw new Error("Unexpected response format");
      }

      // Flatten nested objects for display
      setSensorData(flattenData(data));
      setLastUpdated(new Date());
    } catch (error) {
      setSensorError(
        error instanceof Error ? error.message : "Failed to fetch sensor data",
      );
    } finally {
      setSensorLoading(false);
    }
  }, [flattenData]);

  useEffect(() => {
    fetchSensorData();
  }, [fetchSensorData]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      publishGetDataRequest("refresh");
      await Promise.all([fetchSensorData(), loadSyncStatus()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchSensorData, loadSyncStatus]);

  const sensorEntries = useMemo(() => {
    if (!sensorData) return [];
    return Object.entries(sensorData);
  }, [sensorData]);

  // Simplified graph data for Solar Prediction
  const solarGraphData = [
    { time: "6:00", value: 20 },
    { time: "8:00", value: 35 },
    { time: "10:00", value: 15 },
    { time: "15:00", value: 30 },
    { time: "17:00", value: 55 },
    { time: "20:00", value: 40 },
    { time: "0:00", value: 45 },
    { time: "5:00", value: 30 },
  ];

  const graphWidth = 300;
  const graphHeight = 100;
  const maxValue = 100;

  const calculateY = (value: number) =>
    graphHeight - (value / maxValue) * graphHeight;

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Watermark Background */}
        <Typo
          size={70}
          fontWeight="800"
          color={colors.textSecondary}
          style={styles.backgroundText}
        >
          Solar Monitor
        </Typo>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Typo size={24} fontWeight="700">
              Heilo Mind
            </Typo>
            <Typo size={14} color={colors.primary}>
              Good Morning, {user?.name || "Hasara"}
            </Typo>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
              disabled={refreshing}
            >
              <Icons.ArrowsClockwise
                size={18}
                color={colors.primary}
                weight="bold"
              />
            </TouchableOpacity>
            <Image
              source={getProfileImage(user?.image)}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>
        </View>

        {/* System Status Card */}
        <View style={styles.statusCard}>
          <Typo
            size={12}
            fontWeight="600"
            color={colors.primary}
            style={styles.cardLabel}
          >
            SYSTEM STATUS
          </Typo>
          <Typo size={44} fontWeight="700">
            Optimal
          </Typo>
          <Typo size={14} color={colors.textSecondary}>
            All systems are operating at peak efficiency
          </Typo>
        </View>

        {/* <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Typo size={16} fontWeight="600">Sensor Data</Typo>
            <Icons.WifiHigh size={24} color={colors.primary} weight="fill" />
          </View>

          {sensorLoading && (
            <Typo size={14} color={colors.textSecondary}>Loading latest data...</Typo>
          )}

          {!sensorLoading && sensorError && (
            <Typo size={14} color="#ff6b6b">Error: {sensorError}</Typo>
          )}

          {!sensorLoading && !sensorError && sensorEntries.length === 0 && (
            <Typo size={14} color={colors.textSecondary}>No sensor values found.</Typo>
          )}

          {!sensorLoading && !sensorError && sensorEntries.length > 0 && (
            <View style={styles.sensorList}>
              {sensorEntries.map(([key, value]) => (
                <View key={key} style={styles.sensorRow}>
                  <Typo size={13} color={colors.textSecondary}>
                    {key}
                  </Typo>
                  <Typo size={14} fontWeight="600">
                    {String(value)}
                  </Typo>
                </View>
              ))}
            </View>
          )}

          <View style={styles.cardFooter}>
            <Typo size={12} color={colors.textSecondary}>
              {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : 'Not updated yet'}
            </Typo>
            <Typo size={12} color={colors.primary} fontWeight="600">Live API</Typo>
          </View>
        </View> */}

        {/* Solar Prediction Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Typo size={16} fontWeight="600">
              Solar Prediction
            </Typo>
            <Icons.Sun size={24} color={colors.primary} weight="fill" />
          </View>
          <Typo size={36} fontWeight="700" style={styles.cardValue}>
            6.8 kW
          </Typo>
          <Typo
            size={12}
            color={colors.textSecondary}
            style={styles.cardSubValue}
          >
            Peak expected at 12:45 PM
          </Typo>

          {/* Mini Graph */}
          <View style={styles.miniGraphContainer}>
            <Typo
              size={14}
              fontWeight="600"
              color="#fff"
              style={styles.graphTitle}
            >
              ENERGY GENERATION (kWh)
            </Typo>

            <View style={styles.graphCard}>
              <View style={styles.graphLabelsY}>
                <Typo size={10} color={colors.primary}>
                  Aug
                </Typo>
                <Typo size={10} color={colors.primary}>
                  1
                </Typo>
              </View>

              <View style={styles.chartArea}>
                {/* Vertical Grid Lines */}
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <View
                    key={i}
                    style={[styles.gridLine, { left: (i * graphWidth) / 6 }]}
                  />
                ))}

                {/* Graph Content */}
                <View style={styles.svgContainer}>
                  {/* Area Fill simulation */}
                  <View style={styles.areaFill} />

                  {/* Line Segments */}
                  {solarGraphData.map((point, index) => {
                    if (index === 0) return null;
                    const prev = solarGraphData[index - 1];
                    const x1 =
                      ((index - 1) / (solarGraphData.length - 1)) * graphWidth;
                    const y1 = calculateY(prev.value);
                    const x2 =
                      (index / (solarGraphData.length - 1)) * graphWidth;
                    const y2 = calculateY(point.value);

                    const angle = Math.atan2(y2 - y1, x2 - x1);
                    const dist = Math.sqrt(
                      Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2),
                    );

                    return (
                      <View
                        key={index}
                        style={[
                          styles.lineSegment,
                          {
                            left: x1,
                            top: y1,
                            width: dist,
                            transform: [
                              { rotate: `${(angle * 180) / Math.PI}deg` },
                            ],
                          },
                        ]}
                      />
                    );
                  })}

                  {/* Hollow Dots */}
                  {solarGraphData.map((point, index) => {
                    const x =
                      (index / (solarGraphData.length - 1)) * graphWidth;
                    const y = calculateY(point.value);
                    return (
                      <View
                        key={`dot-${index}`}
                        style={[styles.dataDot, { left: x - 4, top: y - 4 }]}
                      />
                    );
                  })}
                </View>
              </View>

              {/* Tick Marks and X-Axis */}
              <View style={styles.xAxisContainer}>
                <View style={styles.ticksRow}>
                  {[...Array(25)].map((_, i) => (
                    <View
                      key={i}
                      style={[styles.tick, i % 4 === 0 && styles.longTick]}
                    />
                  ))}
                </View>
                <View style={styles.xAxisLabels}>
                  {solarGraphData.map((point, index) => (
                    <Typo key={index} size={9} color={colors.textSecondary}>
                      {point.time}
                    </Typo>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Battery Runtime Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Typo size={16} fontWeight="600">
              Battery Runtime
            </Typo>
            <Icons.BatteryCharging
              size={24}
              color={colors.primary}
              weight="fill"
            />
          </View>
          <Typo size={36} fontWeight="700" style={styles.cardValue}>
            18h 42m
          </Typo>
          <View style={styles.cardFooter}>
            <Typo size={12} color={colors.textSecondary}>
              Remaining at current load
            </Typo>
            <Typo size={12} color={colors.primary} fontWeight="600">
              Stable
              Today App Opens: {awsAppVisitCount ?? "-"}
            </Typo>
            
          </View>
        </View>

        {/* Mirror Angle Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Typo size={16} fontWeight="600">
              Mirror Angle
            </Typo>
            <Icons.Lightning size={24} color={colors.primary} weight="fill" />
          </View>
          <Typo size={36} fontWeight="700" style={styles.cardValue}>
            142.5 °
          </Typo>
          <Typo size={12} color={colors.textSecondary}>
            Remaining at current load
          </Typo>
        </View>

        {/* Data Sync Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Typo size={16} fontWeight="600">
              Data Sync
            </Typo>
            <Icons.ArrowsClockwise
              size={24}
              color={colors.primary}
              weight="fill"
            />
          </View>
          <Typo size={36} fontWeight="700" style={styles.cardValue}>
            {syncStatus.status}
          </Typo>
          <View style={styles.cardFooter}>
            <Typo size={12} color={colors.textSecondary}>
              {syncStatus.lastSynced
                ? `Last synced ${new Date(syncStatus.lastSynced).toLocaleTimeString()}`
                : "Not synced yet"}
            </Typo>
            <Typo size={12} color={colors.primary} fontWeight="600">
              Live
            </Typo>
          </View>

          {/* Sync Widget */}
          <View style={styles.syncWidget}>
            <View style={styles.syncDots}>
              <View
                style={[styles.syncDot, { backgroundColor: colors.primary }]}
              />
              <View
                style={[
                  styles.syncDot,
                  {
                    backgroundColor: colors.primary,
                    opacity: 0.6,
                    marginLeft: -8,
                  },
                ]}
              />
              <View
                style={[
                  styles.syncDot,
                  {
                    backgroundColor: colors.primary,
                    opacity: 0.3,
                    marginLeft: -8,
                  },
                ]}
              />
            </View>
            <Typo
              size={12}
              color={colors.textPrimary}
              style={{ flex: 1, marginLeft: 10 }}
            >
               {syncStatus.deviceCount} device synced
            </Typo>
            <Icons.ArrowUpRight
              size={16}
              color={colors.primary}
              weight="bold"
            />
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._10,
    paddingBottom: spacingY._30,
    gap: spacingY._20,
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._10,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  refreshButton: {
    width: verticalScale(36),
    height: verticalScale(36),
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  avatar: {
    width: verticalScale(45),
    height: verticalScale(45),
    borderRadius: 25,
    backgroundColor: colors.surface,
  },
  statusCard: {
    backgroundColor: "rgba(50, 205, 50, 0.1)",
    padding: spacingX._20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(50, 205, 50, 0.2)",
  },
  cardLabel: {
    letterSpacing: 1,
    marginBottom: 4,
  },
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
  /* Mini Graph Styles */
  miniGraphContainer: {
    backgroundColor: "rgba(30, 40, 35, 0.6)",
    padding: 16,
    borderRadius: 24,
    marginTop: 8,
  },
  graphTitle: {
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  graphCard: {
    height: 180,
    position: "relative",
  },
  graphLabelsY: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 10,
  },
  chartArea: {
    height: 110,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
    overflow: "hidden",
  },
  gridLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  svgContainer: {
    flex: 1,
    position: "relative",
  },
  areaFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    backgroundColor: "rgba(50, 205, 50, 0.05)",
  },
  lineSegment: {
    position: "absolute",
    height: 2,
    backgroundColor: "#ADFF2F",
    transformOrigin: "left center",
  },
  dataDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ADFF2F",
    borderWidth: 2,
    borderColor: "#0A1E28",
    zIndex: 5,
  },
  xAxisContainer: {
    marginTop: 4,
  },
  ticksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    height: 8,
  },
  tick: {
    width: 1,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  longTick: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  xAxisLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  /* Sync Widget */
  syncWidget: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  syncDots: {
    flexDirection: "row",
  },
  syncDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  sensorList: {
    gap: 8,
    marginTop: 4,
  },
  sensorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
});
