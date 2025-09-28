import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Shield,
  Smartphone,
  Check,
  X,
  RefreshCw,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SMSReader() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [hasPermission, setHasPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [recentMessages, setRecentMessages] = useState([]);
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);

  // Mutation to process messages
  const processMessageMutation = useMutation({
    mutationFn: async (message) => {
      const response = await fetch("/api/parse-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.body }),
      });
      if (!response.ok) {
        throw new Error("Failed to parse message");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });

      // Update the message status
      setRecentMessages((prev) =>
        prev.map((msg) =>
          msg.id === variables.id
            ? { ...msg, processed: true, transaction: data.transaction }
            : msg,
        ),
      );
    },
    onError: (error, variables) => {
      // Mark message as failed
      setRecentMessages((prev) =>
        prev.map((msg) =>
          msg.id === variables.id
            ? { ...msg, processed: false, error: error.message }
            : msg,
        ),
      );
    },
  });

  useEffect(() => {
    checkPermission();
    loadAutoScanPreference();
  }, []);

  const checkPermission = async () => {
    if (Platform.OS !== "android") {
      return;
    }

    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
      );
      setHasPermission(granted);
    } catch (error) {
      console.error("Error checking SMS permission:", error);
    }
  };

  const loadAutoScanPreference = async () => {
    try {
      const enabled = await AsyncStorage.getItem("autoScanEnabled");
      setAutoScanEnabled(enabled === "true");
    } catch (error) {
      console.error("Error loading auto scan preference:", error);
    }
  };

  const requestSMSPermission = async () => {
    if (Platform.OS !== "android") {
      Alert.alert(
        "Not Supported",
        "SMS reading is only supported on Android devices.",
      );
      return false;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: "SMS Reading Permission",
          message:
            "This app needs access to read SMS messages to automatically track your bank transactions. Your privacy is protected - only bank and UPI messages are processed.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "Grant Permission",
        },
      );

      const hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
      setHasPermission(hasPermission);

      if (hasPermission) {
        Alert.alert(
          "Success",
          "Permission granted! You can now scan for bank messages.",
        );
      } else {
        Alert.alert(
          "Permission Denied",
          "Without SMS permission, you'll need to manually add transactions.",
        );
      }

      return hasPermission;
    } catch (err) {
      console.warn("SMS permission error:", err);
      Alert.alert("Error", "Failed to request SMS permission.");
      return false;
    }
  };

  const scanForBankMessages = async () => {
    if (!hasPermission) {
      const granted = await requestSMSPermission();
      if (!granted) return;
    }

    setIsScanning(true);

    try {
      // Simulate SMS reading - in a real app, you'd use a native module
      // For demo purposes, we'll show some sample bank messages
      const sampleMessages = [
        {
          id: "1",
          body: "Dear Customer, Rs.500.00 debited from your account XXXXXXX1234 at STARBUCKS on 28-Sep-25. Available balance: Rs.4,500.00",
          address: "HDFC-BANK",
          date: new Date(Date.now() - 3600000).toISOString(),
          processed: false,
        },
        {
          id: "2",
          body: "UPI transaction successful. Rs.1200.00 credited to your account from John Doe via GooglePay. Balance: Rs.5,700.00",
          address: "UPI-BANK",
          date: new Date(Date.now() - 7200000).toISOString(),
          processed: false,
        },
        {
          id: "3",
          body: "Payment of Rs.250.00 made via UPI to Zomato. Transaction ID: 123456789. Available balance: Rs.5,450.00",
          address: "AXIS-BANK",
          date: new Date(Date.now() - 10800000).toISOString(),
          processed: false,
        },
      ];

      // Filter for bank messages only
      const bankMessages = sampleMessages.filter((msg) =>
        isBankMessage(msg.body),
      );

      setRecentMessages(bankMessages);

      if (autoScanEnabled) {
        // Auto-process all detected messages
        bankMessages.forEach((message) => {
          processMessageMutation.mutate(message);
        });
      }

      Alert.alert(
        "Scan Complete",
        `Found ${bankMessages.length} bank transaction messages.${autoScanEnabled ? " Auto-processing enabled messages..." : " Tap messages to add them as transactions."}`,
      );
    } catch (error) {
      console.error("Error scanning messages:", error);
      Alert.alert("Error", "Failed to scan SMS messages.");
    } finally {
      setIsScanning(false);
    }
  };

  const isBankMessage = (messageBody) => {
    const lowerBody = messageBody.toLowerCase();
    const bankKeywords = [
      "debited",
      "credited",
      "upi",
      "bank",
      "account",
      "balance",
      "payment",
      "transaction",
    ];
    const hasCurrency = /(?:rs\.?|inr|₹)\s*\d+/i.test(messageBody);
    const hasKeywords = bankKeywords.some((keyword) =>
      lowerBody.includes(keyword),
    );

    return hasKeywords && hasCurrency;
  };

  const toggleAutoScan = async () => {
    const newValue = !autoScanEnabled;
    setAutoScanEnabled(newValue);

    try {
      await AsyncStorage.setItem("autoScanEnabled", newValue.toString());
      Alert.alert(
        "Auto Scan Updated",
        newValue
          ? "Auto scan enabled. New bank messages will be automatically processed."
          : "Auto scan disabled. You'll need to manually process messages.",
      );
    } catch (error) {
      console.error("Error saving auto scan preference:", error);
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <Text
          style={{ fontSize: 14, fontWeight: "600", color: "#3B82F6", flex: 1 }}
        >
          {item.address}
        </Text>
        <Text style={{ fontSize: 12, color: "#6B7280" }}>
          {new Date(item.date).toLocaleTimeString()}
        </Text>
      </View>

      <Text
        style={{
          fontSize: 14,
          color: "#1F2937",
          lineHeight: 20,
          marginBottom: 12,
        }}
      >
        {item.body}
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {item.processed === true ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Check size={16} color="#10B981" />
            <Text style={{ color: "#10B981", fontSize: 12, marginLeft: 4 }}>
              Transaction Added
            </Text>
          </View>
        ) : item.processed === false && item.error ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <X size={16} color="#EF4444" />
            <Text style={{ color: "#EF4444", fontSize: 12, marginLeft: 4 }}>
              Failed to Process
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => processMessageMutation.mutate(item)}
            disabled={processMessageMutation.isLoading}
            style={{
              backgroundColor: "#3B82F6",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <MessageSquare size={14} color="white" />
            <Text
              style={{
                color: "white",
                fontSize: 12,
                fontWeight: "600",
                marginLeft: 4,
              }}
            >
              {processMessageMutation.isLoading
                ? "Processing..."
                : "Add Transaction"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: insets.top }}
    >
      {/* Header */}
      <View style={{ padding: 20, paddingBottom: 10 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1F2937" }}>
          SMS Auto-Sync
        </Text>
        <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
          Automatically read and process bank transaction messages
        </Text>
      </View>

      {/* Permission Status */}
      <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
        <View
          style={{
            backgroundColor: hasPermission ? "#F0FDF4" : "#FEF2F2",
            borderRadius: 12,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Shield size={20} color={hasPermission ? "#10B981" : "#EF4444"} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: hasPermission ? "#065F46" : "#991B1B",
              }}
            >
              SMS Permission {hasPermission ? "Granted" : "Required"}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: hasPermission ? "#059669" : "#DC2626",
                marginTop: 2,
              }}
            >
              {hasPermission
                ? "App can read SMS messages for bank transactions"
                : "Grant permission to enable automatic transaction detection"}
            </Text>
          </View>
        </View>
      </View>

      {/* Controls */}
      <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={hasPermission ? scanForBankMessages : requestSMSPermission}
            disabled={isScanning}
            style={{
              flex: 1,
              backgroundColor: "#3B82F6",
              paddingVertical: 14,
              borderRadius: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isScanning ? (
              <RefreshCw size={18} color="white" />
            ) : (
              <Smartphone size={18} color="white" />
            )}
            <Text style={{ color: "white", fontWeight: "600", marginLeft: 8 }}>
              {!hasPermission
                ? "Grant Permission"
                : isScanning
                  ? "Scanning..."
                  : "Scan Messages"}
            </Text>
          </TouchableOpacity>
        </View>

        {hasPermission && (
          <TouchableOpacity
            onPress={toggleAutoScan}
            style={{
              backgroundColor: autoScanEnabled ? "#10B981" : "#6B7280",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>
              Auto-Process: {autoScanEnabled ? "ON" : "OFF"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Recent Messages */}
      {recentMessages.length > 0 && (
        <View style={{ flex: 1, marginHorizontal: 20 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: "#1F2937",
              marginBottom: 16,
            }}
          >
            Detected Bank Messages
          </Text>

          <FlatList
            data={recentMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      )}

      {/* Instructions */}
      {recentMessages.length === 0 && (
        <View
          style={{ marginHorizontal: 20, flex: 1, justifyContent: "center" }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 20,
              alignItems: "center",
            }}
          >
            <MessageSquare size={48} color="#D1D5DB" />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#1F2937",
                marginTop: 16,
                textAlign: "center",
              }}
            >
              No Bank Messages Found
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                textAlign: "center",
                marginTop: 8,
                lineHeight: 20,
              }}
            >
              {!hasPermission
                ? "Grant SMS permission and scan your messages to automatically detect bank transactions."
                : "Scan your messages to find recent bank and UPI transactions that can be automatically added to your expense tracker."}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
