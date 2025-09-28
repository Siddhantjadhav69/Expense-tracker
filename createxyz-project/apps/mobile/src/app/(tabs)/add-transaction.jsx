import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Plus,
  DollarSign,
  Tag,
  Building,
  Smartphone,
} from "lucide-react-native";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import SMSReader from "@/components/SMSReader";

export default function AddTransaction() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [messageText, setMessageText] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualType, setManualType] = useState("debit");
  const [manualDescription, setManualDescription] = useState("");
  const [manualMerchant, setManualMerchant] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [activeTab, setActiveTab] = useState("sms"); // 'sms', 'message' or 'manual'

  // Parse message mutation
  const parseMessageMutation = useMutation({
    mutationFn: async (message) => {
      const response = await fetch("/api/parse-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) {
        throw new Error("Failed to parse message");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      setMessageText("");
      Alert.alert("Success", "Transaction added successfully!");
    },
    onError: (error) => {
      Alert.alert(
        "Error",
        error.message || "Failed to parse transaction message",
      );
    },
  });

  // Manual transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: async (transaction) => {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });
      if (!response.ok) {
        throw new Error("Failed to add transaction");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      setManualAmount("");
      setManualDescription("");
      setManualMerchant("");
      setManualCategory("");
      Alert.alert("Success", "Transaction added successfully!");
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to add transaction");
    },
  });

  const handleParseMessage = useCallback(() => {
    if (!messageText.trim()) {
      Alert.alert("Error", "Please enter a transaction message");
      return;
    }
    parseMessageMutation.mutate(messageText.trim());
  }, [messageText, parseMessageMutation]);

  const handleAddManualTransaction = useCallback(() => {
    if (!manualAmount || !manualType) {
      Alert.alert("Error", "Please fill in amount and transaction type");
      return;
    }

    const transaction = {
      amount: parseFloat(manualAmount),
      transaction_type: manualType,
      description: manualDescription || null,
      merchant: manualMerchant || null,
      category: manualCategory || null,
    };

    addTransactionMutation.mutate(transaction);
  }, [
    manualAmount,
    manualType,
    manualDescription,
    manualMerchant,
    manualCategory,
    addTransactionMutation,
  ]);

  const categories = [
    "Food",
    "Transportation",
    "Entertainment",
    "Shopping",
    "Bills",
    "Healthcare",
    "Income",
    "Other",
  ];

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <View
        style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: insets.top }}
      >
        <StatusBar style="dark" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ padding: 20, paddingBottom: 10 }}>
            <Text
              style={{ fontSize: 28, fontWeight: "bold", color: "#1F2937" }}
            >
              Add Transaction
            </Text>
            <Text style={{ fontSize: 16, color: "#6B7280", marginTop: 4 }}>
              Auto-sync SMS, parse messages, or add manually
            </Text>
          </View>

          {/* Tab Selector */}
          <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "#E5E7EB",
                borderRadius: 12,
                padding: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => setActiveTab("sms")}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor:
                    activeTab === "sms" ? "white" : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontWeight: "600",
                    fontSize: 12,
                    color: activeTab === "sms" ? "#3B82F6" : "#6B7280",
                  }}
                >
                  Auto SMS
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab("message")}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor:
                    activeTab === "message" ? "white" : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontWeight: "600",
                    fontSize: 12,
                    color: activeTab === "message" ? "#3B82F6" : "#6B7280",
                  }}
                >
                  From Message
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab("manual")}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor:
                    activeTab === "manual" ? "white" : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontWeight: "600",
                    fontSize: 12,
                    color: activeTab === "manual" ? "#3B82F6" : "#6B7280",
                  }}
                >
                  Manual Entry
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {activeTab === "sms" ? (
            /* SMS Auto-Sync Section */
            <SMSReader />
          ) : activeTab === "message" ? (
            /* Message Parsing Section */
            <View style={{ marginHorizontal: 20 }}>
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 16,
                  padding: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <MessageSquare size={24} color="#3B82F6" />
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: "#1F2937",
                      marginLeft: 8,
                    }}
                  >
                    Transaction Message
                  </Text>
                </View>

                <Text
                  style={{ fontSize: 14, color: "#6B7280", marginBottom: 12 }}
                >
                  Paste your bank transaction message here. The app will
                  automatically extract the amount, type, and merchant.
                </Text>

                <TextInput
                  value={messageText}
                  onChangeText={setMessageText}
                  placeholder="e.g., 'Debited $25.00 from your account at Starbucks. Available balance: $425.00'"
                  multiline
                  numberOfLines={4}
                  style={{
                    borderWidth: 1,
                    borderColor: "#D1D5DB",
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: "#1F2937",
                    textAlignVertical: "top",
                    minHeight: 100,
                  }}
                />

                <TouchableOpacity
                  onPress={handleParseMessage}
                  disabled={
                    !messageText.trim() || parseMessageMutation.isLoading
                  }
                  style={{
                    backgroundColor:
                      messageText.trim() && !parseMessageMutation.isLoading
                        ? "#3B82F6"
                        : "#D1D5DB",
                    paddingVertical: 16,
                    borderRadius: 12,
                    marginTop: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MessageSquare size={20} color="white" />
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "600",
                      fontSize: 16,
                      marginLeft: 8,
                    }}
                  >
                    {parseMessageMutation.isLoading
                      ? "Parsing..."
                      : "Parse & Add Transaction"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Manual Entry Section */
            <View style={{ marginHorizontal: 20 }}>
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 16,
                  padding: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Plus size={24} color="#3B82F6" />
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: "#1F2937",
                      marginLeft: 8,
                    }}
                  >
                    Manual Entry
                  </Text>
                </View>

                {/* Amount */}
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: 8,
                    }}
                  >
                    Amount *
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <DollarSign size={20} color="#6B7280" />
                    <TextInput
                      value={manualAmount}
                      onChangeText={setManualAmount}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: "#D1D5DB",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 16,
                        color: "#1F2937",
                        marginLeft: 8,
                      }}
                    />
                  </View>
                </View>

                {/* Transaction Type */}
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: 8,
                    }}
                  >
                    Type *
                  </Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => setManualType("debit")}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor:
                          manualType === "debit" ? "#EF4444" : "#D1D5DB",
                        backgroundColor:
                          manualType === "debit" ? "#FEF2F2" : "white",
                      }}
                    >
                      <Text
                        style={{
                          textAlign: "center",
                          fontWeight: "600",
                          color: manualType === "debit" ? "#EF4444" : "#6B7280",
                        }}
                      >
                        Expense
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setManualType("credit")}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor:
                          manualType === "credit" ? "#10B981" : "#D1D5DB",
                        backgroundColor:
                          manualType === "credit" ? "#F0FDF4" : "white",
                      }}
                    >
                      <Text
                        style={{
                          textAlign: "center",
                          fontWeight: "600",
                          color:
                            manualType === "credit" ? "#10B981" : "#6B7280",
                        }}
                      >
                        Income
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Description */}
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: 8,
                    }}
                  >
                    Description
                  </Text>
                  <TextInput
                    value={manualDescription}
                    onChangeText={setManualDescription}
                    placeholder="What was this transaction for?"
                    style={{
                      borderWidth: 1,
                      borderColor: "#D1D5DB",
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                      color: "#1F2937",
                    }}
                  />
                </View>

                {/* Merchant */}
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: 8,
                    }}
                  >
                    Merchant
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Building size={20} color="#6B7280" />
                    <TextInput
                      value={manualMerchant}
                      onChangeText={setManualMerchant}
                      placeholder="Store or company name"
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: "#D1D5DB",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 16,
                        color: "#1F2937",
                        marginLeft: 8,
                      }}
                    />
                  </View>
                </View>

                {/* Category */}
                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: 8,
                    }}
                  >
                    Category
                  </Text>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        onPress={() => setManualCategory(category)}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor:
                            manualCategory === category ? "#3B82F6" : "#D1D5DB",
                          backgroundColor:
                            manualCategory === category ? "#EBF4FF" : "white",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "500",
                            color:
                              manualCategory === category
                                ? "#3B82F6"
                                : "#6B7280",
                          }}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleAddManualTransaction}
                  disabled={
                    !manualAmount ||
                    !manualType ||
                    addTransactionMutation.isLoading
                  }
                  style={{
                    backgroundColor:
                      manualAmount &&
                      manualType &&
                      !addTransactionMutation.isLoading
                        ? "#3B82F6"
                        : "#D1D5DB",
                    paddingVertical: 16,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Plus size={20} color="white" />
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "600",
                      fontSize: 16,
                      marginLeft: 8,
                    }}
                  >
                    {addTransactionMutation.isLoading
                      ? "Adding..."
                      : "Add Transaction"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
