import { Platform, PermissionsAndroid, DeviceEventEmitter } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

class SMSMonitor {
  constructor() {
    this.isMonitoring = false;
    this.listeners = [];
    this.bankKeywords = [
      "debited",
      "credited",
      "upi",
      "bank",
      "account",
      "balance",
      "payment",
      "transaction",
      "spent",
      "received",
      "transfer",
      "withdraw",
      "deposit",
    ];
  }

  async requestSMSPermission() {
    if (Platform.OS !== "android") {
      console.log("SMS reading is only supported on Android");
      return false;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: "SMS Reading Permission",
          message:
            "This app needs access to read SMS messages to automatically track your bank transactions.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        },
      );

      const receiveGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        {
          title: "SMS Receiving Permission",
          message:
            "This app needs access to receive SMS messages to automatically track new transactions.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        },
      );

      return (
        granted === PermissionsAndroid.RESULTS.GRANTED &&
        receiveGranted === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.warn("SMS permission error:", err);
      return false;
    }
  }

  async startMonitoring() {
    if (this.isMonitoring) return;

    const hasPermission = await this.requestSMSPermission();
    if (!hasPermission) {
      throw new Error("SMS permissions not granted");
    }

    this.isMonitoring = true;
    await AsyncStorage.setItem("smsMonitoringEnabled", "true");

    // Start monitoring incoming SMS
    this.startIncomingSMSListener();

    // Scan existing SMS messages for recent transactions
    await this.scanExistingSMS();

    console.log("SMS monitoring started");
  }

  async stopMonitoring() {
    this.isMonitoring = false;
    await AsyncStorage.setItem("smsMonitoringEnabled", "false");

    // Remove all listeners
    this.listeners.forEach((listener) => {
      if (listener && listener.remove) {
        listener.remove();
      }
    });
    this.listeners = [];

    console.log("SMS monitoring stopped");
  }

  startIncomingSMSListener() {
    // Listen for incoming SMS messages
    const listener = DeviceEventEmitter.addListener(
      "onSMSReceived",
      (message) => {
        this.processSMSMessage(message);
      },
    );

    this.listeners.push(listener);
  }

  async scanExistingSMS() {
    if (Platform.OS !== "android") return;

    try {
      // Get SMS from the last 7 days
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      // This would require a native module to read SMS
      // For now, we'll simulate this functionality
      console.log("Scanning existing SMS messages for transactions...");

      // In a real implementation, you would use react-native-get-sms-android
      // or a similar library to read SMS messages
    } catch (error) {
      console.error("Error scanning existing SMS:", error);
    }
  }

  async processSMSMessage(message) {
    try {
      const { body, address, date } = message;

      // Check if this looks like a bank/UPI message
      if (!this.isBankMessage(body)) {
        return;
      }

      console.log("Processing bank SMS:", body);

      // Send to parsing API
      const response = await fetch("/api/parse-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: body,
          sender: address,
          timestamp: date,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Transaction parsed and saved:", result);

        // Trigger a notification or update the UI
        this.notifyTransactionAdded(result.transaction);
      } else {
        console.warn("Failed to parse SMS message");
      }
    } catch (error) {
      console.error("Error processing SMS message:", error);
    }
  }

  isBankMessage(messageBody) {
    const lowerBody = messageBody.toLowerCase();

    // Check for bank keywords
    const hasKeywords = this.bankKeywords.some((keyword) =>
      lowerBody.includes(keyword),
    );

    // Check for currency patterns
    const hasCurrency = /(?:rs\.?|inr|₹)\s*\d+/i.test(messageBody);

    // Check for common bank sender patterns
    const hasBankIndicators = /(?:bank|upi|paytm|gpay|phonepe|bhim)/i.test(
      lowerBody,
    );

    return hasKeywords && hasCurrency && hasBankIndicators;
  }

  notifyTransactionAdded(transaction) {
    // Emit event for UI components to listen to
    DeviceEventEmitter.emit("transactionAdded", transaction);

    // You could also show a local notification here
    console.log(
      `New transaction detected: ${transaction.transaction_type} of ₹${transaction.amount}`,
    );
  }

  async isMonitoringEnabled() {
    const enabled = await AsyncStorage.getItem("smsMonitoringEnabled");
    return enabled === "true";
  }

  // Method to manually process a specific SMS message
  async processManualSMS(messageBody) {
    if (this.isBankMessage(messageBody)) {
      await this.processSMSMessage({
        body: messageBody,
        address: "manual",
        date: Date.now(),
      });
    } else {
      throw new Error("This does not appear to be a bank transaction message");
    }
  }
}

export default new SMSMonitor();
