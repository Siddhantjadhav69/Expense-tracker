import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, DollarSign, AlertTriangle, Save } from 'lucide-react-native';
import KeyboardAvoidingAnimatedView from '@/components/KeyboardAvoidingAnimatedView';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');

  // Fetch current settings
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const response = await fetch('/api/analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setLowBalanceThreshold(data.lowBalanceThreshold?.toString() || '');
      setMonthlyBudget(data.monthlyBudget?.toString() || '');
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      Alert.alert('Success', 'Settings updated successfully!');
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to update settings');
    },
  });

  const handleSaveSettings = useCallback(() => {
    const threshold = parseFloat(lowBalanceThreshold);
    const budget = parseFloat(monthlyBudget);

    if (isNaN(threshold) || threshold < 0) {
      Alert.alert('Error', 'Please enter a valid low balance threshold');
      return;
    }

    if (isNaN(budget) || budget < 0) {
      Alert.alert('Error', 'Please enter a valid monthly budget');
      return;
    }

    updateSettingsMutation.mutate({
      low_balance_threshold: threshold,
      monthly_budget: budget
    });
  }, [lowBalanceThreshold, monthlyBudget, updateSettingsMutation]);

  // Initialize form values when data loads
  React.useEffect(() => {
    if (analytics && !lowBalanceThreshold && !monthlyBudget) {
      setLowBalanceThreshold(analytics.lowBalanceThreshold?.toString() || '100');
      setMonthlyBudget(analytics.monthlyBudget?.toString() || '1000');
    }
  }, [analytics, lowBalanceThreshold, monthlyBudget]);

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', paddingTop: insets.top }}>
        <StatusBar style="dark" />
        
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ padding: 20, paddingBottom: 10 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1F2937' }}>
              Settings
            </Text>
            <Text style={{ fontSize: 16, color: '#6B7280', marginTop: 4 }}>
              Configure your spending preferences
            </Text>
          </View>

          {/* Settings Form */}
          <View style={{ marginHorizontal: 20 }}>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <SettingsIcon size={24} color="#3B82F6" />
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937', marginLeft: 8 }}>
                  Budget & Alerts
                </Text>
              </View>

              {/* Low Balance Threshold */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  Low Balance Alert Threshold
                </Text>
                <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>
                  Get notified when your balance falls below this amount
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <DollarSign size={20} color="#6B7280" />
                  <TextInput
                    value={lowBalanceThreshold}
                    onChangeText={setLowBalanceThreshold}
                    placeholder="100.00"
                    keyboardType="decimal-pad"
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                      color: '#1F2937',
                      marginLeft: 8
                    }}
                  />
                </View>
              </View>

              {/* Monthly Budget */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  Monthly Budget
                </Text>
                <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>
                  Set your monthly spending limit to track budget progress
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <DollarSign size={20} color="#6B7280" />
                  <TextInput
                    value={monthlyBudget}
                    onChangeText={setMonthlyBudget}
                    placeholder="1000.00"
                    keyboardType="decimal-pad"
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                      color: '#1F2937',
                      marginLeft: 8
                    }}
                  />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSaveSettings}
                disabled={updateSettingsMutation.isLoading}
                style={{
                  backgroundColor: updateSettingsMutation.isLoading ? '#D1D5DB' : '#3B82F6',
                  paddingVertical: 16,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Save size={20} color="white" />
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 16, marginLeft: 8 }}>
                  {updateSettingsMutation.isLoading ? 'Saving...' : 'Save Settings'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Current Status */}
          {analytics && (
            <View style={{ marginHorizontal: 20, marginTop: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
                Current Status
              </Text>
              
              <View style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2
              }}>
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                    Current Balance
                  </Text>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937' }}>
                    ${parseFloat(analytics.currentBalance || 0).toFixed(2)}
                  </Text>
                </View>

                {analytics.isLowBalance && (
                  <View style={{
                    backgroundColor: '#FEF2F2',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}>
                    <AlertTriangle size={16} color="#EF4444" />
                    <Text style={{ color: '#DC2626', fontWeight: '600', marginLeft: 8, flex: 1 }}>
                      Your balance is below the alert threshold
                    </Text>
                  </View>
                )}

                {analytics.isOverBudget && (
                  <View style={{
                    backgroundColor: '#FEF2F2',
                    borderRadius: 8,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}>
                    <AlertTriangle size={16} color="#EF4444" />
                    <Text style={{ color: '#DC2626', fontWeight: '600', marginLeft: 8, flex: 1 }}>
                      You're over your monthly budget
                    </Text>
                  </View>
                )}

                {!analytics.isLowBalance && !analytics.isOverBudget && (
                  <View style={{
                    backgroundColor: '#F0FDF4',
                    borderRadius: 8,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}>
                    <Text style={{ color: '#059669', fontWeight: '600', flex: 1 }}>
                      ✓ Everything looks good!
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Instructions */}
          <View style={{ marginHorizontal: 20, marginTop: 20 }}>
            <View style={{
              backgroundColor: '#EBF4FF',
              borderRadius: 12,
              padding: 16
            }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1E40AF', marginBottom: 8 }}>
                How to use this app:
              </Text>
              <Text style={{ fontSize: 14, color: '#1E40AF', lineHeight: 20 }}>
                1. Copy transaction messages from your bank and paste them in the "Add Transaction" tab{'\n'}
                2. The app will automatically parse the amount, type, and merchant{'\n'}
                3. View your spending analytics and get alerts when you're low on balance or over budget{'\n'}
                4. Adjust your settings here to customize alerts and budget limits
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}