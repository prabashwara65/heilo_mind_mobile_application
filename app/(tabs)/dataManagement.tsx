import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { fetchSyncStatus } from "@/services/syncService";
import { verticalScale } from "@/utils/styling";
import {
  processDayData,
  processWeekData,
  processMonthData,
  processYearData,
} from "@/utils/syncChartProcessor";
import { useFocusEffect } from "@react-navigation/native";

import * as Icon from "phosphor-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type SensorRecord = Record<string, any>;

type HistoryCard = {
  id: number;
  label: string;
  value: string;
  icon: keyof typeof Icon;
  keyName: string;
};

const DataManagement = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("Week");
  const [showDropdown, setShowDropdown] = useState(false);
  const [historyCards, setHistoryCards] = useState<HistoryCard[]>([]);
  const [latestSyncedAt, setLatestSyncedAt] = useState<string>("");
  const lastKnownSyncRef = useRef<string>("");

  const [chartData, setChartData] = useState<any>({
    Day: [],
    Week: [],
    Month: [],
    Year: [],
  });

  const periods = ["Day", "Week", "Month", "Year"];

  const flattenData = (
    obj: Record<string, any>,
    prefix = ""
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
  };

  const getTimestampMs = (record: SensorRecord): number | null => {
    const rawTimestamp =
      record.timestamp ?? record.timeStamp ?? record.createdAt ?? record.time;

    if (rawTimestamp == null) return null;

    const numericTimestamp = Number(rawTimestamp);
    if (Number.isNaN(numericTimestamp)) return null;

    return numericTimestamp < 1000000000000
      ? numericTimestamp * 1000
      : numericTimestamp;
  };

  const getLatestRecord = (records: SensorRecord[]): SensorRecord | null => {
    if (records.length === 0) return null;

    let latest = records[0];
    let latestTime = getTimestampMs(latest) ?? 0;

    for (const record of records) {
      const currentTime = getTimestampMs(record) ?? 0;
      if (currentTime > latestTime) {
        latest = record;
        latestTime = currentTime;
      }
    }

    return latest;
  };

  const buildHistoryCards = (record: SensorRecord): HistoryCard[] => {
    const flattened = flattenData(record);
    const entries = Object.entries(flattened).filter(([key, value]) => {
      if (value == null) return false;
      if (["timestamp", "timeStamp", "createdAt", "time"].includes(key)) {
        return false;
      }
      return typeof value === "number" || !Number.isNaN(Number(value));
    });

    const priorityMatchers: {
      label: string;
      icon: keyof typeof Icon;
      match: RegExp;
    }[] = [
      { label: "Temperature", icon: "Thermometer", match: /temp|temperature/i },
      { label: "Humidity", icon: "Drop", match: /humidity/i },
      { label: "Irradiance", icon: "Sun", match: /irradiance|lux/i },
      { label: "Voltage", icon: "PlugCharging", match: /volt|voltage/i },
    ];

    const usedKeys = new Set<string>();
    const cards: HistoryCard[] = [];

    for (const matcher of priorityMatchers) {
      const found = entries.find(([key]) => matcher.match.test(key));
      if (!found) continue;

      const [key, value] = found;
      if (usedKeys.has(key)) continue;

      usedKeys.add(key);
      cards.push({
        id: cards.length + 1,
        label: matcher.label,
        value: String(value),
        icon: matcher.icon,
        keyName: key,
      });
    }

    if (cards.length < 4) {
      for (const [key, value] of entries) {
        if (usedKeys.has(key)) continue;
        cards.push({
          id: cards.length + 1,
          label: key.replace(/_/g, " "),
          value: String(value),
          icon: "ChartBar",
          keyName: key,
        });
        if (cards.length >= 4) break;
      }
    }

    return cards.slice(0, 4);
  };

  const fetchSensorData = useCallback(async () => {
    try {
      const response = await fetch(
        process.env.EXPO_PUBLIC_SENSOR_API_URL as string
      );
      const payload = await response.json();
      const data =
        payload && typeof payload === "object" && "data" in payload
          ? payload.data
          : payload;

      const records: SensorRecord[] = Array.isArray(data)
        ? data
        : data && typeof data === "object"
        ? [data]
        : [];

      setChartData({
        Day: processDayData(records as any),
        Week: processWeekData(records as any),
        Month: processMonthData(records as any),
        Year: processYearData(records as any),
      });

      const latest = getLatestRecord(records);
      if (!latest) {
        setHistoryCards([]);
        setLatestSyncedAt("");
        return;
      }

      const latestTimestamp = getTimestampMs(latest);
      setLatestSyncedAt(
        latestTimestamp ? new Date(latestTimestamp).toLocaleString() : ""
      );
      setHistoryCards(buildHistoryCards(latest));
    } catch (error) {
      console.log("Sensor fetch error:", error);
    }
  }, []);

  useEffect(() => {
    fetchSensorData();
  }, [fetchSensorData]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const checkForNewSync = async () => {
        try {
          const status = await fetchSyncStatus();
          if (!isActive || !status.lastSynced) return;

          if (!lastKnownSyncRef.current) {
            lastKnownSyncRef.current = status.lastSynced;
            fetchSensorData();
            return;
          }

          if (lastKnownSyncRef.current !== status.lastSynced) {
            lastKnownSyncRef.current = status.lastSynced;
            fetchSensorData();
          }
        } catch (error) {
          console.log("Sync status check failed:", error);
        }
      };

      checkForNewSync();
      const interval = setInterval(checkForNewSync, 10000);

      return () => {
        isActive = false;
        clearInterval(interval);
      };
    }, [fetchSensorData])
  );

  const currentChartData = chartData[selectedPeriod] || [];

  const maxValue = Math.max(
    ...currentChartData.map((i: any) => i.value),
    1
  );

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
            <Typo
              size={24}
              fontWeight="700"
              color={colors.textPrimary}
              style={styles.pageTitle}
            >
              Data Synchronization
            </Typo>

            {/* Consumption Card */}
            <View style={styles.consumptionCard}>
              <View style={styles.cardHeader}>
                <View>
                  <View style={styles.valueRow}>
                    <Typo size={20} fontWeight="700" color="#000">
                      Solar Active 
                    </Typo>
                  </View>

                  <Typo size={14} color="#555">
                    Report on your power consumption
                  </Typo>
                </View>

                {/* Period selector */}
                <View>
                  <Pressable
                    style={styles.periodSelector}
                    onPress={() => setShowDropdown(true)}
                  >
                    <Typo size={14} fontWeight="600" color="#fff">
                      {selectedPeriod}
                    </Typo>
                    <Icon.CaretDown size={16} color="#fff" />
                  </Pressable>

                  <Modal
                    visible={showDropdown}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowDropdown(false)}
                  >
                    <TouchableOpacity
                      style={styles.modalOverlay}
                      activeOpacity={1}
                      onPress={() => setShowDropdown(false)}
                    >
                      <View style={styles.dropdownMenu}>
                        {periods.map((period) => (
                          <TouchableOpacity
                            key={period}
                            style={[
                              styles.dropdownItem,
                              selectedPeriod === period &&
                                styles.activeDropdownItem,
                            ]}
                            onPress={() => {
                              setSelectedPeriod(period);
                              setShowDropdown(false);
                            }}
                          >
                            <Typo
                              size={14}
                              fontWeight={
                                selectedPeriod === period ? "700" : "400"
                              }
                              color={
                                selectedPeriod === period
                                  ? colors.primary
                                  : "#fff"
                              }
                            >
                              {period}
                            </Typo>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </TouchableOpacity>
                  </Modal>
                </View>
              </View>

              {/* Chart */}
              <View style={styles.chartContainer}>
                {currentChartData.map((item: any, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.barColumn,
                      { width: `${100 / currentChartData.length}%` },
                    ]}
                  >
                    <View style={styles.barBackground}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${(item.value / maxValue) * 100}%`,
                          },
                        ]}
                      />
                    </View>

                    <Typo size={8} color="#000" style={styles.monthLabel}>
                      {item.label}
                    </Typo>
                  </View>
                ))}
              </View>
            </View>

            {/* History */}
            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <Typo size={24} fontWeight="700" color={colors.textPrimary}>
                  History
                </Typo>

                <Typo size={12} color={colors.textSecondary}>
                  {latestSyncedAt
                    ? `Last sync: ${latestSyncedAt}`
                    : "Waiting for sync"}
                </Typo>
              </View>

              <View style={styles.historyList}>
                {historyCards.map((card) => {
                  const SensorIcon = (Icon as any)[card.icon];

                  return (
                    <View key={card.id} style={styles.historyCard}>
                      <View style={styles.historyCardTop}>
                        <View style={styles.iconContainer}>
                          {SensorIcon && (
                            <SensorIcon size={20} color={colors.textPrimary} />
                          )}
                        </View>
                        <Typo size={12} color={colors.textSecondary}>
                          {card.label}
                        </Typo>
                      </View>

                      <Typo size={24} fontWeight="700" color={colors.textPrimary}>
                        {card.value}
                      </Typo>
                    </View>
                  );
                })}
                {historyCards.length === 0 && (
                  <Typo size={14} color={colors.textSecondary}>
                    No synced sensor values found.
                  </Typo>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default DataManagement;

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

  main: {
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._20,
    gap: spacingY._25,
  },

  pageTitle: { marginBottom: spacingY._5 },

  consumptionCard: {
    backgroundColor: "#A2D98F",
    borderRadius: 30,
    padding: spacingX._20,
    minHeight: 350,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacingY._30,
  },

  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },

  periodSelector: {
    backgroundColor: "#000",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._7,
    borderRadius: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  dropdownMenu: {
    backgroundColor: "#14303D",
    borderRadius: 15,
    padding: spacingY._10,
    width: 150,
  },

  dropdownItem: {
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._15,
  },

  activeDropdownItem: {
    backgroundColor: "rgba(50,205,50,0.1)",
  },

  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 180,
    marginTop: "auto",
  },

  barColumn: {
    alignItems: "center",
  },

  barBackground: {
    width: 12,
    height: 150,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 10,
    justifyContent: "flex-end",
    overflow: "hidden",
  },

  barFill: {
    width: "100%",
    backgroundColor: "#32CD32",
    borderRadius: 10,
  },

  monthLabel: {
    marginTop: spacingY._10,
  },

  historySection: { gap: spacingY._20 },

  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  historyList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingY._12,
  },

  historyCard: {
    width: "48%",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: spacingX._12,
    minHeight: 110,
    justifyContent: "space-between",
  },

  historyCardTop: {
    gap: spacingY._7,
  },

  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});
